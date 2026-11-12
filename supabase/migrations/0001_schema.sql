-- IITD Live: schema, roles, row-level security and ticketing functions.
-- Business rules live here (not in the browser) so they can't be bypassed:
-- registration eligibility, capacity + waitlist, teams, and gate check-in by assigned checkers.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- roles + people

create type public.user_role as enum ('student', 'organiser', 'checker', 'admin');

-- One row per person. Real accounts share their id with auth.users; seeded demo attendees have no login.
create table public.profiles (
  id uuid primary key,
  email text not null,
  name text not null default '',
  entry_no text not null default '',
  hostel text not null default '',
  phone text not null default '',
  role public.user_role not null default 'student',
  is_iitd boolean generated always as (email ~* 'iitd\.ac\.in$') stored,
  created_at timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));

-- ---------------------------------------------------------------- catalogue

create table public.clubs (
  id text primary key default 'c_' || substr(md5(gen_random_uuid()::text), 1, 10),
  name text not null check (length(trim(name)) >= 2),
  slug text not null unique,
  owner_id uuid references public.profiles (id) on delete set null,
  verified boolean not null default false,
  instagram text not null default '',
  created_at timestamptz not null default now()
);
create unique index clubs_name_key on public.clubs (lower(name));

create table public.fests (
  id text primary key,
  name text not null,
  slug text not null unique,
  starts_on date,
  ends_on date,
  tagline text not null default '',
  dates_tbc boolean not null default false,
  sample boolean not null default false,
  cover text check (cover ~ '^[a-z0-9-]{1,40}$')
);

