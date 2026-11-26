// The information hierarchy (owner, 26.11 evening): on the real default (sections CLOSED), the tracking screen answers
// "what is she doing / what to do / what next" in one Now card, then one-tap logging with the time since each; the
// details, statistics, history, grooming and vet notes are folded; the rings are in the summary tab; Kochik keeps her
// medicines and care tiles open. Both designs.
// @variants #kochik
(async function(){
  try {
    window.KEEP_FOLDS = true; reset();
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 50*MIN, m:'meal' }, { ...K0, k:'pee', t: now - 40*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 3*HOUR }]);
    pet = 'kishmish'; view = 'now'; render(); await wait(2);
    const side = $q('#side'), first = side.querySelector('.nowc');
    ok('one Now card at the top: state, the next thing due', !!first && !!first.querySelector('.now-s') && side.querySelectorAll('.nowc').length === 1);
    ok('quick logging right under it: pee, poop, "לא עשתה", gravel, ate, drank, asleep, crying — one tap each', ['pee','poop','none','gravel','food','water','sleep','cry'].every(k => !!$q(`.quick [data-k=${k}]`)) && !$q('details .quick'));
    ok('pee, poop and food show the time since the last one', ['pee','poop','food'].every(k => /\d/.test($q(`.quick [data-k=${k}] small`).textContent)));
    ok('details, history, grooming and vet notes are folded by default', ['crate','potty','food','rest','hist','notes','bath'].every(f => { const d = $q(`details[data-f=${f}]`); return d && !d.open; }));
    ok('the advice / wheel text is not repeated on the screen: no separate advice card, the wheel folded into a strip', !$q('#side > .advice') && !!$q('details[data-f=cycle] .strip') && !$q('details[data-f=cycle]').open);
    ok('no rings on the tracking screen', !$q('#side .scores, #main .scores'));
    { const d = $q('details[data-f=potty]'); d.open = true; d.dispatchEvent(new Event('toggle')); render(); await wait(1);
      ok('an opened section stays open across redraws', $q('details[data-f=potty]').open); }
    { const h = document.body.scrollHeight; ok('the page is short: ' + h + 'px', h < 3200); }
    if(location.hash === '#kochik'){
      pet = 'kochik'; render(); await wait(2);
      ok('Kochik: medicines and her care tiles stay open (medically important), grooming / notes / history folded', !!$q('.medc') && !!$q('#main [data-act=pt][data-k=pee]') && !$q('details .medc') && ['bath','notes','hist'].every(f => !!$q(`details[data-f=${f}]`)));
      ok('Kochik: no camera at all', !$q('.nowcam') && !$q('.camc'));
    }
    window.KEEP_FOLDS = false;
    done();
  } catch(e){ crashed(e); }
})();
