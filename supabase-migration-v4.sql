-- DukaVerse Migration v4 — Admin console setup
-- Run in Supabase SQL Editor

-- Grant mbazzacodes@gmail.com full access to all data via service role
-- No schema changes needed — admin access is enforced in the app layer
-- using the ADMIN_UIDS set in lib/supabase/admin-guard.ts

-- Optional: create an admin_users table for future management
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);

-- Insert the super admin
insert into public.admin_users (user_id, email)
values ('94350837-85e5-4cf0-a07c-adc701857552', 'mbazzacodes@gmail.com')
on conflict (user_id) do nothing;

-- RLS: only admins can see admin_users
alter table public.admin_users enable row level security;

create policy "admins_only" on public.admin_users
  for all to authenticated
  using (
    auth.uid() in (select user_id from public.admin_users)
  );

-- Verify:
-- select * from public.admin_users;
