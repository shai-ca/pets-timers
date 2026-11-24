// How long it takes her on the gravel: an optional timer ended by what happens there, or said afterwards.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, K0 = { p:'kishmish' }, row = () => $q('#sec-potty .card.slim.gravel'), today = [midnight(), midnight() + 24*HOUR];
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{ ...K0, k:'crate', t: now - 200*MIN, end: now - 30*MIN }, { ...K0, k:'pee', t: now - 100*MIN, w:'gravel' }]);
    ok('the potty group has an optional "going to the gravel" row, first in the group', !!row() && $q('#sec-potty .card') === row() && row().textContent.includes('יוצאים לחצץ?') && row().querySelector('button').textContent === 'יצאנו לחצץ' && row().textContent.includes('לא חובה'));
    row().querySelector('button').click();
    ok('tapping it starts a small timer; nothing else changes', !!K().gravel.start && row().classList.contains('on') && !!row().querySelector('[data-since]') && roundStarts('kishmish').length === 1 && !K().crate.start && !$q('.uni').textContent.includes('בחצץ'));
    logOf('kishmish', 'gravel')[0].t = now - 4*MIN; use(state); render();
    tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    const pee = logOf('kishmish', 'pee').pop();
    ok('a pee ends it, and the pee knows how long it took', !K().gravel.start && logOf('kishmish', 'gravel')[0].end === pee.t && Math.abs(waitOf(pee) - 4*MIN) < 3000 && $q('.uni').textContent.includes('אחרי 4 דקות בחצץ') && !row().classList.contains('on'));
    ok('the text export says it too', logText('kishmish', ...today).includes('אחרי 4 דקות בחצץ'));
    seed([{ ...K0, k:'crate', t: now - 200*MIN, end: now - 30*MIN }, { ...K0, k:'pee', t: now - 100*MIN, w:'gravel' }, { ...K0, k:'gravel', t: now - 12*MIN }]);
    tile('none').click();
    const none = logOf('kishmish', 'none')[0];
    ok('"nothing" ends it too: we waited twelve minutes', Math.abs(waitOf(none) - 12*MIN) < 3000 && !K().gravel.start && $q('.uni').textContent.includes('יצאה ולא עשתה · אחרי 12 דקות בחצץ'));
    seed([{ ...K0, k:'gravel', t: now - 6*MIN }]); tile('poop').click(); if(bg.classList.contains('show')) sh.querySelector('[data-w=gravel]').click();
    ok('and a poop', Math.abs(waitOf(logOf('kishmish', 'poop')[0]) - 6*MIN) < 3000);
    seed([{ ...K0, k:'gravel', t: now - 6*MIN }]); row().querySelector('button').click();
    ok('"came back without marking" just stops it', !K().gravel.start && !!logOf('kishmish', 'gravel')[0].end && logOf('kishmish', 'pee').length === 0);
    seed([{ ...K0, k:'gravel', t: now - 6*MIN }]); tapDur('kishmish', 'crate');
    ok('going into the crate stops it', !K().gravel.start);
    seed([{ ...K0, k:'gravel', t: now - 90*MIN }]); tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    ok('a timer forgotten for more than an hour is dropped, not believed', logOf('kishmish', 'gravel').length === 0 && waitOf(logOf('kishmish', 'pee')[0]) === null && !$q('.uni').textContent.includes('בחצץ ·'));
    // without the timer: nothing is measured — but it can be said afterwards
    seed([{ ...K0, k:'crate', t: now - 200*MIN, end: now - 30*MIN }, { ...K0, id:'n1', k:'none', t: now - 20*MIN, x: 1 }]);
    ok('no timer: no time on the row', waitOf(logOf('kishmish', 'none')[0]) === null && !$q('.uni').textContent.includes('בחצץ'));
    $q('.r[data-e="' + state.log.indexOf(state.log.find(e => e.id === 'n1')) + '"]').click();
    ok('tapping the entry offers "how long did it take?"', [...sh.querySelectorAll('[data-g]')].map(b => b.dataset.g).join() === '2,5,10,15,20' && !sh.querySelector('[data-g].sel'));
    sh.querySelector('[data-g="15"]').click(); sh.querySelector('#ok').click();
    ok('said afterwards: a quarter of an hour', state.log.find(e => e.id === 'n1').g === 15 && waitOf(state.log.find(e => e.id === 'n1')) === 15*MIN && $q('.uni').textContent.includes('אחרי 15 דקות בחצץ'));
    $q('.r[data-e="' + state.log.indexOf(state.log.find(e => e.id === 'n1')) + '"]').click(); sh.querySelector('[data-g="15"]').click(); sh.querySelector('#ok').click();
    ok('and it can be taken off again', !('g' in state.log.find(e => e.id === 'n1')));
    // what she usually needs
    const trips = [3, 4, 5, 9].flatMap((m, i) => [{ ...K0, k:'gravel', t: now - (300 - i*40)*MIN, end: now - (300 - i*40 - m)*MIN }, { ...K0, k:'pee', t: now - (300 - i*40 - m)*MIN, w:'gravel' }]);
    seed(trips.concat([{ ...K0, k:'none', t: now - 30*MIN, g: 10, x: 1 }]));
    ok('with a few measured trips the row says how long she usually takes', row().textContent.includes('בדרך כלל עושה פיפי תוך 5 דקות') || row().textContent.includes('בדרך כלל עושה פיפי תוך 4 דקות'));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('summary: the usual time, how many trips it rests on, and the usual wait when nothing happened', $q('.waitsum').textContent.includes('בחצץ: עושה בדרך כלל תוך') && $q('.waitsum').textContent.includes('לפי 4 יציאות') && $q('.waitsum').textContent.includes('כשלא עשתה, חיכינו בדרך כלל 10 דקות (1)') && !$q('#main').textContent.includes('בחצץ · '));
    seed([{ ...K0, k:'pee', t: now - HOUR, w:'gravel' }]); view = 'sum'; render(); ok('nothing measured: no line', !$q('.waitsum')); view = 'now';
    ok('the timer never shows as an entry of its own, and does not count as an event for the wheel or the rounds', (seed([{ ...K0, k:'gravel', t: now - 20*MIN, end: now - 15*MIN }]), !$q('.uni .r') && routine('kishmish') === null && roundStarts('kishmish').length === 0));
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - HOUR }]); ok('not for kochik', !$q('.gravel') && !$q('[data-k=gravel]'));
    done();
  } catch(e){ crashed(e); }
})();
