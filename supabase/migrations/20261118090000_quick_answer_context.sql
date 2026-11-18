/*
  Quick answers: who answered, without knowing who they are.

  Adds context to each answer so answers can be split by country and by new
  vs returning users. Nothing here identifies a person:
  - country is a 2-letter code (from Netlify's geo lookup, or Cloudflare's
    cf-ipcountry header when present). The IP itself is never stored.
  - device_id is the random ID the app already keeps in the browser (the same
    anonymous ID PostHog sees). It lets you see repeat answers from one device.
  - usage counts come from the browser's own local tally, not from tracking.

  The client sends everything in one p_context JSON object. Each field is
  checked and clipped here, so bad or missing values become NULL rather than
  failing the answer.
*/

alter table public.quick_answers
  add column country         text check (country ~ '^[A-Z]{2}$'),
  add column device_id       uuid,
  add column is_returning    boolean,
  add column visit_days      integer check (visit_days >= 0),
  add column drops_made      integer check (drops_made >= 0),
  add column codes_received  integer check (codes_received >= 0),
  add column first_seen_at   timestamptz,
  add column device_type     text check (device_type in ('mobile', 'tablet', 'desktop')),
  add column is_installed    boolean,
  add column page            text check (char_length(page) <= 100),
  add column language        text check (char_length(language) <= 35),
  add column timezone        text check (char_length(timezone) <= 64);

create index quick_answers_created_at_idx on public.quick_answers (created_at);
create index quick_answers_device_id_idx on public.quick_answers (device_id);

-- Replace the 2-argument version with one that also takes context.
-- p_context defaults to '{}', so callers that send only question + answer
-- (older cached copies of the app) keep working.
drop function if exists public.submit_quick_answer(text, text);

create or replace function public.submit_quick_answer(
  p_question text,
  p_answer   text,
  p_context  jsonb default '{}'::jsonb
)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_ctx     jsonb := case when jsonb_typeof(p_context) = 'object' then p_context else '{}'::jsonb end;
  v_headers json  := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_country text;
  v_device  uuid;
  v_first   timestamptz;
  v_type    text;

  -- Read a non-negative integer, or NULL
  v_visits  integer;
  v_drops   integer;
  v_recv    integer;
begin
  if public._rate_limited('feedback', 20, interval '10 minutes') then
    return json_build_object('status', 'rate_limited');
  end if;

  -- Country: the edge header if the platform provides one, else what the
  -- app looked up from Netlify. Only a valid 2-letter code is kept.
  v_country := upper(coalesce(v_headers ->> 'cf-ipcountry', v_ctx ->> 'country'));
  if v_country !~ '^[A-Z]{2}$' or v_country in ('XX', 'T1') then
    v_country := null;
  end if;

  begin v_device := (v_ctx ->> 'device_id')::uuid; exception when others then v_device := null; end;
  begin v_first := (v_ctx ->> 'first_seen_at')::timestamptz; exception when others then v_first := null; end;
  if v_first > now() then v_first := null; end if;

  v_visits := case when (v_ctx ->> 'visit_days') ~ '^\d{1,6}$' then (v_ctx ->> 'visit_days')::int end;
  v_drops  := case when (v_ctx ->> 'drops_made') ~ '^\d{1,6}$' then (v_ctx ->> 'drops_made')::int end;
  v_recv   := case when (v_ctx ->> 'codes_received') ~ '^\d{1,6}$' then (v_ctx ->> 'codes_received')::int end;

  v_type := v_ctx ->> 'device_type';
  if v_type not in ('mobile', 'tablet', 'desktop') then v_type := null; end if;

  begin
    insert into public.quick_answers (
      question, answer,
      country, device_id, is_returning, visit_days, drops_made, codes_received,
      first_seen_at, device_type, is_installed, page, language, timezone
    )
    values (
      p_question, p_answer,
      v_country,
      v_device,
      case when jsonb_typeof(v_ctx -> 'is_returning') = 'boolean' then (v_ctx ->> 'is_returning')::boolean end,
      v_visits,
      v_drops,
      v_recv,
      v_first,
      v_type,
      case when jsonb_typeof(v_ctx -> 'is_installed') = 'boolean' then (v_ctx ->> 'is_installed')::boolean end,
      left(v_ctx ->> 'page', 100),
      left(v_ctx ->> 'language', 35),
      left(v_ctx ->> 'timezone', 64)
    )
    returning id into v_id;
  exception when check_violation then
    return json_build_object('status', 'invalid');
  end;

  insert into public.rate_events (client_key, kind) values (public._client_key(), 'feedback');
  return json_build_object('status', 'ok', 'id', v_id);
end;
$$;

revoke execute on function public.submit_quick_answer(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_quick_answer(text, text, jsonb) to anon, authenticated;

-- One row per device with its latest answer per question and how many times
-- it has answered: handy for "new vs returning" in the Supabase dashboard.
-- Not exposed to the app (no grants to anon).
create or replace view public.quick_answers_summary
with (security_invoker = true) as
select
  question,
  answer,
  coalesce(country, '??')                                   as country,
  case when is_returning then 'returning'
       when is_returning is false then 'new'
       else 'unknown' end                                   as visitor,
  device_type,
  count(*)                                                  as answers,
  count(distinct device_id)                                 as devices
from public.quick_answers
group by 1, 2, 3, 4, 5;

revoke all on public.quick_answers_summary from anon, authenticated;
