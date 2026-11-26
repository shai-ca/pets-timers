// In the crate she is assumed asleep a couple of minutes after going in — unless something says otherwise.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, near = (a, b) => Math.abs(a - b) < 3000, A = ASSUME_SLEEP;
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }]);
    ok('asleep from two minutes after going in, with nothing written to the list', K().sleep.start === now - 30*MIN + A && K().sleep.assumed === true && state.log.length === 1 && noDiff(diff(base, state)));
    ok('the tile, the wheel and the list say it is an assumption', $q('#sec-rest').textContent.includes('ישנה כנראה כבר') && $q('#sec-rest').textContent.includes('לפי הנחה') && $q('.zz').textContent.includes('ישנה כנראה') && !!$q('.rc .zzi') && $q('.uni .r.guess').textContent.includes('ישנה כנראה עכשיו'));
    seed([{ p:'kishmish', k:'crate', t: now - MIN }]);
    ok('not yet in the first two minutes', !K().sleep.start && !$q('.zz'));
    state.log[0].t = now - 6*MIN; render();
    ok('it begins by the clock, with no tap', !!K().sleep.start && K().sleep.assumed);
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }, { p:'kishmish', k:'cry', t: now - 30*MIN, end: now - 24*MIN }]);
    ok('crying when she goes in: asleep two minutes after it stops', K().sleep.start === now - 24*MIN + A);
    seed([{ p:'kishmish', k:'crate', t: now - 60*MIN }, { p:'kishmish', k:'cry', t: now - 30*MIN, end: now - 25*MIN }]);
    ok('crying in the middle splits the sleep in two', K().spans.length === 2 && K().spans[0].end === now - 30*MIN && K().sleep.start === now - 25*MIN + A && near(todayTotal('kishmish', 'sleep'), (28 + 23)*MIN));
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }, { p:'kishmish', k:'cry', t: now - 5*MIN }]);
    ok('while she cries she is awake', !K().sleep.start && K().sleep.lastEnd === now - 5*MIN && !$q('.zz'));
    seed([{ p:'kishmish', k:'crate', t: now - 60*MIN }, { p:'kishmish', k:'sleep', t: now - 40*MIN, end: now - 20*MIN }]);
    ok('a sleep she logged herself in that stay switches the assumption off', K().spans.length === 1 && !K().spans[0].assumed && !K().sleep.start && K().sleep.lastEnd === now - 20*MIN);
    // waking up while asleep by assumption
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }]);
    ok('the sleep tile offers "woke up"', $q('[data-act=dur][data-k=sleep]').textContent === ITEMS.sleep.stop);
    $q('[data-act=dur][data-k=sleep]').click();
    const sl = logOf('kishmish', 'sleep')[0];
    ok('"woke up" turns the assumption into a real entry, and she is awake in the crate from then', !!sl && sl.t === now - 30*MIN + A && near(sl.end, now) && !K().sleep.start && !!K().crate.start);
    // saying what really happened, from the list
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }]);
    $q('.uni .r.guess').click();
    ok('tapping the assumed row opens a sheet about that stay', sh.querySelector('h3').textContent.includes('משוער') && sh.querySelector('#aIn').value === clock(now - 30*MIN + A));
    sh.querySelector('#aIn').value = clock(now - 20*MIN); sh.querySelector('#ok').click();
    ok('setting the real time writes a sleep entry; no longer an assumption', logOf('kishmish', 'sleep').length === 1 && clock(K().sleep.start) === clock(now - 20*MIN) && !K().sleep.assumed && !$q('.uni .r.guess'));
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }]);
    $q('[data-act=edit][data-k=sleep]').click(); ok('the tile\'s "start time" link opens the same sheet', sh.querySelector('h3').textContent.includes('משוער'));
    sh.querySelector('#del').click();
    ok('"did not sleep in this stay" removes the assumption for it', canon(state.log[0].nsx) === canon([now - 30*MIN + A]) && !K().sleep.start && K().spans.length === 0 && logOf('kishmish', 'sleep').length === 0);
    // leaving the crate
    seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }]);
    tapDur('kishmish', 'crate');
    ok('out of the crate: the assumed sleep ends with the stay, still nothing written as sleep', !K().sleep.start && K().sleep.lastEnd === logOf('kishmish', 'crate')[0].end && logOf('kishmish', 'sleep').length === 0);
    ok('totals, list and text all count it', near(stats('kishmish', midnight(), midnight() + 24*HOUR).sleep.ms, 28*MIN) && near(todayTotal('kishmish', 'sleep'), 28*MIN) && $q('.uni .r.guess').textContent.includes('משוער') && logText('kishmish', midnight(), midnight() + 24*HOUR).includes('ישנה (משוער)'));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('the timeline draws it as a lighter band', !!$q('.tl-t .b.sleep.guess')); view = 'now';
    // it counts as asleep for the reminders
    seed([{ p:'kishmish', k:'pee', t: now - 6.5*HOUR, w:'gravel' }, { p:'kishmish', k:'food', t: now - HOUR }, { p:'kishmish', k:'crate', t: now - 30*MIN }]);
    ok('asleep by assumption: no "take her out" and no vet alert meanwhile', !$q('.duemsg') && $n('.card.alertc') === 0);
    ok('no "she usually falls asleep after…" line: the assumption is a fixed two minutes', typeof typicalSleep === 'undefined' && !$q('#sec-rest').textContent.includes('בדרך כלל נרדמת'));
    // GUARD (24.11: a 19-minute assumed sleep vanished when the stay it was in came to count as a retry wait).
    // Once a stay is over, its assumed sleep changes only through what the owner does to that stay.
    const K0 = { p:'kishmish' };
    seed([{ ...K0, k:'crate', t: now - 380*MIN, end: now - 300*MIN }, { ...K0, k:'pee', t: now - 298*MIN, w:'gravel' }, { ...K0, k:'none', t: now - 140*MIN }, { ...K0, id:'short', k:'crate', t: now - 140*MIN + 1, end: now - 119*MIN }]);
    const mine = () => canon(K().spans.filter(sp => sp.end != null && sp.end <= now - 100*MIN)), total = () => K().spans.filter(sp => sp.end != null && sp.end <= now - 100*MIN).reduce((m, sp) => m + sp.end - sp.t, 0);
    const want = mine(), wantTotal = total(), changed = [];
    ok('a 21-minute stay right after "nothing" is a retry wait — and still has its assumed sleep', isRetryStay(state.log.find(e => e.id === 'short')) && K().spans.some(sp => sp.stay === 'short' && sp.t === now - 140*MIN + 1 + A && sp.end === now - 119*MIN) && wantTotal === 78*MIN + 19*MIN - 1);
    const then = (name, fn) => { fn(); if(bg.classList.contains('show')){ const g = sh.querySelector('[data-w=gravel]'); if(g) g.click(); else close(); } if(mine() !== want || total() !== wantTotal) changed.push(name); };
    then('nothing (starts a retry, back into the crate)', () => tile('none').click());
    then('nothing on the retry card', () => $q('.card.retry [data-act=pt][data-k=none]').click());
    then('pee on the retry card', () => $q('.card.retry [data-act=pt][data-k=pee]').click());
    then('poop', () => tapPoint('kishmish', 'poop'));
    then('meal', () => tapPoint('kishmish', 'food'));
    then('did not eat', () => logNoFood('kishmish', true));
    then('water', () => tapPoint('kishmish', 'water'));
    then('play', () => logPlay('kishmish', 'rope', true));
    then('play with food', () => logPlay('kishmish', 'kong', true));
    then('into the crate', () => tapDur('kishmish', 'crate'));
    then('crying now', () => tapDur('kishmish', 'cry'));
    then('crying stops', () => tapDur('kishmish', 'cry'));
    then('out of the crate', () => tapDur('kishmish', 'crate'));
    then('nothing again', () => tapPoint('kishmish', 'none'));
    then('closing the retry card', () => { const x = $q('[data-act=rtstop]'); if(x) x.click(); });
    then('a pee logged for an hour ago', () => tapPoint('kishmish', 'pee', now - 60*MIN));
    then('a sleep logged now', () => tapDur('kishmish', 'sleep'));
    then('night', () => { FAKE_HOUR = 2; render(); FAKE_HOUR = 12; render(); });
    ok('nothing done afterwards changes a finished stay\'s assumed sleep or the total' + (changed.length ? ' — changed by: ' + changed.join(', ') : ''), changed.length === 0);
    state.log.find(e => e.id === 'short').ns = 1; use(state); render();
    ok('…only what she says about that stay does', mine() !== want && !K().spans.some(sp => sp.stay === 'short'));
    // EACH QUIET STRETCH ON ITS OWN: a stay with a cry in the middle has two pieces, P1 · cry · P2.
    const split = (extra = []) => seed([{ ...K0, id:'st', k:'crate', t: now - 90*MIN }, { ...K0, k:'cry', t: now - 50*MIN, end: now - 45*MIN }].concat(extra));
    const P1 = canon({ t: now - 88*MIN, end: now - 50*MIN, assumed: true, stay: 'st' }), has1 = () => K().spans.some(sp => canon(sp) === P1), p2 = () => K().spans.find(sp => sp.t >= now - 45*MIN);
    split();
    ok('two pieces: one up to the cry, one from two minutes after it', K().spans.length === 2 && has1() && p2().t === now - 43*MIN && p2().end === null && $n('.uni .r.guess') === 2);
    $q('[data-act=dur][data-k=sleep]').click();
    ok('"woke up" in the second piece: it becomes a real entry — and the first piece is still there, untouched', has1() && logOf('kishmish', 'sleep').length === 1 && logOf('kishmish', 'sleep')[0].t === now - 43*MIN && !!logOf('kishmish', 'sleep')[0].end && !K().sleep.start && !!K().crate.start);
    logOf('kishmish', 'sleep')[0].end = now - 20*MIN; use(state); render();
    ok('awake in the crate after "woke up": she is not put back to sleep two minutes later', !K().sleep.start && K().spans.length === 2);
    state.log.push({ ...K0, id:'c2', k:'cry', t: now - 15*MIN, end: now - 10*MIN }); use(state); render();
    ok('…but after another cry and quiet, a new piece begins two minutes later', K().sleep.assumed === true && K().sleep.start === now - 8*MIN && has1());
    split(); tapDur('kishmish', 'crate');
    ok('"out of the crate" in the second piece ends it then; the first is unchanged', has1() && p2().end === logOf('kishmish', 'crate')[0].end && K().spans.length === 2);
    split(); $q('.uni .r.guess[data-t="' + (now - 43*MIN) + '"]').click();
    ok('tapping a piece opens the sheet for that piece', sh.querySelector('#aIn').value === clock(now - 43*MIN) && sh.querySelector('#del').textContent === 'לא ישנה כאן');
    sh.querySelector('#aIn').value = clock(now - 30*MIN); sh.querySelector('#ok').click();
    ok('correcting the second piece changes only it', has1() && K().spans.length === 2 && clock(K().sleep.start) === clock(now - 30*MIN) && !K().sleep.assumed);
    split(); $q('.uni .r.guess[data-t="' + (now - 88*MIN) + '"]').click(); sh.querySelector('#aIn').value = clock(now - 70*MIN); sh.querySelector('#bIn').value = clock(now - 55*MIN); sh.querySelector('#ok').click();
    ok('correcting the first piece changes only it', !has1() && K().spans.length === 2 && clock(K().spans[0].t) === clock(now - 70*MIN) && !K().spans[0].assumed && p2().assumed === true && p2().t === now - 43*MIN);
    split(); $q('.uni .r.guess[data-t="' + (now - 88*MIN) + '"]').click(); sh.querySelector('#del').click();
    ok('"did not sleep here" on the first piece removes that piece only', !has1() && K().spans.length === 1 && p2().t === now - 43*MIN && canon(state.log.find(e => e.id === 'st').nsx) === canon([now - 88*MIN]));
    $q('#undo').click(); ok('undo brings it back', has1() && K().spans.length === 2);
    split(); state.log.find(e => e.id === 'st').ns = 1; use(state); render(); ok('an old whole-stay "did not sleep" mark still removes every piece', K().spans.length === 0);
    split([{ ...K0, k:'sleep', t: now - 80*MIN, end: now - 60*MIN }]);
    ok('a sleep she logged by hand in the first stretch is the truth there; the second is still assumed', K().spans.length === 2 && !K().spans[0].assumed && K().spans[0].t === now - 80*MIN && p2().assumed === true);
    // the guard again, on a finished split stay
    seed([{ ...K0, id:'st', k:'crate', t: now - 200*MIN, end: now - 110*MIN }, { ...K0, k:'cry', t: now - 160*MIN, end: now - 155*MIN }, { ...K0, k:'pee', t: now - 108*MIN, w:'gravel' }]);
    const want2 = mine(), bad2 = [], then2 = (name, fn) => { fn(); if(bg.classList.contains('show')){ const g = sh.querySelector('[data-w=gravel]'); if(g) g.click(); else close(); } if(mine() !== want2) bad2.push(name); };
    then2('nothing', () => tile('none').click()); then2('pee on the card', () => { const b = $q('.card.retry [data-act=pt][data-k=pee]'); if(b) b.click(); }); then2('crate in', () => tapDur('kishmish', 'crate')); then2('woke up', () => tapDur('kishmish', 'sleep')); then2('cry', () => tapDur('kishmish', 'cry')); then2('cry stops', () => tapDur('kishmish', 'cry')); then2('crate out', () => tapDur('kishmish', 'crate')); then2('meal', () => tapPoint('kishmish', 'food'));
    ok('nothing done afterwards changes the two pieces of a finished stay' + (bad2.length ? ' — changed by: ' + bad2.join(', ') : ''), K().spans.filter(sp => sp.stay === 'st').length === 2 && bad2.length === 0);
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - HOUR }]); ok('nothing is assumed for kochik', KO().spans.length === 0); pet = 'kishmish';
    done();
  } catch(e){ crashed(e); }
})();
