/*
  Quick question: a one-tap question shown under the content on the result
  screens. Answers live in our own database (not a third-party survey tool).

  - quick_answers is locked like links: no direct access, only the two
    functions below can write to it. Read answers in the Supabase dashboard.
  - Answers must be one of the known choices; the optional note is capped.
  - Rate limited per network (hashed IP), like link creation.
*/

create table public.quick_answers (
  id          uuid primary key default gen_random_uuid(),
  question    text not null check (question in ('drop_audience', 'receive_sender')),
  answer      text not null,
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now(),
  constraint quick_answers_valid_answer check (
    (question = 'drop_audience'  and answer in ('myself', 'someone_else', 'group')) or
    (question = 'receive_sender' and answer in ('me', 'someone_i_know', 'presenter'))
  )
);

alter table public.quick_answers enable row level security;
revoke all on table public.quick_answers from anon, authenticated;

-- Allow a new rate-limit bucket for feedback
alter table public.rate_events drop constraint rate_events_kind_check;
alter table public.rate_events add constraint rate_events_kind_check
  check (kind in ('create', 'failed_lookup', 'feedback'));

-- Record a one-tap answer. Returns the answer id so a note can follow.
create or replace function public.submit_quick_answer(p_question text, p_answer text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if public._rate_limited('feedback', 20, interval '10 minutes') then
    return json_build_object('status', 'rate_limited');
  end if;

  begin
    insert into public.quick_answers (question, answer)
    values (p_question, p_answer)
    returning id into v_id;
  exception when check_violation then
    return json_build_object('status', 'invalid');
  end;

  insert into public.rate_events (client_key, kind) values (public._client_key(), 'feedback');
  return json_build_object('status', 'ok', 'id', v_id);
end;
$$;

-- Attach the optional "what would make it better" note to a fresh answer.
-- Only once, and only within 15 minutes of answering.
create or replace function public.add_quick_note(p_id uuid, p_note text)
returns json
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_note is null or length(trim(p_note)) = 0 then
    return json_build_object('status', 'empty');
  end if;

  update public.quick_answers
     set note = left(trim(p_note), 280)
   where id = p_id
     and note is null
     and created_at > now() - interval '15 minutes';

  if not found then
    return json_build_object('status', 'not_allowed');
  end if;
  return json_build_object('status', 'ok');
end;
$$;

revoke execute on function public.submit_quick_answer(text, text) from public, anon, authenticated;
revoke execute on function public.add_quick_note(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_quick_answer(text, text) to anon, authenticated;
grant execute on function public.add_quick_note(uuid, text) to anon, authenticated;
