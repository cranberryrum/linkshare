/*
  Long-term link stats.

  public.links is short-lived (rows are deleted a day after they expire and
  codes are reused), so it can't answer "how many links per week, from where,
  and do people actually receive them?". link_stats keeps one row per link
  created, forever, with no content and no code:

  - created_at, country, expiry_minutes
  - content_kind ('url' or 'text') and a rough length bucket
  - receives: how many times the link was opened with its code, and when
    first. This includes the creator checking their own code.

  Not readable from the app (RLS on, no grants). Read it in the dashboard or
  through the link_stats_daily view.
*/

create table if not exists public.link_stats (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  country           text check (country ~ '^[A-Z]{2}$'),
  expiry_minutes    integer not null check (expiry_minutes in (10, 60, 1440)),
  content_kind      text not null check (content_kind in ('url', 'text')),
  length_bucket     text not null check (length_bucket in ('1-20', '21-50', '51-100', '101-200', '201-399', '400')),
  receives          integer not null default 0,
  first_received_at timestamptz
);

create index if not exists link_stats_created_at_idx on public.link_stats (created_at);

alter table public.link_stats enable row level security;
revoke all on table public.link_stats from anon, authenticated;

-- Each live link points at its stats row, so a receive can be counted
alter table public.links add column if not exists stats_id uuid;

-- ---------------------------------------------------------------------------
-- create_link: same as before, plus one link_stats row per link
-- ---------------------------------------------------------------------------
create or replace function public.create_link(
  p_content text,
  p_minutes int  default 10,
  p_country text default null
)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code     text;
  v_token    text;
  v_expires  timestamptz;
  v_inserted boolean := false;
  v_headers  json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_country  text;
  v_len      integer;
  v_stats_id uuid;
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

  -- Edge header first, then the app's lookup; keep only a valid code
  -- (XX = unknown, T1 = Tor in Cloudflare's scheme).
  v_country := upper(coalesce(v_headers ->> 'cf-ipcountry', p_country));
  if v_country !~ '^[A-Z]{2}$' or v_country in ('XX', 'T1') then
    v_country := null;
  end if;

  v_token   := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + make_interval(mins => p_minutes);
  v_stats_id := gen_random_uuid();

  for i in 1..30 loop
    v_code := lpad(((('x' || substr(md5(gen_random_uuid()::text), 1, 8))::bit(32)::bigint) % 10000)::text, 4, '0');

    -- Take the code if it's free or its previous link has expired.
    insert into public.links (code, content, edit_token_hash, expires_at, country, stats_id)
    values (v_code, p_content, public._hash_token(v_token), v_expires, v_country, v_stats_id)
    on conflict (code) do update
      set content = excluded.content,
          edit_token_hash = excluded.edit_token_hash,
          created_at = now(),
          expires_at = excluded.expires_at,
          country = excluded.country,
          stats_id = excluded.stats_id
      where public.links.expires_at <= now();

    if found then
      v_inserted := true;
      exit;
    end if;
  end loop;

  if not v_inserted then
    return json_build_object('status', 'no_code_available');
  end if;

  -- Same rule as the app: a "url" is content that is one whole web address
  v_len := char_length(trim(p_content));
  insert into public.link_stats (id, country, expiry_minutes, content_kind, length_bucket)
  values (
    v_stats_id,
    v_country,
    p_minutes,
    case when trim(p_content) ~* '^(https?://)?[[:alnum:]_-]+(\.[[:alnum:]_-]+)+\.?(:[0-9]+)?(/[^[:space:]]*)?$'
         then 'url' else 'text' end,
    case when v_len >= 400 then '400'
         when v_len > 200 then '201-399'
         when v_len > 100 then '101-200'
         when v_len > 50  then '51-100'
         when v_len > 20  then '21-50'
         else '1-20' end
  );

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

revoke execute on function public.create_link(text, int, text) from public, anon, authenticated;
grant execute on function public.create_link(text, int, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_link: same as before, plus counting a successful receive
-- ---------------------------------------------------------------------------
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

  if v_link.stats_id is not null then
    update public.link_stats
       set receives = receives + 1,
           first_received_at = coalesce(first_received_at, now())
     where id = v_link.stats_id;
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

revoke execute on function public.get_link(text) from public, anon, authenticated;
grant execute on function public.get_link(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Daily roll-up for the dashboard: links made, how many were received, by
-- country, expiry and kind. Not exposed to the app.
-- ---------------------------------------------------------------------------
create or replace view public.link_stats_daily
with (security_invoker = true) as
select
  (created_at at time zone 'UTC')::date                     as day,
  coalesce(country, '??')                                   as country,
  expiry_minutes,
  content_kind,
  count(*)                                                  as links,
  count(*) filter (where receives > 0)                      as received_links,
  round(100.0 * count(*) filter (where receives > 0) / count(*), 1) as received_pct,
  sum(receives)                                             as receives,
  percentile_cont(0.5) within group (
    order by extract(epoch from first_received_at - created_at)
  ) filter (where first_received_at is not null)            as median_seconds_to_receive
from public.link_stats
group by 1, 2, 3, 4;

revoke all on public.link_stats_daily from anon, authenticated;
