// @window 520,1000
// "מסך יונתן" (26.11): the optional simple screen for fast logging. A per-device switch; every button writes exactly what
// the same action writes on the full screen; one outing can hold a pee and a poop; "פיפי וקקי" in one tap; "לא עשתה";
// undo; the two small clocks; Kochik and the night screen unchanged; geometry at a phone width (simplew.js: desktop).
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const now = Date.now(), K0 = { p:'kishmish' };
    const shape = () => state.log.filter(e => e.p === 'kishmish').map(e => [e.k, e.w || '', e.q || '', e.m || '', e.end == null ? 'run' : 'end', e.by || ''].join(':')).join(' | ');
    const fresh = () => state.log.filter(e => e.p === 'kishmish' && e.k !== 'gravel' && e.t > now - MIN).every(e => Math.abs(e.t - Date.now()) < 10000);
    const gRow = () => $q('#main .card.slim.gravel'), spl = k => $q('#main [data-act=spl][data-k=' + k + ']');
    const skipType = () => { if(bg.classList.contains('show') && sh.querySelector('[data-q]')) sh.querySelector('#cancel').click(); };
    const simple = on => { SIMPLE = on; render(); };
    const BASE = () => [{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'pee', t: now - 150*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 3*HOUR, m:'meal' }];   // 2.5 h since a pee: a "לא עשתה" calls a retry
    const ageG = () => { const g = logOf('kishmish', 'gravel').find(e => e.end == null); if(g){ g.t -= MIN; use(state); render(); } };   // the outing began a minute ago, not in the same millisecond as its result

    // ---- the switch and its per-device memory ----
    reset(); seed(BASE());
    const log0 = JSON.stringify(state.log);
    ok('off by default: the full screen, with a quiet link at the bottom', !SIMPLE && !!$q('.cyc') && !$q('.smp-h') && !!$q('#dsw [data-act=simple][data-k="1"]') && $q('#dsw .smp-set').textContent === 'מסך יונתן · רישום מהיר');
    $q('#dsw [data-act=simple]').click();
    ok('the link turns it on, remembered on this phone only', SIMPLE && localStorage.getItem(LS_KEY + '-simple') === '1' && readSimple() === true && JSON.stringify(state.log) === log0);
    ok('the simple screen: header, two clocks, יצאנו לחצץ · אכלה · שתתה', !!$q('#main.simple .smp-h') && $n('.smp-since .smp-c') === 2 && spl('gravel').textContent === 'יצאנו לחצץ' && spl('food').textContent === 'אכלה' && spl('water').textContent === 'שתתה' && $n('#main [data-act=spl]') === 3);
    ok('…and none of the rest: no wheel, rings, advice, ribbon, gauges, history, camera, side column', !$q('.cyc') && !$q('.scores') && !$q('.advice') && !$q('.ribbon') && !$q('.gauge') && !$q('.uni') && !$q('.camc') && !$q('#dsw [data-cam]') && $q('#side').innerHTML === '' && !$q('.card.item'));
    ok('the dog tabs and the design switch stay', $n('.seg [data-pet]') === 2 && !!$q('#dsw [data-act=v2]') && $q('#dsw .smp-set').textContent === 'מסך יונתן פעיל · למסך המלא');
    $q('.smp-h [data-act=simple]').click();
    ok('the full screen is one tap away (header button), and that is remembered too', !SIMPLE && localStorage.getItem(LS_KEY + '-simple') === '0' && readSimple() === false && !!$q('.cyc') && JSON.stringify(state.log) === log0);
    $q('#dsw [data-act=simple]').click(); $q('#dsw [data-act=simple]').click();
    ok('the bottom link switches back as well', !SIMPLE && !!$q('.cyc'));
    { const g = Storage.prototype.getItem, s = Storage.prototype.setItem; let threw = false;
      Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); };
      try { ok('storage blocked: read as off, and switching still works for this session', readSimple() === false && (setSimple(true), SIMPLE === true && !!$q('.smp-h'))); } catch(e){ threw = true; }
      Storage.prototype.getItem = g; Storage.prototype.setItem = s; ok('…without an error', !threw); setSimple(false); }

    // ---- each button writes what the full screen writes ----
    const run = (on, steps) => { reset(); seed(BASE()); simple(on); steps(); close(); return shape(); };
    // a whole outing: start, pee, poop, end — then a drink and a meal
    const full1 = run(false, () => {
      gRow().querySelector('[data-act=dur][data-k=gravel]').click(); ageG();
      gRow().querySelector('[data-act=pt][data-k=pee]').click(); sh.querySelector('[data-w=gravel]').click(); skipType();
      gRow().querySelector('[data-act=pt][data-k=poop]').click(); sh.querySelector('[data-w=gravel]').click(); skipType();
      gRow().querySelector('.gend').click();
      $q('#main [data-act=pt][data-k=water]').click(); tile('food').click();
    });
    let askedWhere = false, askedType = false;
    const simp1 = run(true, () => {
      spl('gravel').click(); ageG();
      spl('pee').click(); askedWhere = askedWhere || (bg.classList.contains('show') && !!sh.querySelector('[data-w]'));
      spl('poop').click(); askedWhere = askedWhere || (bg.classList.contains('show') && !!sh.querySelector('[data-w]')); askedType = bg.classList.contains('show') && !!sh.querySelector('[data-q]'); skipType();
      spl('end').click(); spl('water').click(); spl('food').click();
    });
    ok('a whole outing + a drink + a meal: the same entries as on the full screen ' + simp1 + ' VS ' + full1, simp1 === full1 && simp1.includes('pee:gravel') && simp1.includes('poop:gravel') && fresh());
    ok('"איפה?" is not asked (the outing says gravel); a poop still asks "איך הוא היה?"', !askedWhere && askedType);

    // ---- one outing with פיפי, then קקי, then סיום ----
    reset(); seed(BASE()); simple(true);
    spl('gravel').click();
    ok('יצאנו לחצץ = the gravel clock (her crate stay ends, as on the full screen), four results and סיום', !!K().gravel.start && !K().crate.start && !!$q('.smp-out [data-since]') && [...$q('.smp-g').children].map(b => b.textContent).join() === 'פיפי,קקי,פיפי וקקי,לא עשתה' && !!spl('end') && !spl('gravel'));
    logOf('kishmish', 'gravel')[0].t = Date.now() - 4*MIN; use(state); render();
    spl('pee').click(); close();
    ok('פיפי: the outing goes on and says what was logged', !!K().gravel.start && $q('.smp-out').textContent.includes('נרשם: פיפי'));
    spl('poop').click(); close();
    ok('קקי: still the same outing, both listed', !!K().gravel.start && $q('.smp-out').textContent.includes('נרשם: פיפי') && $q('.smp-out').textContent.includes('קקי'));
    spl('end').click();
    { const g = logOf('kishmish', 'gravel')[0], pe = logOf('kishmish', 'pee').pop(), po = logOf('kishmish', 'poop').pop();
      ok('סיום closes it: one outing, both results belong to it, each with its wait', !K().gravel.start && logOf('kishmish', 'gravel').length === 1 && g.end != null && gravelOf(pe) === g && gravelOf(po) === g && waitOf(pe) >= 4*MIN - 1000 && lastOuting('kishmish').out === 'פיפי וקקי');
      ok('back to the start button', !!spl('gravel') && !$q('.smp-out')); }

    // ---- פיפי וקקי in one tap ----
    const full2 = run(false, () => {
      gRow().querySelector('[data-act=dur][data-k=gravel]').click(); ageG();
      gRow().querySelector('[data-act=pt][data-k=pee]').click(); sh.querySelector('[data-w=gravel]').click(); skipType();
      gRow().querySelector('[data-act=pt][data-k=poop]').click(); sh.querySelector('[data-w=gravel]').click(); skipType();
    });
    reset(); seed(BASE()); simple(true); spl('gravel').click(); ageG();
    const before2 = state.log.length; spl('both').click();
    const typeAsk = bg.classList.contains('show') && !!sh.querySelector('[data-q]') && !sh.querySelector('[data-w]'); skipType();
    { const g = logOf('kishmish', 'gravel')[0], pe = logOf('kishmish', 'pee').pop(), po = logOf('kishmish', 'poop').pop();
      ok('פיפי וקקי: two entries, the same as two taps on the full screen ' + shape(), shape() === full2 && state.log.length === before2 + 2);
      ok('…both in this outing, which goes on; one toast for both', gravelOf(pe) === g && gravelOf(po) === g && !!K().gravel.start && $q('#toastMsg').textContent === 'קישמיש · פיפי וקקי' && $q('#toast').classList.contains('show'));
      ok('…only the poop\'s "איך הוא היה?" is asked, not "איפה?"', typeAsk); }
    $q('#undo').click();
    ok('one undo takes back both, the outing is still running', logOf('kishmish', 'pee').length === 1 && logOf('kishmish', 'poop').length === 0 && !!K().gravel.start);
    // the double-tap guard asks once for both
    DUP_MS = 2*60000; spl('pee').click(); close(); const n3 = state.log.length;
    spl('both').click();
    ok('right after a pee: "כבר נרשם" once; "no" logs nothing', bg.classList.contains('show') && sh.textContent.includes('כבר נרשם') && (sh.querySelector('#cancel').click(), state.log.length === n3));
    spl('both').click(); sh.querySelector('#ok').click(); skipType();
    ok('"yes": both are logged', state.log.length === n3 + 2 && logOf('kishmish', 'poop').length === 1); DUP_MS = 0;

    // ---- לא עשתה ----
    const full3 = run(false, () => { gRow().querySelector('[data-act=dur][data-k=gravel]').click(); ageG(); gRow().querySelector('[data-act=pt][data-k=none]').click(); });
    reset(); seed(BASE()); simple(true); spl('gravel').click(); logOf('kishmish', 'gravel')[0].t = Date.now() - 6*MIN; use(state); render();
    spl('none').click();
    { const none = logOf('kishmish', 'none')[0];
      ok('לא עשתה: what the full screen writes (here also the retry\'s crate entry) ' + shape(), shape() === full3 && fresh());
      ok('…it ends the outing with its wait, and the retry shows its countdown here', !K().gravel.start && Math.abs(waitOf(none) - 6*MIN) < 3000 && !!retry('kishmish') && !!$q('.smp-rt .rt-head') && !!spl('gravel')); }
    $q('#undo').click();
    ok('undo: the "לא עשתה" and its crate entry are gone, the outing runs again', logOf('kishmish', 'none').length === 0 && !!K().gravel.start && logOf('kishmish', 'crate').length === 1);

    // ---- אכלה / שתתה: one tap, the same guards and toasts ----
    reset(); seed([{ ...K0, k:'food', t: now - 30*MIN, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }]); simple(true);
    spl('food').click();
    ok('אכלה soon after a meal: a bite, with the toast\'s "זו הייתה ארוחה"', logOf('kishmish', 'food').length === 2 && mealKind(logOf('kishmish', 'food').pop()) === 'bite' && !!$q('#toastWhere #toMeal'));
    $q('#toastWhere #toMeal').click();
    ok('…which makes it a meal', logOf('kishmish', 'food').pop().m === 'meal');
    reset(); seed([{ ...K0, k:'food', t: now - 30*MIN, m:'meal' }]); simple(true); spl('food').click(); const fs = shape();
    reset(); seed([{ ...K0, k:'food', t: now - 30*MIN, m:'meal' }]); tile('food').click();
    ok('…the same as the full screen\'s אכלה', shape() === fs);
    reset(); seed(BASE()); simple(true); spl('water').click();
    ok('שתתה: one tap, an ordinary drink entry, with undo', logOf('kishmish', 'water').length === 1 && $q('#toastMsg').textContent.includes(ITEMS.water.log) && fresh());
    $q('#undo').click(); ok('undo takes it back', logOf('kishmish', 'water').length === 0);
    DUP_MS = 2*60000; spl('water').click(); spl('water').click();
    ok('the double-tap guard is the same ("כבר נרשם")', bg.classList.contains('show') && sh.textContent.includes('כבר נרשם'));
    sh.querySelector('#cancel').click(); ok('…"no" logs nothing', logOf('kishmish', 'water').length === 1); DUP_MS = 0;
    // who is logging: asked first, then the entry carries the name
    reset(); seed(BASE()); simple(true); me = null; spl('water').click();
    ok('no user on this phone yet: "מי משתמש/ת" first, nothing written', bg.classList.contains('show') && !!sh.querySelector('[data-u]') && logOf('kishmish', 'water').length === 0);
    sh.querySelector('[data-u=yonatan], [data-u]').click();
    ok('…then the drink, stamped with the chosen name', logOf('kishmish', 'water').length === 1 && !!logOf('kishmish', 'water')[0].by);

    // ---- the elapsed clocks ----
    reset(); seed([{ ...K0, k:'food', t: now - 2*HOUR, m:'meal' }, { ...K0, k:'play', y:'rope', t: now - 80*MIN }, { ...K0, k:'food', t: now - 10*MIN, m:'bite' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }]); simple(true);   // observed since (release 6b)
    { const c = [...document.querySelectorAll('.smp-since [data-since]')];
      ok('two clocks: since the last pee and since the last MEAL (a bite does not reset it), live like the tiles', c.length === 2 && +c[0].dataset.since === K().pee && +c[1].dataset.since === K().food && K().food === now - 2*HOUR && c[1].textContent === dur(Date.now() - (now - 2*HOUR)) && $q('.smp-since').textContent.includes('מאז הפיפי') && $q('.smp-since').textContent.includes('מאז הארוחה')); }
    spl('gravel').click(); ageG(); spl('pee').click(); close();
    ok('…and a pee moves the pee clock', +$q('.smp-since [data-since]').dataset.since === K().pee && Date.now() - K().pee < 5000);
    reset(); seed([]); simple(true);
    ok('nothing logged yet: "–"', $n('.smp-since b.none') === 2 && $n('.smp-since [data-since]') === 0);

    // ---- Kochik gets her normal screen ----
    reset(); seed(BASE().concat([{ p:'kochik', k:'food', t: now - HOUR }])); simple(true);
    pet = 'kochik'; render();
    ok('Kochik: her normal screen, no simple link', !$q('.smp-h') && $q('#main').className === 'grps solo' && !!tile('food') && !$q('#dsw .smp-set'));
    pet = 'kishmish'; render(); ok('back to Kishmish: the simple screen again', !!$q('.smp-h'));
    view = 'sum'; render(); ok('the summary is unchanged', !$q('.smp-h') && !!$q('.tile') && !$q('#dsw .smp-set')); view = 'now'; render();

    // ---- night: unchanged ----
    reset(); seed(BASE());
    const strip = s => s.replace(/\d/g, '');
    FAKE_HOUR = 2; SIMPLE = false; render(); const nm = strip($q('#main').innerHTML), ns = strip($q('#side').innerHTML), nd = $q('#dsw').innerHTML;
    SIMPLE = true; render();
    ok('02:00 with the simple screen chosen: the same night screen, byte for byte', !!$q('.nightc') && !$q('.smp-h') && strip($q('#main').innerHTML) === nm && strip($q('#side').innerHTML) === ns && $q('#dsw').innerHTML === nd && !$q('#dsw .smp-set'));
    $q('[data-act=nightfull]').click(); ok('"להציג הכול" at night: the full screen, as before', !!$q('.cyc') && !$q('.smp-h'));
    nightFull = false; FAKE_HOUR = 6; render(); ok('06:00: the simple screen is back', !!$q('.smp-h'));
    FAKE_HOUR = 21; render(); ok('21:00 (dark colours, not the night screen): the simple screen, dark', !!$q('.smp-h') && document.body.classList.contains('night'));
    FAKE_HOUR = 12;

    // ---- geometry at this width (phone) ----
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const geo = label => {
      const kids = [...$q('#main').children].filter(x => R(x).height > 0), bad = [];
      for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push(kids[i].className + ' × ' + kids[j].className);
      const btns = [...$q('#main').querySelectorAll('button')], bb = [];
      for(let i = 0; i < btns.length; i++) for(let j = i + 1; j < btns.length; j++) if(over(R(btns[i]), R(btns[j])) > 1) bb.push(btns[i].textContent + ' × ' + btns[j].textContent);
      const m = R($q('#main')), small = btns.filter(b => b.dataset.act === 'spl' && (R(b).height < 52 || R(b).width < 100)).map(b => b.textContent);
      const outside = btns.filter(b => R(b).left < m.left - 1 || R(b).right > m.right + 1).map(b => b.textContent);
      ok(label + ': no two parts overlap ' + bad.join(', '), !bad.length);
      ok(label + ': no two buttons overlap ' + bb.join(', '), !bb.length);
      ok(label + ': nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1 && !outside.length);
      ok(label + ': large tap targets ' + small.join(', '), !small.length);
      ok(label + ': the screen fits its column (' + Math.round(m.width) + 'px)', m.width <= 561 && m.width > 300);
    };
    reset(); seed([{ ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }]); simple(true); await pause(50);
    geo(innerWidth + 'px, idle (with the food alert)');
    ok('the red food alert stays on this screen', $n('#main .card.alertc') === 1);
    spl('gravel').click(); ageG(); spl('pee').click(); close(); await pause(50);
    geo(innerWidth + 'px, outing running');
    reset(); seed([{ ...K0, k:'pee', t: now - 3*HOUR, w:'gravel' }]); simple(true); spl('gravel').click(); ageG(); spl('none').click(); await pause(50);
    geo(innerWidth + 'px, retry countdown');
    done();
  } catch(e){ crashed(e); }
})();
