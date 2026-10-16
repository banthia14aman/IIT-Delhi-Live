// IITD Live data store (demo mode).
// All data lives in localStorage under one key; if storage is unavailable (private mode, Node tests)
// it falls back to memory. The API matches site/CONTRACT.md so a Supabase-backed version can replace it.

import { seed, localDate, HOSTELS as SEED_HOSTELS, DEMO_ACCOUNTS as SEED_DEMO_ACCOUNTS } from './seed.js';

export const HOSTELS = SEED_HOSTELS;
export const DEMO_ACCOUNTS = SEED_DEMO_ACCOUNTS;

const KEY = 'iitdlive:v3'; // v3: covers switched to real IIT Delhi photos
const DAY = 24 * 60 * 60 * 1000;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const OUTSIDE_KEY = 'Outside IITD'; // by_hostel bucket for guests without a hostel
const hasWindow = typeof window !== 'undefined';

// ---------- persistence ----------

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readSaved() {
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save() {
  try { storage()?.setItem(KEY, JSON.stringify(state)); } catch { /* quota or private mode: stay in memory */ }
}

function freshState(session = null) {
  const now = new Date();
  return { ...seed(now), session, seeded_day: localDate(now) };
}

function isValidState(s) {
  return s && ['profiles', 'clubs', 'fests', 'events', 'teams', 'registrations'].every((k) => Array.isArray(s[k]));
}

// Sample events are placed relative to the day they were seeded. When the demo is reopened on a
// later day, shift them by whole days so "Tonight" stays populated without wiping anyone's passes.
function shiftSamples(s) {
  const today = localDate(new Date());
  if (!s.seeded_day || s.seeded_day === today) { s.seeded_day = today; return; }
  const days = Math.round((new Date(`${today}T12:00:00`) - new Date(`${s.seeded_day}T12:00:00`)) / DAY);
  const move = (iso) => {
    if (!iso) return iso;
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  for (const e of s.events) {
    if (!e.sample) continue;
    e.starts_at = move(e.starts_at);
    e.ends_at = move(e.ends_at);
    e.iitd_first_until = move(e.iitd_first_until);
    e.live_note_at = move(e.live_note_at);
  }
  for (const f of s.fests) {
    if (!f.sample) continue;
    f.starts_on = localDate(new Date(move(`${f.starts_on}T12:00:00`)));
    f.ends_on = localDate(new Date(move(`${f.ends_on}T12:00:00`)));
  }
  s.seeded_day = today;
}

function load() {
  const saved = readSaved();
  if (!isValidState(saved)) return freshState();
  shiftSamples(saved);
  return saved;
}

let state = load();
save();

// ---------- change notifications ----------

const listeners = new Set();

function notify() {
  for (const fn of [...listeners]) {
    try { fn(); } catch (err) { console.error(err); }
  }
}

function commit() {
  save();
  notify();
}

if (hasWindow && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY && e.key !== null) return;
    state = load();
    notify();
  });
}

// ---------- helpers ----------

const nowMs = () => Date.now();
const clone = (x) => (x == null ? null : JSON.parse(JSON.stringify(x)));
const isIitdEmail = (email) => /iitd\.ac\.in$/i.test(String(email || '').trim());
const GOING = new Set(['confirmed', 'checked_in']);

