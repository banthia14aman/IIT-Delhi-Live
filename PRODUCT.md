# Product

<!-- impeccable:product-schema 1 -->

> Written by the design agent from the repo research (`research/*.md`), the sentiment workbook (`IITD_LIVE_Sentiment_Analysis.xlsx`, 20 sources) and the coordinator's brief. No live user interview took place for this file. Facts marked *(inferred)* come from the brief or research and have not been confirmed by the team.

## Platform

web

## Stack

Static site on GitHub Pages (`https://banthia14aman.github.io/IIT-Delhi-Live/`): plain HTML, CSS and ES modules with no build step, relative paths only, hash routing. In demo mode all data lives in `localStorage` through `js/store.js`. A Supabase backend replaces the store's internals later and keeps the same API. Installable as a PWA (`site/manifest.webmanifest`). See `site/CONTRACT.md`.

## Users

**Primary: IIT Delhi students** (B.Tech, M.Tech, MBA/DMS, PhD). About 12k students live within 2 km and all have an `@iitd.ac.in` email. They usually use the app on a phone, often on weak hostel Wi-Fi or mobile data, and usually arrive from a link forwarded in a WhatsApp group (17/24 survey respondents discover events on WhatsApp). The job: find out what's on tonight or this week, check that it's real and that they can go, register in seconds (alone or as a team), and show a pass at the gate.
- B.Tech students are most of the campus and most of the fest crowd. The survey under-represents them (17/24 respondents were MBA).
- MBA/DMS students are the team's home turf and the first "atomic network" (DMS plus 2–3 hostels).
- PhD students and staff use the app less and mostly for talks and workshops *(inferred)*.

**Outsider students** (DU and other Delhi colleges) come for fests such as Rendezvous, Tryst and BECon. They ask on Reddit, again and again, "can outsiders enter?", "which pass covers the pronite?" and "where do I get my pass?". They can sign up but are not IITD-verified, and they can register only for events marked *Open to all*.

**Society/club organisers** are student volunteers who run events alongside coursework. Today they work with Google Forms, Linktree, Unstop and Razorpay pages. Their job: publish an event in under 2 minutes, get registrations in, run check-in from a phone at the door, post "venue changed" updates, and export the attendee list.

**Admin** (the platform team, later a student body such as BRCA or Student Affairs): verifies clubs, features events, and removes fake or abusive listings.

## Product Purpose

IITD Live is one campus feed of every IIT Delhi event. Each event has a no-install page that answers *when, where, how much, who can go*, a one-tap or team registration, and a QR pass that stays in a wallet until the gate scan. It replaces scattered WhatsApp forwards, Instagram stories, Linktrees and Google Forms.

The pains it addresses, from the sentiment audit and survey:
1. **Scattered information and late discovery.** 18/24 respondents missed an event or deadline because they found out late; "one feed of upcoming events" is the top request (17/24).
2. **Registration friction.** Students ask which portal to use, whether each friend must register, and when registration opens.
3. **Pass retrieval failures.** "Registered but couldn't download my pass", separate logins for the pronite and the main fest, and the site going down during the fest.
4. **Eligibility confusion.** At least ten repeated "can outsiders enter / which pass covers what" posts, and an outsider turned away at the gate.
5. **Trust in organisers.** "Workshop at IIT Delhi, is it legit?" and "workshop scam" threads about third-party events presented as IITD events.

**Success** (pilot targets from `FEATURES_GROWTH.md` §7): at least 0.5 weekly registrations per active student, at least 80% of campus events listed, a team-invite conversion of at least 50%, a check-in rate of at least 70%, and 100% uptime during fest week.

## Positioning

IITD Live is the only event surface that knows who is an IIT Delhi student (verified by `@iitd.ac.in` email) and which clubs are real (verified by an admin). That lets it do three things a general ticketing site cannot: IITD-only events, an **IITD-first window** for pronite passes, and a verified-organiser tick that answers "is this legit?". It runs on links inside WhatsApp, not as another app to install.

## Operating Context

