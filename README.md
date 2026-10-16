# IITD Live

Campus event marketplace for IIT Delhi: discover events, register solo or as a team, keep QR passes in a wallet, check in at the gate. MBA Mobile Commerce class project.

**Live demo:** https://banthia14aman.github.io/IIT-Delhi-Live/

Demo mode: there is no server yet. All data lives in the visitor's browser (`localStorage`). Use the one-tap demo accounts on the login page (student, outsider, organiser, admin). Admin → "Reset demo data" restores the seed.

## Photos
Event and fest covers are real IIT Delhi photos from Wikimedia Commons (CC BY-SA / CC0), matched to each event or its venue. A few events keep openly licensed stock photos where no honest IITD photo existed. Every photo is credited at `#/credits` (`site/assets/img/credits.json`). The GitHub Action `images.yml` re-fetches them: edit `tools/image-picks.json` to swap one, or `tools/iitd-sources.json` to re-crawl. If a club gives permission to use its own event photos, drop them into `site/assets/img/` and set the event's `cover`.

## Layout
- `site/` — the static web app (no build step). `site/CONTRACT.md` is the store API the UI codes against; the Supabase backend will reimplement `site/js/store.js` behind the same API.
- `research/` — market research, case studies, feature list and user journeys.
- `PRODUCT.md`, `DESIGN.md` — product context and design system.

## Run locally
```
cd site && python3 -m http.server 8000   # open http://localhost:8000
node --test site/tests/*.test.mjs        # store tests
```

## Deploy
`git subtree push --prefix site origin gh-pages` publishes `site/` to GitHub Pages.
