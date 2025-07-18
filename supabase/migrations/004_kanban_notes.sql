-- Kanban Notes Migration
-- This creates tables to support kanban-style notes with categories and workflow management

-- Create note_categories table for organizing notes
create table if not exists public.note_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  icon text,
  description text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- Create kanban_notes table
create table if not exists public.kanban_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.note_categories(id) on delete set null,
  artist_id uuid references public.artists(id) on delete set null,
  title text not null,
  content text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done', 'archived')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  note_type text default 'task' check (note_type in ('task', 'idea', 'reminder', 'reference', 'meeting')),
  tags text[] default array[]::text[],
  due_date timestamptz,
  completed_at timestamptz,
  sort_order integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create note_attachments table for file attachments
create table if not exists public.note_attachments (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.kanban_notes(id) on delete cascade not null,
  media_file_id uuid references public.media_files(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now()
);

-- Create note_comments table for collaboration
create table if not exists public.note_comments (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.kanban_notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  parent_comment_id uuid references public.note_comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create note_collaborators table for shared notes
create table if not exists public.note_collaborators (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.kanban_notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  permission text default 'read' check (permission in ('read', 'write', 'admin')),
  created_at timestamptz default now(),
  unique(note_id, user_id)
);

-- Add indexes for performance
create index if not exists note_categories_user_id_idx on public.note_categories(user_id);
create index if not exists note_categories_sort_order_idx on public.note_categories(sort_order);
create index if not exists kanban_notes_user_id_idx on public.kanban_notes(user_id);
create index if not exists kanban_notes_category_id_idx on public.kanban_notes(category_id);
create index if not exists kanban_notes_artist_id_idx on public.kanban_notes(artist_id);
create index if not exists kanban_notes_status_idx on public.kanban_notes(status);
create index if not exists kanban_notes_priority_idx on public.kanban_notes(priority);
create index if not exists kanban_notes_type_idx on public.kanban_notes(note_type);
create index if not exists kanban_notes_tags_idx on public.kanban_notes using gin(tags);
create index if not exists kanban_notes_due_date_idx on public.kanban_notes(due_date);
create index if not exists kanban_notes_sort_order_idx on public.kanban_notes(sort_order);
create index if not exists note_attachments_note_id_idx on public.note_attachments(note_id);
create index if not exists note_comments_note_id_idx on public.note_comments(note_id);
create index if not exists note_comments_user_id_idx on public.note_comments(user_id);
create index if not exists note_collaborators_note_id_idx on public.note_collaborators(note_id);
create index if not exists note_collaborators_user_id_idx on public.note_collaborators(user_id);

-- Add updated_at triggers
create trigger note_categories_updated_at
  before update on public.note_categories
  for each row execute function public.handle_updated_at();

create trigger kanban_notes_updated_at
  before update on public.kanban_notes
  for each row execute function public.handle_updated_at();

create trigger note_comments_updated_at
  before update on public.note_comments
  for each row execute function public.handle_updated_at();

-- Trigger to set completed_at when status changes to done
create or replace function public.handle_note_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and old.status != 'done' then
    new.completed_at = now();
  elsif new.status != 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger kanban_notes_completion
  before update on public.kanban_notes
  for each row execute function public.handle_note_completion();

-- Enable RLS
alter table public.note_categories enable row level security;
alter table public.kanban_notes enable row level security;
alter table public.note_attachments enable row level security;
alter table public.note_comments enable row level security;
alter table public.note_collaborators enable row level security;

-- RLS policies for note_categories
create policy "Users can manage own note categories" on public.note_categories
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policies for kanban_notes
create policy "Users can view own notes" on public.kanban_notes
  for select using (auth.uid() = user_id);

create policy "Users can view collaborated notes" on public.kanban_notes
  for select using (
    exists (
      select 1 from public.note_collaborators nc 
      where nc.note_id = id and nc.user_id = auth.uid()
    )
  );

create policy "Users can insert own notes" on public.kanban_notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own notes" on public.kanban_notes
  for update using (auth.uid() = user_id);

create policy "Collaborators can update notes with write permission" on public.kanban_notes
  for update using (
    exists (
      select 1 from public.note_collaborators nc 
      where nc.note_id = id and nc.user_id = auth.uid() and nc.permission in ('write', 'admin')
    )
  );

create policy "Users can delete own notes" on public.kanban_notes
  for delete using (auth.uid() = user_id);

-- RLS policies for note_attachments
create policy "Users can view attachments of accessible notes" on public.note_attachments
  for select using (
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and (
        kn.user_id = auth.uid() or
        exists (
          select 1 from public.note_collaborators nc 
          where nc.note_id = kn.id and nc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage attachments of own notes" on public.note_attachments
  for all using (
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and kn.user_id = auth.uid()
    )
  );

-- RLS policies for note_comments
create policy "Users can view comments of accessible notes" on public.note_comments
  for select using (
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and (
        kn.user_id = auth.uid() or
        exists (
          select 1 from public.note_collaborators nc 
          where nc.note_id = kn.id and nc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can create comments on accessible notes" on public.note_comments
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and (
        kn.user_id = auth.uid() or
        exists (
          select 1 from public.note_collaborators nc 
          where nc.note_id = kn.id and nc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can update own comments" on public.note_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on public.note_comments
  for delete using (auth.uid() = user_id);

-- RLS policies for note_collaborators
create policy "Note owners can manage collaborators" on public.note_collaborators
  for all using (
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and kn.user_id = auth.uid()
    )
  );

create policy "Users can view collaborators of accessible notes" on public.note_collaborators
  for select using (
    exists (
      select 1 from public.kanban_notes kn 
      where kn.id = note_id and (
        kn.user_id = auth.uid() or
        exists (
          select 1 from public.note_collaborators nc 
          where nc.note_id = kn.id and nc.user_id = auth.uid()
        )
      )
    )
  );