# IITD Live — Features, UX, Network Effects & Adoption

Builds on [`BRAINSTORM.md`](BRAINSTORM.md). Evidence tags: **[S]** survey (n=24), **[R]** Reddit/sentiment audit, **[W]** web scan.

---

## 1. The core tension: Rendezvous brings traffic, weekly events keep it

The professor is right that RDV is the **anchor tenant**: it is the event every IITD student and thousands of outsiders search for. But the traffic has a shape:

```
traffic
  ▲          RDV                                   BECon  Tryst
  │          ███                                    ██    ██
  │          ███                                    ██    ██
  │ ▂▂▂▂▂▂▂▂▂███▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂██▂▂▂▂██▂▂▂▂▂  ← clubs, talks, BRCA, workshops
  └──────────────────────────────────────────────────────────────▶ time
     Sep  Oct                                       Jan   Feb-Mar
```

- **Fests = acquisition spikes.** Four or so a year. They get the app onto phones.
- **Everyday events = retention.** Clubs, BRCA inter-hostel, talks, workshops. Without them users churn in the 4 months between fests.

So the plan needs **both**: RDV for the install wave, a full weekly calendar so the installs stick.

**Timing reality:** RDV 2026 ran 28 Sep – 1 Oct [W], so it's over. The next RDV is around Sep 2027. Between now and then: BECon (~late Jan 2027) and Tryst (~late Feb 2027). Use them as proof points before the RDV pitch.

---

## 2. Onboarding Rendezvous: a ladder of asks

Don't open with "move your ticketing to us". Climb one rung at a time; each rung is useful on its own.

| Rung | Ask to RDV | Cost to RDV | What we get |
|---|---|---|---|
| 0 | *Nothing.* We list RDV's public schedule, pronites, eligibility FAQ, labelled "Unofficial guide" | None | RDV traffic, without permission |
| 1 | "Official info partner" badge; they send us schedule changes | One WhatsApp a day | Trust + live updates |
| 2 | Their registration links point to (or embed) our event pages | Tiny | Registrations counted on our platform |
| 3 | **IITD-first pronite window**: verified IITD students claim pronite passes in our wallet before outsiders | Solves *their* crowd problem | Every IITD student signs up |
| 4 | QR check-in at gates via our scanner | Volunteers use phones | Attendance data |
| 5 | Outsider pass sales + sponsor slots, with revenue share | Commercial deal | GMV |

**Why rung 3 is the killer ask.** It costs RDV nothing. It answers a stated student demand [S: "first priority should be given to IIT Delhi students"]. It also addresses a known RDV pain: crowd and outsider control [W: past pronite cancelled after crowd issues]. It also forces IITD-email sign-up at scale in one week.

### RDV's own pains = our pitch
| RDV pain (evidence) | Our answer |
|---|---|
| Pass website down during the fest [R1] | Static, CDN-hosted pages built for the traffic spike |
| Registered but couldn't download pass [R4] | Pass wallet + "resend pass" self-service |
| 10+ repeated "how do I enter?" posts [R7, R9, R6] | Per-event eligibility labels + one FAQ |
| Aadhaar / data trust questions [R8] | Plain "why we ask this" next to each field |
| Separate websites/logins for pronite vs main fest [R11] | One login, one wallet |

### Pitch sequencing
1. **Now – Jan:** Run rung 0 for the remaining fests and events. Collect numbers.
2. **BECon / Tryst (Jan – Mar 2027):** Pilot rungs 2–4 with a smaller fest. BECon already sells tiered passes [W], so it's a natural paying partner.
3. **Mar – May 2027:** Pitch the **new RDV core team**. Student fest teams typically turn over yearly; *verify when RDV'27 heads are appointed*. Bring hard data: "X students, Y registrations, Z check-ins, zero downtime at Tryst."
4. **Route:** RDV core team → BRCA → Dean of Student Affairs. Get the institutional nod early, or a later "no" from admin kills it.

### If RDV says no
Stay on rung 0–1 and become the **best unofficial guide to RDV**: clean schedule, eligibility explainer, deep links to official registration. You still capture the traffic. You just don't capture the transaction. Never sell or resell RDV passes without permission.

---

## 3. Feature set (web platform)

Prioritised by survey demand, not by what's cool. **[S] Q13 votes in brackets.**

### P0 — MVP (build before BECon)
**Students**
- **Event feed**: "Today / This week / Fests" + filters: category, Free/Paid, *Open to outsiders / IITD only*, venue. **[17]**
- **Event page**: time, venue (map pin), price, eligibility label, verified-organiser badge, "registration closes in 3h". Clear details are the RDV question.
- **One-tap registration**: profile pre-fills name, entry number, hostel, phone. No more retyping Google Forms. **[14]**
- **Team registration with invite link**: captain registers, shares link, teammates join. Most competitions are team events. *This is the main viral loop.*
- **Pass wallet**: QR per registration, works offline (screenshot fallback). **[9]**
- **Reminders**: email to @iitd.ac.in + "Add to Google Calendar" (.ics). **[12]**
- **WhatsApp share card**: rich preview (poster, date, price). 17/24 discover via WhatsApp [S]. Make WhatsApp our distribution channel, not our competitor.

**Organisers**
- **Create event in under 2 minutes**: upload a poster and auto-fill the fields from it (AI extraction), then edit.
- **Registration form**: replaces Google Forms; custom questions; caps; waitlist.
- **Attendee export** (CSV) + **QR check-in scanner** in the phone browser. No app install.
- **Payments**: UPI via a payment gateway (Razorpay or similar) for paid events.

### P1 — Fest mode (before Tryst; must-have for RDV)
- **Fest hub**: day × venue schedule grid, pronite lineup, "My schedule".
- **Live updates**: organiser pushes "venue changed / delayed", sent to everyone registered. **[6]**
- **Waitlist auto-release**: no-shows free up seats. 13/24 skipped events after registering [S].
- **Outsider passes**: purchase + ID check at gate.
- **Organiser dashboard**: registrations over time, sources (WhatsApp vs Instagram link), check-in rate.

### P2 — Later
- Friends attending **[3]**, recommendations **[2]**. Low demand; wait for data.
- Verified pass transfer (only where the organiser allows it).
- Fest merch, food-stall pre-orders, sponsor placements, bundles.

### Deliberately *not* building
- **Native app.** A web app you can install from the browser (PWA) is enough. No app-store friction, and one link works everywhere.
- **Chat / comments.** WhatsApp already does this.
- **Own social feed.** Instagram already does this.

---

## 4. Making it user-friendly

1. **Browse without login.** Ask for login only at "Register". Every sign-up wall before value loses users.
2. **Login = IITD email OTP.** No passwords. The verified email is also our moat: "only real IITD students".
3. **Three taps:** open link → event page → registered. Measure it.
4. **Answer the four questions on every card:** *When? Where? How much? Can I go?* (eligibility label).
5. **Mobile-first, works on bad hostel Wi-Fi.** Light pages, no heavy video, fast first load.
6. **Urgency done honestly:** "closes in 3h", "42 seats left", only when true.
7. **Trust signals:** verified-organiser tick (answers the "is this workshop legit?" threads [R12–14]); refund policy shown *before* payment.
8. **Notifications that don't spam:** only for events you registered for or followed, plus one weekly "This week @ IITD" email.
9. **Accessibility basics:** readable contrast, tap targets ≥ 44px, alt text on posters.

---

## 5. Network effects

| Type | How it works here | Strength |
|---|---|---|
| **Cross-side (students ↔ organisers)** | More students → organisers list here to reach them → more events → more students | **Strong**. The core flywheel |
| **Same-side, teams** | Team registration means every captain recruits 2–5 teammates | **Strong**. Built into how competitions work |
| **Same-side, social** | Seeing friends attend | Weak per survey [3/24]; park it |
| **Data** | More registrations → better organiser insights, better "trending" ranking | Medium; grows over time |
| **Third side (brands/sponsors)** | More verified students → sponsors pay → subsidise free features | Medium; monetisation, not growth |
| **Outsiders → other campuses** | DU and other students use us for RDV/Tryst and take us back to their campus | Expansion path later |

