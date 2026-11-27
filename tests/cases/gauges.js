// Every forecast as a bar from the last time (new design): next pee, next poop, next meal, bath, time to sleep.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, K0 = {p:'kishmish'}, card = k => $q(`.card [data-act=pt][data-k=${k}]`).closest(".card");
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const L = [];
    for(let i = 0; i < 6; i++) L.push({...K0, k:'pee', t: now - 60*MIN - i*150*MIN, w:'gravel'});
    for(let i = 0; i < 5; i++) L.push({...K0, k:'poop', t: now - 100*MIN - i*8*HOUR, w:'gravel'});
    for(let i = 0; i < 6; i++) L.push({...K0, k:'food', t: now - 30*MIN - i*150*MIN, m:'meal'});
    L.push({...K0, k:'bath', t: now - 4*24*HOUR}, {...K0, k:'crate', t: now - 120*MIN, end: now - 40*MIN}, {...K0, k:'sleep', t: now - 110*MIN, end: now - 40*MIN});
    FAKE_HOUR = 12;
    seed(L);
    V2 = false; render();
    ok('old design: no bars', !$q('.gauge'));
    V2 = true; render();
    const f = peeForecast('kishmish');
    ok('pee: a bar from the last pee, the window shaded, "עוד … לחלון" before it', !!card('pee').querySelector('.gauge.soon .gw') && card('pee').querySelector('.gauge small').textContent.includes('עוד ') && card('pee').querySelector('.gauge small').textContent.includes('לחלון'));
    const fill = +card('pee').querySelector('.gauge .gf').style.width.replace('%', '');
    const exp = (now - f.last) / (f.to + (f.to - f.last) * .2 - f.last) * 100;
    ok('…filled to now, to scale', Math.abs(fill - exp) < 1);
    ok('poop: a bar from her usual gap', !!card('poop').querySelector('.gauge'));
    ok('meal: a bar to the next meal', !!card('food').querySelector('.gauge') && card('food').querySelector('.gauge small').textContent.includes('לארוחה'));
    ok('bath: a bar to the tenth day', !!card('bath').querySelector('.gauge') && card('bath').querySelector('.gauge small').textContent.includes('למקלחת'));
    ok('awake: a bar to the hour awake', !!$q('#sec-rest .gauge') && $q('#sec-rest .gauge small').textContent.includes('לשינה'));
    ok('sleep in the last 24 hours, with the age range as information (a two-month-old) — once, on the sleep card, not repeated in the day ribbon', sleepGoal('kishmish') === 18 && $q('#sec-rest .gauge.goal small').textContent.includes('טווח מקובל לגילה 18–20 שעות, לא יעד') && $q('#sec-rest .gauge.goal small').textContent.includes(hmm(scores('kishmish').total)) && !$q('#sec-rest .gauge.goal small').textContent.includes('חסרות') && !$q('.ribbon .gauge.goal'));
    card('pee').querySelector('.gauge .gw').dispatchEvent(new MouseEvent('pointerover', {bubbles:true}));
    ok('hovering the window shows its times', card('pee').querySelector('.gauge .ptip').textContent.includes(clock(f.from)));
    card('pee').querySelector('.gauge .gf').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    ok('tapping the filled part shows the last pee and how long ago', card('pee').querySelector('.gauge .ptip').textContent.includes('הפיפי האחרון ב־' + clock(f.last)) && card('pee').querySelector('.gauge .ptip').textContent.includes('עברו'));
    $q('#sec-rest .gauge.goal .gf').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    ok('the sleep goal bar too', $q('#sec-rest .gauge.goal .ptip').textContent.includes('נצפה '));
    ok('the times are written on the bar: the last pee at the start, the window over the shaded part', card('pee').querySelector('.gl').textContent.includes(clock(f.last)) && card('pee').querySelector('.gl .glw').textContent.includes(clock(f.from)));
    const bt = new Date(now - 4*24*HOUR), due = new Date(bt); due.setHours(0, 0, 0, 0); due.setDate(due.getDate() + 10);
    ok('bath: one count, to the tenth day (the same date as the line above it), dates on the bar', card('bath').querySelector('.gauge small').textContent.includes('עוד 6 ימים') && card('bath').querySelector('.gl .glw').textContent === `${due.getDate()}.${due.getMonth()+1}` && card('bath').textContent.includes('(עוד 6 ימים)'));
    ok('the meal bar: the last meal at the start, the next one at its place, apart', card('food').querySelector('.gl span').textContent === clock(V.kishmish.food) && card('food').querySelector('.gl .glw').getBoundingClientRect().left > card('food').querySelector('.gl span').getBoundingClientRect().right);
    ok('a bold "now" line on the bar, where the fill ends', !!card('pee').querySelector('.gauge .gnow') && Math.abs(parseFloat(card('pee').querySelector('.gauge .gnow').style.left) - parseFloat(card('pee').querySelector('.gauge .gf').style.width)) < 0.2);
    ok('Kochik (16 years old): no sleep goal', sleepGoal('kochik') === 0);
    seed(L.concat([{...K0, k:'crate', t: now - 5*MIN}]));
    ok('in the crate: no "time to sleep" bar', !$q('#sec-rest .gauge:not(.goal)') && !!$q('#sec-rest .gauge.goal'));
    seed(L.map(e => e.k === 'pee' && e.t === now - 60*MIN ? {...e, t: now - 260*MIN} : e));
    // 27.11 (state reconciliation, item 6): a passed window is no longer a live "עברו X" countdown but "החלון עבר (A–B) · לא נרשם פיפי"
    ok('a pee window that has passed: the bar says so', !!card('pee').querySelector('.gauge.past') && card('pee').querySelector('.gauge small').textContent.startsWith('החלון עבר (') && card('pee').querySelector('.gauge small').textContent.endsWith('· לא נרשם פיפי'));
    V2 = false;
    done();
  } catch(e){ crashed(e); }
})();
