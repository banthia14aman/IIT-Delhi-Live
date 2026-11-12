// IITD Live data store, backed by Supabase (Postgres + Auth). Same API as store-local.js / CONTRACT.md, except:
//  - await store.ready before the first render; reads are then synchronous from an in-memory cache;
//  - every write is async and goes through RLS or a security-definer SQL function (supabase/migrations);
//  - data only some people may see (attendees, gate, admin) loads on first read, then re-renders via subscribe().
import { HOSTELS as SEED_HOSTELS, localDate } from './seed.js';

const SUPABASE_URL = 'https://kjtugsgxlslcbmmduzhg.supabase.co';
// Publishable key: public by design. Row-level security and the SQL functions decide what anyone can do.
const SUPABASE_KEY = 'sb_publishable_BXeLg55bG8Y8w_7RCVzMUg_FuGfnu-G';

export const HOSTELS = SEED_HOSTELS;
// ponytail: one shared, published password for the demo cast so a class can try every role.
export const DEMO_PASSWORD = 'iitdlive2026';
export const DEMO_ACCOUNTS = [
  { email: 'student@iitd.ac.in', label: 'IITD student' },
  { email: 'friend@gmail.com', label: 'Outsider (non-IITD friend)' },
  { email: 'organiser@iitd.ac.in', label: 'Organiser (Music Club, RDV Demo Fest)' },
  { email: 'checker@iitd.ac.in', label: 'Ticket checker (gate volunteer)' },
  { email: 'admin@iitd.ac.in', label: 'Admin' },
];

const sb = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const DAY = 24 * 60 * 60 * 1000;
const GOING = new Set(['confirmed', 'checked_in']);
const fail = (msg) => { throw new Error(msg); };
const clone = (x) => (x == null ? null : structuredClone(x));

const FRIENDLY = {
  'Invalid login credentials': 'Wrong email or password.',
  'Failed to fetch': 'Can’t reach the server. Check your connection and try again.',
};
async function q(promise) {
  const { data, error } = await promise;
  if (error) {
    const msg = error.message || String(error);
    fail(FRIENDLY[msg] || msg.replace(/^(new row violates|duplicate key).*/, 'That clashes with something that already exists.'));
  }
  return data;
}
const rpc = (fn, args) => q(sb.rpc(fn, args));

// ---------- cache ----------

let S = { events: [], clubs: [], fests: [], counts: new Map(), me: null, regs: [], teams: [] };
const listeners = new Set();
const notify = () => { for (const fn of [...listeners]) { try { fn(); } catch (err) { console.error(err); } } };

async function load() {
  const { data: { session } } = await sb.auth.getSession();
  const uid = session?.user?.id || null;
  const [events, clubs, fests, counts, me, regs] = await Promise.all([
    q(sb.from('events').select('*')),
    q(sb.from('clubs').select('*')),
    q(sb.from('fests').select('*')),
    rpc('event_counts'),
    uid ? q(sb.from('profiles').select('*').eq('id', uid).maybeSingle()) : null,
    uid ? q(sb.from('registrations').select('*').eq('user_id', uid)) : [],
  ]);
  const teamIds = [...new Set(regs.map((r) => r.team_id).filter(Boolean))];
  const teams = teamIds.length ? await q(sb.from('teams').select('*').in('id', teamIds)) : [];
  S = { events, clubs, fests, counts: new Map(counts.map((c) => [c.event_id, c])), me, regs, teams };
  lazy.clear();
  notify();
}

// Stale-while-revalidate for per-view data: returns what we have (or `fallback`) and refetches in the background.
const lazy = new Map();
function swr(key, fetcher, fallback, ttl = 15e3) {
  const c = lazy.get(key);
  if (!c || (!c.p && Date.now() - c.at > ttl)) {
    const entry = c || { at: 0, data: undefined, err: null };
    entry.p = fetcher()
      .then((d) => { entry.data = d; entry.err = null; }, (e) => { entry.err = e; })
      .finally(() => { entry.at = Date.now(); entry.p = null; notify(); });
    lazy.set(key, entry);
  }
  if (c?.err && c.data === undefined) throw c.err;
  return c?.data === undefined ? fallback : clone(c.data);
}

// Keep counts and passes current (other people register, checkers admit) without a reload.
if (typeof document !== 'undefined') {
  setInterval(() => { if (!document.hidden) load().catch(console.error); }, 60e3);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load().catch(console.error); });
}

// ---------- read helpers (mirroring store-local.js) ----------

