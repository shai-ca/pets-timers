// "ניסיון חוזר", version 2: it starts only when she really should need to pee; the crate entry is written with
// the "לא עשתה"; the card is one quiet row with a countdown and two buttons.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, card = () => $q('.card.retry'), cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; };
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const K0 = { p:'kishmish' }, stays = () => logOf('kishmish', 'crate'), today = [midnight(), midnight() + 24*HOUR], near = (a, b) => Math.abs(a - b) < 3000;
    const pee = m => ({ ...K0, k:'pee', t: now - m*MIN, w:'gravel' });
    // when it does not start
    seed([{ ...K0, k:'crate', t: now - 200*MIN, end: now - 100*MIN }, pee(40)]);
    tile('none').click();
    ok('"nothing" 40 minutes after a pee, long after waking and no meal: only a note in the list', !card() && stays().length === 1 && !K().crate.start && !$q('.card.playc.locked') && logOf('kishmish', 'none').length === 1 && $q('.uni').textContent.includes(ITEMS.none.log));
    // each reason on its own
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN }, pee(125)]);
    tile('none').click();
    ok('more than two hours since a pee: a retry', !!card() && stays().length === 2 && !!K().crate.start);
    const N = logOf('kishmish', 'none')[0], C = stays()[1];
    ok('the crate entry is written with it, by itself, a moment after the "nothing"', C.t === N.t + 1 && !('r' in C) && isRetryStay(C));
    ok('one quiet row: countdown from ten minutes, two buttons, a small ×', card().classList.contains('slim') && card().classList.contains('wait') && near(+$q('.card.retry [data-until]').dataset.until, now + 10*MIN) && card().textContent.includes('לנסות שוב בעוד') && $n('.card.retry .go, .card.retry .btn') === 2 && !!$q('[data-act=rtpee]') && !!$q('[data-act=rtnone]') && !!$q('.rt-x[data-act=rtstop]') && !$q('[data-act=rtcrate]') && !card().textContent.includes('שתתה'));
    ok('first thing on the page; play and free time locked, food available; a new round', $q('#side').firstElementChild === card() && !!$q('.card.playc.locked') && $q('.card.slim.locked').textContent.includes('אחרי פיפי') && !tile('food').disabled && roundStarts('kishmish').length === 2 && cur() === 'כלוב');
    $q('#undo').click();
    ok('undo takes back the "nothing" and the crate entry together', logOf('kishmish', 'none').length === 0 && stays().length === 1 && !card());
    seed([{ ...K0, k:'crate', t: now - 200*MIN, end: now - 10*MIN }, pee(70)]);
    tile('none').click(); ok('ten minutes after coming out of the crate, no pee since: a retry', !!card() && stays().length === 2);
    seed([{ ...K0, k:'sleep', t: now - 200*MIN, end: now - 15*MIN }, pee(70)]);
    tile('none').click(); ok('after waking up: a retry', !!card());
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 110*MIN }, pee(70), { ...K0, k:'food', t: now - 20*MIN }]);
    tile('none').click(); ok('twenty minutes after a meal, no pee since: a retry', !!card());
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 110*MIN }, { ...K0, k:'food', t: now - 50*MIN }, pee(40)]);
    tile('none').click(); ok('…but not when she has peed since the meal', !card());
    const rhythm = [0, 60, 120, 180, 240].map(m => pee(400 - m));   // a pee every hour, the last one 160 minutes ago
    seed([{ ...K0, k:'crate', t: now - 600*MIN, end: now - 420*MIN }].concat(rhythm, [pee(50)]));
    tile('none').click(); ok('50 minutes after a pee when she usually goes every hour or more: not yet', !card());
    seed([{ ...K0, k:'crate', t: now - 600*MIN, end: now - 420*MIN }].concat(rhythm, [pee(65)]));
    tile('none').click(); ok('65 minutes after: her usual time has come — a retry', !!card());
    seed([]); tile('none').click(); ok('no pee logged at all: a retry', !!card());
    // the countdown and what the row says
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 160*MIN }, pee(150)]);
    tile('none').click();
    const wait = () => stays()[1], shift = m => { const d = wait().t - (now - m*MIN); logOf('kishmish', 'none').forEach(e => e.t -= d); wait().t -= d; if(wait().end) wait().end -= d; use(state); render(); };
    shift(4); ok('four minutes in: six to go', card().classList.contains('wait') && near(+$q('.card.retry [data-until]').dataset.until, now + 6*MIN) && !K().sleep.start);
    shift(11); ok('time is up: the row says "to the gravel", nothing else changes', card().classList.contains('due') && $q('.rt-go').textContent === 'לחצץ' && !$q('.card.retry [data-until]') && !!$q('[data-act=rtpee]'));
    ok('a retry wait is not a nap: no sleep is assumed in it', !K().sleep.start && K().spans.length === 1 && !$q('.uni .r.guess[data-stay="' + wait().id + '"]'));
    shift(4); tapDur('kishmish', 'sleep');
    ok('she fell asleep in the crate (marked): the countdown stops — "when she wakes, straight to the gravel"', card().classList.contains('asleep') && card().textContent.includes('כשהיא מתעוררת, ישר לחצץ') && !$q('.card.retry [data-until]'));
    tapDur('kishmish', 'sleep'); ok('awake again: back to the countdown', card().classList.contains('wait'));
    tapDur('kishmish', 'crate'); ok('taken out with no result yet: "what happened on the gravel?"', card().classList.contains('again') && card().textContent.includes('מה קרה בחצץ'));
    // the two buttons
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 40*MIN }, pee(130), { ...K0, k:'none', t: now - 25*MIN }, { ...K0, k:'crate', t: now - 25*MIN + 1 }]);
    $q('[data-act=rtnone]').click();
    ok('"nothing" on the card: out and straight back in, attempt 2, a fresh countdown', stays().length === 3 && !!stays()[1].end && !stays()[2].end && card().classList.contains('wait') && card().textContent.includes('ניסיון חוזר 2') && near(+$q('.card.retry [data-until]').dataset.until, now + 10*MIN));
    stays()[1].end = now - 16*MIN; logOf('kishmish', 'none')[1].t = now - 16*MIN; stays()[2].t = now - 16*MIN + 1; use(state); render();
    $q('[data-act=rtpee]').click();
    ok('a pee asks where', bg.classList.contains('show') && !!sh.querySelector('[data-w=gravel]')); sh.querySelector('[data-w=gravel]').click();
    ok('pee on the gravel ends the retry, unlocks play and starts free time', !card() && !$q('.card.playc.locked') && !!$q('.card.slim.free.run') && cur() === 'משחק' && !K().crate.start);
    ok('both waits are labelled in the list; one of the two ended with a pee on the gravel', ($q('.uni').textContent.match(/ניסיון חוזר/g) || []).length === 2 && canon(retryStats('kishmish', ...today)) === canon({ n: 2, good: 1 }));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('the summary counts them', $q('.rtsum').textContent.includes('ניסיונות חוזרים: 2') && $q('.rtsum').textContent.includes('הסתיימו בפיפי בחצץ: 1')); view = 'now';
    // closing, long stays, other ways it ends
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 5*MIN }, pee(130)]);
    tile('none').click(); $q('[data-act=rtstop]').click();
    ok('× closes the card and unlocks play; she is still in the crate', !card() && !$q('.card.playc.locked') && logOf('kishmish', 'none')[0].x === 1 && !!K().crate.start);
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 100*MIN }, pee(250), { ...K0, k:'none', t: now - 45*MIN }, { ...K0, k:'crate', t: now - 45*MIN + 1 }]);
    ok('still in the crate after 45 minutes: an ordinary stay, no card, sleep assumed from the half hour', !card() && !isRetryStay(stays()[1]) && retryStats('kishmish', ...today).n === 0 && K().sleep.assumed === true && K().sleep.start === stays()[1].t + RETRY.max);
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 15*MIN }, pee(130), { ...K0, k:'none', t: now - 12*MIN }, { ...K0, k:'crate', t: now - 12*MIN + 1 }]);
    tapPoint('kishmish', 'food');
    ok('eating takes her out of the crate; the card asks what happened on the gravel', !K().crate.start && card().classList.contains('again'));
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 15*MIN }, pee(130), { ...K0, k:'none', t: now - 12*MIN }, { ...K0, k:'crate', t: now - 12*MIN + 1 }]);
    tapPoint('kishmish', 'pee'); sh.querySelector('[data-w=pad]').click();
    ok('pee on the pad ends the retry too, with no free time, counted as a miss', !card() && !$q('.card.slim.free') && $q('#main').textContent.includes('פספוסים 1'));
    seed([{ ...K0, k:'none', t: now - 190*MIN }]);
    ok('a "nothing" from more than three hours ago no longer counts', !card());
    // old data from the first version still reads sensibly
    seed([{ ...K0, k:'crate', t: now - 100*MIN, end: now - 75*MIN }, { ...K0, k:'food', t: now - 70*MIN }, { ...K0, k:'none', t: now - 70*MIN },
          { ...K0, k:'crate', t: now - 68*MIN, r: 10, end: now - 23*MIN }, { ...K0, k:'none', t: now - 63*MIN, x: 1 },
          { ...K0, k:'sleep', t: now - 48*MIN, end: now - 16*MIN }, { ...K0, k:'water', t: now - 23*MIN }, pee(19), { ...K0, k:'play', t: now - 16*MIN, y:'rope' }]);
    ok('a 45-minute stay with an old mark is an ordinary stay; the wheel is on play; the sleep ends with the stay', !$q('.uni').textContent.includes('ניסיון חוזר') && cur() === 'משחק' && logOf('kishmish', 'sleep')[0].end === now - 23*MIN && !$q('.duemsg'));
    FAKE_HOUR = 2; seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 15*MIN }, pee(130), { ...K0, k:'none', t: now - 5*MIN }, { ...K0, k:'crate', t: now - 5*MIN + 1 }]);
    ok('night mode hides the card', !card()); FAKE_HOUR = 12;
    pet = 'kochik'; seed([{ p:'kochik', k:'none', t: now - MIN }]); ok('none of this on kochik', !card() && !$q('.card.slim.locked') && logOf('kochik', 'crate').length === 0);
    done();
  } catch(e){ crashed(e); }
})();