- **Distribution:** links shared in hostel, club and batch WhatsApp groups, plus QR posters at SAC, LHC and the mess boards. The first screen anyone sees is usually an event page, not the home page.
- **Usage moments:** quick checks between lectures (daylight, outdoors, one-handed), late-night browsing in a hostel room (dark mode), and the gate queue at a pronite (night, crowd, low battery, patchy network, the pass shown at full brightness to a volunteer).
- **Organiser moments:** a phone at the door of a lecture hall or the OAT (Open Air Theatre), a camera scan with a manual-code fallback, then a CSV for the sponsor report.
- **Calendar rhythm:** fests are acquisition spikes (RDV ~Sep–Oct, BECon ~Jan, Tryst ~Feb–Mar). Everyday club events, inter-hostel BRCA events and talks keep people coming back between them.
- **Rituals the product plugs into:** the "is it IITD-only?" question, team formation for competitions, the pass check at the gate, and "venue changed" announcements.

## Capabilities and Constraints

- Browse everything without logging in. Login comes only at *Register* (demo: email, no OTP; production: IITD email OTP).
- An event is *IITD only* or *Open to all*, with an optional IITD-first window (`iitd_first_until`). Price is a whole number of ₹; 0 means free. Registration happens *on platform* or *external* (link out).
- Capacity is enforced, with overbooking (default +25% on free events) and an auto-promoting waitlist.
- Teams: the captain registers, shares `#/t/:code`, and teammates join within `team_min`–`team_max`.
- The wallet keeps one QR pass per registration, and the pass works offline once loaded. The organiser scans it at `#/org/scan`, with manual code entry as a fallback.
- Live notes (venue/time change) appear on the event page and on the pass.
- Aggregate social proof only, such as "38 from Aravali going". Attendee names stay private.
- **No payments in the MVP.** Paid events link out to the organiser's own page. Never sell or resell RDV passes without permission.
- **Performance budget:** must load fast on slow hostel Wi-Fi and 4G at the fest gate. Light pages, no video, few fonts, and posters drawn from emoji and colour, not heavy images.
- **Must be mobile-first** and work at 360px wide with no horizontal scroll. Tap targets are at least 44px.
- Demo mode notice in the footer: "Demo mode: data stays in your browser."

## Brand Commitments

- Name: **IITD Live** (short name the same).
- Visual anchor: IIT Delhi's institutional maroon (coordinator's brief). The colours must match the product's sentiment: campus energy and fest nights, trust and verification, and belonging to IIT Delhi.
- Anti-references from the brief: the generic purple-gradient SaaS look, and grey corporate blandness.
- Rung-0 honesty: listings that aren't run by the club itself are labelled as such (for example "Unofficial guide"). The app never implies IIT Delhi endorses the platform.

## Evidence on Hand

- `research/events.csv`: real IITD event families (RDV, Tryst, BECon, Speranza, Literati, BRCA, DMS conclaves…).
- Student survey (n=24) figures quoted in `research/BRAINSTORM.md`.
- Sentiment audit: 20 public sources (mostly r/IITDelhi) in the uploaded workbook. It is qualitative and not a measure of prevalence; do not claim "most students…".
- Global comparables in `research/GLOBAL_CASES.md` (Partiful, Luma, Eventbrite, Fatsoma/FIXR, Rubric, Fizz, Snackpass, InstiApp).
- **Absent and not to be fabricated:** testimonials, partner logos, official IITD or RDV endorsement, real pass prices that haven't been confirmed, and user counts.

## Product Principles

1. **Answer before asking.** Every card and page answers when, where, ₹ and who-can-go before it asks for a login or a tap.
2. **Trust is visible.** Verified organiser, verified student, honest seat counts and honest deadlines all appear in the UI, not in a FAQ.
3. **The pass never fails.** The wallet is the most reliable screen in the app: offline, fast, bright and findable in one tap.
4. **Plug into WhatsApp, don't fight it.** Every page is a shareable link that works without an install or a login.
5. **Free stays free.** No fees on free events, and urgency only when it is true.

## Accessibility & Inclusion

- WCAG 2.2 AA: text contrast of at least 4.5:1, non-text UI of at least 3:1, and visible focus.
- Status is never carried by colour alone: *IITD only*, *Waitlisted* and *Invalid pass* always come with words and an icon.
- Respect `prefers-reduced-motion`; the live pulse becomes a static dot.
- Tap targets of at least 44px; alt text or an accessible name on every poster.
- English UI. Copy should read easily for Hindi-first students: short sentences, no idioms. Hinglish is fine in organiser-written event descriptions *(inferred)*.
