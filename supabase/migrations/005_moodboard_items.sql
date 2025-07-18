-- Moodboard Items Migration
-- This creates tables to support visual moodboards and collaborative inspiration boards

-- Create moodboards table
create table if not exists public.moodboards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete set null,
  title text not null,
  description text,
  cover_url text,
  background_color text default '#ffffff',
  layout_type text default 'grid' check (layout_type in ('grid', 'freeform', 'masonry')),
  is_public boolean default false,
  is_template boolean default false,
  tags text[] default array[]::text[],
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create moodboard_items table for individual items on moodboards
create table if not exists public.moodboard_items (
  id uuid default uuid_generate_v4() primary key,
  moodboard_id uuid references public.moodboards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  media_file_id uuid references public.media_files(id) on delete set null,
  item_type text not null check (item_type in ('image', 'video', 'audio', 'text', 'link', 'color', 'shape')),
  title text,
  content text,
  url text,
  color_value text,
  position_x integer default 0,
  position_y integer default 0,
  width integer default 200,
  height integer default 200,
  rotation real default 0,
  opacity real default 1.0 check (opacity >= 0 and opacity <= 1),
  z_index integer default 1,
  style_properties jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create moodboard_collaborators table for shared moodboards
create table if not exists public.moodboard_collaborators (
  id uuid default uuid_generate_v4() primary key,
  moodboard_id uuid references public.moodboards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  permission text default 'view' check (permission in ('view', 'edit', 'admin')),
  created_at timestamptz default now(),
  unique(moodboard_id, user_id)
);

-- Create moodboard_comments table for feedback and discussion
create table if not exists public.moodboard_comments (
  id uuid default uuid_generate_v4() primary key,
  moodboard_id uuid references public.moodboards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references public.moodboard_items(id) on delete cascade,
  content text not null,
  position_x integer,
  position_y integer,
  parent_comment_id uuid references public.moodboard_comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create moodboard_versions table for version history
create table if not exists public.moodboard_versions (
  id uuid default uuid_generate_v4() primary key,
  moodboard_id uuid references public.moodboards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  version_number integer not null,
  title text,
  description text,
  snapshot_data jsonb not null,
  created_at timestamptz default now(),
  unique(moodboard_id, version_number)
);

-- Add indexes for performance
create index if not exists moodboards_user_id_idx on public.moodboards(user_id);
create index if not exists moodboards_artist_id_idx on public.moodboards(artist_id);
create index if not exists moodboards_is_public_idx on public.moodboards(is_public);
create index if not exists moodboards_tags_idx on public.moodboards using gin(tags);
create index if not exists moodboards_created_at_idx on public.moodboards(created_at desc);
create index if not exists moodboard_items_moodboard_id_idx on public.moodboard_items(moodboard_id);
create index if not exists moodboard_items_user_id_idx on public.moodboard_items(user_id);
create index if not exists moodboard_items_type_idx on public.moodboard_items(item_type);
create index if not exists moodboard_items_position_idx on public.moodboard_items(position_x, position_y);
create index if not exists moodboard_items_z_index_idx on public.moodboard_items(z_index);
create index if not exists moodboard_collaborators_moodboard_id_idx on public.moodboard_collaborators(moodboard_id);
create index if not exists moodboard_collaborators_user_id_idx on public.moodboard_collaborators(user_id);
create index if not exists moodboard_comments_moodboard_id_idx on public.moodboard_comments(moodboard_id);
create index if not exists moodboard_comments_item_id_idx on public.moodboard_comments(item_id);
create index if not exists moodboard_comments_user_id_idx on public.moodboard_comments(user_id);
create index if not exists moodboard_versions_moodboard_id_idx on public.moodboard_versions(moodboard_id);

-- Add updated_at triggers
create trigger moodboards_updated_at
  before update on public.moodboards
  for each row execute function public.handle_updated_at();

create trigger moodboard_items_updated_at
  before update on public.moodboard_items
  for each row execute function public.handle_updated_at();

create trigger moodboard_comments_updated_at
  before update on public.moodboard_comments
  for each row execute function public.handle_updated_at();

-- Function to create moodboard version on significant changes
create or replace function public.create_moodboard_version()
returns trigger
language plpgsql
as $$
declare
  next_version integer;
  snapshot jsonb;
begin
  -- Get next version number
  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.moodboard_versions
  where moodboard_id = new.id;

  -- Create snapshot of current state
  select jsonb_build_object(
    'title', new.title,
    'description', new.description,
    'background_color', new.background_color,
    'layout_type', new.layout_type,
    'items', (
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item_type', item_type,
          'title', title,
          'content', content,
          'url', url,
          'color_value', color_value,
          'position_x', position_x,
          'position_y', position_y,
          'width', width,
          'height', height,
          'rotation', rotation,
          'opacity', opacity,
          'z_index', z_index,
          'style_properties', style_properties,
          'metadata', metadata
        )
      )
      from public.moodboard_items
      where moodboard_id = new.id
    )
  ) into snapshot;

  -- Insert version record
  insert into public.moodboard_versions (
    moodboard_id,
    user_id,
    version_number,
    title,
    description,
    snapshot_data
  ) values (
    new.id,
    auth.uid(),
    next_version,
    'Auto-save version ' || next_version,
    'Automatically created version',
    snapshot
  );

  return new;