const isAdmin = (p) => p?.role === 'admin';
const findEvent = (id) => S.events.find((e) => e.id === id) || null;
const findClub = (id) => S.clubs.find((c) => c.id === id) || null;
const canManageClub = (p, clubId) => !!p && (isAdmin(p) || findClub(clubId)?.owner_id === p.id);
const canManageEvent = (p, ev) => !!ev && canManageClub(p, ev.club_id);
const visible = (ev, me) => ev.status === 'published' || canManageEvent(me, ev);
const seatLimit = (ev) => (ev.capacity == null ? Infinity : Math.floor(ev.capacity * (1 + (Number(ev.overbook_pct) || 0) / 100)));
const byTime = (a, b) => new Date(a.starts_at) - new Date(b.starts_at);
const byFeaturedThenTime = (a, b) => (Number(b.featured) - Number(a.featured)) || byTime(a, b);
const requireMe = () => S.me || fail('Please log in first.');

function decorate(ev) {
  const c = S.counts.get(ev.id) || { going: 0, waitlisted: 0, by_hostel: {} };
  const limit = seatLimit(ev);
  return clone({
    ...ev,
    club: findClub(ev.club_id),
    fest: ev.fest_id ? S.fests.find((f) => f.id === ev.fest_id) || null : null,
    going: c.going,
    waitlisted: c.waitlisted,
    by_hostel: Object.fromEntries(Object.entries(c.by_hostel || {}).sort((a, b) => b[1] - a[1])),
    seats_left: limit === Infinity ? null : Math.max(0, limit - c.going),
    my_registration: S.regs.find((r) => r.event_id === ev.id && r.status !== 'cancelled') || null,
    closes_in_ms: ev.reg_mode === 'external' ? null : Math.max(0, new Date(ev.starts_at).getTime() - Date.now()),
  });
}

function inTab(ev, tab, now) {
  const start = new Date(ev.starts_at).getTime();
  const end = new Date(ev.ends_at).getTime();
  switch (tab) {
    case 'tonight': return localDate(new Date(start)) === localDate(new Date(now)) && end > now;
    case 'week': return end > now && start < now + 7 * DAY;
    case 'upcoming': return end > now;
    default: return true;
  }
}

function matchesQuery(ev, q) {
  if (!q) return true;
  const hay = [ev.title, ev.description, ev.venue, ev.category, findClub(ev.club_id)?.name,
    S.fests.find((f) => f.id === ev.fest_id)?.name].join(' ').toLowerCase();
  return String(q).toLowerCase().trim().split(/\s+/).every((word) => hay.includes(word));
}

// ---------- event form validation (user-facing messages before the database's own checks) ----------

const EDITABLE = ['club_id', 'fest_id', 'title', 'description', 'category', 'starts_at', 'ends_at', 'venue',
  'poster_emoji', 'poster_color', 'price', 'eligibility', 'iitd_first_until', 'capacity', 'overbook_pct',
  'reg_mode', 'external_url', 'team_min', 'team_max', 'status', 'featured', 'cover'];
const EVENT_DEFAULTS = {
  fest_id: null, description: '', category: 'Other', venue: '', poster_emoji: '🎉', poster_color: '#4F46E5',
  price: 0, eligibility: 'open', iitd_first_until: null, capacity: null, overbook_pct: 0, reg_mode: 'platform',
  external_url: null, team_min: 1, team_max: 1, featured: false, status: 'draft', cover: null,
};
const toInt = (v, fallback) => (v === '' || v == null || Number.isNaN(Number(v)) ? fallback : Math.round(Number(v)));
function toIso(value, message) {
  const d = new Date(value);
  if (value == null || value === '' || Number.isNaN(d.getTime())) fail(message);
  return d.toISOString();
}

