// Contradicting entries within DUP_MS ask first: "אכלה" <-> "לא אכלה", פיפי / קקי <-> "לא עשתה".
(async function(){
  try {
    reset(); DUP_MS = 2*60000;
    const now = Date.now(), asked = () => bg.classList.contains('show') && sh.textContent.includes('זה סותר');
    const yes = () => sh.querySelector('#ok').click(), no = () => sh.querySelector('#cancel').click();
    // food after "did not eat"
    seed([{ p:'kishmish', k:'nofood', t: now - MIN }]);
    tile('food').click();
    ok('"ate" a minute after "did not eat" asks first', asked() && sh.textContent.includes('לא אכלה') && sh.textContent.includes('אכלה״ בכל זאת') && logOf('kishmish', 'food').length === 0);
    no(); ok('"no" logs nothing', logOf('kishmish', 'food').length === 0 && !bg.classList.contains('show'));
    tile('food').click(); yes();
    ok('"yes" logs it as usual', logOf('kishmish', 'food').length === 1 && $q('#toast').classList.contains('show'));
    document.getElementById('undo').click(); ok('and undo still works', logOf('kishmish', 'food').length === 0);
    // "did not eat" after food (the food card's link and the alert's button share the act)
    seed([{ p:'kishmish', k:'food', t: now - MIN }]);
    $q('[data-act=nofood]').click();
    ok('"did not eat" right after "ate" asks first', asked() && logOf('kishmish', 'nofood').length === 0);
    yes(); ok('…and logs on yes', logOf('kishmish', 'nofood').length === 1);
    seed([{ p:'kishmish', k:'food', t: now - 3.6*HOUR }]);
    $q('.card.alertc [data-act=nofood]').click();
    ok('the alert\'s "offered, she did not eat" with no recent meal: no question', logOf('kishmish', 'nofood').length === 1 && !asked());
    // crate card's meal button
    seed([{ p:'kishmish', k:'crate', t: now - 20*MIN }, { p:'kishmish', k:'nofood', t: now - MIN }]);
    ok('the crate card has its meal button', !!$q('[data-act=crfood]'));
    $q('[data-act=crfood]').click();
    ok('the crate\'s "meal" after "did not eat" asks', asked() && logOf('kishmish', 'food').length === 0);
    yes(); ok('…and on yes writes the meal mark', logOf('kishmish', 'food').length === 1 && logOf('kishmish', 'food')[0].m === 'meal');
    // pee / poop <-> nothing
    seed([{ p:'kishmish', k:'none', t: now - MIN, x: 1 }]);
    tile('pee').click(); ok('pee right after "nothing" asks', asked() && sh.textContent.includes('יצאה ולא עשתה') && logOf('kishmish', 'pee').length === 0);
    no(); ok('"no": no pee', logOf('kishmish', 'pee').length === 0);
    $q('[data-act=dur][data-k=gravel]').click();
    const gp = $q('.rt-a [data-act=pt][data-k=poop]');
    ok('the gravel clock runs, its card has poop', !!gp);
    gp.click(); ok('poop on the running gravel card asks too', asked() && logOf('kishmish', 'poop').length === 0);
    yes(); ok('…and logs on yes', logOf('kishmish', 'poop').length === 1);
    seed([{ p:'kishmish', k:'pee', t: now - MIN, w:'gravel' }]);
    tile('none').click(); ok('"nothing" right after a pee asks', asked() && sh.textContent.includes('פיפי') && logOf('kishmish', 'none').length === 0);
    yes(); ok('…and logs on yes', logOf('kishmish', 'none').length === 1);
    seed([{ p:'kishmish', k:'pee', t: now - 3*MIN, w:'gravel' }]);
    tile('none').click(); ok('after two minutes: no question', logOf('kishmish', 'none').length === 1 && !asked()); close();
    // "add an entry" at a past time compares with entries near THAT time
    seed([{ p:'kishmish', k:'nofood', t: now - 61*MIN }]);
    openAddSheet('kishmish'); sh.querySelector('[data-kind=food]').click(); sh.querySelector('[data-m="60"]').click();
    ok('"add an entry" an hour ago, next to a "did not eat" then: asks', asked() && logOf('kishmish', 'food').length === 0);
    yes(); ok('…and on yes logs it at that time', logOf('kishmish', 'food').length === 1 && Math.abs(logOf('kishmish', 'food')[0].t - (now - 60*MIN)) < MIN);
    seed([{ p:'kishmish', k:'nofood', t: now - MIN }]);
    openAddSheet('kishmish'); sh.querySelector('[data-kind=food]').click(); sh.querySelector('[data-m="60"]').click();
    ok('"add an entry" an hour ago is not questioned by a "did not eat" now', logOf('kishmish', 'food').length === 1 && !asked()); close();
    // per dog; and the same-kind question is unchanged
    seed([{ p:'kishmish', k:'nofood', t: now - MIN }, { p:'kishmish', k:'none', t: now - MIN, x: 1 }]);
    tapPoint('kochik', 'food'); tapPoint('kochik', 'pee'); close();
    ok('the other dog\'s entries do not count', logOf('kochik', 'food').length === 1 && logOf('kochik', 'pee').length === 1);
    seed([{ p:'kishmish', k:'food', t: now - MIN }]);
    tile('food').click(); ok('the same kind still asks "already logged"', sh.textContent.includes('כבר נרשם') && !sh.textContent.includes('זה סותר')); close();
    DUP_MS = 0;
    seed([{ p:'kishmish', k:'nofood', t: now - MIN }]); tile('food').click();
    ok('DUP_MS = 0 switches it off', logOf('kishmish', 'food').length === 1 && !asked());
    done();
  } catch(e){ crashed(e); }
})();
