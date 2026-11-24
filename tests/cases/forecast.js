// The awake timer, the potty tiles coming to the top, the free-time reminder, and forecasts learned from her own days.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), late = now - m0 > 400*MIN, K0 = { p:'kishmish' }, DAYMS = 24*HOUR;
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const sleepTile = () => $q('#sec-rest .card.item');
    // awake timer
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 30*MIN }, { ...K0, k:'pee', t: now - 28*MIN, w:'pad' }]);
    ok('awake: the sleep tile counts from when she woke up', awakeSince('kishmish') === now - 30*MIN && sleepTile().textContent.includes('ערה כבר') && +sleepTile().querySelector('[data-since]').dataset.since === now - 30*MIN && !sleepTile().classList.contains('warn'));
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 50*MIN }, { ...K0, k:'pee', t: now - 48*MIN, w:'pad' }]);
    ok('45 minutes awake: the tile turns orange, no "crate to sleep" yet', sleepTile().classList.contains('warn') && !$q('.cyc').textContent.includes('לכלוב לישון'));
    seed([{ ...K0, k:'crate', t: now - 150*MIN, end: now - 65*MIN }, { ...K0, k:'pee', t: now - 60*MIN, w:'pad' }]);
    ok('an hour awake: "crate to sleep"', sleepTile().classList.contains('warn') && $q('.cyc').textContent.includes('לכלוב לישון'));
    seed([{ ...K0, k:'crate', t: now - 150*MIN, end: now - 65*MIN }, { ...K0, k:'none', t: now - 60*MIN }, { ...K0, k:'crate', t: now - 55*MIN, end: now - 40*MIN }, { ...K0, k:'pee', t: now - 38*MIN, w:'gravel' }]);
    ok('a retry wait is not a sleep: the awake timer keeps running through it', awakeSince('kishmish') === now - 65*MIN);
    seed([{ ...K0, k:'crate', t: now - 30*MIN }]);
    ok('asleep: the tile shows the sleep, not an awake timer', !sleepTile().textContent.includes('ערה כבר') && !sleepTile().classList.contains('warn') && awakeSince('kishmish') === 0);
    // the potty tiles come to the top on a phone
    FAKE_PHONE = true;
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 5*MIN }]);
    const order = () => [...$q('#side').children].map(el => el.id || el.className.split(' ').slice(0, 2).join('.'));
    ok('just out of the crate, on a phone: the potty group is at the top, above the wheel', !!$q('#side #sec-potty') && !$q('#main #sec-potty') && order().indexOf('sec-potty') < order().indexOf('card.cyc') && $n('#sec-potty') === 1);
    tile('pee').click(); sh.querySelector('[data-w=pad]').click();
    ok('after a pee it goes back to its place', !$q('#side #sec-potty') && !!$q('#main #sec-potty'));
    seed([{ ...K0, k:'sleep', t: now - 60*MIN, end: now - 5*MIN }]);
    ok('the same after "woke up"', !!$q('#side #sec-potty'));
    FAKE_PHONE = false; render();
    ok('on a wide screen it stays in the tiles column (already at the top there)', !$q('#side #sec-potty') && !!$q('#main #sec-potty'));
    // free time: starts by itself, reminds at the end
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 8*MIN }, { ...K0, k:'pee', t: now - 5*MIN, w:'gravel' }]);
    ok('a pee on the gravel starts free time by itself; no reminder yet', !!$q('.card.slim.free.run') && !$q('.frm'));
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 20*MIN }, { ...K0, k:'pee', t: now - 16*MIN, w:'gravel' }]);
    ok('15 minutes later: a reminder on the wheel card', !!$q('.cyc .frm') && $q('.frm').textContent.includes('זמן החופש נגמר'));
    tapDur('kishmish', 'crate'); ok('back in the crate: the reminder is gone', !$q('.frm'));
    seed([{ ...K0, k:'crate', t: now - 120*MIN, end: now - 20*MIN }, { ...K0, k:'pee', t: now - 16*MIN, w:'pad' }]);
    ok('a pee on the pad starts nothing', !$q('.card.slim.free') && !$q('.frm'));
    // forecasts
    const at = (d, h, m) => m0 - d*DAYMS + h*HOUR + m*MIN, A = [], B = [];
    for(let d = 1; d <= 5; d++){
      A.push({ ...K0, k:'sleep', t: at(d, 5, 0), end: at(d, 6, 10 + 9*d) });
      for(const [h, m] of [[7, 0], [12, 30], [18, 0]]) A.push({ ...K0, k:'food', t: at(d, h, m) }, { ...K0, k:'poop', t: at(d, h, m + 29 + (d % 3)), w:'gravel' });
      B.push({ ...K0, k:'food', t: at(d, 7, 20*d) });
      for(const h of [9, 14]) B.push({ ...K0, k:'sleep', t: at(d, h, 0), end: at(d, h + 1, 0) }, { ...K0, k:'poop', t: at(d, h + 1, 9 + (d % 3)), w:'gravel' });
    }
    seed(A);
    ok('steady after meals: the poop forecast uses meals', poopModel('kishmish').anchor === 'food' && typical('kishmish', 'poop').includes('אחרי אוכל') && Math.abs(poopModel('kishmish').med - 30*MIN) <= MIN);
    ok('no clock-time habits on the food card any more', !$q('#sec-food').textContent.includes('אוכלת בדרך כלל'));
    ok('no poop forecast until the anchor has happened', !$q('#sec-potty .fc'));
    seed(A.concat([{ ...K0, k:'food', t: now - 10*MIN }]));
    ok('after a meal: "next poop expected around…" from her own delays', !!$q('#sec-potty .fc') && $q('#sec-potty .fc').textContent.includes('הקקי הבא צפוי בסביבות') && $q('#sec-potty .fc').textContent.includes(clock(now - 10*MIN + 30*MIN)));
    tile('poop').click(); if(bg.classList.contains('show') && sh.querySelector('[data-w=gravel]')) sh.querySelector('[data-w=gravel]').click();
    ok('…and it goes once she has', !$q('#sec-potty .fc'));
    seed(B);
    ok('steady after waking up: the forecast uses that instead', poopModel('kishmish').anchor === 'wake' && typical('kishmish', 'poop').includes('אחרי שהתעוררה'));
    seed(A.slice(0, 5));
    ok('too little data: no forecasts at all', poopModel('kishmish') === null && mealGap('kishmish') === 0 && typical('kishmish', 'poop') === '' && !$q('#sec-food').textContent.includes('אוכלת בדרך כלל'));
    // the next meal: the last MEAL plus her usual gap between meals
    const fl = () => { const e = $q('#sec-food .fc'); return e ? e.textContent : ''; }, meals = offs => offs.map(m => ({ ...K0, k:'food', t: now - m*MIN }));
    seed(meals([730, 590, 440, 300, 150, 20]));   // gaps 140, 150, 140, 150, 130 -> median 140
    ok('"next meal at about" = last meal + the median gap between her meals', mealGap('kishmish') === 140*MIN && fl() === 'הארוחה הבאה בערך ב־' + clock(now - 20*MIN + 140*MIN));
    seed(meals([730, 590, 440, 300, 150, 20]).concat([{ ...K0, k:'food', t: now - 5*MIN }]));
    ok('a bite does not move it', fl() === 'הארוחה הבאה בערך ב־' + clock(now - 20*MIN + 140*MIN));
    seed(meals([430, 290, 140, 20]));
    ok('fewer than four gaps: no line', mealGap('kishmish') === 0 && fl() === '');
    seed(meals([24*60 + 600, 24*60 + 460, 24*60 + 320, 24*60 + 180, 20]));
    ok('the night is not one of her gaps', mealGap('kishmish') === 0);
    seed(meals([1000, 860, 710, 570, 420, 210]));
    ok('more than an hour past the expected time: the line steps aside', mealGap('kishmish') === 150*MIN && fl() === '');
    FAKE_HOUR = 2; seed(meals([730, 590, 440, 300, 150, 20])); nightFull = true; render();
    ok('nothing at night', fl() === ''); FAKE_HOUR = 12; nightFull = false;
    // "usually … after …" on the poop card only from seven poops
    const P = n => { const L = []; for(let d = 1; d <= n; d++) L.push({ ...K0, k:'food', t: at(d, 7, 0) }, { ...K0, k:'poop', t: at(d, 7, 29 + (d % 3)), w:'gravel' }); return L; };
    seed(P(6).concat([{ ...K0, k:'food', t: now - 10*MIN }]));
    ok('six poops: no "usually", no forecast — the general after-meal note instead', poopModel('kishmish') === null && typical('kishmish', 'poop') === '' && !$q('#sec-potty .fc') && $q('#sec-potty .aftermeal').textContent.includes('10–30 דקות אחרי ארוחה'));
    seed(P(7).concat([{ ...K0, k:'food', t: now - 10*MIN }]));
    ok('seven: her own numbers', !!poopModel('kishmish') && $q('#sec-potty').textContent.includes('בדרך כלל') && $q('#sec-potty').textContent.includes('אחרי אוכל') && !$q('#sec-potty .aftermeal'));
    done();
  } catch(e){ crashed(e); }
})();
