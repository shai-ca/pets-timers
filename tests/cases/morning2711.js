// @clock 06:30
// @window 520,900
// Reduced logging, regression from her real morning (27.11 06:29, production): "ערה כבר 5:22:26 מ־01:07", the day's
// ribbon "בחוץ · משחק וחופש 5:15 81%", "ב־24 השעות האחרונות ישנה 10:58" and the wheel promising a camera approval —
// while between 01:11 and 04:44 and between 04:44 and 06:19 nothing at all was logged. `morning2711()` (tests/lib.js)
// is a times-only replica of that list. The owner's requirements 1–7, on the derived output and on the screen, in both
// designs; plus the night / day horizon rule (owner's refinement, 27.11) and the phone layout of the ribbon (520 px;
// morning2711w.js is the desktop one). Production rules: no simulated hour, the real media query.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null; SLEEP2_FROM = Date.UTC(2026, 10, 24, 10, 8); render();
    const p = 'kishmish', now = Date.now(), N = midnight() + 390*MIN, at = m => N + m*MIN, a0 = midnight();
    const L = morning2711(); seed(L); const log0 = JSON.stringify(state.log);
    const tileS = () => $q('#sec-rest .card.item'), cyc = () => $q('.card.cyc').textContent;
    const kindAt = t => (dayParts(p, a0, now).segs.find(s => s.a <= t && t < s.b) || {}).k;
    ok('the replica is the morning: in the crate since 06:21, not asleep, last sleep ended 01:07', !!V[p].crate.start && V[p].crate.start === at(-8) && !V[p].sleep.start && awakeSince(p) === at(-323));
    // 1. unobserved intervals are UNKNOWN; observed = the outings; inferred = a few minutes around a night sign
    ok('1. 03:00 and 05:30 (nothing logged) are "לא תועד"', kindAt(midnight() + 180*MIN) === 'unk' && kindAt(midnight() + 330*MIN) === 'unk');
    ok('1. the 01:07 outing itself is observed awake; 04:43–04:44 too', kindAt(at(-322)) === 'out' && kindAt(at(-106) + 30000) === 'out');
    ok('1. night rule: a pee at 04:44 is not 45 awake minutes — inferred for 5 minutes, unknown right after', kindAt(at(-105) + 2*MIN) === 'outi' && kindAt(at(-105) + 7*MIN) === 'unk' && kindAt(at(-105) + 30*MIN) === 'unk');
    ok('1. unknownSpans names the two undocumented stretches (01:16–04:38, 04:49–06:19)', (() => { const u = unknownSpans(p, a0, now); return u.length === 2 && u.every(x => x.b - x.a > 80*MIN); })());
    // daytime: inferred up to 45 minutes after a sign, labelled as inferred, then unknown
    { const d = dayParts(p, at(-1106), at(-1103)).tot;   // yesterday 12:04–12:07: an outing — observed
      const y = at(-906), e = dayParts(p, y + 7*MIN, y + 18*MIN);   // yesterday 15:31–15:42: after an outing, before a sleep — inferred
      ok('1. by day the outing is observed and the time after it inferred ("משוער"), not observed', d.out >= 2.5*MIN && e.tot.outi >= 10*MIN && e.tot.out === 0 && PART.outi.includes('משוער')); }
    // 2. no continuous wake timer across undocumented stretches
    ok('2. the chain starts at 06:19, awakeSince stays 01:07', awakeFrom(p) === at(-10) && awakeSince(p) === at(-323) && !awakeUnknown(p));
    ok('2. the tile: "נראתה ערה כבר" from 06:19, says 01:07–06:19 is not documented, never "ערה כבר 5:"', tileS().textContent.includes('נראתה ערה כבר') && tileS().textContent.includes('מ־' + clock(at(-10))) && tileS().textContent.includes('לא תועד') && !/ערה כבר\s*5:/.test(tileS().textContent) && +tileS().querySelector('.big[data-since]').dataset.since === at(-10) && !tileS().classList.contains('warn'));
    ok('2. no "to sleep" bar, no "לכלוב לישון" on the wheel', !sleepWindow(p) && !cyc().includes('לכלוב לישון'));
    openScores(p); ok('2. the scores sheet: "נראתה ערה מ־06:19", not "מ־01:07"', sh.textContent.includes('נראתה ערה מ־' + clock(at(-10))) && !sh.textContent.includes('מ־' + clock(at(-323)) + '.')); close();
    // 3. sleep totals say how much was not documented — one wording everywhere
    { const s = scores(p), u = unkText(s);
      ok('3. ' + u + ': hours without documentation, never added to sleep', s.unk > 4*HOUR && u.includes('שעות ללא תיעוד') && Math.abs(s.total + s.unk + dayParts(p, now - 24*HOUR, now).tot.out + dayParts(p, now - 24*HOUR, now).tot.outi + dayParts(p, now - 24*HOUR, now).tot.crate - 24*HOUR) < 2000);
      ok('3. the sleep tile carries the same line', tileS().textContent.includes('נספרה שינה של') && tileS().textContent.includes(u));
      if(V2) ok('3. the ring says it too', $q('.card.scores').textContent.includes(u));
      openScores(p); ok('3. …and the sheet', sh.textContent.includes(u) && sh.textContent.includes('לא נספר כשינה ולא כערות')); close(); }
    // 4. the day's breakdown: "לא תועד" is its own part; it all adds up
    { const t = dayParts(p, a0, now).tot;
      ok('4. sleep + crate + out + inferred + unknown = since midnight; unknown is most of the night', Math.abs(t.sleep + t.crate + t.out + t.outi + t.unk - (now - a0)) < 1000 && t.unk > 4.5*HOUR && t.out + t.outi < 40*MIN);
      if(V2){ const rb = $q('.ribbon');
        ok('4. ribbon: "לא תועד" part, total and legend; "בחוץ" no longer 81%', !!rb.querySelector('.pt.unk') && rb.querySelector('.rtot .unk').textContent.includes(hmm(t.unk)) && rb.querySelector('.rlg2').textContent.includes('לא תועד') && !rb.querySelector('.rtot .out').textContent.includes('81%') && !!rb.querySelector('.pt.outi'));
        const pcs = [...rb.querySelectorAll('.rtot small')].map(x => parseInt(x.textContent, 10));
        ok('4. the percentages add up to about 100 (' + pcs.join('+') + ')', Math.abs(pcs.reduce((x, y) => x + y, 0) - 100) <= 2);
        ok('4. the unknown part is drawn hatched (not a colour only) and says so on tap', getComputedStyle(rb.querySelector('.pt.unk')).backgroundImage.includes('repeating-linear-gradient') && rb.querySelector('.pt.unk').dataset.tip.startsWith('לא תועד'));
        // phone layout (520): four totals in one row, nothing overflows, no horizontal page scroll
        const boxes = [...rb.querySelectorAll('.rtot > div')], top = boxes.map(b => b.getBoundingClientRect().top);
        ok('4. phone (' + innerWidth + ' px, isPhone ' + isPhone() + '): four totals in a row, nothing sticks out', isPhone() && boxes.length === 4 && top.every(x => Math.abs(x - top[0]) < 2) && boxes.every(b => b.scrollWidth <= b.clientWidth + 1) && document.documentElement.scrollWidth <= innerWidth + 1 && rb.querySelector('.rlg2').getBoundingClientRect().right <= innerWidth + 1); } }
    // 5. reminders and predictions: as at 06:15, before the 06:19 outing (the same list without its last three entries)
    seed(L.filter(e => e.t < at(-11)));
    ok('5. at 06:15: no awake timer, "לא נרשמה שינה מאז 01:07 · נראתה ערה לאחרונה ב־04:44"', awakeUnknown(p) && tileS().textContent.includes('לא נרשמה שינה מאז') && tileS().textContent.includes(clock(at(-105))) && !tileS().querySelector('.big[data-since]') && !tileS().classList.contains('warn'));
    ok('5. the wheel: the step "since 01:07, not documented since", never "כבר 5 שעות"; the hour note conditional', $q('.card.cyc .rc').textContent.includes('לא תועד') && !$q('.card.cyc .rc').textContent.includes('כבר') && cyc().includes('אם היא ערה') && !/ערה כבר/.test(cyc()));
    ok('5. the scores sheet says "לא נרשמה שינה"', (() => { openScores(p); const t = sh.textContent; close(); return t.includes('עכשיו: לא נרשמה שינה'); })());
    ok('5. the three red alerts are unchanged (food after 10 h, by day)', alerts(p).map(a => a.k).join() === 'food' && $n('.alertc') === 1);
    ok('5. advice makes no awake claim', !/ערה/.test(advice(p).text + advice(p).why));
    seed(L);
    // 6. nothing written: the list is byte-identical after all of the above, in both designs
    V2 = !V2; render(); openScores(p); close(); V2 = !V2; render();
    ok('6. state.log is byte-identical (no event invented)', JSON.stringify(state.log) === log0);
    // 7. camera promises only when the camera can infer now
    const promise = () => cycleHTML(p).includes('המצלמה תציע');
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: { status: 'uncertain', capture_ts: Date.now() - MIN } }; render();
    ok('7. heartbeat fresh but "uncertain" (IR): the manual instruction, manual buttons up front', !promise() && cycleHTML(p).includes('לוחצים <b>״יצאה מהכלוב״</b>') && !$q('details.cr-more'));
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: { status: 'unavailable', capture_ts: Date.now() - MIN } }; render();
    ok('7. "unavailable": manual', !promise());
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: { status: 'positive', capture_ts: Date.now() - MIN } }; render();
    ok('7. a fresh positive reading: the camera approval', promise() && camjInferNow());
    CAMS.status = null; render();
    ok('7. IR automation stays off (flags unchanged)', CAM_FEATURES.liveSleepEstimate === false && CAM_FEATURES.irContext === true);
    // the night horizon decides the awake timer: a waking at 05:55 and a pee at 05:57, now 06:30 — by day 33 min after a
    // sign would still be "awake"; at night it is not
    seed([{ p, k:'crate', t: at(-210), end: at(-35) }, { p, k:'sleep', t: at(-205), end: at(-35) }, { p, k:'gravel', t: at(-34), end: at(-32) }, { p, k:'pee', t: at(-33), w:'gravel' }]);
    ok('night: a potty trip at 05:57 is not 30 minutes awake — no awake timer at 06:30', awakeUnknown(p) && !awakeFrom(p) && tileS().textContent.includes('לא נרשמה שינה מאז') && !tileS().querySelector('.big[data-since]'));
    seed([{ p, k:'crate', t: at(-60), end: at(-25) }, { p, k:'sleep', t: at(-55), end: at(-25) }, { p, k:'pee', t: at(-23), w:'gravel' }]);
    ok('day: a waking at 06:05 and a pee at 06:07 — "ערה כבר" from 06:05, as before', awakeFrom(p) === at(-25) && awakeFrom(p) === awakeSince(p) && tileS().textContent.includes('ערה כבר') && !tileS().textContent.includes('נראתה ערה כבר'));
    // the night routine, מסך יונתן and Kochik are untouched
    seed(L); SIMPLE = true; render(); ok('מסך יונתן: no ribbon, no "לא תועד"', !$q('.ribbon') && !$q('#main').textContent.includes('לא תועד')); SIMPLE = false; render();
    pet = 'kochik'; render(); ok("Kochik's screen: nothing about undocumented time", !($q('#main').textContent + $q('#side').textContent).includes('לא תועד') && !($q('#main').textContent + $q('#side').textContent).includes('ללא תיעוד')); pet = 'kishmish'; render();
    done();
  } catch(e){ crashed(e); }
})();
