// Release 5 — reduced logging (owner, 26.11: she logs mainly potty events, much less sleep). The awake timer counts from
// the last LOGGED sleep; it is claimed only while something shows her awake within AWAKE.seen (45 min). Shapes taken from
// her real list (times only): 26.11 morning — woke 08:38, gravel / pee / meal / water / "לא עשתה" until 09:00, a carrier
// trip 09:05–09:45 logged only afterwards; at 09:50 the app said "ערה כבר 1:11 · לכלוב לישון" (orange) from entries 50
// minutes old. 25.11 morning — in the crate from 07:23 with nothing more logged; at 08:10–09:30 "ערה כבר 1:32…2:52"
// (orange) while she was in fact asleep from 07:59 (logged later). Both designs.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), K0 = { p:'kishmish' }, p = 'kishmish';
    if(now - m0 < 300*MIN){ ok('skipped (too close to midnight)', true); done(); return; }
    const tileS = () => $q('#sec-rest .card.item'), cyc = () => $q('.card.cyc').textContent;
    const morning = [{ ...K0, k:'crate', t: now - 180*MIN, end: now - 72*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 180*MIN, end: now - 72*MIN },
      { ...K0, k:'gravel', t: now - 72*MIN, end: now - 67*MIN }, { ...K0, k:'pee', t: now - 70*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 60*MIN, m:'meal' },
      { ...K0, k:'water', t: now - 58*MIN }, { ...K0, k:'gravel', t: now - 56*MIN, end: now - 50*MIN }, { ...K0, k:'none', t: now - 50*MIN }];
    seed(morning); const log0 = JSON.stringify(state.log);
    ok('the last logged sleep is still where the timer starts (nothing re-dated)', awakeSince(p) === now - 72*MIN && awakeSeen(p) === now - 50*MIN && awakeUnknown(p));
    ok('50 minutes with nothing logged: the tile says "לא נרשמה שינה מאז" + the time, no running timer, no orange', tileS().textContent.includes('לא נרשמה שינה מאז') && tileS().textContent.includes(clock(now - 72*MIN)) && tileS().textContent.includes('נראתה ערה לאחרונה ב־') && tileS().textContent.includes(clock(now - 50*MIN)) && !tileS().textContent.includes('ערה כבר') && !tileS().querySelector('.big[data-since]') && !tileS().classList.contains('warn'));
    // 27.11 (state reconciliation, item 4): the wheel names the last RECORDED sleep — "שינה אחרונה שנרשמה HH:MM"
    ok('the wheel does not claim an hour awake: "שינה אחרונה שנרשמה … · אם היא ערה, לכלוב לישון"', cyc().includes('שינה אחרונה שנרשמה') && cyc().includes('אם היא ערה, לכלוב לישון') && !cyc().includes('ערה כבר'));
    ok('no "to sleep" bar from an unlogged gap', sleepWindow(p) === null && !tileS().querySelector('.gauge:not(.goal)'));
    ok('rendering wrote nothing', JSON.stringify(state.log) === log0);
    openScores(p); ok('the scores sheet says "לא נרשמה שינה", not "ערה, מחוץ לכלוב"', sh.textContent.includes('עכשיו: לא נרשמה שינה') && !sh.textContent.includes('ערה, מחוץ לכלוב')); close();
    // the carrier trip, once logged, shows her up and about until 5 minutes ago: the old reading, exactly
    seed(morning.concat([{ ...K0, k:'carrier', t: now - 45*MIN, end: now - 5*MIN }]));
    ok('with the carrier trip logged: "ערה כבר", orange, "לכלוב לישון" as before', !awakeUnknown(p) && tileS().textContent.includes('ערה כבר') && !!tileS().querySelector('.big[data-since]') && tileS().classList.contains('warn') && cyc().includes('לכלוב לישון') && !cyc().includes('אם היא ערה') && (!V2 || !!sleepWindow(p)));
    // the boundary: 44 minutes since the last sign -> claimed; 46 -> not
    seed([{ ...K0, k:'crate', t: now - 150*MIN, end: now - 70*MIN }, { ...K0, k:'pee', t: now - 44*MIN, w:'gravel' }]);
    ok('a pee 44 minutes ago: still "ערה כבר"', !awakeUnknown(p) && tileS().textContent.includes('ערה כבר'));
    seed([{ ...K0, k:'crate', t: now - 150*MIN, end: now - 70*MIN }, { ...K0, k:'pee', t: now - 46*MIN, w:'gravel' }]);
    ok('a pee 46 minutes ago: "לא נרשמה שינה מאז"', awakeUnknown(p) && tileS().textContent.includes('לא נרשמה שינה מאז'));
    // the first minutes after the waking need no other entry (the waking itself shows her awake)
    seed([{ ...K0, k:'crate', t: now - 150*MIN, end: now - 20*MIN }, { ...K0, k:'sleep', t: now - 140*MIN, end: now - 20*MIN }]);
    ok('20 minutes after a logged waking: "ערה כבר" as before', !awakeUnknown(p) && tileS().textContent.includes('ערה כבר'));
    // the 25.11 morning: in the crate since an hour ago, food there, nothing more (no estimate: she said "לא ישנה" for it)
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 290*MIN, end: now - 200*MIN }, { ...K0, k:'crate', t: now - 60*MIN, c:'mesh', nsx:[now - 60*MIN] }, { ...K0, k:'food', t: now - 59*MIN }]);
    ok('in the crate, nothing logged for an hour: no "ערה כבר" and no orange (the "נרדמה?" card still asks)', awakeUnknown(p) && !tileS().textContent.includes('ערה כבר') && !tileS().classList.contains('warn') && !!$q('.sleepq'));
    ok('…and the crate card does not claim "ערה בכלוב כבר" either (27.11): "בכלוב כבר … לא תועד אם ערה או ישנה"', crateAwakeNote(p).includes('לא תועד אם ערה או ישנה') && !crateAwakeNote(p).includes('ערה בכלוב') && $q('#sec-crate').textContent.includes('לא תועד אם ערה או ישנה'));
    seed(state.log.concat([{ ...K0, k:'cry', t: now - 12*MIN, end: now - 10*MIN }]));
    ok('a cry in the crate 10 minutes ago: "ערה בכלוב כבר", as before', crateAwakeNote(p).includes('ערה בכלוב כבר'));
    // a cry or a camera-confirmed exit counts as a sign like any other MEANINGFUL entry
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 290*MIN, end: now - 200*MIN }, { ...K0, k:'cry', t: now - 30*MIN, end: now - 25*MIN }]);
    ok('a cry 25 minutes ago shows her awake', !awakeUnknown(p) && tileS().textContent.includes('ערה כבר'));
    // the sleep total is a reading of the list
    seed(morning);
    ok('"below the age range" says it is by the list', SLEEP_RANGE.below.includes('לפי מה שנרשם') && (() => { openScores(p); const t = sh.textContent; close(); return scores(p).range !== 'below' || t.includes('לפי מה שנרשם'); })());
    if(V2) ok('the sleep goal line says what was counted, not that she slept', !!$q('.gauge.goal') && $q('.gauge.goal').textContent.includes('נספרה שינה של') && !$q('.gauge.goal').textContent.includes('השעות האחרונות ישנה'));
    // Kochik: no awake timer at all, nothing changes
    pet = 'kochik'; render(); ok("Kochik's screen has no awake line" + ['#main', '#side', '#sh'].map(s => $q(s) && $q(s).textContent.includes('לא נרשמה שינה מאז') ? ' in ' + s : '').join(''), !($q('#main').textContent + $q('#side').textContent).includes('לא נרשמה שינה מאז')); pet = 'kishmish'; render();
    done();
  } catch(e){ crashed(e); }
})();
