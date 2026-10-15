// IITD Live: hash router + every view. Talks to the data layer only through store.js.
import { store, HOSTELS, DEMO_ACCOUNTS } from './store.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TZ = 'Asia/Kolkata';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const LIVE_NOTE_FRESH = 6 * HOUR; // saffron is only for updates that are still news

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape anything user- or data-provided before it goes into innerHTML. */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const enc = encodeURIComponent;

/** Only http(s) links survive; everything else becomes ''. */
function safeUrl(u) {
  if (!u) return '';
  try {
    const x = new URL(String(u), location.href);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '';
  } catch { return ''; }
}
/** Poster colours come from data; allow plain colour syntax only. */
function safeColor(c) {
  const s = String(c ?? '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(s)) return s;
  if (/^(rgb|rgba|hsl|hsla|oklch|oklab)\([0-9.,%\s/+-]+\)$/i.test(s)) return s;
  return '';
}
const posterStyle = (e) => {
  const c = safeColor(e?.poster_color);
  return c ? ` style="--poster:${c}"` : '';
};
const emojiOf = (e) => e?.poster_emoji || '🎟️';

const fmtCache = new Map();
function fmt(opts) {
  const k = JSON.stringify(opts);
  if (!fmtCache.has(k)) fmtCache.set(k, new Intl.DateTimeFormat('en-IN', { timeZone: TZ, ...opts }));
  return fmtCache.get(k);
}
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const toDate = (d) => (d instanceof Date ? d : new Date(d));
const valid = (d) => d != null && d !== '' && !Number.isNaN(toDate(d).getTime());
/** YYYY-MM-DD in India time. */
const dayKey = (d) => keyFmt.format(toDate(d));
const clean = (s) => s.replace(/[\s  ]+/g, ' ').trim();

/** "7:00 PM" */
function timeStr(d) {
  if (!valid(d)) return '';
  const parts = fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(toDate(d));
  return clean(parts.map((p) => (p.type === 'dayPeriod' ? p.value.toUpperCase() : p.value)).join(''));
}
/** "Sat 18 Oct" (+ year when not this year) */
function dateStr(d, { year = false } = {}) {
  if (!valid(d)) return '';
  const date = toDate(d);
  const showYear = year || fmt({ year: 'numeric' }).format(date) !== fmt({ year: 'numeric' }).format(new Date());
  const s = fmt({ weekday: 'short', day: 'numeric', month: 'short', ...(showYear ? { year: 'numeric' } : {}) }).format(date);
  return clean(s.replace(/,/g, ''));
}
const hourIST = (d) => Number(fmt({ hour: '2-digit', hourCycle: 'h23' }).format(toDate(d)));
const isToday = (d) => valid(d) && dayKey(d) === dayKey(Date.now());
/** "Tonight · 7:00 PM", "Tomorrow · 9:00 AM", "Sat 18 Oct · 6:30 PM" */
function whenLabel(d) {
  if (!valid(d)) return 'Time TBC';
  const k = dayKey(d);
  const now = Date.now();
  if (k === dayKey(now)) return `${hourIST(d) >= 17 ? 'Tonight' : 'Today'} · ${timeStr(d)}`;
  if (k === dayKey(now + DAY)) return `Tomorrow · ${timeStr(d)}`;
  if (k === dayKey(now - DAY)) return `Yesterday · ${timeStr(d)}`;
  return `${dateStr(d)} · ${timeStr(d)}`;
}
/** Absolute form for shared text: "Fri 17 Oct · 7:00 PM" */
const absWhen = (d) => (valid(d) ? `${dateStr(d)} · ${timeStr(d)}` : 'Time TBC');
/** "6 PM" today, else "Sat 6 PM" */
const shortWhen = (d) => (isToday(d) ? timeStr(d) : `${fmt({ weekday: 'short' }).format(toDate(d))} ${timeStr(d)}`);
function rangeLabel(s, e) {
  if (!valid(s)) return 'Time TBC';
  if (!valid(e)) return whenLabel(s);
  if (dayKey(s) === dayKey(e)) return `${whenLabel(s)} – ${timeStr(e)}`;
  return `${whenLabel(s)} – ${dateStr(e)} · ${timeStr(e)}`;
}
function dayTitle(k) {
  const d = new Date(`${k}T12:00:00+05:30`);
  if (k === dayKey(Date.now())) return 'Today';
  if (k === dayKey(Date.now() + DAY)) return 'Tomorrow';
  return dateStr(d);
}
function ago(d) {
  if (!valid(d)) return '';
  const ms = Date.now() - toDate(d).getTime();
  if (ms < 60e3) return 'just now';
  if (ms < HOUR) return `${Math.round(ms / 60e3)} min ago`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h ago`;
  return dateStr(d);
}
const endOf = (e) => (valid(e.ends_at) ? toDate(e.ends_at) : new Date(toDate(e.starts_at).getTime() + 2 * HOUR));
const isLive = (e) => valid(e.starts_at) && Date.now() >= toDate(e.starts_at).getTime() && Date.now() < endOf(e).getTime();
const isPast = (e) => valid(e.starts_at) && Date.now() >= endOf(e).getTime();
const freshNote = (e) => !!e.live_note && (!valid(e.live_note_at) || Date.now() - toDate(e.live_note_at).getTime() < LIVE_NOTE_FRESH);

/** datetime-local value in IST <-> ISO */
function toLocalInput(iso) {
  if (!valid(iso)) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(toDate(iso)).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const fromLocalInput = (v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

/** Never "₹0". */
const rupees = (n) => (Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');
const nf = (n) => Number(n || 0).toLocaleString('en-IN');
const plural = (n, one, many = `${one}s`) => `${nf(n)} ${n === 1 ? one : many}`;
const initials = (name, email) => {
  const src = (name || email || '?').trim();
  const bits = src.split(/[\s@._()-]+/).filter(Boolean);
  return ((bits[0]?.[0] || '?') + (bits[1]?.[0] || '')).toUpperCase();
};
const baseUrl = () => location.href.split('#')[0];
const linkTo = (hash) => `${baseUrl()}${hash}`;

/** Urgency only when true (DESIGN.md: closes < 24h; seats <= 20% of capacity). */
function closesLabel(e) {
  const ms = e.closes_in_ms;
  if (ms == null || ms <= 0 || ms >= DAY || isLive(e)) return '';
  if (ms < HOUR) return `Closes in ${Math.max(1, Math.round(ms / 60e3))} min`;
  return `Closes in ${Math.floor(ms / HOUR)}h`;
}
function seatsLabel(e) {
  if (e.reg_mode === 'external' || e.seats_left == null || !e.capacity) return '';
  if (e.seats_left <= 0) return 'Full · waitlist open';
  return e.seats_left <= e.capacity * 0.2 ? `${plural(e.seats_left, 'seat')} left` : '';
}
const urgencyOf = (e) => (isPast(e) ? [] : [seatsLabel(e), closesLabel(e)].filter(Boolean));
const iitdFirstActive = (e) => e.eligibility === 'open' && valid(e.iitd_first_until) && toDate(e.iitd_first_until).getTime() > Date.now();
function eligShort(e) {
  if (e.eligibility === 'iitd_only') return 'IITD only';
  if (iitdFirstActive(e)) return `IITD first · till ${shortWhen(e.iitd_first_until)}`;
  return 'Open to all';
}
const teamSize = (e) => (e.team_min === e.team_max ? `${e.team_max}` : `${e.team_min}–${e.team_max}`);
const activeReg = (e) => (e?.my_registration && e.my_registration.status !== 'cancelled' ? e.my_registration : null);

/** WhatsApp-ready text carrying when / where / ₹ / who (USER_JOURNEY §G). */
function shareText(e) {
  const club = e.club ? ` · ${e.club.name}${e.club.verified ? ' ✓' : ''}` : '';
  return [
    `${emojiOf(e)} ${e.title}${club}`,
    `📅 ${absWhen(e.starts_at)}`,
    `📍 ${e.venue || 'IIT Delhi'}`,
    `🎟️ ${rupees(e.price)} · ${eligShort(e)}`,
  ].join('\n');
}
function teamInviteText(team, e) {
  return `Join my team *${team.name}* for ${e.title} · ${absWhen(e.starts_at)} · ${e.venue || 'IIT Delhi'}. Tap to join: ${linkTo(`#/t/${enc(team.invite_code)}`)}`;
}

/* ------------------------------------------------------------------ */
/* Icons (one stroke family, 24px grid, 2px strokes)                   */
/* ------------------------------------------------------------------ */

const svg = (body, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const I = {
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  users: svg('<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.9c1.8.6 3.1 2.2 3.5 4.6"/>'),
  ticket: svg('<path d="M3.5 8.5v-2a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2a3.5 3.5 0 0 0 0 7v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2a3.5 3.5 0 0 0 0-7z"/>'),
  cal: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M12 13v4.5M9.75 15.25h4.5"/>'),
  share: svg('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  ext: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
  copy: svg('<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5v-3a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5h3"/>'),
  chat: svg('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4.4A8.4 8.4 0 1 1 20.5 11.6z"/>'),
  back: svg('<path d="M15 5 8 12l7 7"/>'),
  chev: svg('<path d="m9 5 7 7-7 7"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  scan: svg('<path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3M4 12h16"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  megaphone: svg('<path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5V5L7 9.5H5a1 1 0 0 0-1 1z"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5"/>'),
  download: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  flag: svg('<path d="M5 20V4.5"/><path d="M5 5h11.5l-2 3.5 2 3.5H5"/>'),
  star: svg('<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
  shield: svg('<path d="M12 3.5 5 6v5.5c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  door: svg('<path d="M3.5 20.5h17"/><path d="M6 20.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16"/><path d="M14.5 12.5v.01"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>'),
  insta: svg('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.9 7.1v.01"/>'),
  logout: svg('<path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>'),
};
/** 12-point scalloped rosette: the Verified Seal. */
function seal(label = 'Verified club', cls = '') {
  return `<svg class="seal ${cls}" viewBox="0 0 24 24" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><path class="seal__fill" d="M12 1.8l1.9 1.6 2.4-.6 1 2.3 2.4.6-.1 2.5 2 1.4-1.1 2.2 1.1 2.2-2 1.4.1 2.5-2.4.6-1 2.3-2.4-.6L12 22.2l-1.9-1.6-2.4.6-1-2.3-2.4-.6.1-2.5-2-1.4 1.1-2.2-1.1-2.2 2-1.4-.1-2.5 2.4-.6 1-2.3 2.4.6z"/><path class="seal__mark" d="m8.4 12.2 2.4 2.4 4.8-5"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Store access (never let a store error blank the page)               */
/* ------------------------------------------------------------------ */

function safe(fn, fallback) {
  try { const v = fn(); return v ?? fallback; } catch (err) { console.error(err); return fallback; }
}
const me = () => safe(() => store.me(), null);
const isAdmin = (p = me()) => p?.role === 'admin';
const needsOnboarding = () => safe(() => store.needsOnboarding(), false);

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

const toastBox = document.getElementById('toasts');
function toast(msg, type = 'ok') {
  if (!toastBox) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = type === 'error' ? I.info : I.check;
  const span = document.createElement('span');
  span.textContent = msg;
  el.append(span);
  toastBox.append(el);
  while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
  setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 300); }, type === 'error' ? 5200 : 3400);
}
const errMsg = (err) => (err && err.message ? String(err.message).replace(/^Error:\s*/, '') : 'Something went wrong. Try again.');

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

const app = document.getElementById('app');
const searchInput = document.getElementById('search');

