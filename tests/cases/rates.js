// Summary meals vs bites (Kishmish) and the gravel success-by-situation line on the potty card.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), day = m0 - 24*HOUR, P = 'kishmish', at = h => day + h*HOUR;
    // ---- step 5: meals vs bites in the summary ----
    seed([
      { p:P, k:'food', t: at(8) },                  // first → meal
      { p:P, k:'food', t: at(8.5) },                // 30 min later → bite
      { p:P, k:'food', t: at(11) },                 // 3 h after the meal → meal
      { p:P, k:'food', t: at(14), m:'bite' },       // would be a meal by the gap; her mark wins
      { p:'kochik', k:'food', t: at(8) }, { p:'kochik', k:'food', t: at(12) }, { p:'kochik', k:'food', t: at(18) },
    ]);
    ok('split counts follow mealKind, a manual mark wins', JSON.stringify(mealSplit(P, day, day + 24*HOUR)) === '{"meal":2,"bite":2}');
    const tx = logText(P, day, day + 24*HOUR);
    ok('text export total: meals and bites, no plain food count', tx.includes('ארוחות 2 · ביסים 2') && !/סה״כ:.*אוכל \d/.test(tx));
    ok('Kochik\'s export is unchanged', /סה״כ: .*אוכל 3/.test(logText('kochik', day, day + 24*HOUR)));
    view = 'sum'; sumMode = 'day'; sumAnchor = day + HOUR; render();
    const ft = $q('.tile[data-k=food]');
    ok('day: the food tile says meals and bites', ft && ft.querySelector('b').textContent === '2' && ft.textContent.includes('ארוחות · ביסים 2'));
    ft.click(); ok('the food tile still filters', !!$q('.tile.on[data-k=food]')); sumFilter = null;
    sumMode = 'week'; render();
    const row = $q(`tr[data-day="${day}"]`);
    ok('week table: "meals · bites" in the food column, with a key', row && row.textContent.includes('2 · 2') && $q('.tblc').textContent.includes('ארוחות · ביסים'));
    pet = 'kochik'; sumMode = 'day'; render();
    ok('Kochik\'s summary tile still says אוכל 3', (t => t && t.querySelector('b').textContent === '3' && t.querySelector('span').textContent === 'אוכל')($q('.tile[data-k=food]')) && !$q('.tblc'));
    sumMode = 'week'; render(); ok('Kochik\'s table has no meals key', !$q('.tblc').textContent.includes('ביסים'));
    // ---- step 7: gravel success by situation ----
    reset(); render();
    ok('no outings → no line', !$q('.rates'));
    const n = h => now - h*HOUR;
    seed([
      { p:P, k:'food', t: n(100) }, { p:P, k:'pee', t: n(100) + 10*MIN, w:'gravel' },           // older than 3 days: not counted
      { p:P, k:'sleep', t: n(6), end: n(5) }, { p:P, k:'pee', t: n(5) + 5*MIN, w:'gravel' },    // after waking, on the gravel
      { p:P, k:'food', t: n(4) }, { p:P, k:'pee', t: n(4) + 20*MIN, w:'pad' },                  // after a meal, on the pad
      { p:P, k:'food', t: n(3.4) }, { p:P, k:'poop', t: n(3.4) + 10*MIN, w:'gravel' },          // after a bite only: no situation
      { p:P, k:'none', t: n(2) }, { p:P, k:'crate', t: n(2) + 1, end: n(1.85) },                // before the crate, nothing
      { p:P, k:'pee', t: n(1), w:'gravel' }, { p:P, k:'crate', t: n(1) + 5*MIN, end: n(0.5) },   // before the crate, on the gravel
    ]);
    ok('the 3.4 h food is a bite', mealKind(logOf(P, 'food').find(e => e.t === n(3.4))) === 'bite');
    const r = gravelRates(P);
    ok('rates: waking 1/1, meal 0/1, crate 1/2', JSON.stringify(r) === '{"wake":{"n":1,"good":1},"meal":{"n":1,"good":0},"crate":{"n":2,"good":1}}');
    const line = $q('#sec-potty .sub.hint.rates');
    ok('the line under the gravel card', line && line.textContent.includes('אחרי התעוררות: 1 מתוך 1 · אחרי ארוחה: 0 מתוך 1 · לפני כלוב: 1 מתוך 2') && line.previousElementSibling.classList.contains('gravel'));
    ok('visible in both designs (not folded)', line && line.offsetParent !== null && !line.classList.contains('x'));
    // only the crate situation → only that part
    reset(); seed([{ p:P, k:'none', t: n(2) }, { p:P, k:'crate', t: n(2) + 1, end: n(1.85) }]);
    const l2 = $q('.rates');
    ok('a situation with no outings is left out', l2 && l2.textContent.includes('לפני כלוב: 0 מתוך 1') && !l2.textContent.includes('אחרי ארוחה') && !l2.textContent.includes('אחרי התעוררות'));
    pet = 'kochik'; render(); ok('Kochik has no rates line', !$q('.rates'));
    done();
  } catch(e){ crashed(e); }
})();
