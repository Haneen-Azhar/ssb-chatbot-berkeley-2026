-- SSB Chatbot Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/qrblfhemdfxyfcicidra/sql)

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text check (role in ('CD', 'AM', 'SPA', 'Mentor', 'Instructor', 'Other')),
  bot_name text default 'Summer',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Queries table
create table public.queries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid not null,
  message text not null,
  response text,
  sources jsonb default '[]',
  kb_results_count int default 0,
  search_used boolean default false,
  input_tokens int default 0,
  output_tokens int default 0,
  response_time_ms int default 0,
  created_at timestamptz default now()
);

-- Indexes for analytics queries
create index idx_queries_user_id on public.queries(user_id);
create index idx_queries_created_at on public.queries(created_at desc);
create index idx_queries_session_id on public.queries(session_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.queries enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Profiles: admins can view all
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Queries: service role can insert (backend inserts on behalf of users)
create policy "Service role can insert queries"
  on public.queries for insert
  with check (true);

-- Queries: users can view own
create policy "Users can view own queries"
  on public.queries for select
  using (auth.uid() = user_id);

-- Queries: admins can view all
create policy "Admins can view all queries"
  on public.queries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
