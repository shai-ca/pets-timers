# קוצ׳יק וקישמיש — pet timers

A single-page mobile web app (Hebrew, RTL) for tracking two pets:

- **Kochik (קוצ׳יק):** time since last food / pee / poop, plus a daily morning + evening medication checklist (turns red if the morning dose isn't marked by 11:00 or the evening dose by 21:00; resets at midnight).
- **Kishmish (קישמיש):** time since last food / pee / poop, plus start/stop timers for sleep, crying and crate (shows the live duration, the last duration, and today's total).
- **Routine strip (Kishmish, `cycle:true`):** the trainer's potty-training cycle from `CYCLE` — כלוב → טיול וצרכים → משחק → אוכל → צרכים → back to crate. `goStep()` moves between steps in one undoable commit: entering the crate step starts the crate timer and leaving it stops it, entering the food step logs a meal, play has no timer (the owner found that too much tapping; leaving it only stamps `playEnd`). Using the crate tile directly moves the strip too. The current step is `state.kishmish.cyc = {i, t}`.
- **Rounds (סבבים):** every step change is appended to `state.kishmish.hist` (`setStep`, last 200). `rounds()` groups them into rounds (a new one starts when the step number doesn't go forward) and `stepResult()` shows per step how long it lasted and what was logged during it — pee / poop with where, or "לא עשתה" (log entry `k:"none"`, the third button on the strip). The last three rounds are listed under the tiles.
- **Take-out reminder:** `pottyDue()` shows "זמן להוציא לצרכים" after waking up, leaving the crate, play or food (the trainer's list) until pee/poop is logged or "לא עשתה" is logged, for at most an hour, and never while she is asleep or in the crate.
- **Where (pee / poop):** a log entry can carry `w: "out"|"pad"|"floor"` (`WHERE`). Right after logging, the toast offers the three choices (`toastWhere`, optional); any past entry can be changed from its history sheet. Shown next to the entry and on the tile (floor in red) and counted in the summary tiles (`whereLine`).
- **Colours:** each pet page has its own theme (`.p-kochik` / `.p-kishmish`, set on `<html>` and `<body>`): Kochik is a Maltese (snow white with black buttons and icons, like the nose and eyes), Kishmish a Yorkshire puppy (chestnut-brown buttons and tan icons on cream; black only for text).

- **Summary (סיכום):** a second view per pet with day / week / month totals, navigable by date (arrows or a date picker). Week and month show per-day averages and a per-day table; tapping a row opens that day. Weeks start on Sunday. Computed from `log` in `renderSummary()` / `stats()`.
- **Who did it:** each device picks a user once (יונתן / שי / ליזה, the `USERS` object; stored in localStorage `pets-timers-v1-user`, changeable from the header chip). `commit()` stamps `by` on every new log entry and the name is shown next to events. This is self-declared per device, not tied to the Google account.

- **Fixing entries:** tapping a history row opens a sheet to change its time or delete it (`openEntrySheet`, `recalc`). Entering a time earlier than the current "last" one asks whether to correct the last entry or add another (`logAt`).
- **Desktop vs phone:** under 760px it is a single-column list; from 760px up (`@media (min-width:760px)` at the end of the CSS) the cards become 240px square tiles in a grid. With a mouse (`pointer:fine`) time fields are text boxes that accept `935`, `9:35`, `9` and save on Enter (`timeField`, `parseTime`); touch devices keep the native time picker.

Every action can be undone from the toast for 6 seconds, and any event can be logged at an earlier time ("שעה אחרת" / "הוספה"). There's a history list per pet.

## Files

- `index.html` — the whole app: HTML, CSS, and JS in one file, no build step. The icons are hand-drawn inline SVGs in the `ICONS` object. Font: Heebo from Google Fonts.

## Data

All state lives in one JSON object:

```js
{
  kochik:   { food: ts, pee: ts, poop: ts, meds: { "YYYY-MM-DD": { am: ts, pm: ts } } },
  kishmish: { food: ts, pee: ts, poop: ts,
              sleep: { start?: ts, lastStart?: ts, lastEnd?: ts },
              cry:   { start?: ts, lastStart?: ts, lastEnd?: ts },
              crate: { start?: ts, lastStart?: ts, lastEnd?: ts },
              cyc?: { i: 0..4, t: ts }, hist?: [{ i, t }], playEnd?: ts, none?: ts },
  log: [ { p: "kochik"|"kishmish", k: "food"|"pee"|"poop"|"sleep"|"cry"|"crate"|"none"|"med_am"|"med_pm", t: ts, end?: ts, w?: "out"|"pad"|"floor", by?: "yonatan"|"shai"|"liza" } ]  // capped at 5000 (LOG_MAX)
}
```

(`ts` = epoch milliseconds.)

**Persistence:** `push()` writes the whole object to localStorage (`pets-timers-v1`) and, once `FIREBASE_CONFIG` is filled in and the user is signed in with Google, to Firestore doc `state/main` (`setDoc`), with `onSnapshot` for live sync and an offline cache. The Firebase SDK is loaded from the gstatic CDN by dynamic `import()` in the IIFE under `// ---------- persistence ----------`. While `FIREBASE_CONFIG` is `null` the app is localStorage-only (no sync).

The header status pill doubles as the auth control: "התחברות" signs in (Google popup); tapping it when signed in offers sign-out. "אין הרשאה" means the signed-in email isn't in the Firestore rules.

- `firestore.rules` — the rules to paste into the Firebase console, with placeholder emails. Real emails stay out of the repo (it's public).

The log cap is 5000 entries so the monthly summary has data to read (roughly 300 KB, well under Firestore's 1 MiB document limit). If it ever gets close, move old entries to per-month documents.

`seed()` in the persistence section is a one-time import of the state from the old claude.ai artifact (22.11.2026); it only runs on an empty app within two days of that date and can be deleted.

## Setup still to do (needs the owner's Google account)

1. Firebase console → create project (Spark plan) → add a Web app → paste its config object into `FIREBASE_CONFIG` in `index.html`. (The config is not a secret; the rules are the protection.)
2. Build → Firestore Database → create (production mode) → Rules: paste `firestore.rules` with the real emails.
3. Build → Authentication → Sign-in method → enable Google. Settings → Authorized domains → add the GitHub Pages domain (`<user>.github.io`).
4. Push to a public GitHub repo and enable Pages (Settings → Pages → deploy from `main`, root).