function uid(prefix) {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch { /* fall through */ }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// Short, typeable pass code like 7KQ4-M2XP (no 0/O, 1/I/L) so gate volunteers can key it in.
function qrToken() {
  const n = 8;
  let idx;
  try {
    idx = Array.from(globalThis.crypto.getRandomValues(new Uint32Array(n)));
  } catch {
    idx = Array.from({ length: n }, () => Math.floor(Math.random() * 2 ** 32));
  }
  const code = idx.map((v) => CODE_CHARS[v % CODE_CHARS.length]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const passKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function inviteCode() {
  const taken = new Set(state.teams.map((t) => t.invite_code));
  let code;
  do {
    code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (taken.has(code));
  return code;
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim()
    .replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'club';
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return new Date(iso).toISOString(); }
}

const fail = (msg) => { throw new Error(msg); };
const meRaw = () => state.profiles.find((p) => p.id === state.session?.user_id) || null;
const requireMe = () => meRaw() || fail('Please log in first.');
const isAdmin = (p) => p?.role === 'admin';
const findEvent = (id) => state.events.find((e) => e.id === id) || null;
const findClub = (id) => state.clubs.find((c) => c.id === id) || null;
const canManageClub = (p, clubId) => !!p && (isAdmin(p) || findClub(clubId)?.owner_id === p.id);
const canManageEvent = (p, ev) => !!ev && canManageClub(p, ev.club_id);
const goingCount = (eventId) => state.registrations.filter((r) => r.event_id === eventId && GOING.has(r.status)).length;

function seatLimit(ev) {
  if (ev.capacity == null) return Infinity;
  return Math.floor(ev.capacity * (1 + (Number(ev.overbook_pct) || 0) / 100));
}

function requireManage(eventId) {
  const me = requireMe();
  const ev = findEvent(eventId) || fail('Event not found.');
  if (!canManageEvent(me, ev)) fail('Not your event.');
  return { me, ev };
}

// Index registrations once per read so decorating many events stays cheap.
function readContext() {
  const me = meRaw();
  const profiles = new Map(state.profiles.map((p) => [p.id, p]));
  const regsByEvent = new Map();
  for (const r of state.registrations) {
    if (!regsByEvent.has(r.event_id)) regsByEvent.set(r.event_id, []);
    regsByEvent.get(r.event_id).push(r);
  }
  return {
    me, profiles, regsByEvent, now: nowMs(),
    clubs: new Map(state.clubs.map((c) => [c.id, c])),
    fests: new Map(state.fests.map((f) => [f.id, f])),
  };
}

function hostelOf(profile) {
  if (!profile) return OUTSIDE_KEY;
  return profile.hostel || (profile.is_iitd ? 'Day Scholar' : OUTSIDE_KEY);
}

function decorate(ev, ctx) {
  const regs = ctx.regsByEvent.get(ev.id) || [];
  let going = 0;
  let waitlisted = 0;
  const counts = {};
  let mine = null;
  for (const r of regs) {
    if (GOING.has(r.status)) {
      going += 1;
      const h = hostelOf(ctx.profiles.get(r.user_id));
      counts[h] = (counts[h] || 0) + 1;
    } else if (r.status === 'waitlisted') {
      waitlisted += 1;
    }
    if (ctx.me && r.user_id === ctx.me.id && r.status !== 'cancelled') mine = r;
  }
  const by_hostel = Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
  const limit = seatLimit(ev);
  const starts = new Date(ev.starts_at).getTime();
  return clone({
    ...ev,
    club: ctx.clubs.get(ev.club_id) || null,
    fest: ev.fest_id ? ctx.fests.get(ev.fest_id) || null : null,
    going,
    waitlisted,
    by_hostel,
    seats_left: limit === Infinity ? null : Math.max(0, limit - going),
    my_registration: mine,
    closes_in_ms: ev.reg_mode === 'external' ? null : Math.max(0, starts - ctx.now),
  });
}

// Published events are public; drafts are visible only to the owning organiser (and admins).
const visible = (ev, me) => ev.status === 'published' || canManageEvent(me, ev);

const byFeaturedThenTime = (a, b) => (Number(b.featured) - Number(a.featured)) || (new Date(a.starts_at) - new Date(b.starts_at));
const byTime = (a, b) => new Date(a.starts_at) - new Date(b.starts_at);

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

function matchesQuery(ev, q, ctx) {
  if (!q) return true;
  const hay = [ev.title, ev.description, ev.venue, ev.category,
    ctx.clubs.get(ev.club_id)?.name, ctx.fests.get(ev.fest_id)?.name].join(' ').toLowerCase();
  return String(q).toLowerCase().trim().split(/\s+/).every((word) => hay.includes(word));
}

// Promote the oldest waitlisted registrations while confirmed seats are free.
function promoteWaitlist(ev) {
  const limit = seatLimit(ev);
  let going = goingCount(ev.id);
  const queue = state.registrations
    .filter((r) => r.event_id === ev.id && r.status === 'waitlisted')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  for (const r of queue) {
    if (going >= limit) break;
    r.status = 'confirmed';
    going += 1;
  }
}

function teamMembers(teamId) {
  return state.registrations.filter((r) => r.team_id === teamId && r.status !== 'cancelled');
}

// ---------- event validation for saveEvent ----------

const EDITABLE = ['club_id', 'fest_id', 'title', 'description', 'category', 'starts_at', 'ends_at', 'venue',
  'poster_emoji', 'poster_color', 'price', 'eligibility', 'iitd_first_until', 'capacity', 'overbook_pct',
  'reg_mode', 'external_url', 'team_min', 'team_max', 'status', 'featured', 'cover'];

const EVENT_DEFAULTS = {
  fest_id: null, description: '', category: 'Other', venue: '', poster_emoji: '🎉', poster_color: '#4F46E5',
  price: 0, eligibility: 'open', iitd_first_until: null, capacity: null, overbook_pct: 0, reg_mode: 'platform',
  external_url: null, team_min: 1, team_max: 1, featured: false, status: 'draft', live_note: null,
  live_note_at: null, sample: false, cover: null,
};

function toIso(value, message) {
  const d = new Date(value);
  if (value == null || value === '' || Number.isNaN(d.getTime())) fail(message);
  return d.toISOString();
}

const toInt = (v, fallback) => (v === '' || v == null || Number.isNaN(Number(v)) ? fallback : Math.round(Number(v)));

function normalizeEvent(e) {
  e.title = String(e.title || '').trim();
  if (!e.title) fail('Give the event a title.');
  e.description = String(e.description || '').trim();
  e.category = String(e.category || '').trim() || 'Other';
  e.venue = String(e.venue || '').trim();
  e.starts_at = toIso(e.starts_at, 'Pick a valid start time.');
  e.ends_at = e.ends_at ? toIso(e.ends_at, 'Pick a valid end time.') : new Date(new Date(e.starts_at).getTime() + 2 * 3600 * 1000).toISOString();
  if (new Date(e.ends_at) < new Date(e.starts_at)) fail('End time must be after the start time.');
  e.price = Math.max(0, toInt(e.price, 0));
  e.eligibility = e.eligibility === 'iitd_only' ? 'iitd_only' : 'open';
  e.iitd_first_until = e.iitd_first_until ? toIso(e.iitd_first_until, 'Pick a valid IITD-first time.') : null;
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
  // cover: a key into the bundled photo library (site/assets/img/<key>.webp); anything else is dropped.
  e.cover = /^[a-z0-9-]{1,40}$/.test(String(e.cover || '')) ? String(e.cover) : null;
  if (e.fest_id && !state.fests.some((f) => f.id === e.fest_id)) fail('Unknown fest.');
  e.fest_id = e.fest_id || null;
  e.featured = !!e.featured;
  return e;
}

// ---------- export helpers ----------

function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=@]/.test(s)) s = `'${s}`; // keep spreadsheet apps from running it as a formula
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const icsDate = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[;,]/g, (m) => `\\${m}`);

