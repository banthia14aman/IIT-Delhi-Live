# IITD Live: User Journeys & UX Rules

Builds on [`BRAINSTORM.md`](BRAINSTORM.md), [`FEATURES_GROWTH.md`](FEATURES_GROWTH.md), [`GLOBAL_CASES.md`](GLOBAL_CASES.md), [`DELIVERABLES.md`](DELIVERABLES.md) and the sentiment workbook (20 sources). Routes are the hash routes in [`site/CONTRACT.md`](../site/CONTRACT.md). Visual rules are in [`/DESIGN.md`](../DESIGN.md).

Evidence tags: **[S]** survey (n=24), **[R]** Reddit/sentiment audit row number, **[W]** web scan.

---

## 0. Patterns we borrow, and why

| Pattern | Where it's proven | What we take |
|---|---|---|
| **No-install RSVP link** | Partiful: every invite is a link that works in iMessage, WhatsApp or Instagram, with no app and no account to look | An event page is fully readable logged-out. Login is asked for only at *Register*, and then the app finishes the registration you started |
| **Ticket wallet** | Eventbrite / Fatsoma / FIXR / Rubric: all passes in one place, offline, QR at the door | `#/wallet`: one pass per registration, upcoming first, works offline, with code fallback |
| **Organiser-nominated scanners** | Rubric: club execs scan at the door from their phones | `#/org/scan` in the phone browser, with manual code entry when the camera fails |
| **The event page as the product** | Luma: one clean page with title, time, place, host and one button | `#/e/:id` answers when, where, ₹ and who-can-go above the fold, with one sticky action |
| **Campus loops** | Fizz / Snackpass: verified .edu identity, invites, ambassadors, launch at semester start | IITD email = verified seal. Team invites are the viral loop. "38 from Aravali going" is aggregate social proof |
| **Rep / share links** | Fatsoma reps | Every share is a link plus a WhatsApp-ready message (see §6) |

---

## A. IITD student: discover → register → team invite → entry

**Persona:** Riya, 2nd-year B.Tech, Nilgiri hostel. She's in 14 WhatsApp groups. She missed the Literati quiz last month because the form closed while she was in a lab [S: 18/24 found out late].