function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
  return { raw: `#${raw}`, path: `/${parts.join('/')}`, parts, query: new URLSearchParams(qs) };
}
function go(hash, { replace = false } = {}) {
  if (replace) { history.replaceState(null, '', hash); renderRoute(); }
  else if (location.hash === hash) renderRoute();
  else location.hash = hash;
}
/** Only allow in-app hash routes as redirect targets. */
const safeNext = (n) => (n && /^#\/[^\s]*$/.test(n) ? n : '#/');
const loginHref = (next) => `#/login?next=${enc(next)}`;

const ROUTES = [
  [/^\/$/, viewFeed],
  [/^\/e\/([^/]+)$/, viewEvent],
  [/^\/f\/([^/]+)$/, viewFest],
  [/^\/c\/([^/]+)$/, viewClub],
  [/^\/t\/([^/]+)$/, viewTeam],
  [/^\/wallet$/, viewWallet],
  [/^\/login$/, viewLogin],
  [/^\/onboarding$/, viewOnboarding],
  [/^\/org$/, viewOrg],
  [/^\/org\/new$/, (r) => viewOrgEvent(r, null)],
  [/^\/org\/scan$/, viewScan],
  [/^\/org\/e\/([^/]+)$/, (r, id) => viewOrgEvent(r, id)],
  [/^\/admin$/, viewAdmin],
];

let page = null; // { title, html, mount, cleanup, static, onStore, nav, flush }

function build(route) {
  for (const [re, fn] of ROUTES) {
    const m = route.path.match(re);
    if (m) {
      try { return fn(route, ...m.slice(1)); } catch (err) {
        console.error(err);
        return errorPage('This page hit a snag', errMsg(err));
      }
    }
  }
  return errorPage('Page not found', 'That link does not lead anywhere. It may have been mistyped, or the event was removed.');
}

function paint(p, { restore = null } = {}) {
  app.innerHTML = p.html;
  app.classList.toggle('view--flush', !!p.flush);
  document.title = p.title ? `${p.title} · IITD Live` : 'IITD Live';
  if (restore) restoreFields(restore);
  p.mount?.(app);
  updateChrome(p);
}

let renders = 0;
function renderRoute() {
  const route = parseRoute();
  if (page?.cleanup) safe(() => page.cleanup());
  const redirect = guard(route);
  if (redirect) { history.replaceState(null, '', redirect); renderRoute(); return; }
  page = build(route);
  page.route = route;
  paint(page);
  window.scrollTo(0, 0);
  const h1 = app.querySelector('h1');
  if (h1 && renders++) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
}

/** Login wall only where it is needed (browse without login). */
function guard(route) {
  const p = route.path;
  const needsLogin = p === '/wallet' || p === '/onboarding' || p.startsWith('/org/') || p === '/admin';
  if (needsLogin && !me()) return loginHref(route.raw);
  return null;
}

let ownUntil = 0;
const mine = () => { ownUntil = Date.now() + 400; };
/** Re-render on any store change; keep what the person was typing unless the change was theirs. */
function refresh() {
  if (!page) return;
  if (page.static) { safe(() => page.onStore?.(app)); updateChrome(page); return; }
  const route = parseRoute();
  const keep = Date.now() > ownUntil ? snapshotFields() : null;
  if (page.cleanup) safe(() => page.cleanup());
  const y = window.scrollY;
  page = build(route);
  page.route = route;
  paint(page, { restore: keep });
  window.scrollTo(0, y);
}

function snapshotFields() {
  const out = { values: {}, focus: null, sel: null };
  app.querySelectorAll('input[id], textarea[id], select[id]').forEach((el) => {
    if (el.type === 'checkbox' || el.type === 'radio') out.values[el.id] = { checked: el.checked };
    else out.values[el.id] = { value: el.value };
  });
  const a = document.activeElement;
  if (a && a.id && app.contains(a)) {
    out.focus = a.id;
    try { out.sel = [a.selectionStart, a.selectionEnd]; } catch { /* not a text field */ }
  }
  return out;
}
function restoreFields(snap) {
  for (const [id, v] of Object.entries(snap.values)) {
    const el = document.getElementById(id);
    if (!el || !app.contains(el) || el.dataset.noRestore != null) continue;
    if ('checked' in v) el.checked = v.checked; else el.value = v.value;
  }
  if (snap.focus) {
    const el = document.getElementById(snap.focus);
    if (el) { el.focus({ preventScroll: true }); try { if (snap.sel) el.setSelectionRange(...snap.sel); } catch { /* ignore */ } }
  }
}

function upcomingPassCount() {
  return safe(() => store.wallet(), []).filter((w) => w.event && !isPast(w.event) && w.registration?.status !== 'cancelled').length;
}

function updateChrome(p) {
  const user = me();
  const nav = p?.nav || '';
  const organiser = user && (user.role === 'organiser' || user.role === 'admin');
  const tabMe = document.getElementById('tab-me');
  if (tabMe) {
    tabMe.href = organiser ? '#/org' : user ? '#/onboarding' : loginHref('#/onboarding');
    tabMe.dataset.nav = organiser ? 'org' : 'me';
    tabMe.querySelector('span').textContent = organiser ? 'Organise' : user ? 'Me' : 'Log in';
  }
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const acct = document.getElementById('account');
  if (acct) {
    if (user) {
      acct.href = '#/onboarding';
      acct.className = 'account account--avatar';
      acct.setAttribute('aria-label', `Your profile: ${user.name || user.email}`);
      acct.textContent = initials(user.name, user.email);
    } else {
      acct.href = loginHref(parseRoute().raw);
      acct.className = 'account';
      acct.removeAttribute('aria-label');
      acct.textContent = 'Log in';
    }
  }
  const n = user ? upcomingPassCount() : 0;
  document.querySelectorAll('[data-wallet-badge]').forEach((b) => {
    b.hidden = !n;
    b.textContent = n ? String(n) : '';
    b.setAttribute('aria-label', `${n} upcoming ${n === 1 ? 'pass' : 'passes'}`);
  });
  if (searchInput && document.activeElement !== searchInput) searchInput.value = feed.q;
}

/* ------------------------------------------------------------------ */
/* Shared fragments                                                    */
/* ------------------------------------------------------------------ */

function errorPage(title, body, cta = `<a class="btn" href="#/">Back to events</a>`) {
  return {
    title,
    html: `<section class="empty empty--page"><h1>${esc(title)}</h1><p>${esc(body)}</p>${cta}</section>`,
  };
}
function empty(title, body, cta = '') {
  return `<div class="empty"><p class="empty__title">${esc(title)}</p><p>${esc(body)}</p>${cta}</div>`;
}
function backLink(href, label) {
  return `<a class="back" href="${esc(href)}">${I.back}<span>${esc(label)}</span></a>`;
}
function clubName(club, { link = false, big = false } = {}) {
  if (!club) return '';
  const inner = `<span class="org__name">${esc(club.name)}</span>${club.verified ? seal('Verified club', big ? 'seal--lg' : '') : ''}`;
  return link && club.slug ? `<a class="org" href="#/c/${enc(club.slug)}">${inner}</a>` : `<span class="org">${inner}</span>`;
}
function priceChip(e) {
  return e.price > 0 ? `<span class="chip chip--paid">${esc(rupees(e.price))}</span>` : '<span class="chip chip--free">Free</span>';
}
function eligChip(e) {
  if (e.eligibility === 'iitd_only') return `<span class="chip chip--iitd">${I.shield}IITD only</span>`;
  if (iitdFirstActive(e)) return `<span class="chip chip--first">${I.star}${esc(eligShort(e))}</span>`;
  return `<span class="chip chip--open">${I.door}Open to all</span>`;
}
function chips(e, { featured = true, category = false } = {}) {
  return [
    priceChip(e),
    eligChip(e),
    e.team_max > 1 ? `<span class="chip chip--team">${I.users}Team of ${esc(teamSize(e))}</span>` : '',
    featured && e.featured ? `<span class="chip chip--first">${I.star}Featured</span>` : '',
    category && e.category ? `<span class="chip chip--team">${esc(e.category)}</span>` : '',
  ].join('');
}
function liveTag(label = 'Live') {
  return `<span class="live"><span class="pulse" aria-hidden="true"></span>${esc(label)}</span>`;
}

/** The ticket stub carries the "when". It turns saffron while the event is happening. */
function dateStub(e) {
  if (isLive(e)) {
    return `<div class="stub stub--live" aria-hidden="true"><span class="stub__live"><span class="pulse"></span>LIVE</span><span class="stub__time">till ${esc(timeStr(endOf(e)))}</span></div>`;
  }
  if (!valid(e.starts_at)) return '<div class="stub" aria-hidden="true"><span class="stub__day">TBC</span></div>';
  const d = toDate(e.starts_at);
  const day = isToday(d) ? 'TODAY' : fmt({ weekday: 'short' }).format(d).toUpperCase();
  return `<div class="stub${isPast(e) ? ' stub--past' : ''}" aria-hidden="true">
    <span class="stub__day">${esc(day)}</span>
    <span class="stub__date">${esc(fmt({ day: 'numeric' }).format(d))}</span>
    <span class="stub__month">${esc(fmt({ month: 'short' }).format(d))}</span>
    <span class="stub__time">${esc(timeStr(d))}</span>
  </div>`;
}

function eventCard(e) {
  const live = isLive(e);
  const past = isPast(e);
  const reg = activeReg(e);
  const urgency = urgencyOf(e);
  const hours = valid(e.ends_at) ? (toDate(e.ends_at) - toDate(e.starts_at)) / HOUR : 0;
  const when = live ? `Live now, till ${timeStr(endOf(e))}` : whenLabel(e.starts_at);
  let status = '';
  if (reg) {
    status = reg.status === 'waitlisted'
      ? '<span class="status status--waitlisted">Waitlisted</span>'
      : `<span class="status status--confirmed">${I.check}${reg.status === 'checked_in' ? 'Checked in' : 'Registered'}</span>`;
  } else if (urgency.length) {
    status = `<span class="card__urgent">${I.clock}${esc(urgency.join(' · '))}</span>`;
  }
  const going = e.going > 0 ? `<span class="card__going">${esc(nf(e.going))} going</span>` : '';
  const note = e.live_note && !past
    ? `<p class="card__note"><span class="card__notetag${freshNote(e) ? ' is-fresh' : ''}">${I.megaphone}Update</span><span class="card__notetext">${esc(e.live_note)}</span></p>`
    : '';
  return `<article class="card${live ? ' is-live' : ''}${past ? ' is-past' : ''}">
    ${dateStub(e)}
    <div class="card__body">
      <div class="card__top">
        <h3 class="card__title"><a href="#/e/${enc(e.id)}"><span class="visually-hidden">${esc(when)}: </span>${esc(e.title)}</a></h3>
        <span class="tile"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span>
      </div>
      ${e.club ? `<p class="card__club">${clubName(e.club)}</p>` : ''}
      <p class="card__where">${I.pin}<span>${esc(e.venue || 'Venue TBC')}${hours > 3 ? ` · ${Math.round(hours)}h` : ''}</span></p>
      <div class="chips">${chips(e)}</div>
      ${status || going ? `<div class="card__foot">${status}${going}</div>` : ''}
      ${note}
    </div>
  </article>`;
}

function hostelBars(byHostel, { limit = 6 } = {}) {
  const rows = Object.entries(byHostel || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '';
  const max = rows[0][1];
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((s, [, n]) => s + n, 0);
  const label = (h, n) => (h === 'Outside IITD' ? `<b>${esc(nf(n))}</b> from outside IITD` : h === 'Day Scholar' ? `<b>${esc(nf(n))}</b> day ${n === 1 ? 'scholar' : 'scholars'}` : `<b>${esc(nf(n))}</b> from ${esc(h)}`);
  return `<ul class="bars">${shown.map(([h, n]) => `
    <li><span class="bars__label">${label(h, n)}</span>
      <span class="bars__track" aria-hidden="true"><span class="bars__fill" style="width:${Math.max(4, Math.round((n / max) * 100))}%"></span></span></li>`).join('')}
    ${rest ? `<li class="bars__rest">+${esc(nf(rest))} from other hostels</li>` : ''}
  </ul>`;
}

/** QR drawn by hand from the module matrix: always #1C0B11 on white with a 4-module quiet zone. */
function qrMarkup(token, label) {
  if (typeof window.qrcode !== 'function' || !token) {
    return '<div class="qr qr--missing"><span>QR could not load. Show the code below at the gate.</span></div>';
  }
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(String(token));
    qr.make();
    const n = qr.getModuleCount();
    const q = 4;
    const size = n + q * 2;
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    }
    return `<div class="qr"><svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${d}" fill="#1C0B11"/></svg></div>`;
  } catch (err) {
    console.error(err);
    return '<div class="qr qr--missing"><span>Show the code below at the gate.</span></div>';
  }
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const slugify = (s) => String(s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'event';

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove(); return ok;
  }
}
const waLink = (text) => `https://wa.me/?text=${enc(text)}`;

/** Inline confirm for destructive actions: "Cancel registration? Yes, cancel / Keep my pass". */
function confirmable(action, id, label, { ask, yes, no, cls = 'btn btn--danger' }) {
  return `<span class="confirm" data-confirm-wrap>
    <button type="button" class="${cls}" data-action="ask">${esc(label)}</button>
    <span class="confirm__ask" hidden role="group" aria-label="${esc(ask)}">
      <span class="confirm__q">${esc(ask)}</span>
      <button type="button" class="btn btn--danger btn--sm" data-action="${esc(action)}" data-id="${esc(id)}">${esc(yes)}</button>
      <button type="button" class="btn btn--ghost btn--sm" data-action="unask">${esc(no)}</button>
    </span>
  </span>`;
}

function teamPanel(team, e, { heading = true } = {}) {
  const info = safe(() => store.team(team.invite_code), null);
  const members = info?.members || [];
  const link = linkTo(`#/t/${enc(team.invite_code)}`);
  const spots = Math.max(0, (e.team_max || 1) - members.length);
  const short = Math.max(0, (e.team_min || 1) - members.length);
  return `<section class="team" aria-label="Your team">
    ${heading ? `<h2 class="team__name">Team ${esc(team.name)}</h2>` : ''}
    <p class="team__count">${esc(nf(members.length))} of ${esc(nf(e.team_max))} spots filled${short ? ` · needs ${esc(plural(short, 'more member'))} to compete` : ''}</p>
    ${members.length ? `<ul class="team__members">${members.map((m) => `<li><span class="avatar" aria-hidden="true">${esc(initials(m.name, m.email))}</span>${esc(m.name || 'Teammate')}${m.id === team.captain_id ? ' <small>captain</small>' : ''}</li>`).join('')}</ul>` : ''}
    ${spots && !isPast(e) ? `
    <a class="btn btn--wa btn--block" href="${esc(waLink(teamInviteText(team, e)))}" target="_blank" rel="noopener noreferrer">${I.chat}Invite on WhatsApp</a>
    <div class="inline">
      <label class="visually-hidden" for="invite-${esc(team.id)}">Invite link</label>
      <input id="invite-${esc(team.id)}" readonly value="${esc(link)}" data-no-restore>
      <button class="btn btn--ghost" type="button" data-action="copy" data-text="${esc(link)}">${I.copy}Copy</button>
    </div>
    <p class="team__code">Or share the code <code>${esc(team.invite_code)}</code></p>` : ''}
  </section>`;
}

/* ------------------------------------------------------------------ */
/* Feed  #/                                                            */
/* ------------------------------------------------------------------ */

const feed = { tab: null, category: '', price: '', eligibility: '', q: '' };
const TABS = [['tonight', 'Tonight'], ['week', 'This week'], ['upcoming', 'Upcoming'], ['fests', 'Fests']];
const TAB_TITLES = { tonight: 'Tonight @ IITD', week: 'This week @ IITD', upcoming: 'Coming up', fests: 'Fests' };

function defaultTab() {
  // Never open on an empty tab: Tonight → This week → Upcoming.
  for (const t of ['tonight', 'week']) if (safe(() => store.events({ tab: t }), []).length) return t;
  return 'upcoming';
}

function feedTabs(active, { liveTonight = false } = {}) {
  return `<nav class="tabs tabs--mast" aria-label="When">
    ${TABS.map(([k, label]) => `<a class="tab" href="#/?tab=${k}"${k === active ? ' aria-current="page"' : ''}>${esc(label)}${k === 'tonight' && liveTonight ? '<span class="tab__live"><span class="visually-hidden">, something is live</span></span>' : ''}</a>`).join('')}
  </nav>`;
}

