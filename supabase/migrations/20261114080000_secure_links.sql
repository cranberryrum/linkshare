/*
  Linkshare: secure links schema

  The browser never touches the tables directly. Everything goes through the
  SECURITY DEFINER functions below, which:
    - pick the 4-digit code on the server (crypto-random, with collision retry)
    - set expiry from the SERVER clock (device clocks were causing early "not found")
    - return a secret edit token to the creator only; edit/delete need that token
    - return one link by exact code, never a list, never the creator's identity
    - limit failed lookups and link creation per client IP (stops code guessing)
    - cap content at 400 characters on the server, not just in the UI

  Expired links keep their row for 1 day (content wiped) so lookups can say
  "expired" instead of "not found". A pg_cron job does the cleanup every minute.
*/

-- ---------------------------------------------------------------------------
-- Tables (no policies + RLS on = no direct access for anon/authenticated)
-- ---------------------------------------------------------------------------

create table public.links (
  code            text primary key check (code ~ '^[0-9]{4}$'),
  content         text not null,
  edit_token_hash text not null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);

create index links_expires_at_idx on public.links (expires_at);

create table public.rate_events (
  client_key  text not null,              -- sha256 of the client IP, never the raw IP
  kind        text not null check (kind in ('create', 'failed_lookup')),
  happened_at timestamptz not null default now()
);

create index rate_events_lookup_idx on public.rate_events (client_key, kind, happened_at);

alter table public.links enable row level security;
alter table public.rate_events enable row level security;

revoke all on table public.links from anon, authenticated;
revoke all on table public.rate_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable from the browser)
-- ---------------------------------------------------------------------------

-- Hashed client IP from the request headers PostgREST forwards.
create or replace function public._client_key()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip text;
begin
  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    headers ->> 'x-real-ip',
    split_part(headers ->> 'x-forwarded-for', ',', 1),
    'unknown'
  );
  return encode(sha256(convert_to(trim(ip), 'UTF8')), 'hex');
end;
$$;

create or replace function public._hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
$$;

create or replace function public._rate_limited(p_kind text, p_max int, p_window interval)
returns boolean
language sql
stable
set search_path = ''
as $$
  select count(*) >= p_max
  from public.rate_events
  where client_key = public._client_key()
    and kind = p_kind
    and happened_at > now() - p_window;
$$;

-- ---------------------------------------------------------------------------
-- Public API (callable with the anon key via supabase.rpc)
-- ---------------------------------------------------------------------------

