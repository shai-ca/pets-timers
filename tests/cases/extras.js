// Water, the food and health alerts, the guard against double taps, and the success rate.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), alertText = () => [...document.querySelectorAll('.card.alertc')].map(c => c.textContent).join(' | ');
    // water
    ok('a "drank" button for the puppy', !!$q('[data-act=pt][data-k=water]'));
    $q('[data-act=pt][data-k=water]').click();
    ok('drinking is logged and shown', logOf('kishmish', 'water').length === 1 && typeof K().water === 'number' && $q('.uni').textContent.includes('שתתה') && !bg.classList.contains('show'));
    tile('none').click();
    ok('the retry card says when she last drank', $q('.card.retry').textContent.includes('שתתה לאחרונה'));
    seed([{ p:'kishmish', k:'none', t: now - MIN }]);
    ok('…or that no drinking was logged', $q('.card.retry').textContent.includes('לא נרשמה שתייה'));
    // alerts
    seed([{ p:'kishmish', k:'food', t: now - 3*HOUR }, { p:'kishmish', k:'pee', t: now - 5*HOUR, w:'gravel' }, { p:'kishmish', k:'poop', t: now - 20*HOUR }]);
    ok('nothing alarming: no alerts', $n('.card.alertc') === 0);
    seed([{ p:'kishmish', k:'food', t: now - 3.6*HOUR }]);
    ok('3.5 hours without food: a prominent alert, first thing on the page', $n('.card.alertc') === 1 && alertText().includes('מאז האוכל האחרון') && alertText().includes('סוכר') && $q('#side').firstElementChild.classList.contains('alertc'));
    tapPoint('kishmish', 'food'); ok('a meal clears it', $n('.card.alertc') === 0);
    seed([{ p:'kishmish', k:'food', t: now - MIN }, { p:'kishmish', k:'pee', t: now - 6.2*HOUR, w:'pad' }, { p:'kishmish', k:'poop', t: now - 25*HOUR }]);
    ok('6 hours without a pee while awake, 24 without a poop: "consider calling the vet"', $n('.card.alertc') === 2 && (alertText().match(/לשקול להתקשר לווטרינר/g) || []).length === 2);
    tapDur('kishmish', 'sleep'); ok('asleep: the pee alert waits, the poop one stays', $n('.card.alertc') === 1 && alertText().includes('בלי קקי'));
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - 9*HOUR }]); ok('no such alerts for kochik', $n('.card.alertc') === 0); pet = 'kishmish';
    // double taps
    seed([]); DUP_MS = 2*60000;
    tile('food').click(); tile('food').click();
    ok('the same button twice within two minutes asks first', logOf('kishmish', 'food').length === 1 && bg.classList.contains('show') && sh.textContent.includes('כבר נרשם'));
    sh.querySelector('#cancel').click(); ok('"it was a mistake" logs nothing', logOf('kishmish', 'food').length === 1);
    tile('food').click(); sh.querySelector('#ok').click(); ok('"log again" logs it', logOf('kishmish', 'food').length === 2);
    tile('none').click(); tile('none').click(); ok('also for "nothing"', logOf('kishmish', 'none').length === 1 && sh.textContent.includes('כבר נרשם')); close();
    $q('[data-act=nofood]').click(); $q('[data-act=nofood]').click(); ok('also for "did not eat"', logOf('kishmish', 'nofood').length === 1); close();
    tapPoint('kishmish', 'pee', now - 30*MIN); close(); tapPoint('kishmish', 'pee', now - 29*MIN); close();
    ok('entries given an explicit time are not questioned', logOf('kishmish', 'pee').length === 2);
    seed([{ p:'kishmish', k:'food', t: now - 3*MIN }]); tile('food').click();
    ok('after two minutes there is no question', logOf('kishmish', 'food').length === 2 && !bg.classList.contains('show'));
    DUP_MS = 0;
    // success rate
    const L = [], day = d => m0 - d*24*HOUR;
    [['gravel','gravel','pad','gravel'], ['pad','pad','gravel'], ['gravel','gravel','gravel','gravel','pad']].forEach((ws, i) => ws.forEach((w, j) => L.push({ p:'kishmish', k:'pee', t: day(3 - i) + (8 + j*2)*HOUR, w })));
    L.push({ p:'kishmish', k:'pee', t: day(1) + 20*HOUR });   // unmarked: counts in the total
    seed(L.filter(e => e.t < now));
    const s3 = successOf('kishmish', day(3), day(2)), s1 = successOf('kishmish', day(1), day(0));
    ok('success = pees on the gravel out of all pees that day', s3.good === 3 && s3.all === 4 && s3.pct === 75 && s1.all === 6 && s1.good === 4 && s1.pct === 67);
    view = 'sum'; sumMode = 'day'; sumAnchor = day(3) + HOUR; render();
    ok('day view shows the day\'s rate', $q('.succ-h b').textContent === '75%' && $q('.succ-h').textContent.includes('3 מתוך 4'));
    sumMode = 'week'; sumAnchor = day(1); render();
    const wk = sumRange('week', day(1));
    ok('week view: the overall rate and a column per day', !!$q('.succ-h') && $n('.wbc .wb-c .out') >= 1 && [...document.querySelectorAll('.wb-c .n')].some(n => /%$/.test(n.textContent)));
    $q('.tile[data-k=crate]').click(); ok('hidden when filtering on something that is not pee', !$q('.succ-h')); sumFilter = null;
    pet = 'kochik'; render(); ok('not shown for kochik', !$q('.succ-h'));
    done();
  } catch(e){ crashed(e); }
})();
