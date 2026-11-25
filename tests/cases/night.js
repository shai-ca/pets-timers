// Night (23:00–06:00): dark, only crate / gravel / pee / poop and a cry row; the food alert waits for the morning.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 9*HOUR }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - MIN }]);   // just in: not yet asleep, so the food alert does not depend on the real clock
    ok('by day: the full screen and the food alert', $n('.card.alertc') === 1 && !!$q('.cyc') && !document.body.classList.contains('night') && !$q('.nightc'));
    FAKE_HOUR = 2; render();
    ok('02:00: dark', document.body.classList.contains('night') && document.documentElement.classList.contains('night'));
    ok('only the crate, pee and poop tiles, one drink row (v3) and a cry row', $n('#main .card.item') === 3 && !!$q('[data-act=dur][data-k=crate]') && !!tile('pee') && !!tile('poop') && !!$q('.cryrow [data-act=dur][data-k=cry]') && !$q('.cyc') && !$q('.card.retry') && !$q('.playc') && !tile('food') && $n('#main [data-k=water]') === 1 && !!$q('.card.water.nightw') && !$q('#sec-rest') && !$q('.uni'));
    ok('no food alert at night', $n('.card.alertc') === 0);
    ok('the gravel outing is there at night too', !!$q('.card.gravel [data-act=dur][data-k=gravel]'));
    $q('.card.gravel [data-act=dur][data-k=gravel]').click();
    ok('…it starts the gravel clock, with pee · poop · none · end', !!K().gravel.start && !!$q('.card.gravel.on [data-k=poop]') && !!$q('.card.gravel.on .gend'));
    $q('.card.gravel.on .gend').click(); ok('…and "סיום" ends it', !K().gravel.start && !!$q('.nightc'));
    seed([{ ...K0, k:'food', t: now - 9*HOUR }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }]);
    $q('.cryrow [data-act=dur][data-k=cry]').click();
    ok('the cry row starts and stops crying', !!K().cry.start && $q('.cryrow').classList.contains('on') && $q('.cryrow button').textContent === ITEMS.cry.stop);
    $q('.cryrow [data-act=dur][data-k=cry]').click(); ok('…and stops it', !K().cry.start && logOf('kishmish', 'cry').length === 1);
    tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    ok('a pee at night is logged as usual and takes her out of the crate', logOf('kishmish', 'pee').length === 2 && !K().crate.start);
    seed([{ ...K0, k:'pee', t: now - 7*HOUR, w:'gravel' }, { ...K0, k:'poop', t: now - 49*HOUR }, { ...K0, k:'food', t: now - 9*HOUR }]);
    ok('the health alerts still show at night', $n('#side .card.alertc') === 2 && !$q('.card.alertc').textContent.includes('אוכל'));
    $q('[data-act=nightfull]').click();
    ok('"show everything": the full screen, still dark', !!$q('.cyc') && !!tile('food') && !$q('.nightc') && document.body.classList.contains('night'));
    nightFull = false; pet = 'kochik'; render(); ok('kochik (v3): dark, her own slim night screen', document.body.classList.contains('night') && $n('#main .card.item') === 3 && !!$q('.nightc'));
    $q('[data-act=nightfull]').click(); ok('kochik: "show everything" shows everything', $n('#main .card.item') > 3 && !$q('.nightc')); nightFull = false;
    view = 'sum'; pet = 'kishmish'; render(); ok('the summary is not cut down', !$q('.nightc') && !!$q('.tile')); view = 'now';
    FAKE_HOUR = 23; render(); ok('23:00 is night', !!$q('.nightc'));
    FAKE_HOUR = 6; render(); ok('06:00: the full screen and the food alert are back', !$q('.nightc') && [...document.querySelectorAll('.card.alertc')].some(c => c.textContent.includes('אוכל')));
    // dark colours: 20:00 until sunrise
    const sr = new Date(sunrise(Date.now())), srH = sr.getHours() + sr.getMinutes()/60;
    ok('sunrise is worked out for the day, between 05:20 and 06:50 local time', srH > 5.3 && srH < 6.85);
    const jun = new Date(2026, 5, 21), dec = new Date(2026, 11, 21), h = t => { const x = new Date(sunrise(t)); return x.getHours()*60 + x.getMinutes(); };
    ok('earliest in June (about 05:30), latest in winter (about 06:30)', Math.abs(h(jun.getTime()) - (5*60 + 33)) <= 10 && Math.abs(h(dec.getTime()) - (6*60 + 37)) <= 12);
    FAKE_HOUR = srH - 0.1; render(); ok('a few minutes before sunrise: still dark', document.body.classList.contains('night'));
    FAKE_HOUR = srH + 0.1; render(); ok('a few minutes after sunrise: light', !document.body.classList.contains('night'));
    FAKE_HOUR = 19.9; render(); ok('19:54: light', !document.body.classList.contains('night'));
    FAKE_HOUR = 20; render(); ok('20:00: dark, but the full screen — the cut-down night screen waits for 23:00', document.body.classList.contains('night') && !$q('.nightc') && !!$q('.cyc'));
    done();
  } catch(e){ crashed(e); }
})();
