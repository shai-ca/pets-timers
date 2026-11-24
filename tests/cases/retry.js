// "ניסיון חוזר": nothing on the gravel -> back to the crate -> out again when she cries and settles, until a pee.
// What counts as a retry is read from what happened, whether or not the card was used.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, card = () => $q('.card.retry'), cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; };
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const back = (e, m) => { e.t = now - m*MIN; state.log.sort((x, y) => x.t - y.t); use(state); render(); };
    const stays = () => logOf('kishmish', 'crate'), today = [midnight(), midnight() + 24*HOUR];
    seed([{ p:'kishmish', k:'pee', t: now - 190*MIN, w:'gravel' }, { p:'kishmish', k:'crate', t: now - 180*MIN, end: now - 40*MIN }]);
    ok('no retry card to begin with; play is open', !card() && !$q('.card.playc.locked') && retry('kishmish') === null);
    tile('none').click(); back(logOf('kishmish', 'none')[0], 30);
    ok('"nothing" -> the card, first thing on the page: back to the crate', !!card() && card().classList.contains('toCrate') && card().textContent.includes('מחזירים לכלוב') && $q('#side').firstElementChild === card());
    ok('play and free time locked "after a pee"; food stays available', !!$q('.card.playc.locked') && $n('.card.playc [data-act=play]:disabled') === 4 && $q('.card.slim.locked').textContent.includes('אחרי פיפי') && !tile('food').disabled);
    ok('the wheel stays on the potty step', cur() === 'טיול וצרכים' && $q('.cyc-n').textContent.includes('ניסיון חוזר') && $n('.card.nowt') === 0);
    $q('[data-act=rtcrate]').click(); back(stays()[1], 28);
    ok('in the crate: time in the crate and the cue, no countdown, no minutes to choose, no mark on the entry', card().classList.contains('wait') && !!$q('.card.retry [data-since]') && card().textContent.includes('שתבכה לצאת ותירגע') && !$q('.card.retry [data-until]') && !$q('[data-act=rtmin]') && !('r' in stays()[1]) && !!$q('[data-act=rtpee]') && !!$q('[data-act=rtnone]'));
    ok('going back in starts a new round like any crate entry', roundStarts('kishmish').length === 2 && cur() === 'כלוב');
    $q('[data-act=rtnone]').click(); stays()[1].end = now - 19*MIN; back(logOf('kishmish', 'none')[1], 18);
    ok('"nothing" again: she is out of the crate, back to step one, attempt 2', card().classList.contains('toCrate') && !!stays()[1].end && !K().crate.start && card().textContent.includes('ניסיון 2'));
    $q('[data-act=rtcrate]').click(); back(stays()[2], 16);
    $q('[data-act=rtpee]').click();
    ok('a pee asks where', bg.classList.contains('show') && !!sh.querySelector('[data-w=gravel]')); sh.querySelector('[data-w=gravel]').click();
    ok('pee on the gravel ends the retry, unlocks play and starts free time', !card() && !$q('.card.playc.locked') && !!$q('.card.slim.free.run') && cur() === 'משחק');
    ok('both waits are labelled retries in the list; one of the two ended with a pee on the gravel', ($q('.uni').textContent.match(/ניסיון חוזר/g) || []).length === 2 && canon(retryStats('kishmish', ...today)) === canon({ n: 2, good: 1 }));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('the summary counts them', $q('.rtsum').textContent.includes('ניסיונות חוזרים: 2') && $q('.rtsum').textContent.includes('הסתיימו בפיפי בחצץ: 1')); view = 'now';

    // after the fact: she closes the card and just does it her way
    seed([{ p:'kishmish', k:'pee', t: now - 190*MIN, w:'gravel' }, { p:'kishmish', k:'crate', t: now - 180*MIN, end: now - 40*MIN }]);
    tile('none').click(); back(logOf('kishmish', 'none')[0], 30);
    $q('[data-act=rtstop]').click();
    ok('closing the card hides it and unlocks play', !card() && !$q('.card.playc.locked') && logOf('kishmish', 'none')[0].x === 1);
    $q('[data-act=dur][data-k=crate]').click(); back(stays()[1], 26);
    $q('[data-act=dur][data-k=crate]').click(); stays()[1].end = now - 14*MIN; use(state); render();
    tapPoint('kishmish', 'pee', now - 12*MIN); sh.querySelector('[data-w=gravel]').click();
    ok('…but a short crate stay after "nothing" that ends with a pee on the gravel was a retry all the same', isRetryStay(stays()[1]) && $q('.uni').textContent.includes('ניסיון חוזר') && canon(retryStats('kishmish', ...today)) === canon({ n: 1, good: 1 }));
    seed([{ p:'kishmish', k:'crate', t: now - 180*MIN, end: now - 40*MIN }, { p:'kishmish', k:'none', t: now - 30*MIN, x: 1 }, { p:'kishmish', k:'crate', t: now - 26*MIN, end: now - 14*MIN }, { p:'kishmish', k:'none', t: now - 12*MIN }]);
    ok('ending with "nothing" counts as a retry that did not work — and calls for another', canon(retryStats('kishmish', ...today)) === canon({ n: 1, good: 0 }) && !!card() && card().classList.contains('toCrate'));
    seed([{ p:'kishmish', k:'crate', t: now - 180*MIN, end: now - 100*MIN }, { p:'kishmish', k:'none', t: now - 95*MIN }, { p:'kishmish', k:'crate', t: now - 90*MIN, end: now - 45*MIN }, { p:'kishmish', k:'pee', t: now - 40*MIN, w:'gravel' }]);
    ok('a 45-minute stay is an ordinary crate stay, not a retry', !isRetryStay(stays()[1]) && retryStats('kishmish', ...today).n === 0 && !$q('.uni').textContent.includes('ניסיון חוזר'));
    seed([{ p:'kishmish', k:'crate', t: now - 180*MIN, end: now - 100*MIN }, { p:'kishmish', k:'none', t: now - 95*MIN }, { p:'kishmish', k:'crate', t: now - 50*MIN, end: now - 40*MIN }]);
    ok('a crate stay long after the "nothing" is not a retry either', !isRetryStay(stays()[1]));

    // she already peed in this outing: a later "nothing" does not start a retry
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 40*MIN }, { p:'kishmish', k:'pee', t: now - 35*MIN, w:'gravel' }, { p:'kishmish', k:'food', t: now - 20*MIN }]);
    tile('none').click();
    ok('"nothing" after an earlier pee in the same outing: no retry, play stays open, wheel waits on the potty step', !card() && !$q('.card.playc.locked') && cur() === 'צרכים');
    tapDur('kishmish', 'crate'); ok('and the crate after it is an ordinary stay and a new round', !isRetryStay(stays().pop()) && roundStarts('kishmish').length === 2 && cur() === 'כלוב');
    seed([{ p:'kishmish', k:'pee', t: now - 200*MIN, w:'gravel' }, { p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 10*MIN }]);
    tile('none').click(); ok('a pee from before the last crate stay does not count: this is a retry', !!card());

    // a meal during the wait: she is out of the crate to eat, the retry goes on
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 15*MIN }, { p:'kishmish', k:'none', t: now - 12*MIN }, { p:'kishmish', k:'crate', t: now - 10*MIN }]);
    tapPoint('kishmish', 'food');
    ok('eating takes her out of the crate, and the card asks what happened on the gravel', !K().crate.start && card().classList.contains('again') && card().textContent.includes('מה קרה בחצץ'));
    // pee on the pad ends it too, but is a miss
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 5*MIN }, { p:'kishmish', k:'none', t: now - 4*MIN }]);
    tapPoint('kishmish', 'pee'); sh.querySelector('[data-w=pad]').click();
    ok('pee on the pad ends the retry, no free time, counted as a miss', !card() && !$q('.card.slim.free') && $q('#main').textContent.includes('פספוסים 1'));
    seed([{ p:'kishmish', k:'none', t: now - 190*MIN }]);
    ok('a "nothing" from more than three hours ago no longer counts', !card());
    // the two extra reminders
    seed([{ p:'kishmish', k:'pee', t: now - 185*MIN, w:'gravel' }, { p:'kishmish', k:'sleep', t: now - 150*MIN, end: now - 70*MIN }]);
    ok('awake for an hour -> "crate to sleep"; three hours since a pee -> "to the gravel"', $q('.cyc').textContent.includes('לכלוב לישון') && $q('.cyc').textContent.includes('להוציא לחצץ'));
    tapDur('kishmish', 'sleep'); ok('neither while she sleeps', !$q('.cyc').textContent.includes('לכלוב לישון') && !$q('.cyc').textContent.includes('להוציא לחצץ'));
    // the evening of 23.11: old data with the countdown mark still reads correctly
    seed([{ p:'kishmish', k:'crate', t: now - 100*MIN, end: now - 75*MIN }, { p:'kishmish', k:'food', t: now - 70*MIN }, { p:'kishmish', k:'none', t: now - 70*MIN },
          { p:'kishmish', k:'crate', t: now - 68*MIN, r: 10, end: now - 23*MIN }, { p:'kishmish', k:'none', t: now - 63*MIN, x: 1 },
          { p:'kishmish', k:'sleep', t: now - 48*MIN, end: now - 16*MIN }, { p:'kishmish', k:'water', t: now - 23*MIN }, { p:'kishmish', k:'pee', t: now - 19*MIN, w:'gravel' }, { p:'kishmish', k:'play', t: now - 16*MIN, y:'rope' }]);
    ok('a 45-minute stay with an old mark is an ordinary stay; the wheel is on play; the sleep ends with the stay', !$q('.uni').textContent.includes('ניסיון חוזר') && cur() === 'משחק' && logOf('kishmish', 'sleep')[0].end === now - 23*MIN && !$q('.duemsg'));
    pet = 'kochik'; render(); ok('none of this on kochik', !card() && !$q('.card.slim.locked'));
    done();
  } catch(e){ crashed(e); }
})();