function normalizeEvent(e) {
  e.title = String(e.title || '').trim();
  if (!e.title) fail('Give the event a title.');
  e.description = String(e.description || '').trim();
  e.category = String(e.category || '').trim() || 'Other';
  e.venue = String(e.venue || '').trim();
  e.starts_at = toIso(e.starts_at, 'Pick a valid start time.');
  e.ends_at = e.ends_at ? toIso(e.ends_at, 'Pick a valid end time.') : new Date(new Date(e.starts_at).getTime() + 2 * 3600e3).toISOString();
  if (new Date(e.ends_at) <= new Date(e.starts_at)) fail('End time must be after the start time.');
  e.price = Math.max(0, toInt(e.price, 0));
  e.eligibility = e.eligibility === 'iitd_only' ? 'iitd_only' : 'open';
  e.iitd_first_until = e.iitd_first_until ? toIso(e.iitd_first_until, 'Pick a valid IITD-first time.') : null;
  if (e.iitd_first_until && new Date(e.iitd_first_until) > new Date(e.starts_at)) fail('The IITD-first window must end before the event starts.');
  const cap = toInt(e.capacity, null);
  e.capacity = cap && cap > 0 ? cap : null;
  e.overbook_pct = Math.min(100, Math.max(0, toInt(e.overbook_pct, 0)));
  e.reg_mode = e.reg_mode === 'external' ? 'external' : 'platform';
  e.external_url = e.external_url ? String(e.external_url).trim() : null;
  if (e.reg_mode === 'external' && !/^https?:\/\//i.test(e.external_url || '')) fail('Add the external registration link (https://...).');
  e.team_min = Math.max(1, toInt(e.team_min, 1));
  e.team_max = Math.max(1, toInt(e.team_max, 1));
  if (e.team_max < e.team_min) fail('Max team size must be at least the min team size.');
  e.status = e.status === 'published' ? 'published' : 'draft';
  if (!/^#[0-9a-f]{6}$/i.test(e.poster_color || '')) e.poster_color = EVENT_DEFAULTS.poster_color;
  e.poster_emoji = String(e.poster_emoji || '').trim() || EVENT_DEFAULTS.poster_emoji;
  e.cover = /^[a-z0-9-]{1,40}$/.test(String(e.cover || '')) ? String(e.cover) : null;
  e.fest_id = e.fest_id || null;
  e.featured = !!e.featured;
  return e;
}

// ---------- export helpers ----------

function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=@+\-]/.test(s)) s = `'${s}`; // keep spreadsheet apps from running it as a formula
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const icsDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[;,]/g, (m) => `\\${m}`);
function foldLine(line) {
  const enc = new TextEncoder();
  let out = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) { out += '\r\n '; bytes = 1; }
    out += ch;
    bytes += n;
  }
  return out;
}

// ---------- public API ----------

