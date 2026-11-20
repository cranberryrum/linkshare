/*
  One-view links: the creator can look without using up the view.

  get_link takes an optional p_token: the private edit token that only the
  creator's device holds (the same one used to edit and delete). When it
  matches, the content is returned without consuming a one-view link and
  without counting a receive in link_stats. Everyone else is unchanged.

  Replaces get_link(text) with get_link(text, text default null), so an
  older app that sends only the code keeps working. Safe to run more than
  once.
*/

drop function if exists public.get_link(text);

create or replace function public.get_link(p_code text, p_token text default null)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_link    public.links;
  v_content text;
  v_is_creator boolean := false;
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

  -- The creator's device proves itself with the link's private edit token.
  -- Their own look never uses up a one-view link or counts as a receive.
  v_is_creator := p_token is not null
                  and v_link.edit_token_hash = public._hash_token(p_token);

  -- Already opened once: say so instead of "expired" (and it isn't a guess)
  if v_link.viewed_at is not null then
    return json_build_object('status', 'viewed', 'server_now', now());
  end if;

  if v_link.expires_at <= now() then
    insert into public.rate_events (client_key, kind) values (public._client_key(), 'failed_lookup');
    return json_build_object('status', 'expired', 'server_now', now());
  end if;

  if v_link.one_view and not v_is_creator then
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

  if v_link.stats_id is not null and not v_is_creator then
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
    'expires_at', case when v_link.one_view and not v_is_creator then now() else v_link.expires_at end,
    'one_view', v_link.one_view,
    'server_now', now()
  );
end;
$$;

revoke execute on function public.get_link(text, text) from public, anon, authenticated;
grant execute on function public.get_link(text, text) to anon, authenticated;
