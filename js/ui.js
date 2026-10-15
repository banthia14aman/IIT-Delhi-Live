// IITD Live: hash router + every view. Talks to the data layer only through store.js.
import { store, HOSTELS, DEMO_ACCOUNTS } from './store.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TZ = 'Asia/Kolkata';
const HOUR = 3600e3;
const DAY = 24 * HOUR;

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
  if (/^[a-z]{3,20}$/i.test(s)) return s;
  return '';
}
const posterStyle = (e) => {
  const c = safeColor(e?.poster_color);
  return c ? ` style="--poster:${c}"` : '';
};

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
function hourIST(d) {
  return Number(fmt({ hour: '2-digit', hourCycle: 'h23' }).format(toDate(d)));
}
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
/** "Sat 18 Oct · 6:30 – 9:00 PM" style range for the event page. */
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
const isLive = (e) => valid(e.starts_at) && Date.now() >= toDate(e.starts_at).getTime() && Date.now() <= endOf(e).getTime();
const isPast = (e) => valid(e.starts_at) && Date.now() > endOf(e).getTime();

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

const rupees = (n) => (Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');
const plural = (n, one, many = `${one}s`) => `${Number(n).toLocaleString('en-IN')} ${n === 1 ? one : many}`;
const initials = (name, email) => {
  const src = (name || email || '?').trim();
  const bits = src.split(/[\s@._-]+/).filter(Boolean);
  return ((bits[0]?.[0] || '?') + (bits[1]?.[0] || '')).toUpperCase();
};
const baseUrl = () => location.href.split('#')[0];
const linkTo = (hash) => `${baseUrl()}${hash}`;

function closesLabel(e) {
  const ms = e.closes_in_ms;
  if (ms == null || ms <= 0 || ms > DAY || isLive(e)) return '';
  if (ms < HOUR) return `Closes in ${Math.max(1, Math.round(ms / 60e3))} min`;
  return `Closes in ${Math.round(ms / HOUR)}h`;
}
function seatsLabel(e) {
  if (e.reg_mode === 'external' || e.seats_left == null) return '';
  if (e.seats_left <= 0) return 'Waitlist only';
  const threshold = Math.max(10, Math.ceil((e.capacity || 0) * 0.2));
  return e.seats_left <= threshold ? `${plural(e.seats_left, 'seat')} left` : '';
}
function iitdFirstActive(e) {
  return e.eligibility === 'open' && valid(e.iitd_first_until) && toDate(e.iitd_first_until).getTime() > Date.now();
}
function eligibilityText(e) {
  if (e.eligibility === 'iitd_only') return 'IITD only';
  if (iitdFirstActive(e)) return 'IITD first';
  return 'Open to all';
}

/* ------------------------------------------------------------------ */
/* Icons (one stroke family, 24px grid)                                */
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
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  scan: svg('<path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3M4 12h16"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  megaphone: svg('<path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5V5L7 9.5H5a1 1 0 0 0-1 1z"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5"/>'),
  download: svg('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  flag: svg('<path d="M5 20V4.5"/><path d="M5 5h11.5l-2 3.5 2 3.5H5"/>'),
  star: svg('<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
  shield: svg('<path d="M12 3.5 5 6v5.5c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  insta: svg('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.9" cy="7.1" r=".6"/>'),
};
const tick = (label = 'Verified organiser') =>
  `<svg class="tick" viewBox="0 0 24 24" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><path class="tick__seal" d="M12 2.6l2.25 1.65 2.78-.17.9 2.64 2.3 1.58-.85 2.66.85 2.66-2.3 1.58-.9 2.64-2.78-.17L12 21.4l-2.25-1.65-2.78.17-.9-2.64-2.3-1.58.85-2.66-.85-2.66 2.3-1.58.9-2.64 2.78.17z"/><path class="tick__mark" d="m8.6 12.1 2.3 2.3 4.5-4.7"/></svg>`;

/* ------------------------------------------------------------------ */
/* Store access (never let a store error blank the page)               */
/* ------------------------------------------------------------------ */

function safe(fn, fallback) {
  try { const v = fn(); return v ?? fallback; } catch (err) { console.error(err); return fallback; }
}
const me = () => safe(() => store.me(), null);
const isAdmin = (p = me()) => p?.role === 'admin';

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

const toastBox = document.getElementById('toasts');
function toast(msg, type = 'ok') {
  if (!toastBox) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = type === 'error' ? I.x : I.check;
  const span = document.createElement('span');
  span.textContent = msg;
  el.append(span);
  toastBox.append(el);
  while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
  setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 300); }, type === 'error' ? 5200 : 3400);
}
const errMsg = (err) => (err && err.message) || 'Something went wrong. Try again.';

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

const app = document.getElementById('app');
const main = document.getElementById('main');
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

let page = null; // { title, html, mount, cleanup, static, onStore, nav }

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
  return errorPage('Page not found', 'That link does not lead anywhere. It may have been mistyped or the event was removed.');
}

function paint(p, { restore = null } = {}) {
  app.innerHTML = p.html;
  document.title = p.title ? `${p.title} · IITD Live` : 'IITD Live';
  if (restore) restoreFields(restore);
  p.mount?.(app);
  updateChrome(p);
}

function renderRoute() {
  const route = parseRoute();
  if (page?.cleanup) safe(() => page.cleanup());
  const redirect = guard(route);
  if (redirect) { history.replaceState(null, '', redirect); return renderRoute(); }
  page = build(route);
  page.route = route;
  paint(page);
  window.scrollTo(0, 0);
  const h1 = app.querySelector('h1');
  if (h1 && renderRoute.count++) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
}
renderRoute.count = 0;

/** Login wall only where it is needed (A4: browse without login). */
function guard(route) {
  const p = route.path;
  const user = me();
  const needsLogin = p === '/wallet' || p === '/onboarding' || p.startsWith('/org/') || p === '/admin';
  if (needsLogin && !user) return loginHref(route.raw);
  return null;
}

let ownUntil = 0;
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

