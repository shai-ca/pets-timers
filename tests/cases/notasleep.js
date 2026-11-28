// "לא נרדמה": one tap on the sleep tile or on the wheel's "asleep" line says she did not fall asleep.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, K0 = { p:'kishmish' }, A = ASSUME_SLEEP;
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const btn = () => $q('#sec-rest [data-act=notasleep]'), zz = () => $q('.zz [data-act=notasleep]');
    seed([{ ...K0, k:'crate', t: now - MIN }]);
    ok('not offered while she is not shown asleep', !btn() && !zz());
    // an estimate, a few minutes old: one tap
    seed([{ ...K0, id:'st', k:'crate', t: now - 10*MIN }]);
    ok('offered on the tile and on the wheel line while an estimated sleep runs', !!btn() && !!zz() && K().sleep.assumed);
    zz().click();
    ok('one tap: the estimate is gone for this stretch, nothing else written, still in the crate', !K().sleep.start && K().spans.length === 0 && canon(state.log[0].nsx) === canon([now - 10*MIN + A]) && state.log.length === 1 && !!K().crate.start && !btn() && !sh.querySelector('#ok'));
    ok('the "did she fall asleep?" card waits before asking again', !!$q('.sleepq.wait'));
    // a marked sleep, a few minutes old
    awakeUntil = 0;
    seed([{ ...K0, id:'st', k:'crate', t: now - 12*MIN }, { ...K0, k:'sleep', t: now - 5*MIN }]);
    ok('offered for a sleep she marked', !!btn() && !K().sleep.assumed);
    btn().click();
    ok('the marked sleep is removed and no estimate steps into its place', logOf('kishmish', 'sleep').length === 0 && !K().sleep.start && K().spans.length === 0 && canon(state.log[0].nsx) === canon([now - 5*MIN]) && !!K().crate.start);
    // out of the crate
    seed([{ ...K0, k:'sleep', t: now - 5*MIN }]);
    btn().click();
    ok('a marked sleep outside the crate is just removed', state.log.length === 0 && !K().sleep.start);
    // a long one asks first
    seed([{ ...K0, id:'st', k:'crate', t: now - 60*MIN }]);
    btn().click();
    ok('a sleep shown for a long time is confirmed first', !!K().sleep.start && sh.querySelector('h3').textContent.includes('לא נרדמה?'));
    sh.querySelector('#cancel').click();
    ok('cancel leaves it', !!K().sleep.start && !state.log[0].nsx);
    btn().click(); sh.querySelector('#ok').click();
    ok('confirming removes it', !K().sleep.start && K().spans.length === 0);
    // another stretch of the same stay is untouched
    seed([{ ...K0, id:'st', k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 20*MIN, end: now - 12*MIN }]);
    btn().click();
    ok('only the current stretch: the sleep before the cry stays', !K().sleep.start && K().spans.length === 1 && K().spans[0].end === now - 20*MIN);
    // "start time" on an estimate: quick "now / 5 minutes ago" buttons, like every other "when?" sheet
    seed([{ ...K0, id:'st', k:'crate', t: now - 30*MIN }]);
    $q('[data-act=edit][data-k=sleep]').click();
    ok('the estimate\'s sheet has the quick buttons, "now" first', sh.querySelector('.chips [data-m]').textContent === 'עכשיו' && !!sh.querySelector('[data-m="5"]') && !!sh.querySelector('#agoIn'));
    sh.querySelector('[data-m="5"]').click();
    ok('"5 minutes ago" writes a real, running sleep from then and the estimate is gone', logOf('kishmish', 'sleep').length === 1 && Math.abs(K().sleep.start - (now - 5*MIN)) < 3000 && !K().sleep.assumed && K().spans.length === 1 && !!K().crate.start);
    $q('[data-act=edit][data-k=sleep]').click();
    ok('a marked sleep\'s start sheet offers "now" too', sh.querySelector('.chips [data-m]').textContent === 'עכשיו');
    sh.querySelector('[data-m="0"]').click();
    ok('"now" moves its start to now', logOf('kishmish', 'sleep').length === 1 && Date.now() - K().sleep.start < 3000);
    seed([{ ...K0, id:'st', k:'crate', t: now - 30*MIN }]);
    $q('[data-act=edit][data-k=sleep]').click(); sh.querySelector('#agoIn').value = '7'; sh.querySelector('#ok').click();
    ok('a typed number of minutes works there as well', Math.abs(K().sleep.start - (Date.now() - 7*MIN)) < 3000 && !K().sleep.assumed);
    close();
    ok('Kochik has no such button', (pet = 'kochik', render(), !$q('[data-act=notasleep]')));
    // owner, 28.11: "עדיין ערה" survives a hard refresh, for the same crate stay only
    { reset(); const T = Date.now(); SLEEP2_FROM = T - 5*24*HOUR; seed([{ p:'kishmish', k:'crate', t: T - 30*MIN }]); render();   // the mesh crate with too few marked sleeps: no estimate, so the question is asked
      ok('reload: a quiet crate asks "נרדמה?" (wording: nothing logged, not "quiet")', !!$q('.sleepq:not(.wait)') && $q('.sleepq').textContent.includes('לא נרשם דבר בכלוב') && !$q('.sleepq').textContent.includes('שקטה'));
      $q('[data-act=stillawake]').click(); await wait(2);
      loadAwake(); render();   // = a hard refresh: memory gone, the answer read back from this device
      ok('…after a reload the same stay shows the countdown, not the question again', !!$q('.sleepq.wait') && !$q('.sleepq:not(.wait)'));
      seed([{ p:'kishmish', k:'crate', t: T - 50*MIN, end: T - 40*MIN }, { p:'kishmish', k:'crate', t: T - 20*MIN }]); loadAwake(); render();
      ok('…a DIFFERENT stay is asked normally (the answer belonged to the earlier stay)', !!$q('.sleepq:not(.wait)')); }
    done();
  } catch(e){ crashed(e); }
})();
