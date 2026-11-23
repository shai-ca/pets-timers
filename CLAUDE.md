# קוצ׳יק וקישמיש — pet timers

A single-page mobile web app (Hebrew, RTL) for tracking two pets:

- **Kochik (קוצ׳יק):** time since last food / pee / poop, plus a daily morning + evening medication checklist (turns red if the morning dose isn't marked by 11:00 or the evening dose by 21:00; resets at midnight).
- **Kochik's ear gel:** a fourth tile, `gel` — given as needed when she is not eating, roughly once in three days. It is an ordinary point entry, but `slow:true` makes its tile count in days and hours (`wordsLong`) instead of a running clock, with a note of the usual rhythm. Counted in the summary like the other point kinds.
- **Kishmish (קישמיש):** time since last food / pee / poop, plus start/stop timers for sleep, crying and crate (shows the live duration, the last duration, and today's total). These are ongoing states, not moments (`state.kishmish.crate.start` is set while she is inside), and they overlap freely (asleep or crying in the crate). The owner does not want more than this tracked — a puppy-pen timer was added and removed; keep the logging light. A timer can be started in the past from its "הוספה" sheet (`tapDur(p, k, at)`): a start time with no end time means "still going on"; only an explicit end time logs a finished stay. A stay that was closed by mistake can be reopened from its history row ("עדיין נמשך").
- **The routine wheel is derived, display-only** (the owner found a tappable wheel next to tappable tiles confusing — two places logging the same meal or poop — so there is now exactly one place to tap: the tiles). `routine(p)` works out the current step from the log every render; nothing about the step is stored: in the crate → כלוב; out of the crate with nothing logged since → טיול וצרכים; a pee / poop / "לא עשתה" → משחק; a meal or "לא אכלה" → צרכים; a result after that meal → round done, crate next. Only entries since she last left the crate (or since midnight) count; a `brk` entry ("הפסקה בשגרה", the one button left on the wheel card) holds the routine until the next entry. Fixing or deleting an entry therefore moves the wheel by itself. Do not reintroduce stored step state (`cyc` / `hist` may still exist in old data and are ignored).
- **The wheel** (`cycleHTML`): an inline SVG ring of five arrow-shaped segments clockwise from the top with an icon each (`STEP_ICON`); earlier steps tinted, the current one filled (red when the crate stay is over the limit), the next one with a pulsing dashed outline and "← הבא" on its label. The centre shows the current step and how long; a line under the ring says what is next and which tile moves it on.
- **Made for people who are not the owner** (her partner and her mother use it too): the box under the wheel says in plain words what is happening and what to press ("מה עושים עכשיו?"), the tiles that move the routine on carry a "עכשיו בשגרה" tag and outline (`routineTap`), and "איך זה עובד?" opens a five-line explanation (`openHelp`). Keep new routine features explainable in that box.
- **Kishmish's tiles follow the routine's order:** crate, pee, poop, a slim one-button row for "לא עשתה" (`none`; a full tile with its own timer was tried and the owner found it awkward), the play card (`playCardHTML`: חבל / קונג ממולא / משטח ליקוק / אילוף עם אוכל → `logPlay`, logs `{k:"play", y}`; the food kinds in `PLAY_FOOD` also log one meal tagged `y:"play"` per 30 minutes — she is tiny), food (with a "לא אכלה" link → `k:"nofood"`), then sleep and crying.
- **Rounds are a view of the log, not separate data.** `roundStarts()` = every crate entry in the log plus the running crate timer; a round runs from one crate entry to the next and is numbered per day. `groupedHTML()` lists a day's real log entries grouped by round (newest round first, entries in order, running timers as rows) — on Kishmish's main screen ("היום לפי סבבים") and in the summary's day view. Every row opens `openEntrySheet` (time, place, delete; start / end for a finished stay; "עדיין נמשך" to reopen). "הוספת רישום" in the list header adds a missed entry at a chosen time.
- **Crate:** a running timer that ends only with "יצאה מהכלוב" on its tile (which also stops the sleep timer). After `CRATE_MAX` (2 hours) the tile and the wheel turn red (`crateOver`, 07:00–22:00 only, so a night in the crate is not an alarm). While she sleeps the wheel shows a moon and "נותנים לה לישון".
- **Take-out reminder:** `pottyDue()` shows "זמן להוציא לצרכים" on the wheel card after waking up, leaving the crate, a meal, or when the pee forecast window opens, until a pee / poop / "לא עשתה" is logged, for at most an hour, never while she is asleep or in the crate.
- **Where (pee / poop):** a log entry can carry `w: "out"|"gravel"|"pad"|"floor"|"crate"` (`WHERE`; floor and crate are accidents, shown in red; the choices and their order are per pet in `PETS[p].where` — Kishmish is not vaccinated yet and cannot go outside, so her good place is the gravel on the balcony, with the pad in her pen as the acceptable fallback). Right after logging, a sheet asks where (`whereSheet`; "דילוג" leaves it unmarked and the tile then shows an "איפה?" link); any past entry can be changed from its history sheet. Shown next to the entry and on the tile (floor in red) and counted in the summary tiles (`whereLine`).
- **Today's count by place:** the pee and poop tiles on the main screen show "היום: חצץ 2 · פד 1" (`todayWhere`), best place first, with unmarked ones counted as "לא סומן".
- **Colours:** each pet page has its own theme (`.p-kochik` / `.p-kishmish`, set on `<html>` and `<body>`): Kochik is a Maltese (snow white with black buttons and icons, like the nose and eyes), Kishmish a Yorkshire puppy (chestnut-brown buttons and tan icons on cream; black only for text).

- **Summary (סיכום):** a second view per pet with day / week / month totals, navigable by date (arrows or a date picker). Week and month show per-day averages and a per-day table; tapping a row opens that day. Weeks start on Sunday. Computed from `log` in `renderSummary()` / `stats()`.
- **Charts (summary view):** `timelineHTML` (day and week modes) draws one bar per day, midnight to midnight, with crate / sleep bands, meal ticks and a dot per pee (round) / poop (square), tappable to fix the entry. `whereBarsHTML` (week and month modes) draws one stacked column per day of pees + poops by place, accidents on the baseline; tapping a day opens it. Both are plain HTML/CSS (no chart library). Colour = where, using status colours checked with the dataviz skill's palette validator: outside or balcony gravel `#0ca30c`, pad `#fab219`, accident (floor / crate) `#d03b3b`, unmarked grey — do not darken the amber, it then collides with the green for red-green colour-blind viewers. Every colour is named in the legend.
- **Summary filter:** tapping a summary tile sets `sumFilter` to that kind and narrows the timeline, the where chart (pee / poop only), the per-day table and the entry list to it; in week / month views a filtered summary also lists the entries themselves. Tap again or "הצגת הכול" to clear.
- **Pee forecast:** `peeForecast()` = the last pee plus the 25th–75th percentile of the last week's gaps between pees (`peeGaps`, nights excluded, needs 4 gaps). Kishmish's pee tile shows "הפיפי הבא צפוי בין 15:40–16:00", then an amber dot while the window is open and a red one after it (no colours while she is asleep or in the crate). When the window opens it also counts as a reason for the wheel's take-out reminder ("לפי הקצב הרגיל שלה"). Deliberately simple statistics — there is far too little data for a learned model.
- **Typical intervals:** `typical()` shows under Kishmish's pee tile "בדרך כלל כל …" (median gap between pees over 7 days, nights excluded, needs 4 gaps) and under the poop tile "בדרך כלל … אחרי אוכל" (median meal-to-poop time, needs 3).
- **Who did it:** each device picks a user once (יונתן / שי / ליזה, the `USERS` object; stored in localStorage `pets-timers-v1-user`, changeable from the header chip). `commit()` stamps `by` on every new log entry and the name is shown next to events. This is self-declared per device, not tied to the Google account.

- **Fixing entries:** tapping a history row opens a sheet to change its time or delete it (`openEntrySheet`, `recalc`). Entering a time earlier than the current "last" one asks whether to correct the last entry or add another (`logAt`).
- **Desktop vs phone:** under 760px it is a single-column list; from 760px up (`@media (min-width:760px)` at the end of the CSS) the cards become 240px square tiles in a grid. With a mouse (`pointer:fine`) time fields are text boxes that accept `935`, `9:35`, `9` and save on Enter (`timeField`, `parseTime`); touch devices keep the native time picker.

- **Self-update:** `selfUpdate()` (end of the script) fetches the published `index.html` uncached when the app comes to the front and every 5 minutes, and reloads if its inline `<script>` or `<style>` text differs from the running one. No version number to bump; it waits for saves, open sheets and the undo toast, and never reloads twice within two minutes.

Every "when?" sheet (`chips()`) has quick "לפני 5 / 10 / 15…" buttons, a box for any number of minutes ago (`#agoIn`, handled in `sheet()` — a typed number wins over the clock field) and an exact time field.

Every action can be undone from the toast for 6 seconds, and any event can be logged at an earlier time ("שעה אחרת" / "הוספה"). There's a history list per pet.

## Files

- `index.html` — the whole app: HTML, CSS, and JS in one file, no build step. The icons are hand-drawn inline SVGs in the `ICONS` object. Font: Heebo from Google Fonts.

- `icon.svg`, `icon-192.png`, `apple-touch-icon.png` (180px) — the favicon and the iPhone home-screen icon: the paw from `ICONS.paw` on a white / tan diagonal (one half per dog). The PNGs are renders of `icon.svg`; redo them if it changes.

- `firebase.json`, `.firebaserc` — Firebase Hosting config, so the same `index.html` is also served from `https://pets-timers.firebaseapp.com` (the `web.app` address forwards there — it is not an authorised OAuth return address and gives `redirect_uri_mismatch`) (`npx -y firebase-tools deploy --only hosting`, needs the owner's `firebase login`). Reason: on that domain Google sign-in is same-site (`SAME_SITE_AUTH` → `signInWithRedirect`, `authDomain` = the page's own host), which works on Android phones where the pop-up flow from GitHub Pages dies with "missing initial state" (it did on the owner's mother's phone). GitHub Pages keeps using the pop-up. **Both addresses are live and must be kept in step: after every `git push`, also run `npx -y firebase-tools deploy --only hosting --project pets-timers --non-interactive`** (the CLI is logged in on the owner's Mac). `firebase.json` ignores `.git/**` and other dot folders — without that the first deploy uploaded the repository's internals.

## Data

All state lives in one JSON object:

```js
{
  kochik:   { food: ts, pee: ts, poop: ts, meds: { "YYYY-MM-DD": { am: ts, pm: ts } } },
  kishmish: { food: ts, pee: ts, poop: ts,
              sleep: { start?: ts, lastStart?: ts, lastEnd?: ts },
              cry:   { start?: ts, lastStart?: ts, lastEnd?: ts },
              crate: { start?: ts, lastStart?: ts, lastEnd?: ts },
              none?: ts /* last "went out, nothing" */ },   // old data may also hold cyc / hist / playEnd — ignored
  log: [ { p: "kochik"|"kishmish", k: "food"|"pee"|"poop"|"gel"|"sleep"|"cry"|"crate"|"none"|"play"|"nofood"|"brk"|"med_am"|"med_pm", t: ts, end?: ts, w?: "out"|"gravel"|"pad"|"floor"|"crate", y?: "rope"|"kong"|"lick"|"train" (on play) | "play" (on a meal that came from play), by?: "yonatan"|"shai"|"liza" } ]  // capped at 5000 (LOG_MAX)
}
```

(`ts` = epoch milliseconds.)

**Persistence:** the whole object lives in localStorage (`pets-timers-v1`) and in Firestore doc `state/main`. Devices never overwrite the document with their own copy (that lost other people's changes when a phone woke up with an old copy). Instead `base` (localStorage `pets-timers-v1-base`) is the last state the server is known to have; `push()` computes `diff(base, state)` — pet objects field by field, arrays such as `hist` as a whole, the log entry by entry keyed `pet|kind|time` — and applies it with `patch()` to the server's current document inside a Firestore transaction (`ref.merge`). Server snapshots go through `onServer()`, which rebases unsent local changes on top; cache-only snapshots are ignored. On returning to the foreground `resync()` reads the document from the server and re-sends anything pending; a failed save stays local and is retried. `salvage()` runs once per device on its first server contact and re-adds this person's own entries from the last two days that the server lacks (a phone that was signed out or not allowed). Undo reverses only its own change (`patch(diff(after, before), state)`). The Firebase SDK is loaded from the gstatic CDN by dynamic `import()`. While `FIREBASE_CONFIG` is `null` the app is localStorage-only.

**Sign-in gate:** the app cannot be used until the device is signed in with a Google account that the Firestore rules allow (`setGate` / `allow` / `lock`, full-screen `#gate`). The allowed emails exist only in the rules in the Firebase console — never in this public repo; the app learns the answer from the server (first document read succeeds, or `permission-denied` → "החשבון … לא נמצא ברשימת המורשים" with switch-account and retry). When the Google sign-in does not complete, the lock screen says why in plain Hebrew (`gateError`: window closed early, pop-up blocked, no connection, or the raw code), and warns up front when the page is running inside another app's embedded browser (`IN_APP`, e.g. opened from WhatsApp), where Google refuses to sign in. A device that was allowed before (`pets-timers-v1-authok` in localStorage) opens immediately, so the app still works offline. The header status pill still shows sync state and signs out when tapped.

- `firestore.rules` — the rules to paste into the Firebase console, with placeholder emails. Real emails stay out of the repo (it's public).

The log cap is 5000 entries so the monthly summary has data to read (roughly 300 KB, well under Firestore's 1 MiB document limit). If it ever gets close, move old entries to per-month documents.

`seed()` in the persistence section is a one-time import of the state from the old claude.ai artifact (22.11.2026); it only runs on an empty app within two days of that date and can be deleted.

## Setup still to do (needs the owner's Google account)

1. Firebase console → create project (Spark plan) → add a Web app → paste its config object into `FIREBASE_CONFIG` in `index.html`. (The config is not a secret; the rules are the protection.)
2. Build → Firestore Database → create (production mode) → Rules: paste `firestore.rules` with the real emails.
3. Build → Authentication → Sign-in method → enable Google. Settings → Authorized domains → add the GitHub Pages domain (`<user>.github.io`).
4. Push to a public GitHub repo and enable Pages (Settings → Pages → deploy from `main`, root).