function viewFeed(route) {
  const qTab = route.query.get('tab');
  if (qTab && TABS.some(([k]) => k === qTab)) feed.tab = qTab;
  const qElig = route.query.get('elig');
  if (qElig === 'open' || qElig === 'iitd_only') feed.eligibility = qElig;
  if (!feed.tab) feed.tab = defaultTab();
  const tab = feed.tab;
  const searching = feed.q.trim().length > 0;
  const liveTonight = safe(() => store.events({ tab: 'tonight' }), []).some(isLive);
  const tabs = feedTabs(searching ? '' : tab, { liveTonight });

  if (tab === 'fests' && !searching) {
    return {
      title: 'Fests', nav: 'fests', flush: true,
      html: `${tabs}<header class="page-head"><h1 class="h-headline">Fests</h1><p class="lede">Schedules, venues and every competition, in one place.</p></header>${festList()}`,
    };
  }

  const cats = safe(() => store.categories(), []);
  const filters = { category: feed.category, price: feed.price, eligibility: feed.eligibility };
  const list = searching
    ? safe(() => store.events({ tab: 'all', q: feed.q.trim(), ...filters }), [])
    : safe(() => store.events({ tab, ...filters }), []);
  const heading = searching ? `Results for “${feed.q.trim()}”` : TAB_TITLES[tab];
  const upcoming = list.filter((e) => !isPast(e));
  const past = list.filter((e) => isPast(e)).reverse();

  const active = feed.category || feed.price || feed.eligibility;
  const chip = (key, value, label) => {
    const on = feed[key] === value;
    return `<button type="button" class="fchip" data-action="filter" data-key="${key}" data-value="${esc(value)}" aria-pressed="${on}">${on ? I.check : ''}${esc(label)}</button>`;
  };
  const filterBar = `<div class="filters" role="group" aria-label="Filter events">
    ${chip('price', 'free', 'Free')}${chip('price', 'paid', 'Paid')}
    ${chip('eligibility', 'open', 'Open to all')}${chip('eligibility', 'iitd_only', 'IITD only')}
    <label class="fchip fchip--select${feed.category ? ' is-on' : ''}"><span class="visually-hidden">Category</span>
      <select id="f-cat" data-change="category">
        <option value="">All categories</option>
        ${cats.map((c) => `<option value="${esc(c)}"${c === feed.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}
      </select>
    </label>
    ${active ? '<button type="button" class="fclear" data-action="clear-filters">Clear filters</button>' : ''}
  </div>`;

  let body;
  if (!list.length) {
    let cta = '';
    let title = 'Nothing here yet';
    let msg;
    if (searching) {
      title = 'No results';
      msg = `No events match “${feed.q.trim()}”. Try a club name, a venue or another word${active ? ', or clear filters' : ''}.`;
      if (active) cta = '<button class="btn btn--ghost" data-action="clear-filters">Clear filters</button>';
    } else if (active) { msg = 'No events match these filters.'; cta = '<button class="btn btn--ghost" data-action="clear-filters">Clear filters</button>'; }
    else if (tab === 'tonight') { msg = 'Nothing on tonight. Plenty is happening this week.'; cta = '<a class="btn" href="#/?tab=week">See this week</a>'; }
    else if (tab === 'week') { msg = 'A quiet week so far. See what is further out.'; cta = '<a class="btn" href="#/?tab=upcoming">See upcoming</a>'; }
    else { msg = 'No upcoming events yet. Running a club? Post the first one.'; cta = '<a class="btn btn--ghost" href="#/org/new">Post an event</a>'; }
    body = empty(title, msg, cta);
  } else {
    body = `${upcoming.length ? `<div class="grid">${upcoming.map(eventCard).join('')}</div>` : ''}
      ${past.length ? `<h2 class="section-title">Already happened</h2><div class="grid">${past.map(eventCard).join('')}</div>` : ''}`;
  }
  const count = list.length ? `<p class="lede">${esc(plural(upcoming.length, 'event'))}${active ? ' match your filters' : ''}</p>` : '';
  return {
    title: searching ? 'Search' : TABS.find(([k]) => k === tab)[1],
    nav: 'explore',
    flush: true,
    html: `${tabs}<header class="page-head"><h1 class="h-headline">${esc(heading)}</h1>${count}</header>${filterBar}${body}`,
  };
}

function festDates(f) {
  if (!f) return '';
  const s = f.starts_on ? new Date(`${String(f.starts_on).slice(0, 10)}T12:00:00+05:30`) : null;
  const e = f.ends_on ? new Date(`${String(f.ends_on).slice(0, 10)}T12:00:00+05:30`) : null;
  if (s && e && valid(s) && valid(e)) {
    const sameMonth = fmt({ month: 'short', year: 'numeric' }).format(s) === fmt({ month: 'short', year: 'numeric' }).format(e);
    return sameMonth
      ? `${fmt({ day: 'numeric' }).format(s)}–${clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(e))}`
      : `${clean(fmt({ day: 'numeric', month: 'short' }).format(s))} – ${clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(e))}`;
  }
  if (s && valid(s)) return clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(s));
  return '';
}

function festList() {
  const fests = safe(() => store.fests(), []);
  if (!fests.length) return empty('No fests listed yet', 'When Rendezvous, Tryst or BECon open registrations, their schedules show up here.');
  return `<div class="grid grid--fests">${fests.map((f) => {
    const n = safe(() => store.fest(f.slug)?.events?.length, 0);
    const dates = festDates(f);
    return `<article class="fest-card">
      <h2 class="fest-card__name"><a href="#/f/${enc(f.slug)}">${esc(f.name)}</a></h2>
      ${f.tagline ? `<p class="fest-card__tag">${esc(f.tagline)}</p>` : ''}
      <p class="fest-card__meta">${I.cal}<span>${esc(dates || 'Dates to be confirmed')}${f.dates_tbc ? ' <span class="chip chip--tbc">Dates TBC</span>' : ''}</span></p>
      <p class="fest-card__meta">${I.ticket}<span>${n ? esc(plural(n, 'event')) : 'Schedule coming soon'}</span></p>
    </article>`;
  }).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/* Event page  #/e/:id                                                 */
/* ------------------------------------------------------------------ */

function teamOf(reg) {
  if (!reg?.team_id) return null;
  return safe(() => store.wallet(), []).find((x) => x.registration?.id === reg.id)?.team || null;
}

/**
 * The sticky action bar: price on the left, the state-aware button on the right,
 * and any reason (eligibility, waitlist, closed) above the button, never after it.
 */
function actionBar(e, user, route) {
  const reg = activeReg(e);
  const here = `#/e/${enc(e.id)}`;
  const ended = isPast(e);
  const started = e.closes_in_ms != null && e.closes_in_ms <= 0;
  const team = e.team_max > 1;
  const urgency = urgencyOf(e);
  const sub = reg ? '' : urgency.length ? `<small class="warn">${esc(urgency.join(' · '))}</small>` : e.going > 0 ? `<small>${esc(nf(e.going))} going</small>` : '';
  const price = `<div class="cta__price"><b>${esc(rupees(e.price))}</b>${sub}</div>`;
  const bar = (msg, button, more = '') => `<div class="cta${more ? ' cta--more' : ''}" id="cta">${msg ? `<div class="cta__msg">${msg}</div>` : ''}${more}<div class="cta__row">${price}<div class="cta__btn">${button}</div></div></div>`;
  const reason = (text, link = '') => `<p class="reason">${I.info}<span>${text}${link}</span></p>`;
  const openLink = e.fest ? ` <a href="#/f/${enc(e.fest.slug)}">See what’s open to you at ${esc(e.fest.name)}</a>` : ' <a href="#/?tab=upcoming&elig=open">See events open to you</a>';

  if (e.status === 'draft') return bar(reason('This event is a draft. Only your club can see it.'), '<button class="btn" disabled>Not published</button>');

  if (e.reg_mode === 'external') {
    const url = safeUrl(e.external_url);
    if (ended) return bar(reason('This event has ended.'), '<button class="btn" disabled>Closed</button>');
    return bar(
      `<p class="cta__note">Registration${e.price > 0 ? ' and payment happen' : ' happens'} on the organiser’s site. Check their refund policy before you pay.</p>`,
      url ? `<a class="btn btn--ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Register on organiser’s site${I.ext}</a>` : '<button class="btn" disabled>Link coming soon</button>',
    );
  }

  if (reg) {
    if (reg.status === 'waitlisted') {
      return bar('<p class="state state--wait"><b>You’re on the waitlist.</b> We’ll move you up automatically if a seat frees.</p>', '<a class="btn btn--ghost" href="#/wallet">See in wallet</a>');
    }
    const label = reg.status === 'checked_in' ? `Checked in${reg.checked_in_at ? ` · ${timeStr(reg.checked_in_at)}` : ''}` : 'Registered · View pass';
    return bar('', `<a class="btn btn--ok" href="#/wallet?pass=${enc(reg.id)}">${I.check}${esc(label)}</a>`);
  }

  if (ended) return bar(reason('This event has ended.'), '<button class="btn" disabled>Closed</button>');
  if (started) return bar(reason(`Registration closed when the event started${isLive(e) ? '. It’s happening now.' : '.'}`), '<button class="btn" disabled>Closed</button>');

  const full = e.seats_left != null && e.seats_left <= 0;
  const regLabel = team ? 'Register team' : 'Register';

  if (!user) {
    const next = team ? `${here}?team=1` : `${here}?register=1`;
    const msg = e.eligibility === 'iitd_only'
      ? reason('For IIT Delhi students only. Log in with your @iitd.ac.in email.')
      : iitdFirstActive(e) ? reason(`IIT Delhi students get first access until ${esc(shortWhen(e.iitd_first_until))}. Then it opens to everyone.`) : '';
    return bar(msg, `<a class="btn" href="${esc(loginHref(next))}">Log in to register</a>`);
  }

  if (e.eligibility === 'iitd_only' && !user.is_iitd) {
    return bar(reason('This event is for IIT Delhi students only, so guests can’t register.', openLink), '<button class="btn" disabled>IITD students only</button>');
  }
  if (iitdFirstActive(e) && !user.is_iitd) {
    return bar(reason(`IIT Delhi students get first access until ${esc(shortWhen(e.iitd_first_until))}. It opens to everyone after that.`), `<button class="btn" disabled>Opens ${esc(shortWhen(e.iitd_first_until))}</button>`);
  }

  const waitMsg = full ? `<p class="state state--wait"><b>Seats are full.</b> ${e.waitlisted > 0 ? `${esc(plural(e.waitlisted, 'person', 'people'))} ahead of you. ` : ''}You’ll move up automatically if someone cancels.</p>` : '';

  if (team) {
    if (needsOnboarding()) {
      return bar(waitMsg, `<a class="btn${full ? ' btn--ghost' : ''}" href="#/onboarding?next=${enc(`${here}?team=1`)}">${full ? 'Join waitlist' : regLabel}</a>`);
    }
    const open = route.query.get('team') === '1';
    const more = `<div class="cta__more" id="team-forms"${open ? '' : ' hidden'}>
      <p class="cta__note">Teams of ${esc(teamSize(e))}. The captain creates the team, then shares the invite link.</p>
      <form class="team-form" data-form="team-create">
        <label for="team-name">Team name</label>
        <div class="inline">
          <input id="team-name" name="teamName" required maxlength="40" autocomplete="off" placeholder="e.g. Bit Flippers">
          <button class="btn" type="submit">Create team</button>
        </div>
      </form>
      <form class="team-form" data-form="team-join">
        <label for="team-code">Got an invite code?</label>
        <div class="inline">
          <input id="team-code" name="teamCode" required maxlength="80" autocomplete="off" autocapitalize="characters" spellcheck="false" class="mono" placeholder="HACK42">
          <button class="btn btn--ghost" type="submit">Join team</button>
        </div>
      </form>
    </div>`;
    return bar(waitMsg, `<button class="btn${full ? ' btn--ghost' : ''}" data-action="toggle-team" aria-controls="team-forms" aria-expanded="${open}">${full ? 'Join waitlist' : regLabel}${I.down}</button>`, more);
  }

  return bar(waitMsg, `<button class="btn${full ? ' btn--ghost' : ''}" data-action="register" data-id="${esc(e.id)}">${full ? 'Join waitlist' : regLabel}</button>`);
}

function mapsUrl(venue) {
  return `https://www.google.com/maps/search/?api=1&query=${enc(`${venue}, IIT Delhi, Hauz Khas, New Delhi`)}`;
}

function liveBanner(e, { small = false } = {}) {
  if (!e.live_note) return '';
  const fresh = freshNote(e);
  return `<div class="banner${fresh ? ' banner--live' : ''}${small ? ' banner--sm' : ''}" role="status" aria-live="polite">
    ${fresh ? '<span class="pulse" aria-hidden="true"></span>' : I.megaphone}
    <div><span class="banner__label">${fresh ? 'LIVE UPDATE' : 'Update'}</span><p class="banner__note">${esc(e.live_note)}</p>${e.live_note_at ? `<small>${esc(ago(e.live_note_at))}</small>` : ''}</div>
  </div>`;
}

function viewEvent(route, id) {
  const e = safe(() => store.event(id), null);
  if (!e) return errorPage('Event not found', 'This event may have been removed by the organiser, or the link is incomplete.');
  const user = me();
  const live = isLive(e);
  const ended = isPast(e);
  const fest = e.fest;
  const reg = activeReg(e);
  const team = reg ? teamOf(reg) : null;
  const capLine = e.reg_mode === 'external'
    ? 'Registration on the organiser’s site'
    : e.capacity
      ? `${nf(e.capacity)} seats${e.seats_left != null ? ` · ${e.seats_left > 0 ? `${nf(e.seats_left)} left` : 'full, waitlist open'}` : ''}`
      : 'No seat limit';
  const eligLine = e.eligibility === 'iitd_only'
    ? 'IIT Delhi students only'
    : iitdFirstActive(e)
      ? `IIT Delhi students first until ${shortWhen(e.iitd_first_until)}, then open to all`
      : 'Open to all, including students from other colleges';

  const html = `
    ${backLink(fest ? `#/f/${enc(fest.slug)}` : '#/', fest ? fest.name : 'All events')}
    <article class="event">
      <div class="event__poster">
        <div class="poster"${posterStyle(e)} aria-hidden="true"><span>${esc(emojiOf(e))}</span></div>
      </div>
      <div class="event__main">
        ${liveBanner(e)}
        <header class="event__head">
          <p class="event__when">${live ? liveTag('Happening now') : ended ? '<span class="muted">Ended</span>' : esc(whenLabel(e.starts_at))}</p>
          <h1>${esc(e.title)}</h1>
          ${e.club ? `<p class="event__by">by ${clubName(e.club, { link: true, big: true })}</p>
          <p class="verify-line">${e.club.verified ? `${I.shield}<span>Verified organiser: confirmed by IITD Live admins.</span>` : `${I.info}<span>Organiser not yet verified.</span>`}</p>` : ''}
          ${fest ? `<p class="event__fest">Part of <a href="#/f/${enc(fest.slug)}">${esc(fest.name)}</a></p>` : ''}
          <div class="chips">${chips(e, { category: true })}</div>
        </header>

        <dl class="facts">
          <div><dt>${I.clock}<span>When</span></dt><dd>${esc(rangeLabel(e.starts_at, e.ends_at))}</dd></div>
          <div><dt>${I.pin}<span>Where</span></dt><dd>${esc(e.venue || 'Venue TBC')}${e.venue ? ` <a class="maplink" href="${esc(mapsUrl(e.venue))}" target="_blank" rel="noopener noreferrer">Map${I.ext}</a>` : ''}</dd></div>
          <div><dt>${I.ticket}<span>Price</span></dt><dd class="num">${esc(rupees(e.price))}</dd></div>
          <div><dt>${I.shield}<span>Who can go</span></dt><dd>${esc(eligLine)}</dd></div>
          <div><dt>${I.users}<span>Seats</span></dt><dd>${esc(capLine)}${e.team_max > 1 ? `<br>Teams of ${esc(teamSize(e))}` : ''}</dd></div>
        </dl>

        ${team ? teamPanel(team, e) : ''}

        <div class="actions">
          <button class="btn btn--ghost" data-action="ics" data-id="${esc(e.id)}">${I.cal}Add to calendar</button>
          <button class="btn btn--ghost" data-action="share" data-id="${esc(e.id)}">${I.share}Share</button>
        </div>
        ${reg && reg.status !== 'checked_in' && !ended ? `<div class="cancel-row">${reg.status === 'waitlisted'
          ? confirmable('cancel', reg.id, 'Leave waitlist', { ask: 'Leave the waitlist?', yes: 'Yes, leave', no: 'Stay on it', cls: 'btn btn--danger btn--sm' })
          : confirmable('cancel', reg.id, 'Cancel registration', { ask: 'Cancel registration?', yes: 'Yes, cancel', no: 'Keep my pass', cls: 'btn btn--danger btn--sm' })}</div>` : ''}

        ${e.description ? `<section class="prose"><h2>About</h2><p>${esc(e.description)}</p></section>` : ''}

        <section class="going" aria-labelledby="going-h">
          <h2 id="going-h">${e.going > 0 ? `${esc(nf(e.going))} going` : 'Be the first to go'}${e.waitlisted > 0 ? `<span class="muted"> · ${esc(nf(e.waitlisted))} on the waitlist</span>` : ''}</h2>
          ${hostelBars(e.by_hostel) || (e.going > 0 ? '' : '<p class="muted">Hostel counts show up once people register.</p>')}
          ${e.going > 0 ? '<p class="fine">Counts by hostel only. Names are never shown.</p>' : ''}
        </section>
      </div>
      <div class="event__cta">${actionBar(e, user, route)}</div>
    </article>`;

  return {
    title: e.title,
    nav: fest ? 'fests' : 'explore',
    html,
    mount(root) {
      const q = route.query;
      // Finish what they started: coming back from login/onboarding completes the registration.
      if (q.get('register') === '1' || q.get('team') === '1') {
        history.replaceState(null, '', `#/e/${enc(e.id)}`);
        if (page) page.route = parseRoute();
      }
      if (q.get('register') === '1' && me() && !needsOnboarding() && !activeReg(e) && e.team_max <= 1 && e.reg_mode !== 'external') {
        setTimeout(() => doRegister(e.id), 0);
      }
      if (q.get('team') === '1') {
        const input = root.querySelector('#team-name');
        if (input) setTimeout(() => { input.scrollIntoView({ block: 'center' }); input.focus({ preventScroll: true }); }, 50);
      }
    },
  };
}

