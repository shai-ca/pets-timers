// Logging and fixing entries: places, times, running timers, medication.
(async function(){
  try {
    reset();
    const now = Date.now(), near = (a, b) => Math.abs(a - b) < 3000, late = now - midnight() > 200*MIN;
    const type = v => { const a = sh.querySelector('#agoIn'); a.value = v; a.dispatchEvent(new Event('input', { bubbles: true })); };
    tapPoint('kishmish', 'pee');
    ok('after a pee the app asks where: gravel first, no "in the crate"', bg.classList.contains('show') && [...sh.querySelectorAll('[data-w]')].map(b => b.dataset.w).join() === 'gravel,pad,floor,out');
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
      ok('in the crate she is taken to be asleep', !!K().sleep.start && K().sleep.assumed && $n('.card.item.live') === 2);
      tapDur('kishmish', 'cry');
      ok('crying runs alongside the crate, and means awake', !!K().cry.start && !!K().crate.start && !K().sleep.start && $n('.card.item.live') === 2);
      tapDur('kishmish', 'cry'); tapDur('kishmish', 'crate');
      const stay = logOf('kishmish', 'crate')[0];
      ok('"out of the crate" ends the stay and the sleep', stay.end && near(stay.end - stay.t, 40*MIN) && !K().sleep.start);
      openEntrySheet(state.log.indexOf(stay)); ok('a finished stay has start, end and "still going"', !!sh.querySelector('#aIn') && !!sh.querySelector('#bIn') && !!sh.querySelector('#reopen'));
      sh.querySelector('#reopen').click();
      ok('"still going": the same entry runs again', K().crate.start === stay.t && logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].id === stay.id);
      $q('[data-act=edit][data-k=crate]').click(); sh.querySelector('#del').click();
      ok('cancelling a running timer removes it', !K().crate.start && logOf('kishmish', 'crate').length === 0);
      seed([]); $q('[data-act=edit][data-k=sleep]').click(); sh.querySelector('#aIn').value = '01:00'; sh.querySelector('#bIn').value = '01:30'; sh.querySelector('#ok').click();
      ok('start + end = a finished stay', logOf('kishmish', 'sleep').some(e => e.end - e.t === 30*MIN));
      // two phones started the same stay: stopping keeps one
      seed([{ p:'kishmish', k:'crate', t: now - 30*MIN }, { p:'kishmish', k:'crate', t: now - 28*MIN }]);
      ok('two running entries: the earlier one is the stay', K().crate.start === now - 30*MIN);
      tapDur('kishmish', 'crate'); ok('stopping leaves one stay', logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].t === now - 30*MIN && !K().crate.start);
      // leaving the crate always means awake, whichever way the stay ends
      seed([{ p:'kishmish', k:'crate', t: now - 90*MIN }, { p:'kishmish', k:'sleep', t: now - 80*MIN }]);
      $q('[data-act=edit][data-k=crate]').click(); sh.querySelector('#eIn').value = clock(now - 20*MIN); sh.querySelector('#ok').click();
      ok('"the stay already ended at…" also ends the sleep at that time', !K().crate.start && !K().sleep.start && clock(logOf('kishmish', 'sleep')[0].end) === clock(now - 20*MIN) && logOf('kishmish', 'sleep')[0].end === logOf('kishmish', 'crate')[0].end);
      seed([{ p:'kishmish', k:'none', t: now - 30*MIN }, { p:'kishmish', k:'crate', t: now - 29*MIN, r: 10 }, { p:'kishmish', k:'sleep', t: now - 25*MIN }]);
      $q('[data-act=rtpee]').click(); close();
      ok('taking her out from the retry card ends the sleep too', !K().crate.start && !K().sleep.start && !!logOf('kishmish', 'sleep')[0].end);
      // taken out to pee / poop, eating, drinking: none of it happens in the crate or asleep
      for(const k of ['pee','poop','none','food','water']){
        seed([{ p:'kishmish', k:'crate', t: now - 60*MIN }, { p:'kishmish', k:'sleep', t: now - 50*MIN }]);
        tapPoint('kishmish', k); close();
        ok(`logging "${ITEMS[k].log}" ends the crate stay and the sleep`, !K().crate.start && !K().sleep.start && !!logOf('kishmish', 'crate')[0].end && logOf('kishmish', 'sleep')[0].end === logOf('kishmish', 'crate')[0].end);
      }
      seed([{ p:'kishmish', k:'crate', t: now - 60*MIN }, { p:'kishmish', k:'sleep', t: now - 50*MIN }]);
      tapPoint('kishmish', 'pee', now - 20*MIN); close();
      ok('an earlier time ends them at that time', logOf('kishmish', 'crate')[0].end === now - 20*MIN && logOf('kishmish', 'sleep')[0].end === now - 20*MIN);
      seed([{ p:'kishmish', k:'crate', t: now - 60*MIN }, { p:'kishmish', k:'sleep', t: now - 50*MIN }]);
      tapPoint('kishmish', 'pee', now - 90*MIN); close();
      ok('an entry from before she went in changes nothing', !!K().crate.start && !!K().sleep.start);
      seed([{ p:'kishmish', k:'sleep', t: now - 30*MIN }]); tapPoint('kishmish', 'food');
      ok('eating while "asleep" outside the crate ends the sleep', !K().sleep.start);
      pet = 'kochik'; seed([]); tapPoint('kochik', 'food'); ok('no such rule for kochik', logOf('kochik', 'food').length === 1); pet = 'kishmish';
      seed([1,2,3].flatMap(d => [{ p:'kishmish', k:'crate', t: now - d*5*HOUR, end: now - d*5*HOUR + 90*MIN }, { p:'kishmish', k:'sleep', t: now - d*5*HOUR + (4 + d*4)*MIN, end: now - d*5*HOUR + 80*MIN }]));
      ok('the list and the tile say how long after the crate she fell asleep, and the usual time', $q('.uni').textContent.includes('נרדמה 8 דקות אחרי הכניסה לכלוב') && typicalSleep('kishmish') === 'בדרך כלל נרדמת 12 דקות אחרי הכניסה לכלוב' && $q('#sec-rest').textContent.includes('בדרך כלל נרדמת'));
      ok('a sleep outside the crate carries no such note', afterCrate('kishmish', { k:'sleep', t: now - MIN }) === '' && afterCrate('kishmish', { k:'cry', t: now - 5*HOUR + MIN }) === '');
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
    // kochik's poop: what kind it was
    seed([]); tapPoint('kochik', 'poop');
    ok('after a poop: first where…', !!sh.querySelector('[data-w=out]')); sh.querySelector('[data-w=out]').click();
    ok('…then what kind: fine, soft or diarrhoea', sh.querySelector('h3').textContent.includes('איך הוא היה') && [...sh.querySelectorAll('[data-q]')].map(b => b.dataset.q).join() === 'ok,soft,dia');
    sh.querySelector('[data-q=dia]').click();
    ok('diarrhoea is saved and shown on the tile and in the list', logOf('kochik', 'poop')[0].q === 'dia' && logOf('kochik', 'poop')[0].w === 'out' && $q('.card.item [data-k=poop]').closest('.card').textContent.includes('שלשול') && $q('.card.log').textContent.includes('קקי · שלשול'));
    tapPoint('kochik', 'poop', Date.now() - 5*MIN); sh.querySelector('#cancel').click(); sh.querySelector('#cancel').click();
    seed([{ p:'kochik', k:'poop', t: now - 10*MIN }]);
    ok('a poop with no kind shows "which kind?" on the tile', !!$q('[data-act=ptype]'));
    $q('[data-act=ptype]').click(); sh.querySelector('[data-q=soft]').click(); ok('set from the tile', logOf('kochik', 'poop')[0].q === 'soft' && !$q('[data-act=ptype]'));
    openEntrySheet(0); sh.querySelector('[data-q=ok]').click(); sh.querySelector('#ok').click();
    ok('and it can be changed on the entry', logOf('kochik', 'poop')[0].q === 'ok');
    ok('the text log and the summary count it', (seed([{ p:'kochik', k:'poop', t: now - 10*MIN, q:'dia' }]), logText('kochik', midnight(), midnight() + 24*HOUR).includes('קקי · שלשול')) && stats('kochik', midnight(), midnight() + 24*HOUR).q.dia === 1);
    pet = 'kishmish'; seed([]); tapPoint('kishmish', 'poop'); sh.querySelector('#cancel').click();
    ok('kishmish is not asked about the kind', !bg.classList.contains('show')); pet = 'kochik'; seed([]);
    $q('[data-act=pt][data-k=gel]').click(); ok('ear gel logged, counted in days', typeof KO().gel === 'number' && wordsLong(53*HOUR) === 'יומיים ו־5 שעות');
    done();
  } catch(e){ crashed(e); }
})();