create table public.events (
  id text primary key default 'e_' || substr(md5(gen_random_uuid()::text), 1, 12),
  club_id text not null references public.clubs (id) on delete cascade,
  fest_id text references public.fests (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  category text not null default 'Other',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text not null default '',
  poster_emoji text not null default '🎉',
  poster_color text not null default '#4F46E5' check (poster_color ~ '^#[0-9A-Fa-f]{6}$'),
  cover text check (cover ~ '^[a-z0-9-]{1,40}$'),
  price integer not null default 0 check (price >= 0),
  eligibility text not null default 'open' check (eligibility in ('open', 'iitd_only')),
  iitd_first_until timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  overbook_pct integer not null default 0 check (overbook_pct between 0 and 100),
  reg_mode text not null default 'platform' check (reg_mode in ('platform', 'external')),
  external_url text,
  team_min integer not null default 1 check (team_min >= 1),
  team_max integer not null default 1,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  live_note text,
  live_note_at timestamptz,
  sample boolean not null default false,
  -- Sample (demo) events are re-dated daily: day offset from today (IST), start time and length.
  sample_day integer,
  sample_start time,
  sample_minutes integer,
  sample_first_minutes integer, -- IITD-first window ends this many minutes before the start
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (team_max >= team_min),
  check (reg_mode = 'platform' or external_url ~* '^https?://'),
  check (iitd_first_until is null or iitd_first_until <= starts_at)
);
create index events_starts_at_idx on public.events (starts_at);
create index events_club_idx on public.events (club_id);

-- ---------------------------------------------------------------- tickets

create table public.teams (
  id text primary key default 't_' || substr(md5(gen_random_uuid()::text), 1, 10),
  event_id text not null references public.events (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  captain_id uuid references public.profiles (id) on delete set null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);
create unique index teams_event_name_key on public.teams (event_id, lower(name));

-- A registration IS the ticket: its qr_token is the pass code shown under the QR.
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id text references public.teams (id) on delete set null,
  status text not null check (status in ('confirmed', 'waitlisted', 'cancelled', 'checked_in')),
  qr_token text not null unique,
  amount_due integer not null default 0 check (amount_due >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles (id) on delete set null,
  unique (event_id, user_id)
);
create index registrations_event_status_idx on public.registrations (event_id, status);

-- Gate staff: who may scan passes for which event.
create table public.event_staff (
  event_id text not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Every scan at the gate, admitted or not.
create table public.checkin_log (
  id bigint generated always as identity primary key,
  event_id text references public.events (id) on delete cascade,
  registration_id uuid references public.registrations (id) on delete set null,
  code text not null,
  result text not null,
  scanned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index checkin_log_event_idx on public.checkin_log (event_id, created_at desc);

-- ---------------------------------------------------------------- helpers

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_manage_club(cid text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.clubs where id = cid and owner_id = auth.uid());
$$;

create or replace function public.can_manage_event(eid text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.events e join public.clubs c on c.id = e.club_id
    where e.id = eid and c.owner_id = auth.uid());
$$;

create or replace function public.can_check_event(eid text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_manage_event(eid)
      or exists (select 1 from public.event_staff where event_id = eid and user_id = auth.uid());
$$;

-- Pass codes like 7KQ4-M2XP: no 0/O or 1/I/L, so they can be typed at the gate.
create or replace function public.gen_code(n integer) returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(n);
  out text := '';
begin
  for i in 0 .. n - 1 loop
    out := out || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return out;
end $$;

create or replace function public.new_pass_code() returns text
language plpgsql volatile set search_path = public as $$
declare c text;
begin
  loop
    c := public.gen_code(8);
    c := substr(c, 1, 4) || '-' || substr(c, 5, 4);
    exit when not exists (select 1 from public.registrations where qr_token = c);
  end loop;
  return c;
end $$;

-- Accept "7kq4m2xp", " 7KQ4-M2XP ", or a scanned URL ending in the code.
create or replace function public.norm_code(raw text) returns text
language sql immutable set search_path = public as $$
  select case when length(k) = 8 then substr(k, 1, 4) || '-' || substr(k, 5, 4) else k end
  from (select upper(regexp_replace(coalesce(regexp_replace(raw, '^.*[/:#?=]', ''), ''), '[^A-Za-z0-9]', '', 'g')) as k) s;
$$;

create or replace function public.seat_limit(ev public.events) returns numeric
language sql immutable as $$
  select case when ev.capacity is null then 'infinity'::numeric
              else floor(ev.capacity * (1 + ev.overbook_pct / 100.0)) end;
$$;

create or replace function public.going_count(eid text) returns integer
language sql stable set search_path = public as $$
  select count(*)::int from public.registrations where event_id = eid and status in ('confirmed', 'checked_in');
$$;

-- Fill freed seats from the waitlist, oldest first.
create or replace function public.promote_waitlist(eid text) returns void
language plpgsql security definer set search_path = public as $$
declare
  ev public.events;
  free_seats numeric;
begin
  select * into ev from public.events where id = eid;
  if not found then return; end if;
  free_seats := public.seat_limit(ev) - public.going_count(eid);
  if free_seats <= 0 then return; end if;
  update public.registrations set status = 'confirmed'
  where id in (
    select id from public.registrations
    where event_id = eid and status = 'waitlisted'
    order by created_at
    limit case when free_seats = 'infinity' then null else free_seats::int end);
end $$;

-- ---------------------------------------------------------------- guard triggers

-- New auth users get a profile.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins (or trusted functions in this file) change roles; nobody changes their email here.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(current_setting('iitdlive.trusted', true), '') <> 'on' then
    raise exception 'Only admins can change roles.';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Email cannot be changed here.';
  end if;
  new.name := trim(new.name);
  new.entry_no := upper(trim(new.entry_no));
  new.phone := trim(new.phone);
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Verifying clubs and featuring events are admin decisions.
create or replace function public.guard_club() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('iitdlive.trusted', true), '') <> 'on' then
    new.verified := case when tg_op = 'INSERT' then false else old.verified end;
    if tg_op = 'UPDATE' then new.owner_id := old.owner_id; end if;
  end if;
  return new;
end $$;
create trigger guard_club before insert or update on public.clubs
  for each row execute function public.guard_club();

create or replace function public.guard_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('iitdlive.trusted', true), '') <> 'on' then
    new.featured := case when tg_op = 'INSERT' then false else old.featured end;
    if tg_op = 'INSERT' then new.sample := false; end if;
  end if;
  if new.reg_mode = 'external' then new.capacity := null; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_event before insert or update on public.events
  for each row execute function public.guard_event();

-- Capacity may have grown: let the waitlist in.
create or replace function public.after_event_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.capacity is distinct from old.capacity or new.overbook_pct is distinct from old.overbook_pct then
    perform public.promote_waitlist(new.id);
  end if;
  return new;
end $$;
create trigger after_event_change after update on public.events
  for each row execute function public.after_event_change();

-- ---------------------------------------------------------------- row-level security

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.fests enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.registrations enable row level security;
alter table public.event_staff enable row level security;
alter table public.checkin_log enable row level security;

create policy "own profile or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "edit own profile or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "clubs are public" on public.clubs for select to anon, authenticated using (true);
create policy "manage own club" on public.clubs for update to authenticated
  using (public.can_manage_club(id)) with check (public.can_manage_club(id));
create policy "admins delete clubs" on public.clubs for delete to authenticated using (public.is_admin());

create policy "fests are public" on public.fests for select to anon, authenticated using (true);
create policy "admins manage fests" on public.fests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "published events are public" on public.events for select to anon, authenticated
  using (status = 'published' or public.can_check_event(id));
create policy "organisers add events" on public.events for insert to authenticated
  with check (public.can_manage_club(club_id));
create policy "organisers edit events" on public.events for update to authenticated
  using (public.can_manage_event(id)) with check (public.can_manage_club(club_id));
create policy "organisers delete events" on public.events for delete to authenticated
  using (public.can_manage_event(id));

create policy "team members and staff see teams" on public.teams for select to authenticated
  using (captain_id = auth.uid()
         or exists (select 1 from public.registrations r where r.team_id = teams.id and r.user_id = auth.uid())
         or public.can_check_event(event_id));

create policy "own tickets; staff see their event" on public.registrations for select to authenticated
  using (user_id = auth.uid() or public.can_check_event(event_id));

create policy "see own staff rows; organisers see their event" on public.event_staff for select to authenticated
  using (user_id = auth.uid() or public.can_manage_event(event_id));

create policy "organisers see their gate log" on public.checkin_log for select to authenticated
  using (public.can_manage_event(event_id));

-- ---------------------------------------------------------------- public read functions

-- Aggregates only: going / waitlist / hostel counts. Names are never exposed.
create or replace function public.event_counts()
returns table (event_id text, going integer, waitlisted integer, checked_in integer, by_hostel jsonb)
language sql stable security definer set search_path = public as $$
  with r as (
    select r.event_id, r.status,
           case when p.hostel <> '' then p.hostel when p.is_iitd then 'Day Scholar' else 'Outside IITD' end as hostel
    from public.registrations r join public.profiles p on p.id = r.user_id
    join public.events e on e.id = r.event_id and (e.status = 'published' or public.can_check_event(e.id))
    where r.status <> 'cancelled'
  ), h as (
    select event_id, hostel, count(*)::int n from r where status in ('confirmed', 'checked_in') group by 1, 2
  )
  select e.event_id,
         count(*) filter (where e.status in ('confirmed', 'checked_in'))::int,
         count(*) filter (where e.status = 'waitlisted')::int,
         count(*) filter (where e.status = 'checked_in')::int,
         coalesce((select jsonb_object_agg(h.hostel, h.n order by h.n desc) from h where h.event_id = e.event_id), '{}'::jsonb)
  from r e group by e.event_id;
$$;

-- Anyone with an invite code may see the team and its members' first names.
create or replace function public.team_by_code(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'team', to_jsonb(t),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'hostel', p.hostel, 'captain', p.id = t.captain_id)
                       order by (p.id = t.captain_id) desc, r.created_at)
      from public.registrations r join public.profiles p on p.id = r.user_id
      where r.team_id = t.id and r.status <> 'cancelled'), '[]'::jsonb))
  from public.teams t where t.invite_code = upper(trim(p_code));