**Campus is the perfect network size.** About 12k students, all within 2 km, all with an @iitd.ac.in email. You can reach *liquidity* (most events listed, most students active) far faster than a city-wide app could.

### Growth loops (each one feeds itself)
1. **Organiser loop.** Organiser publishes on IITD Live → posts *our* link on their Instagram/WhatsApp because that's where registration happens → students arrive → they find other events. **Each organiser onboarded is a free marketing channel.**
2. **Team loop.** Captain registers → invites teammates → teammates sign up → they register for other events.
3. **Share loop.** Rich WhatsApp cards → friend taps → lands on event page (no login needed) → registers.
4. **Wallet loop.** Pass is in our wallet → user returns on event day → sees "Tonight @ IITD" → registers for the next thing.

### Flywheel
```
   more events listed ──► more students browse ──► more registrations
          ▲                                               │
          │                                               ▼
 organisers want reach ◄── organisers see data & ◄── richer attendance
     + free tools            audience here               data
```

---

## 6. Solving adoption (cold start)

The classic chicken-and-egg: students won't come without events, organisers won't come without students.

**Rule: make each side get value even when the other side is empty.**

### Supply side (organisers): come for the tool
- Pitch to clubs: "**A better Google Form, free**: registrations + QR check-in + attendee list + payments."
- An organiser gets value even with zero platform audience, because they still bring their own audience.
- Target first: the **10 most active clubs** + BRCA inter-hostel + **DMS clubs and conclaves**. You're MBA students, so DMS is your home turf.

### Demand side (students): come for the calendar
- **The team lists every event manually** for the first 6–8 weeks: Instagram, Linktree, WhatsApp forwards, posters. (Concierge MVP; "do things that don't scale".)
- That means the calendar is complete on day 1, even if no organiser has joined yet.
- Weekly "This week @ IITD" email to all @iitd.ac.in addresses (needs permission) or via hostel WhatsApp groups.

### The first "atomic network"
Start small and dense. Pick **DMS + 2–3 hostels** and make IITD Live the *only* place their events are listed. Get them to the point where it's useful, then expand hostel by hostel.

### Distribution levers
- **Hostel ambassadors** (one per hostel, 13+ hostels): free fest passes, certificate, leaderboard.
- **Posters with QR codes** at SAC, LHC, mess boards.
- **Exclusive hooks**: IITD-first pronite window (RDV rung 3), early-bird workshop seats only via the app.
- **Institutional endorsement**: listing on the official Student Affairs calendar. A moonshot: become the tool clubs use to *submit event approvals*.

---

## 7. Metrics to track

| Metric | Why | Target (pilot) |
|---|---|---|
| **Weekly registrations per active student** | North-star: are we part of campus life? | ≥ 0.5 |
| **Event coverage** | % of campus events listed (liquidity) | ≥ 80% |
| **On-platform registration share** | % of listed events where registration happens on our platform, not via an external link | ≥ 40% |
| **Repeat organisers** | Organisers who publish a second event | ≥ 60% |
| **Team invite conversion** | Viral loop health | ≥ 50% of invitees sign up |
| **Fest-week uptime** | The RDV pitch rests on this | 100% |
| **Check-in rate** | Fewer no-shows = organiser value | ≥ 70% |

---

## 8. Open questions for the team

1. Who exactly decides on RDV'27 tech partners, and when is that team formed?
2. Will Student Affairs allow a student-run platform to email all @iitd.ac.in addresses?
3. Does IITD allow third-party payment collection for society events, or must money go through official accounts?
4. Class scope: is the deliverable a working pilot (one event), or a prototype + pitch with RDV feedback?
