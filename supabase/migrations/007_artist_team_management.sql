-- Artist Team Management Migration
-- This creates tables to support team member management with roles and permissions

-- Create team_roles table for defining different roles
create table if not exists public.team_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  permissions jsonb default '{}', -- JSON object defining specific permissions
  is_default boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- Create team_members table for artist team management
create table if not exists public.team_members (
  id uuid default uuid_generate_v4() primary key,
  owner_user_id uuid references auth.users(id) on delete cascade not null, -- The user who owns the team
  member_user_id uuid references auth.users(id) on delete cascade, -- Registered user (nullable for external members)
  artist_id uuid references public.artists(id) on delete set null,
  role_id uuid references public.team_roles(id) on delete set null,
  -- External member info (for non-registered users)
  email text,
  full_name text,
  phone text,
  -- Role and status
  role_title text not null, -- Free-form role title
  department text check (department in ('management', 'creative', 'technical', 'marketing', 'business', 'other')),
  status text default 'active' check (status in ('active', 'inactive', 'pending', 'invited', 'removed')),
  -- Permissions
  permissions jsonb default '{}',
  -- Additional info
  bio text,
  avatar_url text,
  social_links jsonb default '{}',
  start_date date,
  end_date date,
  hourly_rate decimal(10,2),
  notes text,
  -- Invitation tracking
  invitation_token text unique,
  invitation_expires_at timestamptz,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint member_contact_check check (
    member_user_id is not null or (email is not null and full_name is not null)
  )
);

-- Create team_invitations table for tracking pending invitations
create table if not exists public.team_invitations (
  id uuid default uuid_generate_v4() primary key,
  team_member_id uuid references public.team_members(id) on delete cascade not null,
  sender_user_id uuid references auth.users(id) on delete cascade not null,
  recipient_email text not null,
  invitation_token text unique not null,
  message text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz default now()
);

-- Create team_activities table for tracking team actions and changes
create table if not exists public.team_activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null, -- User who performed the action
  team_member_id uuid references public.team_members(id) on delete cascade,
  activity_type text not null check (activity_type in ('added', 'removed', 'role_changed', 'status_changed', 'permissions_updated', 'profile_updated', 'invitation_sent', 'invitation_accepted', 'invitation_declined')),
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Create team_permissions table for granular permission tracking
create table if not exists public.team_permissions (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  description text not null,
  category text not null check (category in ('content', 'team', 'financial', 'settings', 'analytics')),
  is_system boolean default true, -- System permissions vs custom permissions
  created_at timestamptz default now()
);

-- Insert default team permissions
insert into public.team_permissions (name, description, category) values
  ('view_content', 'View content and media files', 'content'),
  ('edit_content', 'Edit and upload content', 'content'),
  ('delete_content', 'Delete content and media files', 'content'),
  ('view_team', 'View team members and their information', 'team'),
  ('invite_team', 'Invite new team members', 'team'),
  ('edit_team', 'Edit team member information and roles', 'team'),
  ('remove_team', 'Remove team members', 'team'),
  ('view_financial', 'View financial information and reports', 'financial'),
  ('edit_financial', 'Edit financial information', 'financial'),
  ('view_settings', 'View account and project settings', 'settings'),
  ('edit_settings', 'Edit account and project settings', 'settings'),
  ('view_analytics', 'View analytics and performance data', 'analytics')
on conflict (name) do nothing;

-- Add indexes for performance
create index if not exists team_roles_user_id_idx on public.team_roles(user_id);
create index if not exists team_roles_default_idx on public.team_roles(is_default);
create index if not exists team_members_owner_user_id_idx on public.team_members(owner_user_id);
create index if not exists team_members_member_user_id_idx on public.team_members(member_user_id);
create index if not exists team_members_artist_id_idx on public.team_members(artist_id);
create index if not exists team_members_role_id_idx on public.team_members(role_id);
create index if not exists team_members_email_idx on public.team_members(email);
create index if not exists team_members_status_idx on public.team_members(status);
create index if not exists team_members_department_idx on public.team_members(department);
create index if not exists team_invitations_team_member_id_idx on public.team_invitations(team_member_id);
create index if not exists team_invitations_token_idx on public.team_invitations(invitation_token);
create index if not exists team_invitations_email_idx on public.team_invitations(recipient_email);
create index if not exists team_invitations_expires_at_idx on public.team_invitations(expires_at);
create index if not exists team_activities_user_id_idx on public.team_activities(user_id);
create index if not exists team_activities_team_member_id_idx on public.team_activities(team_member_id);
create index if not exists team_activities_type_idx on public.team_activities(activity_type);
create index if not exists team_activities_created_at_idx on public.team_activities(created_at desc);

