# BookMyShow: what to borrow, what to beat

Desk research, Oct 2026. Financial figures come from filings-based press reports, as cited. UI patterns marked *(observed)* describe the BookMyShow app as commonly used. Recheck them against fresh screenshots before the pitch.

---

## 1. The business in numbers

| Metric | Figure | Source |
|---|---|---|
| FY25 revenue from operations | **₹1,831 cr** (+31% YoY) | [exchange4media][e4m] |
| FY25 net profit | ~₹192 cr | [exchange4media][e4m] |
| Live-events revenue FY25 | **₹756 cr, up 66%** from ₹455 cr | [lapaasvoice][lv] |
| Online ticketing revenue FY25 | ₹828 cr (+12%) | [lapaasvoice][lv] |
| Driver of the live-events jump | Exclusive India ticketing for Coldplay's tour | [lapaasvoice][lv] |
| Share of India's online movie ticketing | ~60% | [The Ken][ken] |
| Cinema revenue share paid out (FY24) | ₹323 cr, ~44% of online ticket revenue | [Entrackr][entrackr] |
| Core revenue model since launch | Convenience fee per ticket | [afaqs][afaqs] |

**The challenger.** Zomato's **District** (built on the Paytm Insider acquisition, Aug 2024):
- FY26 revenue of **₹970 cr+**.
- Weekly active users **over 60% of BookMyShow's**.
- It charges the **same booking fees**.
- It competes on bundling going-out with dining. [The Ken][ken] · [OfficeChai][oc]

**What this means for IITD Live:**
- **Live events are the growth engine of Indian ticketing,** not movies. The category we're entering is the fastest-growing part of BookMyShow's business.
- **The convenience fee is the proven monetisation model.** Students already accept it from BookMyShow, which validates a small fee on paid passes.
- **District shows bundling beats price.** For us that means event + food stall + merch in one checkout, not a cheaper ticket.

---

## 2. UX anatomy (observed), and our version

| BookMyShow pattern | Why it works | IITD Live implementation |
|---|---|---|
| **Full-bleed banner carousel** on home | Sells the experience before the details; the photo does the persuading | **Spotlight carousel**: featured events and fests as full-bleed photos with a glow taken from each photo's own colours, with date, venue, price and a Register button on the slide |
| **Category navigation** (Comedy, Music, Workshops, Kids…) | One tap from "I'm bored" to a shortlist | **Category rail**: photo tiles for Music, Comedy, Dance, Theatre, Workshops, Tech, Talks, Sports, Business, Fests |
| **Horizontal poster rails** ("Recommended", "Best of live events") | Lots of choice in little vertical space; posters are recognisable at a glance | Rails: **Tonight @ IITD**, **Trending on campus** (by going count), **Free this week**, **Level up** (workshops), **Fests** |
| **Portrait poster cards** (2:3) with title, venue, price | The image is the hook; the text confirms | Poster cards with photo, date chip, price chip, eligibility, going count |
| **"Interested" / like counts** | Shows that other people want to go | Real **going** counts + hostel breakdown ("38 from Aravali"). Stronger, because they're your own campus peers |
| **"Fast filling" / "Filling fast"** labels | Urgency drives conversion | "N seats left" only at ≤20% capacity; "Closes in" only under 24h. Never fake |
| **Event page**: hero image, chips, About, venue, terms, sticky Book button | Answers questions in order, CTA always in reach | Full-bleed hero with glow; sticky action bar; a **"You should know"** block for eligibility, ID and entry rules (the #1 Rendezvous question) |
| **M-ticket with QR** in "Your Orders" | No paper; one place for passes | **Wallet**: one tap from anywhere, works offline, short typeable code |
| **Offers / bank discounts** strip | Price anchoring, partner revenue | Roadmap: sponsor offers (e.g. "Free coffee with your Tryst pass") as the brand-revenue line |
| **BookASmile** (donation at checkout) | Brand warmth | Roadmap: optional ₹10 to the NSS teaching drive at checkout |

## 3. Where BookMyShow is weak, and where we win

| Weakness | Evidence | IITD Live answer |
|---|---|---|
| Home page is static and doesn't react to context | Teardown: "homepage is static and doesn't respond to context or occasions" [notion] | Home changes with the clock: **Tonight** by default, a LIVE ticker when something is happening, fest takeovers during fest weeks |
| Sponsored cards look like regular content | [Prototypr case study][proto] | Featured events get a clear marigold **Featured** chip, and only verified clubs can be featured |
| Booking used to take 14 steps (redesign cut it to 7) | [Inc42][inc42] | **3 taps:** link → Register → pass. No seat map, no quantity step for free events |
| Seat map legend is small and low-contrast | [notion] | No seat maps; capacity and waitlist instead |
| City-wide catalogue: your campus is invisible | Campus events aren't on BookMyShow | Campus-only, verified IITD identity, hostel-level social proof |
| Screenshots of QR tickets get shared | Industry answer: rotating QR that refreshes every few seconds [Vibez][vibez] | Roadmap: **rotating QR** for pronite passes. Directly targets the Rendezvous gate-crash problem |

## 4. Visual language takeaways (applied in the redesign)

1. **Photos sell; type confirms.** Every listing leads with an image. The card's emoji placeholder is gone.
2. **Dark stage, coloured light.** Hero areas sit on a dark scrim in both themes, like a stage. The colour comes from the photo's own glow, plus IITD Live's saffron (live) and marigold (featured / pass).
3. **Rails before grids.** Browsing is horizontal and scannable; the full filterable grid sits below for intent-driven search.
4. **One loud thing per screen.** The spotlight on home; the hero on the event page; the pass in the wallet.

---

[e4m]: https://www.exchange4media.com/marketing-news/fy25-bookmyshow-boosts-ad-spend-by-21-151065.html
[lv]: https://lapaasvoice.com/bookmyshow-fy25-profit-results-live-events-growth-2026/
[ken]: https://the-ken.com/story/district-isnt-even-2-of-eternals-business-but-its-enough-to-rattle-bookmyshow/
[entrackr]: https://entrackr.com/fintrackr/bookmyshow-profit-nears-rs-110-cr-in-fy24-event-biz-bleeds-8326504
[afaqs]: https://www.afaqs.com/news/digital/18655_bigtree-entertainment-launches-one-stop-movie-tickets-portal
[oc]: https://officechai.com/startups/zomato-launches-its-going-out-app-district/
[notion]: https://rhinestone-hour-9ee.notion.site/Why-BookMyShow-loses-users-at-the-moment-they-re-most-ready-to-buy-39ad8dcb0c2580f3a9ddf1f6d0a29bad
[proto]: https://blog.prototypr.io/bookmyshow-ux-case-study-3dbb5c8a1ea2
[inc42]: https://inc42.com/flash-feed/bookmyshow-rolls-new-app
[vibez]: https://www.vibez.io/attendees/help/your-tickets/getting-in-at-the-door
