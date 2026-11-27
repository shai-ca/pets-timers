// Meal or bite, part 2: an "אכלה" at the round's food step is the meal; the wheel and the food timer agree;
// a bite's toast offers the correction. Plus: timers always show the hours.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 420*MIN, K0 = { p:'kishmish' }, at = (k, m, x) => ({ ...K0, k, t: now - m*MIN, ...x });
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const kinds = () => logOf('kishmish', 'food').map(mealKind).join(','), cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; }, step = () => { const r = routine('kishmish'); return r ? r.i : null; };
    const toastBtn = () => $q('#toastWhere #toMeal');
    // at the food step
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN }), at('pee', 15, { w:'gravel' })]);
    ok('out of the crate and after a pee: the wheel is on play, food is next', step() === 2 && routineTap('kishmish').includes('food'));
    tile('food').click();
    ok('"ate" at the food step is a meal although only an hour and a half passed', kinds() === 'meal,meal' && K().food > now - MIN && $q('#toastMsg').textContent.includes('אכלה · ארוחה') && !toastBtn());
    ok('…and the wheel moved on with it', step() === 4);
    tile('food').click();
    ok('a second "ate" in the same round is outside the food step: a bite by the two-hour rule', kinds() === 'meal,meal,bite');
    // outside the food step
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN })]);
    tile('food').click();
    ok('before the pee / poop the two-hour rule holds: a bite', kinds() === 'meal,bite' && K().food === now - 90*MIN);
    ok('a bite does not move the wheel: still "walk and potty", and the timer was not reset', step() === 1 && cur() !== 'צרכים' && +$q('#sec-food [data-since]').dataset.since === now - 90*MIN);
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('pee', 85, { w:'gravel' }), at('crate', 80)]);
    $q('[data-act=crfood]').click();
    ok('the crate card\'s "ארוחה" button is a meal, as it says', kinds() === 'meal,meal' && logOf('kishmish', 'food').pop().m === 'meal' && !!K().crate.start);
    tile('food').click();
    ok('the food tile inside the crate: the two-hour rule', kinds() === 'meal,meal,bite');
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN }), at('pee', 15, { w:'gravel' })]);
    logPlay('kishmish', 'kong');
    ok('food that came from a play kind: the two-hour rule, and the wheel stays on play', kinds() === 'meal,bite' && step() === 2);
    tile('food').click();
    ok('…the bowl after it is still the round\'s meal', kinds() === 'meal,bite,meal' && step() === 4);
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN }), at('pee', 15, { w:'gravel' }), at('nofood', 10)]);
    tile('food').click();
    ok('after "did not eat" the food step is behind her: two-hour rule', kinds() === 'meal,bite');
    // the reference is the last meal
    seed([at('food', 300), at('food', 250), at('food', 170)]);
    ok('two hours are counted from the last meal, never from a bite (300 meal, 250 bite, 170 meal)', kinds() === 'meal,bite,meal');
    // manual marks
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN }), at('pee', 15, { w:'gravel' }), at('food', 10, { m:'bite' })]);
    ok('a manual "bite" is kept even at the food step, and the wheel waits', kinds() === 'meal,bite' && step() === 2);
    seed([at('food', 90), at('food', 60, { m:'meal' }), at('food', 30, { m:'bite' })]);
    ok('manual marks are read as they are', kinds() === 'meal,meal,bite' && K().food === now - 60*MIN);
    // the toast's one-tap correction
    seed([at('crate', 200, { end: now - 100*MIN }), at('food', 90), at('crate', 80, { end: now - 20*MIN })]);
    tile('food').click();
    ok('a bite: the toast says so and offers "it was a meal"', $q('#toastMsg').textContent.includes('אכלה · ביס') && !!toastBtn() && toastBtn().textContent === 'זו הייתה ארוחה');
    toastBtn().click();
    const f = logOf('kishmish', 'food').pop();
    ok('one tap makes it a meal: marked on the entry, timer reset, button gone', f.m === 'meal' && kinds() === 'meal,meal' && K().food === f.t && !toastBtn() && $q('#toastMsg').textContent.includes('אכלה · ארוחה'));
    document.getElementById('undo').click();
    ok('…and it can be undone', kinds() === 'meal,bite' && !logOf('kishmish', 'food').pop().m);
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - 30*MIN }]); tile('food').click();
    ok('Kochik: plain "ate", nothing extra', !toastBtn() && $q('#main').textContent.includes('מאז האוכל האחרון')); pet = 'kishmish';
    seed([at('food', 130), at('food', 20)]);
    // 27.11 (state reconciliation, item 5): the clock counts from the last RECORDED meal, and the label says so
    ok('Kishmish\'s food card says what its clock counts from, and the bite is on the line under it', $q('#sec-food .lbl').textContent === 'מאז הארוחה האחרונה שנרשמה' && $q('#sec-food .bite').textContent.includes(clock(now - 20*MIN)));
    // timers
    ok('a timer under an hour shows the hours: 0:23:30', dur(23*MIN + 30000) === '0:23:30' && dur(45000) === '0:00:45' && dur(HOUR + 5*MIN) === '1:05:00');
    seed([at('pee', 23, { w:'gravel' }), at('crate', 300, { end: now - 40*MIN }), at('sleep', 290, { end: now - 40*MIN })]);
    ok('on the tiles: since the last pee, awake for', /^0:23:\d\d$/.test($q('#sec-potty [data-since]').textContent) && /^0:40:\d\d$/.test($q('#sec-rest [data-since]').textContent));
    ok('short countdowns keep minutes:seconds', mmss(9*MIN + 32000) === '9:32');
    done();
  } catch(e){ crashed(e); }
})();
