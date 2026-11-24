// Every logging button asks when it happened: now, X minutes ago, or a time.
(async function(){
  try {
    reset(); ASK_WHEN = true;
    const now = Date.now(), near = (a, b) => Math.abs(a - b) < 3000, late = now - midnight() > 200*MIN;
    const chip = m => sh.querySelector('.chips.when [data-m="' + m + '"]');
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    tile('food').click();
    ok('tapping a button asks "when?" with a big "now" and minutes-ago choices', bg.classList.contains('show') && sh.querySelector('h3').textContent.includes('אכלה — מתי?') && chip(0).textContent === 'עכשיו' && !!chip(10) && !!sh.querySelector('#agoIn') && !!sh.querySelector('#tIn') && logOf('kishmish', 'food').length === 0);
    chip(0).click(); ok('"now" logs it now', near(K().food, now) && !bg.classList.contains('show'));
    tile('pee').click(); chip(15).click();
    ok('"15 minutes ago" logs it then, and still asks where', near(K().pee, now - 15*MIN) && bg.classList.contains('show') && !!sh.querySelector('[data-w=gravel]')); close();
    tile('poop').click(); sh.querySelector('#agoIn').value = '7'; sh.querySelector('#ok').click(); close();
    ok('any number of minutes', near(K().poop, now - 7*MIN));
    tile('none').click(); sh.querySelector('#tIn').value = clock(now - 40*MIN); sh.querySelector('#ok').click();
    ok('or a clock time', clock(K().none) === clock(now - 40*MIN));
    tile('water').click(); sh.querySelector('#cancel').click(); ok('cancel logs nothing', !K().water);
    // timers: start and stop
    seed([]);
    $q('[data-act=dur][data-k=crate]').click(); ok('a timer asks too', sh.querySelector('h3').textContent.includes('נכנסה לכלוב — מתי?')); chip(20).click();
    ok('"went in 20 minutes ago": running since then', near(K().crate.start, now - 20*MIN));
    $q('[data-act=dur][data-k=crate]').click(); ok('stopping asks as well', sh.querySelector('h3').textContent.includes('יצאה מהכלוב — מתי?')); chip(5).click();
    const cr = logOf('kishmish', 'crate')[0];
    ok('"came out 5 minutes ago" ends the stay, and the sleep, at that time', near(cr.end, now - 5*MIN) && K().sleep.lastEnd === cr.end && !K().sleep.start && !K().crate.start);
    $q('[data-act=dur][data-k=cry]').click(); chip(0).click(); $q('[data-act=dur][data-k=cry]').click(); chip(0).click();
    ok('start and stop "now" still work', logOf('kishmish', 'cry').length === 1 && !!logOf('kishmish', 'cry')[0].end);
    // play, "did not eat", the retry card
    $q('[data-act=play][data-k=rope]').click(); chip(10).click(); ok('play kind, 10 minutes ago', near(logOf('kishmish', 'play')[0].t, now - 10*MIN));
    $q('[data-act=nofood]').click(); chip(0).click(); ok('"did not eat" now', logOf('kishmish', 'nofood').length === 1);
    seed([{ p:'kishmish', k:'crate', t: now - 120*MIN, end: now - 30*MIN }]);
    tile('none').click(); chip(5).click();
    const C = logOf('kishmish', 'crate').pop();
    ok('retry: "nothing, 5 minutes ago" puts her back in the crate then, with 5 minutes left on the countdown', near(C.t, now - 5*MIN) && retry('kishmish').state === 'wait' && near(+$q('.card.retry [data-until]').dataset.until, now + 5*MIN));
    $q('[data-act=rtstop]').click(); ok('closing the card does not ask when', !bg.classList.contains('show') && !$q('.card.retry'));
    // the double-tap question comes first, then "when"
    seed([]); DUP_MS = 2*60000;
    tile('food').click(); chip(0).click(); tile('food').click();
    ok('a second tap within two minutes asks "already logged" first', sh.textContent.includes('כבר נרשם'));
    sh.querySelector('#ok').click(); ok('…then "when"', !!chip(0)); chip(0).click(); ok('and then logs', logOf('kishmish', 'food').length === 2);
    DUP_MS = 0;
    pet = 'kochik'; seed([]); tile('pee').click(); ok('kochik\'s buttons ask too', !!chip(0)); chip(0).click(); close();
    $q('[data-act=med][data-k=am]').click(); ok('the medication checklist is marked at once, as before', !!medsOf('kochik').am && !bg.classList.contains('show'));
    done();
  } catch(e){ crashed(e); }
})();