function doRegister(eventId, opts = {}) {
  const here = `#/e/${enc(eventId)}`;
  const isTeam = !!(opts.teamName || opts.teamCode);
  if (!me()) { go(loginHref(isTeam ? here : `${here}?register=1`)); return null; }
  if (needsOnboarding()) { go(`#/onboarding?next=${enc(isTeam ? here : `${here}?register=1`)}`); return null; }
  mine();
  try {
    const reg = store.register(eventId, opts);
    if (reg?.status === 'waitlisted') toast('You’re on the waitlist. We’ll move you up automatically if a seat frees.');
    else showPassSheet(reg?.id);
    return reg;
  } catch (err) {
    toast(errMsg(err), 'error');
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* "Stamped": the one celebration. The pass rises as a bottom sheet.   */
/* ------------------------------------------------------------------ */

let sheetEl = null;
function closeSheet() {
  if (!sheetEl) return;
  const el = sheetEl;
  sheetEl = null;
  el.classList.add('is-closing');
  setTimeout(() => el.remove(), 200);
  document.removeEventListener('keydown', sheetKeys);
}
function sheetKeys(ev) { if (ev.key === 'Escape') closeSheet(); }

function showPassSheet(regId) {
  const w = safe(() => store.wallet(), []).find((x) => x.registration?.id === regId);
  if (!w) { toast('You’re in. Your pass is in your wallet.'); return; }
  closeSheet();
  const { registration: r, event: e, team } = w;
  const user = me();
  const captain = team && user && team.captain_id === user.id;
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-scrim" data-action="close-sheet"></div>
    <section class="sheet" role="dialog" aria-modal="false" aria-labelledby="sheet-h">
      <header class="sheet__head">
        <span class="sheet__ok" aria-hidden="true">${I.check}</span>
        <h2 id="sheet-h" tabindex="-1">You’re in</h2>
        <button class="iconbtn" type="button" data-action="close-sheet" aria-label="Close">${I.x}</button>
      </header>
      <div class="mini-pass">
        <div class="mini-pass__stub">
          <span class="tile"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span>
          <span class="mini-pass__text"><b>${esc(e.title)}</b><small>${esc(whenLabel(e.starts_at))} · ${esc(e.venue || '')}</small></span>
        </div>
        <div class="mini-pass__body">
          ${qrMarkup(r.qr_token, `Entry QR for ${e.title}`)}
          <p class="pass__code">${esc(r.qr_token)}</p>
        </div>
      </div>
      ${captain ? teamPanel(team, e) : ''}
      <div class="sheet__actions">
        <button class="btn btn--ghost" data-action="ics" data-id="${esc(e.id)}">${I.cal}Add to calendar</button>
        <a class="btn" href="#/wallet?pass=${enc(r.id)}" data-sheet-nav>${I.ticket}View in wallet</a>
      </div>
    </section>`;
  document.body.append(wrap);
  sheetEl = wrap;
  document.addEventListener('keydown', sheetKeys);
  wrap.querySelector('#sheet-h')?.focus({ preventScroll: true });
  navigator.vibrate?.(30);
}

/* ------------------------------------------------------------------ */
/* Fest hub  #/f/:slug                                                 */
/* ------------------------------------------------------------------ */

function viewFest(route, slug) {
  const data = safe(() => store.fest(slug), null);
  if (!data?.fest) return errorPage('Fest not found', 'This fest is not listed yet.', '<a class="btn" href="#/?tab=fests">See all fests</a>');
  const { fest } = data;
  const events = (data.events || []).filter((e) => valid(e.starts_at)).sort((a, b) => toDate(a.starts_at) - toDate(b.starts_at));

  const dayset = new Set(events.map((e) => dayKey(e.starts_at)));
  if (!fest.dates_tbc && fest.starts_on && fest.ends_on) {
    const s = new Date(`${String(fest.starts_on).slice(0, 10)}T12:00:00+05:30`);
    const end = new Date(`${String(fest.ends_on).slice(0, 10)}T12:00:00+05:30`);
    for (let d = s.getTime(), i = 0; d <= end.getTime() && i < 14; d += DAY, i++) dayset.add(dayKey(d));
  }
  const days = [...dayset].sort();
  const today = dayKey(Date.now());
  let day = route.query.get('day');
  if (!days.includes(day)) day = days.includes(today) ? today : days.find((d) => d >= today) || days[0];

  const dayEvents = events.filter((e) => dayKey(e.starts_at) === day);
  const venues = [...new Set(dayEvents.map((e) => e.venue || 'Venue TBC'))].sort();
  const slots = [...new Set(dayEvents.map((e) => timeStr(e.starts_at)))];
  const eligIcon = (e) => (e.eligibility === 'iitd_only'
    ? `<span class="slot__elig">${I.shield}IITD only</span>`
    : `<span class="slot__elig">${I.door}Open to all</span>`);

  const block = (e) => `<a class="slot${isLive(e) ? ' is-live' : ''}" href="#/e/${enc(e.id)}">
      <span class="slot__top"><span class="tile tile--xs"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span><span class="slot__title">${esc(e.title)}</span></span>
      <span class="slot__meta">${isLive(e) ? 'Live · ' : ''}${esc(timeStr(e.starts_at))}${valid(e.ends_at) ? `–${esc(timeStr(e.ends_at))}` : ''}${e.price > 0 ? ` · ${esc(rupees(e.price))}` : ''}</span>
      ${eligIcon(e)}
    </a>`;

  let schedule;
  if (!days.length) {
    schedule = empty('Schedule not out yet', 'Events will appear here as clubs post them.');
  } else if (!dayEvents.length) {
    schedule = empty('Nothing on this day yet', 'Check another day, or come back once the schedule is final.');
  } else {
    const grid = `<div class="sched-wrap" tabindex="0" role="region" aria-label="Schedule grid, scrolls sideways"><table class="sched">
      <caption class="visually-hidden">${esc(fest.name)} schedule for ${esc(dayTitle(day))}, by time and venue</caption>
      <thead><tr><th scope="col">Time</th>${venues.map((v) => `<th scope="col">${esc(v)}</th>`).join('')}</tr></thead>
      <tbody>${slots.map((t) => `<tr><th scope="row">${esc(t)}</th>${venues.map((v) => {
        const here = dayEvents.filter((e) => timeStr(e.starts_at) === t && (e.venue || 'Venue TBC') === v);
        return `<td>${here.map(block).join('')}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
    const listView = `<ol class="timeline">${slots.map((t) => `<li>
      <h3 class="timeline__time">${esc(t)}</h3>
      <ul>${dayEvents.filter((e) => timeStr(e.starts_at) === t).map((e) => `<li><a class="tl-item${isLive(e) ? ' is-live' : ''}" href="#/e/${enc(e.id)}">
        <span class="tile"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span>
        <span class="tl-item__body"><span class="tl-item__title">${esc(e.title)}</span>
        <span class="tl-item__meta">${isLive(e) ? liveTag() : ''}<span class="chip chip--venue">${I.pin}${esc(e.venue || 'Venue TBC')}</span>${eligChip(e)}${e.price > 0 ? priceChip(e) : ''}</span></span>
      </a></li>`).join('')}</ul></li>`).join('')}</ol>`;
    schedule = `${grid}${listView}`;
  }

  const dayTabs = days.length > 1 ? `<nav class="tabs" aria-label="Fest days">${days.map((d, i) => `<a class="tab tab--day" href="#/f/${enc(fest.slug)}?day=${d}"${d === day ? ' aria-current="page"' : ''}><small>Day ${i + 1}</small>${esc(dayTitle(d))}</a>`).join('')}</nav>` : '';
  const dates = festDates(fest);

  return {
    title: fest.name,
    nav: 'fests',
    html: `${backLink('#/?tab=fests', 'All fests')}
      <header class="fest-head">
        <h1>${esc(fest.name)}</h1>
        ${fest.tagline ? `<p class="lede">${esc(fest.tagline)}</p>` : ''}
        <p class="fest-head__dates">${I.cal}<span>${esc(dates || 'Dates to be confirmed')}${fest.dates_tbc ? ' <span class="chip chip--tbc">TBC</span>' : ''}</span></p>
      </header>
      ${fest.dates_tbc ? `<p class="note">${I.info}<span>Dates to be confirmed. Times below may change.</span></p>` : ''}
      ${dayTabs}
      <section class="sched-section" aria-label="Schedule">${schedule}</section>
      ${events.length ? `<h2 class="section-title">All ${esc(plural(events.length, 'event'))}</h2><div class="grid">${events.map(eventCard).join('')}</div>` : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/* Club page  #/c/:slug                                                */
/* ------------------------------------------------------------------ */

function viewClub(route, slug) {
  const data = safe(() => store.club(slug), null);
  if (!data?.club) return errorPage('Club not found', 'This club is not on IITD Live yet.');
  const { club } = data;
  const events = data.events || [];
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter((e) => isPast(e)).reverse();
  let insta = '';
  if (club.instagram) {
    const raw = String(club.instagram).trim();
    const url = /^https?:/i.test(raw) ? safeUrl(raw) : `https://instagram.com/${enc(raw.replace(/^@/, ''))}`;
    if (url) insta = `<a class="btn btn--ghost btn--sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${I.insta}Instagram</a>`;
  }
  return {
    title: club.name,
    nav: 'explore',
    html: `${backLink('#/', 'All events')}
      <header class="club-head">
        <span class="club-head__mark" aria-hidden="true">${esc(initials(club.name))}</span>
        <div>
          <h1>${esc(club.name)}${club.verified ? seal('Verified club', 'seal--lg') : ''}</h1>
          <p class="verify-line">${club.verified ? `${I.shield}<span>Verified organiser: confirmed by IITD Live admins.</span>` : `${I.info}<span>Organiser not yet verified.</span>`}</p>
        </div>
        ${insta}
      </header>
      <h2 class="section-title">Upcoming</h2>
      ${upcoming.length ? `<div class="grid">${upcoming.map(eventCard).join('')}</div>` : empty('Nothing scheduled', `${club.name} has no upcoming events right now.`)}
      ${past.length ? `<h2 class="section-title">Past events</h2><div class="grid">${past.slice(0, 8).map(eventCard).join('')}</div>` : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/* Join team  #/t/:code                                                */
/* ------------------------------------------------------------------ */

function teamJoinState(code) {
  const data = safe(() => store.team(code), null);
  if (!data?.team || !data.event) return null;
  const { team, event: e } = data;
  const members = data.members || [];
  const user = me();
  const reg = activeReg(e);
  const inThisTeam = (reg && reg.team_id === team.id) || (user && members.some((m) => m.id === user.id));
  const full = members.length >= (e.team_max || 1);
  let state = 'join';
  if (inThisTeam) state = 'in';
  else if (reg) state = 'other';
  else if (isPast(e) || (e.closes_in_ms != null && e.closes_in_ms <= 0)) state = 'closed';
  else if (full) state = 'full';
  else if (!user) state = 'login';
  else if (needsOnboarding()) state = 'onboard';
  else if (e.eligibility === 'iitd_only' && !user.is_iitd) state = 'ineligible';
  else if (iitdFirstActive(e) && !user.is_iitd) state = 'first';
  return { team, e, members, state };
}

function viewTeam(route, code) {
  const st = teamJoinState(code);
  if (!st) return errorPage('Invite not valid', 'This team invite does not match any team. Ask your captain to send the link again.');
  const { team, e, members, state } = st;
  const here = `#/t/${enc(team.invite_code)}`;
  const reason = (t) => `<p class="reason">${I.info}<span>${t}</span></p>`;
  const ctas = {
    in: `<p class="state state--ok">${I.check}<b>You’re in this team.</b></p><a class="btn btn--block" href="#/e/${enc(e.id)}">Go to event</a>`,
    other: `${reason('You’re already registered for this event. Cancel that registration first to switch teams.')}<a class="btn btn--ghost btn--block" href="#/e/${enc(e.id)}">Go to event</a>`,
    closed: `${reason('Registration for this event has closed.')}<button class="btn btn--block" disabled>Closed</button>`,
    full: `${reason('This team is full. Ask the captain, or start your own team from the event page.')}<button class="btn btn--block" disabled>Team is full</button>`,
    login: `${e.eligibility === 'iitd_only' ? reason('For IIT Delhi students only. Log in with your @iitd.ac.in email.') : ''}<a class="btn btn--block" href="${esc(loginHref(`${here}?join=1`))}">Log in to join ${esc(team.name)}</a>`,
    onboard: `<a class="btn btn--block" href="#/onboarding?next=${enc(`${here}?join=1`)}">Join ${esc(team.name)}</a>`,
    ineligible: `${reason('This event is for IIT Delhi students only, so guests can’t join this team.')}<button class="btn btn--block" disabled>IITD students only</button>`,
    first: `${reason(`IIT Delhi students get first access until ${esc(shortWhen(e.iitd_first_until))}.`)}<button class="btn btn--block" disabled>Opens ${esc(shortWhen(e.iitd_first_until))}</button>`,
    join: `<button class="btn btn--block" data-action="join-team" data-code="${esc(team.invite_code)}" data-id="${esc(e.id)}">Join ${esc(team.name)}</button>`,
  };
  return {
    title: `Join ${team.name}`,
    nav: 'explore',
    html: `<section class="invite">
      <p class="invite__from">${I.users}<span>Team invite</span></p>
      <h1>Join team ${esc(team.name)}</h1>
      <p class="lede">${esc(nf(members.length))} of ${esc(nf(e.team_max))} spots filled</p>
      <div class="grid grid--one">${eventCard(e)}</div>
      ${members.length ? `<ul class="team__members">${members.map((m) => `<li><span class="avatar" aria-hidden="true">${esc(initials(m.name, m.email))}</span>${esc(m.name || 'Teammate')}${m.id === team.captain_id ? ' <small>captain</small>' : ''}</li>`).join('')}</ul>` : ''}
      <div class="panel cta-panel">${ctas[state]}</div>
    </section>`,
    mount() {
      if (route.query.get('join') === '1') {
        history.replaceState(null, '', here);
        if (page) page.route = parseRoute();
        if (state === 'join') setTimeout(() => joinTeam(e.id, team.invite_code), 0);
      }
    },
  };
}

function joinTeam(eventId, code) {
  const reg = doRegister(eventId, { teamCode: code });
  // pushState (not a hash change) so the "You're in" sheet stays up over the event page.
  if (reg) { history.pushState(null, '', `#/e/${enc(eventId)}`); renderRoute(); }
}

/* ------------------------------------------------------------------ */
/* Wallet  #/wallet                                                    */
/* ------------------------------------------------------------------ */

const STATUS = { confirmed: 'Confirmed', waitlisted: 'Waitlisted', checked_in: 'Checked in', cancelled: 'Cancelled' };
const passOpen = new Map(); // remembers which passes the person expanded or collapsed

function passCard(w, user, { open }) {
  const { registration: r, event: e, team } = w;
  const past = isPast(e);
  const showQr = r.status === 'confirmed' || r.status === 'checked_in';
  const isOpen = passOpen.has(r.id) ? passOpen.get(r.id) : open;
  const statusChip = r.status === 'checked_in'
    ? `<span class="status status--confirmed">${I.check}Checked in${r.checked_in_at ? ` · ${esc(timeStr(r.checked_in_at))}` : ''}</span>`
    : r.status === 'waitlisted' ? '<span class="status status--waitlisted">Waitlisted</span>'
      : `<span class="status status--confirmed">${I.check}Confirmed</span>`;
  const captain = team && user && team.captain_id === user.id;
  return `<details class="pass pass--${esc(r.status)}${past ? ' is-past' : ''}" id="pass-${esc(r.id)}" data-pass="${esc(r.id)}"${isOpen ? ' open' : ''}>
    <summary class="pass__stub">
      <span class="tile"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span>
      <span class="pass__head">
        <span class="pass__when">${isLive(e) ? 'Happening now' : esc(whenLabel(e.starts_at))}</span>
        <span class="pass__title" role="heading" aria-level="2">${esc(e.title)}</span>
        <span class="pass__venue">${I.pin}<span>${esc(e.venue || 'Venue TBC')}</span></span>
        ${e.club ? `<span class="pass__club">${clubName(e.club)}</span>` : ''}
        ${user && !user.is_iitd && !past ? '<span class="pass__id">Carry your college ID</span>' : ''}
      </span>
      <span class="pass__toggle" aria-hidden="true">${I.down}</span>
    </summary>
    <div class="pass__perf" aria-hidden="true"></div>
    <div class="pass__body">
      ${e.live_note && !past ? liveBanner(e, { small: true }) : ''}
      ${showQr
        ? `<div class="pass__qr">${qrMarkup(r.qr_token, `Entry QR for ${e.title}`)}</div>
           <p class="pass__codelabel">Pass code</p>
           <p class="pass__code">${esc(r.qr_token)}</p>`
        : '<div class="state state--wait state--panel"><b>No QR yet: you’re on the waitlist.</b> We’ll move you up automatically if a seat frees, and your QR will appear here.</div>'}
      <dl class="pass__holder">
        <div class="pass__holder-name"><dt>Name</dt><dd class="pass__name">${esc(user?.name || user?.email || '')}</dd></div>
        ${user?.entry_no ? `<div><dt>Entry no.</dt><dd class="mono">${esc(user.entry_no)}</dd></div>` : ''}
        ${user?.hostel ? `<div><dt>Hostel</dt><dd>${esc(user.hostel)}</dd></div>` : ''}
        ${team ? `<div><dt>Team</dt><dd>${esc(team.name)}</dd></div>` : ''}
        <div><dt>Status</dt><dd>${statusChip}</dd></div>
      </dl>
      <div class="pass__actions">
        <button class="btn btn--ghost btn--sm" data-action="ics" data-id="${esc(e.id)}">${I.cal}Add to calendar</button>
        ${captain && !past ? `<a class="btn btn--ghost btn--sm" href="${esc(waLink(teamInviteText(team, e)))}" target="_blank" rel="noopener noreferrer">${I.chat}Share team link</a>` : ''}
        <a class="btn btn--ghost btn--sm" href="#/e/${enc(e.id)}">Event page</a>
        ${r.status !== 'checked_in' && !past ? confirmable('cancel', r.id, r.status === 'waitlisted' ? 'Leave waitlist' : 'Cancel', { ask: r.status === 'waitlisted' ? 'Leave the waitlist?' : 'Cancel registration?', yes: r.status === 'waitlisted' ? 'Yes, leave' : 'Yes, cancel', no: 'Keep my pass', cls: 'btn btn--danger btn--sm' }) : ''}
      </div>
    </div>
  </details>`;
}

function viewWallet(route) {
  const user = me();
  const list = safe(() => store.wallet(), []).filter((w) => w?.registration && w.registration.status !== 'cancelled' && w.event);
  const upcoming = list.filter((w) => !isPast(w.event));
  const past = list.filter((w) => isPast(w.event));
  const target = route.query.get('pass');
  const openFor = (w, i) => w.registration.id === target || isLive(w.event) || isToday(w.event.starts_at) || (i === 0 && !target);
  return {
    title: 'Wallet',
    nav: 'wallet',
    html: `<header class="page-head"><h1>Your passes</h1>
        ${upcoming.length ? '<p class="lede">Turn your brightness up at the gate. This pass works offline.</p>' : ''}</header>
      ${!list.length ? empty('No passes yet', 'Register for an event and your QR pass appears here, ready for the gate.', '<a class="btn" href="#/">Explore events</a>') : ''}
      ${upcoming.length ? `<div class="passes">${upcoming.map((w, i) => passCard(w, user, { open: openFor(w, i) })).join('')}</div>` : list.length ? empty('Nothing coming up', 'Your next pass will show here.', '<a class="btn" href="#/">Explore events</a>') : ''}
      ${past.length ? `<h2 class="section-title">Past passes</h2><div class="passes">${past.map((w) => passCard(w, user, { open: w.registration.id === target })).join('')}</div>` : ''}`,
    mount(root) {
      if (target) {
        const el = root.querySelector(`#pass-${CSS.escape(target)}`);
        if (el) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 60);
      }
    },
  };
}

document.addEventListener('toggle', (ev) => {
  const d = ev.target;
  if (d instanceof HTMLDetailsElement && d.dataset.pass) passOpen.set(d.dataset.pass, d.open);
}, true);

/* ------------------------------------------------------------------ */
/* Login + onboarding                                                  */
/* ------------------------------------------------------------------ */

const isIitdEmail = (s) => /iitd\.ac\.in$/i.test(String(s || '').trim());

function afterLogin(next) {
  const n = safeNext(next);
  if (needsOnboarding()) go(`#/onboarding?next=${enc(n)}`, { replace: true });
  else go(n, { replace: true });
}

function idChip(user) {
  return user?.is_iitd ? `<span class="idchip idchip--iitd">${seal('IITD verified')}IITD verified</span>` : '<span class="idchip">Guest (non-IITD)</span>';
}

function viewLogin(route) {
  const next = safeNext(route.query.get('next'));
  const user = me();
  if (user) {
    return {
      title: 'Log in',
      nav: 'me',
      html: `<section class="auth">
        <h1>You’re logged in</h1>
        <p class="whoami"><span class="avatar" aria-hidden="true">${esc(initials(user.name, user.email))}</span><span>${esc(user.name || user.email)}</span>${idChip(user)}</p>
        <div class="stack">
          <a class="btn btn--block" href="${esc(next)}">Continue</a>
          <button class="btn btn--ghost btn--block" data-action="logout">Log out and switch account</button>
        </div>
      </section>`,
    };
  }
  const accounts = Array.isArray(DEMO_ACCOUNTS) ? DEMO_ACCOUNTS : [];
  const finishing = /register=1|team=1|join=1/.test(next);
  return {
    title: 'Log in',
    nav: 'me',
    static: true,
    html: `<section class="auth">
      <h1>${finishing ? 'Log in to finish registering' : 'Log in'}</h1>
      <p class="lede">${finishing ? 'We’ll complete your registration as soon as you’re in.' : 'Browsing is open to everyone. You need an account only to register, join a team or keep passes.'}</p>

      <form class="form" data-form="login" novalidate>
        <input type="hidden" name="next" value="${esc(next)}">
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@iitd.ac.in" aria-describedby="login-hint">
          <p class="hint" id="login-hint" aria-live="polite">Use your @iitd.ac.in email to get the IITD verified seal.</p>
        </div>
        <button class="btn btn--block" type="submit">Continue</button>
        <p class="fine">In the real app we email a one-time code to this address, so only the owner of an IITD inbox gets the seal. This demo skips the code and logs you straight in.</p>
      </form>

      ${accounts.length ? `<div class="demo">
        <h2>Try a demo account</h2>
        <p class="muted">One tap. Each shows a different side of the app.</p>
        <div class="demo__list">${accounts.map((a) => `<button type="button" class="demo__btn" data-action="demo-login" data-email="${esc(a.email)}" data-next="${esc(next)}">
          <span class="avatar" aria-hidden="true">${esc(initials(a.label, a.email))}</span>
          <span class="demo__text"><b>${esc(a.label)}</b><small>${esc(a.email)}</small></span>
          ${isIitdEmail(a.email) ? `<span class="idchip idchip--iitd">${seal('IITD verified')}IITD</span>` : '<span class="idchip">Guest</span>'}
        </button>`).join('')}</div>
      </div>` : ''}
    </section>`,
    mount(root) {
      const input = root.querySelector('#login-email');
      const hint = root.querySelector('#login-hint');
      input?.addEventListener('input', () => {
        const v = input.value.trim();
        hint.classList.remove('field-error');
        if (!v.includes('@')) hint.textContent = 'Use your @iitd.ac.in email to get the IITD verified seal.';
        else if (isIitdEmail(v)) hint.innerHTML = `<span class="idchip idchip--iitd">${seal('IITD verified')}IITD verified</span> You can register for IITD-only events.`;
        else hint.textContent = 'Not an IITD email: you’ll join as a guest and can register for events open to all.';
      });
    },
  };
}

function viewOnboarding(route) {
  const user = me();
  const next = route.query.get('next');
  const needs = needsOnboarding();
  const hostels = Array.isArray(HOSTELS) ? HOSTELS : [];
  const organiser = user.role === 'organiser' || user.role === 'admin';
  const finishing = next && /register=1|team=1|join=1/.test(next);
  return {
    title: needs ? 'Your profile' : 'Profile',
    nav: 'me',
    static: true,
    html: `<section class="auth">
      <h1>${needs ? 'One-time profile' : 'Your profile'}</h1>
      <p class="lede">${needs ? `Fill this once. After that, every registration is a single tap.${finishing ? ' We’ll finish your registration next.' : ''}` : 'This pre-fills every registration.'}</p>
      <p class="whoami"><span class="avatar" aria-hidden="true">${esc(initials(user.name, user.email))}</span><span>${esc(user.email)}</span>${idChip(user)}</p>
      <form class="form" data-form="onboarding" novalidate>
        <input type="hidden" name="next" value="${esc(next ? safeNext(next) : '')}">
        <div class="field">
          <label for="ob-name">Full name</label>
          <input id="ob-name" name="name" required maxlength="60" autocomplete="name" value="${esc(user.name || '')}">
        </div>
        ${user.is_iitd ? `<div class="field">
          <label for="ob-entry">Entry number</label>
          <input id="ob-entry" name="entry_no" required maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" class="mono" placeholder="2023CS10234" value="${esc(user.entry_no || '')}" aria-describedby="ob-entry-hint">
          <p class="hint" id="ob-entry-hint">Organisers use this to check you in. We never show it publicly.</p>
        </div>
        <div class="field">
          <label for="ob-hostel">Hostel</label>
          <select id="ob-hostel" name="hostel" required aria-describedby="ob-hostel-hint">
            <option value="">Choose your hostel</option>
            ${hostels.map((h) => `<option${h === user.hostel ? ' selected' : ''}>${esc(h)}</option>`).join('')}
          </select>
          <p class="hint" id="ob-hostel-hint">Only used for counts like “38 from Aravali going”. Never your name.</p>
        </div>` : `<p class="note">${I.info}<span>You’re joining as a guest from outside IIT Delhi, so we only need your name. Carry your college ID to events.</span></p>`}
        <div class="field">
          <label for="ob-phone">Phone <small>(optional)</small></label>
          <input id="ob-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="15" placeholder="98765 43210" value="${esc(user.phone || '')}" aria-describedby="ob-phone-hint">
          <p class="hint" id="ob-phone-hint">Shared only with organisers of events you register for, so they can reach you about changes.</p>
        </div>
        <button class="btn btn--block" type="submit">${needs ? (finishing ? 'Save and register' : 'Save and continue') : 'Save changes'}</button>
      </form>
      ${needs ? '' : `<nav class="linklist" aria-label="Account">
        <a href="#/wallet">${I.ticket}<span>My passes</span>${I.chev}</a>
        <a href="#/org">${I.flag}<span>${organiser ? 'Organiser dashboard' : 'Run a club? Post events'}</span>${I.chev}</a>
        ${isAdmin(user) ? `<a href="#/admin">${I.shield}<span>Admin</span>${I.chev}</a>` : ''}
        <button type="button" data-action="logout">${I.logout}<span>Log out</span></button>
      </nav>`}
    </section>`,
  };
}

/* ------------------------------------------------------------------ */
/* Organiser                                                           */
/* ------------------------------------------------------------------ */

function viewOrg() {
  const user = me();
  if (!user) {
    return {
      title: 'Organise',
      nav: 'org',
      html: `<section class="auth">
        <h1>Run events at IITD</h1>
        <p class="lede">Post an event in two minutes, take registrations without Google Forms, check people in by QR and export the list as CSV.</p>
        <a class="btn btn--block" href="${esc(loginHref('#/org'))}">Log in to start</a>
      </section>`,
    };
  }
  const clubs = safe(() => store.myClubs(), []);
  if (!clubs.length) {
    return {
      title: 'Organise',
      nav: 'org',
      static: true,
      html: `<section class="auth">
        <h1>Set up your club</h1>
        <p class="lede">Your club page lists every event you post. New clubs show “Organiser not yet verified” until an admin checks the club is real; then the verified seal appears everywhere.</p>
        <form class="form" data-form="club-create" novalidate>
          <div class="field">
            <label for="club-name">Club or society name</label>
            <input id="club-name" name="name" required maxlength="60" placeholder="e.g. DevClub IITD">
          </div>
          <button class="btn btn--block" type="submit">Create club</button>
          <p class="fine">You can post events straight away while verification is pending.</p>
        </form>
      </section>`,
    };
  }

  const rows = [];
  for (const c of clubs) {
    const evs = safe(() => store.club(c.slug)?.events, []) || [];
    for (const e of evs) rows.push({ e, s: safe(() => store.stats(e.id), null) });
  }
  rows.sort((a, b) => (Number(isPast(a.e)) - Number(isPast(b.e))) || (toDate(a.e.starts_at) - toDate(b.e.starts_at)));

  const eventRow = ({ e, s }) => `<li><a class="orow" href="#/org/e/${enc(e.id)}">
      <span class="tile"${posterStyle(e)} aria-hidden="true">${esc(emojiOf(e))}</span>
      <span class="orow__main">
        <span class="orow__title">${esc(e.title)}</span>
        <span class="orow__meta">${isLive(e) ? 'Live now' : esc(whenLabel(e.starts_at))}${e.status === 'draft' ? ' · <span class="status status--draft">Draft</span>' : ''}</span>
      </span>
      <span class="orow__stats">
        <span><b>${esc(nf(s?.confirmed ?? e.going))}</b>${e.capacity ? `/${esc(nf(e.capacity))}` : ''} going</span>
        ${s?.waitlisted ? `<span><b>${esc(nf(s.waitlisted))}</b> waitlist</span>` : ''}
        ${s?.checked_in ? `<span><b>${esc(nf(s.checked_in))}</b> in</span>` : ''}
      </span>
    </a></li>`;

  return {
    title: 'Organise',
    nav: 'org',
    html: `<header class="page-head page-head--row">
        <div><h1>Organiser</h1><p class="lede">${esc(plural(rows.length, 'event'))} across ${esc(plural(clubs.length, 'club'))}</p></div>
        <div class="page-head__actions">
          <a class="btn" href="#/org/new">${I.plus}New event</a>
          <a class="btn btn--ghost" href="#/org/scan">${I.scan}Scan passes</a>
        </div>
      </header>
      <ul class="clubs">${clubs.map((c) => `<li>
        <a href="#/c/${enc(c.slug)}" class="clubs__name">${esc(c.name)}${c.verified ? seal() : ''}</a>
        ${c.verified ? '<span class="status status--confirmed">Verified</span>' : '<span class="status status--waitlisted">Pending verification</span>'}
      </li>`).join('')}</ul>
      <h2 class="section-title">Your events</h2>
      ${rows.length ? `<ul class="olist">${rows.map(eventRow).join('')}</ul>` : empty('No events yet', 'Post your first event. Students can register as soon as you publish it.', '<a class="btn" href="#/org/new">Create an event</a>')}
      ${isAdmin(user) ? '<p class="fine"><a href="#/admin">Open admin tools</a></p>' : ''}`,
  };
}

const EMOJIS = ['🎤', '🎸', '💃', '🎭', '🤖', '💻', '🚀', '📚', '🏏', '⚽', '🎨', '🎬', '💡', '🧠', '🎉', '🍕'];
const SWATCHES = ['#8A1538', '#D9480F', '#F08C00', '#2B8A3E', '#0B7285', '#1864AB', '#5F3DC4', '#C2255C', '#495057', '#212529'];

function eventForm(e, clubs, fests, cats, user) {
  const v = (k, d = '') => esc(e?.[k] ?? d);
  const isNew = !e?.id;
  const free = !(e?.price > 0);
  return `<form class="form form--event" data-form="event-save" data-id="${esc(e?.id || '')}" novalidate>
    <section class="preview" aria-label="Card preview">
      <p class="preview__label">How students will see it</p>
      <div class="preview__card" id="ev-preview" inert></div>
      <ul class="preview__missing" id="ev-missing" aria-live="polite"></ul>
    </section>

    <fieldset>
      <legend>Basics</legend>
      <div class="field">
        <label for="ev-club">Club</label>
        <select id="ev-club" name="club_id" required>${clubs.map((c) => `<option value="${esc(c.id)}"${c.id === e?.club_id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="ev-title">Title</label>
        <input id="ev-title" name="title" required maxlength="80" value="${v('title')}" placeholder="e.g. Intro to Rust workshop">
      </div>
      <div class="field-row">
        <div class="field">
          <label for="ev-cat">Category</label>
          <input id="ev-cat" name="category" list="ev-cats" maxlength="30" value="${v('category')}" placeholder="Workshop">
          <datalist id="ev-cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        </div>
        <div class="field">
          <label for="ev-fest">Part of a fest</label>
          <select id="ev-fest" name="fest_id"><option value="">No fest</option>${fests.map((f) => `<option value="${esc(f.id)}"${f.id === e?.fest_id ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field">
        <label for="ev-desc">Description</label>
        <textarea id="ev-desc" name="description" rows="4" maxlength="2000" placeholder="What happens, who it is for, what to bring">${v('description')}</textarea>
      </div>
      <div class="field">
        <label for="ev-emoji">Poster emoji</label>
        <input id="ev-emoji" name="poster_emoji" maxlength="8" value="${esc(emojiOf(e))}">
        <div class="emoji-pick" role="group" aria-label="Pick an emoji">${EMOJIS.map((x) => `<button type="button" data-action="pick-emoji" data-value="${x}" aria-label="Use ${x}">${x}</button>`).join('')}</div>
      </div>
      <div class="field">
        <label for="ev-color">Poster colour</label>
        <div class="swatches">
          <input id="ev-color" name="poster_color" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(e?.poster_color || '') ? e.poster_color : SWATCHES[0])}">
          ${SWATCHES.map((c) => `<button type="button" class="swatch" data-action="pick-color" data-value="${c}" style="--poster:${c}" aria-label="Colour ${c}"></button>`).join('')}
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>When and where <small>(India time)</small></legend>
      <div class="field-row">
        <div class="field"><label for="ev-start">Starts</label><input id="ev-start" name="starts_at" type="datetime-local" required value="${esc(toLocalInput(e?.starts_at))}"></div>
        <div class="field"><label for="ev-end">Ends</label><input id="ev-end" name="ends_at" type="datetime-local" required value="${esc(toLocalInput(e?.ends_at))}"></div>
      </div>
      <div class="field"><label for="ev-venue">Venue</label><input id="ev-venue" name="venue" required maxlength="80" value="${v('venue')}" placeholder="e.g. LHC 108, Dogra Hall, SAC lawns"></div>
    </fieldset>

    <fieldset>
      <legend>Who and ₹</legend>
      <div class="field">
        <span class="label" id="ev-elig-l">Who can go</span>
        <div class="seg" role="radiogroup" aria-labelledby="ev-elig-l">
          <label><input type="radio" name="eligibility" value="open"${e?.eligibility !== 'iitd_only' ? ' checked' : ''}><span>Open to all</span></label>
          <label><input type="radio" name="eligibility" value="iitd_only"${e?.eligibility === 'iitd_only' ? ' checked' : ''}><span>IITD only</span></label>
        </div>
      </div>
      <div class="field" data-show="open">
        <label for="ev-first">IITD-first window ends <small>(optional)</small></label>
        <input id="ev-first" name="iitd_first_until" type="datetime-local" value="${esc(toLocalInput(e?.iitd_first_until))}" aria-describedby="ev-first-hint">
        <p class="hint" id="ev-first-hint">Until this time only verified IITD students can register. Then it opens to everyone.</p>
      </div>
      <div class="field-row">
        <div class="field"><label for="ev-price">Price (₹)</label><input id="ev-price" name="price" type="number" min="0" step="1" inputmode="numeric" value="${esc(e?.price ?? 0)}" aria-describedby="ev-price-hint"><p class="hint" id="ev-price-hint">0 shows as Free.</p></div>
        <div class="field" data-show="platform"><label for="ev-cap">Seats</label><input id="ev-cap" name="capacity" type="number" min="1" step="1" inputmode="numeric" value="${esc(e?.capacity ?? '')}" placeholder="No limit"></div>
      </div>
      <div class="field" data-show="platform">
        <label for="ev-over">Overbook by (%)</label>
        <input id="ev-over" name="overbook_pct" type="number" min="0" max="100" step="5" inputmode="numeric" value="${esc(e?.overbook_pct ?? (free ? 25 : 0))}" aria-describedby="ev-over-hint">
        <p class="hint" id="ev-over-hint">Free events get no-shows. 25% extra confirmed seats is a safe default; after that people join the waitlist.</p>
      </div>
    </fieldset>

    <fieldset>
      <legend>Teams and registration</legend>
      <div class="field-row">
        <div class="field"><label for="ev-tmin">Team size, min</label><input id="ev-tmin" name="team_min" type="number" min="1" max="20" inputmode="numeric" value="${esc(e?.team_min ?? 1)}"></div>
        <div class="field"><label for="ev-tmax">Team size, max</label><input id="ev-tmax" name="team_max" type="number" min="1" max="20" inputmode="numeric" value="${esc(e?.team_max ?? 1)}"></div>
      </div>
      <div class="field">
        <span class="label" id="ev-mode-l">Where do people register?</span>
        <div class="seg" role="radiogroup" aria-labelledby="ev-mode-l">
          <label><input type="radio" name="reg_mode" value="platform"${e?.reg_mode !== 'external' ? ' checked' : ''}><span>On IITD Live</span></label>
          <label><input type="radio" name="reg_mode" value="external"${e?.reg_mode === 'external' ? ' checked' : ''}><span>Our own link</span></label>
        </div>
      </div>
      <div class="field" data-show="external">
        <label for="ev-url">Registration link</label>
        <input id="ev-url" name="external_url" type="url" inputmode="url" maxlength="300" value="${v('external_url')}" placeholder="https://unstop.com/…" aria-describedby="ev-url-hint">
        <p class="hint" id="ev-url-hint">Paid events link out to your own payment page. IITD Live doesn’t take payments yet.</p>
      </div>
    </fieldset>

    ${isAdmin(user) ? `<fieldset><legend>Admin</legend>
      <label class="check"><input type="checkbox" name="featured" id="ev-featured"${e?.featured ? ' checked' : ''}><span>Feature this event at the top of its tab</span></label>
    </fieldset>` : ''}

    <div class="form__actions">
      <button class="btn" type="submit" name="status" value="published">${isNew || e.status === 'draft' ? 'Publish' : 'Save changes'}</button>
      <button class="btn btn--ghost" type="submit" name="status" value="draft">${!isNew && e.status === 'published' ? 'Unpublish to draft' : 'Save as draft'}</button>
    </div>
  </form>`;
}

function readEventForm(form, submitter) {
  const fd = new FormData(form);
  const s = (k) => String(fd.get(k) ?? '').trim();
  const n = (k, d = null) => (s(k) === '' || Number.isNaN(Number(s(k))) ? d : Math.max(0, Math.round(Number(s(k)))));
  const reg_mode = s('reg_mode') || 'platform';
  const data = {
    club_id: s('club_id'),
    title: s('title'),
    category: s('category'),
    fest_id: s('fest_id') || null,
    description: s('description'),
    starts_at: fromLocalInput(s('starts_at')),
    ends_at: fromLocalInput(s('ends_at')),
    venue: s('venue'),
    reg_mode,
    external_url: reg_mode === 'external' ? s('external_url') || null : null,
    price: n('price', 0),
    capacity: reg_mode === 'platform' ? n('capacity', null) : null,
    overbook_pct: n('overbook_pct', 0),
    team_min: Math.max(1, n('team_min', 1)),
    team_max: Math.max(1, n('team_max', 1)),
    eligibility: s('eligibility') === 'iitd_only' ? 'iitd_only' : 'open',
    iitd_first_until: s('eligibility') === 'open' ? fromLocalInput(s('iitd_first_until')) : null,
    poster_emoji: s('poster_emoji') || '🎟️',
    poster_color: s('poster_color'),
    status: submitter?.value === 'draft' ? 'draft' : 'published',
  };
  if (form.querySelector('[name="featured"]')) data.featured = fd.get('featured') === 'on';
  if (data.capacity === 0) data.capacity = null;
  // Publishing is blocked until the four answers exist.
  const missing = [];
  if (!data.title) missing.push(['ev-title', 'Add a title.']);
  if (!data.starts_at) missing.push(['ev-start', 'Add a start time: it is the first thing on the card.']);
  if (!data.venue) missing.push(['ev-venue', 'Add a venue: students look for it first.']);
  const errs = [];
  if (data.starts_at && !data.ends_at) errs.push(['ev-end', 'Add an end time.']);
  if (data.starts_at && data.ends_at && new Date(data.ends_at) <= new Date(data.starts_at)) errs.push(['ev-end', 'End time must be after the start time.']);
  if (data.team_min > data.team_max) errs.push(['ev-tmax', 'Team max can’t be smaller than team min.']);
  if (reg_mode === 'external' && !safeUrl(data.external_url)) errs.push(['ev-url', 'Add the full registration link, starting with https://']);
  if (data.iitd_first_until && data.starts_at && new Date(data.iitd_first_until) > new Date(data.starts_at)) errs.push(['ev-first', 'The IITD-first window should end before the event starts.']);
  return { data, missing, errs };
}

function viewOrgEvent(route, id) {
  const user = me();
  const clubs = safe(() => store.myClubs(), []);
  if (!clubs.length && !isAdmin(user)) {
    return errorPage('Create your club first', 'Events are posted by clubs. Set yours up, then come back.', '<a class="btn" href="#/org">Set up club</a>');
  }
  const fests = safe(() => store.fests(), []);
  const cats = safe(() => store.categories(), []);
  const allClubs = isAdmin(user) ? safe(() => store.clubs(), clubs) : clubs;

  if (!id) {
    return {
      title: 'New event',
      nav: 'org',
      static: true,
      html: `${backLink('#/org', 'Organiser')}
        <header class="page-head"><h1>New event</h1><p class="lede">Every card answers when, where, ₹ and who can go. Fill those in and you can publish.</p></header>
        ${eventForm(null, allClubs, fests, cats, user)}`,
      mount: (root) => mountEventForm(root, allClubs),
    };
  }

  const e = safe(() => store.event(id), null);
  if (!e) return errorPage('Event not found', 'It may have been deleted.', '<a class="btn" href="#/org">Back to organiser</a>');
  const owns = isAdmin(user) || clubs.some((c) => c.id === e.club_id);
  if (!owns) return errorPage('Not your event', 'Only the club that posted this event can see its attendees.', '<a class="btn" href="#/org">Back to organiser</a>');

  const tab = route.query.get('tab') === 'edit' ? 'edit' : 'dash';
  const published = route.query.get('published') === '1';
  const tabs = `<nav class="tabs" aria-label="Event sections">
    <a class="tab" href="#/org/e/${enc(e.id)}"${tab === 'dash' ? ' aria-current="page"' : ''}>Dashboard</a>
    <a class="tab" href="#/org/e/${enc(e.id)}?tab=edit"${tab === 'edit' ? ' aria-current="page"' : ''}>Edit details</a>
  </nav>`;
  const head = `${backLink('#/org', 'Organiser')}
    <header class="page-head page-head--row">
      <div><h1 class="h-headline">${esc(e.title)}</h1><p class="lede">${isLive(e) ? 'Happening now' : esc(whenLabel(e.starts_at))} · ${esc(e.venue || 'Venue TBC')}${e.status === 'draft' ? ' · <span class="status status--draft">Draft</span>' : ''}</p></div>
      <div class="page-head__actions"><a class="btn btn--ghost btn--sm" href="#/e/${enc(e.id)}">View public page</a></div>
    </header>${tabs}`;

  if (tab === 'edit') {
    return { title: `Edit ${e.title}`, nav: 'org', static: true, html: `${head}${eventForm(e, allClubs, fests, cats, user)}`, mount: (root) => mountEventForm(root, allClubs) };
  }

  const s = safe(() => store.stats(e.id), {}) || {};
  const people = safe(() => store.attendees(e.id), []);
  const confirmed = s.confirmed ?? 0; // includes checked-in people
  const checked = s.checked_in ?? 0;
  const rate = confirmed > 0 ? Math.round((checked / confirmed) * 100) : 0;
  const limit = e.capacity ? Math.floor(e.capacity * (1 + (e.overbook_pct || 0) / 100)) : null;
  const order = { checked_in: 0, confirmed: 1, waitlisted: 2, cancelled: 3 };
  people.sort((a, b) => (order[a.registration?.status] ?? 9) - (order[b.registration?.status] ?? 9));
  const link = linkTo(`#/e/${enc(e.id)}`);

  return {
    title: `${e.title} dashboard`,
    nav: 'org',
    html: `${head}
      ${published && e.status === 'published' ? `<section class="panel panel--share" aria-labelledby="pub-h">
        <h2 id="pub-h">Published. Now share it where students are.</h2>
        <p class="muted">The message already says when, where, ₹ and who can go.</p>
        <div class="actions">
          <a class="btn btn--wa" href="${esc(waLink(`${shareText(e)}\nRegister in 1 tap: ${link}`))}" target="_blank" rel="noopener noreferrer">${I.chat}Share on WhatsApp</a>
          <button class="btn btn--ghost" data-action="copy" data-text="${esc(link)}">${I.copy}Copy link</button>
        </div>
      </section>` : ''}
      <section class="strip" aria-label="Registration numbers">
        <div class="strip__nums">
          <p><b>${esc(nf(confirmed))}</b> confirmed${limit ? ` <span class="muted">of ${esc(nf(limit))}</span>` : ''}</p>
          <p><b>${esc(nf(s.waitlisted ?? 0))}</b> waitlisted</p>
          <p><b>${esc(nf(checked))}</b> checked in</p>
        </div>
        <div class="meter" role="progressbar" aria-label="Check-in progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${rate}"><span style="width:${rate}%"></span></div>
        <p class="strip__rate">${confirmed ? `${rate}% of confirmed people checked in` : 'No registrations yet'}${e.capacity ? ` · ${esc(nf(e.capacity))} seats${e.overbook_pct ? ` + ${esc(e.overbook_pct)}% overbooking` : ''}` : ' · no seat limit'}</p>
      </section>

      <div class="dash">
        <section class="panel" aria-labelledby="upd-h">
          <h2 id="upd-h">Post a live update</h2>
          <p class="muted">Shows on the event page and on every registrant’s pass. Use it for venue or time changes.</p>
          ${e.live_note ? liveBanner(e, { small: true }) : ''}
          <form class="form" data-form="live-update" data-id="${esc(e.id)}" novalidate>
            <label for="upd-note">Update <small>(140 characters)</small></label>
            <textarea id="upd-note" name="note" rows="2" maxlength="140" required placeholder="e.g. Moved to LHC 108. Starting 15 min late."></textarea>
            <button class="btn" type="submit">${I.megaphone}Post update</button>
          </form>
        </section>

        <section class="panel" aria-labelledby="hos-h">
          <h2 id="hos-h">Where people are from</h2>
          ${hostelBars(s.by_hostel || e.by_hostel, { limit: 8 }) || '<p class="muted">No registrations yet.</p>'}
        </section>
      </div>

      <section class="panel" aria-labelledby="att-h">
        <div class="panel__head">
          <h2 id="att-h">Attendees <span class="muted num">(${esc(nf(people.length))})</span></h2>
          <div class="panel__actions">
            <a class="btn btn--ghost btn--sm" href="#/org/scan">${I.scan}Scan</a>
            <button class="btn btn--ghost btn--sm" data-action="csv" data-id="${esc(e.id)}"${people.length ? '' : ' disabled'}>${I.download}Download CSV</button>
          </div>
        </div>
        ${people.length ? `<label class="visually-hidden" for="att-q">Filter attendees</label>
        <input id="att-q" class="filter-input" type="search" placeholder="Filter by name, entry no., hostel or team" autocomplete="off">
        <div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">Name</th><th scope="col">Entry no.</th><th scope="col">Hostel</th><th scope="col">Team</th><th scope="col">Status</th></tr></thead>
          <tbody>${people.map(({ registration: r, profile: p, team: t }) => `<tr data-row="${esc([p?.name, p?.entry_no, p?.hostel, t?.name, p?.email].join(' ').toLowerCase())}">
            <td data-label="Name">${esc(p?.name || p?.email || 'Unknown')}${p && !p.is_iitd ? ' <small class="muted">guest</small>' : ''}</td>
            <td data-label="Entry no." class="mono">${esc(p?.entry_no || '–')}</td>
            <td data-label="Hostel">${esc(p?.hostel || (p?.is_iitd ? '–' : 'Outside IITD'))}</td>
            <td data-label="Team">${esc(t?.name || '–')}</td>
            <td data-label="Status"><span class="status status--${esc(r?.status)}">${esc(STATUS[r?.status] || r?.status || '')}</span>${r?.status === 'checked_in' && r.checked_in_at ? ` <small class="muted num">${esc(timeStr(r.checked_in_at))}</small>` : ''}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : empty('No registrations yet', 'Share the event link on WhatsApp to get the first sign-ups.', `<button class="btn btn--ghost" data-action="share" data-id="${esc(e.id)}">${I.share}Share event</button>`)}
      </section>`,
    mount(root) {
      const q = root.querySelector('#att-q');
      const apply = () => {
        const t = (q?.value || '').trim().toLowerCase();
        root.querySelectorAll('tr[data-row]').forEach((tr) => { tr.hidden = !!t && !tr.dataset.row.includes(t); });
      };
      q?.addEventListener('input', apply);
      apply();
    },
  };
}

function mountEventForm(root, clubs) {
  const form = root.querySelector('form[data-form="event-save"]');
  if (!form) return;
  const preview = root.querySelector('#ev-preview');
  const missingEl = root.querySelector('#ev-missing');
  const sync = () => {
    const mode = form.querySelector('[name="reg_mode"]:checked')?.value || 'platform';
    const elig = form.querySelector('[name="eligibility"]:checked')?.value || 'open';
    form.querySelectorAll('[data-show]').forEach((el) => { el.hidden = !(el.dataset.show === mode || el.dataset.show === elig); });
    const { data, missing } = readEventForm(form, { value: 'published' });
    const club = clubs.find((c) => c.id === data.club_id) || null;
    const fake = {
      ...data, id: 'preview', title: data.title || 'Your event title', club, going: 0,
      starts_at: data.starts_at || new Date(Date.now() + 3 * DAY).toISOString(),
      ends_at: data.ends_at, venue: data.venue, seats_left: null, closes_in_ms: null, featured: !!data.featured,
    };
    if (preview) preview.innerHTML = eventCard(fake);
    if (missingEl) missingEl.innerHTML = missing.map(([, m]) => `<li>${I.info}<span>${esc(m)}</span></li>`).join('');
  };
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  sync();
}

/* ------------------------------------------------------------------ */
/* Scanner  #/org/scan                                                 */
/* ------------------------------------------------------------------ */

let scanner = null;
let scanBusy = false;
let lastScan = { token: '', at: 0 };
const scanLog = [];

function viewScan() {
  const user = me();
  const canScan = safe(() => store.myClubs(), []).length || isAdmin(user);
  return {
    title: 'Scan passes',
    nav: 'org',
    static: true,
    onStore(root) { renderScanLog(root); },
    html: `${backLink('#/org', 'Organiser')}
      <header class="page-head"><h1>Check-in</h1><p class="lede">Point the camera at a pass. If the camera won’t open, type the code instead.</p></header>
      ${canScan ? '' : `<p class="note">${I.info}<span>You can check in passes only for your own club’s events. <a href="#/org">Set up a club</a>.</span></p>`}
      <div class="scan">
        <div class="scan__cam">
          <div id="reader" class="reader"></div>
          <div class="scan__placeholder" id="scan-ph">${I.scan}<span>Camera is off</span></div>
          <button class="btn btn--block" data-action="scan-start" id="scan-start">${I.scan}Start camera</button>
          <button class="btn btn--ghost btn--block" data-action="scan-stop" id="scan-stop" hidden>Stop camera</button>
        </div>
        <div class="scan__side">
          <form class="form" data-form="manual-checkin" novalidate>
            <label for="scan-code">Type a code instead</label>
            <div class="inline">
              <input id="scan-code" name="code" required autocomplete="off" autocapitalize="off" spellcheck="false" class="mono" placeholder="Code under the QR" data-no-restore>
              <button class="btn" type="submit">Check in</button>
            </div>
          </form>
          <h2 class="section-title section-title--sm">This session</h2>
          <ul class="scanlog" id="scan-log"></ul>
        </div>
      </div>
      <div id="scan-result" class="verdict-wrap" role="status" aria-live="assertive"></div>`,
    mount(root) { renderScanLog(root); },
    cleanup() { stopScanner(); },
  };
}

function renderScanLog(root) {
  const ul = root.querySelector('#scan-log');
  if (!ul) return;
  ul.innerHTML = scanLog.length
    ? scanLog.slice(0, 12).map((x) => `<li class="${x.ok ? 'is-ok' : 'is-bad'}">${x.ok ? I.check : I.x}<span><b>${esc(x.name)}</b> ${esc(x.detail)}</span><time>${esc(timeStr(x.at))}</time></li>`).join('')
    : '<li class="scanlog__empty">Check-ins you make here appear in this list.</li>';
}

/** Accept a UUID typed without dashes or in capitals. */
function normaliseCode(raw) {
  let s = String(raw || '').trim();
  const bare = s.replace(/[\s-]/g, '');
  if (/^[0-9a-f]{32}$/i.test(bare)) s = bare.toLowerCase().replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  return s;
}

function doCheckIn(raw) {
  const code = normaliseCode(raw);
  if (!code) { toast('Type the code printed under the QR.', 'error'); return; }
  mine();
  let res;
  try { res = store.checkIn(code); } catch (err) { res = { ok: false, reason: errMsg(err) }; }
  const token = code.split(/[/:#?=]/).pop();
  // Team name and check-in time come from the attendee row.
  const row = res?.event?.id ? safe(() => store.attendees(res.event.id), []).find((a) => a.registration?.qr_token === token) || null : null;
  const name = res?.profile?.name || res?.profile?.email || '';
  const ev = res?.event?.title || '';
  const teamName = row?.team?.name;
  const box = app.querySelector('#scan-result');
  let detail;
  if (res?.ok) {
    detail = ev;
    if (box) box.innerHTML = `<div class="verdict verdict--ok"><span class="verdict__disc">${I.check}</span>
      <p class="verdict__name">${esc(name || 'Checked in')}</p>
      <p class="verdict__sub">${esc([teamName ? `Team ${teamName}` : '', res.profile?.hostel, ev].filter(Boolean).join(' · '))}</p>
      <p class="verdict__sub">Checked in ${esc(timeStr(new Date()))}</p>
      <button class="btn btn--block" data-action="scan-next">Scan next</button></div>`;
    navigator.vibrate?.(60);
  } else {
    let reason = res?.reason || 'invalid pass';
    if (reason === 'already checked in' && row?.registration?.checked_in_at) reason = `Already checked in at ${timeStr(row.registration.checked_in_at)}`;
    else if (reason === 'not your event') reason = 'Pass is for another club’s event';
    else if (reason === 'invalid pass') reason = 'Not a valid pass';
    reason = reason.charAt(0).toUpperCase() + reason.slice(1);
    detail = reason;
    if (box) box.innerHTML = `<div class="verdict verdict--bad"><span class="verdict__disc">${I.x}</span>
      <p class="verdict__name">${esc(reason)}</p>
      <p class="verdict__sub">${esc([name, ev].filter(Boolean).join(' · ') || 'Ask them to open the pass in their wallet, or type the code.')}</p>
      <button class="btn btn--block" data-action="scan-next">Scan next</button></div>`;
    navigator.vibrate?.([80, 60, 80]);
  }
  box?.querySelector('[data-action="scan-next"]')?.focus({ preventScroll: true });
  scanLog.unshift({ ok: !!res?.ok, name: name || 'Unknown pass', detail, at: new Date() });
  renderScanLog(app);
}

async function startScanner() {
  if (scanner) return;
  if (typeof window.Html5Qrcode !== 'function') { toast('The camera scanner did not load. Type the code instead.', 'error'); return; }
  try {
    scanner = new window.Html5Qrcode('reader', { verbose: false });
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } },
      (text) => {
        if (scanBusy) return;
        if (text === lastScan.token && Date.now() - lastScan.at < 4000) return;
        lastScan = { token: text, at: Date.now() };
        scanBusy = true;
        doCheckIn(text);
        setTimeout(() => { scanBusy = false; }, 1500);
      },
      () => {},
    );
    app.querySelector('#scan-ph')?.setAttribute('hidden', '');
    app.querySelector('#scan-start')?.setAttribute('hidden', '');
    app.querySelector('#scan-stop')?.removeAttribute('hidden');
  } catch (err) {
    console.error(err);
    try { scanner?.clear(); } catch { /* ignore */ }
    scanner = null;
    toast('Could not open the camera. Allow camera access, or type the code instead.', 'error');
    app.querySelector('#scan-code')?.focus();
  }
}
async function stopScanner() {
  const s = scanner;
  scanner = null;
  if (!s) return;
  try { await s.stop(); } catch { /* already stopped */ }
  try { s.clear(); } catch { /* ignore */ }
  app.querySelector('#scan-ph')?.removeAttribute('hidden');
  app.querySelector('#scan-start')?.removeAttribute('hidden');
  app.querySelector('#scan-stop')?.setAttribute('hidden', '');
}

/* ------------------------------------------------------------------ */
/* Admin  #/admin                                                      */
/* ------------------------------------------------------------------ */

function viewAdmin() {
  const user = me();
  if (!isAdmin(user)) {
    return errorPage('Admins only', 'Log in with the admin demo account to verify clubs and feature events.', `<a class="btn" href="${esc(loginHref('#/admin'))}">Switch account</a>`);
  }
  const clubs = safe(() => store.clubs(), []).sort((a, b) => Number(a.verified) - Number(b.verified) || a.name.localeCompare(b.name));
  const events = safe(() => store.events({ tab: 'upcoming' }), []);
  const pending = clubs.filter((c) => !c.verified).length;
  return {
    title: 'Admin',
    nav: 'me',
    html: `<header class="page-head"><h1>Admin</h1><p class="lede">Verify clubs so students can trust them, and feature events at the top of their tab.</p></header>
      <section class="panel" aria-labelledby="ac-h">
        <h2 id="ac-h">Clubs <span class="muted num">(${esc(pending)} pending)</span></h2>
        <ul class="adm">${clubs.map((c) => `<li>
          <span class="adm__name"><a href="#/c/${enc(c.slug)}">${esc(c.name)}</a>${c.verified ? seal() : ' <span class="status status--waitlisted">Pending</span>'}${c.instagram ? `<small class="muted">${esc(c.instagram)}</small>` : ''}</span>
          <button class="btn btn--sm${c.verified ? ' btn--ghost' : ''}" data-action="verify" data-id="${esc(c.id)}" data-value="${c.verified ? '0' : '1'}">${c.verified ? 'Unverify' : 'Verify'}</button>
        </li>`).join('')}</ul>
      </section>
      <section class="panel" aria-labelledby="ae-h">
        <h2 id="ae-h">Upcoming events <span class="muted num">(${esc(events.length)})</span></h2>
        <p class="muted">Only events from verified clubs can be featured.</p>
        <ul class="adm">${events.map((e) => {
          const canFeature = e.featured || e.club?.verified;
          return `<li>
          <span class="adm__name"><a href="#/e/${enc(e.id)}">${esc(e.title)}</a>${e.featured ? ' <span class="chip chip--first">Featured</span>' : ''}<small class="muted">${esc(e.club?.name || '')} · ${esc(whenLabel(e.starts_at))}${canFeature ? '' : ' · club not verified'}</small></span>
          <button class="btn btn--sm btn--ghost" data-action="feature" data-id="${esc(e.id)}" data-value="${e.featured ? '0' : '1'}" aria-pressed="${!!e.featured}"${canFeature ? '' : ' disabled'}>${e.featured ? 'Unfeature' : 'Feature'}</button>
        </li>`;
        }).join('')}</ul>
      </section>
      <section class="panel panel--danger" aria-labelledby="ar-h">
        <h2 id="ar-h">Reset demo data</h2>
        <p class="muted">Wipes every registration, club and edit in this browser and reloads the sample events.</p>
        ${confirmable('reset', '', 'Reset demo data', { ask: 'Wipe everything in this browser?', yes: 'Yes, reset', no: 'Keep my data' })}
      </section>`,
  };
}

/* ------------------------------------------------------------------ */
/* Events: clicks, forms, inputs                                       */
/* ------------------------------------------------------------------ */

const actions = {
  register(btn) { doRegister(btn.dataset.id); },
  'join-team'(btn) { joinTeam(btn.dataset.id, btn.dataset.code); },
  'toggle-team'(btn) {
    const panel = app.querySelector('#team-forms');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) app.querySelector('#team-name')?.focus();
  },
  ask(btn) {
    const wrap = btn.closest('[data-confirm-wrap]');
    btn.hidden = true;
    const askEl = wrap.querySelector('.confirm__ask');
    askEl.hidden = false;
    askEl.querySelector('.btn--danger')?.focus();
  },
  unask(btn) {
    const wrap = btn.closest('[data-confirm-wrap]');
    wrap.querySelector('.confirm__ask').hidden = true;
    const b = wrap.querySelector('[data-action="ask"]');
    b.hidden = false; b.focus();
  },
  cancel(btn) {
    mine();
    store.cancel(btn.dataset.id);
    toast('Cancelled. If anyone was waiting, your seat went to them.');
  },
  ics(btn) {
    const e = store.event(btn.dataset.id);
    download(`${slugify(e?.title)}.ics`, store.ics(btn.dataset.id), 'text/calendar;charset=utf-8');
    toast('Calendar file downloaded. Open it to add the event.');
  },
  async share(btn) {
    const e = store.event(btn.dataset.id);
    if (!e) return;
    const url = linkTo(`#/e/${enc(e.id)}`);
    const text = shareText(e);
    if (navigator.share) {
      try { await navigator.share({ title: e.title, text, url }); return; } catch (err) { if (err?.name === 'AbortError') return; }
    }
    window.open(waLink(`${text}\nRegister in 1 tap: ${url}`), '_blank', 'noopener');
  },
  async copy(btn) {
    const ok = await copyText(btn.dataset.text || '');
    toast(ok ? 'Link copied' : 'Could not copy. Long-press the link to copy it.', ok ? 'ok' : 'error');
  },
  'demo-login'(btn) {
    mine();
    const p = store.login(btn.dataset.email);
    toast(`Logged in as ${p?.name || p?.email || btn.dataset.email}`);
    afterLogin(btn.dataset.next);
  },
  logout() {
    stopScanner();
    closeSheet();
    store.logout();
    toast('Logged out');
    go('#/');
  },
  filter(btn) {
    const { key, value } = btn.dataset;
    feed[key] = feed[key] === value ? '' : value;
    refresh();
  },
  'clear-filters'() { feed.category = ''; feed.price = ''; feed.eligibility = ''; refresh(); },
  csv(btn) {
    const e = store.event(btn.dataset.id);
    download(`${slugify(e?.title)}-attendees.csv`, `﻿${store.toCSV(btn.dataset.id)}`, 'text/csv;charset=utf-8');
  },
  verify(btn) {
    const on = btn.dataset.value === '1';
    store.setVerified(btn.dataset.id, on);
    toast(on ? 'Club verified. The seal now shows everywhere.' : 'Verification removed');
  },
  feature(btn) {
    const on = btn.dataset.value === '1';
    store.setFeatured(btn.dataset.id, on);
    toast(on ? 'Event featured' : 'Event unfeatured');
  },
  reset() {
    stopScanner();
    closeSheet();
    store.reset();
    scanLog.length = 0;
    passOpen.clear();
    feed.tab = null;
    toast('Demo data reset');
    go('#/');
  },
  'pick-emoji'(btn) {
    const input = app.querySelector('#ev-emoji');
    if (input) { input.value = btn.dataset.value; input.dispatchEvent(new Event('input', { bubbles: true })); }
  },
  'pick-color'(btn) {
    const input = app.querySelector('#ev-color');
    if (input) { input.value = btn.dataset.value; input.dispatchEvent(new Event('input', { bubbles: true })); }
  },
  'scan-start'() { startScanner(); },
  'scan-stop'() { stopScanner(); },
  'scan-next'() {
    const box = app.querySelector('#scan-result');
    if (box) box.innerHTML = '';
    lastScan = { token: '', at: 0 };
    if (!scanner) app.querySelector('#scan-code')?.focus();
  },
  'close-sheet'() { closeSheet(); },
};

document.addEventListener('click', async (ev) => {
  const skip = ev.target.closest('[data-skip]');
  if (skip) { ev.preventDefault(); const m = document.getElementById('main'); m?.focus(); m?.scrollIntoView(); return; }
  if (ev.target.closest('[data-sheet-nav]')) { closeSheet(); return; } // let the link navigate
  const btn = ev.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  const fn = actions[btn.dataset.action];
  if (!fn) return;
  ev.preventDefault();
  try { await fn(btn); } catch (err) { console.error(err); toast(errMsg(err), 'error'); }
});

/** Mark the field, move focus to it, and surface the message (as a toast) in the product's words. */
function fieldError(form, id, msg) {
  const el = form.querySelector(`#${id}`);
  if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  throw new Error(msg);
}

const forms = {
  login(form) {
    const email = String(new FormData(form).get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const hint = form.querySelector('#login-hint');
      if (hint) { hint.textContent = 'Enter your full email address, like you@iitd.ac.in.'; hint.classList.add('field-error'); }
      fieldError(form, 'login-email', 'Enter your full email address, like you@iitd.ac.in.');
    }
    mine();
    const p = store.login(email);
    toast(p?.is_iitd ? 'Logged in · IITD verified' : 'Logged in as a guest');
    afterLogin(new FormData(form).get('next'));
  },
  onboarding(form) {
    const fd = new FormData(form);
    const patch = { name: String(fd.get('name') || '').trim(), phone: String(fd.get('phone') || '').trim() };
    if (fd.has('entry_no')) patch.entry_no = String(fd.get('entry_no') || '').trim().toUpperCase();
    if (fd.has('hostel')) patch.hostel = String(fd.get('hostel') || '');
    if (!patch.name) fieldError(form, 'ob-name', 'Add your name so organisers know who’s coming.');
    if (fd.has('entry_no') && !patch.entry_no) fieldError(form, 'ob-entry', 'Add your entry number. It’s on your IITD ID card.');
    if (fd.has('hostel') && !patch.hostel) fieldError(form, 'ob-hostel', 'Pick your hostel, or Day Scholar.');
    if (patch.phone && !/^[+\d][\d\s-]{7,14}$/.test(patch.phone)) fieldError(form, 'ob-phone', 'That phone number looks off. Use 10 digits, like 98765 43210.');
    mine();
    store.updateProfile(patch);
    const next = String(fd.get('next') || '');
    toast('Profile saved');
    if (next) go(safeNext(next), { replace: true }); else renderRoute();
  },
  'team-create'(form) {
    const teamName = String(new FormData(form).get('teamName') || '').trim();
    if (!teamName) fieldError(form, 'team-name', 'Give your team a name.');
    doRegister(parseRoute().parts[1], { teamName });
  },
  'team-join'(form) {
    const raw = String(new FormData(form).get('teamCode') || '').trim();
    const code = raw.includes('/t/') ? raw.split('/t/').pop().split(/[?#]/)[0] : raw;
    if (!code) fieldError(form, 'team-code', 'Paste the invite code or link from your captain.');
    doRegister(parseRoute().parts[1], { teamCode: decodeURIComponent(code) });
  },
  'club-create'(form) {
    const name = String(new FormData(form).get('name') || '').trim();
    if (!name) fieldError(form, 'club-name', 'Enter your club’s name.');
    mine();
    store.createClub(name);
    toast(`${name} created. Now post your first event.`);
    go('#/org/new');
  },
  'event-save'(form, submitter) {
    const { data, missing, errs } = readEventForm(form, submitter);
    const problems = data.status === 'published' ? [...missing, ...errs] : [...missing.filter(([k]) => k === 'ev-title' || k === 'ev-start'), ...errs];
    if (problems.length) fieldError(form, problems[0][0], problems[0][1]);
    if (form.dataset.id) data.id = form.dataset.id;
    mine();
    const saved = store.saveEvent(data);
    const id = saved?.id || data.id;
    toast(data.status === 'draft' ? 'Saved as draft' : form.dataset.id ? 'Changes saved' : 'Published. Students can register now.');
    go(`#/org/e/${enc(id)}${data.status === 'published' && !form.dataset.id ? '?published=1' : ''}`);
  },
  'live-update'(form) {
    const note = String(new FormData(form).get('note') || '').trim();
    if (!note) fieldError(form, 'upd-note', 'Write the update first.');
    mine();
    store.postUpdate(form.dataset.id, note);
    form.reset();
    toast('Update posted. Everyone registered sees it on their pass.');
  },
  'manual-checkin'(form) {
    const input = form.querySelector('#scan-code');
    doCheckIn(input?.value);
    if (input) input.value = '';
  },
};

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]');
  if (!form) return;
  ev.preventDefault();
  const fn = forms[form.dataset.form];
  if (!fn) return;
  try { fn(form, ev.submitter); } catch (err) { console.error(err); toast(errMsg(err), 'error'); }
});

document.addEventListener('input', (ev) => {
  if (ev.target.matches?.('[aria-invalid="true"]')) ev.target.removeAttribute('aria-invalid');
});
document.addEventListener('change', (ev) => {
  const sel = ev.target.closest('[data-change="category"]');
  if (sel) { feed.category = sel.value; refresh(); }
});

// Top-bar search: live filtering of the feed.
let searchTimer = 0;
searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    feed.q = searchInput.value;
    if (parseRoute().path !== '/') { history.pushState(null, '', '#/'); renderRoute(); searchInput.focus(); }
    else refresh();
  }, 120);
});
document.getElementById('search-form')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  feed.q = searchInput.value;
  if (parseRoute().path !== '/') go('#/'); else refresh();
  if (matchMedia('(max-width: 999px)').matches) searchInput.blur();
});
// Choosing a feed tab clears an active search.
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a.tab[href^="#/?tab="], [data-nav="explore"], [data-nav="fests"]');
  if (a && feed.q) { feed.q = ''; if (searchInput) searchInput.value = ''; }
}, true);

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

window.addEventListener('hashchange', () => { closeSheet(); renderRoute(); });
try { store.subscribe(() => refresh()); } catch (err) { console.error(err); }
// Keep "Live" and "Closes in" honest without a reload.
setInterval(() => {
  if (document.hidden || !page || page.static) return;
  const a = document.activeElement;
  if (a && app.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  refresh();
}, 60e3);

renderRoute();
