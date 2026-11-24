// Kochik: vomiting, and what came up.
(async function(){
  try {
    reset('shai', 'kochik');
    const now = Date.now(), m0 = midnight();
    seed([{ p:'kochik', k:'food', t: now - HOUR }]);
    ok('kochik has a vomiting tile', !!tile('vomit') && tile('vomit').textContent === 'הקיאה');
    tile('vomit').click();
    ok('it is logged and asks what came up: digestive fluids or food', logOf('kochik', 'vomit').length === 1 && bg.classList.contains('show') && [...sh.querySelectorAll('[data-q]')].map(b => b.textContent).join() === 'נוזלי עיכול,אוכל' && sh.querySelector('h3').textContent.includes('קיא של מה'));
    sh.querySelector('[data-q=bile]').click();
    ok('the answer is saved and shown on the tile and in the list', logOf('kochik', 'vomit')[0].q === 'bile' && $q('#main').textContent.includes('הקיאה · נוזלי עיכול') && typeof KO().vomit === 'number');
    tile('vomit').click(); sh.querySelector('#cancel').click();
    ok('skipping the question keeps the entry, with a link to say later', logOf('kochik', 'vomit').length === 2 && !logOf('kochik', 'vomit')[1].q && !!$q('[data-act=ptype][data-k=vomit]'));
    $q('[data-act=ptype][data-k=vomit]').click(); sh.querySelector('[data-q=food]').click();
    ok('…and the link sets it', logOf('kochik', 'vomit')[1].q === 'food');
    $q('.r[data-e="' + state.log.indexOf(logOf('kochik', 'vomit')[0]) + '"]').click();
    ok('the entry can be corrected from the list', sh.querySelector('[data-q].sel').dataset.q === 'bile' && sh.querySelectorAll('[data-q]').length === 2);
    sh.querySelector('[data-q=food]').click(); sh.querySelector('#ok').click();
    ok('changed', logOf('kochik', 'vomit')[0].q === 'food');
    ok('the text export says it', logText('kochik', m0, m0 + 24*HOUR).includes('הקיאה · אוכל') && logText('kochik', m0, m0 + 24*HOUR).includes('הקאות 2'));
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('the summary counts vomiting and splits it by kind', $q('.tile[data-k=vomit] b').textContent === '2' && $q('.tile[data-k=vomit]').textContent.includes('אוכל 2')); view = 'now';
    tapPoint('kochik', 'poop'); ok('a poop still asks where and then what kind, as before', !!sh.querySelector('[data-w]')); close();
    pet = 'kishmish'; render(); ok('no vomiting tile for kishmish', !tile('vomit'));
    done();
  } catch(e){ crashed(e); }
})();
