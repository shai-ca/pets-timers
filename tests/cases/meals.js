// Meal or bite: worked out from the list; the food timer, the alert and the forecasts follow meals only.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), late = now - m0 > 420*MIN, K0 = { p:'kishmish' }, food = (m, extra) => ({ ...K0, k:'food', t: now - m*MIN, ...extra });
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const kinds = () => logOf('kishmish', 'food').map(mealKind).join(','), alertText = () => [...document.querySelectorAll('.card.alertc')].map(c => c.textContent).join(' | ');
    seed([]); tile('food').click();
    ok('the first "ate" is a meal, and the toast says so', kinds() === 'meal' && $q('#toastMsg').textContent.includes('אכלה · ארוחה') && $q('.uni').textContent.includes('אכלה · ארוחה'));
    seed([food(240), food(180)]);
    ok('an hour after a meal: a bite; the timer still counts from the meal', kinds() === 'meal,bite' && K().food === now - 240*MIN && K().bite === now - 180*MIN && +$q('#sec-food [data-since]').dataset.since === now - 240*MIN);
    ok('the tile says there was a bite and that it did not reset the clock', $q('#sec-food .bite').textContent.includes('ביס אחרון ב־') && $q('#sec-food .bite').textContent.includes(clock(now - 180*MIN)));
    ok('3.5 hours since the MEAL: the alert shows although she had a bite since', $n('.card.alertc') === 1 && alertText().includes('מאז האוכל האחרון'));
    tile('food').click();
    ok('"ate" now, four hours after the meal: a meal — the alert clears, no new button was needed', kinds() === 'meal,bite,meal' && $n('.card.alertc') === 0 && $n('#sec-food .go') === 1 && $q('#toastMsg').textContent.includes('ארוחה'));
    tile('food').click();
    ok('and again a minute later: a bite', kinds() === 'meal,bite,meal,bite' && $q('#toastMsg').textContent.includes('ביס'));
    seed([food(250), food(190), food(125)]);
    ok('a bite in between does not move the reference: 2h05 after the meal is a meal', kinds() === 'meal,bite,meal');
    seed([food(250), food(131)]); ok('just under two hours: a bite', kinds() === 'meal,bite');
    seed([food(100)]); logPlay('kishmish', 'kong', true);
    ok('a kong 100 minutes after a meal is a bite', kinds() === 'meal,bite' && logOf('kishmish', 'food')[1].y === 'play');
    seed([food(200)]); logPlay('kishmish', 'lick', true);
    ok('a lick mat 200 minutes after a meal is a meal', kinds() === 'meal,meal');
    // correcting it from the list
    seed([food(240), food(180), food(150)]);
    ok('before: meal, bite, bite', kinds() === 'meal,bite,bite');
    $q('.uni .r[data-e="' + state.log.indexOf(logOf('kishmish', 'food')[1]) + '"]').click();
    ok('tapping the entry offers the two, the current one selected', sh.querySelectorAll('[data-m]').length === 2 && sh.querySelector('[data-m].sel').dataset.m === 'bite');
    sh.querySelector('[data-m=meal]').click(); sh.querySelector('#ok').click();
    ok('switched to a meal: stored on the entry, the timer follows, what comes after is judged from it', logOf('kishmish', 'food')[1].m === 'meal' && kinds() === 'meal,meal,bite' && K().food === now - 180*MIN);
    $q('.uni .r[data-e="' + state.log.indexOf(logOf('kishmish', 'food')[1]) + '"]').click(); sh.querySelector('[data-m=bite]').click(); sh.querySelector('#ok').click();
    ok('and back to a bite', kinds() === 'meal,bite,bite' && K().food === now - 240*MIN);
    $q('.uni .r[data-e="' + state.log.indexOf(logOf('kishmish', 'food')[0]) + '"]').click(); sh.querySelector('#ok').click();
    ok('opening an entry and pressing OK changes nothing', !('m' in logOf('kishmish', 'food')[0]));
    // list, text, summary
    seed([food(400), food(350), food(200), food(150)]);
    ok('the list and the text export name each one', ($q('.uni').textContent.match(/אכלה · ארוחה/g) || []).length === 2 && ($q('.uni').textContent.match(/אכלה · ביס/g) || []).length === 2 && logText('kishmish', m0, m0 + 24*HOUR).includes('אכלה · ביס') && logText('kishmish', m0, m0 + 24*HOUR).includes('אכלה · ארוחה'));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('daily summary: meals today out of four, bites beside it', $q('.mealsum').textContent.includes('ארוחות היום: 2 מתוך 4') && $q('.mealsum').textContent.includes('ביסים: 2'));
    sumMode = 'week'; render(); ok('only in the day view', !$q('.mealsum'));
    sumMode = 'day'; sumAnchor = now - 24*HOUR; render(); ok('another day: "meals: 0 of 4"', $q('.mealsum').textContent.includes('ארוחות: 0 מתוך 4')); view = 'now'; sumAnchor = now;
    // forecasts and the retry trigger look at meals only
    const at = (d, h, m) => m0 - d*24*HOUR + h*HOUR + m*MIN, A = [];
    for(let d = 1; d <= 5; d++) for(const [h, m] of [[7, 0], [12, 30], [18, 0]]) A.push({ ...K0, k:'food', t: at(d, h, m) }, { ...K0, k:'food', t: at(d, h, m + 40 + d) }, { ...K0, k:'poop', t: at(d, h, m + 60 + (d % 3)), w:'gravel' });
    seed(A);
    ok('bites are not the anchor of the poop forecast', poopModel('kishmish').anchor === 'food' && Math.abs(poopModel('kishmish').med - 61*MIN) <= MIN);
    seed([{ ...K0, k:'crate', t: now - 400*MIN, end: now - 200*MIN }, food(100), { ...K0, k:'pee', t: now - 70*MIN, w:'gravel' }, food(20)]);
    tile('none').click(); ok('a bite 20 minutes ago is not "after a meal": "nothing" stays a note', kinds() === 'meal,bite' && !$q('.card.retry'));
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - 100*MIN }, { p:'kochik', k:'food', t: now - 30*MIN }]);
    ok('kochik: plain "ate", the timer from the last one, no labels', KO().food === now - 30*MIN && !$q('#main').textContent.includes('ביס') && !$q('#main').textContent.includes('אכלה · ארוחה'));
    $q('.r[data-e]').click(); ok('…and nothing to choose in her sheet', sh.querySelectorAll('[data-m]').length === 0); close();
    done();
  } catch(e){ crashed(e); }
})();
