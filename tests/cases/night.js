// Night (23:00–06:00): dark, only crate / pee / poop and a cry row; the food alert waits for the morning.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 9*HOUR }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }]);
    ok('by day: the full screen and the food alert', $n('.card.alertc') === 1 && !!$q('.cyc') && !document.body.classList.contains('night') && !$q('.nightc'));
    FAKE_HOUR = 2; render();
    ok('02:00: dark', document.body.classList.contains('night') && document.documentElement.classList.contains('night'));
    ok('only the crate, pee and poop tiles and a cry row', $n('#main .card.item') === 3 && !!$q('[data-act=dur][data-k=crate]') && !!tile('pee') && !!tile('poop') && !!$q('.cryrow [data-act=dur][data-k=cry]') && !$q('.cyc') && !$q('.card.retry') && !$q('.playc') && !tile('food') && !tile('water') && !$q('#sec-rest') && !$q('.uni'));
    ok('no food alert at night', $n('.card.alertc') === 0);
    $q('.cryrow [data-act=dur][data-k=cry]').click();
    ok('the cry row starts and stops crying', !!K().cry.start && $q('.cryrow').classList.contains('on') && $q('.cryrow button').textContent === ITEMS.cry.stop);
    $q('.cryrow [data-act=dur][data-k=cry]').click(); ok('…and stops it', !K().cry.start && logOf('kishmish', 'cry').length === 1);
    tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    ok('a pee at night is logged as usual and takes her out of the crate', logOf('kishmish', 'pee').length === 2 && !K().crate.start);
    seed([{ ...K0, k:'pee', t: now - 7*HOUR, w:'gravel' }, { ...K0, k:'poop', t: now - 49*HOUR }, { ...K0, k:'food', t: now - 9*HOUR }]);
    ok('the health alerts still show at night', $n('#side .card.alertc') === 2 && !$q('.card.alertc').textContent.includes('אוכל'));
    $q('[data-act=nightfull]').click();
    ok('"show everything": the full screen, still dark', !!$q('.cyc') && !!tile('food') && !$q('.nightc') && document.body.classList.contains('night'));
    nightFull = false; pet = 'kochik'; render(); ok('kochik: dark, nothing hidden', document.body.classList.contains('night') && $n('#main .card.item') >= 3 && !$q('.nightc'));
    view = 'sum'; pet = 'kishmish'; render(); ok('the summary is not cut down', !$q('.nightc') && !!$q('.tile')); view = 'now';
    FAKE_HOUR = 23; render(); ok('23:00 is night', !!$q('.nightc'));
    FAKE_HOUR = 6; render(); ok('06:00: day again, and the food alert is back', !$q('.nightc') && !document.body.classList.contains('night') && [...document.querySelectorAll('.card.alertc')].some(c => c.textContent.includes('אוכל')));
    done();
  } catch(e){ crashed(e); }
})();
