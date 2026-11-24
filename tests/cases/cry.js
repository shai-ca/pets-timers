// What a cry meant is read from what happened around it; nothing is asked and nothing is stored.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, today = [midnight(), midnight() + 24*HOUR];
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const kinds = () => logOf('kishmish', 'cry').map(cryKind).join(','), K0 = { p:'kishmish' };
    const stay = (a, b) => ({ ...K0, k:'crate', t: now - a*MIN, end: now - b*MIN }), cry = (a, b) => ({ ...K0, k:'cry', t: now - a*MIN, end: now - b*MIN });
    seed([stay(200, 100), cry(195, 192)]);
    ok('a cry in the first ten minutes in the crate is a protest', kinds() === 'protest' && $q('.uni').textContent.includes('בכתה · מחאה'));
    seed([stay(200, 100), cry(120, 115), { ...K0, k:'pee', t: now - 94*MIN, w:'gravel' }]);
    ok('after a sleep, out 15 minutes after it stopped (she had calmed down), pee 6 minutes later: she asked to go out', kinds() === 'asked' && $q('.uni').textContent.includes('בכתה · ביקשה לצאת'));
    ok('nothing was written for it', !state.log.some(e => 'ck' in e) && noDiff(diff(base, state)));
    seed([stay(200, 100), cry(120, 100), { ...K0, k:'poop', t: now - 100*MIN, w:'gravel' }]);
    ok('still crying when taken out, and a poop logged as she comes out: asked', kinds() === 'asked');
    seed([stay(200, 100), cry(120, 115)]);
    ok('taken out but no pee or poop in the next ten minutes: asked, did not need — no label', kinds() === 'askedNo' && !$q('.uni').textContent.includes('ביקשה לצאת'));
    seed([stay(200, 100), cry(120, 115), { ...K0, k:'pee', t: now - 85*MIN, w:'gravel' }]);
    ok('a pee 15 minutes after coming out is too late to count', kinds() === 'askedNo');
    seed([stay(200, 100), cry(140, 120), { ...K0, k:'pee', t: now - 98*MIN, w:'gravel' }]);
    ok('out 20 minutes after the crying stopped: not a request', kinds() === '');
    seed([{ ...K0, k:'crate', t: now - 100*MIN, ns: 1, end: now - 40*MIN }, cry(60, 50), { ...K0, k:'pee', t: now - 38*MIN, w:'gravel' }]);
    ok('"did not sleep in this stay": a cry there is not "after a sleep"', kinds() === '');
    seed([{ ...K0, k:'crate', t: now - 100*MIN, end: now - 3*MIN }, cry(10, 5)]);
    ok('undecided while the ten minutes after coming out are still running', kinds() === '');
    seed([cry(30, 20)]); ok('crying outside the crate has no label', kinds() === '');
    seed([{ ...K0, k:'crate', t: now - 100*MIN }, { ...K0, k:'cry', t: now - 20*MIN }]);
    ok('still in the crate: nothing to say yet', kinds() === '');
    // the summary
    const two = [stay(380, 300), cry(378, 375), cry(320, 310), { ...K0, k:'pee', t: now - 296*MIN, w:'gravel' }, stay(200, 100), cry(120, 110), { ...K0, k:'poop', t: now - 99*MIN, w:'gravel' }];
    seed(two); view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('summary: every request was real', canon(cryStats('kishmish', ...today)) === canon({ protest: 1, asked: 2, needed: 2 }) && $q('.crysum').textContent.includes('ביקשה לצאת 2 פעמים') && $q('.crysum').textContent.includes('ובכל אחת מהן באמת הייתה צריכה') && $q('.crysum').textContent.includes('מחאה בכניסה לכלוב: 1'));
    seed(two.concat([stay(80, 30), cry(50, 40)])); render();
    ok('summary: honest when one of them was not', $q('.crysum').textContent.includes('ביקשה לצאת 3 פעמים') && $q('.crysum').textContent.includes('ב־2 מהן באמת הייתה צריכה'));
    seed([stay(200, 100), cry(120, 115), { ...K0, k:'pee', t: now - 94*MIN, w:'gravel' }]); render();
    ok('summary: once', $q('.crysum').textContent.includes('ביקשה לצאת פעם אחת') && $q('.crysum').textContent.includes('ובאמת הייתה צריכה'));
    ok('the text export carries the label', logText('kishmish', ...today).includes('בכתה · ביקשה לצאת'));
    seed([{ ...K0, k:'food', t: now - 30*MIN }]); render(); ok('no crying: no line', !$q('.crysum'));
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - HOUR }]); render(); ok('not for kochik', !$q('.crysum')); pet = 'kishmish'; view = 'now';
    done();
  } catch(e){ crashed(e); }
})();
