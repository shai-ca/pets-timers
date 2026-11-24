// Logging something that happened yesterday (noticed late, or logged the next morning).
(async function(){
  try {
    reset('shai', 'kochik'); ASK_WHEN = true;
    const now = Date.now(), m0 = midnight(), at = (back, h, m) => m0 - back*24*HOUR + h*HOUR + m*MIN, set = (id, v) => { sh.querySelector('#' + id).value = v; };
    seed([{ p:'kochik', k:'food', t: now - 30*HOUR }]);
    tile('vomit').click();
    ok('the "when?" sheet offers today / yesterday / the day before, and hours ago', [...sh.querySelectorAll('[data-day]')].map(b => b.textContent).join() === 'היום,אתמול,שלשום' && sh.querySelector('[data-day].sel').dataset.day === '0' && !!sh.querySelector('[data-m="120"]') && !!sh.querySelector('[data-m="180"]'));
    sh.querySelector('[data-day="1"]').click(); set('tIn', '20:15'); sh.querySelector('#ok').click();
    ok('vomiting yesterday at 20:15 is logged then, and asks what came up', logOf('kochik', 'vomit').length === 1 && logOf('kochik', 'vomit')[0].t === at(1, 20, 15) && !!sh.querySelector('[data-q=bile]'));
    sh.querySelector('[data-q=bile]').click();
    ok('…and reads "yesterday" on the tile and in the list', $q('#main').textContent.includes('אתמול ב־20:15') && logOf('kochik', 'vomit')[0].q === 'bile');
    $q('.medc [data-act=dur][data-k=medoff]').click(); sh.querySelector('[data-day="1"]').click(); set('tIn', '17:00'); sh.querySelector('#ok').click();
    ok('a medicine break that began yesterday at 17:00', logOf('kochik', 'medoff').length === 1 && logOf('kochik', 'medoff')[0].t === at(1, 17, 0) && !logOf('kochik', 'medoff')[0].end && !!$q('.medc.off') && $q('.medc.off').textContent.includes('אתמול'));
    view = 'sum'; sumMode = 'day'; sumAnchor = m0 - 12*HOUR; render();
    ok('yesterday\'s summary shows the vomiting and "on a break" for the medicines', $q('.tile[data-k=vomit] b').textContent === '1' && $q('#main').textContent.includes('בהפסקה')); view = 'now'; render();
    tile('pee').click(); sh.querySelector('[data-day="2"]').click(); set('tIn', '09:30'); sh.querySelector('#ok').click(); close();
    ok('the day before yesterday works too', logOf('kochik', 'pee')[0].t === at(2, 9, 30));
    tile('poop').click();
    ok('the choice does not stick: the next sheet starts on "today"', sh.querySelector('[data-day].sel').dataset.day === '0'); close();
    $q('[data-act=edit][data-k=vomit]').click();
    ok('the tile\'s "other time" sheet has the day choice as well', sh.querySelectorAll('[data-day]').length === 3); close();
    $q('[data-act=addev]').click();
    ok('kochik\'s history has "add an entry", with vomiting among the kinds and the day choice', !!sh.querySelector('[data-kind=vomit]') && sh.querySelectorAll('[data-day]').length === 3);
    sh.querySelector('[data-kind=vomit]').click(); sh.querySelector('[data-day="1"]').click(); set('tIn', '06:10'); sh.querySelector('#ok').click(); close();
    ok('…and it logs on the chosen day', logOf('kochik', 'vomit').some(e => e.t === at(1, 6, 10)));
    // today: a clock time that has not come yet still means yesterday's, as before
    pet = 'kishmish'; seed([]); tile('food').click(); set('tIn', '23:59'); sh.querySelector('#ok').click();
    ok('"today" with a time still ahead means yesterday\'s (unless it is 23:59 right now)', clock(now) === '23:59' || logOf('kishmish', 'food')[0].t === at(1, 23, 59));
    $q('[data-act=dur][data-k=crate]').click(); sh.querySelector('[data-day="1"]').click(); set('tIn', '22:00'); sh.querySelector('#ok').click();
    ok('a timer can be started from yesterday evening', K().crate.start === at(1, 22, 0));
    done();
  } catch(e){ crashed(e); }
})();
