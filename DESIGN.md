---
name: IITD Live
description: Every IIT Delhi event in one feed, with a pass that never fails at the gate.
colors:
  heritage-maroon: "#8A1538"
  maroon-ink: "#2A0710"
  marigold: "#FFB21E"
  saffron-flame: "#F04A0E"
  lhc-concrete: "#F4F1F0"
  card-white: "#FFFFFF"
  chip-ground: "#EDE7E6"
  ink: "#1C0B11"
  ink-muted: "#5F4B52"
  hairline: "#DDD2D3"
  success-green: "#106B3C"
  warning-ochre: "#8A4F00"
  danger-red: "#B3261E"
  night-sky: "#140A0D"
  night-surface: "#1F1116"
  night-surface-2: "#2C1820"
  night-ink: "#F8EDEF"
  night-ink-muted: "#BDA0A9"
  night-hairline: "#432A31"
  stage-rose: "#FF7A98"
  night-marigold: "#FFC23D"
  night-saffron: "#FF7A2E"
  night-success: "#4CD68E"
  night-warning: "#FFC861"
  night-danger: "#FF6F61"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 6vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Bricolage Grotesque, Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  code:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "40px"
components:
  button-primary:
    backgroundColor: "{colors.heritage-maroon}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 20px"
  chip-iitd-only:
    backgroundColor: "{colors.chip-ground}"
    textColor: "{colors.heritage-maroon}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  chip-iitd-first:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.maroon-ink}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 10px"
  live-banner:
    backgroundColor: "{colors.saffron-flame}"
    textColor: "{colors.maroon-ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  event-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  date-stub:
    backgroundColor: "{colors.heritage-maroon}"
    textColor: "{colors.card-white}"
    width: "64px"
  pass-stub:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.maroon-ink}"
    rounded: "{rounded.lg}"
---

# Design System: IITD Live

<!-- Tokens live in site/css/tokens.css (contract names). The frontmatter above mirrors them with descriptive names; light values first, `night-*` and `stage-*` are the dark-mode values. If the two disagree, tokens.css wins. The .impeccable/design.json sidecar was not written because it is outside the design agent's file ownership. -->

## Overview

**Creative North Star: "The Pronite Pass"**