| # | Step | Screen / route | What she sees and does | Pain addressed (evidence) | Pattern |
|---|---|---|---|---|---|
| 1 | Link lands in the hostel WhatsApp group | WhatsApp → `#/e/:id` | The message itself says *what, when, where, ₹, who* (§6). She taps it | Scattered info: "where are registrations published?" [R1, R2] | Partiful link |
| 2 | Event page opens logged-out, in under 2s on hostel Wi-Fi | `#/e/:id` | Above the fold: title, the **verified seal** next to the club, the date stub, venue, a `Free` chip, an `IITD only` chip, "38 from Nilgiri going", "Closes in 3h". A sticky **Register** bar | "Is this legit?" [R12–14]; eligibility confusion [R3, R9] | Luma page |
| 3 | Taps **Register** | → `#/login` | One field: email. Below it are the demo one-tap accounts. Copy: "Use your @iitd.ac.in email to get the IITD verified seal" | Separate logins for each fest site [R11] | Partiful defer-login |
| 4 | First time only: profile | `#/onboarding` | Name, entry no., hostel (dropdown), phone. Each sensitive field has a "why we ask" line. Saved once and reused forever | Retyping Google Forms [S: 14/24 want reg + ticketing in one]; Aadhaar/data trust [R8] | Profile pre-fill |
| 5 | Lands back on the event, already registered | `#/e/:id` → success sheet | The pending registration completes automatically. The "Stamped" moment: the pass rises with the QR. Buttons: **Add to calendar** (.ics) and **View in wallet** | "Registered but couldn't get my pass" [R4] | Wallet |
| 6 | Team event? Creates a team | `#/e/:id` (team form) | Names the team. Becomes captain. Gets a share sheet with the `#/t/:code` link and a WhatsApp message: "Join my team *Bit Flippers* for RoboWars, Sat 18 Oct 7:30 PM, LHC. Tap to join: …" | "Does each friend register separately?" [R6] | Snackpass/Fizz invite loop |
| 7 | Teammate opens the invite | `#/t/:code` | Team name, event card (all 4 answers), members so far, "2 of 4 spots filled", and one **Join team** button. Login is deferred the same way as step 3 | Team formation via screenshots and DMs | Partiful |
| 8 | Event day: reminder and live update | `#/` (Tonight tab), `#/e/:id` | The Tonight tab shows the event with a saffron live stub. The organiser posts "Moved to LHC 108". The **live banner** appears on the event page and on her pass | Venue/time changes lost in group chats [S: 6/24 want live updates] | Live Activities-style banner |
| 9 | At the gate | `#/wallet` → pass | One tap from the bottom nav. Marigold stub, QR in a white well, code `7KQ4-M2XP`, her name, entry no. and team. Works offline. Hint: "Turn brightness up" | Pass retrieval failures, site down during the fest [R1, R4] | Ticket wallet |
| 10 | Scanned | (organiser's `#/org/scan`) | Her pass flips to "Checked in · 7:42 PM" (store `subscribe` updates open tabs) | No-shows / no proof of attendance [S: 13/24 skipped] | Rubric scanner |
| 11 | After | `#/` | Back in the feed, Tonight or This week shows the next thing. The wallet loop brings her back | Retention between fests | Wallet loop |

**Taps (returning user):** WhatsApp link → **Register** → pass. That's 2 taps. **First-timer:** link → Register → email → Continue → profile Save → pass, with the registration finishing itself.

**Success metrics:**
- Median time from link open to "registered" under 30s for returning users and under 90s for first-timers.
- At least 50% of team invitees join.
- At least 70% of confirmed registrants are checked in.
- At least 0.5 weekly registrations per active student.
- At least 30% of registrants open the wallet on event day.

---

## B. Outsider student: a fest (RDV / Tryst / BECon)

**Persona:** Aman, 3rd-year at a DU college. He saw a Rendezvous reel and asked on r/IITDelhi "can outsiders go to the pronite?" [R3, R5, R9, R10]. Last year a friend was turned away at the Tryst gate [R18].

| # | Step | Screen / route | What he sees and does | Pain addressed | Pattern |
|---|---|---|---|---|---|
| 1 | Taps a link in an Instagram bio or a Reddit answer | `#/f/:slug` (fest hub) | Fest name, dates (or "Dates to be confirmed"), and a day × venue schedule grid. Every block shows an eligibility icon | "What's on, which day is worth it?" [R5] | Luma calendar / fest app |
| 2 | Narrows to what he can attend | `#/f/:slug` filter, or `#/` with the `Open to all` filter | One toggle: **Open to all**. IITD-only events stay visible but are clearly marked, never hidden in a way that causes confusion | "Who can enter?" [R9]; "≥10 repeated posts" [R7] | Explicit eligibility chips |
| 3 | Opens an IITD-only pronite | `#/e/:id` | The chip says `IITD only`, plus a plain sentence: "This pronite is for IIT Delhi students only. Outsiders can't register." If `iitd_first_until` is set: "IITD students first until 6 PM Fri. Opens to everyone after that." Then "Events open to you at this fest →" | Being turned away at the gate [R18]; pass-scope confusion [R3] | Honest eligibility, before any tap |
| 4 | Registers for an open event | `#/e/:id` → `#/login` → `#/onboarding` | Logs in with Gmail. His profile shows "Guest (non-IITD)". The onboarding entry-no. field is optional for outsiders, with copy like "Your college roll no." *(UI copy suggestion)* | Unclear what's required [R6, R8] | Partiful defer-login |
| 5 | Gets the pass | `#/wallet` | Same wallet as IITD students, plus a line in the stub: "Carry your college ID" | Pass retrieval [R4] | Wallet |
| 6 | Gate | `#/wallet` → organiser scans | Valid scan, or a clear reason on the volunteer's screen | Gate confusion | Rubric |

**Success metrics:**
- 0 registrations by outsiders for IITD-only events (the store enforces this).
- At least 60% of outsider sessions that view an IITD-only event then open an `Open to all` event.
- Outsider registration completion of at least 70% after login.
- Outsider passes checked in at least 60%.

---

## C. Society organiser: create → dashboard → QR check-in

**Persona:** Dev, secretary of a CAIC club. Today he runs Google Forms, a Linktree and a spreadsheet, and checks names off a printout at the door.

| # | Step | Screen / route | What he sees and does | Pain addressed | Pattern |
|---|---|---|---|---|---|
| 1 | Logs in and starts | `#/login` → `#/org` | "Your clubs" and "Your events". With no club yet: one form, **Create club** (name). The club shows "Pending verification" with a note on what admins check | Becoming trusted | Rubric society setup |
| 2 | Creates an event in under 2 minutes | `#/org/new` | Sections: **Basics** (title, category, poster emoji + colour), **When & where**, **Who & ₹** (price, IITD only / open, IITD-first until, capacity, overbook %), **Teams** (min–max), **Registration** (on IITD Live or external link). A **live card preview** at the top shows the four answers as he types. Missing ones are flagged ("Add a venue: students look for it first") | Incomplete listings cause the repeat questions [R7] | Luma create, Eventbrite form |
| 3 | Publishes and shares | `#/org/e/:id` | Draft → **Publish**. A share sheet opens with the link and a WhatsApp message prefilled with the four answers | Distribution is WhatsApp [S: 17/24] | Partiful share |
| 4 | Watches registrations | `#/org/e/:id` | A compact stat strip (Confirmed · Waitlisted · Checked in), hostel breakdown bars, an attendee table and **Export CSV** | Spreadsheets by hand | Eventbrite dashboard |
| 5 | Posts a live update | `#/org/e/:id` | One 140-character field: "Venue moved to LHC 108". A preview of the saffron banner. **Post update** sends it to the event page and to every registrant's pass | Updates lost in groups [S: 6/24] | Live banner |
| 6 | Door check-in | `#/org/scan` | Camera opens. Each scan gives a full-height result sheet in under 1s: ✓ name and team, or ✕ with the reason ("Already checked in at 7:31 PM" / "Pass is for another event" / "Not a valid pass"), plus haptics. **Type a code instead** is always visible | Printout lists, iOS camera permission risk | Rubric scanner |
| 7 | After | `#/org/e/:id` | Check-in rate, CSV for sponsors. "Duplicate event" for next week *(roadmap)* | Proving value to sponsors | |

**Success metrics:**
- Median time from opening `#/org/new` to Publish under 2 minutes.
- At least 60% of organisers publish a second event.
- Scan-to-result under 1s.
- At least 70% of confirmed attendees checked in.
- At least 40% of events use on-platform registration rather than an external link.

---

## D. Admin: verify, feature, keep it clean

**Persona:** the IITD Live team now; later a BRCA or Student Affairs nominee.

| # | Step | Screen / route | What they see and do | Pain addressed |
|---|---|---|---|---|
| 1 | Review pending clubs | `#/admin` | A queue of unverified clubs with name, owner email (an IITD domain is highlighted), Instagram handle and created date. **Verify** or leave pending. The seal appears everywhere at once | "Is this workshop legit?" [R12–14] |
| 2 | Feature events | `#/admin` | A list of upcoming published events with a **Feature** toggle. Featured events get a marigold `Featured` chip and rank first in their tab. Rule: only verified clubs can be featured | Anchor-tenant placement for fests |
| 3 | Clean up | `#/admin` | Hide or unpublish fake events *(roadmap)*. **Reset demo data** with an inline confirm | Fake third-party listings [R13, R14] |

**Success metrics:**
- Verification turnaround under 24h.
- 0 featured events from unverified clubs.
- 0 events reported as fake that stay live for more than 12h.

---

## E. The first 30 seconds on the home screen (`#/`)

Riya opens IITD Live from her home screen at 6:40 PM on a Friday.

- **0–2s.** The page is already readable. Fonts swap in, but text is visible immediately and cards come from the local store. The masthead (maroon by day, night surface after dark) shows the logo, **IITD Live**, a search icon and her avatar. Under it are the tabs **Tonight • This week • Upcoming • Fests**. *Tonight* is selected and has a saffron dot because something is live.
  - *Default-tab rule:* open on **Tonight** only if it has events. Otherwise open on **This week**. Never open on an empty tab.
- **2–8s.** About four ticket cards fit on screen. The first has a **saffron stub**: "LIVE · till 9 PM, Open Mic Night, Music Club ✓, SAC Lawns, `Free`, `Open to all`". Each card below answers when (stub), where (venue line), ₹ (chip) and who (chip). She doesn't tap anything to find out whether she can go.
- **8–15s.** Filter chips sit above the list: `Free`, `Open to all`, `IITD only`, then the categories. Search is one tap away. A *Featured* marigold chip marks the RDV-week workshop. The urgency line "Closes in 3h" appears on one card only, because it's true.
- **15–25s.** She taps the RoboWars card. The event page opens with the verified seal, "38 from Nilgiri going", the team size and a sticky **Register team** bar showing the price on the left.
- **25–30s.** She taps **Register team** and names the team. She gets the pass sheet and the invite link, ready for WhatsApp.

**Empty and edge states on `#/`:**
- No events tonight: "Nothing on tonight. Here's this week →", switching tabs automatically.
- No search results: "No events match *quizz*. Try *quiz*, or clear filters." with a **Clear filters** button.
- First visit: no onboarding carousel. The feed *is* the onboarding.
- Demo footer: "Demo mode: data stays in your browser."

---

## F. UX rules the UI agent must follow

**Top 10 (non-negotiable):**
1. **Browse without login.** Every route except `#/wallet`, `#/t/:code` join, `#/org*` and `#/admin` renders fully logged-out. Ask for login only when the user acts: Register, Join team, Create.
2. **Finish what they started.** When login or onboarding interrupts a Register or Join, store the pending action and complete it automatically on return. The user never presses Register twice.
3. **Three taps or fewer to register** for a returning user, from the shared link: Register → (team name) → pass. First-timers get no more than 3 screens: login → profile → pass.
4. **Every card answers when, where, ₹ and who-can-go** without a tap: date stub, venue line, price chip (`Free` / `₹299`), eligibility chip (`IITD only` / `Open to all` / `IITD first · till …`).
5. **Eligibility before action.** Ineligible users see why, in a sentence, *before* the button, plus a path to events they can attend. Never show a Register button that will fail.
6. **The verified seal is everywhere** a verified club name appears: card, event page, club page, pass. Unverified clubs get a neutral note, never an alarm.
7. **The wallet is one tap away and never fails.** Bottom nav → Wallet → today's pass expanded. QR in a white well, readable code fallback, offline once loaded, brightness hint.
8. **Urgency only when true.** "Closes in Xh" only when it's under 24h. "N seats left" only when it's 20% of capacity or less. Never invent scarcity, and never show "₹0".
9. **Mobile-first and light.** It works at 360px with no horizontal page scroll. Tap targets are at least 44px. No images are required: posters are emoji on `poster_color`. Content renders before fonts load.
10. **Share is a WhatsApp message, not just a URL.** Because hash routes give WhatsApp only a generic site preview, the share text itself carries the four answers (template in §6). Use the Web Share API with a `wa.me` fallback.

**Also required:**
11. One primary action per screen region. On the event page it's the sticky action bar, with the price on the left and the state-aware button on the right (states are in DESIGN.md → Buttons).
12. Use states the store already provides: `seats_left`, `closes_in_ms`, `my_registration`, `going`, `by_hostel`. Don't recompute them differently in the UI.
13. Social proof is aggregate only ("38 from Nilgiri going", "120 going"). Never list attendee names to students.
14. Live updates use the saffron banner on the event page and the pass, with `role="status"`. One banner per screen, newest only, with a relative time.
15. Waitlist is honest and automatic: "You're #3. We'll move you up automatically if a seat frees." Cancel promotes the next person, and their pass appears.
16. Errors name the problem and the fix, in the product's words ("Use your @iitd.ac.in email to register for IITD-only events"). Never show a raw `Error:` string. Store errors are already user-facing; show them inline near the action.
17. Destructive actions confirm inline (Cancel registration → "Yes, cancel / Keep my pass"). No modals for confirmations.
18. Every sensitive field (entry no., phone) shows a one-line "why we ask".
19. The scanner always offers **Type a code instead**. Results are big, worded, iconised and haptic, and never rely on colour alone.
20. The organiser create form shows a live preview of the event card. Publishing is blocked until the four answers exist.
21. The default feed tab is never empty: Tonight → This week → Upcoming fallback.
22. Times are in IST, in the 12-hour format students use ("Sat 18 Oct · 7:30 PM"). Which events count as "Tonight" is decided by `store.events({tab:'tonight'})`; the UI doesn't redefine it.
23. Respect `prefers-reduced-motion` and `prefers-color-scheme`. Both themes are first-class.
24. Show the footer note "Demo mode: data stays in your browser" on every page while `store.js` is local.

---

## G. Share message template (WhatsApp)

```
🎤 Open Mic Night · Music Club ✓
📅 Fri 17 Oct · 7:00 PM
📍 SAC Lawns
🎟️ Free · Open to all
Register in 1 tap: https://banthia14aman.github.io/IIT-Delhi-Live/#/e/<id>
```
Team invite variant: "Join my team *<team>* for <event> · <date> · <venue>. Tap to join: …/#/t/<code>". Emoji are fine *inside the shared WhatsApp text*, since that's the medium's own vernacular. They are not used as UI icons in the app.

---

## H. Journey-level metric summary

| Journey | North-star for that journey | Pilot target |
|---|---|---|
| A. IITD student | Link-open → registered time; check-in rate | < 30s returning; ≥ 70% checked in |
| A. Team loop | Invitee join rate | ≥ 50% |
| B. Outsider | Outsider registrations for eligible events after viewing an ineligible one | ≥ 60% redirect success; 0 ineligible registrations |
| C. Organiser | Time to publish; repeat organisers | < 2 min; ≥ 60% |
| D. Admin | Verification turnaround | < 24h |
| Whole product | Weekly registrations per active student | ≥ 0.5 |