-- Create a link. Returns the code, the secret edit token (show/keep on the
-- creator's device only), the expiry and the server time.
create or replace function public.create_link(p_content text, p_minutes int default 10)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code    text;
  v_token   text;
  v_expires timestamptz;
  v_inserted boolean := false;
begin
  if p_content is null or length(trim(p_content)) = 0 then
    return json_build_object('status', 'empty');
  end if;
  if char_length(p_content) > 400 then
    return json_build_object('status', 'too_long');
  end if;
  if p_minutes not in (10, 60, 1440) then
    return json_build_object('status', 'bad_duration');
  end if;
  -- Generous because a whole classroom often shares one school IP.
  if public._rate_limited('create', 60, interval '10 minutes') then
    return json_build_object('status', 'rate_limited');
  end if;

  v_token   := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + make_interval(mins => p_minutes);

  for i in 1..30 loop
    v_code := lpad(((('x' || substr(md5(gen_random_uuid()::text), 1, 8))::bit(32)::bigint) % 10000)::text, 4, '0');

    -- Take the code if it's free or its previous link has expired.
    insert into public.links (code, content, edit_token_hash, expires_at)
    values (v_code, p_content, public._hash_token(v_token), v_expires)
    on conflict (code) do update
      set content = excluded.content,
          edit_token_hash = excluded.edit_token_hash,
          created_at = now(),
          expires_at = excluded.expires_at
      where public.links.expires_at <= now();

    if found then
      v_inserted := true;
      exit;
    end if;
  end loop;

  if not v_inserted then
    return json_build_object('status', 'no_code_available');
  end if;

  insert into public.rate_events (client_key, kind) values (public._client_key(), 'create');

  return json_build_object(
    'status', 'ok',
    'code', v_code,
    'edit_token', v_token,
    'content', p_content,
    'created_at', now(),
    'expires_at', v_expires,
    'server_now', now()
  );
end;
$$;

-- Look up one link by its exact code.
create or replace function public.get_link(p_code text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_link public.links;
begin
  -- A classroom on one IP can fail a lot legitimately (typos), so allow 60
  -- failures per 10 minutes. That's ~6 guesses/minute: too slow to scan codes.
  if public._rate_limited('failed_lookup', 60, interval '10 minutes') then
    return json_build_object('status', 'rate_limited', 'server_now', now());
  end if;

  if p_code is not null and p_code ~ '^[0-9]{4}$' then
    select * into v_link from public.links where code = p_code;
  end if;

  if v_link.code is null then
    insert into public.rate_events (client_key, kind) values (public._client_key(), 'failed_lookup');
    return json_build_object('status', 'not_found', 'server_now', now());
  end if;

  if v_link.expires_at <= now() then
    insert into public.rate_events (client_key, kind) values (public._client_key(), 'failed_lookup');
    return json_build_object('status', 'expired', 'server_now', now());
  end if;

  return json_build_object(
    'status', 'ok',
    'code', v_link.code,
    'content', v_link.content,
    'created_at', v_link.created_at,
    'expires_at', v_link.expires_at,
    'server_now', now()
  );
end;
$$;

-- The creator's own active links, identified by the tokens stored on their device.
create or replace function public.get_my_links(p_codes text[], p_tokens text[])
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'status', 'ok',
    'server_now', now(),
    'links', coalesce(json_agg(json_build_object(
      'code', l.code,
      'content', l.content,
      'created_at', l.created_at,
      'expires_at', l.expires_at
    )), '[]'::json)
  )
  from unnest(p_codes[1:20], p_tokens[1:20]) as mine(code, token)
  join public.links l
    on l.code = mine.code
   and l.edit_token_hash = public._hash_token(mine.token)
   and l.expires_at > now();
$$;

create or replace function public.update_link(p_code text, p_token text, p_content text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_link public.links;
begin
  if p_content is null or length(trim(p_content)) = 0 then
    return json_build_object('status', 'empty');
  end if;
  if char_length(p_content) > 400 then
    return json_build_object('status', 'too_long');
  end if;

  update public.links
     set content = p_content
   where code = p_code
     and edit_token_hash = public._hash_token(p_token)
     and expires_at > now()
  returning * into v_link;

  if v_link.code is null then
    return json_build_object('status', 'not_allowed');
  end if;

  return json_build_object(
    'status', 'ok',
    'code', v_link.code,
    'content', v_link.content,
    'created_at', v_link.created_at,
    'expires_at', v_link.expires_at,
    'server_now', now()
  );
end;
$$;

create or replace function public.delete_link(p_code text, p_token text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  delete from public.links
   where code = p_code
     and edit_token_hash = public._hash_token(p_token);

  if not found then
    return json_build_object('status', 'not_allowed');
  end if;
  return json_build_object('status', 'ok');
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: only the five public functions are callable from the browser
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.create_link(text, int)            to anon, authenticated;
grant execute on function public.get_link(text)                    to anon, authenticated;
grant execute on function public.get_my_links(text[], text[])      to anon, authenticated;
grant execute on function public.update_link(text, text, text)     to anon, authenticated;
grant execute on function public.delete_link(text, text)           to anon, authenticated;

-- New functions created later shouldn't be callable by default either.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cleanup every minute: wipe expired content, drop day-old rows and rate events
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule(
  'linkshare-cleanup',
  '* * * * *',
  $$
    update public.links set content = '' where expires_at <= now() and content <> '';
    delete from public.links where expires_at < now() - interval '1 day';
    delete from public.rate_events where happened_at < now() - interval '1 hour';
  $$
);
