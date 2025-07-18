-- Timeline Events Migration
-- This creates tables to support timeline events for career milestones and project tracking

-- Create timeline_events table
create table if not exists public.timeline_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete set null,
  title text not null,
  description text,
  event_type text not null check (event_type in ('release', 'performance', 'milestone', 'collaboration', 'award', 'media', 'personal', 'business')),
  event_date timestamptz not null,
  end_date timestamptz, -- for events that span multiple days
  location text,
  venue text,
  url text,
  image_url text,
  significance text default 'medium' check (significance in ('low', 'medium', 'high', 'major')),
  is_public boolean default false,
  is_featured boolean default false,
  tags text[] default array[]::text[],
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create timeline_event_media table for attaching media files to events
create table if not exists public.timeline_event_media (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.timeline_events(id) on delete cascade not null,
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  caption text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique(event_id, media_file_id)
);

-- Create timeline_event_participants table for tracking who was involved
create table if not exists public.timeline_event_participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.timeline_events(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete cascade,
  name text,
  role text default 'participant' check (role in ('participant', 'organizer', 'performer', 'collaborator', 'producer', 'manager')),
  description text,
  created_at timestamptz default now(),
  constraint participant_info_check check (artist_id is not null or name is not null)
);

-- Create timeline_event_achievements table for awards, certifications, etc.
create table if not exists public.timeline_event_achievements (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.timeline_events(id) on delete cascade not null,
  achievement_type text not null check (achievement_type in ('award', 'certification', 'chart_position', 'sales_milestone', 'streaming_milestone', 'recognition')),
  title text not null,
  organization text,
  position_rank integer,
  value_amount bigint, -- for sales/streaming numbers
  value_unit text, -- 'plays', 'sales', 'dollars', etc.
  certificate_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Create timeline_event_links table for external links and references
create table if not exists public.timeline_event_links (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.timeline_events(id) on delete cascade not null,
  link_type text not null check (link_type in ('article', 'video', 'social', 'streaming', 'purchase', 'official', 'review')),
  title text not null,
  url text not null,
  description text,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists timeline_events_user_id_idx on public.timeline_events(user_id);
create index if not exists timeline_events_artist_id_idx on public.timeline_events(artist_id);
create index if not exists timeline_events_type_idx on public.timeline_events(event_type);
create index if not exists timeline_events_date_idx on public.timeline_events(event_date desc);
create index if not exists timeline_events_significance_idx on public.timeline_events(significance);
create index if not exists timeline_events_public_idx on public.timeline_events(is_public);
create index if not exists timeline_events_featured_idx on public.timeline_events(is_featured);
create index if not exists timeline_events_tags_idx on public.timeline_events using gin(tags);
create index if not exists timeline_event_media_event_id_idx on public.timeline_event_media(event_id);
create index if not exists timeline_event_media_sort_idx on public.timeline_event_media(event_id, sort_order);
create index if not exists timeline_event_participants_event_id_idx on public.timeline_event_participants(event_id);
create index if not exists timeline_event_participants_artist_id_idx on public.timeline_event_participants(artist_id);
create index if not exists timeline_event_achievements_event_id_idx on public.timeline_event_achievements(event_id);
create index if not exists timeline_event_achievements_type_idx on public.timeline_event_achievements(achievement_type);
create index if not exists timeline_event_links_event_id_idx on public.timeline_event_links(event_id);
create index if not exists timeline_event_links_type_idx on public.timeline_event_links(link_type);

-- Add constraint to ensure end_date is after event_date if provided
alter table public.timeline_events 
add constraint timeline_events_date_check 
check (end_date is null or end_date >= event_date);

-- Add updated_at triggers
create trigger timeline_events_updated_at
  before update on public.timeline_events
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.timeline_events enable row level security;
alter table public.timeline_event_media enable row level security;
alter table public.timeline_event_participants enable row level security;
alter table public.timeline_event_achievements enable row level security;
alter table public.timeline_event_links enable row level security;

-- RLS policies for timeline_events
create policy "Users can view own timeline events" on public.timeline_events
  for select using (auth.uid() = user_id);

create policy "Users can view public timeline events" on public.timeline_events
  for select using (is_public = true);

create policy "Users can insert own timeline events" on public.timeline_events
  for insert with check (auth.uid() = user_id);

create policy "Users can update own timeline events" on public.timeline_events
  for update using (auth.uid() = user_id);

create policy "Users can delete own timeline events" on public.timeline_events
  for delete using (auth.uid() = user_id);

-- RLS policies for timeline_event_media
create policy "Users can view media of accessible timeline events" on public.timeline_event_media
  for select using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and (te.user_id = auth.uid() or te.is_public = true)
    )
  );

create policy "Users can manage media of own timeline events" on public.timeline_event_media
  for all using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and te.user_id = auth.uid()
    )
  );

-- RLS policies for timeline_event_participants
create policy "Users can view participants of accessible timeline events" on public.timeline_event_participants
  for select using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and (te.user_id = auth.uid() or te.is_public = true)
    )
  );

create policy "Users can manage participants of own timeline events" on public.timeline_event_participants
  for all using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and te.user_id = auth.uid()
    )
  );

-- RLS policies for timeline_event_achievements
create policy "Users can view achievements of accessible timeline events" on public.timeline_event_achievements
  for select using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and (te.user_id = auth.uid() or te.is_public = true)
    )
  );

create policy "Users can manage achievements of own timeline events" on public.timeline_event_achievements
  for all using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and te.user_id = auth.uid()
    )
  );

-- RLS policies for timeline_event_links
create policy "Users can view links of accessible timeline events" on public.timeline_event_links
  for select using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and (te.user_id = auth.uid() or te.is_public = true)
    )
  );

create policy "Users can manage links of own timeline events" on public.timeline_event_links
  for all using (
    exists (
      select 1 from public.timeline_events te 
      where te.id = event_id and te.user_id = auth.uid()
    )
  );