$$;

-- ---------------------------------------------------------------- student actions

create or replace function public.register(p_event text, p_team_name text default null, p_team_code text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  ev public.events;
  existing public.registrations;
  tm public.teams;
  code text := upper(trim(coalesce(p_team_code, '')));
  tname text := trim(coalesce(p_team_name, ''));
  st text;
  reg public.registrations;
begin
  select * into me from public.profiles where id = auth.uid();
  if not found then raise exception 'Log in to register.'; end if;
  -- Lock the event row: registrations for one event are serialised, so capacity can't be oversold.
  select * into ev from public.events where id = p_event and status = 'published' for update;
  if not found then raise exception 'Event not found.'; end if;
  if ev.reg_mode = 'external' then raise exception 'Registration for this event happens on the organiser''s site.'; end if;
  if now() >= ev.starts_at then raise exception 'Registration has closed for this event.'; end if;
  if not me.is_iitd then
    if ev.eligibility = 'iitd_only' then raise exception 'This event is only for IIT Delhi students.'; end if;
    if ev.iitd_first_until is not null and now() < ev.iitd_first_until then
      raise exception 'IITD students get first access until %.',
        to_char(ev.iitd_first_until at time zone 'Asia/Kolkata', 'Dy DD Mon, HH12:MI AM');
    end if;
  end if;
  select * into existing from public.registrations where event_id = ev.id and user_id = me.id;
  if found and existing.status <> 'cancelled' then raise exception 'You''re already registered for this event.'; end if;

  if ev.team_max > 1 then
    if code <> '' then
      select * into tm from public.teams where invite_code = code and event_id = ev.id;
      if not found then raise exception 'That team code is not valid for this event.'; end if;
      if (select count(*) from public.registrations where team_id = tm.id and status <> 'cancelled') >= ev.team_max then
        raise exception 'This team is full (max %).', ev.team_max;
      end if;
    elsif tname <> '' then
      if exists (select 1 from public.teams where event_id = ev.id and lower(name) = lower(tname)) then
        raise exception 'A team with that name already exists for this event.';
      end if;
      insert into public.teams (event_id, name, captain_id, invite_code)
      values (ev.id, tname, me.id, (select c from (select public.gen_code(6) c) x)) returning * into tm;
    elsif ev.team_min > 1 then
      raise exception 'This is a team event (%-% people). Create a team or join one with a code.', ev.team_min, ev.team_max;
    end if;
  end if;

  st := case when public.going_count(ev.id) < public.seat_limit(ev) then 'confirmed' else 'waitlisted' end;
  if existing.id is not null then
    update public.registrations
       set status = st, team_id = tm.id, qr_token = public.new_pass_code(), amount_due = ev.price,
           paid_at = null, created_at = now(), checked_in_at = null, checked_in_by = null
     where id = existing.id returning * into reg;
  else
    insert into public.registrations (event_id, user_id, team_id, status, qr_token, amount_due)
    values (ev.id, me.id, tm.id, st, public.new_pass_code(), ev.price) returning * into reg;
  end if;
  return jsonb_build_object('registration', to_jsonb(reg), 'team', case when tm.id is null then null else to_jsonb(tm) end);
end $$;

create or replace function public.cancel_registration(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare reg public.registrations;
begin
  select * into reg from public.registrations where id = p_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if reg.user_id <> auth.uid() and not public.can_manage_event(reg.event_id) then
    raise exception 'You can only cancel your own registration.';
  end if;
  if reg.status = 'checked_in' then raise exception 'Already checked in, so this pass can no longer be cancelled.'; end if;
  if reg.status <> 'cancelled' then
    update public.registrations set status = 'cancelled' where id = p_id returning * into reg;
    perform public.promote_waitlist(reg.event_id);
  end if;
  return to_jsonb(reg);
end $$;

-- ---------------------------------------------------------------- organiser actions

create or replace function public.create_club(p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  clean text := trim(coalesce(p_name, ''));
  base text;
  s text;
  i int := 2;
  club public.clubs;
begin
  select * into me from public.profiles where id = auth.uid();
  if not found then raise exception 'Please log in first.'; end if;
  if length(clean) < 2 then raise exception 'Club name is too short.'; end if;
  if exists (select 1 from public.clubs where lower(name) = lower(clean)) then raise exception 'A club with that name already exists.'; end if;
  base := coalesce(nullif(trim(both '-' from regexp_replace(lower(clean), '[^a-z0-9]+', '-', 'g')), ''), 'club');
  s := base;
  while exists (select 1 from public.clubs where slug = s) loop s := base || '-' || i; i := i + 1; end loop;
  insert into public.clubs (name, slug, owner_id) values (clean, s, me.id) returning * into club;
  if me.role = 'student' or me.role = 'checker' then
    perform set_config('iitdlive.trusted', 'on', true);
    update public.profiles set role = 'organiser' where id = me.id;
  end if;
  return to_jsonb(club);
end $$;

create or replace function public.post_update(p_event text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_event(p_event) then raise exception 'Not your event.'; end if;
  update public.events set live_note = nullif(trim(p_note), ''),
         live_note_at = case when nullif(trim(p_note), '') is null then null else now() end
   where id = p_event;
end $$;

-- Full attendee list for the event's organiser, its gate staff, and admins.
create or replace function public.attendees(p_event text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_check_event(p_event) then raise exception 'Not your event.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'registration', to_jsonb(r),
      'profile', jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email, 'entry_no', p.entry_no,
                                    'hostel', p.hostel, 'phone', p.phone, 'is_iitd', p.is_iitd),
      'team', to_jsonb(t)) order by r.created_at)
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    left join public.teams t on t.id = r.team_id
    where r.event_id = p_event and r.status <> 'cancelled'), '[]'::jsonb);