-- Add updated_at triggers
create trigger team_roles_updated_at
  before update on public.team_roles
  for each row execute function public.handle_updated_at();

create trigger team_members_updated_at
  before update on public.team_members
  for each row execute function public.handle_updated_at();

-- Function to generate invitation token
create or replace function public.generate_invitation_token()
returns text
language sql
as $$
  select encode(gen_random_bytes(32), 'base64url');
$$;

-- Function to create team activity log
create or replace function public.log_team_activity()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.team_activities (
      user_id,
      team_member_id,
      activity_type,
      description,
      metadata
    ) values (
      auth.uid(),
      new.id,
      'added',
      'Team member ' || coalesce(new.full_name, new.email) || ' was added',
      jsonb_build_object('role_title', new.role_title, 'status', new.status)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status != new.status then
      insert into public.team_activities (
        user_id,
        team_member_id,
        activity_type,
        description,
        metadata
      ) values (
        auth.uid(),
        new.id,
        'status_changed',
        'Status changed from ' || old.status || ' to ' || new.status,
        jsonb_build_object('old_status', old.status, 'new_status', new.status)
      );
    end if;
    if old.role_title != new.role_title then
      insert into public.team_activities (
        user_id,
        team_member_id,
        activity_type,
        description,
        metadata
      ) values (
        auth.uid(),
        new.id,
        'role_changed',
        'Role changed from ' || old.role_title || ' to ' || new.role_title,
        jsonb_build_object('old_role', old.role_title, 'new_role', new.role_title)
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.team_activities (
      user_id,
      team_member_id,
      activity_type,
      description,
      metadata
    ) values (
      auth.uid(),
      old.id,
      'removed',
      'Team member ' || coalesce(old.full_name, old.email) || ' was removed',
      jsonb_build_object('role_title', old.role_title, 'status', old.status)
    );
    return old;
  end if;
  return null;
end;
$$;

-- Trigger to log team activities
create trigger team_member_activity_log
  after insert or update or delete on public.team_members
  for each row execute function public.log_team_activity();

-- Enable RLS
alter table public.team_roles enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.team_activities enable row level security;
alter table public.team_permissions enable row level security;

-- RLS policies for team_roles
create policy "Users can manage own team roles" on public.team_roles
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policies for team_members
create policy "Team owners can view their team members" on public.team_members
  for select using (auth.uid() = owner_user_id);

create policy "Team members can view their own record" on public.team_members
  for select using (auth.uid() = member_user_id);

create policy "Team owners can manage their team members" on public.team_members
  for all using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy "Team members can update their own profile" on public.team_members
  for update using (auth.uid() = member_user_id)
  with check (auth.uid() = member_user_id);

-- RLS policies for team_invitations
create policy "Users can view invitations they sent" on public.team_invitations
  for select using (auth.uid() = sender_user_id);

create policy "Users can view invitations for their team members" on public.team_invitations
  for select using (
    exists (
      select 1 from public.team_members tm 
      where tm.id = team_member_id and tm.owner_user_id = auth.uid()
    )
  );

create policy "Team owners can manage invitations" on public.team_invitations
  for all using (
    exists (
      select 1 from public.team_members tm 
      where tm.id = team_member_id and tm.owner_user_id = auth.uid()
    )
  );

-- RLS policies for team_activities
create policy "Users can view activities for their teams" on public.team_activities
  for select using (
    exists (
      select 1 from public.team_members tm 
      where tm.id = team_member_id and tm.owner_user_id = auth.uid()
    )
  );

create policy "System can create team activities" on public.team_activities
  for insert with check (true);

-- RLS policies for team_permissions (read-only for all authenticated users)
create policy "Authenticated users can view team permissions" on public.team_permissions
  for select using (auth.role() = 'authenticated');