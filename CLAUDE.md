# קוצ׳יק וקישמיש — pet timers

A single-page mobile web app (Hebrew, RTL) for tracking two pets:

- **Kochik (קוצ׳יק):** time since last food / pee / poop, plus a daily morning + evening medication checklist (turns red if the morning dose isn't marked by 11:00 or the evening dose by 21:00; resets at midnight).
- **Kishmish (קישמיש):** time since last food / pee / poop, plus start/stop timers for sleep, crying and crate (shows the live duration, the last duration, and today's total). These are ongoing states, not moments (`state.kishmish.crate.start` is set while she is inside), and they overlap freely (asleep or crying in the crate). The owner does not want more than this tracked — a puppy-pen timer was added and removed; keep the logging light. A timer can be started in the past from its "הוספה" sheet (`tapDur(p, k, at)`): a start time with no end time means "still going on"; only an explicit end time logs a finished stay. A stay that was closed by mistake can be reopened from its history row ("עדיין נמשך").
- **Routine strip (Kishmish, `cycle:true`):** the trainer's potty-training cycle from `CYCLE` — כלוב → טיול וצרכים → משחק → אוכל → צרכים → back to crate. `goStep()` moves between steps in one undoable commit: entering the crate step starts the crate timer and leaving it stops it, entering the food step logs a meal, play has no timer (the owner found that too much tapping; leaving it only stamps `playEnd`). Using the crate tile directly moves the strip too. The current step is `state.kishmish.cyc = {i, t}`.
- **The routine is drawn as a ring** (`cycleHTML`): an inline SVG with five arc segments clockwise from the top, an icon on each (`STEP_ICON`), the step names as buttons around it and the current step, elapsed time and (in the crate) start time in the centre. Earlier steps of the round are tinted, the current one filled, red when the crate stay is over the limit. Segments and labels both jump to a step.
- **Rounds (סבבים):** every step change is appended to `state.kishmish.hist` (`setStep`, last 1500 ≈ a month); this list is the source of truth for the routine and everything else is derived. `rounds()` groups it into rounds — a round starts when she goes into the crate; going back to an earlier step inside a round is a correction, not a new round — and numbers them per day ("סבב 3"). `stepResult()` shows per step how long it lasted and what was logged during it (pee / poop with where, or "לא עשתה" = log entry `k:"none"`), by time window, so fixing a log entry's time moves it between steps by itself. Today's rounds are listed under the tiles and any day's rounds in the summary's day view. Tapping a step opens `openStepSheet`: change its start time (`editStepTime` also moves the crate timer / meal that the routine wrote at that moment), add a pee / poop / nothing at a chosen time, or delete the step.
- **Crate is a state that only ends explicitly:** while `crate.start` is set the strip shows the crate step (whatever `cyc` says), the other steps and the break button are locked, and the only way on is "הוצאתי אותה מהכלוב" on the strip (`data-act="out"` → walk step) or "יצאה מהכלוב" on the tile. After `CRATE_MAX` (2 hours) the crate tile and the strip turn red (`crateOver`, daytime only: 07:00–22:00, so a night in the crate is not an alarm).
- **Forgot to tap:** the strip's main action has a "שעה אחרת" under it (`openStepAtSheet` → `goStep(p, i, at)`), clamped to after the previous step / crate entry. Deleting a step from a round also removes the crate stay or meal the routine wrote for it; reopening a crate stay undoes the exit step that closed it.
- **Asleep / break:** while the sleep timer runs the strip says "נותנים לה לישון" and its main button becomes a muted "כשתתעורר: טיול וצרכים" (`data-act="wake"`: stops the sleep timer and goes to the walk step). Moving to any step other than the crate stops the sleep timer. "הפסקה בשגרה" (`goBreak`, e.g. a vet visit) stops crate / sleep and appends the pseudo step `BREAK` (`i:-1`) to `hist`; it ends the round, and the next step tapped starts a new one.
- **Take-out reminder:** `pottyDue()` shows "זמן להוציא לצרכים" after waking up, leaving the crate, play or food (the trainer's list) until pee/poop is logged or "לא עשתה" is logged, for at most an hour, and never while she is asleep or in the crate.
- **Where (pee / poop):** a log entry can carry `w: "out"|"gravel"|"pad"|"floor"|"crate"` (`WHERE`; floor and crate are accidents, shown in red; the choices and their order are per pet in `PETS[p].where` — Kishmish is not vaccinated yet and cannot go outside, so her good place is the gravel on the balcony, with the pad in her pen as the acceptable fallback). Right after logging, a sheet asks where (`whereSheet`; "דילוג" leaves it unmarked and the tile then shows an "איפה?" link); any past entry can be changed from its history sheet. Shown next to the entry and on the tile (floor in red) and counted in the summary tiles (`whereLine`).
- **Colours:** each pet page has its own theme (`.p-kochik` / `.p-kishmish`, set on `<html>` and `<body>`): Kochik is a Maltese (snow white with black buttons and icons, like the nose and eyes), Kishmish a Yorkshire puppy (chestnut-brown buttons and tan icons on cream; black only for text).

- **Summary (סיכום):** a second view per pet with day / week / month totals, navigable by date (arrows or a date picker). Week and month show per-day averages and a per-day table; tapping a row opens that day. Weeks start on Sunday. Computed from `log` in `renderSummary()` / `stats()`.
- **Charts (summary view):** `timelineHTML` (day and week modes) draws one bar per day, midnight to midnight, with crate / sleep bands, meal ticks and a dot per pee (round) / poop (square), tappable to fix the entry. `whereBarsHTML` (week and month modes) draws one stacked column per day of pees + poops by place, accidents on the baseline; tapping a day opens it. Both are plain HTML/CSS (no chart library). Colour = where, using status colours checked with the dataviz skill's palette validator: outside or balcony gravel `#0ca30c`, pad `#fab219`, accident (floor / crate) `#d03b3b`, unmarked grey — do not darken the amber, it then collides with the green for red-green colour-blind viewers. Every colour is named in the legend.
- **Summary filter:** tapping a summary tile sets `sumFilter` to that kind and narrows the timeline, the where chart (pee / poop only), the per-day table and the entry list to it; in week / month views a filtered summary also lists the entries themselves. Tap again or "הצגת הכול" to clear.
- **Typical intervals:** `typical()` shows under Kishmish's pee tile "בדרך כלל כל …" (median gap between pees over 7 days, nights excluded, needs 4 gaps) and under the poop tile "בדרך כלל … אחרי אוכל" (median meal-to-poop time, needs 3).
- **Who did it:** each device picks a user once (יונתן / שי / ליזה, the `USERS` object; stored in localStorage `pets-timers-v1-user`, changeable from the header chip). `commit()` stamps `by` on every new log entry and the name is shown next to events. This is self-declared per device, not tied to the Google account.

- **Fixing entries:** tapping a history row opens a sheet to change its time or delete it (`openEntrySheet`, `recalc`). Entering a time earlier than the current "last" one asks whether to correct the last entry or add another (`logAt`).
- **Desktop vs phone:** under 760px it is a single-column list; from 760px up (`@media (min-width:760px)` at the end of the CSS) the cards become 240px square tiles in a grid. With a mouse (`pointer:fine`) time fields are text boxes that accept `935`, `9:35`, `9` and save on Enter (`timeField`, `parseTime`); touch devices keep the native time picker.

- **Self-update:** `selfUpdate()` (end of the script) fetches the published `index.html` uncached when the app comes to the front and every 5 minutes, and reloads if its inline `<script>` or `<style>` text differs from the running one. No version number to bump; it waits for saves, open sheets and the undo toast, and never reloads twice within two minutes.

Every action can be undone from the toast for 6 seconds, and any event can be logged at an earlier time ("שעה אחרת" / "הוספה"). There's a history list per pet.

## Files

- `index.html` — the whole app: HTML, CSS, and JS in one file, no build step. The icons are hand-drawn inline SVGs in the `ICONS` object. Font: Heebo from Google Fonts.

- `icon.svg`, `icon-192.png`, `apple-touch-icon.png` (180px) — the favicon and the iPhone home-screen icon: the paw from `ICONS.paw` on a white / tan diagonal (one half per dog). The PNGs are renders of `icon.svg`; redo them if it changes.

## Data

All state lives in one JSON object:

```js
{
  kochik:   { food: ts, pee: ts, poop: ts, meds: { "YYYY-MM-DD": { am: ts, pm: ts } } },
  kishmish: { food: ts, pee: ts, poop: ts,
              sleep: { start?: ts, lastStart?: ts, lastEnd?: ts },
              cry:   { start?: ts, lastStart?: ts, lastEnd?: ts },
              crate: { start?: ts, lastStart?: ts, lastEnd?: ts },
              cyc?: { i: 0..4 | -1 (break), t: ts }, hist?: [{ i, t }], playEnd?: ts, none?: ts },
  log: [ { p: "kochik"|"kishmish", k: "food"|"pee"|"poop"|"sleep"|"cry"|"crate"|"none"|"med_am"|"med_pm", t: ts, end?: ts, w?: "out"|"gravel"|"pad"|"floor"|"crate", by?: "yonatan"|"shai"|"liza" } ]  // capped at 5000 (LOG_MAX)
}
```

(`ts` = epoch milliseconds.)

**Persistence:** the whole object lives in localStorage (`pets-timers-v1`) and in Firestore doc `state/main`. Devices never overwrite the document with their own copy (that lost other people's changes when a phone woke up with an old copy). Instead `base` (localStorage `pets-timers-v1-base`) is the last state the server is known to have; `push()` computes `diff(base, state)` — pet objects field by field, arrays such as `hist` as a whole, the log entry by entry keyed `pet|kind|time` — and applies it with `patch()` to the server's current document inside a Firestore transaction (`ref.merge`). Server snapshots go through `onServer()`, which rebases unsent local changes on top; cache-only snapshots are ignored. On returning to the foreground `resync()` reads the document from the server and re-sends anything pending; a failed save stays local and is retried. `salvage()` runs once per device on its first server contact and re-adds this person's own entries from the last two days that the server lacks (a phone that was signed out or not allowed). Undo reverses only its own change (`patch(diff(after, before), state)`). The Firebase SDK is loaded from the gstatic CDN by dynamic `import()`. While `FIREBASE_CONFIG` is `null` the app is localStorage-only.

**Sign-in gate:** the app cannot be used until the device is signed in with a Google account that the Firestore rules allow (`setGate` / `allow` / `lock`, full-screen `#gate`). The allowed emails exist only in the rules in the Firebase console — never in this public repo; the app learns the answer from the server (first document read succeeds, or `permission-denied` → "החשבון … לא נמצא ברשימת המורשים" with switch-account and retry). A device that was allowed before (`pets-timers-v1-authok` in localStorage) opens immediately, so the app still works offline. The header status pill still shows sync state and signs out when tapped.

- `firestore.rules` — the rules to paste into the Firebase console, with placeholder emails. Real emails stay out of the repo (it's public).

The log cap is 5000 entries so the monthly summary has data to read (roughly 300 KB, well under Firestore's 1 MiB document limit). If it ever gets close, move old entries to per-month documents.

`seed()` in the persistence section is a one-time import of the state from the old claude.ai artifact (22.11.2026); it only runs on an empty app within two days of that date and can be deleted.

## Setup still to do (needs the owner's Google account)

1. Firebase console → create project (Spark plan) → add a Web app → paste its config object into `FIREBASE_CONFIG` in `index.html`. (The config is not a secret; the rules are the protection.)
2. Build → Firestore Database → create (production mode) → Rules: paste `firestore.rules` with the real emails.
3. Build → Authentication → Sign-in method → enable Google. Settings → Authorized domains → add the GitHub Pages domain (`<user>.github.io`).
4. Push to a public GitHub repo and enable Pages (Settings → Pages → deploy from `main`, root).