function updateChrome(p) {
  const user = me();
  const nav = p?.nav || '';
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
  const tabMe = document.getElementById('tab-me');
  if (tabMe) {
    const organiser = user && (user.role === 'organiser' || user.role === 'admin');
    tabMe.href = organiser ? '#/org' : user ? '#/onboarding' : loginHref('#/onboarding');
    tabMe.dataset.nav = organiser ? 'org' : 'me';
    tabMe.querySelector('span').textContent = organiser ? 'Organise' : 'Profile';
    if (tabMe.dataset.nav === nav) tabMe.setAttribute('aria-current', 'page'); else tabMe.removeAttribute('aria-current');
  }
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
function poster(e, size = '') {
  const emoji = e?.poster_emoji || '🎟️';
  return `<div class="poster ${size}"${posterStyle(e)} aria-hidden="true"><span>${esc(emoji)}</span></div>`;
}
function clubName(club, { link = false } = {}) {
  if (!club) return '';
  const name = `<span>${esc(club.name)}</span>${club.verified ? tick() : ''}`;
  return link && club.slug ? `<a class="org" href="#/c/${enc(club.slug)}">${name}</a>` : `<span class="org">${name}</span>`;
}
function chips(e) {
  const out = [];
  out.push(`<span class="chip ${e.price > 0 ? 'chip--paid' : 'chip--free'}">${esc(rupees(e.price))}</span>`);
  const el = e.eligibility === 'iitd_only' ? 'chip--iitd' : iitdFirstActive(e) ? 'chip--first' : 'chip--open';
  out.push(`<span class="chip ${el}">${esc(eligibilityText(e))}</span>`);
  if (e.team_max > 1) out.push(`<span class="chip">Teams of ${e.team_min === e.team_max ? e.team_max : `${e.team_min}–${e.team_max}`}</span>`);
  return out.join('');
}
function liveTag(label = 'Live now') {
  return `<span class="live"><span class="live__dot" aria-hidden="true"></span>${esc(label)}</span>`;
}

function eventCard(e, { showDate = true } = {}) {
  const live = isLive(e);
  const past = isPast(e);
  const urgency = [seatsLabel(e), closesLabel(e)].filter(Boolean);
  const reg = e.my_registration;
  const when = live ? liveTag() : `<span>${esc(showDate ? whenLabel(e.starts_at) : timeStr(e.starts_at))}</span>`;
  return `<article class="card${live ? ' is-live' : ''}${past ? ' is-past' : ''}">
    ${poster(e)}
    <div class="card__body">
      <p class="card__when">${when}${e.featured ? `<span class="flag">${I.star}Featured</span>` : ''}</p>
      <h3 class="card__title"><a href="#/e/${enc(e.id)}">${esc(e.title)}</a></h3>
      <p class="card__where">${I.pin}<span>${esc(e.venue || 'Venue TBC')}</span></p>
      <div class="chips">${chips(e)}</div>
      <div class="card__foot">
        ${clubName(e.club)}
        <span class="card__stat">${reg && reg.status !== 'cancelled' ? `<span class="you">${reg.status === 'waitlisted' ? 'Waitlisted' : 'You’re going'}</span>` : ''}${e.going > 0 ? `<span>${esc(plural(e.going, 'going', 'going'))}</span>` : ''}</span>
      </div>
      ${urgency.length && !past ? `<p class="card__urgent">${I.clock}<span>${esc(urgency.join(' · '))}</span></p>` : ''}
      ${e.live_note ? `<p class="card__note">${I.megaphone}<span><b>Update</b> ${esc(e.live_note)}</span></p>` : ''}
    </div>
  </article>`;
}

function hostelBars(byHostel, { limit = 6 } = {}) {
  const rows = Object.entries(byHostel || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '';
  const max = rows[0][1];
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((s, [, n]) => s + n, 0);
  return `<ul class="bars">${shown.map(([h, n]) => `
    <li><span class="bars__label"><b>${esc(n.toLocaleString('en-IN'))}</b> from ${esc(h)}</span>
      <span class="bars__track" aria-hidden="true"><span class="bars__fill" style="width:${Math.max(4, Math.round((n / max) * 100))}%"></span></span></li>`).join('')}
    ${rest ? `<li class="bars__rest">+${esc(rest.toLocaleString('en-IN'))} from other hostels</li>` : ''}
  </ul>`;
}

function qrMarkup(token, label) {
  if (typeof window.qrcode !== 'function' || !token) {
    return `<div class="qr qr--missing"><span>QR unavailable offline. Show the code below.</span></div>`;
  }
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(String(token));
    qr.make();
    const tag = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: label, title: label });
    return `<div class="qr">${tag}</div>`;
  } catch (err) {
    console.error(err);
    return `<div class="qr qr--missing"><span>Show the code below at the gate.</span></div>`;
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

/* ------------------------------------------------------------------ */
/* Feed  #/                                                            */
/* ------------------------------------------------------------------ */

const feed = { tab: null, category: '', price: '', eligibility: '', q: '' };
const TABS = [
  ['tonight', 'Tonight'],
  ['week', 'This week'],
  ['upcoming', 'Upcoming'],
  ['fests', 'Fests'],
];
const TAB_TITLES = { tonight: 'Tonight at IITD', week: 'This week at IITD', upcoming: 'Coming up at IITD', fests: 'Fests' };

function defaultTab() {
  const tonight = safe(() => store.events({ tab: 'tonight' }), []);
  return tonight.length ? 'tonight' : 'week';
}

function viewFeed(route) {
  const qTab = route.query.get('tab');
  if (qTab && TABS.some(([k]) => k === qTab)) feed.tab = qTab;
  if (!feed.tab) feed.tab = defaultTab();
  const tab = feed.tab;
  const searching = feed.q.trim().length > 0;

  const tabs = `<nav class="tabs" aria-label="When">
    ${TABS.map(([k, label]) => `<a class="tab" href="#/?tab=${k}"${!searching && k === tab ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}
  </nav>`;

  if (tab === 'fests' && !searching) {
    return { title: 'Fests', nav: 'fests', html: `${tabs}<header class="page-head"><h1>Fests</h1><p class="lede">Schedules, venues and every competition in one place.</p></header>${festList()}` };
  }

  const cats = safe(() => store.categories(), []);
  const filters = { category: feed.category, price: feed.price, eligibility: feed.eligibility };
  let list;
  let heading;
  if (searching) {
    list = safe(() => store.events({ tab: 'all', q: feed.q.trim(), ...filters }), []);
    heading = `Results for “${feed.q.trim()}”`;
  } else {
    list = safe(() => store.events({ tab, ...filters }), []);
    heading = TAB_TITLES[tab];
  }
  // Order comes from the store (featured first on Tonight / This week). Past results sink to the bottom.
  const upcoming = list.filter((e) => !isPast(e));
  const past = list.filter((e) => isPast(e));

  const active = feed.category || feed.price || feed.eligibility;
  const chip = (key, value, label) => `<button type="button" class="fchip" data-action="filter" data-key="${key}" data-value="${esc(value)}" aria-pressed="${feed[key] === value}">${esc(label)}</button>`;
  const filterBar = `<div class="filters" role="group" aria-label="Filter events">
    <label class="fchip fchip--select${feed.category ? ' is-on' : ''}"><span class="visually-hidden">Category</span>
      <select id="f-cat" data-action-change="category">
        <option value="">All categories</option>
        ${cats.map((c) => `<option value="${esc(c)}"${c === feed.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}
      </select>
    </label>
    ${chip('price', 'free', 'Free')}${chip('price', 'paid', 'Paid')}
    <span class="filters__sep" aria-hidden="true"></span>
    ${chip('eligibility', 'iitd_only', 'IITD only')}${chip('eligibility', 'open', 'Open to all')}
    ${active ? `<button type="button" class="fclear" data-action="clear-filters">Clear</button>` : ''}
  </div>`;

  let body;
  if (!list.length) {
    let cta = '';
    let msg;
    if (searching) msg = `Nothing matches “${feed.q.trim()}”. Try a club name, a venue, or a word from the title.`;
    else if (active) { msg = 'No events match these filters.'; cta = `<button class="btn btn--ghost" data-action="clear-filters">Clear filters</button>`; }
    else if (tab === 'tonight') { msg = 'Nothing is scheduled for tonight yet. Plenty is happening this week.'; cta = `<a class="btn" href="#/?tab=week">See this week</a>`; }
    else if (tab === 'week') { msg = 'A quiet week so far. See what is further out.'; cta = `<a class="btn" href="#/?tab=upcoming">See upcoming</a>`; }
    else msg = 'No upcoming events yet. Running a club? Post the first one.';
    if (!cta && !searching) cta = `<a class="btn btn--ghost" href="#/org/new">Post an event</a>`;
    body = empty(searching ? 'No results' : 'Nothing here yet', msg, cta);
  } else {
    body = `<div class="grid">${upcoming.map((e) => eventCard(e)).join('')}</div>
      ${past.length ? `<h2 class="section-title">Already happened</h2><div class="grid">${past.map((e) => eventCard(e)).join('')}</div>` : ''}`;
  }

  const count = list.length ? `<p class="lede">${esc(plural(upcoming.length || list.length, 'event'))}${searching ? '' : tab === 'tonight' ? ' today' : ''}${active ? ' · filtered' : ''}</p>` : '';
  return {
    title: searching ? 'Search' : TABS.find(([k]) => k === tab)[1],
    nav: 'explore',
    html: `${tabs}<header class="page-head"><h1>${esc(heading)}</h1>${count}</header>${filterBar}${body}`,
  };
}

function festDates(f) {
  if (!f) return '';
  const s = f.starts_on ? new Date(`${String(f.starts_on).slice(0, 10)}T12:00:00+05:30`) : null;
  const e = f.ends_on ? new Date(`${String(f.ends_on).slice(0, 10)}T12:00:00+05:30`) : null;
  let txt = '';
  if (s && e && valid(s) && valid(e)) {
    const sameMonth = fmt({ month: 'short', year: 'numeric' }).format(s) === fmt({ month: 'short', year: 'numeric' }).format(e);
    txt = sameMonth
      ? `${fmt({ day: 'numeric' }).format(s)}–${clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(e))}`
      : `${clean(fmt({ day: 'numeric', month: 'short' }).format(s))} – ${clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(e))}`;
  } else if (s && valid(s)) txt = clean(fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(s));
  if (f.dates_tbc) return `${txt ? `${esc(txt)} ` : ''}<span class="chip chip--tbc">Dates TBC</span>`;
  return esc(txt);
}

function festList() {
  const fests = safe(() => store.fests(), []);
  if (!fests.length) return empty('No fests listed yet', 'When Rendezvous, Tryst or BECon open registrations, their schedules show up here.');
  return `<div class="grid grid--fests">${fests.map((f) => {
    const n = safe(() => store.fest(f.slug)?.events?.length, 0);
    return `<article class="fest-card">
      <h2 class="fest-card__name"><a href="#/f/${enc(f.slug)}">${esc(f.name)}</a></h2>
      ${f.tagline ? `<p class="fest-card__tag">${esc(f.tagline)}</p>` : ''}
      <p class="fest-card__meta">${I.cal}<span>${festDates(f) || 'Dates TBC'}</span></p>
      <p class="fest-card__meta">${I.ticket}<span>${n ? esc(plural(n, 'event')) : 'Schedule coming soon'}</span></p>
    </article>`;
  }).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/* Event page  #/e/:id                                                 */
/* ------------------------------------------------------------------ */

function teamOf(reg) {
  if (!reg?.team_id) return null;
  const w = safe(() => store.wallet(), []).find((x) => x.registration?.id === reg.id);
  return w?.team || null;
}

function eventCta(e, user, route) {
  const reg = e.my_registration && e.my_registration.status !== 'cancelled' ? e.my_registration : null;
  const here = `#/e/${enc(e.id)}`;
  const ended = isPast(e);
  const closed = ended || (e.closes_in_ms != null && e.closes_in_ms <= 0 && !reg);

  if (e.reg_mode === 'external') {
    const url = safeUrl(e.external_url);
    if (ended) return `<div class="cta"><button class="btn btn--block" disabled>Event ended</button></div>`;
    return `<div class="cta">
      ${url ? `<a class="btn btn--block" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Register on organiser’s site ${I.ext}</a>` : `<button class="btn btn--block" disabled>Registration link coming soon</button>`}
      <p class="cta__note">The organiser runs registration${e.price > 0 ? ' and payment' : ''} for this one. Check their refund policy before paying.</p>
    </div>`;
  }

  if (reg) {
    const team = teamOf(reg);
    const status = reg.status;
    const head = status === 'waitlisted'
      ? `<div class="cta__state cta__state--wait"><b>You’re on the waitlist</b><span>If someone cancels, you move up automatically and your pass appears in your wallet.</span></div>`
      : status === 'checked_in'
        ? `<div class="cta__state cta__state--ok">${I.check}<b>Checked in${reg.checked_in_at ? ` at ${esc(timeStr(reg.checked_in_at))}` : ''}</b></div>`
        : `<div class="cta__state cta__state--ok">${I.check}<b>You’re registered</b></div>`;
    return `<div class="cta">
      ${head}
      ${status !== 'waitlisted' ? `<a class="btn btn--block" href="#/wallet?pass=${enc(reg.id)}">${I.ticket}View pass</a>` : ''}
      ${team ? teamPanel(team, e) : ''}
      ${status !== 'checked_in' && !ended ? `<button class="btn btn--quiet btn--block" data-action="cancel" data-id="${esc(reg.id)}" data-confirm="Tap again to ${status === 'waitlisted' ? 'leave the waitlist' : 'cancel'}">${status === 'waitlisted' ? 'Leave waitlist' : 'Cancel registration'}</button>` : ''}
    </div>`;
  }

  if (closed) return `<div class="cta"><button class="btn btn--block" disabled>${ended ? 'Event ended' : 'Registration closed'}</button></div>`;
  if (e.status === 'draft') return `<div class="cta"><button class="btn btn--block" disabled>Not published yet</button></div>`;

  if (!user) {
    const next = e.team_max > 1 ? here : `${here}?register=1`;
    return `<div class="cta">
      <a class="btn btn--block" href="${esc(loginHref(next))}">Log in to register</a>
      <p class="cta__note">One tap after that. Your name, hostel and entry number fill in for you.</p>
    </div>`;
  }

  if (e.eligibility === 'iitd_only' && !user.is_iitd) {
    return `<div class="cta"><button class="btn btn--block" disabled>IITD students only</button>
      <p class="cta__note">This event is for IIT Delhi students. Log in with your @iitd.ac.in email to register.</p></div>`;
  }
  if (iitdFirstActive(e) && !user.is_iitd) {
    return `<div class="cta"><button class="btn btn--block" disabled>Opens to all ${esc(whenLabel(e.iitd_first_until))}</button>
      <p class="cta__note">IITD students get first access until then. Come back after that to register.</p></div>`;
  }

  const full = e.seats_left != null && e.seats_left <= 0;
  const onboard = safe(() => store.needsOnboarding(), false);
  if (onboard) {
    return `<div class="cta"><a class="btn btn--block" href="#/onboarding?next=${enc(here)}">Finish your profile to register</a>
      <p class="cta__note">Takes 20 seconds: name, entry number, hostel, phone.</p></div>`;
  }

  if (e.team_max > 1) {
    const size = e.team_min === e.team_max ? `${e.team_max}` : `${e.team_min}–${e.team_max}`;
    return `<div class="cta">
      <p class="cta__lead">Teams of ${esc(size)}. The captain creates the team and shares the invite link.${full ? ' Seats are full, so new teams join the waitlist.' : ''}</p>
      <form class="team-form" data-form="team-create">
        <label for="team-name">Team name</label>
        <div class="inline">
          <input id="team-name" name="teamName" required maxlength="40" autocomplete="off" placeholder="e.g. Byte Club">
          <button class="btn" type="submit">${full ? 'Create & join waitlist' : 'Create team'}</button>
        </div>
      </form>
      <form class="team-form" data-form="team-join">
        <label for="team-code">Got an invite code?</label>
        <div class="inline">
          <input id="team-code" name="teamCode" required maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Invite code">
          <button class="btn btn--ghost" type="submit">Join team</button>
        </div>
      </form>
    </div>`;
  }

  return `<div class="cta">
    <button class="btn btn--block" data-action="register" data-id="${esc(e.id)}">${full ? 'Join waitlist' : e.price > 0 ? `Register · ${esc(rupees(e.price))}` : 'Register'}</button>
    <p class="cta__note">${full
      ? 'Seats are full. If someone cancels, you move up automatically.'
      : e.price > 0 ? 'Payment is collected by the organiser at entry.' : 'Free. Your QR pass lands in your wallet.'}</p>
  </div>`;
}

function teamPanel(team, e) {
  const info = safe(() => store.team(team.invite_code), null);
  const members = info?.members || [];
  const link = linkTo(`#/t/${enc(team.invite_code)}`);
  const msg = `Join my team “${team.name}” for ${e.title} on IITD Live: ${link}`;
  const spots = Math.max(0, (e.team_max || 1) - members.length);
  return `<section class="team" aria-labelledby="team-h">
    <h3 id="team-h">Team ${esc(team.name)}</h3>
    <p class="team__count">${esc(plural(members.length, 'member'))} of ${esc(e.team_max)}${spots ? ` · ${esc(plural(spots, 'spot'))} open` : ' · full'}${members.length < (e.team_min || 1) ? ` · needs ${esc(e.team_min - members.length)} more to qualify` : ''}</p>
    ${members.length ? `<ul class="team__members">${members.map((m) => `<li><span class="avatar" aria-hidden="true">${esc(initials(m.name, m.email))}</span>${esc(m.name || 'Teammate')}${m.id === team.captain_id ? ' <small>captain</small>' : ''}</li>`).join('')}</ul>` : ''}
    ${spots ? `<label class="team__label" for="invite-link">Invite link</label>
    <div class="inline">
      <input id="invite-link" readonly value="${esc(link)}" data-no-restore>
      <button class="btn btn--ghost" type="button" data-action="copy" data-text="${esc(link)}">${I.copy}Copy</button>
    </div>
    <p class="team__code">Or share the code <code>${esc(team.invite_code)}</code></p>
    <a class="btn btn--wa btn--block" href="${esc(waLink(msg))}" target="_blank" rel="noopener noreferrer">${I.chat}Share invite on WhatsApp</a>` : ''}
  </section>`;
}

function mapsUrl(venue) {
  return `https://www.google.com/maps/search/?api=1&query=${enc(`${venue}, IIT Delhi, Hauz Khas, New Delhi`)}`;
}

function viewEvent(route, id) {
  const e = safe(() => store.event(id), null);
  if (!e) return errorPage('Event not found', 'This event may have been removed by the organiser, or the link is incomplete.');
  const user = me();
  const live = isLive(e);
  const ended = isPast(e);
  const fest = e.fest;
  const capLine = e.reg_mode === 'external'
    ? 'Registration on the organiser’s site'
    : e.capacity
      ? `${e.capacity.toLocaleString('en-IN')} seats${e.seats_left != null ? ` · ${e.seats_left > 0 ? `${e.seats_left.toLocaleString('en-IN')} left` : 'full, waitlist open'}` : ''}`
      : 'No seat limit';
  const eligLine = e.eligibility === 'iitd_only'
    ? 'IIT Delhi students only'
    : iitdFirstActive(e)
      ? `IITD students first until ${whenLabel(e.iitd_first_until)}, then open to all`
      : 'Open to all, including other colleges';
  const urgency = [seatsLabel(e), closesLabel(e)].filter(Boolean);

  const html = `
    ${backLink(fest ? `#/f/${enc(fest.slug)}` : '#/', fest ? fest.name : 'All events')}
    <article class="event">
      <div class="event__hero">
        <div class="poster poster--xl"${posterStyle(e)} role="img" aria-label="${esc(`Poster for ${e.title}`)}"><span aria-hidden="true">${esc(e.poster_emoji || '🎟️')}</span>${live ? liveTag() : ''}</div>
      </div>
      <div class="event__main">
        ${e.live_note ? `<div class="banner" role="status">${I.megaphone}<div><b>Update from the organiser</b><p>${esc(e.live_note)}</p>${e.live_note_at ? `<small>${esc(ago(e.live_note_at))}</small>` : ''}</div></div>` : ''}
        <header class="event__head">
          <p class="event__when">${live ? liveTag('Happening now') : ended ? '<span class="muted">Ended</span>' : esc(whenLabel(e.starts_at))}${e.featured ? `<span class="flag">${I.star}Featured</span>` : ''}</p>
          <h1>${esc(e.title)}</h1>
          <p class="event__by">by ${clubName(e.club, { link: true })}${e.club && !e.club.verified ? '<span class="chip chip--pending">Unverified</span>' : ''}${fest ? ` · part of <a href="#/f/${enc(fest.slug)}">${esc(fest.name)}</a>` : ''}</p>
          <div class="chips">${chips(e)}${e.category ? `<span class="chip">${esc(e.category)}</span>` : ''}</div>
        </header>

        ${eventCta(e, user, route)}
        ${urgency.length && !ended && !e.my_registration ? `<p class="urgent">${I.clock}${esc(urgency.join(' · '))}</p>` : ''}

        <dl class="facts">
          <div><dt>${I.clock}<span>When</span></dt><dd>${esc(rangeLabel(e.starts_at, e.ends_at))}</dd></div>
          <div><dt>${I.pin}<span>Where</span></dt><dd>${esc(e.venue || 'Venue TBC')}${e.venue ? ` <a class="maplink" href="${esc(mapsUrl(e.venue))}" target="_blank" rel="noopener noreferrer">Map ${I.ext}</a>` : ''}</dd></div>
          <div><dt>${I.ticket}<span>Price</span></dt><dd>${e.price > 0 ? `${esc(rupees(e.price))}` : 'Free'}</dd></div>
          <div><dt>${I.shield}<span>Who can go</span></dt><dd>${esc(eligLine)}</dd></div>
          <div><dt>${I.users}<span>Capacity</span></dt><dd>${esc(capLine)}${e.team_max > 1 ? `<br>Teams of ${esc(e.team_min === e.team_max ? e.team_max : `${e.team_min}–${e.team_max}`)}` : ''}</dd></div>
        </dl>

        <div class="actions">
          <button class="btn btn--ghost" data-action="ics" data-id="${esc(e.id)}">${I.cal}Add to calendar</button>
          <button class="btn btn--ghost" data-action="share" data-id="${esc(e.id)}">${I.share}Share</button>
        </div>

        ${e.description ? `<section class="prose"><h2>About</h2><p>${esc(e.description)}</p></section>` : ''}

        <section class="going" aria-labelledby="going-h">
          <h2 id="going-h">${e.going > 0 ? `${esc(e.going.toLocaleString('en-IN'))} going` : 'Be the first to go'}${e.waitlisted > 0 ? `<span class="muted"> · ${esc(e.waitlisted.toLocaleString('en-IN'))} on waitlist</span>` : ''}</h2>
          ${hostelBars(e.by_hostel) || (e.going > 0 ? '' : '<p class="muted">Hostel counts show up once people register.</p>')}
          ${e.going > 0 ? '<p class="fine">Counts by hostel only. Names are never shown.</p>' : ''}
        </section>
      </div>
    </article>`;

  return {
    title: e.title,
    nav: fest ? 'fests' : 'explore',
    html,
    mount() {
      // Coming back from login with intent to register: do it, once.
      if (route.query.get('register') === '1') {
        history.replaceState(null, '', `#/e/${enc(e.id)}`);
        const u = me();
        if (u && !safe(() => store.needsOnboarding(), true) && !e.my_registration && e.team_max <= 1 && e.reg_mode !== 'external') {
          setTimeout(() => doRegister(e.id), 0);
        }
      }
    },
  };
}

