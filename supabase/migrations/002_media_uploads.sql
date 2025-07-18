-- Media Uploads Migration
-- This creates tables to support media file uploads with metadata and access tracking

-- Create media_files table for tracking all uploaded files
create table if not exists public.media_files (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  original_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  file_type text not null check (file_type in ('audio', 'video', 'image', 'document', 'other')),
  duration_seconds integer, -- for audio/video files
  width integer, -- for images/videos
  height integer, -- for images/videos
  metadata jsonb default '{}',
  tags text[] default array[]::text[],
  is_public boolean default false,
  storage_bucket text not null default 'media',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create artists table for media file associations
create table if not exists public.artists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  bio text,
  avatar_url text,
  cover_url text,
  social_links jsonb default '{}',
  metadata jsonb default '{}',
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create media_file_artists junction table for many-to-many relationship
create table if not exists public.media_file_artists (
  id uuid default uuid_generate_v4() primary key,
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete cascade not null,
  role text default 'performer' check (role in ('performer', 'producer', 'writer', 'featured', 'other')),
  created_at timestamptz default now(),
  unique(media_file_id, artist_id, role)
);

-- Add indexes for performance
create index if not exists media_files_user_id_idx on public.media_files(user_id);
create index if not exists media_files_file_type_idx on public.media_files(file_type);
create index if not exists media_files_created_at_idx on public.media_files(created_at desc);
create index if not exists media_files_tags_idx on public.media_files using gin(tags);
create index if not exists artists_user_id_idx on public.artists(user_id);
create index if not exists artists_slug_idx on public.artists(slug);
create index if not exists media_file_artists_media_file_id_idx on public.media_file_artists(media_file_id);
create index if not exists media_file_artists_artist_id_idx on public.media_file_artists(artist_id);

-- Add updated_at triggers
create trigger media_files_updated_at
  before update on public.media_files
  for each row execute function public.handle_updated_at();

create trigger artists_updated_at
  before update on public.artists
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.media_files enable row level security;
alter table public.artists enable row level security;
alter table public.media_file_artists enable row level security;

-- RLS policies for media_files
create policy "Users can view own media files" on public.media_files
  for select using (auth.uid() = user_id);

create policy "Users can view public media files" on public.media_files
  for select using (is_public = true);

create policy "Users can insert own media files" on public.media_files
  for insert with check (auth.uid() = user_id);

create policy "Users can update own media files" on public.media_files
  for update using (auth.uid() = user_id);

create policy "Users can delete own media files" on public.media_files
  for delete using (auth.uid() = user_id);

-- RLS policies for artists
create policy "Users can view own artists" on public.artists
  for select using (auth.uid() = user_id);

create policy "Users can insert own artists" on public.artists
  for insert with check (auth.uid() = user_id);

create policy "Users can update own artists" on public.artists
  for update using (auth.uid() = user_id);

create policy "Users can delete own artists" on public.artists
  for delete using (auth.uid() = user_id);

-- RLS policies for media_file_artists
create policy "Users can view media file artists for own files" on public.media_file_artists
  for select using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can insert media file artists for own files" on public.media_file_artists
  for insert with check (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can update media file artists for own files" on public.media_file_artists
  for update using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can delete media file artists for own files" on public.media_file_artists
  for delete using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );