# IITD Live — Feature List & Deliverables (1-day build)

Scope rule: **ship what demos the core loop end-to-end. Pitch the rest as roadmap.**

Core loop: *discover → register (solo/team) → QR pass in wallet → checked in at the gate → organiser sees data.*

Evidence for every feature is in [`GLOBAL_CASES.md`](GLOBAL_CASES.md) and [`FEATURES_GROWTH.md`](FEATURES_GROWTH.md).

---

## 0. Stack (chosen for speed; both are already connected to this workspace)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + Tailwind** | Server-rendered per-event preview tags, so WhatsApp link previews work. Deploys to Vercel with zero config |
| Backend | **Supabase**: Postgres + Auth (email OTP) + Storage (posters) + Realtime (live updates) | Database, login, file storage and real-time updates in one service; no separate server to write |
| Hosting | **Vercel** | Push to deploy, free tier |
| QR | `qrcode` (generate) + `html5-qrcode` (scan in the phone browser) | No native app |
| Payments | **None in MVP**: paid events link out to the organiser's own page or Unstop | Per GLOBAL_CASES §4.3: no legal or refund risk |

---

## 1. Feature list

Legend: **M** = must ship tomorrow · **S** = ship if time · **R** = roadmap (pitch only, maybe a mock screen)

### A. Accounts & identity
| # | Feature | Pri |
|---|---|---|
| A1 | Email OTP login (no passwords) | M |
| A2 | "IITD Verified" badge automatically for `*iitd.ac.in` emails; outsiders can sign up but are unverified | M |
| A3 | Onboarding profile: name, entry no., hostel (dropdown), phone | M |
| A4 | Browse everything without login; ask for login only at Register | M |
| A5 | Roles: student / organiser (club owner) / admin | M |
| A6 | IITD single sign-on via the institute's own login (Kerberos) | R |

### B. Discovery
| # | Feature | Pri |
|---|---|---|
| B1 | Home feed with tabs: **Tonight @ IITD** / This week / Upcoming / Fests | M |
| B2 | Filters: category, Free/Paid, **IITD-only vs Open to all**, date | M |
| B3 | Search by title / club | M |
| B4 | Event card answers 4 questions: when, where, ₹ price, who can go | M |
| B5 | "Registration closes in Xh" / "N seats left" (only when true) | M |
| B6 | Promoted / featured events (admin flag) | S |
| B7 | Club pages (all events by a club, verified tick) | S |
| B8 | Personalised recommendations | R |

### C. Event page
| # | Feature | Pri |
|---|---|---|
| C1 | Poster, description, time, venue, price, eligibility, organiser + verified tick | M |
| C2 | Register button (states: Register / Waitlist / Registered / Closed / External link) | M |
| C3 | **Going count + hostel breakdown** ("38 from Aravali going"); aggregate only, privacy-safe | M |
| C4 | **Live update banner** (venue/time change) via Realtime | M |
| C5 | Add to Google Calendar / .ics download | M |
| C6 | Share: Web Share API → WhatsApp fallback (`wa.me` link) | M |
| C7 | Per-event preview tags (OG) so WhatsApp shows a rich preview | M |
| C8 | Map pin for venue (static link to Google Maps) | S |

### D. Registration, teams, wallet
| # | Feature | Pri |
|---|---|---|
| D1 | One-tap register (profile pre-filled) | M |
| D2 | Capacity + **overbooking** (default +25% on free events) + **waitlist** | M |
| D3 | Waitlist auto-promotes when someone cancels | M |
| D4 | Cancel registration | M |
| D5 | **Team registration**: captain creates team → invite link `/t/<code>` → teammates join (min/max size) | M |
| D6 | **Wallet**: all my passes, QR per pass, upcoming first | M |
| D7 | Wallet works offline (installable web app caches it) | S |
| D8 | "Get a pass for a friend" (Snackpass-style) | R |
| D9 | Verified pass transfer / resale with escrow | R |
| D10 | Paid ticketing via UPI (payment gateway) | R |

### E. Organisers
| # | Feature | Pri |
|---|---|---|
| E1 | Create club (pending verification until admin approves) | M |
| E2 | Create / edit / publish event (poster upload, all fields, capacity, team size, eligibility, external link) | M |
| E3 | Event dashboard: registrations count, waitlist, check-ins, hostel breakdown | M |
| E4 | Attendee list + **CSV export** | M |
| E5 | **QR check-in scanner** in the phone browser; shows ✅ name or ❌ invalid/already used | M |
| E6 | Post live update to all registrants | M |
| E7 | Fest hub: group events under a fest, with a day × venue schedule grid | M |
| E8 | Auto-fill event fields from an uploaded poster (AI extraction) | S |
| E9 | Referral links with commission for outsider passes (Fatsoma reps) | R |
| E10 | IITD-first pass window (verified students only until time T) | S (just an eligibility time rule) |

### F. Admin
| # | Feature | Pri |
|---|---|---|
| F1 | Verify / unverify clubs | M |
| F2 | Feature / unfeature events | S |
| F3 | Hide abusive or fake events | S |

### G. Notifications
| # | Feature | Pri |
|---|---|---|
| G1 | Calendar invite (.ics) as the reminder | M |
| G2 | Email reminder 2h before (scheduled job + email) | S |
| G3 | Weekly "This week @ IITD" email | R |
| G4 | WhatsApp reminders (Business API needs Meta approval) | R |
| G5 | Web push notifications | R |

