-- Initial Setup Migration
-- This creates the foundation tables and utility functions for the music hub platform

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create utility function to get current profile ID for RLS
create or replace function public.current_profile_id()
returns uuid
language sql
security definer
stable
as $$
  select id from auth.users where auth.uid() = id;
$$;

-- Create profiles table (fixing missing user_id column)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_id uuid references auth.users(id) on delete cascade, -- Added missing user_id column
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  preferences jsonb default '{}',
  social_links jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create trigger to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, user_id, email, full_name, avatar_url)
  values (
    new.id,
    new.id, -- Set user_id to same as id
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();