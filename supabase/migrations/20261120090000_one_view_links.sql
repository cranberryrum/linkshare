/*
  One-view links: deleted the moment they're opened.

  - links.one_view marks the link; links.viewed_at records when it was
    opened. One-view links last up to a day if nobody opens them.
  - get_link hands the content out exactly once: the first successful open
    wipes the content and ends the link in the same statement, under a row
    lock, so two people entering the code at the same moment can't both get
    it. Later attempts get status 'viewed' (not a failed guess).
  - The code becomes free for reuse straight away.
  - link_stats.one_view keeps the choice in the long-term stats.

  Safe to run more than once.
*/

alter table public.links
  add column if not exists one_view  boolean not null default false,
  add column if not exists viewed_at timestamptz;

alter table public.link_stats
  add column if not exists one_view boolean not null default false;

-- ---------------------------------------------------------------------------
-- create_link: same as before, plus p_one_view
-- ---------------------------------------------------------------------------
drop function if exists public.create_link(text, int, text);

create or replace function public.create_link(
  p_content text,
  p_minutes int  default 10,
  p_country text default null,
  p_one_view boolean default false
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
  -- One-view links stay up to a day if nobody opens them
  if coalesce(p_one_view, false) then
    p_minutes := 1440;
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
    insert into public.links (code, content, edit_token_hash, expires_at, country, stats_id, one_view, viewed_at)
    values (v_code, p_content, public._hash_token(v_token), v_expires, v_country, v_stats_id, coalesce(p_one_view, false), null)
    on conflict (code) do update
      set content = excluded.content,
          edit_token_hash = excluded.edit_token_hash,
          created_at = now(),
          expires_at = excluded.expires_at,
          country = excluded.country,
          stats_id = excluded.stats_id,
          one_view = excluded.one_view,
          viewed_at = null
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
  insert into public.link_stats (id, country, expiry_minutes, one_view, content_kind, length_bucket)
  values (
    v_stats_id,
    v_country,
    p_minutes,
    coalesce(p_one_view, false),
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
    'one_view', coalesce(p_one_view, false),
    'server_now', now()
  );
end;
$$;

revoke execute on function public.create_link(text, int, text, boolean) from public, anon, authenticated;
grant execute on function public.create_link(text, int, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_link: one-view links are handed out once, then wiped
-- ---------------------------------------------------------------------------
create or replace function public.get_link(p_code text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_link    public.links;
  v_content text;
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

  -- Already opened once: say so instead of "expired" (and it isn't a guess)
  if v_link.viewed_at is not null then
    return json_build_object('status', 'viewed', 'server_now', now());
  end if;

  if v_link.expires_at <= now() then
    insert into public.rate_events (client_key, kind) values (public._client_key(), 'failed_lookup');
    return json_build_object('status', 'expired', 'server_now', now());
  end if;

  if v_link.one_view then
    -- Take the content and end the link in one step. FOR UPDATE makes a
    -- second simultaneous open wait, then find viewed_at set and get nothing.
    update public.links l
       set content = '', viewed_at = now(), expires_at = now()
      from (
        select code, content from public.links
         where code = v_link.code and viewed_at is null and expires_at > now()
         for update
      ) prev
     where l.code = prev.code
    returning prev.content into v_content;

    if not found then
      return json_build_object('status', 'viewed', 'server_now', now());
    end if;
  else
    v_content := v_link.content;
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
    'content', v_content,
    'created_at', v_link.created_at,
    'expires_at', case when v_link.one_view then now() else v_link.expires_at end,
    'one_view', v_link.one_view,
    'server_now', now()
  );
end;
$$;

revoke execute on function public.get_link(text) from public, anon, authenticated;
grant execute on function public.get_link(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_my_links: also tell the creator which of their links are one-view
-- ---------------------------------------------------------------------------
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
      'expires_at', l.expires_at,
      'one_view', l.one_view
    )), '[]'::json)
  )
  from unnest(p_codes[1:20], p_tokens[1:20]) as mine(code, token)
  join public.links l
    on l.code = mine.code
   and l.edit_token_hash = public._hash_token(mine.token)
   and l.expires_at > now();
$$;

revoke execute on function public.get_my_links(text[], text[]) from public, anon, authenticated;
grant execute on function public.get_my_links(text[], text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Daily roll-up: show one-view links as their own expiry choice
-- ---------------------------------------------------------------------------
drop view if exists public.link_stats_daily;

create view public.link_stats_daily
with (security_invoker = true) as
select
  (created_at at time zone 'UTC')::date                     as day,
  coalesce(country, '??')                                   as country,
  case when one_view then '1 view'
       when expiry_minutes = 10 then '10 min'
       when expiry_minutes = 60 then '1 hour'
       else '1 day' end                                     as expiry,
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
