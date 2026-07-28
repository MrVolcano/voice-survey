# voice-survey

A voice-enabled survey collection prototype for AbilityNet's post-training feedback survey. Static site, no backend — served as-is via GitHub Pages.

## What's here

- `index.html` — landing page, links to the two prototype routes below.
- `full-survey.html` — Long version: every outcome and every new-ability question from the real survey is asked individually by voice. ~30 questions.
- `open-survey.html` — Short version: the same outcomes/abilities are covered by two open questions instead. ~10 questions.
- `survey-engine.js` — shared engine (text-to-speech, speech recognition, fuzzy answer matching, rendering, storage) used by all three pages.
- `questions-full.js` / `questions-open.js` — the two question sets, loaded before `survey-engine.js`.
- `survey-styles.css` — shared styling.

Each question is read aloud and answered by voice (Web Speech API) or by tapping an on-screen option — voice is always optional. Works best in Chrome or Edge on desktop/Android; on iPhone/iPad, voice *input* only works in Safari (a platform restriction, not a bug here) though questions are still read aloud everywhere.

### Cache-busting

`survey-engine.js`, `questions-full.js`, `questions-open.js` and `survey-styles.css` are loaded with a `?v=N` query string on every page. GitHub Pages caches these fairly aggressively, so a page can otherwise end up with a freshly-fetched HTML file paired with a stale, mismatched cached script — bump `N` everywhere it appears whenever you edit any of those files, so visitors actually get the new version.

## Where the data goes

There's no database yet, so responses are stored two ways:

1. **Local device storage** (always on). Each completed response is saved into this browser's `localStorage` (last 100 kept), and the summary screen offers a "Download my answers" button (CSV). The landing page also has an "Export everything saved on this device" link, for a trainer to periodically pull everything off a shared/kiosk device. Nothing transmits anywhere with this alone — the safest option against data-policy concerns while the real storage decision is still open.
2. **Optional: Excel on Microsoft 365** (off by default). `survey-engine.js` has a `POWER_AUTOMATE_URL` constant near the top. Left blank, it's never used. If set, each response is also POSTed there.

### Setting up the Excel webhook

1. In OneDrive for Business or SharePoint, create an Excel file with a Table (Insert → Table) with columns matching what you want to capture — a simple version just needs `Timestamp`, `Route`, `Question`, `Answer` (one row per question, matching the CSV export shape).
2. In Power Automate, create a new **Instant cloud flow** triggered by **"When an HTTP request is received"**.
3. Add an **"Add a row into a table"** action (Excel Online (Business) connector), pointed at the file/table from step 1, mapping its columns from the trigger's JSON body.
4. Save the flow — Power Automate generates an HTTP POST URL. Paste that into `POWER_AUTOMATE_URL` in `survey-engine.js`.
5. Note: the client sends the JSON body as `Content-Type: text/plain` rather than `application/json` on purpose — this avoids a CORS preflight `OPTIONS` request that the HTTP trigger doesn't answer by default. Power Automate still parses the body as JSON on its side without any extra configuration.

This wiring is built and ready, but the flow itself needs to be created by someone with access to the org's Microsoft 365 tenant — not something this repo can provision on its own.