### H. Platform / non-functional
| # | Feature | Pri |
|---|---|---|
| H1 | Mobile-first responsive UI; tap targets ≥ 44px; alt text on posters | M |
| H2 | Database access rules (Supabase row-level security) on every table: students see their own registrations; organisers see their own events' attendees | M |
| H3 | Installable web app (manifest + icons) | S |
| H4 | Seed data: real IITD events from `events.csv` + upcoming BECon / Tryst (dates marked TBC) | M |
| H5 | Demo accounts: student, outsider, organiser, admin | M |
| H6 | Basic analytics (Vercel Analytics) | S |

**Count: 46 features → 34 Must, 9 Should, 13 Roadmap** (some overlap is intentional between S/R).

---

## 2. Data model (Supabase)

```
profiles      id (=auth.users.id) · name · entry_no · hostel · phone · role · is_iitd (from email)
clubs         id · name · slug · owner_id → profiles · verified · instagram
fests         id · name · slug · starts_on · ends_on
events        id · club_id · fest_id? · title · description · category · starts_at · ends_at · venue
              poster_url · price · eligibility (iitd_only|open) · iitd_first_until?
              capacity? · overbook_pct · reg_mode (platform|external) · external_url
              team_min · team_max · featured · status (draft|published) · live_note · live_note_at
teams         id · event_id · name · captain_id · invite_code (unique)
registrations id · event_id · user_id · team_id? · status (confirmed|waitlisted|cancelled|checked_in)
              qr_token (uuid, unique) · created_at · checked_in_at   UNIQUE(event_id, user_id)
```

Server-side logic (Postgres functions, so it can't be bypassed from the browser):
- `register(event_id, team_code?)`: eligibility check, capacity × (1 + overbook) → confirmed or waitlisted.
- `cancel(registration_id)`: cancels, then promotes the oldest waitlisted.
- `check_in(qr_token)`: organiser-only; marks checked_in; rejects reuse.
- View `event_stats`: going count, hostel breakdown, check-ins.

---

## 3. Pages (routes)

| Route | Who | Features |
|---|---|---|
| `/` | all | B1–B5 |
| `/e/[id]` | all | C1–C8, D1–D5 |
| `/f/[slug]` | all | E7 schedule grid |
| `/t/[code]` | logged in | D5 join team |
| `/wallet` | student | D6 |
| `/login`, `/onboarding` | all | A1–A3 |
| `/org` | organiser | E1, my events |
| `/org/e/[id]` | organiser | E2, E3, E4, E6 |
| `/org/scan` | organiser | E5 |
| `/admin` | admin | F1–F3 |

---

## 4. Deliverables

| # | Deliverable | Owner | Done when |
|---|---|---|---|
| 1 | **Live URL** (Vercel) | Build | Opens on a phone, all M features work |
| 2 | **GitHub repo** with README (setup, environment variables, seed) | Build | Fresh clone runs locally |
| 3 | **Supabase project**: schema, row-level security, functions, seed | Build | Migrations committed in `supabase/` |
| 4 | **Demo accounts** (4) + seeded events incl. a fake "RDV demo" fest | Build | Listed in README |
| 5 | **5-min demo script**: student registers → team invite → QR → organiser scans → dashboard updates live | Team | Rehearsed twice |
| 6 | **Pitch deck**: problem (survey + Reddit), event fee map, global case studies, product demo, network effects, adoption plan, RDV anchor strategy, revenue model, roadmap | Team | ~12 slides |
| 7 | **Research appendix**: BRAINSTORM, FEATURES_GROWTH, GLOBAL_CASES, events.csv | Done ✅ | — |
| 8 | **Architecture diagram** (1 slide) | Team | — |
| 9 | **Test checklist** (below) run on Android Chrome + iPhone Safari | Team | All ticked |

---

## 5. Build timeline (~14 focused hours)

| Hour | Work |
|---|---|
| 0–1 | Supabase project, schema + row-level security + functions; Next.js scaffold; Vercel project; first deploy |
| 1–3 | Auth (OTP), onboarding, feed + filters + search |
| 3–5 | Event page, register/cancel/waitlist, going counts, .ics, share, preview tags |
| 5–7 | Teams + invite links; wallet with QR |
| 7–9 | Organiser: club, event form + poster upload, dashboard, CSV, live updates |
| 9–10 | QR scanner + check-in function |
| 10–11 | Fest hub grid; admin verify/feature |
| 11–12 | Seed real data; demo accounts; installable web app (manifest) |
| 12–13 | Phone testing, fixes, production deploy |
| 13–14 | Demo rehearsal; deck screenshots |

---

## 6. Test checklist (acceptance)

- [ ] Logged-out user can browse feed + event page; Register prompts login
- [ ] OTP login works for an @iitd.ac.in and a gmail address; only the first shows Verified
- [ ] Outsider cannot register for an IITD-only event
- [ ] Capacity 2, overbook 0: 3rd registrant is waitlisted; 1st cancels → 3rd promoted
- [ ] Team: captain creates, 2 friends join via link; team_max enforced
- [ ] Wallet shows QR; organiser scan → ✅; second scan → "already checked in"
- [ ] Another club's organiser cannot see this event's attendees (row-level security)
- [ ] Live update appears on an open event page without refresh
- [ ] WhatsApp share shows poster + title preview
- [ ] CSV export opens in Excel/Sheets
- [ ] Works on 360px-wide screen; no horizontal scroll

---

## 7. Risks for tomorrow

| Risk | Mitigation |
|---|---|
| Supabase's built-in email is heavily rate-limited (a few OTP emails per hour) | Add custom SMTP (e.g. Resend / Gmail app password) **first thing**, or pre-create demo accounts |
| iOS Safari camera permission for the scanner | Test early; fallback = type the pass code manually |
| WhatsApp caches link previews | Test with a fresh event URL |
| Scope creep | Anything not **M** waits until all M items pass the checklist |
