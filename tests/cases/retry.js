// The trainer's "ניסיון חוזר" rule: nothing on the gravel -> crate for ~10 minutes -> try again, until a pee.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, card = () => $q('.card.retry'), cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; };
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 5*MIN }, { p:'kishmish', k:'pee', t: now - 130*MIN, w:'gravel' }]);
    ok('no retry card to begin with; play is open', !card() && !$q('.card.playc.locked') && retry('kishmish') === null);
    tile('none').click();
    ok('"nothing" -> retry card on top, asking to go back to the crate for 10 minutes', !!card() && card().classList.contains('toCrate') && card().textContent.includes('חזרה לכלוב ל־10 דקות') && $q('#side').firstElementChild === card());
    ok('play and free time are locked "after a pee"; food stays available', !!$q('.card.playc.locked') && $n('.card.playc [data-act=play]:disabled') === 4 && $q('.card.slim.locked').textContent.includes('אחרי פיפי') && !tile('food').disabled);
    ok('the wheel stays on the potty step', cur() === 'טיול וצרכים' && $q('.cyc-n').textContent.includes('ניסיון חוזר') && $n('.card.nowt') === 0);
    $q('[data-act=rtmin][data-k="8"]').click();
    ok('the wait can be changed (5–15 minutes)', card().textContent.includes('ל־8 דקות') && $n('[data-act=rtmin]') === 5);
    $q('[data-act=rtmin][data-k="10"]').click(); $q('[data-act=rtcrate]').click();
    const C = () => logOf('kishmish', 'crate').filter(e => e.r).pop();
    ok('"into the crate" starts the crate and a 10-minute countdown', card().classList.contains('wait') && C().r === 10 && C().end == null && !!K().crate.start && !!$q('.card.retry [data-until]'));
    ok('going back into the crate starts a new round, like every crate entry; the wheel shows the crate', roundStarts('kishmish').length === 2 && cur() === 'כלוב' && $q('.cyc-h small').textContent.includes('סבב 2') && $q('.cyc-n').textContent.includes('ניסיון חוזר'));
    $q('[data-act=rtmin][data-k="5"]').click(); ok('the countdown can be shortened while waiting', C().r === 5);
    // the countdown runs out
    logOf('kishmish', 'none')[0].t = now - 7*MIN; C().t = now - 6*MIN; state.log.sort((x, y) => x.t - y.t); use(state); rtSeen = 'wait' + C().id; let buzz = 0; Object.defineProperty(navigator, 'vibrate', { value: () => { buzz++; return true; }, configurable: true });
    retryWatch();
    ok('time is up: alert, and the card asks to try again on the gravel', buzz === 1 && card().classList.contains('again') && card().textContent.includes('לנסות שוב בחצץ') && !!$q('[data-act=rtpee]') && !!$q('[data-act=rtnone]'));
    $q('[data-act=rtnone]').click();
    ok('"nothing" again: the stay is closed and we are back at step 1, counted as attempt 2', card().classList.contains('toCrate') && C().end != null && !K().crate.start && card().textContent.includes('ניסיון 2') && logOf('kishmish', 'none').length === 2);
    $q('[data-act=rtcrate]').click(); $q('[data-act=rtout]').click();
    ok('taken out early: straight to "try again"', card().classList.contains('again') && !K().crate.start);
    $q('[data-act=rtpee]').click();
    ok('a pee asks where', bg.classList.contains('show') && !!sh.querySelector('[data-w=gravel]'));
    sh.querySelector('[data-w=gravel]').click();
    ok('pee on the gravel ends the retry, unlocks play and starts free time', !card() && !$q('.card.playc.locked') && !!$q('.card.slim.free.run') && $q('.card.slim.free').textContent.includes('חופש: 15–20 דקות') && cur() === 'משחק');
    // pee on the pad also ends it, but is a miss
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 5*MIN }, { p:'kishmish', k:'none', t: now - 4*MIN }]);
    tapPoint('kishmish', 'pee'); sh.querySelector('[data-w=pad]').click();
    ok('pee on the pad ends the retry, no free time, counted as a miss', !card() && !$q('.card.slim.free') && $q('#main').textContent.includes('פספוסים 1'));
    // a meal during the wait: she is out of the crate to eat, the retry goes on
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 5*MIN }, { p:'kishmish', k:'none', t: now - 4*MIN }]);
    $q('[data-act=rtcrate]').click(); C().t = now - 2*MIN; state.log.sort((x, y) => x.t - y.t); use(state); tapPoint('kishmish', 'food');
    ok('a meal is allowed during a retry; eating takes her out of the crate, and the card asks to try again', logOf('kishmish', 'food').length === 1 && !K().crate.start && !!C().end && card().classList.contains('again'));
    // giving up, and leaving her in the crate
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 5*MIN }, { p:'kishmish', k:'none', t: now - 4*MIN }]);
    $q('[data-act=rtcrate]').click(); $q('[data-act=rtstop]').click();
    ok('"end the retry": the card goes, the stay becomes an ordinary crate stay', !card() && !C() && !!K().crate.start && roundStarts('kishmish').length === 2 && cur() === 'כלוב' && !$q('.cyc-n').textContent.includes('ניסיון חוזר'));
    // (seen in real use) a retry stay left running from before the latest "nothing": ending the retry clears its mark too
    seed([{ p:'kishmish', k:'none', t: now - 20*MIN }, { p:'kishmish', k:'crate', t: now - 18*MIN, r: 10 }, { p:'kishmish', k:'none', t: now - 13*MIN }]);
    $q('[data-act=rtstop]').click();
    ok('ending the retry un-marks a running retry stay even when it began before the last "nothing"', !card() && !logOf('kishmish', 'crate')[0].r && !!K().crate.start);
    // (the evening of 23.11) the "10-minute" wait became a 44-minute stay with a sleep; then water, a pee on the gravel, play
    seed([{ p:'kishmish', k:'crate', t: now - 100*MIN, end: now - 75*MIN }, { p:'kishmish', k:'food', t: now - 70*MIN }, { p:'kishmish', k:'none', t: now - 70*MIN },
          { p:'kishmish', k:'crate', t: now - 68*MIN, r: 10, end: now - 23*MIN }, { p:'kishmish', k:'none', t: now - 63*MIN, x: 1 },
          { p:'kishmish', k:'sleep', t: now - 48*MIN, end: now - 16*MIN }, { p:'kishmish', k:'water', t: now - 23*MIN }, { p:'kishmish', k:'pee', t: now - 19*MIN, w:'gravel' }, { p:'kishmish', k:'play', t: now - 16*MIN, y:'rope' }]);
    ok('a "retry" stay that ran 45 minutes is an ordinary crate stay: it starts a round', roundStarts('kishmish').length === 2 && !$q('.uni').textContent.includes('ניסיון חוזר'));
    ok('so after the pee the wheel is on play, not "round done"', cur() === 'משחק' && $q('.rl.nxt').textContent.includes('אוכל'));
    ok('the sleep she fell into in the crate ends when she left it, so no false "take her out" reminder', logOf('kishmish', 'sleep')[0].end === now - 23*MIN && !$q('.duemsg'));
    tapPoint('kishmish', 'food'); ok('and "she ate a little" moves the wheel on to the potty step', cur() === 'צרכים');
    // an old "nothing" does not keep the app in retry forever
    seed([{ p:'kishmish', k:'none', t: now - 190*MIN }]);
    ok('a "nothing" from more than three hours ago no longer counts', !card());
    // the two extra reminders
    seed([{ p:'kishmish', k:'pee', t: now - 185*MIN, w:'gravel' }, { p:'kishmish', k:'sleep', t: now - 150*MIN, end: now - 70*MIN }]);
    ok('awake for an hour -> "crate to sleep"; three hours since a pee -> "to the gravel"', $q('.cyc').textContent.includes('לכלוב לישון') && $q('.cyc').textContent.includes('להוציא לחצץ'));
    tapDur('kishmish', 'sleep'); ok('neither while she sleeps', !$q('.cyc').textContent.includes('לכלוב לישון') && !$q('.cyc').textContent.includes('להוציא לחצץ'));
    pet = 'kochik'; render(); ok('none of this on kochik', !card() && !$q('.card.slim.locked'));
    done();
  } catch(e){ crashed(e); }
})();
