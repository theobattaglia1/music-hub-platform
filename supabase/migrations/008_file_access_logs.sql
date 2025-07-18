-- File Access Logs Migration
-- This creates tables to support file access logging and audit trails

-- Create file_access_logs table for tracking file access
create table if not exists public.file_access_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null, -- Nullable for anonymous access
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  access_type text not null check (access_type in ('view', 'download', 'stream', 'upload', 'delete', 'share', 'preview')),
  access_method text default 'web' check (access_method in ('web', 'api', 'mobile', 'desktop', 'embed')),
  ip_address inet,
  user_agent text,
  referrer text,
  -- Location info (if available)
  country text,
  region text,
  city text,
  -- Success/failure tracking
  success boolean default true,
  error_message text,
  response_status_code integer,
  -- Additional context
  session_id text,
  request_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Create file_shares table for tracking shared files
create table if not exists public.file_shares (
  id uuid default uuid_generate_v4() primary key,
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  shared_by_user_id uuid references auth.users(id) on delete cascade not null,
  share_token text unique not null,
  share_type text not null check (share_type in ('public', 'private', 'password', 'limited_time')),
  password_hash text, -- for password-protected shares
  expires_at timestamptz,
  max_downloads integer,
  download_count integer default 0,
  is_active boolean default true,
  permissions jsonb default '{"view": true, "download": false}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create file_share_access_logs table for tracking access to shared files
create table if not exists public.file_share_access_logs (
  id uuid default uuid_generate_v4() primary key,
  file_share_id uuid references public.file_shares(id) on delete cascade not null,
  access_type text not null check (access_type in ('view', 'download', 'password_attempt')),
  ip_address inet,
  user_agent text,
  success boolean default true,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Create file_downloads table for detailed download tracking
create table if not exists public.file_downloads (
  id uuid default uuid_generate_v4() primary key,
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  file_share_id uuid references public.file_shares(id) on delete set null,
  download_token text unique,
  file_size_bytes bigint,
  download_started_at timestamptz default now(),
  download_completed_at timestamptz,
  bytes_transferred bigint default 0,
  success boolean,
  error_message text,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'
);

-- Create file_usage_analytics table for aggregated statistics
create table if not exists public.file_usage_analytics (
  id uuid default uuid_generate_v4() primary key,
  media_file_id uuid references public.media_files(id) on delete cascade not null,
  date_bucket date not null, -- Daily aggregation
  view_count integer default 0,
  download_count integer default 0,
  stream_count integer default 0,
  share_count integer default 0,
  unique_users integer default 0,
  total_bandwidth_bytes bigint default 0,
  top_countries jsonb default '[]',
  top_referrers jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(media_file_id, date_bucket)
);

-- Add indexes for performance
create index if not exists file_access_logs_user_id_idx on public.file_access_logs(user_id);
create index if not exists file_access_logs_media_file_id_idx on public.file_access_logs(media_file_id);
create index if not exists file_access_logs_access_type_idx on public.file_access_logs(access_type);
create index if not exists file_access_logs_created_at_idx on public.file_access_logs(created_at desc);
create index if not exists file_access_logs_ip_address_idx on public.file_access_logs(ip_address);
create index if not exists file_access_logs_session_idx on public.file_access_logs(session_id);

create index if not exists file_shares_media_file_id_idx on public.file_shares(media_file_id);
create index if not exists file_shares_shared_by_user_id_idx on public.file_shares(shared_by_user_id);
create index if not exists file_shares_token_idx on public.file_shares(share_token);
create index if not exists file_shares_expires_at_idx on public.file_shares(expires_at);
create index if not exists file_shares_active_idx on public.file_shares(is_active);

create index if not exists file_share_access_logs_share_id_idx on public.file_share_access_logs(file_share_id);
create index if not exists file_share_access_logs_created_at_idx on public.file_share_access_logs(created_at desc);

create index if not exists file_downloads_media_file_id_idx on public.file_downloads(media_file_id);
create index if not exists file_downloads_user_id_idx on public.file_downloads(user_id);
create index if not exists file_downloads_share_id_idx on public.file_downloads(file_share_id);
create index if not exists file_downloads_token_idx on public.file_downloads(download_token);
create index if not exists file_downloads_started_at_idx on public.file_downloads(download_started_at desc);

create index if not exists file_usage_analytics_media_file_id_idx on public.file_usage_analytics(media_file_id);
create index if not exists file_usage_analytics_date_bucket_idx on public.file_usage_analytics(date_bucket desc);

-- Function to generate share token
create or replace function public.generate_share_token()
returns text
language sql
as $$
  select encode(gen_random_bytes(32), 'base64url');
$$;

-- Function to log file access
create or replace function public.log_file_access(
  p_media_file_id uuid,
  p_access_type text,
  p_access_method text default 'web',
  p_ip_address inet default null,
  p_user_agent text default null,
  p_referrer text default null,
  p_metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  log_id uuid;
begin
  insert into public.file_access_logs (
    user_id,
    media_file_id,
    access_type,
    access_method,
    ip_address,
    user_agent,
    referrer,
    metadata
  ) values (
    auth.uid(),
    p_media_file_id,
    p_access_type,
    p_access_method,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_metadata
  ) returning id into log_id;
  
  return log_id;
end;
$$;

-- Function to update file usage analytics
create or replace function public.update_file_analytics()
returns trigger
language plpgsql
as $$
declare
  current_date date := current_date;
begin
  -- Insert or update daily analytics
  insert into public.file_usage_analytics (
    media_file_id,
    date_bucket,
    view_count,
    download_count,
    stream_count,
    share_count,
    unique_users
  ) values (
    new.media_file_id,
    current_date,
    case when new.access_type = 'view' then 1 else 0 end,
    case when new.access_type = 'download' then 1 else 0 end,
    case when new.access_type = 'stream' then 1 else 0 end,
    case when new.access_type = 'share' then 1 else 0 end,
    case when new.user_id is not null then 1 else 0 end
  )
  on conflict (media_file_id, date_bucket)
  do update set
    view_count = file_usage_analytics.view_count + case when new.access_type = 'view' then 1 else 0 end,
    download_count = file_usage_analytics.download_count + case when new.access_type = 'download' then 1 else 0 end,
    stream_count = file_usage_analytics.stream_count + case when new.access_type = 'stream' then 1 else 0 end,
    share_count = file_usage_analytics.share_count + case when new.access_type = 'share' then 1 else 0 end,
    updated_at = now();
  
  return new;
end;
$$;

-- Trigger to update analytics on file access
create trigger file_access_analytics_trigger
  after insert on public.file_access_logs
  for each row execute function public.update_file_analytics();

-- Function to clean up old logs (for maintenance)
create or replace function public.cleanup_old_file_logs(days_to_keep integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.file_access_logs
  where created_at < now() - interval '1 day' * days_to_keep;
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Add updated_at triggers
create trigger file_shares_updated_at
  before update on public.file_shares
  for each row execute function public.handle_updated_at();

create trigger file_usage_analytics_updated_at
  before update on public.file_usage_analytics
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.file_access_logs enable row level security;
alter table public.file_shares enable row level security;
alter table public.file_share_access_logs enable row level security;
alter table public.file_downloads enable row level security;
alter table public.file_usage_analytics enable row level security;

-- RLS policies for file_access_logs
create policy "Users can view access logs for their files" on public.file_access_logs
  for select using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can view their own access logs" on public.file_access_logs
  for select using (auth.uid() = user_id);

create policy "System can create access logs" on public.file_access_logs
  for insert with check (true);

-- RLS policies for file_shares
create policy "Users can view shares for their files" on public.file_shares
  for select using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can manage shares for their files" on public.file_shares
  for all using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

-- RLS policies for file_share_access_logs
create policy "Users can view share access logs for their files" on public.file_share_access_logs
  for select using (
    exists (
      select 1 from public.file_shares fs
      join public.media_files mf on mf.id = fs.media_file_id
      where fs.id = file_share_id and mf.user_id = auth.uid()
    )
  );

create policy "System can create share access logs" on public.file_share_access_logs
  for insert with check (true);

-- RLS policies for file_downloads
create policy "Users can view downloads for their files" on public.file_downloads
  for select using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "Users can view their own downloads" on public.file_downloads
  for select using (auth.uid() = user_id);

create policy "System can manage file downloads" on public.file_downloads
  for all with check (true);

-- RLS policies for file_usage_analytics
create policy "Users can view analytics for their files" on public.file_usage_analytics
  for select using (
    exists (
      select 1 from public.media_files mf 
      where mf.id = media_file_id and mf.user_id = auth.uid()
    )
  );

create policy "System can manage file analytics" on public.file_usage_analytics
  for all with check (true);