end $$;

-- Gate staff, assigned by email. Assigning makes a plain student a "checker".
create or replace function public.add_checker(p_event text, p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare who public.profiles;
begin
  if not public.can_manage_event(p_event) then raise exception 'Not your event.'; end if;
  select * into who from public.profiles where lower(email) = lower(trim(p_email));
  if not found then raise exception 'No account with that email yet. Ask them to sign up first.'; end if;
  insert into public.event_staff (event_id, user_id, added_by) values (p_event, who.id, auth.uid())
  on conflict do nothing;
  if who.role = 'student' then
    perform set_config('iitdlive.trusted', 'on', true);
    update public.profiles set role = 'checker' where id = who.id;
  end if;
  return jsonb_build_object('id', who.id, 'name', who.name, 'email', who.email);
end $$;

create or replace function public.remove_checker(p_event text, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_event(p_event) then raise exception 'Not your event.'; end if;
  delete from public.event_staff where event_id = p_event and user_id = p_user;
end $$;

create or replace function public.event_checkers(p_event text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.can_manage_event(p_event) then coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email) order by s.created_at)
    from public.event_staff s join public.profiles p on p.id = s.user_id where s.event_id = p_event), '[]'::jsonb)
  else '[]'::jsonb end;
$$;

-- Events this person can scan for (assigned, organiser of, or admin), most current first.
create or replace function public.my_gate_events() returns setof public.events
language sql stable security definer set search_path = public as $$
  select e.* from public.events e
  where e.status = 'published' and e.reg_mode = 'platform' and e.ends_at > now() - interval '12 hours'
    and public.can_check_event(e.id)
  order by e.starts_at;
