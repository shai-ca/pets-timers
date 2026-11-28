# Backlog — things deliberately not done yet

## NEXT TASK — resolve BEFORE the night of 28.11: the night reassessment reminder (`nightRecheck`, live in logic v7, unchanged by owner's instruction)

After `RETRY.nightMax` (2) unsuccessful night attempts the retry ends and a reassessment card should appear `RETRY.nightRecheck`
(45 min) after the last one. It has two known flaws; with the real entries of the night of 27–28.11 (last exact pee 22:27,
"לא עשתה" 02:00 and 02:10, a poop on the gravel 02:28; a pee and a poop in the crate followed, 02:35–06:44) it would NOT
have appeared.
1. **The 4-hour test (`WAKE.sleepNoPee`) is measured at the last attempt** (`N.t - ref`: 3:43 at 02:10), not at the time of the
   check — by 02:55 it was over 4 hours.
2. **A poop cancels it** (`OUT_KINDS` after the last attempt includes poop), although a poop says nothing about whether she peed.

Proposed (needs the owner's OK): measure the 4 hours at the time of the check; only a pee (exact or confirmed at an unknown
time) or a real exit after the attempts cancels it. Test with the real times above. It stays a recommendation: no writes, no
sound, safety alerts unchanged. Narrow change on its own branch; one full suite; her approval before deploy.


## Design requirement: fewer manual controls as automation is validated (owner, 26.11.2026)

Long-term UX principle. As camera-based automation becomes **independently validated and reliable**, progressively take the
redundant manual controls off the primary interface:
- Replace manual buttons with compact, automatically updated **status indicators**.
- Keep manual corrections and fallback actions reachable through **progressive disclosure** (one tap into a sheet or
  fold), never removed outright.
- Scope, eventually: crate door state, occupancy, sleep, eating, drinking.
- Goal: less manual input AND less visual clutter as automation improves; stop adding controls.

**Gate per area (do not remove a control before all of these hold):**
- The automation for that area is validated against independent ground truth (not app decisions; see §15b).
- It is operational in production, including under IR / night where it applies.
- She approves the specific change.

Until then the existing controls stay as they are. Recorded only; no implementation yet.

## Documentation completeness (owner, 26.11.2026 — read before any analysis)

The owner has recently been logging mainly Kishmish's **potty events** (pee, poop, "לא עשתה", gravel outings) and much less
of her sleep, meals, play, crate visits and door actions. This is a change in **documentation completeness**, not
necessarily in her behaviour. Her goal is to keep reducing manual logging, not to keep exhaustive records. The exact start
date was not given ("recently", reported 26.11 night); establish it from the data before relying on it.

For every future analysis, model review or calibration:
- **A missing entry is not a negative observation.** No sleep entry ≠ awake; no meal ≠ not fed; no crate entry ≠ out of the crate.
- **Time since the last recorded event may be much longer than time since the actual event** (food timer, awake timer,
  sleep totals, routine step, wake-by, alerts that count from the last entry).
- **Missing sleep records must not be read as continuous wakefulness** (awake timer, sleep goal, scores, planning).
- **Predictions should carry the reduced completeness as uncertainty** (wider ranges, fewer claims), not as behaviour.
- **Never invent missing events retrospectively,** in the journal or in derived data.
- **Keep apart:** manual observations, camera predictions (estimates, suggestions) and confirmed events (approved / labelled).
- Learners trained on periods of different completeness need a completeness measure per period (e.g. entries per kind per
  day, as `kochikBaseline`'s `logging` does) before comparing periods.

Status: recorded only. No model change and no journal change without a separate investigation and her approval.


## Reduced logging — audit of 27.11 (release 5): deferred findings

Fixed in release 5: the awake timer / orange / "לכלוב לישון" from an unlogged gap, and the sleep total's wording (see
CLAUDE.md, "Reduced logging"). Not changed, for a separate decision:
1. **A camera link moved a manual crate stay hours back.** A retry stay written by a "לא עשתה" (26.11 night) was linked
   (`camjDo` `link`) to an owner-label occupancy whose door-close time was 3½ h earlier, and took that time (`cam.was`
   keeps the original). Result: one running session of almost 7 h overlapping two other camera sessions; the screen showed
   her in the crate from the early evening and estimated sleep in it. Needs a limit on how far `link` may move a start
   (and a look at retry stays), then her OK before touching the journal.
