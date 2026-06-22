-- Run this in the Supabase SQL Editor to create the responses table

create table responses (
  id uuid default gen_random_uuid() primary key,
  survey_version text not null,
  answers jsonb not null default '{}',
  open_answers jsonb not null default '{}',
  demo_answers jsonb not null default '{}',
  submitted_at timestamptz not null default now()
);

-- Disable public read access (admin API uses service role key)
alter table responses enable row level security;

create policy "No public access"
  on responses
  for all
  using (false);
