-- Campus Memory: configurable context that supplements the knowledge base
-- Run this in Supabase SQL Editor

-- Text blocks and parsed file contents
create table public.campus_memory (
  id uuid default gen_random_uuid() primary key,
  memory_type text not null check (memory_type in ('text_block', 'file')),
  title text not null,
  content text not null,
  file_name text,
  file_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campus_memory_type on public.campus_memory(memory_type);

-- RLS
alter table public.campus_memory enable row level security;

-- All authenticated users can read
create policy "Authenticated users can read campus memory"
  on public.campus_memory for select
  using (auth.uid() is not null);

-- Service role can insert/update/delete (API handles permission checks)
create policy "Service role can manage campus memory"
  on public.campus_memory for all
  using (true)
  with check (true);
