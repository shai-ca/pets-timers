// A retry and the gravel clock are one card, at the top of the page (owner, 25.11): no second gravel card.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, K0 = {p:'kishmish'};
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{...K0, k:'pee', t: now - 200*MIN, w:'gravel'}]);
    tile('none').click();
    ok('a retry: one gravel card, carrying the retry head, in the potty section at the top of the side column', !!retry('kishmish') && $n('.card.slim.gravel') === 1 && !!$q('#side > #sec-potty .card.gravel.retry .rt-head') && $n('.card.retry') === 1);
    $q('.card.retry [data-act=dur][data-k=gravel]').click();
    ok('"יצאנו לחצץ" during a retry: still one card — the head, the gravel clock, פיפי · קקי · לא עשתה and both ×', $n('.card.slim.gravel') === 1 && $n('.card.retry') === 1 && !!$q('.card.retry.on .rt-t, .card.retry.on [data-since]') && ['pee','poop','none'].every(k => !!$q(`.card.retry [data-act=pt][data-k=${k}]`)) && !!$q('.card.retry [data-act=rtstop]') && !!$q('.card.retry [data-act=dur][data-k=gravel]'));
    $q('.card.retry [data-act=pt][data-k=none]').click();
    ok('"לא עשתה" there: the clock stops, the next wait starts (try 2), still one card', !(K().gravel || {}).start && retry('kishmish').tries === 2 && $n('.card.slim.gravel') === 1);
    $q('.card.retry [data-act=pt][data-k=pee]').click(); const g = sh.querySelector('[data-w=gravel]'); if(g) g.click();
    ok('a pee: the retry is over and the potty section is back in its place', !retry('kishmish') && !$q('.card.retry') && !$q('#side > #sec-potty'));
    done();
  } catch(e){ crashed(e); }
})();