IITD Live should feel like a well-made entry pass to the best night on campus. It carries an **official seal** (IIT Delhi's heritage maroon, the colour of trust and belonging), a **celebration** (marigold, the colour of every Indian festival garland and of the stage lights at the OAT) and a **pulse** (saffron flame, used only when something is happening right now). By day the app sits on the pale grey of the LHC's exposed concrete: calm, fast and legible between lectures. By night it turns into the fest. The ground becomes maroon-black sky, the maroon lights up to stage rose, and marigold and saffron glow against it.

This is an **Operate** product with a **persuasive feed**. People come to get something done: find what's on, check they can go, register, show the pass. The visual world contributes only four things: type, palette, density, and two signature moves (the **ticket stub** on every event and the **live pulse**). Navigation, controls and layout are standard mobile-web patterns that anyone who has used Swiggy, District or Instagram already knows.

Rejected looks: the purple-gradient SaaS template, grey corporate dashboards, glassmorphism, and neon-on-black "cyber" fest posters. The brand is maroon and marigold, not "one neon on black".

**Key Characteristics:**
- Maroon is identity and authority. Marigold is celebration and privilege. Saffron is *now*. Nothing else is decorative colour.
- Every event is drawn as a ticket. A perforated date stub carries the *when*, so the card body is free for *what, where, ₹ and who*.
- Dense but breathable lists: one column on phones, readable at arm's length in sunlight.
- Light by day, fest-night dark by system preference. Both are first-class.
- Built for slow Wi-Fi: three font files, no images required (posters are emoji on colour), and motion that costs nothing.

## Colors

A heritage maroon brand lit by two festival warms, marigold and saffron, set on concrete by day and on maroon-black by night.

### Primary
- **Heritage Maroon** (`--primary`, light #8A1538): IIT Delhi's institutional maroon, nudged slightly toward crimson so it reads as alive rather than archival. Used for primary buttons, the light-mode masthead, the date stub, the verified seal, links, the active filter chip and focus rings. It means *official and trusted*.
- **Stage Rose** (`--primary`, dark #FF7A98): maroon under stage lights. At night a deep maroon would vanish into the ground, so the brand hue gets brighter and carries dark text (`--primary-contrast` #2A0710).

### Secondary
- **Marigold** (`--accent`, #FFB21E light / #FFC23D dark): the garland colour. Used for the **pass stub** in the wallet, the *Featured* chip, the *IITD-first* chip, the wallet count badge and the active-tab bar on the masthead. It means *celebration and privilege*. It is always a fill with `--accent-contrast` (#2A0710) text, never text on a light ground.

### Tertiary
- **Saffron Flame** (`--live`, #F04A0E light / #FF7A2E dark): reserved for **happening now**. The pulse dot, the live banner, the live date stub, and the dot on the *Tonight* tab when something is live. It is hotter and redder than marigold so it is never mistaken for a highlight. Text on it is always `--accent-contrast`.

### Neutral
- **LHC Concrete** (`--bg` #F4F1F0) / **Night Sky** (#140A0D): the page ground. Concrete is a faintly warm grey, deliberately not cream. Night Sky is black tinted with maroon.
- **Card White** (`--surface` #FFFFFF) / **Night Surface** (#1F1116): cards, sheets, the bottom nav and the pass body.
- **Chip Ground** (`--surface-2` #EDE7E6) / (#2C1820): neutral chips, skeletons and secondary panels.
- **Ink** (`--text` #1C0B11) / **Night Ink** (#F8EDEF): all primary text. A maroon-black, never pure #000.
- **Ink Muted** (`--text-muted` #5F4B52) / (#BDA0A9): meta lines (club, venue, time), helper text and **input borders** (it passes 3:1 for non-text UI).
- **Hairline** (`--border` #DDD2D3) / (#432A31): dividers and card hairlines only. It is decorative and never the only boundary of an interactive control.

### State
- **Success** (`--success` #106B3C / #4CD68E): *Registered*, *Checked in*, the *Free* price chip, the valid scan.
- **Warning** (`--warning` #8A4F00 / #FFC861): honest urgency in text: *Closes in 3h*, *12 seats left*, *Waitlisted #3*.
- **Danger** (`--danger` #B3261E / #FF6F61): errors, *Invalid pass*, *Cancel registration*.

### Named Rules
**The Three Warms Rule.** Maroon means *official*, marigold means *celebrate*, saffron means *now*. If an element isn't one of those three things it stays neutral. Never use them for decoration.

**The Fill-Only Rule.** `--accent` and `--live` are fills. Text and icons on them are always `--accent-contrast` (it works in both modes). Never set text in `--accent` or `--live`, and never put white text on them: white on live is 3.69:1, which fails.

**The Saffron Is Sacred Rule.** `--live` appears only on something happening now or a live update less than a few hours old. One live banner per screen. If everything pulses, nothing is live.

**The Tint Recipe.** Status chips use the status colour as text over a tint: `background: color-mix(in srgb, var(--success) 14%, var(--surface))`. Never go above 14%, and only mix into `--surface` or `--bg`. Every tint has been checked (see the table).

### Contrast (WCAG 2.2, computed from `tokens.css`)

All text pairs meet AA (4.5:1). Non-text UI must meet 3:1.

| Pair | Light | Dark | Need |
|---|---|---|---|
| `--text` on `--bg` | 16.91 | 17.01 | 4.5 |
| `--text` on `--surface` | 19.00 | 15.96 | 4.5 |
| `--text` on `--surface-2` | 15.54 | 14.58 | 4.5 |
| `--text-muted` on `--bg` | 7.15 | 8.12 | 4.5 |
| `--text-muted` on `--surface` | 8.03 | 7.62 | 4.5 |
| `--text-muted` on `--surface-2` | 6.57 | 6.96 | 4.5 |
| `--primary` on `--bg` | 8.32 | 7.87 | 4.5 |
| `--primary` on `--surface` | 9.35 | 7.38 | 4.5 |
| `--primary-contrast` on `--primary` | 9.35 | 7.47 | 4.5 |
| `--accent-contrast` on `--accent` | 10.24 | 11.47 | 4.5 |
| `--accent-contrast` on `--live` | 5.01 | 7.11 | 4.5 |
| `--success` on `--surface` | 6.58 | 9.84 | 4.5 |
| `--success` on `--bg` | 5.86 | 10.49 | 4.5 |
| `--warning` on `--surface` | 6.56 | 11.90 | 4.5 |
| `--warning` on `--bg` | 5.84 | 12.68 | 4.5 |
| `--danger` on `--surface` | 6.54 | 6.69 | 4.5 |
| `--danger` on `--bg` | 5.82 | 7.13 | 4.5 |
| `--primary` on its 14% tint over `--surface` | 7.23 | 5.89 | 4.5 |
| `--success` on its 14% tint over `--surface` | 5.33 | 7.63 | 4.5 |
| `--warning` on its 14% tint over `--surface` | 5.32 | 8.71 | 4.5 |
| `--danger` on its 14% tint over `--surface` | 5.19 | 5.45 | 4.5 |
| `--live` dot vs `--bg` (non-text) | 3.28 | 7.48 | 3.0 |
| `--live` dot vs `--surface` (non-text) | 3.69 | 7.02 | 3.0 |
| `--primary` (seal, focus ring) vs `--bg` (non-text) | 8.32 | 7.87 | 3.0 |
| `--text-muted` input border vs `--surface` (non-text) | 8.03 | 7.62 | 3.0 |
| `--accent` vs `--primary` (marigold tab bar on maroon masthead) | 5.18 | — | 3.0 |
| `--accent` vs `--surface` (non-text) | **1.80** | 11.34 | 3.0 |
| `--live` vs `--primary` (non-text) | **2.53** | **1.05** | 3.0 |

What the bold failures mean in practice:
- In light mode a marigold fill on white is not a boundary on its own. Accent chips always hold `--accent-contrast` text, so the text carries the meaning.
- Never put a saffron dot on a maroon or rose fill. A live event's stub switches its whole fill to `--live` instead.
- In dark mode, never place `--accent` on `--primary` (1.54).
- The QR code is always drawn dark-on-white (#1C0B11 on #FFFFFF, 19:1) in both modes.

## Typography

**Display Font:** Bricolage Grotesque, weights 700–800 (fallback: Atkinson Hyperlegible Next, then system-ui)
**Body Font:** Atkinson Hyperlegible Next, weights 400 and 700 (fallback: system-ui, -apple-system, Segoe UI, Roboto)
**Code Font:** Atkinson Hyperlegible Mono, weight 500 (fallback: ui-monospace)

**Character:** Bricolage Grotesque has the ink-trapped, slightly cheeky letterforms of a well-designed student fest poster. It has energy without being a novelty face, and it stays crisp at 18px card titles. Atkinson Hyperlegible Next was designed by the Braille Institute so that easily confused letters (I/l/1, 0/O, rn/m) stay distinct. That matters on a sunlit phone, and in the gate queue where a volunteer types a pass code by hand. Its mono sibling sets pass codes and entry numbers. All three include ₹ in Google's latin-ext subset, which loads only on pages that show a price. Together they total about 85 KB and use `display=swap`. *(v1 only. Since theme v3 nothing loads fonts from Google: `tokens.css` has no `@import`, and each theme self-hosts its faces. See Theme v3 below.)*

### Hierarchy
- **Display** (Bricolage 800, `clamp(1.75rem, 6vw, 2.5rem)`, line-height 1.05, tracking -0.02em): the event page title, fest hub name and wallet header. Use one per screen.
- **Headline** (Bricolage 800, 1.5rem / 24px, 1.15): section titles such as "Tonight @ IITD", "Your passes" and dashboard sections.
- **Title** (Bricolage 700, 1.125rem / 18px, 1.25): event-card titles, clamped to 2 lines, and sheet titles.
- **Body** (Atkinson 400, 1rem / 16px, 1.5): descriptions and form text. Max 68ch.
- **Meta** (Atkinson 400, 0.875rem / 14px, 1.4, `--text-muted`): club · venue · time lines.
- **Label** (Atkinson 700, 0.8125rem / 13px, tracking 0.01em): chips, tabs, bottom-nav labels and buttons (buttons use 1rem). Sentence case. The only all-caps text is the date stub's day name ("SAT") and the word "LIVE".
- **Code** (Atkinson Mono 500, 1.125rem, tracking 0.08em): pass codes in groups of four ("7KQ4-M2XP"), team invite codes and entry numbers.

### Named Rules
**The Tabular Rule.** Every number a student compares (times, ₹ prices, seat counts, going counts, dashboard stats) uses `font-variant-numeric: tabular-nums`.

**The No-Eyebrow Rule.** No small caps labels above headings. A heading carries its own weight.

**The 16px Floor Rule.** Inputs are at least 16px, so iOS doesn't zoom in. Body text is never smaller than 14px. Labels are never smaller than 12px.

## Layout

- **Mobile-first, one column.** Design at 360px; test at 360, 390 and 430. Page side gutter is `--space-4` (16px). Never any horizontal page scroll. Only the fest grid and tab rows scroll sideways, inside their own containers.
- **Spacing rhythm** (4-based): `--space-1` 4px (icon to label) · `--space-2` 8px (inside chips, between chips) · `--space-3` 12px (card padding, gap between cards) · `--space-4` 16px (gutters, section padding) · `--space-5` 24px (between sections) · `--space-6` 40px (above major section headings and page bottoms). Leave more space above a heading than below it.
- **Wider screens:** at ≥ 720px the content column caps at 680px and is centred. At ≥ 1000px the feed becomes a 2-column card grid (max 1040px), the event page puts details and the action panel side by side, and the bottom nav becomes a top bar.
- **Fixed chrome:** masthead 56px (it scrolls away and the tabs stick). Bottom nav 64px plus `env(safe-area-inset-bottom)`. The event-page action bar is sticky above the bottom nav. Pad the page bottom so content never hides under fixed bars.
- **Density:** about 4 event cards visible on a 390×844 screen after the masthead and tabs.

## Elevation & Depth

Mostly flat, with tonal layers: concrete ground, then white cards, then the white pass. Shadows say *this is a physical object you can pick up* (cards, the pass, sheets) and never decorate.

### Shadow Vocabulary
- **Resting** (`--shadow-sm`; light `0 1px 2px rgb(42 7 16 / .08), 0 1px 3px rgb(42 7 16 / .06)`): event cards, filter chips, inputs on concrete.
- **Lifted** (`--shadow`; light `0 12px 28px -12px rgb(42 7 16 / .28), 0 2px 6px rgb(42 7 16 / .08)`): the wallet pass, bottom sheets, the sticky action bar, a pressed card's hover state on desktop. Dark mode uses black at higher opacity. On the dark ground, depth comes mostly from the lighter `--surface` layer.

### Named Rules
**The Maroon Shadow Rule.** Shadows are tinted maroon-ink, never neutral grey, and always have a y-offset and blur. No zero-offset glows. No hard offset block shadows.

## Shapes

- **Radius scale:** `--radius-sm` 8px (chips, inputs, the poster tile, small tags) · `--radius` 14px (buttons, event cards, banners) · `--radius-lg` 22px (the pass, bottom sheets, the fest hero; also pill-shaped filter chips at 36px height).
- **The ticket notch** is the system's recurring shape. Wherever a stub meets a body (the event-card date stub, the wallet pass), cut two half-circles (r = 6px on cards, 10px on the pass) out of the edges at the seam, plus a dotted perforation line. Build it with a CSS `mask` of two `radial-gradient` circles, or with two `--bg`-coloured circles overlapping the seam. No SVG illustration is needed.
- **Icons:** inline SVG on a 24px grid with 2px strokes, round caps and joins, `currentColor`. Emoji appear only as **content**: the organiser-chosen `poster_emoji`. They never replace a UI icon.
- **The Verified Seal** is a 12-point scalloped rosette, not a plain circle tick. See Components.

## Components

### Event Card (the core unit)
*A ticket you can read at a glance. It answers when, where, ₹ and who-can-go without a tap.*
- **Anatomy (left to right):**
  1. **Date stub.** 64px wide, full card height. `--primary` fill and `--primary-contrast` text. Top to bottom: day "SAT" (label 12px/700, caps), date "18" (display 28px/800, tabular), time "7:30 PM" (13px/700). Ticket notches sit at the seam.
  2. **Body.** `--surface`, padding `--space-3`. In order:
     - Title (Title style, 2 lines max).
     - Club line: club name in meta style, plus the **Verified Seal** (16px) when `club.verified`.
     - Venue line: pin icon, venue, and duration if more than 3h.
     - Chip row: price chip, eligibility chip, then optional team chip, IITD-first chip and Featured chip.
     - Urgency line, only when true.
  3. **Poster tile** (optional, top-right of the body). 44px square, `--radius-sm`, `poster_color` fill, `poster_emoji` at 24px, `aria-hidden`. Text never sits on `poster_color`, because its contrast is unknown.
- **Live now.** When `starts_at ≤ now < ends_at` the stub fill switches to `--live`, its text to `--accent-contrast`, and the stub shows the pulse dot, "LIVE" and "till 9 PM".
- **Registered.** A success-tint chip, "Registered", replaces the urgency line.
- **Whole card is one link** to `#/e/:id`. Minimum height 104px. Radius `--radius`, `--shadow-sm`, 1px `--border` hairline in light mode. Hover (desktop): `--shadow`, translateY(-1px). Focus-visible: 3px `--primary` outline, offset 2px.
- **Skeleton:** the same geometry in `--surface-2`. No shimmer on slow connections; a static skeleton is enough.

### Chips
Height 28px, `--radius-sm`, label 13px/700, a 14px icon plus text, padding 0 10px, gap `--space-2`. Card chips are informational, not tappable.
- **Price:** `Free` = `--success` text on a success tint. `₹299` = `--text` on `--surface-2`, tabular. Never print "₹0".
- **Eligibility:** always present on every card and event page.
  - `IITD only` = `--primary` text on a primary tint, with a shield icon.
  - `Open to all` = `--text-muted` on `--surface-2`, with an open-door icon.
  - `IITD first · till 6 PM` = `--accent` fill, `--accent-contrast` text, with a clock icon (a timed head start; the star belongs to Featured alone). Shown while `iitd_first_until` is in the future.
- **Team:** `Team of 2–4` = `--text-muted` on `--surface-2`, with a people icon.
- **Featured:** `Featured` = `--accent` fill, `--accent-contrast` text. At most one per card.
- **Status** (wallet and event page): `Registered` / `Checked in` = success tint; `Waitlisted · #3` = warning tint; `Cancelled` = `--text-muted` on `--surface-2`.
- **Filter chips** (interactive, on the feed): 36px visual height inside a 44px hit area, `--radius-lg` pill, `--surface` with a 1px `--border` and `--shadow-sm`. Selected: `--primary` fill, `--primary-contrast` text, leading check icon, `aria-pressed="true"`.

### Verified Seal
*The answer to "is this workshop legit?"*
- A 12-point scalloped rosette filled with `--primary`, with a check in `--primary-contrast`. 16px on cards, 20px on event and club pages. Accessible name: "Verified club".
- On the event and club page it sits next to the club name, with a line under it: "Verified organiser: confirmed by IITD Live admins."
- **Unverified clubs** get no seal. On the event page they get a neutral `--text-muted` line with an info icon: "Organiser not yet verified." No red, no alarm.
- **Students:** profiles and the pass show an "IITD verified" seal chip for `is_iitd` accounts. Outsiders see "Guest (non-IITD)" in neutral style.

### Live Banner
- Full width inside the content column. `--live` fill, `--accent-contrast` text, `--radius`, padding 12px 16px.
- Leading pulse dot (10px, `--accent-contrast`), then "LIVE UPDATE" (label caps), then the note (15px/700), then the relative time ("4 min ago", 13px).
- Placement: top of the event page (above the title) and on the matching wallet pass.
- Accessibility: `role="status"` and `aria-live="polite"` so screen readers announce changes.
- One per screen. The newest note replaces the old one.

### QR Pass (Wallet)
*The most reliable screen in the app. It must read instantly at the gate.*
- **Anatomy, top to bottom:**
  1. **Stub.** `--accent` (marigold) fill, `--accent-contrast` text. Event title (headline 22px/800), date · time, venue, and the Verified Seal if applicable.
  2. **Perforation.** Ticket notches (r = 10px) and a dotted line.
  3. **Body.** `--surface`. The QR sits in a **white well** (#FFFFFF in both modes) with a 4-module quiet zone, sized `min(72vw, 280px)`. Modules are drawn in #1C0B11.
  4. **Code.** Under the QR, in code style, grouped `XXXX-XXXX`, selectable.
  5. **Holder.** Name (title style), entry no. (code style, 14px), hostel, team name, and a status chip.
  6. **Actions.** Add to calendar, Share team link (captain only), Cancel (danger text button, inline confirm).
- **Helper line** (`--text-muted`): "Turn your brightness up at the gate. This pass works offline."
- **States:**
  - *Waitlisted:* no QR. A warning-tint panel says "You're #3 on the waitlist. We'll move you up automatically."
  - *Checked in:* the QR dims to 25% opacity and a "Checked in · 7:42 PM" success chip shows.
  - *Past:* collapsed into the "Past passes" list.
- Wallet order: upcoming first, then the soonest. Today's passes are expanded and later ones are collapsed cards with stubs.

### Buttons
- **Shape:** `--radius` (14px), height 48px (40px allowed in dense organiser tables), label Atkinson 700 16px, padding 0 20px, icon 20px with an 8px gap.
- **Primary:** `--primary` fill, `--primary-contrast` label. One per screen region.
  - Hover: `color-mix(in srgb, var(--primary) 88%, black)` in light mode, or 88% with white in dark mode.
  - Active: `scale(.98)`.
  - Focus-visible: 3px `--primary` outline with a 2px offset.
- **Secondary:** `--surface` fill, 1.5px `--text-muted` border (3:1), `--text` label.
- **Ghost / link:** `--primary` text, underline with a 3px offset on hover.
- **Danger:** `--surface` fill, 1.5px `--danger` border, `--danger` label. Destructive actions confirm inline ("Cancel registration? Yes, cancel / Keep my pass"), never in a modal.
- **Disabled:** `--surface-2` fill, `--text-muted` label, no shadow. A visible reason sits next to it ("Registration closed 2h ago").
- **Loading:** the label stays, a spinner replaces the icon, `aria-busy="true"`, and the button keeps its width.
- **Register button states (event page action bar):**
  - Register / Register team: primary.
  - Join waitlist: secondary, with warning text "4 ahead of you".
  - Registered · View pass: success tint, links to `#/wallet`.
  - Register on organiser site ↗: secondary, with an external icon.
  - IITD students only: disabled, plus "Log in with your @iitd.ac.in email" link.
  - Closed: disabled, with the reason.

### Tabs (feed)
- Tonight / This week / Upcoming / Fests. A horizontally scrollable `role="tablist"` row, 44px tall, label 15px/700.
- **On the light-mode masthead (maroon):** inactive labels are `--primary-contrast` at 78% opacity. The active label is full opacity with a 3px `--accent` bar under it (5.18:1 against maroon).
- **Dark mode (masthead on `--surface`):** inactive labels are `--text-muted`. The active label is `--text` with a 3px `--accent` bar.
- The Tonight tab shows a 6px `--live` dot when any event is live.

### Masthead
- Light mode: `--primary` fill, `--primary-contrast` text. Dark mode: `--surface` fill, `--text`.
- Contents: logo mark (28px) and "IITD Live" wordmark (Bricolage 800, 20px), then a search button, then a login/avatar button. The tabs sit below.
- It's the one place maroon owns a whole region. Elsewhere the ground stays concrete or night.

### Inputs / Fields
- 48px tall, 16px text, `--surface` fill, 1.5px `--text-muted` border, `--radius-sm`. The label always sits above the field; never use a placeholder as the label.
- **Focus:** the border turns `--primary`, plus a `0 0 0 3px color-mix(in srgb, var(--primary) 30%, transparent)` ring.
- **Error:** `--danger` border. The message sits below in `--danger` with an icon, naming the problem and the fix ("Use your @iitd.ac.in email to register for IITD-only events").
- **"Why we ask" helper** under entry no. and phone, in `--text-muted` ("Organisers use this to check you in. We never show it publicly.").

### Bottom Navigation
- Fixed, `--surface` fill, 1px `--border` top, 64px plus the safe area.
- Items:
  - **Explore** (`#/`).
  - **Wallet** (`#/wallet`), with an `--accent` badge counting upcoming passes.
  - **Organise** (`#/org`), organisers only, or **Admin** (`#/admin`) for admins.
  - **Me** (`#/login` or the profile).
- Each item: 24px icon plus 12px/700 label, 44px or larger hit area.
- **Active:** `--primary` icon and label, with a 56×32 pill behind the icon in a 14% primary tint. `aria-current="page"`.
- At ≥ 1000px it moves into the masthead as a top bar.

### Fest Hub Grid (`#/f/:slug`)
- A day selector (tabs styled like the feed tabs), then a grid of time rows × venue columns.
- The venue header row and the time column are sticky. The grid scrolls sideways inside its own container.
- **Event blocks:** `--surface`, `--radius-sm`, `--shadow-sm`. Each holds a poster tile (20px), the title (14px/700, 2 lines) and the eligibility icon.
- Live blocks use the live stub treatment as a 6px saffron top band. Text stays on `--surface`.
- If the fest has `dates_tbc`, show a neutral banner: "Dates to be confirmed."

### Organiser Dashboard & Scanner
- **Stats:** one compact strip showing Confirmed · Waitlisted · Checked in, in tabular numbers, with a check-in progress bar (`--success` on `--surface-2`). Not a row of hero-metric tiles.
- **Hostel breakdown:** horizontal bars in `--primary` with tabular counts.
- **Attendee table:** sticky header and a CSV button.
- **Scanner:** full-bleed camera, with a manual code field in code style below it.
  - The result appears as a bottom sheet on `--surface`.
  - *Valid:* a 64px `--success` disc with a check in `--surface`, the holder's name in display style, the team name, and "Checked in 7:42 PM". Vibrate 60ms.
  - *Invalid / already used / wrong event:* a `--danger` disc with a cross, a headline naming the reason ("Already checked in at 7:31 PM"), and "Scan next" as the primary button. Vibrate [80, 60, 80].
  - The result never relies on colour alone; it always has an icon and a sentence.

### Motion
Motion is cheap and purposeful. These values are written as literals in `app.css`, since there are no motion tokens in the contract.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (exponential ease-out) for everything that enters. Plain `ease` for colour changes.
- **Durations:** 120ms press feedback · 200ms state changes (chip select, tab bar slide) · 320ms sheets and the pass reveal.
- **Live pulse:** a ring around the dot scales from 1 to 2.4 and fades from 0.6 to 0 opacity, over 1.6s, ease-out, repeating. It's the only infinite animation in the app.
- **The one authored moment, "Stamped":** on a successful registration the Register button's label becomes a check ("You're in"). The pass then rises from the action bar as a bottom sheet (320ms, translateY 24px → 0, opacity 0 → 1), and its marigold stub settles with one stamp (scale 1.06 → 1, 200ms). Nothing else in the app celebrates.
- **No** scroll-triggered entrance animations, parallax or animated gradients. Content is visible by default.
- `@media (prefers-reduced-motion: reduce)`: the pulse becomes a static dot, sheets appear without movement, and the transition length is 0.01ms.

## Do's and Don'ts

### Do:
- **Do** use only `var(--token)` colours from `site/css/tokens.css` in `app.css`. Tints come from `color-mix()` over `--surface` or `--bg` at no more than 14%.
- **Do** show all four answers on every event card: date stub (when), venue line (where), price chip (₹), eligibility chip (who).
- **Do** put the Verified Seal next to every verified club name, everywhere it appears.
- **Do** keep the QR in a white well with a quiet zone in both modes, and set pass codes in `--font-mono`.
- **Do** use `tabular-nums` for times, prices and counts.
- **Do** theme browser surfaces: `::selection` (primary tint background, `--text`), `caret-color: var(--primary)`, `accent-color: var(--primary)`, `:focus-visible` outline 3px `--primary` with a 2px offset, and `text-underline-offset: 3px`.
- **Do** set `<meta name="theme-color">` to #8A1538 for light and #140A0D for dark (with `media` attributes).

### Don't:
- **Don't** set text in `--accent` or `--live`, or put white text on them.
- **Don't** use saffron (`--live`) for anything that isn't happening now: no promos, no "hot" badges, no decoration.
- **Don't** use purple gradients, gradient text, glassmorphism, neon glows, or zero-offset coloured halos.
- **Don't** use a coloured `border-left` or `border-right` thicker than 1px on cards or alerts. Featured status is a marigold chip, not a stripe.
- **Don't** use emoji as UI icons. Emoji are only the organiser's poster art.
- **Don't** put text on `poster_color`. Organisers pick it, so its contrast can't be guaranteed.
- **Don't** use fake urgency. Show "Closes in 3h" only when it's under 24h and true. Show "N seats left" only when it's 20% of capacity or less.
- **Don't** add eyebrow labels above headings, or use modals for confirmations that can happen inline.

### Accessibility floor
- WCAG 2.2 AA for every pair in the table above. Both themes are tested.
- Tap targets are at least 44×44px, with at least 8px between adjacent targets. Small inline links (the Map link, the event organiser, a club in the organiser's list) get a 44px-tall box whose negative block margin gives the height back, so the text layout does not move.
- Keyboard focus is never hidden (2.4.11). Below 1000px `scroll-padding-bottom` keeps a tabbed-to control above the tab bar, the sticky event CTA (12.5rem covers the tallest measured, 190px) and the organiser form's sticky actions; it drops to 0 while focus is inside one of those bars, so tabbing onto the CTA never jumps the page.
- Status always has text and an icon: eligibility, waitlist, scan results and errors are never colour-only.
- Every route has one `<h1>`. Tabs use `role="tablist"` and `aria-selected`. Live banners use `role="status"`. The scanner result is announced with `aria-live="assertive"`.
- Posters are `aria-hidden`, because the emoji is decorative and the title carries the meaning. The logo has the alt text "IITD Live".
- `prefers-reduced-motion` is respected everywhere. Zooming to 200% doesn't break the one-column layout.
- Language is set with `lang="en-IN"`. Times use the 12-hour format with AM/PM, as students read them ("7:30 PM", "Sat 18 Oct").


## Addendum (Oct 2026): photos, glow and the discovery layer

Added after the BookMyShow analysis (`research/BOOKMYSHOW_ANALYSIS.md`), to make listings sell the experience.

- **Photos lead every listing.** Openly licensed covers live in `site/assets/img/` (credits at `#/credits`, `assets/img/credits.json`). Each photo sits on the organiser's poster colour, so a missing photo still reads as a poster. The emoji tile is retired from listings.
- **Stage tokens:** `--stage`, `--on-stage`, `--on-stage-muted`, `--scrim`. Hero images (spotlight, event hero, fest header, fest tiles) put text on a dark scrim in both themes, like a lit stage.
- **Glow tokens:** `--glow-live`, `--glow-accent`, `--glow-primary`. Each is an offset, blurred light spill tinted by what is lit. Use them only on live items, featured / marigold CTAs and hover on photo cards. The spotlight and event hero also spill a blurred copy of their own photo beneath the card, so each slide lights the page in its own colours.
- **Discovery layer (home):** spotlight carousel (live → featured → most going; auto-advances, pauses on touch/hover/focus, off under reduced motion) → happening-now strip → "Pick your vibe" category tiles → poster rails (Tonight, Trending, Fest season, Free this week, Level up, Compete) → "Browse every event".
- **Motion:** the spotlight auto-advance and photo hover zoom are the only additions; both respect `prefers-reduced-motion`.


## Theme v3 (stage): "Stage Black", the shipped theme (Oct 2026)

Chosen in a four-way bake-off (Stage, Daylight, Neon, Heritage) after the v1 look was judged "off": a maroon-tinted black ground, too many competing warm hues, and photo glows clipped into hard slabs by scroll containers. Stage keeps the system's structure (tickets, stubs, the live pulse, the pass) and changes the colour, type and glow rules. A polish pass (Oct 2026) made crimson the single action colour, replaced the photo-derived spotlight glow, and self-hosted every font.

**How it loads.** `site/index.html` loads `css/tokens.css` → `css/app.css` → `css/themes/stage.css` (`<link id="theme-css">`). `tokens.css` holds the v1 base tokens and **no longer imports Google Fonts**: there are no third-party font requests. `stage.css` redefines every contract token on `:root` and under `prefers-color-scheme: dark`, plus a few theme-local roles, and self-hosts its fonts. Where this section and the v1 sections above disagree, `stage.css` wins.

**Previewing the runners-up.** Add `?theme=<key>` before the hash, for example `index.html?theme=daylight#/`. An inline script after the theme link swaps its `href` to `css/themes/<key>.css` only when the key matches `/^[a-z]+$/` and is one of `stage`, `daylight`, `neon`, `heritage`. Anything else keeps Stage. The runner-up files and their fonts (`site/assets/fonts/<key>/`) are kept for comparison and are not maintained. Each one self-hosts its own faces; Heritage borrows Stage's Atkinson Hyperlegible Mono file for pass codes (an `@font-face` in `heritage.css`), so no preview depends on Google.

### Concept
The masthead and sticky tabs are a black stage in both modes, and event photos supply the colour. By night the whole ground is the stage, so the spotlight card sits on black over a small crimson pool of light. By day the house lights come up: white cards on `#F5F5F7`, with the spotlight card on the light ground casting a crimson-tinted shadow, so light and dark look different above the fold. **One accent, IIT maroon under stage light:** crimson `#D81B4A` is the single action colour in both modes; maroon `#A8123E` (day) and lit crimson `#FF3B5C` (night) are for small text only.

### Palette

| Role | Light | Dark | Used for |
|---|---|---|---|
| `--bg` / `--surface` / `--surface-2` | #F5F5F7 / #FFFFFF / #EDEDF0 | #0B0B0D / #151518 / #1F1F24 | ground, cards, calm chips |
| `--text` / `--text-muted` / `--border` | #0B0B0D / #55555F / #DEDEE3 | #F5F5F7 / #A1A1AA / #2C2C33 | ink, meta, hairlines |
| `--primary` = `--crimson` (white text) | **#D81B4A** | **#D81B4A** | the one action colour: every filled button, the event CTA, spotlight Register, filter chip on, segmented control on, active tab pill, the seal, focus rings, the LIVE stamp, badges |
| `--primary-ink` (theme-local) | **#A8123E** maroon | **#FF3B5C** crimson, lit (same hue family, 345°/350°) | small text only: links, event date line, urgency, IITD icons, the active tab label at night (by day it is crimson, so the active tab has one red) |
| `--plate` (theme-local) | crimson 10% into surface | rgb(255 255 255 / .08), neutral | IITD chip, avatar, status chips at night (colour lives in the glyph or text) |
| `--maroon` → `--pass-end` | #8A1538 → #C0103F | #8A1538 → #D81B4A | the wallet pass stub gradient |
| `--accent` (ink text) | #FFB21E | #FFC23D | the Featured star badge on rail posters |
| `--star` (theme-local) | #B87700 | #FFC23D | the star icon on the calm Featured chip |
| `--live` (ink text) | #F2570A | #FF7A1F | happening now only: LIVE badges, live stub, live date band, ring on live chips |
| `--stage` / `--on-stage` / `--on-stage-muted` | #0B0B0D / #FFFFFF / #D4D4D8 | #0B0B0D / #F5F5F7 / #D4D4D8 | masthead, scrims, ticket stubs, missing-photo ground |
| success / warning / danger | #0A6F37 / #8A4F00 / #B42318 | #4ADE80 / #FBBF24 / #FF6B5E | status only |
| `--glow-primary` | 0 6px 14px -8px crimson .5 | 0 6px 16px -8px crimson .6 | the event-page CTA; tight, so its light stays inside the CTA card |
| `--glow-live` | 0 4px 14px -4px saffron .6 | 0 2px 10px -3px rgb(255 140 50 / .9), tight so it stays orange | LIVE badges |

Live was moved from red-saffron to a more orange hue (16° → 20–24°) and the brand from box-office red to maroon-crimson (342–345°), so the LIVE pill and the Register button no longer sit next to each other in hue.

**Colour rules in v3.**
- *One action colour.* Filled buttons are crimson in both modes (`.btn` except ghost / ok / danger / wa, the event `.cta` button and the spotlight Register); hover darkens to #BA1740 (white 6.39:1). Maroon is never a fill any more; it is the day `--primary-ink` for small text. At night no coral or pink text sits next to a crimson fill: the ink is the same crimson, lit.
- *Calm chips.* Price, eligibility, team and category chips are neutral (`--surface-2`). IITD-only (shield) and IITD-first (clock) carry an ink icon. **Featured** is a calm chip too, with a small marigold star (`--star`), so it never competes with the crimson CTA; only the star badge on rail posters stays a solid marigold disc. **LIVE** (saffron) is the one loud chip. `ui.js` marks them `chip--featured` and `chip--early` (both still `chip--first` for the older themes).
- *No tinted plates at night.* The IITD chip, avatars and status chips sit on a neutral `rgb(255 255 255 / .08)` plate; the colour is in the glyph (crimson seal, crimson avatar ring) or the text (success, warning).
- *Urgency* ("Closes in 23h", "3 seats left") is `--primary-ink`, not ochre.
- *Live cards* keep a neutral frame; the saffron stub carries LIVE.
- *Brand.* The wordmark is "IITD" in white plus a crimson **LIVE** stamp tilted −4°. The mark is a white ticket with **one larger crimson on-air dot** (no ring: a ring around a dot reads as a bullseye) and the perforation. `assets/icon.svg` (favicon and PWA icon) is the same ticket on a black tile. `theme-color` (both modes) and the manifest `theme_color` / `background_color` are #0B0B0D. The link preview `assets/og.png` (1200×630) is the same world: a #0B0B0D field, the white ticket with one crimson dot, white "IITD" plus the tilted crimson LIVE stamp in Archivo 800 at 112% width, a rule with a crimson lead-in, a white tagline (19.66:1) and a #D4D4D8 sub-line (13.30:1).

### Typography
Archivo (Omnibus-Type, SIL OFL 1.1), self-hosted from `@fontsource-variable/archivo` 5.3.0 and trimmed to wght 400–850 and wdth 100–115: `assets/fonts/stage/archivo-latin-var.woff2` (57.5 KB) plus a ₹-only subset `archivo-rupee-var.woff2` (1.4 KB, `unicode-range: U+20B9`). Display text (h1, h2, rail titles, spotlight and fest titles, prices, pass title, wordmark) runs at `font-stretch: 112%` and weight 800. Body runs at 100% width. Inactive tab-bar labels are 600, the active one 800.

Pass codes and entry numbers use **Atkinson Hyperlegible Mono 500** (SIL OFL 1.1), self-hosted from `@fontsource/atkinson-hyperlegible-mono` 5.3.0: `assets/fonts/stage/atkinson-hyperlegible-mono-latin-500.woff2` (10 KB, licence in `OFL-atkinson-hyperlegible-mono.txt`), declared in `stage.css` as "IITD Mono" with the latin `unicode-range`. `--font-mono` is `"IITD Mono", "IITD Archivo", ui-monospace, …`, so **₹ is never set in mono**: it is outside the mono range and falls through to Archivo's rupee subset. Total font weight about 69 KB, all `font-display: swap`, all same-origin.

### Signature components in v3
- **Poster card:** a ticket-shaped white price tag (top left, wide 800 caps "FREE" / "₹199", notches cut with a CSS mask) and a one-line black **date band** across the foot of the photo ("Fri, 16 Oct · 9:00 PM"; it never wraps). The band turns saffron for "Live now".
- **Section heads:** a 2px rule over each rail title, poster-style, that starts with a **56px crimson lead-in** and runs on in `--text` (`border-image`). Tighter rail spacing (24px between rails).
- **Rails on desktop (≥1000px):** the track's right edge fades over 72px (`mask-image`), so a cut-off tile reads as "scroll for more"; 72px of end padding lets the last tile clear the fade when scrolled to the end.
- **Photo fallback and loading state:** every `.media` (cards, posters, fest tiles, thumbnails) shows the organiser's colour as a light from the top-left corner falling into stage black: `radial-gradient(90% 70% at 18% 0%, color-mix(poster 65%, transparent), transparent 70%), var(--stage)`. Loading and missing look identical (no `:has()` switch). At night fest tiles, poster art, category tiles and the event hero carry a 1px `rgb(255 255 255 / .08)` bezel drawn above the photo and scrim, so a photo-less tile keeps its edges on the black ground. The organiser's "No photo" cover option is a calm control (`--surface-2`, muted text, 6.30:1), not a poster.
- **Fest tile:** dates on a white ticket tag ("15–17 OCT 2026") over the same fallback.
- **List card stub:** 72px wide and black (`#26262C` at night). The live stub is saffron and breaks as "till / 11:00 PM" (`ui.js` joins the time with a no-break space). The top notch is clipped (`clip-path: inset(var(--notch) 0 0 0)`) so only the half that bites into the ticket shows, with no grey bead on the photo.
- **Masthead:** the search field has a 40% white border (3.80:1 on the stage; 60% on hover). The first feed tab's label lines up with the brand and search (one left edge); fest-day and organiser tabs do the same against the page edge, with their hairline starting at that edge. Below 379px the feed tabs tighten (8px padding, no gap; 6px below 350px) so all four fit at 320px instead of "Fests" being clipped at the edge. At night a 1px `--border` hairline closes the masthead on pages without feed tabs.
- **Bottom tab bar:** the active tab is a filled crimson pill with a white icon (shape and fill, not colour alone) and a bold label, crimson by day (one red in the control, 5.03:1) and the lit ink at night (crimson on the dark surface would be 3.62:1); inactive tabs are neutral muted. On the active pill the wallet count flips to a white badge with crimson numerals.
- **Event page (phones and tablets):** the sticky CTA sits flush on the tab bar, on a band of `--bg` that fills the gap beneath it, so scrolling content never shows between them.
- **Wallet pass:** a maroon → crimson stub with white text; at night its light falls only below the pass. QR modules are stage black `#0B0B0D` on a white quiet zone.

### Spotlight
- **Mobile (<720px):** 5:6 card. The text block carries its own backdrop (`.slide__body::before`, from 48px above the text to the foot, 0 → .74 → .92 black), so the venue/time and club lines stay legible over bright photos whatever the title length.
- **Desktop (≥720px):** a lighter scrim so the photo keeps its fest energy: dark only on the text side (`.88 → .80 at 36% → .56 at 58% → .20 at 76% → 0 at 90%`) plus a gentle foot fade (to .5), and the photo is lifted with `saturate(1.2) brightness(1.1) contrast(1.05)`. Titles carry a soft dark text-shadow for long names. Register sits next to its price (`justify-content: flex-start`, 40px gap, 168px min width).
- **Focus:** a white ring (`--on-stage`), drawn just inside the text block so it always lands on the scrim.
- **Dots:** inactive dots are `--text-muted` (≥6.77:1); the active one is the wide `--text` pill. Each dot is a 44×44 hit area (six take 264px, inside the 288px column at 320px).

### Glow rules
1. **Nothing glows inside a scroll container** unless its light is drawn inside the item or the scroller fades it out. `overflow-x: auto` also clips the y axis, so any `box-shadow` or blurred layer near a scroller's edge becomes a hard slab.
2. **The spotlight light.** *Day:* no photo spill (a blurred photo on a light ground read as a dusty-mauve stain); the card casts a short shadow with a crimson cast that hugs its foot: `0 16px 24px -16px rgb(216 27 74 / .4), 0 12px 24px -14px rgb(11 11 13 / .28), 0 2px 6px rgb(11 11 13 / .06)`. Measured: the dots row below sits within 1 level of `#F5F5F7` (the old `0 30px 50px -28px` cast left it at rgb(240 229 233), a dusty-rose band). *Night:* `.slide__glow` is a **fixed crimson radial** (not the photo), 80% of the card wide and 46% tall, centred behind the lower card so its peak is hidden; only a rim spills out, about 32px plus a 12px blur, and the black drop shadow is removed so it does not smother it. Measured on the rendered page: the brightest pixel just under the card centre is rgb(77 16 32), it is back to the stage colour 36px down and at 25% of the width, and the viewport edges stay pure `#0B0B0D` (no haze, no pool around the dots). The slide's 64px (72px desktop) bottom padding and the track's 44px bottom mask keep it from ever clipping into a slab.
3. **Allowed glows:** the spotlight Register (`--glow-crimson`), the event-page CTA (`--glow-primary`, tight enough that the card's border stays its neutral colour and nothing tints below the card), the LIVE stamp in the wordmark, and LIVE badges outside scrollers (`--glow-live`, tightened at night so it stays orange). The live signal on "Happening now" chips is a saffron conic ring drawn inside the chip. The night wallet pass casts `0 28px 36px -24px` crimson: the spread exceeds half the blur, so no light shows at its sides.
4. **Not allowed:** glow on poster, category or fest tiles (hover is a 2px lift or an image zoom), and the old `.hero__glow` under the event and fest heroes (removed).

### Contrast (WCAG 2.2, computed from `stage.css`; tints are sRGB `color-mix`)

| Pair | Light | Dark | Need |
|---|---|---|---|
| text / bg | 18.06 | 18.06 | 4.5 |
| text / surface | 19.66 | 16.74 | 4.5 |
| text / surface-2 (calm chips, Featured chip) | 16.83 | 15.07 | 4.5 |
| muted / bg | 6.77 | 7.67 | 4.5 |
| muted / surface (inactive tab labels) | 7.37 | 7.11 | 4.5 |
| muted / surface-2 (Open, Team chips, "No photo" cover) | 6.30 | 6.40 | 4.5 |
| white / crimson `--primary` (every filled button, LIVE stamp, badge, tab pill icon) | 5.03 | 5.03 | 4.5 |
| white / hover crimson #BA1740 | 6.39 | 6.39 | 4.5 |
| `--primary-ink` / bg (links, date line, urgency) | 6.84 | 5.65 | 4.5 |
| crimson / surface (active tab label, day) | 5.03 | – | 4.5 |
| `--primary-ink` / surface (active tab label, night) | 7.44 | 5.23 | 4.5 |
| `--primary-ink` / surface-2 | 6.37 | 4.71 | 4.5 |
| IITD chip / avatar text on `--plate` (day: ink on 10% crimson; night: text on the neutral plate, over surface / over bg) | 6.33 | 13.51 / 15.13 | 4.5 |
| status success on its plate (day 10% tint, night neutral) | 5.43 | 8.44 | 4.5 |
| status warning on its plate (day 14% tint, night neutral) | 5.32 | 8.81 | 4.5 |
| crimson / white (active wallet badge numerals) | 5.03 | 5.03 | 4.5 |
| white / maroon #8A1538 (pass start) | 9.35 | 9.35 | 4.5 |
| white / pass end (#C0103F light, #D81B4A dark) | 6.20 | 5.03 | 4.5 |
| ink / marigold (rail Featured badge) | 10.45 | 11.71 | 4.5 |
| ink / live (LIVE badge, stub, date band) | 5.52 | 7.24 | 4.5 |
| danger / surface | 6.57 | 6.52 | 4.5 |
| masthead tab (white .64) / stage | 8.18 | 8.18 | 4.5 |
| search placeholder #A1A1AA / #1C1C21 | 6.62 | 6.62 | 4.5 |
| on-stage / date band (.88 black over a white photo) | 14.71 | 13.51 | 4.5 |
| ink / white price and date tags | 19.66 | 19.66 | 4.5 |
| crimson tab pill / surface (non-text) | 5.03 | 3.62 | 3.0 |
| night plate glyph `--primary-ink` (seal, avatar ring) (non-text) | – | 4.23 | 3.0 |
| Featured star / surface-2 (non-text) | 3.17 | 10.19 | 3.0 |
| spot dot, inactive (muted) / bg (non-text) | 6.77 | 7.67 | 3.0 |
| crimson focus ring / bg (non-text) | 4.62 | 3.91 | 3.0 |
| search border white .40 / stage (non-text; hover .60: 7.26) | 3.80 | 3.80 | 3.0 |
| live dot / bg (non-text) | 3.14 | 7.54 | 3.0 |
| live ring / surface (non-text) | 3.42 | 6.99 | 3.0 |

**Spotlight text over real photos.** Measured on the rendered page for all six slides at 320 / 360 / 390 / 720 / 1000 / 1280px, with the text hidden and the scrims and backdrop kept, taking the 95th-percentile and the brightest pixel under each text line. Worst cases across both modes (95th percentile / brightest pixel): mobile venue/time line 8.84 / 8.48, club line 12.85 / 12.77, eligibility line 13.14 / 13.14; desktop venue/time line 8.29 / 8.22, club line 9.61 / 9.48, eligibility line 11.48 / 11.26; desktop titles (large text, needs 3:1) 5.67 / 4.36. No text line falls below its threshold on any pixel. The old mobile club and venue lines measured about 2:1 over bright photos.

The marigold fill on white is no longer a text ground: the Featured chip is calm and only its star is marigold (#B87700 by day, 3.17:1 on `--surface-2`).
