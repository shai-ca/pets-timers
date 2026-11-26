// "היא עדיין ישנה?" (owner, 25.11): after her expected wake while still recorded asleep; not at night; not past wake-by.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, h = new Date(now).getHours();
    if(h < 9 || h >= 21){ ok('skipped (needs daytime: night sleeps get no question)', true); done(); return; }
    const card = () => $q('.sleepq.still');
    const nap = () => kishStats(Date.now()).nap;   // with little data: the fallback (an hour)
    // asleep 30 min: not yet
    seed([{...K0, k:'pee', t: now - 40*MIN, w:'gravel'}, {...K0, k:'food', t: now - 35*MIN, m:'meal'}, {...K0, k:'sleep', t: now - 30*MIN}]);
    ok('asleep for less than her usual nap: no question', !card());
    // asleep past her usual nap, wake-by not reached
    const st = now - nap() - 5*MIN;
    // owner, 26.11: asked only when something practical depends on it — here her pee window (by age) is open
    const L = [{...K0, k:'pee', t: now - 160*MIN, w:'gravel'}, {...K0, k:'food', t: st - 5*MIN, m:'meal'}, {...K0, k:'sleep', t: st}];
    seed(L);
    ok('past her expected wake, still marked asleep: the card asks, with two buttons', !!card() && card().textContent.includes('היא עדיין ישנה?') && !!card().querySelector('[data-act=wokeup]') && !!card().querySelector('[data-act=stillasleep]'));
    ok('…in the side column, styled like "נרדמה?"', !!$q('#side .card.slim.sleepq.still'));
    card().querySelector('[data-act=stillasleep]').click();
    ok('"עדיין ישנה": hidden for 20 minutes, nothing saved', !card() && stillUntil - Date.now() > 19*MIN && stillUntil - Date.now() <= 20*MIN && logOf('kishmish', 'sleep')[0].end == null);
    stillUntil = 0; stillDone.clear(); render();
    card().querySelector('[data-act=wokeup]').click();
    ok('"התעוררה": the sleep ends now (with "when?" in the app)', logOf('kishmish', 'sleep')[0].end != null && !card() && !K().sleep.start);
    ASK_WHEN = true; seed(L); card().querySelector('[data-act=wokeup]').click();
    ok('…and it asks when, like every other button', bg.classList.contains('show') && sh.textContent.includes('מתי'));
    sh.querySelector('[data-m="10"]').click();
    ok('"10 minutes ago": the sleep ends then', Math.abs(logOf('kishmish', 'sleep')[0].end - (Date.now() - 10*MIN)) < 2000);
    ASK_WHEN = false;
    // an estimated sleep in the crate counts too
    seed([{...K0, k:'pee', t: now - 160*MIN, w:'gravel'}, {...K0, k:'crate', t: st - 2*MIN}]);
    ok('an estimated sleep (in the crate) past her usual nap: the card too', K().sleep.assumed && (!!card() || Date.now() < K().sleep.start + nap()));
    // past wake-by: no question, "wake her" stays
    seed([{...K0, k:'pee', t: now - 250*MIN, w:'gravel'}, {...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'sleep', t: now - nap() - 10*MIN}]);
    ok('past wake-by (4 h from the pee): no card, "כדאי להעיר אותה" instead', !card() && wakeBy('kishmish').past && $q('#sec-rest').textContent.includes('כדאי להעיר אותה'));
    // a night sleep
    const n = new Date(now); n.setDate(n.getDate() - 1); n.setHours(23, 30, 0, 0);
    seed([{...K0, k:'pee', t: n.getTime() - 10*MIN, w:'gravel'}, {...K0, k:'sleep', t: n.getTime()}]);
    ok('a night sleep: never', !card());
    ok('the number lives in WAKE: 20 minutes', WAKE.askAgain === 20*MIN);
    done();
  } catch(e){ crashed(e); }
})();
