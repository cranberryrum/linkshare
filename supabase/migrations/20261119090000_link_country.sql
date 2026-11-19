/*
  Links: record the country a link was created from.

  - country is a 2-letter code: Cloudflare's cf-ipcountry header when the
    platform sends one, otherwise the code the app looked up from Netlify
    (/api/geo). The IP itself is never stored.
  - Note: link rows are short-lived. The cleanup job deletes a row a day
    after it expires, and an expired code can be reused (which overwrites
    the row), so this column only describes recent links.
*/

alter table public.links
  add column country text check (country ~ '^[A-Z]{2}$');

-- Same as before, plus p_country. It defaults to NULL so an older cached app
-- that sends only (p_content, p_minutes) keeps working.
drop function if exists public.create_link(text, int);

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

  for i in 1..30 loop
    v_code := lpad(((('x' || substr(md5(gen_random_uuid()::text), 1, 8))::bit(32)::bigint) % 10000)::text, 4, '0');

    -- Take the code if it's free or its previous link has expired.
    insert into public.links (code, content, edit_token_hash, expires_at, country)
    values (v_code, p_content, public._hash_token(v_token), v_expires, v_country)
    on conflict (code) do update
      set content = excluded.content,
          edit_token_hash = excluded.edit_token_hash,
          created_at = now(),
          expires_at = excluded.expires_at,
          country = excluded.country
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

revoke execute on function public.create_link(text, int, text) from public, anon, authenticated;
grant execute on function public.create_link(text, int, text) to anon, authenticated;