2. **"while awake" in the red pee alert, `long3` ("3 שעות מהפיפי · להוציא לחצץ") and `crateOver` ("ערה בכלוב יותר
   משעתיים")** read "no sleep logged" as awake. Thresholds untouched by rule; wording could say "לא נרשמה שינה".
3. **Food timer / 3.5 h banner / wake-by from the meal** count from the last LOGGED meal. Meals are still logged most
   days; wording "מאז האוכל האחרון שנרשם" is possible but it is a safety card — her call.
4. **Learners on mixed completeness:** `planCareDur` (crate exit → next crate entry; fewer crate entries make it longer),
   `napMedian` / `sleepOn` / `kishStats` (fewer marked naps), planning's current out-phase (`since = awakeSince`) — no
   completeness measure per period yet (see "Documentation completeness").
5. `nowState` (unused now card) says "ערה" for up to 12 h from the last logged sleep; give it `awakeUnknown` if revived.

Each item: what to check · why not now · data needed · when to look again · what success looks like.
Initial thresholds here are starting points for a review, not hard rules.

## Waiting for data

1. **Kong / lick-mat awake time in the crate (`CRATE_TREAT_AWAKE`, 25 min).**
   - **Check:** whether 25 min of assumed waking after a treat in the crate still fits.
   - **Why not now:** it rests on 2 marked cases.
   - **Data needed:** about 10 treats in the crate followed by a marked "נרדמה".
   - **Look again:** after about a week in the current crate setup.
   - **Success:** the median delay to sleep lands within ±5 min of the value used.
2. **Validation in the mesh crate (and each later setup: no cover, open door).**
   - **Check:** sleep onset, nap length and crying per setup.
   - **Why not now:** 1–2 days per setup.
   - **Data needed:** at least 7 days per setup with marked sleeps.
   - **Look again:** 2 weeks after each change.
   - **Success:** the estimates are stable from week to week, within their ranges.
3. **Time of day.**
   - **Check:** whether hour-of-day (circular smoothing, partial pooling) improves pee and nap predictions beyond waking.
   - **Why not now:** 3 days of data, 0–7 observations per hour.
   - **Data needed:** at least 14 days, and at least 8 observations in each of 3–4 time slots.
   - **Look again:** after 14 days.
   - **Success:** at least 15% lower error in a time-split backtest, stable across two windows, with no rise in prompts.
4. **Gravel success.**
   - **Check:** a separate model of the chance an outing ends in a pee, given context and how long she was on the gravel.
   - **Why not now:** about 20 pees and 35 "לא עשתה".
   - **Data needed:** at least 60 outings with the gravel clock.
   - **Look again:** in 3 weeks.
   - **Success:** fewer "לא עשתה" per pee with no rise in accidents.
5. **Care-time estimates (planning).**
   - **Check:** the learned care length against what actually happened.
   - **Why not now:** the only proxy is crate exit to crate entry, about 15 min; no real care timers exist.
   - **Data needed:** 2 more weeks.
   - **Look again:** then.
   - **Success:** predicted care within ±25% of the proxy, and fewer than 20% of "free at home" windows interrupted by logged care.
6. **Sleep continuation model.**
   - **Check:** a richer model, for example by time of day or by how long she was awake before.
   - **Why not now:** 29 marked naps. The result also swings a lot depending on how ends near a possible intervention are counted (`censorNear`).
   - **Data needed:** at least 60 marked naps.
   - **Look again:** in 3 weeks.
   - **Success:** the 25–75% wake range contains about half of real wakes, with both censoring choices giving similar ranges.
7. **Kochik's long-term baseline.**
   - **Check:** the 30-day comparison and the fixed reference weeks.
   - **Why not now:** 3.5 days of sparse logging.
   - **Data needed:** at least 21 days with pee and drink logged on most days.
   - **Look again:** then. The app stays silent until that point.
   - **Success:** "דומה" / "שונה" agrees with what the vet and owner see. Changes in logging are never read as changes in behaviour.
8. **Proven ability to stay alone.**
   - **Check:** "can go out" windows based on calm absences.
   - **Why not now:** no absences have been recorded yet.
   - **Data needed:** at least 5 calm absences at home of increasing length.
   - **Look again:** after they are recorded.
   - **Success:** offered windows are never longer than about 1.2× what she has managed calmly, and no "much distress" outcome follows an offered window.
9. **Calibration of free time.**
   - **Check:** the share of predicted free windows that turned out free.
   - **Why not now:** 3 days, and the windows are optimistic: in the backtest many had logged care inside.
   - **Data needed:** 2 weeks.
   - **Look again:** then.
   - **Success:** fewer than 20% interrupted.

10. **Sleep pressure: wake window ↔ sleep history (Kishmish), both directions.**
   - **Check:** whether preceding sleep, or sleep in the last 3/6 h, predicts the next wake window or the time from
     crate to sleep; and whether wake history predicts the next sleep's length. One predictor at a time, fixed in
     advance, against the median. A homeostatic "sleep pressure" model only if a single predictor holds up, with
     her own parameters (no human values). Keep apart: spontaneous sleep onset, the moment she is put in the
     crate, and crate-to-sleep latency.
   - **Why not now (25.11 analysis):**
     - 14 clean wake windows; every window ended when she was put in the crate (0 spontaneous onsets).
     - 19 of 43 crate stays have no sleep marked.
     - The setup changed (box → mesh, blankets off).
     - The one apparent signal (preceding sleep) reverses when tested in time order.
     - A Process-S fit was worse than the median.
     - Kochik has no sleep data at all.
   - **Data needed:**
     - at least 40 clean wake windows in one setup, over at least 7 days;
     - at least 30 crate stays with the falling-asleep time marked, and "לא נרדמה" marked where she stayed awake;
     - ideally at least 15 spontaneous sleep onsets in the open crate / pen. These are the informative ones as she
       moves toward independence.
   - **Look again:** after 7 consecutive days in the same setup with at least 80% of crate stays marked (not before
     3.12.2026).
   - **Success:** the predictor's 95% CI excludes 0, and it beats the median by at least 20% in both leave-one-out
     and time-ordered tests, in two separate weeks.
   - **Until then:** at most a descriptive line ("בדרך כלל ערה כ־X דקות (n)"). Never a countdown, deadline or
     warning, never a penalty for being awake, and never a planning target.

11. **Unknown-time pee / poop — two gaps left at deploy (26.11):** the retry card's own "פיפי" button has no
    "לא ידוע מתי" option (the ordinary pee card has it), and the "היום במבט אחד" day ribbon draws no range for these
    entries (the summary timeline does). Neither blocks use.
12. **"היא עדיין ישנה?" frequency:** now at most once per sleep, by day, only when something practical depends on it
    (1–3 a day on 23–25.11, from 12–17). The owner evaluates it in normal use before reducing it further.
13. **Camera / computer vision:** a separate project; to be integrated experimentally later, after connectivity,
    labelling and validation are ready. Not part of v3.

14. **Environmental exposure and stimulation load → sleep and wake windows (Kishmish).** Part of the research in
    item 10, extended (owner, 26.11: after a long carrier outing she seemed much more tired and slept longer than usual).
    - **Check, one at a time, each against the current baseline** (median wake window / `sleepOn`), using leave-one-out
      and time-ordered tests:
      - duration of recent carrier outings;
      - time since the last exposure;
      - cumulative exposure over the preceding 3 / 6 / 12 / 24 h;
      - observed (marked) sleep during carrier outings;
      - recent physical activity (play, training) vs. environmental stimulation;
      - interactions with age, time of day, prior sleep and accumulated wake time — only if a main effect holds first.
    - **Rules:**
      - Carrier time is not wakefulness and not exercise (she may nap in it).
      - No invented fatigue coefficients; only associations learned from her data that beat the baseline.
      - No new mandatory logging: only the existing carrier start/stop and marked sleep.
    - **Why not now:** a single carrier outing so far, and one observation ("more tired today") is an anecdote, not a
      measurement.
    - **Data needed:**
      - at least 15 carrier outings of varied length with marked sleep afterwards;
      - at least 40 clean wake windows (item 10);
      - ideally some marked sleep inside carrier outings.
    - **Look again:** together with item 10 (not before 3.12.2026), or when 15 outings are logged.
    - **Success:** the variable's 95% CI excludes 0 and it beats the baseline by at least 20% in both tests over two
      separate weeks. Until then it is shown nowhere and changes no prediction or plan.

## Kept from earlier sessions

- Re-run the planning backtest after more days in the mesh crate.
- Order of two entries logged with the same minute via "when?" (typed times have no seconds).
- Keep the screen on while the gravel clock runs (Wake Lock), tested in the iPhone home-screen app.
- Kochik's medicines: evening doses on a full stomach, morning doses before food; check against the medicine windows and planning, and show any contradictions before changing.
- Push notifications for wake-by, "היא עדיין ישנה?" and the pee window, with the app closed (service worker + Web Push; iOS only from the home screen).
- Reward treats after a gravel success are not food. If they are ever logged, keep them out of every food calculation.
- Scores: the review findings (estimated sleep counts toward the sleep ring; "readiness" penalises awake time; the pen pad is counted as a miss; the night hours are fixed text in "איך זה מחושב") await the owner's decision.