end;
$$;

-- Trigger to create versions (only on significant updates, not every change)
-- create trigger moodboard_version_trigger
--   after update on public.moodboards
--   for each row
--   when (old.title != new.title or old.description != new.description)
--   execute function public.create_moodboard_version();

-- Enable RLS
alter table public.moodboards enable row level security;
alter table public.moodboard_items enable row level security;
alter table public.moodboard_collaborators enable row level security;
alter table public.moodboard_comments enable row level security;
alter table public.moodboard_versions enable row level security;

-- RLS policies for moodboards
create policy "Users can view own moodboards" on public.moodboards
  for select using (auth.uid() = user_id);

create policy "Users can view public moodboards" on public.moodboards
  for select using (is_public = true);

create policy "Users can view collaborated moodboards" on public.moodboards
  for select using (
    exists (
      select 1 from public.moodboard_collaborators mc 
      where mc.moodboard_id = id and mc.user_id = auth.uid()
    )
  );

create policy "Users can insert own moodboards" on public.moodboards
  for insert with check (auth.uid() = user_id);

create policy "Users can update own moodboards" on public.moodboards
  for update using (auth.uid() = user_id);

create policy "Collaborators can update moodboards with edit permission" on public.moodboards
  for update using (
    exists (
      select 1 from public.moodboard_collaborators mc 
      where mc.moodboard_id = id and mc.user_id = auth.uid() and mc.permission in ('edit', 'admin')
    )
  );

create policy "Users can delete own moodboards" on public.moodboards
  for delete using (auth.uid() = user_id);

-- RLS policies for moodboard_items
create policy "Users can view items of accessible moodboards" on public.moodboard_items
  for select using (
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        m.is_public = true or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can add items to accessible moodboards" on public.moodboard_items
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid() and mc.permission in ('edit', 'admin')
        )
      )
    )
  );

create policy "Users can update own items" on public.moodboard_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own items" on public.moodboard_items
  for delete using (auth.uid() = user_id);

-- RLS policies for moodboard_collaborators
create policy "Moodboard owners can manage collaborators" on public.moodboard_collaborators
  for all using (
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and m.user_id = auth.uid()
    )
  );

create policy "Users can view collaborators of accessible moodboards" on public.moodboard_collaborators
  for select using (
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for moodboard_comments
create policy "Users can view comments of accessible moodboards" on public.moodboard_comments
  for select using (
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        m.is_public = true or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can create comments on accessible moodboards" on public.moodboard_comments
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can update own comments" on public.moodboard_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete own comments" on public.moodboard_comments
  for delete using (auth.uid() = user_id);

-- RLS policies for moodboard_versions
create policy "Users can view versions of accessible moodboards" on public.moodboard_versions
  for select using (
    exists (
      select 1 from public.moodboards m 
      where m.id = moodboard_id and (
        m.user_id = auth.uid() or
        exists (
          select 1 from public.moodboard_collaborators mc 
          where mc.moodboard_id = m.id and mc.user_id = auth.uid()
        )
      )
    )
  );

create policy "System can create versions" on public.moodboard_versions
  for insert with check (true);