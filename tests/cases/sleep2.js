// The sleep estimate after the move to the mesh crate: her own time to fall asleep, per crate; nothing over
// recorded activity; nothing at all until there are five marked "נרדמה" in that crate. Older stays keep the old rule.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 420*MIN, K0 = { p:'kishmish' }, D = 24*HOUR;
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    SLEEP2_FROM = now - 5*D;
    // n earlier stays in a crate of kind c, each with a hand-marked sleep `lat` minutes after going in
    const past = (c, lats, daysAgo = 2) => lats.flatMap((m, i) => [{ ...K0, k:'crate', t: now - daysAgo*D - i*3*HOUR, end: now - daysAgo*D - i*3*HOUR + 100*MIN, c }, { ...K0, k:'sleep', t: now - daysAgo*D - i*3*HOUR + m*MIN, end: now - daysAgo*D - i*3*HOUR + 90*MIN }]);
    const stay = (a, b, c = 'mesh') => ({ ...K0, id:'now', k:'crate', t: now - a*MIN, ...(b != null ? { end: now - b*MIN } : {}), c });
    const mine = () => K().spans.filter(sp => sp.stay === 'now'), hint = () => { const e = $q('#sec-rest .newcrate'); return e ? e.textContent : ''; };
    // before the cut-off nothing changes
    seed([{ ...K0, id:'old', k:'crate', t: now - 6*D, end: now - 6*D + 60*MIN }, { ...K0, k:'cry', t: now - 6*D + 20*MIN, end: now - 6*D + 25*MIN }, { ...K0, k:'water', t: now - 6*D + 40*MIN }]);
    ok('a stay from before the move is estimated exactly as it was: two minutes in, crying splits, nothing else does', canon(K().spans) === canon([{ t: now - 6*D + 2*MIN, end: now - 6*D + 20*MIN, assumed: true, stay: 'old' }, { t: now - 6*D + 27*MIN, end: now - 6*D + 60*MIN, assumed: true, stay: 'old' }]));
    // a new crate: nothing is estimated
    seed([stay(40)]);
    ok('a crate with no marked sleeps: no estimate, and the sleep card asks for a mark', mine().length === 0 && !K().sleep.start && hint() === 'כלוב חדש: סמנו ידנית מתי נרדמה (0 מתוך 5)' && !$q('.zz'));
    seed(past('mesh', [10, 12, 14, 16]).concat([stay(40)]));
    ok('four marks are not enough', mine().length === 0 && hint().includes('(4 מתוך 5)'));
    seed(past('mesh', [10, 12, 14, 16, 30]).concat([stay(40)]));
    ok('five: asleep from her median delay (14 minutes), and the request is gone', mine().length === 1 && mine()[0].t === now - 40*MIN + 14*MIN && mine()[0].end === null && K().sleep.assumed === true && hint() === '');
    seed(past('box', [10, 12, 14, 16, 30]).concat([stay(40)]));
    ok('marks from the other crate do not count for this one', mine().length === 0 && hint().includes('(0 מתוך 5)'));
    seed(past('box', [3, 4, 5, 6, 7]).concat(past('mesh', [20, 22, 24, 26, 28], 3), [stay(40, null, 'box')]));
    ok('each crate has its own delay', mine()[0].t === now - 40*MIN + 5*MIN);
    seed(past('mesh', [1, 2, 3, 4, 5, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]).concat([stay(40)]));
    ok('the last ten marks are what counts', mine()[0].t === now - 40*MIN + 20*MIN);
    // activity
    const base5 = past('mesh', [10, 10, 10, 10, 10]);
    seed(base5.concat([stay(90), { ...K0, k:'play', t: now - 85*MIN, y:'kong' }, { ...K0, k:'food', t: now - 85*MIN, y:'play' }]));
    ok('a kong five minutes in: asleep ten minutes after it, not after going in', mine().length === 1 && mine()[0].t === now - 75*MIN);
    seed(base5.concat([stay(90), { ...K0, k:'water', t: now - 50*MIN }]));
    ok('a drink in the middle splits the estimate: nothing over it, and again ten minutes later', mine().length === 2 && mine()[0].t === now - 80*MIN && mine()[0].end === now - 50*MIN && mine()[1].t === now - 40*MIN);
    seed(base5.concat([stay(90), { ...K0, k:'food', t: now - 5*MIN }]));
    ok('she ate five minutes ago: not asleep now', !K().sleep.start && mine().length === 1 && mine()[0].end === now - 5*MIN);
    seed(base5.concat([stay(90), { ...K0, k:'cry', t: now - 70*MIN, end: now - 60*MIN }]));
    ok('crying splits it as before, with her delay after it', mine().length === 2 && mine()[1].t === now - 50*MIN);
    seed(base5.concat([stay(30), { ...K0, k:'water', t: now - 22*MIN }, { ...K0, k:'food', t: now - 14*MIN }, { ...K0, k:'play', t: now - 6*MIN, y:'lick' }]));
    ok('activity every few minutes: no estimate at all', mine().length === 0 && !K().sleep.start);
    // a stay's estimate does not move when more marks arrive later
    seed(base5.concat([stay(300, 200)]));
    const before = canon(mine());
    state.log.push({ ...K0, k:'crate', t: now - 150*MIN, end: now - 60*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 110*MIN, end: now - 70*MIN }); state.log.sort((a, b) => a.t - b.t); use(state); render();
    ok('a later mark (40 minutes) does not change an earlier stay\'s estimate', canon(mine()) === before && sleepSamples('kishmish', state.log, now).length === 6);
    // "woke up" on an estimate is not a mark of when she fell asleep
    seed(base5.concat([stay(60)]));
    $q('[data-act=dur][data-k=sleep]').click();
    const w = logOf('kishmish', 'sleep').pop();
    ok('"woke up" on an estimated sleep writes an entry flagged as the app\'s estimate, and it is not a sample', w.a === 1 && w.t === now - 50*MIN && sleepSamples('kishmish', state.log, now).length === 5);
    seed([{ ...K0, k:'crate', t: now - 8*D, end: now - 8*D + 60*MIN }, { ...K0, k:'sleep', t: now - 8*D + 2*MIN, end: now - 8*D + 50*MIN }, { ...K0, k:'crate', t: now - 7*D, end: now - 7*D + 60*MIN }, { ...K0, k:'sleep', t: now - 7*D + 9*MIN, end: now - 7*D + 50*MIN }]);
    ok('older entries sitting exactly on the two-minute mark are not samples either; a hand-marked one is', canon(sleepSamples('kishmish', state.log, now).map(x => [x.c, x.lat])) === canon([['box', 9*MIN]]));
    // a change of crate in the middle of a stay: from there on the NEW crate's rule, wherever the stay began
    const boxStay = { ...K0, id:'now', k:'crate', t: now - 6*D, end: now - 6*D + 120*MIN, c:'box' }, swapAt = m => ({ ...K0, k:'swap', t: now - 6*D + m*MIN, c:'mesh' });
    seed([boxStay, swapAt(60)]);
    ok('a stay that began in the box before the move, then a change to the mesh crate with no marks there: the box part keeps its estimate, the mesh part has none', canon(mine()) === canon([{ t: now - 6*D + 2*MIN, end: now - 6*D + 60*MIN, assumed: true, stay: 'now' }]));
    seed(past('mesh', [10, 10, 10, 10, 10], 8).concat([boxStay, swapAt(60)]));
    ok('…and with five marks in the mesh crate, the mesh part is estimated by the mesh delay, from the change', mine().length === 2 && mine()[1].t === now - 6*D + 70*MIN && mine()[1].end === now - 6*D + 120*MIN);
    seed([boxStay, { ...K0, k:'cry', t: now - 6*D + 55*MIN, end: now - 6*D + 70*MIN }, swapAt(58)]);
    ok('the 24.11 case: moved during a cry — nothing is estimated after the cry in the new crate', mine().length === 1 && mine()[0].end === now - 6*D + 55*MIN);
    seed(past('box', [3, 3, 3, 3, 3], 3).concat([stay(120, null, 'mesh'), { ...K0, k:'swap', t: now - 60*MIN, c:'box' }]));
    ok('the other way round: from the mesh crate (no marks) into the box (five marks) — estimated from three minutes after the change', mine().length === 1 && mine()[0].t === now - 57*MIN && K().sleep.assumed === true);
    // marking by hand in the new crate, and the guard
    seed([stay(40)]); tapDur('kishmish', 'sleep');
    ok('marking "נרדמה" by hand works as always and counts towards the five', !!K().sleep.start && !K().sleep.assumed && !logOf('kishmish', 'sleep')[0].a && sleepSamples('kishmish', state.log, Date.now()).length === 1);
    seed(base5.concat([{ ...K0, id:'now', k:'crate', t: now - 200*MIN, end: now - 120*MIN, c:'mesh' }, { ...K0, k:'water', t: now - 160*MIN }, { ...K0, k:'pee', t: now - 119*MIN, w:'gravel' }]));
    const want = canon(mine()), bad = [], then = (name, fn) => { fn(); if(bg.classList.contains('show')){ const g = sh.querySelector('[data-w=gravel]') || sh.querySelector('#still'); if(g) g.click(); else close(); } if(canon(mine()) !== want) bad.push(name); };
    then('meal', () => tapPoint('kishmish', 'food')); then('water', () => tapPoint('kishmish', 'water')); then('crate in', () => tapDur('kishmish', 'crate')); then('kong', () => logPlay('kishmish', 'kong', true)); then('sleep', () => tapDur('kishmish', 'sleep')); then('woke', () => tapDur('kishmish', 'sleep')); then('swap', () => askSwap('kishmish')); then('cry', () => tapDur('kishmish', 'cry')); then('calm', () => tapDur('kishmish', 'cry')); then('out', () => tapDur('kishmish', 'crate')); then('nothing', () => tapPoint('kishmish', 'none'));
    ok('nothing done afterwards changes a finished stay\'s estimate under the new rule' + (bad.length ? ' — changed by: ' + bad.join(', ') : ''), mine().length === 2 && bad.length === 0);
    seed(base5.concat([stay(60)])); $q('.uni .r.guess').click();
    ok('an estimated row can be corrected or deleted from the list as before', bg.classList.contains('show') && !!sh.querySelector('#del') && sh.querySelector('#aIn').value === clock(now - 50*MIN));
    sh.querySelector('#del').click(); ok('deleted', mine().length === 0);
    // the awake timer counts from her last real sleep, not from leaving a crate she was awake in
    const sl = () => $q('#sec-rest .card.item');
    seed([{ ...K0, k:'crate', t: now - 140*MIN, end: now - 100*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 130*MIN, end: now - 100*MIN }, { ...K0, k:'pee', t: now - 95*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 60*MIN, end: now - 20*MIN, c:'mesh' }, { ...K0, k:'none', t: now - 18*MIN, x: 1 }]);
    ok('forty minutes awake in the crate, then out: awake since she last slept (100 minutes), not since she came out', awakeSince('kishmish') === now - 100*MIN && sl().textContent.includes('ערה כבר') && +sl().querySelector('[data-since]').dataset.since === now - 100*MIN && sl().classList.contains('warn') && $q('.cyc').textContent.includes('לכלוב לישון'));
    seed([{ ...K0, k:'crate', t: now - 140*MIN, end: now - 100*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 130*MIN, end: now - 100*MIN }, stay(50)]);
    ok('awake inside the crate: the timer runs there too, and nothing tells her to go to the crate', awakeSince('kishmish') === now - 100*MIN && sl().textContent.includes('ערה כבר') && sl().classList.contains('warn') && !$q('.cyc').textContent.includes('לכלוב לישון'));
    seed([{ ...K0, k:'crate', t: now - 60*MIN, end: now - 20*MIN, c:'mesh' }]);
    ok('no sleep known at all: it falls back to when she came out of the crate', awakeSince('kishmish') === now - 20*MIN);
    // "did she fall asleep?" — asked after five quiet minutes in the crate when nothing says she is asleep
    const q = () => $q('.sleepq');
    seed([stay(4)]); ok('four minutes in: not yet', !q());
    seed([stay(6)]);
    ok('six quiet minutes in a crate with no estimate: a small card asks, first thing in the side column', !!q() && q().textContent.includes('נרדמה?') && [...q().querySelectorAll('button')].map(b => b.textContent).join() === 'נרדמה,עדיין ערה' && $q('#side').firstElementChild === q());
    q().querySelector('[data-act=stillawake]').click();
    ok('"still awake": the card turns into a quiet countdown to the next ask, with "נרדמה" still at hand — nothing is saved', q().classList.contains('wait') && q().textContent.includes('עדיין ערה') && q().textContent.includes('נשאל שוב בעוד') && Math.abs(+q().querySelector('[data-until]').dataset.until - (Date.now() + 5*MIN)) < 3000 && !q().querySelector('[data-act=stillawake]') && !!q().querySelector('[data-act=dur][data-k=sleep]') && state.log.length === 1 && noDiff(diff(base, state)));
    awakeUntil = Date.now() - 1; q().querySelector('[data-until]').dataset.until = awakeUntil; tick(); ok('…when the countdown reaches zero the question is back by itself', !!q() && !q().classList.contains('wait') && !!q().querySelector('[data-act=stillawake]'));
    q().querySelector('[data-act=stillawake]').click(); q().querySelector('[data-act=dur][data-k=sleep]').click();
    ok('"נרדמה" during the countdown marks the sleep and removes the card', logOf('kishmish', 'sleep').length === 1 && !q());
    seed([stay(6)]);
    q().querySelector('[data-act=dur][data-k=sleep]').click();
    ok('"נרדמה" on the card is the ordinary mark, and the card goes', logOf('kishmish', 'sleep').length === 1 && !logOf('kishmish', 'sleep')[0].a && !K().sleep.assumed && !!K().sleep.start && !q());
    seed([stay(30), { ...K0, k:'water', t: now - 3*MIN }]); ok('she drank three minutes ago: the five minutes start from then', !q());
    seed([stay(30), { ...K0, k:'cry', t: now - 20*MIN, end: now - 2*MIN }]); ok('…or from when the crying stopped', !q());
    seed([stay(30), { ...K0, k:'cry', t: now - 20*MIN }]); ok('not while she is crying', !q());
    seed([stay(30), { ...K0, k:'sleep', t: now - 25*MIN, end: now - 8*MIN }]); ok('woke up eight minutes ago and still in the crate: it asks again', !!q());
    seed(base5.concat([stay(30)])); ok('where the app already estimates that she is asleep it does not ask', !q() && K().sleep.assumed === true);
    seed([{ ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }]); ok('not when she is out of the crate', !q());
    FAKE_HOUR = 2; seed([stay(10)]); ok('at night too, above the short night screen', !!$q('#side .sleepq') && !!$q('.nightc')); FAKE_HOUR = 12;
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - HOUR }]); ok('never for kochik', !q()); pet = 'kishmish';
    done();
  } catch(e){ crashed(e); }
})();