function doRegister(eventId, opts = {}) {
  const user = me();
  const here = `#/e/${enc(eventId)}`;
  if (!user) { go(loginHref(`${here}?register=1`)); return; }
  if (safe(() => store.needsOnboarding(), false)) { go(`#/onboarding?next=${enc(here)}`); return; }
  ownUntil = Date.now() + 400;
  try {
    const reg = store.register(eventId, opts);
    if (reg?.status === 'waitlisted') toast('You’re on the waitlist. We’ll move you up if a seat opens.');
    else toast(opts.teamName ? `Team “${opts.teamName}” created. Share the invite link.` : 'You’re in. Your pass is in your wallet.');
    return reg;
  } catch (err) {
    toast(errMsg(err), 'error');
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Fest hub  #/f/:slug                                                 */
/* ------------------------------------------------------------------ */

function viewFest(route, slug) {
  const data = safe(() => store.fest(slug), null);
  if (!data?.fest) return errorPage('Fest not found', 'This fest is not listed yet.', `<a class="btn" href="#/?tab=fests">See all fests</a>`);
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
  if (!days.includes(day)) day = days.includes(today) ? today : days[0];

  const dayEvents = events.filter((e) => dayKey(e.starts_at) === day);
  const venues = [...new Set(dayEvents.map((e) => e.venue || 'Venue TBC'))].sort();
  const slots = [...new Set(dayEvents.map((e) => timeStr(e.starts_at)))];
  const slotOf = (e) => timeStr(e.starts_at);

  const block = (e) => `<a class="slot${isLive(e) ? ' is-live' : ''}" href="#/e/${enc(e.id)}"${posterStyle(e)}>
      <span class="slot__emoji" aria-hidden="true">${esc(e.poster_emoji || '🎟️')}</span>
      <span class="slot__title">${esc(e.title)}</span>
      <span class="slot__meta">${esc(timeStr(e.starts_at))}${valid(e.ends_at) ? `–${esc(timeStr(e.ends_at))}` : ''}${isLive(e) ? ' · Live' : ''}</span>
    </a>`;

  let schedule;
  if (!days.length) {
    schedule = empty('Schedule not out yet', fest.dates_tbc ? 'Dates are still being confirmed. Events will appear here as clubs post them.' : 'Clubs have not posted events for this fest yet.');
  } else if (!dayEvents.length) {
    schedule = empty('Nothing on this day yet', 'Check another day, or come back once the schedule is final.');
  } else {
    const grid = `<div class="sched-wrap"><table class="sched">
      <caption class="visually-hidden">${esc(fest.name)} schedule for ${esc(dayTitle(day))}, by time and venue</caption>
      <thead><tr><th scope="col">Time</th>${venues.map((v) => `<th scope="col">${esc(v)}</th>`).join('')}</tr></thead>
      <tbody>${slots.map((t) => `<tr><th scope="row">${esc(t)}</th>${venues.map((v) => {
        const here = dayEvents.filter((e) => slotOf(e) === t && (e.venue || 'Venue TBC') === v);
        return `<td>${here.map(block).join('')}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
    const listView = `<ol class="timeline">${slots.map((t) => `<li>
      <h3 class="timeline__time">${esc(t)}</h3>
      <ul>${dayEvents.filter((e) => slotOf(e) === t).map((e) => `<li><a class="tl-item${isLive(e) ? ' is-live' : ''}" href="#/e/${enc(e.id)}">
        <span class="tl-item__emoji"${posterStyle(e)} aria-hidden="true">${esc(e.poster_emoji || '🎟️')}</span>
        <span class="tl-item__body"><span class="tl-item__title">${esc(e.title)}</span>
        <span class="tl-item__meta"><span class="chip chip--venue">${I.pin}${esc(e.venue || 'Venue TBC')}</span>${isLive(e) ? liveTag() : ''}${e.price > 0 ? `<span class="chip chip--paid">${esc(rupees(e.price))}</span>` : ''}</span></span>
      </a></li>`).join('')}</ul></li>`).join('')}</ol>`;
    schedule = `${grid}${listView}`;
  }

  const dayTabs = days.length > 1 ? `<nav class="tabs tabs--days" aria-label="Fest days">${days.map((d, i) => `<a class="tab" href="#/f/${enc(fest.slug)}?day=${d}"${d === day ? ' aria-current="page"' : ''}><small>Day ${i + 1}</small>${esc(dayTitle(d))}</a>`).join('')}</nav>` : '';

  return {
    title: fest.name,
    nav: 'fests',
    html: `${backLink('#/?tab=fests', 'All fests')}
      <header class="fest-head">
        <h1>${esc(fest.name)}</h1>
        ${fest.tagline ? `<p class="lede">${esc(fest.tagline)}</p>` : ''}
        <p class="fest-head__dates">${I.cal}<span>${festDates(fest) || 'Dates TBC'}</span></p>
        ${fest.dates_tbc ? '<p class="fine">Dates are not confirmed by the organisers yet. Times below may change.</p>' : ''}
      </header>
      ${dayTabs}
      <section aria-label="Schedule">${schedule}</section>
      ${events.length ? `<h2 class="section-title">All ${esc(plural(events.length, 'event'))}</h2><div class="grid">${events.map((e) => eventCard(e)).join('')}</div>` : ''}`,
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
          <h1>${esc(club.name)} ${club.verified ? tick() : ''}</h1>
          <p class="muted">${club.verified ? 'Verified organiser at IIT Delhi' : 'Not verified yet. Check details before paying for anything.'}</p>
        </div>
        ${insta}
      </header>
      <h2 class="section-title">Upcoming</h2>
      ${upcoming.length ? `<div class="grid">${upcoming.map((e) => eventCard(e)).join('')}</div>` : empty('Nothing scheduled', `${club.name} has no upcoming events right now.`)}
      ${past.length ? `<h2 class="section-title">Past events</h2><div class="grid">${past.slice(0, 9).map((e) => eventCard(e)).join('')}</div>` : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/* Join team  #/t/:code                                                */
/* ------------------------------------------------------------------ */

function viewTeam(route, code) {
  const data = safe(() => store.team(code), null);
  if (!data?.team || !data.event) return errorPage('Invite not valid', 'This team invite link does not match any team. Ask your captain to send it again.');
  const { team, event: e } = data;
  const members = data.members || [];
  const user = me();
  const here = `#/t/${enc(team.invite_code)}`;
  const reg = e.my_registration && e.my_registration.status !== 'cancelled' ? e.my_registration : null;
  const inThisTeam = (reg && reg.team_id === team.id) || (user && members.some((m) => m.id === user.id));
  const full = members.length >= (e.team_max || 1);

  let cta;
  if (inThisTeam) cta = `<div class="cta__state cta__state--ok">${I.check}<b>You’re in this team</b></div><a class="btn btn--block" href="#/e/${enc(e.id)}">Go to event</a>`;
  else if (reg) cta = `<p class="cta__note">You’re already registered for this event${reg.team_id ? ' with another team' : ''}. Cancel that first to switch teams.</p><a class="btn btn--block btn--ghost" href="#/e/${enc(e.id)}">Go to event</a>`;
  else if (isPast(e)) cta = `<button class="btn btn--block" disabled>Event ended</button>`;
  else if (full) cta = `<button class="btn btn--block" disabled>Team is full</button><p class="cta__note">Ask the captain, or start your own team from the event page.</p>`;
  else if (!user) cta = `<a class="btn btn--block" href="${esc(loginHref(here))}">Log in to join ${esc(team.name)}</a>`;
  else if (safe(() => store.needsOnboarding(), false)) cta = `<a class="btn btn--block" href="#/onboarding?next=${enc(here)}">Finish your profile to join</a>`;
  else if (e.eligibility === 'iitd_only' && !user.is_iitd) cta = `<button class="btn btn--block" disabled>IITD students only</button><p class="cta__note">Log in with your @iitd.ac.in email to join this team.</p>`;
  else cta = `<button class="btn btn--block" data-action="join-team" data-code="${esc(team.invite_code)}" data-id="${esc(e.id)}">Join ${esc(team.name)}</button>`;

  return {
    title: `Join ${team.name}`,
    nav: 'explore',
    html: `<section class="invite">
      <p class="invite__from">${I.users}<span>Team invite</span></p>
      <h1>Join team ${esc(team.name)}</h1>
      <p class="lede">${esc(plural(members.length, 'member'))} of ${esc(e.team_max)} · for this event:</p>
      <div class="grid grid--one">${eventCard(e)}</div>
      ${members.length ? `<ul class="team__members">${members.map((m) => `<li><span class="avatar" aria-hidden="true">${esc(initials(m.name, m.email))}</span>${esc(m.name || 'Teammate')}${m.id === team.captain_id ? ' <small>captain</small>' : ''}</li>`).join('')}</ul>` : ''}
      <div class="cta">${cta}</div>
    </section>`,
  };
}

/* ------------------------------------------------------------------ */
/* Wallet  #/wallet                                                    */
/* ------------------------------------------------------------------ */

const STATUS = { confirmed: 'Confirmed', waitlisted: 'Waitlisted', checked_in: 'Checked in', cancelled: 'Cancelled' };

function passCard(w, user, highlight) {
  const { registration: r, event: e, team } = w;
  if (!e) return '';
  const past = isPast(e);
  const showQr = r.status === 'confirmed' || r.status === 'checked_in';
  return `<article class="pass pass--${esc(r.status)}${past ? ' is-past' : ''}${highlight ? ' is-target' : ''}" id="pass-${esc(r.id)}" aria-label="${esc(`Pass for ${e.title}`)}">
    <div class="pass__top"${posterStyle(e)}>
      <span class="pass__emoji" aria-hidden="true">${esc(e.poster_emoji || '🎟️')}</span>
      <div class="pass__head">
        <p class="pass__when">${isLive(e) ? liveTag('Happening now') : esc(whenLabel(e.starts_at))}</p>
        <h2 class="pass__title"><a href="#/e/${enc(e.id)}">${esc(e.title)}</a></h2>
        <p class="pass__venue">${I.pin}<span>${esc(e.venue || 'Venue TBC')}</span></p>
      </div>
    </div>
    ${e.live_note && !past ? `<p class="pass__note">${I.megaphone}<span><b>Update</b> ${esc(e.live_note)}</span></p>` : ''}
    <div class="pass__tear" aria-hidden="true"></div>
    <div class="pass__bottom">
      ${showQr
        ? `${qrMarkup(r.qr_token, `Entry QR for ${e.title}`)}
           <p class="pass__codelabel">Pass code for manual entry</p>
           <p class="pass__code">${esc(r.qr_token)}</p>`
        : `<div class="pass__wait"><b>No QR yet</b><span>You’re on the waitlist. If a seat opens, your QR appears here automatically.</span></div>`}
      <dl class="pass__meta">
        <div><dt>Status</dt><dd><span class="status status--${esc(r.status)}">${esc(STATUS[r.status] || r.status)}</span>${r.status === 'checked_in' && r.checked_in_at ? ` <small>${esc(timeStr(r.checked_in_at))}</small>` : ''}</dd></div>
        <div><dt>Name</dt><dd>${esc(user?.name || user?.email || '')}</dd></div>
        ${team ? `<div><dt>Team</dt><dd>${esc(team.name)}</dd></div>` : ''}
        ${user?.hostel ? `<div><dt>Hostel</dt><dd>${esc(user.hostel)}</dd></div>` : ''}
      </dl>
    </div>
  </article>`;
}

function viewWallet(route) {
  const user = me();
  const list = safe(() => store.wallet(), []).filter((w) => w?.registration && w.registration.status !== 'cancelled' && w.event);
  const upcoming = list.filter((w) => !isPast(w.event));
  const past = list.filter((w) => isPast(w.event));
  const target = route.query.get('pass');
  return {
    title: 'Wallet',
    nav: 'wallet',
    html: `<header class="page-head"><h1>Your passes</h1>
        ${upcoming.length ? `<p class="lede">Show the QR at the gate. Turn your screen brightness up.</p>` : ''}</header>
      ${list.length ? '' : empty('No passes yet', 'Register for an event and your QR pass shows up here, ready for the gate.', '<a class="btn" href="#/">Explore events</a>')}
      ${upcoming.length ? `<div class="passes">${upcoming.map((w) => passCard(w, user, w.registration.id === target)).join('')}</div>` : list.length ? empty('Nothing coming up', 'Your upcoming passes will show here.', '<a class="btn" href="#/">Explore events</a>') : ''}
      ${past.length ? `<h2 class="section-title">Past</h2><div class="passes">${past.map((w) => passCard(w, user, w.registration.id === target)).join('')}</div>` : ''}`,
    mount(root) {
      if (target) {
        const el = root.querySelector(`#pass-${CSS.escape(target)}`);
        if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 60);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Login + onboarding                                                  */
/* ------------------------------------------------------------------ */

const isIitdEmail = (s) => /iitd\.ac\.in$/i.test(String(s || '').trim());

function afterLogin(next) {
  const n = safeNext(next);
  if (safe(() => store.needsOnboarding(), false)) go(`#/onboarding?next=${enc(n)}`, { replace: true });
  else go(n, { replace: true });
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
        <p class="lede">${esc(user.name || user.email)} · ${user.is_iitd ? `<span class="badge-iitd">${I.shield}IITD Verified</span>` : 'Not IITD verified'}</p>
        <div class="stack">
          <a class="btn btn--block" href="${esc(next)}">Continue</a>
          <button class="btn btn--quiet btn--block" data-action="logout">Log out and switch account</button>
        </div>
      </section>`,
    };
  }
  const accounts = Array.isArray(DEMO_ACCOUNTS) ? DEMO_ACCOUNTS : [];
  return {
    title: 'Log in',
    nav: 'me',
    html: `<section class="auth">
      <h1>Log in to register</h1>
      <p class="lede">Browsing is open to everyone. You only need an account to register, join a team or keep passes.</p>

      <form class="form" data-form="login" novalidate>
        <input type="hidden" name="next" value="${esc(next)}">
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@iitd.ac.in" aria-describedby="login-hint">
          <p class="hint" id="login-hint" aria-live="polite">Use your <b>@iitd.ac.in</b> email to get the IITD Verified badge.</p>
        </div>
        <button class="btn btn--block" type="submit">Continue</button>
        <p class="fine">In the real app we email a one-time code to this address, so only the owner of an IITD inbox gets the badge. In this demo there is no code: you are logged in straight away.</p>
      </form>

      ${accounts.length ? `<div class="demo">
        <h2>Try a demo account</h2>
        <p class="muted">One tap. Each shows a different side of the app.</p>
        <div class="demo__list">${accounts.map((a) => `<button class="demo__btn" data-action="demo-login" data-email="${esc(a.email)}" data-next="${esc(next)}">
          <span class="avatar" aria-hidden="true">${esc(initials(a.label, a.email))}</span>
          <span class="demo__text"><b>${esc(a.label)}</b><small>${esc(a.email)}</small></span>
          ${isIitdEmail(a.email) ? `<span class="badge-iitd badge-iitd--sm">${I.shield}Verified</span>` : '<span class="chip">Guest</span>'}
        </button>`).join('')}</div>
      </div>` : ''}
    </section>`,
    mount(root) {
      const input = root.querySelector('#login-email');
      const hint = root.querySelector('#login-hint');
      input?.addEventListener('input', () => {
        const v = input.value.trim();
        if (!v.includes('@')) hint.innerHTML = 'Use your <b>@iitd.ac.in</b> email to get the IITD Verified badge.';
        else if (isIitdEmail(v)) hint.innerHTML = `<span class="badge-iitd badge-iitd--sm">${I.shield}IITD Verified</span> You can register for IITD-only events.`;
        else hint.textContent = 'Not an IITD email: you can join events open to all, but not IITD-only ones.';
      });
    },
  };
}

function viewOnboarding(route) {
  const user = me();
  const next = route.query.get('next');
  const needs = safe(() => store.needsOnboarding(), false);
  const hostels = Array.isArray(HOSTELS) ? HOSTELS : [];
  const organiser = user.role === 'organiser' || user.role === 'admin';
  return {
    title: needs ? 'Your profile' : 'Profile',
    nav: 'me',
    static: true,
    onStore() { /* keep the form as typed */ },
    html: `<section class="auth">
      <h1>${needs ? 'Finish your profile' : 'Your profile'}</h1>
      <p class="lede">${needs ? 'Once. After this every registration is a single tap.' : 'This pre-fills every registration.'}</p>
      <p class="whoami"><span class="avatar" aria-hidden="true">${esc(initials(user.name, user.email))}</span><span>${esc(user.email)}</span>
        ${user.is_iitd ? `<span class="badge-iitd">${I.shield}IITD Verified</span>` : '<span class="chip">Not IITD verified</span>'}</p>
      <form class="form" data-form="onboarding">
        <input type="hidden" name="next" value="${esc(next ? safeNext(next) : '')}">
        <div class="field">
          <label for="ob-name">Full name</label>
          <input id="ob-name" name="name" required maxlength="60" autocomplete="name" value="${esc(user.name || '')}">
        </div>
        ${user.is_iitd ? `<div class="field">
          <label for="ob-entry">Entry number</label>
          <input id="ob-entry" name="entry_no" required maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="2024MT60123" value="${esc(user.entry_no || '')}" aria-describedby="ob-entry-hint">
          <p class="hint" id="ob-entry-hint">As on your IITD ID card.</p>
        </div>
        <div class="field">
          <label for="ob-hostel">Hostel</label>
          <select id="ob-hostel" name="hostel" required>
            <option value="">Choose your hostel</option>
            ${hostels.map((h) => `<option${h === user.hostel ? ' selected' : ''}>${esc(h)}</option>`).join('')}
          </select>
          <p class="hint">Only used for anonymous counts like “38 from Aravali going”.</p>
        </div>` : '<p class="hint">You are signing up as a guest from outside IIT Delhi, so we only need your name and phone.</p>'}
        <div class="field">
          <label for="ob-phone">Phone</label>
          <input id="ob-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="15" placeholder="98765 43210" value="${esc(user.phone || '')}" aria-describedby="ob-phone-hint">
          <p class="hint" id="ob-phone-hint">Shared only with organisers of events you register for.</p>
        </div>
        <button class="btn btn--block" type="submit">${needs ? 'Save and continue' : 'Save changes'}</button>
      </form>
      ${needs ? '' : `<nav class="linklist" aria-label="Account">
        <a href="#/wallet">${I.ticket}<span>My passes</span>${I.chev}</a>
        <a href="#/org">${I.flag}<span>${organiser ? 'Organiser dashboard' : 'Run a club? Post events'}</span>${I.chev}</a>
        ${isAdmin(user) ? `<a href="#/admin">${I.shield}<span>Admin</span>${I.chev}</a>` : ''}
        <button type="button" data-action="logout">${I.back}<span>Log out</span></button>
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
        <p class="lede">Your club page lists every event you post. An admin verifies new clubs, and verified clubs get a tick that students trust.</p>
        <form class="form" data-form="club-create">
          <div class="field">
            <label for="club-name">Club or society name</label>
            <input id="club-name" name="name" required maxlength="60" placeholder="e.g. DevClub IITD">
          </div>
          <button class="btn btn--block" type="submit">Create club</button>
          <p class="fine">It shows as “Unverified” until an admin approves it. You can post events straight away.</p>
        </form>
      </section>`,
    };
  }

  const rows = [];
  for (const c of clubs) {
    const evs = safe(() => store.club(c.slug)?.events, []) || [];
    for (const e of evs) rows.push({ e, c, s: safe(() => store.stats(e.id), null) });
  }
  rows.sort((a, b) => (isPast(a.e) - isPast(b.e)) || (toDate(a.e.starts_at) - toDate(b.e.starts_at)));

  const eventRow = ({ e, s }) => {
    const confirmed = s?.confirmed ?? e.going ?? 0;
    return `<li><a class="orow" href="#/org/e/${enc(e.id)}">
      <span class="orow__emoji"${posterStyle(e)} aria-hidden="true">${esc(e.poster_emoji || '🎟️')}</span>
      <span class="orow__main">
        <span class="orow__title">${esc(e.title)}</span>
        <span class="orow__meta">${isLive(e) ? liveTag() : esc(whenLabel(e.starts_at))}${e.status === 'draft' ? ' · <span class="status status--draft">Draft</span>' : ''}</span>
      </span>
      <span class="orow__stats">
        <span><b>${esc(confirmed)}</b>${e.capacity ? `/${esc(e.capacity)}` : ''} going</span>
        ${s?.waitlisted ? `<span>${esc(s.waitlisted)} waitlist</span>` : ''}
        ${s?.checked_in ? `<span>${esc(s.checked_in)} in</span>` : ''}
      </span>
    </a></li>`;
  };

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
        <a href="#/c/${enc(c.slug)}" class="clubs__name">${esc(c.name)}</a>
        ${c.verified ? `<span class="status status--confirmed">${I.check}Verified</span>` : '<span class="status status--waitlisted">Pending verification</span>'}
      </li>`).join('')}</ul>
      <h2 class="section-title">Your events</h2>
      ${rows.length ? `<ul class="olist">${rows.map(eventRow).join('')}</ul>` : empty('No events yet', 'Post your first event. Students can register as soon as you publish it.', '<a class="btn" href="#/org/new">Create an event</a>')}
      ${isAdmin(user) ? `<p class="fine"><a href="#/admin">Open admin tools</a></p>` : ''}`,
  };
}

const EMOJIS = ['🎤', '🎸', '💃', '🎭', '🤖', '💻', '🚀', '📚', '🏏', '⚽', '🎨', '🎬', '💡', '🧠', '🎉', '🍕'];
const SWATCHES = ['#e8505b', '#f29e4c', '#f1c453', '#3fb68b', '#16a085', '#2e86de', '#5f27cd', '#c44569', '#222f3e', '#7f8c8d'];

function eventForm(e, clubs, fests, cats, user) {
  const v = (k, d = '') => esc(e?.[k] ?? d);
  const isNew = !e?.id;
  const free = !(e?.price > 0);
  return `<form class="form form--event" data-form="event-save" data-id="${esc(e?.id || '')}">
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
          <input id="ev-cat" name="category" list="ev-cats" required maxlength="30" value="${v('category')}" placeholder="Workshop">
          <datalist id="ev-cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
        </div>
        <div class="field">
          <label for="ev-fest">Part of a fest</label>
          <select id="ev-fest" name="fest_id"><option value="">No fest</option>${fests.map((f) => `<option value="${esc(f.id)}"${f.id === e?.fest_id ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field">
        <label for="ev-desc">Description</label>
        <textarea id="ev-desc" name="description" rows="5" maxlength="2000" placeholder="What happens, who it is for, what to bring">${v('description')}</textarea>
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
      <legend>Registration</legend>
      <div class="field">
        <span class="label" id="ev-mode-l">How do people register?</span>
        <div class="seg" role="radiogroup" aria-labelledby="ev-mode-l">
          <label><input type="radio" name="reg_mode" value="platform"${e?.reg_mode !== 'external' ? ' checked' : ''}><span>On IITD Live</span></label>
          <label><input type="radio" name="reg_mode" value="external"${e?.reg_mode === 'external' ? ' checked' : ''}><span>On our own site</span></label>
        </div>
      </div>
      <div class="field" data-show="external">
        <label for="ev-url">Registration link</label>
        <input id="ev-url" name="external_url" type="url" inputmode="url" maxlength="300" value="${v('external_url')}" placeholder="https://unstop.com/…">
        <p class="hint">Paid events link out to your own payment page. IITD Live does not take payments yet.</p>
      </div>
      <div class="field-row">
        <div class="field"><label for="ev-price">Price (₹)</label><input id="ev-price" name="price" type="number" min="0" step="1" inputmode="numeric" value="${esc(e?.price ?? 0)}"><p class="hint">0 means free.</p></div>
        <div class="field" data-show="platform"><label for="ev-cap">Seats</label><input id="ev-cap" name="capacity" type="number" min="1" step="1" inputmode="numeric" value="${esc(e?.capacity ?? '')}" placeholder="No limit"></div>
      </div>
      <div class="field" data-show="platform">
        <label for="ev-over">Overbook by (%)</label>
        <input id="ev-over" name="overbook_pct" type="number" min="0" max="100" step="5" inputmode="numeric" value="${esc(e?.overbook_pct ?? (free ? 25 : 0))}">
        <p class="hint">Free events see no-shows. 25% extra confirmed seats is a safe default; after that people join the waitlist.</p>
      </div>
      <div class="field-row" data-show="platform">
        <div class="field"><label for="ev-tmin">Team size, min</label><input id="ev-tmin" name="team_min" type="number" min="1" max="20" inputmode="numeric" value="${esc(e?.team_min ?? 1)}"></div>
        <div class="field"><label for="ev-tmax">Team size, max</label><input id="ev-tmax" name="team_max" type="number" min="1" max="20" inputmode="numeric" value="${esc(e?.team_max ?? 1)}"></div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Who can go</legend>
      <div class="seg" role="radiogroup" aria-label="Eligibility">
        <label><input type="radio" name="eligibility" value="open"${e?.eligibility !== 'iitd_only' ? ' checked' : ''}><span>Open to all</span></label>
        <label><input type="radio" name="eligibility" value="iitd_only"${e?.eligibility === 'iitd_only' ? ' checked' : ''}><span>IITD only</span></label>
      </div>
      <div class="field" data-show="open">
        <label for="ev-first">IITD-first window ends <small>(optional)</small></label>
        <input id="ev-first" name="iitd_first_until" type="datetime-local" value="${esc(toLocalInput(e?.iitd_first_until))}">
        <p class="hint">Until this time only verified IITD students can register. Then it opens to everyone.</p>
      </div>
    </fieldset>

    <fieldset>
      <legend>Poster</legend>
      <div class="poster-edit">
        <div class="poster poster--md" id="ev-preview"${posterStyle(e || { poster_color: SWATCHES[5] })} aria-hidden="true"><span>${esc(e?.poster_emoji || '🎟️')}</span></div>
        <div class="poster-edit__controls">
          <div class="field">
            <label for="ev-emoji">Emoji</label>
            <input id="ev-emoji" name="poster_emoji" maxlength="8" value="${esc(e?.poster_emoji || '🎟️')}">
            <div class="emoji-pick" role="group" aria-label="Pick an emoji">${EMOJIS.map((x) => `<button type="button" data-action="pick-emoji" data-value="${x}" aria-label="Use ${x}">${x}</button>`).join('')}</div>
          </div>
          <div class="field">
            <label for="ev-color">Colour</label>
            <div class="swatches">
              <input id="ev-color" name="poster_color" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(e?.poster_color || '') ? e.poster_color : SWATCHES[5])}">
              ${SWATCHES.map((c) => `<button type="button" class="swatch" data-action="pick-color" data-value="${c}" style="--poster:${c}" aria-label="Colour ${c}"></button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </fieldset>

    ${isAdmin(user) ? `<fieldset><legend>Admin</legend>
      <label class="check"><input type="checkbox" name="featured" id="ev-featured"${e?.featured ? ' checked' : ''}><span>Feature this event at the top of the feed</span></label>
    </fieldset>` : ''}

    <div class="form__actions">
      <button class="btn" type="submit" name="status" value="published">${isNew ? 'Publish' : e.status === 'draft' ? 'Publish' : 'Save changes'}</button>
      <button class="btn btn--ghost" type="submit" name="status" value="draft">${!isNew && e.status === 'published' ? 'Unpublish (draft)' : 'Save as draft'}</button>
    </div>
  </form>`;
}

function readEventForm(form, submitter) {
  const fd = new FormData(form);
  const s = (k) => String(fd.get(k) ?? '').trim();
  const n = (k, d = null) => (s(k) === '' ? d : Math.max(0, Math.round(Number(s(k)))));
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
  const errs = [];
  if (!data.title) errs.push('Add a title.');
  if (!data.starts_at || !data.ends_at) errs.push('Add start and end times.');
  else if (new Date(data.ends_at) <= new Date(data.starts_at)) errs.push('End time must be after the start time.');
  if (data.team_min > data.team_max) errs.push('Team min cannot be more than team max.');
  if (reg_mode === 'external' && !safeUrl(data.external_url)) errs.push('Add a full registration link starting with https://');
  if (data.iitd_first_until && data.starts_at && new Date(data.iitd_first_until) > new Date(data.starts_at)) errs.push('The IITD-first window should end before the event starts.');
  return { data, errs };
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
        <header class="page-head"><h1>New event</h1><p class="lede">Students see the title, time, venue, price and who can go on every card, so fill those in carefully.</p></header>
        ${eventForm(null, allClubs, fests, cats, user)}`,
      mount: mountEventForm,
    };
  }

  const e = safe(() => store.event(id), null);
  if (!e) return errorPage('Event not found', 'It may have been deleted.', '<a class="btn" href="#/org">Back to organiser</a>');
  const owns = isAdmin(user) || clubs.some((c) => c.id === e.club_id);
  if (!owns) return errorPage('Not your event', 'Only the club that posted this event can see its attendees.', '<a class="btn" href="#/org">Back to organiser</a>');

  const tab = route.query.get('tab') === 'edit' ? 'edit' : 'dash';
  const tabs = `<nav class="tabs" aria-label="Event sections">
    <a class="tab" href="#/org/e/${enc(e.id)}"${tab === 'dash' ? ' aria-current="page"' : ''}>Dashboard</a>
    <a class="tab" href="#/org/e/${enc(e.id)}?tab=edit"${tab === 'edit' ? ' aria-current="page"' : ''}>Edit details</a>
  </nav>`;
  const head = `${backLink('#/org', 'Organiser')}
    <header class="page-head page-head--row">
      <div><h1>${esc(e.title)}</h1><p class="lede">${isLive(e) ? liveTag('Happening now') : esc(whenLabel(e.starts_at))} · ${esc(e.venue || 'Venue TBC')}${e.status === 'draft' ? ' · <span class="status status--draft">Draft</span>' : ''}</p></div>
      <div class="page-head__actions"><a class="btn btn--ghost btn--sm" href="#/e/${enc(e.id)}">View public page</a></div>
    </header>${tabs}`;

  if (tab === 'edit') {
    return { title: `Edit ${e.title}`, nav: 'org', static: true, html: `${head}${eventForm(e, allClubs, fests, cats, user)}`, mount: mountEventForm };
  }

  const s = safe(() => store.stats(e.id), {}) || {};
  const people = safe(() => store.attendees(e.id), []);
  // stats.confirmed counts everyone holding a seat; checked_in is the subset already at the door.
  const confirmed = s.confirmed ?? 0;
  const checked = s.checked_in ?? 0;
  const capTotal = e.capacity ? Math.floor(e.capacity * (1 + (e.overbook_pct || 0) / 100)) : null;
  const rate = confirmed > 0 ? Math.round((checked / confirmed) * 100) : 0;

  const order = { checked_in: 0, confirmed: 1, waitlisted: 2, cancelled: 3 };
  people.sort((a, b) => (order[a.registration?.status] ?? 9) - (order[b.registration?.status] ?? 9));

  return {
    title: `${e.title} dashboard`,
    nav: 'org',
    html: `${head}
      <section class="tiles" aria-label="Registration numbers">
        <div class="tile"><span class="tile__n">${esc(confirmed)}</span><span class="tile__l">Going${capTotal ? ` of ${esc(capTotal)}` : ''}</span></div>
        <div class="tile"><span class="tile__n">${esc(checked)}</span><span class="tile__l">Checked in${confirmed ? ` · ${rate}%` : ''}</span></div>
        <div class="tile"><span class="tile__n">${esc(s.waitlisted ?? 0)}</span><span class="tile__l">Waitlist</span></div>
        <div class="tile"><span class="tile__n">${e.capacity ? esc(e.capacity) : '∞'}</span><span class="tile__l">Seats${e.overbook_pct ? ` +${esc(e.overbook_pct)}% overbook` : ''}</span></div>
      </section>

      <div class="dash">
        <section class="panel" aria-labelledby="upd-h">
          <h2 id="upd-h">Post a live update</h2>
          <p class="muted">Shows as a banner on the event page and on every card. Use it for venue or time changes.</p>
          ${e.live_note ? `<div class="banner banner--sm">${I.megaphone}<div><p>${esc(e.live_note)}</p>${e.live_note_at ? `<small>Posted ${esc(ago(e.live_note_at))}</small>` : ''}</div></div>` : ''}
          <form class="form" data-form="live-update" data-id="${esc(e.id)}">
            <label class="visually-hidden" for="upd-note">Update</label>
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
          <h2 id="att-h">Attendees <span class="muted">(${esc(people.length)})</span></h2>
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
            <td data-label="Entry no." class="num">${esc(p?.entry_no || '–')}</td>
            <td data-label="Hostel">${esc(p?.hostel || '–')}</td>
            <td data-label="Team">${esc(t?.name || '–')}</td>
            <td data-label="Status"><span class="status status--${esc(r?.status)}">${esc(STATUS[r?.status] || r?.status || '')}</span>${r?.status === 'checked_in' && r.checked_in_at ? ` <small class="muted">${esc(timeStr(r.checked_in_at))}</small>` : ''}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : empty('No registrations yet', 'Share the event link on WhatsApp to get the first sign-ups.', `<button class="btn btn--ghost" data-action="share" data-id="${esc(e.id)}">${I.share}Share event</button>`)}
      </section>`,
    mount(root) {
      const q = root.querySelector('#att-q');
      const apply = () => {
        const t = (q?.value || '').trim().toLowerCase();
        root.querySelectorAll('tr[data-row]').forEach((tr) => { tr.hidden = t && !tr.dataset.row.includes(t); });
      };
      q?.addEventListener('input', apply);
      apply();
    },
  };
}

function mountEventForm(root) {
  const form = root.querySelector('form[data-form="event-save"]');
  if (!form) return;
  const sync = () => {
    const mode = form.querySelector('[name="reg_mode"]:checked')?.value || 'platform';
    const elig = form.querySelector('[name="eligibility"]:checked')?.value || 'open';
    form.querySelectorAll('[data-show]').forEach((el) => {
      const k = el.dataset.show;
      el.hidden = !((k === mode) || (k === elig));
    });
    const url = form.querySelector('#ev-url');
    if (url) url.required = mode === 'external';
    const prev = root.querySelector('#ev-preview');
    if (prev) {
      const c = safeColor(form.querySelector('#ev-color')?.value);
      if (c) prev.style.setProperty('--poster', c);
      prev.querySelector('span').textContent = form.querySelector('#ev-emoji')?.value || '🎟️';
    }
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
  const clubs = safe(() => store.myClubs(), []);
  const canScan = clubs.length || isAdmin(user);
  return {
    title: 'Scan passes',
    nav: 'org',
    static: true,
    onStore(root) { renderScanLog(root); },
    html: `${backLink('#/org', 'Organiser')}
      <header class="page-head"><h1>Check-in</h1><p class="lede">Point the camera at a pass, or type the code under the QR.</p></header>
      ${canScan ? '' : `<p class="banner banner--warn">${I.x}<span>You can only check in passes for your own club’s events. <a href="#/org">Set up a club</a>.</span></p>`}
      <div class="scan">
        <div class="scan__cam">
          <div id="reader" class="reader" aria-label="Camera preview"></div>
          <div class="scan__placeholder" id="scan-ph">${I.scan}<span>Camera is off</span></div>
          <div class="scan__controls">
            <button class="btn btn--block" data-action="scan-start" id="scan-start">${I.scan}Start camera</button>
            <button class="btn btn--ghost btn--block" data-action="scan-stop" id="scan-stop" hidden>Stop camera</button>
          </div>
        </div>
        <div class="scan__side">
          <div id="scan-result" class="scan-result" role="status" aria-live="assertive"></div>
          <form class="form" data-form="manual-checkin">
            <label for="scan-code">Pass code</label>
            <div class="inline">
              <input id="scan-code" name="code" required autocomplete="off" autocapitalize="off" spellcheck="false" class="mono" placeholder="Code under the QR" data-no-restore>
              <button class="btn" type="submit">Check in</button>
            </div>
          </form>
          <h2 class="section-title section-title--sm">This session</h2>
          <ul class="scanlog" id="scan-log"></ul>
        </div>
      </div>`,
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

function doCheckIn(token) {
  const code = String(token || '').trim();
  if (!code) return;
  ownUntil = Date.now() + 400;
  let res;
  try { res = store.checkIn(code); } catch (err) { res = { ok: false, reason: errMsg(err) }; }
  const box = app.querySelector('#scan-result');
  const name = res?.profile?.name || res?.profile?.email || '';
  const ev = res?.event?.title || '';
  if (res?.ok) {
    if (box) box.innerHTML = `<div class="verdict verdict--ok"><span class="verdict__icon">${I.check}</span><div><p class="verdict__name">${esc(name || 'Checked in')}</p><p>${esc([res.profile?.hostel, ev].filter(Boolean).join(' · '))}</p></div></div>`;
    navigator.vibrate?.(60);
  } else {
    const reason = res?.reason || 'invalid pass';
    if (box) box.innerHTML = `<div class="verdict verdict--bad"><span class="verdict__icon">${I.x}</span><div><p class="verdict__name">${esc(reason.charAt(0).toUpperCase() + reason.slice(1))}</p><p>${esc([name, ev].filter(Boolean).join(' · ') || 'Ask them to open the pass in their wallet.')}</p></div></div>`;
    navigator.vibrate?.([40, 60, 40]);
  }
  scanLog.unshift({ ok: !!res?.ok, name: name || 'Unknown pass', detail: res?.ok ? ev : res?.reason || 'invalid pass', at: new Date() });
  renderScanLog(app);
}

async function startScanner() {
  if (scanner) return;
  if (typeof window.Html5Qrcode !== 'function') { toast('Camera scanner did not load. Type the pass code instead.', 'error'); return; }
  const ph = app.querySelector('#scan-ph');
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
    if (ph) ph.hidden = true;
    app.querySelector('#scan-start')?.setAttribute('hidden', '');
    app.querySelector('#scan-stop')?.removeAttribute('hidden');
  } catch (err) {
    console.error(err);
    scanner = null;
    toast('Could not open the camera. Allow camera access, or type the pass code.', 'error');
  }
}
async function stopScanner() {
  const s = scanner;
  scanner = null;
  if (!s) return;
  try { await s.stop(); } catch { /* already stopped */ }
  try { s.clear(); } catch { /* ignore */ }
  const ph = app.querySelector('#scan-ph');
  if (ph) ph.hidden = false;
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
  const clubs = safe(() => store.clubs(), []);
  const events = safe(() => store.events({ tab: 'all' }), []).filter((e) => !isPast(e));
  return {
    title: 'Admin',
    nav: 'me',
    html: `<header class="page-head"><h1>Admin</h1><p class="lede">Verify clubs so students can trust them, and feature events at the top of the feed.</p></header>
      <section class="panel" aria-labelledby="ac-h">
        <h2 id="ac-h">Clubs <span class="muted">(${esc(clubs.length)})</span></h2>
        <ul class="adm">${clubs.map((c) => `<li>
          <span class="adm__name"><a href="#/c/${enc(c.slug)}">${esc(c.name)}</a> ${c.verified ? tick() : '<span class="status status--waitlisted">Pending</span>'}</span>
          <button class="btn btn--sm ${c.verified ? 'btn--quiet' : ''}" data-action="verify" data-id="${esc(c.id)}" data-value="${c.verified ? '0' : '1'}">${c.verified ? 'Unverify' : 'Verify'}</button>
        </li>`).join('')}</ul>
      </section>
      <section class="panel" aria-labelledby="ae-h">
        <h2 id="ae-h">Upcoming events <span class="muted">(${esc(events.length)})</span></h2>
        <ul class="adm">${events.map((e) => `<li>
          <span class="adm__name"><a href="#/e/${enc(e.id)}">${esc(e.title)}</a> <small class="muted">${esc(e.club?.name || '')} · ${esc(whenLabel(e.starts_at))}</small></span>
          <button class="btn btn--sm ${e.featured ? 'btn--quiet' : 'btn--ghost'}" data-action="feature" data-id="${esc(e.id)}" data-value="${e.featured ? '0' : '1'}" aria-pressed="${!!e.featured}">${e.featured ? 'Unfeature' : `${I.star}Feature`}</button>
        </li>`).join('')}</ul>
      </section>
      <section class="panel panel--danger" aria-labelledby="ar-h">
        <h2 id="ar-h">Reset demo data</h2>
        <p class="muted">Wipes every registration, club and edit in this browser and reloads the sample events.</p>
        <button class="btn btn--danger" data-action="reset" data-confirm="Tap again to wipe everything">Reset demo data</button>
      </section>`,
  };
}

/* ------------------------------------------------------------------ */
/* Events: clicks, forms, inputs                                       */
/* ------------------------------------------------------------------ */

function arm(btn) {
  // Two-step confirm for destructive buttons, without a modal.
  if (!btn.dataset.confirm) return true;
  if (btn.dataset.armed === '1') { btn.dataset.armed = ''; return true; }
  const original = btn.innerHTML;
  btn.dataset.armed = '1';
  btn.classList.add('is-armed');
  btn.textContent = btn.dataset.confirm;
  setTimeout(() => {
    if (btn.isConnected && btn.dataset.armed === '1') { btn.dataset.armed = ''; btn.classList.remove('is-armed'); btn.innerHTML = original; }
  }, 4000);
  return false;
}

const actions = {
  register(btn) { doRegister(btn.dataset.id); },
  'join-team'(btn) {
    const reg = doRegister(btn.dataset.id, { teamCode: btn.dataset.code });
    if (reg) go(`#/e/${enc(btn.dataset.id)}`);
  },
  cancel(btn) {
    if (!arm(btn)) return;
    ownUntil = Date.now() + 400;
    store.cancel(btn.dataset.id);
    toast('Registration cancelled. Your seat went to the next person on the waitlist.');
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
    const text = `${e.title} · ${whenLabel(e.starts_at)} · ${e.venue || 'IIT Delhi'} · ${rupees(e.price)}`;
    if (navigator.share) {
      try { await navigator.share({ title: e.title, text, url }); return; } catch (err) { if (err?.name === 'AbortError') return; }
    }
    window.open(waLink(`${text}\n${url}`), '_blank', 'noopener');
  },
  async copy(btn) {
    const ok = await copyText(btn.dataset.text || '');
    toast(ok ? 'Invite link copied' : 'Could not copy. Long-press the link to copy it.', ok ? 'ok' : 'error');
  },
  'demo-login'(btn) {
    ownUntil = Date.now() + 400;
    const p = store.login(btn.dataset.email);
    toast(`Logged in as ${p?.name || p?.email || btn.dataset.email}`);
    afterLogin(btn.dataset.next);
  },
  logout() {
    stopScanner();
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
    toast(on ? 'Club verified' : 'Verification removed');
  },
  feature(btn) {
    const on = btn.dataset.value === '1';
    store.setFeatured(btn.dataset.id, on);
    toast(on ? 'Event featured' : 'Event unfeatured');
  },
  reset(btn) {
    if (!arm(btn)) return;
    stopScanner();
    store.reset();
    scanLog.length = 0;
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
};

document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  const fn = actions[btn.dataset.action];
  if (!fn) return;
  ev.preventDefault();
  try { await fn(btn); } catch (err) { console.error(err); toast(errMsg(err), 'error'); }
});

const forms = {
  login(form) {
    const email = String(new FormData(form).get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const input = form.querySelector('#login-email');
      input?.setAttribute('aria-invalid', 'true');
      input?.focus();
      throw new Error('Enter a full email address, like you@iitd.ac.in');
    }
    ownUntil = Date.now() + 400;
    const p = store.login(email);
    toast(p?.is_iitd ? 'Logged in · IITD Verified' : 'Logged in');
    afterLogin(new FormData(form).get('next'));
  },
  onboarding(form) {
    const fd = new FormData(form);
    const patch = {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
    };
    if (fd.has('entry_no')) patch.entry_no = String(fd.get('entry_no') || '').trim().toUpperCase();
    if (fd.has('hostel')) patch.hostel = String(fd.get('hostel') || '');
    if (patch.phone && !/^[+\d][\d\s-]{7,14}$/.test(patch.phone)) throw new Error('Phone number looks off. Use 10 digits, like 98765 43210.');
    ownUntil = Date.now() + 400;
    store.updateProfile(patch);
    toast('Profile saved');
    const next = String(fd.get('next') || '');
    if (next) go(safeNext(next), { replace: true }); else renderRoute();
  },
  'team-create'(form) {
    const teamName = String(new FormData(form).get('teamName') || '').trim();
    if (!teamName) throw new Error('Give your team a name.');
    const id = parseRoute().parts[1];
    doRegister(id, { teamName });
  },
  'team-join'(form) {
    const raw = String(new FormData(form).get('teamCode') || '').trim();
    const code = raw.includes('/t/') ? raw.split('/t/').pop().split(/[?#]/)[0] : raw;
    if (!code) throw new Error('Paste the invite code or link from your captain.');
    const id = parseRoute().parts[1];
    doRegister(id, { teamCode: code });
  },
  'club-create'(form) {
    const name = String(new FormData(form).get('name') || '').trim();
    if (!name) throw new Error('Enter your club’s name.');
    ownUntil = Date.now() + 400;
    store.createClub(name);
    toast(`${name} created. Now post your first event.`);
    go('#/org/new');
  },
  'event-save'(form, submitter) {
    const { data, errs } = readEventForm(form, submitter);
    if (errs.length) throw new Error(errs[0]);
    if (form.dataset.id) data.id = form.dataset.id;
    ownUntil = Date.now() + 400;
    const saved = store.saveEvent(data);
    toast(data.status === 'draft' ? 'Saved as draft' : form.dataset.id ? 'Changes saved' : 'Published. Students can register now.');
    go(`#/org/e/${enc(saved?.id || data.id)}`);
  },
  'live-update'(form) {
    const note = String(new FormData(form).get('note') || '').trim();
    if (!note) throw new Error('Write the update first.');
    ownUntil = Date.now() + 400;
    store.postUpdate(form.dataset.id, note);
    form.reset();
    toast('Update posted. Everyone sees it on the event page.');
  },
  'manual-checkin'(form) {
    const input = form.querySelector('#scan-code');
    doCheckIn(input?.value);
    if (input) { input.value = ''; input.focus(); }
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

document.addEventListener('change', (ev) => {
  const sel = ev.target.closest('[data-action-change="category"]');
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
  if (matchMedia('(max-width: 720px)').matches) searchInput.blur();
});
// Clicking a feed tab clears an active search.
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a.tab[href^="#/?tab="], [data-nav="explore"], [data-nav="fests"]');
  if (a && feed.q) { feed.q = ''; if (searchInput) searchInput.value = ''; }
});

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

window.addEventListener('hashchange', renderRoute);
try { store.subscribe(() => refresh()); } catch (err) { console.error(err); }
// Keep "Live now" / "Closes in" honest without a reload.
setInterval(() => {
  if (document.hidden || !page || page.static) return;
  const a = document.activeElement;
  if (a && app.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  refresh();
}, 60e3);

renderRoute();
