// Logging and fixing entries: places, times, running timers, medication.
(async function(){
  try {
    reset();
    const now = Date.now(), near = (a, b) => Math.abs(a - b) < 3000, late = now - midnight() > 200*MIN;
    const type = v => { const a = sh.querySelector('#agoIn'); a.value = v; a.dispatchEvent(new Event('input', { bubbles: true })); };
    tapPoint('kishmish', 'pee');
    ok('after a pee the app asks where: gravel first, 5 choices', bg.classList.contains('show') && [...sh.querySelectorAll('[data-w]')].map(b => b.dataset.w).join() === 'gravel,pad,floor,crate,out');
    sh.querySelector('#cancel').click();
    ok('skipped -> the tile offers "where?"', !logOf('kishmish', 'pee')[0].w && !!$q('[data-act=where][data-k=pee]'));
    $q('[data-act=where][data-k=pee]').click(); sh.querySelector('[data-w=pad]').click();
    ok('place set from the tile, the pee\'s undo toast is not replaced', logOf('kishmish', 'pee')[0].w === 'pad' && $q('#main').innerHTML.includes('על הפד') && logOf('kishmish', 'pee').length === 1);
    tapPoint('kishmish', 'food'); ok('no question for a meal', !bg.classList.contains('show'));
    if(late){
      // fixing an entry
      const id = logOf('kishmish', 'pee')[0].id, t0 = logOf('kishmish', 'pee')[0].t;
      openEntrySheet(state.log.findIndex(e => e.id === id)); sh.querySelector('[data-w=gravel]').click(); sh.querySelector('#ok').click();
      ok('place changed, time untouched, same entry', logOf('kishmish', 'pee')[0].w === 'gravel' && logOf('kishmish', 'pee')[0].t === t0 && logOf('kishmish', 'pee')[0].id === id);
      openEntrySheet(state.log.findIndex(e => e.id === id)); sh.querySelector('#tIn').value = clock(now - 45*MIN); sh.querySelector('#ok').click();
      ok('time moved back: tile follows, id kept', clock(K().pee) === clock(now - 45*MIN) && logOf('kishmish', 'pee')[0].id === id);
      const fut = new Date(now + 90*MIN);
      if(fut.getDate() === new Date(now).getDate()){
        openEntrySheet(state.log.findIndex(e => e.id === id)); sh.querySelector('#tIn').value = clock(fut.getTime()); sh.querySelector('#ok').click();
        ok('a future time is refused', bg.classList.contains('show') && sh.querySelector('#tIn').classList.contains('bad')); close();
      }
      // "how many minutes ago"
      $q('[data-act=edit][data-k=poop]').click(); type('23'); sh.querySelector('#ok').click(); close();
      ok('poop logged 23 minutes ago', near(K().poop, now - 23*MIN));
      $q('[data-act=edit][data-k=poop]').click(); type('5000'); sh.querySelector('#ok').click();
      ok('a silly number is refused', bg.classList.contains('show') && sh.querySelector('#agoIn').classList.contains('bad') && logOf('kishmish', 'poop').length === 1); close();
      // running timers are entries
      $q('[data-act=edit][data-k=crate]').click(); ok('add sheet: end time empty by default', sh.querySelector('#bIn').value === '');
      sh.querySelector('#aIn').value = clock(now - 50*MIN); sh.querySelector('#ok').click();
      ok('start with no end = still running', near(K().crate.start, now - 50*MIN - (now % MIN)) || clock(K().crate.start) === clock(now - 50*MIN));
      ok('it shows as a running row in the list', !!$q('.uni .r[data-live=crate]'));
      $q('.uni .r[data-live=crate]').click(); ok('the running row opens the start-time sheet', sh.querySelector('h3').textContent.includes('מתי נכנסה')); type('40'); sh.querySelector('#ok').click();
      ok('start moved to 40 minutes ago', near(K().crate.start, now - 40*MIN) && logOf('kishmish', 'crate').length === 1);
      tapDur('kishmish', 'sleep'); tapDur('kishmish', 'cry');
      ok('sleep and crying overlap the crate', K().sleep.start && K().cry.start && K().crate.start && $n('.card.item.live') === 3);
      tapDur('kishmish', 'cry'); tapDur('kishmish', 'crate');
      const stay = logOf('kishmish', 'crate')[0];
      ok('"out of the crate" ends the stay and the sleep', stay.end && near(stay.end - stay.t, 40*MIN) && !K().sleep.start && logOf('kishmish', 'sleep')[0].end);
      openEntrySheet(state.log.indexOf(stay)); ok('a finished stay has start, end and "still going"', !!sh.querySelector('#aIn') && !!sh.querySelector('#bIn') && !!sh.querySelector('#reopen'));
      sh.querySelector('#reopen').click();
      ok('"still going": the same entry runs again', K().crate.start === stay.t && logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].id === stay.id);
      $q('[data-act=edit][data-k=crate]').click(); sh.querySelector('#del').click();
      ok('cancelling a running timer removes it', !K().crate.start && logOf('kishmish', 'crate').length === 0);
      $q('[data-act=edit][data-k=sleep]').click(); sh.querySelector('#aIn').value = '01:00'; sh.querySelector('#bIn').value = '01:30'; sh.querySelector('#ok').click();
      ok('start + end = a finished stay', logOf('kishmish', 'sleep').some(e => e.end - e.t === 30*MIN));
      // two phones started the same stay: stopping keeps one
      seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }, { p:'kishmish', k:'crate', t: now - 28*MIN }]);
      ok('two running entries: the earlier one is the stay', K().crate.start === now - 30*MIN);
      tapDur('kishmish', 'crate'); ok('stopping leaves one stay', logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].t === now - 30*MIN && !K().crate.start);
      // a running timer that really ended a while ago
      seed([{ p:'kishmish', k:'sleep', t: now - 140*MIN }]);
      $q('[data-act=edit][data-k=sleep]').click(); sh.querySelector('#eIn').value = clock(now - 50*MIN); sh.querySelector('#ok').click();
      ok('"it already ended at …" closes the running timer at that time', !K().sleep.start && logOf('kishmish', 'sleep').length === 1 && clock(logOf('kishmish', 'sleep')[0].end) === clock(now - 50*MIN) && logOf('kishmish', 'sleep')[0].t === now - 140*MIN);
      openEntrySheet(0); sh.querySelector('#bIn').value = clock(now - 70*MIN); sh.querySelector('#ok').click();
      ok('a finished stay\'s end can be corrected afterwards', clock(logOf('kishmish', 'sleep')[0].end) === clock(now - 70*MIN) && clock(K().sleep.lastEnd) === clock(now - 70*MIN));
      seed([{ p:'kishmish', k:'sleep', t: now - 23*HOUR }, { p:'kishmish', k:'crate', t: now - HOUR }]);
      tapDur('kishmish', 'crate');
      ok('leaving the crate does not "end" a sleep left running since yesterday', logOf('kishmish', 'sleep')[0].end == null && !!logOf('kishmish', 'crate')[0].end);
      // add a missed entry
      $q('[data-act=addev]').click(); sh.querySelector('[data-kind=none]').click(); type('12'); sh.querySelector('#ok').click();
      ok('added "went out, nothing" 12 minutes ago', near(K().none, now - 12*MIN));
    }
    // medication checklist is the list
    pet = 'kochik'; render(); $q('[data-act=med][data-k=am]').click();
    ok('morning medicine marked = one entry', !!medsOf('kochik').am && logOf('kochik', 'med_am').length === 1 && !!$q('.med.done'));
    $q('[data-act=med][data-k=am]').click(); type('30'); sh.querySelector('#ok').click();
    ok('its time changed to 30 minutes ago: still one entry', near(medsOf('kochik').am, now - 30*MIN) && logOf('kochik', 'med_am').length === 1);
    openEntrySheet(state.log.findIndex(e => e.k === 'med_am')); sh.querySelector('#del').click();
    ok('deleting the entry unticks the checklist', !medsOf('kochik').am && !$q('.med.done'));
    $q('[data-act=med][data-k=pm]').click(); $q('[data-act=med][data-k=pm]').click(); sh.querySelector('#del').click();
    ok('"not given" removes the entry', !medsOf('kochik').pm && logOf('kochik', 'med_pm').length === 0);
    tapPoint('kochik', 'pee'); ok('kochik: outside, balcony, at home, pad', [...sh.querySelectorAll('[data-w]')].map(b => b.dataset.w).join() === 'out,balcony,home,pad');
    sh.querySelector('[data-w=home]').click(); ok('"at home" is saved and shown in red', logOf('kochik', 'pee')[0].w === 'home' && !!$q('.wh.home') && whereCls('home') === 'acc' && whereCls('balcony') === 'pad');
    $q('[data-act=pt][data-k=gel]').click(); ok('ear gel logged, counted in days', typeof KO().gel === 'number' && wordsLong(53*HOUR) === 'יומיים ו־5 שעות');
    done();
  } catch(e){ crashed(e); }
})();
