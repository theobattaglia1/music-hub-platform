-- Calendar Events Migration
-- This creates tables to support calendar event management for artists and projects

-- Create calendar_events table
create table if not exists public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete set null,
  title text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean default false,
  event_type text default 'general' check (event_type in ('studio', 'performance', 'meeting', 'deadline', 'release', 'general')),
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'completed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  recurrence_rule text, -- RRULE format for recurring events
  external_id text, -- for integration with external calendar systems
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create calendar_event_attendees table for tracking attendees
create table if not exists public.calendar_event_attendees (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.calendar_events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  name text,
  role text default 'attendee' check (role in ('organizer', 'attendee', 'optional')),
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'tentative')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint attendee_contact_check check (user_id is not null or (email is not null and name is not null))
);

-- Create calendar_event_reminders table
create table if not exists public.calendar_event_reminders (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.calendar_events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reminder_type text not null check (reminder_type in ('email', 'push', 'sms', 'popup')),
  minutes_before integer not null check (minutes_before >= 0),
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_artist_id_idx on public.calendar_events(artist_id);
create index if not exists calendar_events_start_time_idx on public.calendar_events(start_time);
create index if not exists calendar_events_end_time_idx on public.calendar_events(end_time);
create index if not exists calendar_events_type_idx on public.calendar_events(event_type);
create index if not exists calendar_events_status_idx on public.calendar_events(status);
create index if not exists calendar_event_attendees_event_id_idx on public.calendar_event_attendees(event_id);
create index if not exists calendar_event_attendees_user_id_idx on public.calendar_event_attendees(user_id);
create index if not exists calendar_event_reminders_event_id_idx on public.calendar_event_reminders(event_id);
create index if not exists calendar_event_reminders_user_id_idx on public.calendar_event_reminders(user_id);

-- Add constraint to ensure end_time is after start_time
alter table public.calendar_events 
add constraint calendar_events_time_check 
check (end_time > start_time);

-- Add updated_at triggers
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.handle_updated_at();

create trigger calendar_event_attendees_updated_at
  before update on public.calendar_event_attendees
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.calendar_events enable row level security;
alter table public.calendar_event_attendees enable row level security;
alter table public.calendar_event_reminders enable row level security;

-- RLS policies for calendar_events
create policy "Users can view own calendar events" on public.calendar_events
  for select using (auth.uid() = user_id);

create policy "Users can view events they're attending" on public.calendar_events
  for select using (
    exists (
      select 1 from public.calendar_event_attendees cea 
      where cea.event_id = id and cea.user_id = auth.uid()
    )
  );

create policy "Users can insert own calendar events" on public.calendar_events
  for insert with check (auth.uid() = user_id);

create policy "Users can update own calendar events" on public.calendar_events
  for update using (auth.uid() = user_id);

create policy "Users can delete own calendar events" on public.calendar_events
  for delete using (auth.uid() = user_id);

-- RLS policies for calendar_event_attendees
create policy "Users can view attendees of own events" on public.calendar_event_attendees
  for select using (
    exists (
      select 1 from public.calendar_events ce 
      where ce.id = event_id and ce.user_id = auth.uid()
    )
  );

create policy "Users can view attendee records where they are attendee" on public.calendar_event_attendees
  for select using (auth.uid() = user_id);

create policy "Event owners can manage attendees" on public.calendar_event_attendees
  for all using (
    exists (
      select 1 from public.calendar_events ce 
      where ce.id = event_id and ce.user_id = auth.uid()
    )
  );

create policy "Attendees can update their own status" on public.calendar_event_attendees
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS policies for calendar_event_reminders
create policy "Users can manage own event reminders" on public.calendar_event_reminders
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);