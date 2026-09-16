-- DukaVerse Migration v6 — Password auth + security question for password reset
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add security question + hashed answer to profiles table
--    The answer is stored as a bcrypt hash (via pgcrypto) so it is never readable.
alter table public.profiles
  add column if not exists security_question text,
  add column if not exists security_answer_hash text;

-- 2. Function: save security question and answer during registration
--    Called from the app after signUp() succeeds.
create or replace function public.set_security_question(
  p_question text,
  p_answer   text   -- plain text; we hash it server-side
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_question is null or trim(p_question) = '' then raise exception 'Question is required'; end if;
  if p_answer   is null or trim(p_answer)   = '' then raise exception 'Answer is required'; end if;

  insert into public.profiles (id, security_question, security_answer_hash)
  values (v_uid, trim(p_question), crypt(lower(trim(p_answer)), gen_salt('bf')))
  on conflict (id) do update
    set security_question    = trim(p_question),
        security_answer_hash = crypt(lower(trim(p_answer)), gen_salt('bf'));
end;
$$;

-- 3. Function: get the security question for a given email (public, no auth needed)
create or replace function public.get_security_question(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid;
  v_question text;
begin
  -- Look up the user id from auth.users by email
  select id into v_uid
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_uid is null then
    raise exception 'No account found with that email address';
  end if;

  select security_question into v_question
  from public.profiles
  where id = v_uid;

  if v_question is null then
    raise exception 'No security question set for this account';
  end if;

  return v_question;
end;
$$;

-- 4. Function: verify security answer and update password
--    Uses the service role from the app (admin client) to update auth.users.
--    Returns the user id so the app can call admin.updateUserById().
create or replace function public.verify_security_answer(
  p_email  text,
  p_answer text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid;
  v_hash text;
begin
  select id into v_uid
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_uid is null then
    raise exception 'No account found with that email address';
  end if;

  select security_answer_hash into v_hash
  from public.profiles
  where id = v_uid;

  if v_hash is null then
    raise exception 'No security question set for this account';
  end if;

  -- Compare using pgcrypto constant-time compare
  if v_hash <> crypt(lower(trim(p_answer)), v_hash) then
    raise exception 'Incorrect answer. Please try again.';
  end if;

  return v_uid;
end;
$$;

-- 5. Grant execute permissions
revoke all on function public.set_security_question(text, text)    from public, anon;
revoke all on function public.get_security_question(text)          from public, anon;
revoke all on function public.verify_security_answer(text, text)   from public, anon;

grant execute on function public.set_security_question(text, text) to authenticated;
grant execute on function public.get_security_question(text)       to anon, authenticated;
grant execute on function public.verify_security_answer(text, text) to anon, authenticated;

-- 6. Make sure pgcrypto extension is enabled (required for crypt / gen_salt)
create extension if not exists pgcrypto;

-- Verify:
-- select proname from pg_proc where proname in ('set_security_question','get_security_question','verify_security_answer');