// RFC 5545: lines longer than 75 octets are folded with CRLF + one space.
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

function eventUrl(id) {
  try {
    if (hasWindow && window.location) return `${window.location.origin}${window.location.pathname}#/e/${id}`;
  } catch { /* ignore */ }
  return null;
}

// ---------- public API ----------
// Feed order: on Tonight / This week, featured events lead and the rest follow by start time.
// Upcoming / All are purely chronological, so a featured event months away doesn't jump ahead of tonight.

export const store = {
  // --- reads ---
  events({ tab = 'all', q = '', category = '', price = '', eligibility = '' } = {}) {
    const ctx = readContext();
    return state.events
      .filter((e) => e.status === 'published')
      .filter((e) => inTab(e, tab, ctx.now))
      .filter((e) => !category || e.category === category)
      .filter((e) => !price || (price === 'free' ? e.price === 0 : e.price > 0))
      .filter((e) => !eligibility || e.eligibility === eligibility)
      .filter((e) => matchesQuery(e, q, ctx))
      .sort(tab === 'tonight' || tab === 'week' ? byFeaturedThenTime : byTime)
      .map((e) => decorate(e, ctx));
  },

  event(id) {
    const ctx = readContext();
    const ev = findEvent(id);
    return ev && visible(ev, ctx.me) ? decorate(ev, ctx) : null;
  },

  categories() {
    return [...new Set(state.events.filter((e) => e.status === 'published').map((e) => e.category))].sort();
  },

  fests() {
    return clone([...state.fests].sort((a, b) => a.starts_on.localeCompare(b.starts_on)));
  },

  fest(slug) {
    const ctx = readContext();
    const fest = state.fests.find((f) => f.slug === slug);
    if (!fest) return null;
    const events = state.events.filter((e) => e.fest_id === fest.id && visible(e, ctx.me)).sort(byTime);
    return { fest: clone(fest), events: events.map((e) => decorate(e, ctx)) };
  },

  clubs() {
    return clone([...state.clubs].sort((a, b) => (Number(b.verified) - Number(a.verified)) || a.name.localeCompare(b.name)));
  },

  club(slug) {
    const ctx = readContext();
    const club = state.clubs.find((c) => c.slug === slug);
    if (!club) return null;
    const events = state.events.filter((e) => e.club_id === club.id && visible(e, ctx.me)).sort(byTime);
    return { club: clone(club), events: events.map((e) => decorate(e, ctx)) };
  },

  // --- session ---
  me() {
    return clone(meRaw());
  },

  login(email) {
    const clean = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) fail('Enter a valid email address.');
    let profile = state.profiles.find((p) => p.email.toLowerCase() === clean);
    if (!profile) {
      profile = { id: uid('u'), email: clean, name: '', entry_no: '', hostel: '', phone: '', role: 'student', is_iitd: isIitdEmail(clean) };
      state.profiles.push(profile);
    }
    state.session = { user_id: profile.id };
    commit();
    return clone(profile);
  },

  logout() {
    state.session = null;
    commit();
  },

  updateProfile(patch = {}) {
    const me = requireMe();
    const next = {};
    for (const k of ['name', 'entry_no', 'hostel', 'phone']) {
      if (patch[k] !== undefined) next[k] = String(patch[k] ?? '').trim();
    }
    if (next.hostel && !HOSTELS.includes(next.hostel)) fail('Pick a hostel from the list.');
    if (next.entry_no) next.entry_no = next.entry_no.toUpperCase();
    Object.assign(me, next);
    commit();
    return clone(me);
  },

  // IITD students need name, hostel and entry number. Outsiders have no hostel/entry number, so only a name.
  needsOnboarding() {
    const me = meRaw();
    if (!me) return false;
    if (!me.name) return true;
    return me.is_iitd && (!me.hostel || !me.entry_no);
  },

  // --- registrations ---
  register(eventId, { teamName, teamCode } = {}) {
    const me = meRaw() || fail('Log in to register.');
    const ev = findEvent(eventId);
    if (!ev || ev.status !== 'published') fail('Event not found.');
    if (ev.reg_mode === 'external') fail("Registration for this event happens on the organiser's site.");
    const now = nowMs();
    if (now >= new Date(ev.starts_at).getTime()) fail('Registration has closed for this event.');
    if (!me.is_iitd) {
      if (ev.eligibility === 'iitd_only') fail('This event is only for IIT Delhi students.');
      if (ev.iitd_first_until && now < new Date(ev.iitd_first_until).getTime()) {
        fail(`IITD students get first access until ${fmtTime(ev.iitd_first_until)}.`);
      }
    }
    const existing = state.registrations.find((r) => r.event_id === ev.id && r.user_id === me.id);
    if (existing && existing.status !== 'cancelled') fail("You're already registered for this event.");

    // Work out the team (validate everything before creating anything).
    let team = null;
    let newTeam = null;
    if (ev.team_max > 1) {
      const code = String(teamCode || '').trim().toUpperCase();
      const name = String(teamName || '').trim();
      if (code) {
        team = state.teams.find((t) => t.invite_code === code && t.event_id === ev.id);
        if (!team) fail('That team code is not valid for this event.');
        if (teamMembers(team.id).length >= ev.team_max) fail(`This team is full (max ${ev.team_max}).`);
      } else if (name) {
        if (state.teams.some((t) => t.event_id === ev.id && t.name.toLowerCase() === name.toLowerCase())) {
          fail('A team with that name already exists for this event.');
        }
        newTeam = { id: uid('t'), event_id: ev.id, name, captain_id: me.id, invite_code: inviteCode() };
      } else if (ev.team_min > 1) {
        fail(`This is a team event (${ev.team_min}-${ev.team_max} people). Create a team or join one with a code.`);
      }
    }

    const status = goingCount(ev.id) < seatLimit(ev) ? 'confirmed' : 'waitlisted';
    if (newTeam) { state.teams.push(newTeam); team = newTeam; }
    const fields = { team_id: team ? team.id : null, status, qr_token: qrToken(), created_at: new Date(now).toISOString(), checked_in_at: null };
    let reg;
    if (existing) { // re-registering after a cancel reuses the row (one registration per user per event)
      reg = Object.assign(existing, fields);
    } else {
      reg = { id: uid('r'), event_id: ev.id, user_id: me.id, ...fields };
      state.registrations.push(reg);
    }
    commit();
    return clone(reg);
  },

  cancel(registrationId) {
    const me = requireMe();
    const reg = state.registrations.find((r) => r.id === registrationId) || fail('Registration not found.');
    const ev = findEvent(reg.event_id);
    if (reg.user_id !== me.id && !canManageEvent(me, ev)) fail('You can only cancel your own registration.');
    if (reg.status === 'cancelled') return clone(reg);
    if (reg.status === 'checked_in') fail('Already checked in, so this pass can no longer be cancelled.');
    reg.status = 'cancelled';
    if (ev) promoteWaitlist(ev);
    commit();
    return clone(reg);
  },

  wallet() {
    const me = meRaw();
    if (!me) return [];
    const ctx = readContext();
    const items = state.registrations
      .filter((r) => r.user_id === me.id && r.status !== 'cancelled')
      .map((r) => ({ r, ev: findEvent(r.event_id) }))
      .filter((x) => x.ev);
    const upcoming = items.filter((x) => new Date(x.ev.ends_at).getTime() > ctx.now).sort((a, b) => byTime(a.ev, b.ev));
    const past = items.filter((x) => new Date(x.ev.ends_at).getTime() <= ctx.now).sort((a, b) => byTime(b.ev, a.ev));
    return [...upcoming, ...past].map(({ r, ev }) => ({
      registration: clone(r),
      event: decorate(ev, ctx),
      team: clone(state.teams.find((t) => t.id === r.team_id) || null),
    }));
  },

  team(code) {
    const clean = String(code || '').trim().toUpperCase();
    const team = state.teams.find((t) => t.invite_code === clean);
    if (!team) return null;
    const ctx = readContext();
    const ev = findEvent(team.event_id);
    const members = teamMembers(team.id)
      .sort((a, b) => (Number(b.user_id === team.captain_id) - Number(a.user_id === team.captain_id)) || (new Date(a.created_at) - new Date(b.created_at)))
      .map((r) => ctx.profiles.get(r.user_id))
      .filter(Boolean);
    return { team: clone(team), event: ev ? decorate(ev, ctx) : null, members: clone(members) };
  },

  // --- organisers ---
  myClubs() {
    const me = meRaw();
    if (!me) return [];
    return clone(state.clubs.filter((c) => c.owner_id === me.id).sort((a, b) => a.name.localeCompare(b.name)));
  },

  createClub(name) {
    const me = requireMe();
    const clean = String(name || '').trim();
    if (clean.length < 2) fail('Club name is too short.');
    if (state.clubs.some((c) => c.name.toLowerCase() === clean.toLowerCase())) fail('A club with that name already exists.');
    const base = slugify(clean);
    let slug = base;
    for (let i = 2; state.clubs.some((c) => c.slug === slug); i++) slug = `${base}-${i}`;
    const club = { id: uid('c'), name: clean, slug, owner_id: me.id, verified: false, instagram: '' };
    state.clubs.push(club);
    if (me.role === 'student') me.role = 'organiser';
    commit();
    return clone(club);
  },

  saveEvent(data = {}) {
    const me = requireMe();
    const existing = data.id ? findEvent(data.id) : null;
    if (data.id && !existing) fail('Event not found.');
    if (existing && !canManageEvent(me, existing)) fail("You can only edit your own club's events.");
    const patch = {};
    for (const k of EDITABLE) if (data[k] !== undefined) patch[k] = data[k];
    if (!isAdmin(me)) delete patch.featured; // featuring is an admin decision
    const next = normalizeEvent({ ...EVENT_DEFAULTS, ...(existing || {}), ...patch });
    if (!findClub(next.club_id)) fail('Pick one of your clubs.');
    if (!canManageClub(me, next.club_id)) fail('You can only post events for clubs you run.');
    let ev;
    if (existing) {
      ev = Object.assign(existing, next);
    } else {
      ev = { ...next, id: uid('e'), live_note: null, live_note_at: null, sample: false };
      state.events.push(ev);
    }
    promoteWaitlist(ev); // capacity may have grown
    commit();
    return decorate(ev, readContext());
  },

  postUpdate(eventId, note) {
    const { ev } = requireManage(eventId);
    const clean = String(note || '').trim();
    ev.live_note = clean || null;
    ev.live_note_at = clean ? new Date().toISOString() : null;
    commit();
    return decorate(ev, readContext());
  },

  attendees(eventId) {
    requireManage(eventId);
    return state.registrations
      .filter((r) => r.event_id === eventId && r.status !== 'cancelled')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((r) => ({
        registration: clone(r),
        profile: clone(state.profiles.find((p) => p.id === r.user_id) || null),
        team: clone(state.teams.find((t) => t.id === r.team_id) || null),
      }));
  },

  // confirmed counts everyone holding a seat (confirmed + checked_in); checked_in is the subset already at the door.
  stats(eventId) {
    requireManage(eventId);
    const ev = decorate(findEvent(eventId), readContext());
    const checked_in = state.registrations.filter((r) => r.event_id === eventId && r.status === 'checked_in').length;
    return { confirmed: ev.going, waitlisted: ev.waitlisted, checked_in, by_hostel: ev.by_hostel };
  },

  checkIn(qrToken) {
    const me = meRaw();
    if (!me) return { ok: false, reason: 'log in as an organiser to scan passes' };
    // Accept a bare token or a scanned URL/payload that ends with it.
    const token = String(qrToken || '').trim().split(/[/:#?=]/).pop();
    const key = passKey(token);
    const reg = key && state.registrations.find((r) => passKey(r.qr_token) === key);
    if (!reg) return { ok: false, reason: 'invalid pass' };
    const ev = findEvent(reg.event_id);
    if (!canManageEvent(me, ev)) return { ok: false, reason: 'not your event' };
    const profile = clone(state.profiles.find((p) => p.id === reg.user_id) || null);
    const event = decorate(ev, readContext());
    if (reg.status === 'checked_in') return { ok: false, reason: 'already checked in', profile, event };
    if (reg.status === 'cancelled') return { ok: false, reason: 'registration cancelled', profile, event };
    if (reg.status === 'waitlisted') return { ok: false, reason: 'on the waitlist, not confirmed', profile, event };
    reg.status = 'checked_in';
    reg.checked_in_at = new Date().toISOString();
    commit();
    return { ok: true, profile, event: decorate(ev, readContext()) };
  },

  toCSV(eventId) {
    const rows = store.attendees(eventId);
    const header = ['name', 'email', 'entry_no', 'hostel', 'phone', 'iitd', 'status', 'team', 'registered_at', 'checked_in_at'];
    const lines = [header.join(',')];
    for (const { registration: r, profile: p, team } of rows) {
      lines.push([p?.name, p?.email, p?.entry_no, p?.hostel, p?.phone, p?.is_iitd ? 'yes' : 'no', r.status,
        team?.name, r.created_at, r.checked_in_at].map(csvCell).join(','));
    }
    return `${lines.join('\r\n')}\r\n`;
  },

  ics(eventId) {
    const ev = findEvent(eventId) || fail('Event not found.');
    const club = findClub(ev.club_id);
    const url = eventUrl(ev.id);
    const description = [ev.description, club ? `Organised by ${club.name}` : '', url || ''].filter(Boolean).join('\n\n');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IITD Live//Campus Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ev.id}@iitdlive`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(ev.starts_at)}`,
      `DTEND:${icsDate(ev.ends_at)}`,
      `SUMMARY:${icsText(ev.title)}`,
      `LOCATION:${icsText(`${ev.venue}, IIT Delhi`)}`,
      `DESCRIPTION:${icsText(description)}`,
      ...(url ? [`URL:${url}`] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return `${lines.map(foldLine).join('\r\n')}\r\n`;
  },

  // --- admin ---
  setVerified(clubId, bool) {
    if (!isAdmin(requireMe())) fail('Admins only.');
    const club = findClub(clubId) || fail('Club not found.');
    club.verified = !!bool;
    commit();
    return clone(club);
  },

  setFeatured(eventId, bool) {
    if (!isAdmin(requireMe())) fail('Admins only.');
    const ev = findEvent(eventId) || fail('Event not found.');
    ev.featured = !!bool;
    commit();
    return decorate(ev, readContext());
  },

  // --- plumbing ---
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Wipe and reseed. Keeps you logged in if your account exists in the fresh seed (demo accounts do).
  reset() {
    const email = meRaw()?.email;
    state = freshState();
    const again = email && state.profiles.find((p) => p.email === email);
    state.session = again ? { user_id: again.id } : null;
    commit();
  },
};
