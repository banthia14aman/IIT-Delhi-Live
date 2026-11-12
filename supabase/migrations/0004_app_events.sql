-- Behaviour analytics: what people do in the app (page views, searches, register taps, shares, pass opens).
-- Pseudonymous: a random device id plus the account id when logged in; no names, emails or phones in here.
create table public.app_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  anon_id text not null check (length(anon_id) between 8 and 64),
  name text not null check (name in ('page_view', 'event_view', 'search', 'filter', 'register_click', 'share', 'pass_open', 'signup', 'login')),
  path text check (length(path) <= 200),
  source text check (length(source) <= 40),
  event_id text check (length(event_id) <= 60),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2000)
);
create index app_events_at on public.app_events (at);
create index app_events_name_at on public.app_events (name, at);
alter table public.app_events enable row level security;
-- ponytail: open insert (anyone can write events); add rate limiting if this ever gets abused.
create policy app_events_insert on public.app_events for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());
create policy app_events_admin_read on public.app_events for select to authenticated using (public.is_admin());
revoke all on public.app_events from anon, authenticated;
grant insert on public.app_events to anon, authenticated;
grant select on public.app_events to authenticated;

-- Funnel + top-lines for the admin panel over the last p_days days.
create or replace function public.admin_funnel(p_days integer default 7) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 90)));
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return jsonb_build_object(
    'days', greatest(1, least(p_days, 90)),
    'visitors', (select count(distinct anon_id) from public.app_events where at >= since),
    'event_viewers', (select count(distinct anon_id) from public.app_events where at >= since and name = 'event_view'),
    'register_clickers', (select count(distinct anon_id) from public.app_events where at >= since and name = 'register_click'),
    'registrations', (select count(*) from public.registrations where created_at >= since and status <> 'cancelled'),
    'checked_in', (select count(*) from public.registrations where checked_in_at >= since),
    'pass_opens', (select count(*) from public.app_events where at >= since and name = 'pass_open'),
    'shares', (select count(*) from public.app_events where at >= since and name = 'share'),
    'sources', coalesce((select jsonb_agg(x order by (x->>'n')::int desc) from (
        select jsonb_build_object('source', coalesce(source, 'direct'), 'n', count(distinct anon_id)) x
        from public.app_events where at >= since group by coalesce(source, 'direct') limit 8) y), '[]'::jsonb),
    'zero_searches', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('q', props->>'q', 'n', count(*)) x from public.app_events
        where at >= since and name = 'search' and (props->>'results')::int = 0 and coalesce(props->>'q', '') <> ''
        group by props->>'q' order by count(*) desc limit 8) y), '[]'::jsonb),
    'top_viewed', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('event_id', a.event_id, 'title', e.title, 'n', count(distinct a.anon_id)) x
        from public.app_events a join public.events e on e.id = a.event_id
        where a.at >= since and a.name = 'event_view' group by a.event_id, e.title order by count(distinct a.anon_id) desc limit 6) y), '[]'::jsonb));
end $$;
revoke execute on function public.admin_funnel(integer) from public, anon;
grant execute on function public.admin_funnel(integer) to authenticated;
