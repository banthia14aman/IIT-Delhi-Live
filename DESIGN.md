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

**Character:** Bricolage Grotesque has the ink-trapped, slightly cheeky letterforms of a well-designed student fest poster. It has energy without being a novelty face, and it stays crisp at 18px card titles. Atkinson Hyperlegible Next was designed by the Braille Institute so that easily confused letters (I/l/1, 0/O, rn/m) stay distinct. That matters on a sunlit phone, and in the gate queue where a volunteer types a pass code by hand. Its mono sibling sets pass codes and entry numbers. All three include ₹ in Google's latin-ext subset, which loads only on pages that show a price. Together they total about 85 KB and use `display=swap`.

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
  - `IITD first · till 6 PM` = `--accent` fill, `--accent-contrast` text, with a star icon. Shown while `iitd_first_until` is in the future.
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
- Tap targets are at least 44×44px, with at least 8px between adjacent targets.
- Status always has text and an icon: eligibility, waitlist, scan results and errors are never colour-only.
- Every route has one `<h1>`. Tabs use `role="tablist"` and `aria-selected`. Live banners use `role="status"`. The scanner result is announced with `aria-live="assertive"`.
- Posters are `aria-hidden`, because the emoji is decorative and the title carries the meaning. The logo has the alt text "IITD Live".
- `prefers-reduced-motion` is respected everywhere. Zooming to 200% doesn't break the one-column layout.
- Language is set with `lang="en-IN"`. Times use the 12-hour format with AM/PM, as students read them ("7:30 PM", "Sat 18 Oct").
