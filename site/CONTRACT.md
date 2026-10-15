# Build contract (shared by all agents)

Static site deployed on **GitHub Pages** at `https://banthia14aman.github.io/IIT-Delhi-Live/`.
So: **relative paths only**, no build step, no bundler, plain ES modules, CDN libs pinned to exact versions.

**Demo mode:** there is no server yet. All data lives in `localStorage` via `js/store.js`. Show a small "Demo mode: data stays in your browser" note in the footer. The Supabase backend comes later and will replace `store.js` internals with the same API.

## File ownership (only edit your own files)

| Owner | Files |
|---|---|
| design agent | `PRODUCT.md`, `DESIGN.md` (repo root), `research/USER_JOURNEY.md`, `site/css/tokens.css`, `site/assets/icon.svg`, `site/manifest.webmanifest` |
| logic agent | `site/js/store.js`, `site/js/seed.js`, `site/tests/store.test.mjs` |
| ui agent | `site/index.html`, `site/css/app.css`, `site/js/ui.js`, `site/404.html` |

## Design tokens (`css/tokens.css` defines them; `app.css` uses ONLY these via `var()`)

```
--bg --surface --surface-2 --text --text-muted --border
--primary --primary-contrast --accent --accent-contrast
--success --warning --danger --live            (live = "happening now" pulse colour)
--font-display --font-body --font-mono
--radius-sm --radius --radius-lg --shadow-sm --shadow
--space-1 --space-2 --space-3 --space-4 --space-5 --space-6
```
Light + dark: define on `:root`, redefine under `@media (prefers-color-scheme: dark)`. Fonts are self-hosted by the theme file (`@font-face` in `css/themes/<theme>.css`, files in `assets/fonts/<theme>/`); no third-party font `@import`.

## Store API (`js/store.js`, ES module, `export const store = {...}`; all sync, all return plain objects)

Data shapes:
```
Profile  {id, email, name, entry_no, hostel, phone, role:'student'|'organiser'|'admin', is_iitd:boolean}
Club     {id, name, slug, owner_id, verified:boolean, instagram}
Fest     {id, name, slug, starts_on, ends_on, tagline, dates_tbc:boolean, cover|null}
Event    {id, club_id, fest_id|null, title, description, category, starts_at, ends_at (ISO), venue,
          poster_emoji, poster_color, price (₹ int, 0 = free), eligibility:'iitd_only'|'open',
          iitd_first_until|null (ISO), capacity|null, overbook_pct, reg_mode:'platform'|'external',
          external_url|null, team_min, team_max, featured:boolean, status:'draft'|'published',
          live_note|null, live_note_at|null, sample:boolean,
          cover|null}   (key into site/assets/img/<key>.webp + <key>-sm.webp; credits in assets/img/credits.json)
          + computed on read: club, fest, going, waitlisted, by_hostel {hostel:n}, seats_left|null,
            my_registration|null, closes_in_ms|null
Team     {id, event_id, name, captain_id, invite_code}
Registration {id, event_id, user_id, team_id|null, status:'confirmed'|'waitlisted'|'cancelled'|'checked_in',
              qr_token, created_at, checked_in_at|null}
```

Functions:
```
events({tab:'tonight'|'week'|'upcoming'|'all', q, category, price:'free'|'paid'|'', eligibility:'iitd_only'|'open'|''}) → Event[]
event(id) → Event|null
categories() → string[]
HOSTELS → string[]                        (exported const)
fests() → Fest[]            fest(slug) → {fest, events} | null
clubs() → Club[]            club(slug) → {club, events} | null

me() → Profile|null
login(email) → Profile      (demo: no OTP; creates profile if new; is_iitd = /iitd\.ac\.in$/i)
logout()
updateProfile(patch) → Profile
needsOnboarding() → boolean (name/hostel/entry_no missing)

register(eventId, {teamName?, teamCode?}) → Registration   throws Error(user-facing message)
cancel(registrationId)                                       promotes oldest waitlisted
wallet() → [{registration, event, team}]  (upcoming first, excludes cancelled)
team(code) → {team, event, members:[Profile]} | null

myClubs() → Club[]          createClub(name) → Club  (makes me organiser, unverified)
saveEvent(data) → Event     (create if no id, else update; organiser must own club)
postUpdate(eventId, note)
attendees(eventId) → [{registration, profile, team}]
stats(eventId) → {confirmed, waitlisted, checked_in, by_hostel}
checkIn(qrToken) → {ok:boolean, reason?, profile?, event?}   ('already checked in' / 'invalid pass' / 'not your event')
toCSV(eventId) → string
ics(eventId) → string

setVerified(clubId, bool)   setFeatured(eventId, bool)     (admin only)
subscribe(fn) → unsubscribe   (fires on any change, incl. other tabs via 'storage' event)
reset()                       (wipe + reseed)
DEMO_ACCOUNTS → [{email, label}]   (exported const: student, outsider, organiser, admin)
```

## Routes (hash router in `ui.js`)

```
#/                feed (tabs Tonight / This week / Upcoming / Fests, filters, search)
#/e/:id           event page
#/f/:slug         fest hub (day × venue schedule grid)
#/c/:slug         club page
#/t/:code         join team
#/wallet          my passes with QR
#/login           demo login (email + one-tap demo accounts)
#/onboarding      profile
#/org             organiser home (my clubs, my events, create club)
#/org/new         create event   #/org/e/:id  edit + dashboard (stats, attendees, CSV, live update)
#/org/scan        QR check-in scanner (camera + manual code entry fallback)
#/admin           verify clubs, feature events, reset demo data
```

## CDN libs (exact versions)
- QR generate: `https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js` (global `qrcode`)
- QR scan: `https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js` (global `Html5Qrcode`)