export const store = {
  ready: load(),
  reload: load,

  events({ tab = 'all', q = '', category = '', price = '', eligibility = '' } = {}) {
    const now = Date.now();
    return S.events
      .filter((e) => e.status === 'published')
      .filter((e) => inTab(e, tab, now))
      .filter((e) => !category || e.category === category)
      .filter((e) => !price || (price === 'free' ? e.price === 0 : e.price > 0))
      .filter((e) => !eligibility || e.eligibility === eligibility)
      .filter((e) => matchesQuery(e, q))
      .sort(tab === 'tonight' || tab === 'week' ? byFeaturedThenTime : byTime)
      .map(decorate);
  },

  event(id) {
    const ev = findEvent(id);
    return ev && visible(ev, S.me) ? decorate(ev) : null;
  },

  categories() {
    return [...new Set(S.events.filter((e) => e.status === 'published').map((e) => e.category))].sort();
  },

  fests() { return clone([...S.fests].sort((a, b) => a.starts_on.localeCompare(b.starts_on))); },

  fest(slug) {
    const fest = S.fests.find((f) => f.slug === slug);
    if (!fest) return null;
    return { fest: clone(fest), events: S.events.filter((e) => e.fest_id === fest.id && visible(e, S.me)).sort(byTime).map(decorate) };
  },

  clubs() {
    return clone([...S.clubs].sort((a, b) => (Number(b.verified) - Number(a.verified)) || a.name.localeCompare(b.name)));
  },

  club(slug) {
    const club = S.clubs.find((c) => c.slug === slug);
    if (!club) return null;
    return { club: clone(club), events: S.events.filter((e) => e.club_id === club.id && visible(e, S.me)).sort(byTime).map(decorate) };
  },

  // ----- session -----

  me() { return clone(S.me); },

  async login(email, password) {
    const clean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) fail('Enter a valid email address.');
    if (!password) fail('Enter your password.');
    await q(sb.auth.signInWithPassword({ email: clean, password }));
    await load();
    return clone(S.me);
  },

  // New accounts are created already confirmed by the `signup` edge function (the default mailer can't
  // email arbitrary inboxes). ponytail: no inbox check, so the IITD seal trusts the address as typed;
  // switch to OTP sign-in with a real SMTP sender before using this beyond a demo.
  async signup(email, password, name) {
    const clean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) fail('Enter a valid email address.');
    if (String(password || '').length < 8) fail('Use at least 8 characters for your password.');
    const { data, error } = await sb.functions.invoke('signup', { body: { email: clean, password, name: String(name || '').trim() } });
    if (error) {
      let msg = '';
      try { msg = (await error.context?.json())?.error; } catch { /* not JSON */ }
      fail(msg || 'Couldn’t create the account. Try again.');
    }
    if (data?.error) fail(data.error);
    return store.login(clean, password);
  },

  async logout() {
    await sb.auth.signOut();
    await load();
  },

  async updateProfile(patch = {}) {
    const me = requireMe();
    const next = {};
    for (const k of ['name', 'entry_no', 'hostel', 'phone']) if (patch[k] !== undefined) next[k] = String(patch[k] ?? '').trim();
    if (next.hostel && !HOSTELS.includes(next.hostel)) fail('Pick a hostel from the list.');
    if (next.entry_no) next.entry_no = next.entry_no.toUpperCase();
    S.me = await q(sb.from('profiles').update(next).eq('id', me.id).select().single());
    notify();
    return clone(S.me);
  },

  needsOnboarding() {
    const me = S.me;
    if (!me) return false;
    if (!me.name) return true;
    return me.is_iitd && (!me.hostel || !me.entry_no);
  },

  // ----- tickets -----

  async register(eventId, { teamName, teamCode } = {}) {
    if (!S.me) fail('Log in to register.');
    const res = await rpc('register', { p_event: eventId, p_team_name: teamName || null, p_team_code: teamCode || null });
    await load();
    return res.registration;
  },

  async cancel(registrationId) {
    requireMe();
    const reg = await rpc('cancel_registration', { p_id: registrationId });
    await load();
    return reg;
  },

  wallet() {
    if (!S.me) return [];
    const now = Date.now();
    const items = S.regs.filter((r) => r.status !== 'cancelled').map((r) => ({ r, ev: findEvent(r.event_id) })).filter((x) => x.ev);
    const upcoming = items.filter((x) => new Date(x.ev.ends_at).getTime() > now).sort((a, b) => byTime(a.ev, b.ev));
    const past = items.filter((x) => new Date(x.ev.ends_at).getTime() <= now).sort((a, b) => byTime(b.ev, a.ev));
    return [...upcoming, ...past].map(({ r, ev }) => ({
      registration: clone(r),
      event: decorate(ev),
      team: clone(S.teams.find((t) => t.id === r.team_id) || null),
    }));
  },

  /** {team, event, members} | null when the code is unknown | undefined while loading. */
  team(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) return null;
    const res = swr(`team:${clean}`, () => rpc('team_by_code', { p_code: clean }), undefined);
    if (res === undefined) return undefined;
    if (!res?.team) return null;
    const ev = findEvent(res.team.event_id);
    return { team: res.team, event: ev ? decorate(ev) : null, members: res.members };
  },

  // ----- organisers -----

  myClubs() {
    const me = S.me;
    if (!me) return [];
    return clone(S.clubs.filter((c) => c.owner_id === me.id).sort((a, b) => a.name.localeCompare(b.name)));
  },

  async createClub(name) {
    requireMe();
    const clean = String(name || '').trim();
    if (clean.length < 2) fail('Club name is too short.');
    const club = await rpc('create_club', { p_name: clean });
    await load();
    return club;
  },

  async saveEvent(data = {}) {
    const me = requireMe();
    const existing = data.id ? findEvent(data.id) : null;
    if (data.id && !existing) fail('Event not found.');
    if (existing && !canManageEvent(me, existing)) fail("You can only edit your own club's events.");
    const patch = {};
    for (const k of EDITABLE) if (data[k] !== undefined) patch[k] = data[k];
    if (!isAdmin(me)) delete patch.featured; // featuring is an admin decision
    const next = normalizeEvent({ ...EVENT_DEFAULTS, ...(existing || {}), ...patch });
    if (!canManageClub(me, next.club_id)) fail('You can only post events for clubs you run.');
    const row = Object.fromEntries(EDITABLE.map((k) => [k, next[k]]));
    if (!isAdmin(me)) delete row.featured;
    const saved = existing
      ? await q(sb.from('events').update(row).eq('id', existing.id).select().single())
      : await q(sb.from('events').insert(row).select().single());
    await load();
    return store.event(saved.id);
  },

  async postUpdate(eventId, note) {
    await rpc('post_update', { p_event: eventId, p_note: String(note || '').trim() });
    await load();
  },

  /** Attendee list for organisers, admins and the event's checkers ([] until loaded). */
  attendees(eventId) {
    return swr(`att:${eventId}`, () => rpc('attendees', { p_event: eventId }), []);
  },

  stats(eventId) {
    const c = S.counts.get(eventId) || { going: 0, waitlisted: 0, checked_in: 0, by_hostel: {} };
    return { confirmed: c.going, waitlisted: c.waitlisted, checked_in: c.checked_in, by_hostel: decorate(findEvent(eventId) || { id: eventId }).by_hostel };
  },

  async toCSV(eventId) {
    const rows = await rpc('attendees', { p_event: eventId });
    const header = ['name', 'email', 'entry_no', 'hostel', 'phone', 'iitd', 'status', 'amount_due', 'paid_at', 'team', 'registered_at', 'checked_in_at'];
    const lines = [header.join(',')];
    for (const { registration: r, profile: p, team } of rows) {
      lines.push([p?.name, p?.email, p?.entry_no, p?.hostel, p?.phone, p?.is_iitd ? 'yes' : 'no', r.status, r.amount_due,
        r.paid_at, team?.name, r.created_at, r.checked_in_at].map(csvCell).join(','));
    }
    return `${lines.join('\r\n')}\r\n`;
  },

  ics(eventId) {
    const ev = findEvent(eventId) || fail('Event not found.');
    const club = findClub(ev.club_id);
    let url = null;
    try { url = `${location.origin}${location.pathname}#/e/${ev.id}`; } catch { /* not in a browser */ }
    const description = [ev.description, club ? `Organised by ${club.name}` : '', url || ''].filter(Boolean).join('\n\n');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IITD Live//Campus Events//EN', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${ev.id}@iitdlive`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(ev.starts_at)}`, `DTEND:${icsDate(ev.ends_at)}`, `SUMMARY:${icsText(ev.title)}`,
      `LOCATION:${icsText(`${ev.venue}, IIT Delhi`)}`, `DESCRIPTION:${icsText(description)}`,
      ...(url ? [`URL:${url}`] : []), 'END:VEVENT', 'END:VCALENDAR'];
    return `${lines.map(foldLine).join('\r\n')}\r\n`;
  },

  // ----- gate: checkers verify the holder, then admit -----

  canScan() { return !!S.me && ['checker', 'organiser', 'admin'].includes(S.me.role); },
  /** Events I can check tickets for (assigned, my club's, or all as admin); undefined while loading. */
  gateEvents() { return swr('gate-events', () => rpc('my_gate_events'), undefined); },
  /** Look a pass up without using it: {ok, reason, ticket}. */
  lookup(code, eventId) { return rpc('ticket_lookup', { p_code: code, p_event: eventId || null }); },
  /** Mark the pass used. collect = the checker took cash for an unpaid ticket. */
  async admit(code, eventId, collect = false) {
    const res = await rpc('ticket_admit', { p_code: code, p_event: eventId, p_collect: !!collect });
    lazy.delete(`log:${eventId}`);
    lazy.delete(`att:${eventId}`);
    load().catch(console.error); // counts on every screen
    return res;
  },
  gateLog(eventId) { return swr(`log:${eventId}`, () => rpc('gate_log', { p_event: eventId, p_limit: 30 }), []); },

  checkers(eventId) { return swr(`chk:${eventId}`, () => rpc('event_checkers', { p_event: eventId }), []); },
  async addChecker(eventId, email) {
    const who = await rpc('add_checker', { p_event: eventId, p_email: String(email || '').trim() });
    lazy.delete(`chk:${eventId}`);
    notify();
    return who;
  },
  async removeChecker(eventId, userId) {
    await rpc('remove_checker', { p_event: eventId, p_user: userId });
    lazy.delete(`chk:${eventId}`);
    notify();
  },

  // ----- admin -----

  adminOverview() { return swr('admin:overview', () => rpc('admin_overview'), null); },
  adminPeople(term = '') {
    const t = String(term || '').trim();
    return swr(`admin:people:${t}`, () => rpc('admin_people', { p_q: t, p_limit: 40 }), undefined);
  },
  async setRole(userId, role) {
    await rpc('set_role', { p_user: userId, p_role: role });
    for (const k of lazy.keys()) if (k.startsWith('admin:')) lazy.delete(k);
    if (userId === S.me?.id) await load(); else notify();
  },

  async setVerified(clubId, bool) {
    if (!isAdmin(requireMe())) fail('Admins only.');
    await q(sb.from('clubs').update({ verified: !!bool }).eq('id', clubId));
    await load();
  },

  async setFeatured(eventId, bool) {
    if (!isAdmin(requireMe())) fail('Admins only.');
    await q(sb.from('events').update({ featured: !!bool }).eq('id', eventId));
    await load();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
