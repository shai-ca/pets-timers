// Kochik: a break from the medicines when she is unwell (the vet's instruction).
(async function(){
  try {
    reset('shai', 'kochik');
    const now = Date.now(), m0 = midnight();
    seed([{ p:'kochik', k:'food', t: now - HOUR }]);
    ok('the checklist as usual, with a link to start a break', $n('.medc .med[data-act=med]') === 2 && !!$q('.medc [data-act=dur][data-k=medoff]') && !$q('.medc.off'));
    $q('.medc [data-act=dur][data-k=medoff]').click();
    ok('on a break: one running entry, the checklist steps aside, nothing is late', logOf('kochik', 'medoff').length === 1 && !logOf('kochik', 'medoff')[0].end && !!$q('.medc.off') && $n('.med[data-act=med]') === 0 && $n('.med.late') === 0 && $q('.medc.off').textContent.includes('בהפסקת תרופות') && $q('.medc.off').textContent.includes('חזרה לתרופות'));
    ok('it shows in the list as going on now', $q('#main .log').textContent.includes('בהפסקת תרופות עכשיו'));
    logOf('kochik', 'medoff')[0].t = now - 50*HOUR; state.log.sort((a, b) => a.t - b.t); use(state); render();
    ok('it can last for days', !!$q('.medc.off') && $q('.medc.off').textContent.includes('יומיים'));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('the day summary says "on a break" instead of "not given"', $q('#main').textContent.includes('בהפסקה') && !$q('#main').textContent.includes('לא ניתנה'));
    ok('stats and the text export do not break on it', typeof stats('kochik', m0, m0 + 24*HOUR).meds === 'number' && logText('kochik', m0 - 72*HOUR, m0 + 24*HOUR).includes('בהפסקת תרופות')); view = 'now'; render();
    $q('.medc.off [data-act=dur][data-k=medoff]').click();
    ok('"back to the medicines" ends the break and the checklist returns', !!logOf('kochik', 'medoff')[0].end && !$q('.medc.off') && $n('.medc .med[data-act=med]') === 2);
    $q('.med[data-k=am]').click(); if(bg.classList.contains('show')){ const b = sh.querySelector('#ok') || sh.querySelector('[data-m="0"]'); if(b) b.click(); }
    ok('medicines can be marked again', !!medsOf('kochik').am || bg.classList.contains('show')); close();
    pet = 'kishmish'; render(); ok('nothing of this for kishmish', !$q('.medc') && !$q('[data-k=medoff]'));
    done();
  } catch(e){ crashed(e); }
})();