$$;

-- ---------------------------------------------------------------- gate: verify + admit

create or replace function public.ticket_card(reg public.registrations) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'registration_id', reg.id, 'code', reg.qr_token, 'status', reg.status,
    'amount_due', reg.amount_due, 'paid_at', reg.paid_at,
    'checked_in_at', reg.checked_in_at,
    'checked_in_by', (select name from public.profiles where id = reg.checked_in_by),
    'holder', (select jsonb_build_object('name', p.name, 'entry_no', p.entry_no, 'hostel', p.hostel,
                                         'is_iitd', p.is_iitd, 'email', p.email)
               from public.profiles p where p.id = reg.user_id),
    'team', (select name from public.teams where id = reg.team_id),
    'event', (select jsonb_build_object('id', e.id, 'title', e.title, 'venue', e.venue, 'starts_at', e.starts_at,
                                        'eligibility', e.eligibility, 'price', e.price)
              from public.events e where e.id = reg.event_id));
$$;

-- Look a pass up without admitting it, so the checker can match the name to the ID card first.
create or replace function public.ticket_lookup(p_code text, p_event text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c text := public.norm_code(p_code);
  reg public.registrations;
begin
  if auth.uid() is null then raise exception 'Log in to check tickets.'; end if;
  select * into reg from public.registrations where qr_token = c;
  if not found then
    insert into public.checkin_log (event_id, code, result, scanned_by)
    select p_event, coalesce(nullif(c, ''), '?'), 'invalid', auth.uid() where p_event is null or exists (select 1 from public.events where id = p_event);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if not public.can_check_event(reg.event_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_staff');
  end if;
  if p_event is not null and reg.event_id <> p_event then
    insert into public.checkin_log (event_id, registration_id, code, result, scanned_by) values (p_event, reg.id, c, 'wrong_event', auth.uid());
    return jsonb_build_object('ok', false, 'reason', 'wrong_event', 'ticket', public.ticket_card(reg));
  end if;
  return jsonb_build_object('ok', reg.status = 'confirmed', 'reason',
    case reg.status when 'confirmed' then case when reg.amount_due > 0 and reg.paid_at is null then 'unpaid' else 'valid' end
                    when 'checked_in' then 'already' else reg.status end,
    'ticket', public.ticket_card(reg));
end $$;

-- Admit: marks the pass used. p_collect = the checker took the cash for an unpaid ticket.
create or replace function public.ticket_admit(p_code text, p_event text, p_collect boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c text := public.norm_code(p_code);
  reg public.registrations;
  res text;
begin
  if auth.uid() is null then raise exception 'Log in to check tickets.'; end if;
  select * into reg from public.registrations where qr_token = c for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  if not public.can_check_event(reg.event_id) then return jsonb_build_object('ok', false, 'reason', 'not_staff'); end if;
  if reg.event_id <> p_event then return jsonb_build_object('ok', false, 'reason', 'wrong_event', 'ticket', public.ticket_card(reg)); end if;
  res := case
    when reg.status = 'checked_in' then 'already'
    when reg.status = 'cancelled' then 'cancelled'
    when reg.status = 'waitlisted' then 'waitlisted'
    when reg.amount_due > 0 and reg.paid_at is null and not p_collect then 'unpaid'
    else 'admitted' end;
  if res = 'admitted' then
    update public.registrations
       set status = 'checked_in', checked_in_at = now(), checked_in_by = auth.uid(),
           paid_at = case when amount_due > 0 and paid_at is null then now() else paid_at end
     where id = reg.id returning * into reg;
  end if;
  insert into public.checkin_log (event_id, registration_id, code, result, scanned_by)
  values (reg.event_id, reg.id, c, res, auth.uid());
  return jsonb_build_object('ok', res = 'admitted', 'reason', res, 'ticket', public.ticket_card(reg));
end $$;

-- Recent scans for one event (organisers, admins and the event's checkers).
create or replace function public.gate_log(p_event text, p_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_check_event(p_event) then raise exception 'Not your event.'; end if;
  return coalesce((
    select jsonb_agg(x order by x->>'at' desc) from (
      select jsonb_build_object('at', l.created_at, 'result', l.result, 'code', l.code,
                                'holder', p.name, 'by', s.name) x
      from public.checkin_log l
      left join public.registrations r on r.id = l.registration_id
      left join public.profiles p on p.id = r.user_id
      left join public.profiles s on s.id = l.scanned_by
      where l.event_id = p_event
      order by l.created_at desc limit greatest(1, least(p_limit, 500))) y), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------- admin

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return jsonb_build_object(
    'people', (select count(*) from public.profiles),
    'accounts', (select count(*) from auth.users),
    'by_role', (select jsonb_object_agg(role, n) from (select role, count(*) n from public.profiles group by role) x),
    'clubs', (select count(*) from public.clubs),
    'unverified_clubs', (select count(*) from public.clubs where not verified),
    'events', (select count(*) from public.events where status = 'published'),
    'upcoming', (select count(*) from public.events where status = 'published' and ends_at > now()),
    'tickets', (select count(*) from public.registrations where status in ('confirmed', 'checked_in')),
    'waitlisted', (select count(*) from public.registrations where status = 'waitlisted'),
    'checked_in', (select count(*) from public.registrations where status = 'checked_in'),
    'checked_in_today', (select count(*) from public.registrations
                          where checked_in_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'),
    'revenue_collected', (select coalesce(sum(amount_due), 0) from public.registrations where paid_at is not null),
    'scans_today', (select count(*) from public.checkin_log
                     where created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'));
end $$;

-- People search for the admin panel (real accounts first).
create or replace function public.admin_people(p_q text default '', p_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  return coalesce((
    select jsonb_agg(x) from (
      select jsonb_build_object('id', p.id, 'name', p.name, 'email', p.email, 'role', p.role, 'hostel', p.hostel,
                                'entry_no', p.entry_no, 'is_iitd', p.is_iitd,
                                'has_login', exists (select 1 from auth.users u where u.id = p.id),
                                'tickets', (select count(*) from public.registrations r where r.user_id = p.id and r.status <> 'cancelled'),
                                'staff_for', (select count(*) from public.event_staff s where s.user_id = p.id)) x
      from public.profiles p
      where coalesce(p_q, '') = '' or p.name ilike '%' || p_q || '%' or p.email ilike '%' || p_q || '%'
         or p.entry_no ilike '%' || p_q || '%'
      order by exists (select 1 from auth.users u where u.id = p.id) desc, p.role desc, p.name
      limit greatest(1, least(p_limit, 200))) y), '[]'::jsonb);
end $$;

create or replace function public.set_role(p_user uuid, p_role public.user_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if p_user = auth.uid() and p_role <> 'admin' then raise exception 'You can''t remove your own admin role.'; end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- ---------------------------------------------------------------- demo data upkeep

-- Sample events are re-dated every day so "Tonight" is never empty in the demo.
create or replace function public.roll_sample_dates() returns void
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  perform set_config('iitdlive.trusted', 'on', true);
  update public.events e set
    starts_at = ((today + e.sample_day) + e.sample_start) at time zone 'Asia/Kolkata',
    ends_at = ((today + e.sample_day) + e.sample_start) at time zone 'Asia/Kolkata' + make_interval(mins => e.sample_minutes),
    iitd_first_until = case when e.sample_first_minutes is null then null
      else ((today + e.sample_day) + e.sample_start) at time zone 'Asia/Kolkata' - make_interval(mins => e.sample_first_minutes) end,
    live_note_at = case when e.live_note is null then null else now() - interval '20 minutes' end
  where e.sample and e.sample_day is not null;
  update public.fests set starts_on = today, ends_on = today + 2 where sample;
end $$;

-- ---------------------------------------------------------------- grants

-- Nothing is callable unless listed below (internal helpers such as ticket_card stay private).
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.event_counts(), public.team_by_code(text) to anon, authenticated;
grant execute on function
  public.register(text, text, text), public.cancel_registration(uuid), public.create_club(text),
  public.post_update(text, text), public.attendees(text), public.add_checker(text, text),
  public.remove_checker(text, uuid), public.event_checkers(text), public.my_gate_events(),
  public.ticket_lookup(text, text), public.ticket_admit(text, text, boolean), public.gate_log(text, integer),
  public.admin_overview(), public.admin_people(text, integer), public.set_role(uuid, public.user_role),
  public.is_admin(), public.can_manage_club(text), public.can_manage_event(text), public.can_check_event(text)
  to authenticated;
-- Helpers used inside RLS policies must stay callable by the roles those policies apply to.
grant execute on function public.can_check_event(text), public.can_manage_event(text), public.is_admin(),
  public.can_manage_club(text) to anon;
