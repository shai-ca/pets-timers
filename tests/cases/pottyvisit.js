// §18c (release 7): Cam 3 gravel visits. A completed `potty_visit` item in camera/suggestions asks ONE question per dog
// ("ביקור בחצץ HH:MM–HH:MM (לפי המצלמה) · מה היה?"); only her answer writes, and it writes what the taps would (Kishmish:
// a gravel outing at the camera's times + the results with w:'gravel'; Kochik: the results only). Strict validation,
// dedup with manual entries, two phones, a correction and its undo, historical answers, the research-UI path, and the
// LIVE visit (camera/gravel_live): a provisional timer that writes nothing; "יצאנו לחצץ" links to it. Synthetic only.
(async function(){
  try {
    const subs = {}, merged = [];
    let T = Date.now(), SUG = [], GLD = null;
    const PV = (dog, ts, te, o = {}) => ({ id: `pv_cam3_${ts}_${dog || 'unknown'}`, kind: 'potty_visit', status: 'active', validated: false, source: 'camera_visit', camera: 'cam3',
      visit_id: 'v3_' + ts, visit_ids: ['v3_' + ts], outing_id: 'o3_' + ts, dog, identity_confidence: dog ? 'reliable' : 'ask', identity: { method: dog ? 'coat_brightness' : null, n_samples: 9, note: '' },
      ts, lo: ts, hi: te, t_start: ts, t_end: te, duration_s: (te - ts) / 1000, onset_ts: null, clip: { cam: 'cam3', t: ts, before: 15, after: (te - ts) / 1000 + 10 },
      ir: false, uncertain: false, lighting: 'day', options: ['pee', 'poop', 'both', 'none', 'not_visit', 'unsure', 'dismiss'], confidence: null, model_version: 'cam3-live-1',
      exclude_from_metrics: false, evidence: { basis: 'automatic_visit_detection' }, note: 'the camera saw a gravel visit; it does NOT know what happened', ...o });
    const send = async () => { if(subs[camjSugDoc()]) subs[camjSugDoc()]({ schema: 'cam-suggestions/1', suggestions: SUG, published_at: Date.now(), enabled: true }, false); await wait(3);
      if(GLD && subs[glDoc()]) subs[glDoc()](GLD, false); await wait(3); render(); await wait(2); };
    const fresh = async (mk, who = 'shai') => { reset(who); close(); document.getElementById('toast').classList.remove('show');
      fb = { auth: { currentUser: { uid: 'U1' } }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.fb = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.pv = []; CAMJ.ready = CAMJ.sready = false; CAMJ.unsub = CAMJ.unsubS = CAMJ.unsubF = null;
      glStop(); GL.visits = []; GL.denied = false; GL.retryAt = 0; GL.sig = ''; merged.length = 0;
      T = Date.now(); SUG = []; GLD = null; seed(mk ? mk() : base()); serverSeen = true; pet = 'kishmish'; view = 'now'; render(); await wait(2); };
    const K0 = { p: 'kishmish' }, C0 = { p: 'kochik' };
    const base = () => [{ ...K0, k: 'pee', t: T - 3*HOUR, w: 'gravel' }, { ...K0, k: 'food', t: T - 2*HOUR, m: 'meal' }, { ...C0, k: 'pee', t: T - 3*HOUR, w: 'out' }];
    const byId = id => state.log.find(e => e.id === id), own = (id, dog) => state.log.filter(e => (e.id || '').startsWith(`cam:sug:${id}:${dog}:`));
    const q = () => $q('#sec-potty .pvq') || $q('.pvq');
    const tap = (ans, dog) => { const b = document.querySelector(`.pvq [data-pv="${ans}"]${dog ? `[data-dog="${dog}"]` : ''}`); if(b) b.click(); return !!b; };
    const D = V2 ? 'v2: ' : 'v1: ';

    // ---------- 1. validation ----------
    await fresh();
    const ts = T - 20*MIN, te = ts + 90000, good = PV('kishmish', ts, te);
    const bad = [
      ['wrong source', PV('kishmish', ts - 1000, te, { source: 'live_model' })],
      ['id names another dog', { ...PV('kishmish', ts - 2000, te), id: `pv_cam3_${ts - 2000}_kochik` }],
      ['no dog but reliable', PV(null, ts - 3000, te, { identity_confidence: 'reliable' })],
      ['a "_TEST" id without test:true', { ...PV('kishmish', ts - 4000, te), id: `pv_cam3_${ts - 4000}_kishmish_TEST` }],
      ['t_start not the id', { ...PV('kishmish', ts - 5000, te), t_start: ts - 4999 }],
      ['duration does not match', PV('kishmish', ts - 6000, te, { duration_s: 999 })],
      ['no clip', PV('kishmish', ts - 7000, te, { clip: null })],
      ['clip from another camera', PV('kishmish', ts - 8000, te, { clip: { cam: 'cam1', t: ts, before: 8, after: 12 } })],
      ['IR but reliable', PV('kishmish', ts - 9000, te, { ir: true, uncertain: true, lighting: 'ir' })],
      ['lighting unknown', PV('kishmish', ts - 10000, te, { lighting: 'dusk' })],
      ['ir not boolean', PV('kishmish', ts - 11000, te, { ir: 'no' })],
      ['retracted', PV('kishmish', ts - 12000, te, { status: 'retracted' })],
      ['an unknown dog', { ...PV('kishmish', ts - 13000, te), dog: 'rex', id: `pv_cam3_${ts - 13000}_rex` }],
      ['a test item', PV('kishmish', ts - 14000, te, { test: true })],
      ['end before start', PV('kishmish', ts - 15000, ts - 20000, { duration_s: 0 })]];
    SUG = [good, ...bad.map(b => b[1])]; await send();
    const sugAll = SUG;
    ok('one valid item kept, every malformed one dropped', CAMJ.pv.length === 1 && CAMJ.pv[0].id === good.id);
    for(const [why, it] of bad) ok('dropped: ' + why, !CAMJ.pv.some(x => x.id === it.id));
    CAMJ_TEST_OK = true; await send(); ok('a test:true item passes only inside a harness (CAMJ_TEST_OK)', CAMJ.pv.some(x => x.id === bad[13][1].id));
    SUG = [{ ...PV('kishmish', ts - 30000, te), id: `pv_cam3_${ts - 30000}_kishmish_TEST`, test: true }]; await send();
    ok('…a camera fixture id "…_TEST" only with test:true inside a harness', CAMJ.pv.length === 1); CAMJ_TEST_OK = false; await send();
    ok('…and never outside it', !CAMJ.pv.length);
    SUG = [PV('kishmish', ts, te), { ...PV('kishmish', ts, te), id: `pv_cam3_${ts + 1}_kishmish`, t_start: ts + 1, ts: ts + 1, duration_s: (te - ts - 1) / 1000 }]; await send();
    ok('dedup by (visit_id, dog): a second item of the same visit and dog is ignored', CAMJ.pv.length === 1);
    SUG = [PV('kishmish', ts, te, { identity_confidence: 'ask' }), PV('kochik', ts, te, { identity_confidence: 'ask' })]; await send();
    ok('the camera\'s per-dog "ask" items (one per dog, same visit): both kept, each its own row', CAMJ.pv.length === 2 && pvRows('kishmish').length === 1 && pvRows('kochik').length === 1 && pvKey(CAMJ.pv[0], 'kishmish') === 'sug:' + CAMJ.pv[0].id);
    SUG = [PV('kishmish', ts, te, { identity_confidence: 'ask', ir: true, lighting: 'ir' })]; await send();
    ok('an IR item with "ask" is kept and read as uncertain', CAMJ.pv.length === 1 && CAMJ.pv[0].uncertain && pvFlags(CAMJ.pv[0]).includes('צילום לילה'));
    SUG = sugAll; await send();
    ok('the kill switch (enabled:false) drops the visits too', pvValid({ enabled: false, suggestions: [good] }).length === 0 && pvValid({ disabled: true, suggestions: [good] }).length === 0);
    ok('the ids are not mixed into CAMJ.ev (crate / food / sleep paths untouched)', !CAMJ.ev.some(e => /pv_cam3/.test(e.event_id)));
    // ---------- 2. the card ----------
    ok(D + 'Kishmish: one question in the potty section with the visit\'s times', !!$q('#sec-potty .pvq') && $q('#sec-potty .pvq').textContent.includes(`ביקור בחצץ ${clock(ts)}–${clock(te)} (לפי המצלמה) · מה היה?`));
    ok('…seven answers: פיפי · קקי · שניהם · לא עשתה · לא היה ביקור · לא בטוחה · להסתיר', [...document.querySelectorAll('.pvq [data-pv]')].map(b => b.textContent).join('|') === 'פיפי|קקי|שניהם|לא עשתה|לא היה ביקור|לא בטוחה|להסתיר');
    ok('…the clip affordance: none without the private service, said calmly (still image path)', $q('.pvq').textContent.includes('סרטון זמין רק בבדיקה במק'));
    ok('…a cam3 clip key with the visit\'s own window (fetched only on a tap)', clipFor({ kind: 'potty_visit', ts, clip: { cam: 'cam3', t: ts, before: 15, after: 100 } }).key === 'cam3:' + ts && CLIP_WIN['cam3:' + ts].after === 100);
    { const L0 = JSON.stringify(state.log); ok('an unanswered visit writes nothing', JSON.stringify(state.log) === L0 && !state.log.some(e => /^cam:sug:pv_/.test(e.id)) && !merged.length); }
    pet = 'kochik'; render(); await wait(2);
    ok('Kochik\'s screen: no question for a Kishmish visit', !$q('.pvq'));
    pet = 'kishmish'; render();

    // ---------- 3. answer mappings ----------
    const mapCase = async (dog, ans, check) => { await fresh(); const t0 = T - 30*MIN, t1 = t0 + 2*MIN, it = PV(dog, t0, t1); SUG = [it]; pet = dog; await send();
      ok(`${dog} ${ans}: the question is shown`, !!q()); tap(ans, dog); await wait(3); close(); document.getElementById('toast').classList.remove('show'); render(); await wait(2);
      check(it, t0, t1); pet = 'kishmish'; };
    await mapCase('kishmish', 'pee', (it, t0, t1) => { const g = byId(`cam:sug:${it.id}:kishmish:gravel`), e = byId(`cam:sug:${it.id}:kishmish:pee`);
      ok('Kishmish פיפי: an outing at the camera\'s times', !!g && g.k === 'gravel' && g.t === t0 && g.end === t1);
      ok('…a pee at the visit\'s end, on the gravel, inside the outing', !!e && e.t === t1 && e.w === 'gravel' && gravelOf(e) === g);
      ok('…nothing else written', own(it.id, 'kishmish').length === 2 && state.log.filter(x => x.k === 'pee').length === 3);
      ok('…the decision sug:<id> = pee, with the dog', camjDec('sug:' + it.id).d === 'pee' && camjDec('sug:' + it.id).dog === 'kishmish' && merged.some(([n, d]) => n === 'feedback' && d.decisions['sug:' + it.id]));
      ok('…the question is gone', !q());
      ok('…provenance in the list row, the export and the entry\'s note', camjNote(e).includes('מביקור שהמצלמה זיהתה') && logText('kishmish', sod(e.t).getTime(), sod(e.t).getTime() + DAY).includes('מביקור שהמצלמה זיהתה') && camjNote(e, true).includes('מביקור שהמצלמה זיהתה'));
      ok('…no "N minutes on the gravel" (the camera does not know when inside the visit)', waitOf(e) == null && !lastOutingText('kishmish').includes('תוך'));
      ok('…the pee clock follows it (an approved result counts as a real one)', K().pee === t1);
      ok('…excluded from camera figures', camjIsVisit(e) && camjIsVisit(g) && !camjIsVisit({ id: 'x', cam: { src: 'live_model' } })); });
    await mapCase('kishmish', 'poop', (it, t0, t1) => ok('Kishmish קקי: outing + a poop on the gravel', !!byId(`cam:sug:${it.id}:kishmish:gravel`) && byId(`cam:sug:${it.id}:kishmish:poop`).w === 'gravel' && own(it.id, 'kishmish').length === 2));
    await mapCase('kishmish', 'both', (it, t0, t1) => { const a = byId(`cam:sug:${it.id}:kishmish:pee`), b = byId(`cam:sug:${it.id}:kishmish:poop`);
      ok('Kishmish שניהם: outing + pee + poop, both inside it', !!a && !!b && gravelOf(a) && gravelOf(a) === gravelOf(b) && own(it.id, 'kishmish').length === 3); });
    await mapCase('kishmish', 'none', (it, t0, t1) => { const n = byId(`cam:sug:${it.id}:kishmish:none`);
      ok('Kishmish לא עשתה: outing + a "לא עשתה" on the gravel', !!n && n.k === 'none' && n.w === 'gravel' && !!byId(`cam:sug:${it.id}:kishmish:gravel`));
      ok('…30 min later: no retry crate written late (pushNone)', !state.log.some(e => e.k === 'crate')); });
    for(const a of ['not_visit', 'unsure', 'dismiss'])
      await mapCase('kishmish', a, it => ok(`Kishmish ${PV_ANS[a]}: no journal entry, the decision only`, !own(it.id, 'kishmish').length && camjDec('sug:' + it.id).d === (a === 'dismiss' ? 'dismissed' : a) && !q()));
    await mapCase('kochik', 'pee', (it, t0, t1) => { const e = byId(`cam:sug:${it.id}:kochik:pee`);
      ok(D + 'Kochik פיפי (her potty group): a pee on the gravel, NO gravel timer', !!e && e.w === 'gravel' && e.t === t1 && !state.log.some(x => x.p === 'kochik' && x.k === 'gravel'));
      ok('…her clock follows it', KO().pee === t1); });
    await mapCase('kochik', 'both', it => ok('Kochik שניהם: pee + poop, no timer', own(it.id, 'kochik').length === 2 && !state.log.some(x => x.p === 'kochik' && x.k === 'gravel')));
    await mapCase('kochik', 'none', it => ok('Kochik לא עשתה: one "לא עשתה", no timer, no crate', own(it.id, 'kochik').length === 1 && !state.log.some(x => x.k === 'crate' || x.k === 'gravel')));

    // ---------- 4. identity unknown: a row per dog ----------
    await fresh(); { const t0 = T - 25*MIN, it = PV(null, t0, t0 + MIN); SUG = [it]; await send();
      ok(D + 'unknown identity: Kishmish\'s screen asks about Kishmish', !!q() && !!$q('.pvq [data-dog=kishmish]') && q().textContent.includes('המצלמה לא יודעת איזו כלבה'));
      pet = 'kochik'; render(); await wait(2);
      ok(D + '…and Kochik\'s screen asks about Kochik, in her potty group', !!$q('#sec-potty .pvq [data-dog=kochik]') || !!$q('.grp .pvq [data-dog=kochik]'));
      tap('pee', 'kochik'); await wait(3); close(); render(); await wait(2);
      ok('…Kochik "פיפי": her pee, key sug:<id>:kochik', !!byId(`cam:sug:${it.id}:kochik:pee`) && camjDec(`sug:${it.id}:kochik`).d === 'pee' && !$q('.pvq'));
      pet = 'kishmish'; render(); await wait(2);
      ok('…Kishmish\'s row is still open', !!$q('.pvq [data-dog=kishmish]'));
      tap('not_visit', 'kishmish'); await wait(3); close(); render(); await wait(2);
      ok('…Kishmish "לא היה ביקור": nothing for her, both rows answered', !own(it.id, 'kishmish').length && !$q('.pvq') && camjDec(`sug:${it.id}:kishmish`).d === 'not_visit'); }

    // ---------- 5. dedup ----------
    await fresh(() => [...base(), { ...K0, k: 'pee', t: T - 26*MIN, w: 'gravel' }]); { const t0 = T - 30*MIN; SUG = [PV('kishmish', t0, t0 + MIN)]; await send();
      ok('a manual pee within 5 min of the visit: no question (answered by it)', !q() && pvRows('kishmish').length === 0); }
    await fresh(() => [...base(), { ...C0, k: 'none', t: T - 37*MIN }]); { const t0 = T - 30*MIN; SUG = [PV('kochik', t0, t0 + MIN)]; await send();
      ok('Kochik: a manual "לא עשתה" 7 min before: still asked (outside ±5 min)', pvRows('kochik').length === 1); }
    { const t0 = T - 40*MIN, mk = () => [...base(), { ...K0, k: 'gravel', t: t0 - 3*MIN, end: t0 + 4*MIN }, { ...K0, k: 'poop', t: t0 + 3*MIN, w: 'gravel' }];
      await fresh(mk); SUG = [PV('kishmish', t0, t0 + MIN)]; await send();
      ok('an overlapping manual outing WITH a result: no question', !q()); }
    { const t0 = T - 40*MIN; await fresh(() => [...base(), { ...K0, k: 'gravel', t: t0 - 3*MIN, end: t0 + 4*MIN, id: 'man_g' }]);
      SUG = [PV('kishmish', t0, t0 + MIN)]; await send();
      ok('an overlapping manual outing without a result: asked', !!q());
      tap('pee'); await wait(3); close(); render(); await wait(2);
      const e = state.log.find(x => x.k === 'pee' && x.t > t0 - 5*MIN);
      ok('…the answer is written INTO her outing (no second gravel entry)', state.log.filter(x => x.k === 'gravel').length === 1 && !!e && gravelOf(e) && gravelOf(e).id === 'man_g'); }
    // two phones answer the same visit: one set of entries
    { await fresh(); const t0 = T - 30*MIN, it = PV('kishmish', t0, t0 + MIN); SUG = [it]; await send();
      const s0 = clone(state); pvAnswer(it.id, 'kishmish', 'both'); await wait(3); const s1 = clone(state);
      use(clone(s0)); CAMJ.fbLocal = {}; pvAnswer(it.id, 'kishmish', 'both'); await wait(3); const s2 = clone(state);
      const m1 = patch(diff(s0, s2), s1), m2 = patch(diff(s0, s1), s2), n = L => L.log.filter(e => (e.id || '').startsWith(`cam:sug:${it.id}:`)).length;
      ok('two phones answering "שניהם": one gravel + one pee + one poop after the merge, both orders', n(m1) === 3 && n(m2) === 3 && JSON.stringify(m1.log.map(e => e.id).sort()) === JSON.stringify(m2.log.map(e => e.id).sort())); }
    // the same answer again changes nothing
    { const L = JSON.stringify(state.log); const id = CAMJ.pv[0].id; pvAnswer(id, 'kishmish', 'both'); await wait(3); close();
      ok('the same answer again: nothing more written', JSON.stringify(state.log) === L); }

    // ---------- 6. correction + undo ----------
    await fresh(); { const t0 = T - 30*MIN, it = PV('kishmish', t0, t0 + MIN); SUG = [it]; await send();
      tap('pee'); await wait(3); close();
      ok('the toast offers "שינוי תשובה" and undo', !!$q('#toastWhere [data-pvchg]') && !$q('#undo').hidden);
      $q('#toastWhere [data-pvchg]').click(); await wait(2);
      ok('…the change sheet lists the seven answers, the current one selected', sh.querySelectorAll('[data-pvset]').length === 7 && sh.querySelector('[data-pvset=pee]').classList.contains('sel'));
      sh.querySelector('[data-pvset=poop]').click(); await wait(3); close();
      ok('changed to קקי: the pee is removed, a poop written, still one outing', !byId(`cam:sug:${it.id}:kishmish:pee`) && !!byId(`cam:sug:${it.id}:kishmish:poop`) && own(it.id, 'kishmish').length === 2);
      ok('…the decision is poop, the earlier answer kept in prev', camjDec('sug:' + it.id).d === 'poop' && camjDec('sug:' + it.id).prev.some(p => p.d === 'pee'));
      $q('#undo').click(); await wait(3); render(); await wait(2);
      ok('undo: back to the pee answer (entries and decision together)', !!byId(`cam:sug:${it.id}:kishmish:pee`) && !byId(`cam:sug:${it.id}:kishmish:poop`) && camjDec('sug:' + it.id).d === 'pee');
      pvChangeSheet(it.id, 'kishmish'); sh.querySelector('[data-pvset=not_visit]').click(); await wait(3); close();
      ok('changed to "לא היה ביקור": every entry of the answer removed', !own(it.id, 'kishmish').length && !q());
      await fresh(); SUG = [it]; await send(); tap('pee'); await wait(3); close(); $q('#undo').click(); await wait(3); render(); await wait(2);
      ok('undo of a first answer: no entries, the question is back', !own(it.id, 'kishmish').length && !!q() && camjDec('sug:' + it.id).d === 'undone'); }

    // ---------- 7. historical answers ----------
    { const t0 = T - 45*MIN; await fresh(() => [...base(), { ...K0, k: 'crate', t: T - 20*MIN, c: 'mesh', id: 'newc' }, { ...K0, k: 'sleep', t: T - 15*MIN, id: 'news' }]);
      SUG = [PV('kishmish', t0, t0 + MIN)]; await send(); tap('pee'); await wait(3); close();
      ok('an answer 44 min after the visit: a newer crate stay and sleep keep running', byId('newc').end == null && byId('news').end == null && !!state.log.find(e => e.k === 'pee' && e.t === t0 + MIN)); }
    { const t0 = T - 45*MIN; await fresh(() => [...base(), { ...K0, k: 'crate', t: T - 3*HOUR + 5*MIN, c: 'mesh', id: 'oldc' }]);
      SUG = [PV('kishmish', t0, t0 + MIN)]; await send(); tap('none'); await wait(3); close();
      ok('an old answer never ends a stay still running (no evidence it ended then), and no retry crate', byId('oldc').end == null && state.log.filter(e => e.k === 'crate').length === 1); }
    { const t0 = T - 5*MIN; await fresh(() => [...base(), { ...K0, k: 'crate', t: T - 2*HOUR, c: 'mesh', id: 'runc' }]);
      SUG = [PV('kishmish', t0, t0 + 2*MIN)]; await send(); tap('none'); await wait(3); close();
      const c = state.log.filter(e => e.k === 'crate');
      ok('a fresh answer (3 min after) acts like the tap: the stay ends at the outing start, the retry wait is written', byId('runc').end === t0 && c.length === 2 && c.some(e => e.id === `pvc:${CAMJ.pv[0].id}:kishmish` && e.t === t0 + 2*MIN + 1)); }

    // ---------- 8. the routine moves only through the entries; guidance conditional ----------
    { const mk = () => [{ ...K0, k: 'pee', t: T - 3*HOUR, w: 'gravel' }, { ...K0, k: 'crate', t: T - 2*HOUR - 30*MIN, end: T - 40*MIN, c: 'mesh' }, { ...K0, k: 'food', t: T - 2*HOUR, m: 'meal' }];
      await fresh(mk); const r0 = JSON.stringify(routine('kishmish')), v0 = JSON.stringify(V.kishmish.pee);
      const t0 = T - 30*MIN; SUG = [PV('kishmish', t0, t0 + MIN)]; await send();
      ok('an unanswered visit: the routine and the clocks do not move', JSON.stringify(routine('kishmish')) === r0 && JSON.stringify(V.kishmish.pee) === v0);
      const due0 = JSON.stringify(pottyDue('kishmish')), fc0 = JSON.stringify(peeForecast('kishmish'));
      ok('…the take-out reminder and the pee window are unchanged (unknown, never "no pee")', JSON.stringify(pottyDue('kishmish')) === due0 && JSON.stringify(peeForecast('kishmish')) === fc0 && !state.log.some(e => e.k === 'none'));
      ok(D + '…"מה עושים עכשיו?" mentions it conditionally', $q('.cyc-n') && $q('.cyc-n').textContent.includes(`המצלמה ראתה ביקור בחצץ ב־${clock(t0)} · מה היה?`));
      tap('pee'); await wait(3); close(); const r1 = routine('kishmish');
      await fresh(() => [...mk(), { ...K0, k: 'gravel', t: t0, end: t0 + MIN }, { ...K0, k: 'pee', t: t0 + MIN, w: 'gravel' }]); const r2 = routine('kishmish');
      ok('…answered "פיפי": the routine is exactly what the same entries tapped by hand give', JSON.stringify(r1) === JSON.stringify(r2) && r1.i !== JSON.parse(r0).i);
      ok('…currentState / guidance read it like a logged entry', currentState('kishmish').state === 'out');
      ok('…the take-out reminder is satisfied by the approved result, like a tap', !pottyDue('kishmish') || pottyDue('kishmish').t > t0 + MIN); }

    // ---------- 9. her research-UI answer (§18 path) ----------
    { await fresh(); const t0 = T - 30*MIN, it = PV('kishmish', t0, t0 + MIN, { owner_decision: { ans: 'poop', at: Date.now() - MIN, src: 'research_ui', rid: 'rp1' } }); SUG = [it]; await send();
      ok('research "קקי": applied once — outing + poop, by research_ui', !!byId(`cam:sug:${it.id}:kishmish:poop`) && byId(`cam:sug:${it.id}:kishmish:poop`).cam.ok === 'research_ui' && camjDec('sug:' + it.id).rid === 'rp1');
      ok('…list note "(אושר במחקר)", no toast', camjNote(byId(`cam:sug:${it.id}:kishmish:poop`)).includes('אושר במחקר'));
      const L = JSON.stringify(state.log); await send(); camjApply(); await wait(3);
      ok('…the same rid again: a no-op', JSON.stringify(state.log) === L);
      SUG = [{ ...it, owner_decision: { ans: 'pee', at: Date.now(), src: 'research_ui', rid: 'rp2' } }]; await send();
      ok('…a newer rid corrects it (poop → pee)', !!byId(`cam:sug:${it.id}:kishmish:pee`) && !byId(`cam:sug:${it.id}:kishmish:poop`) && camjDec('sug:' + it.id).prev.some(p => p.rid === 'rp1')); }
    { await fresh(() => [...base(), { ...K0, k: 'pee', t: T - 28*MIN, w: 'gravel' }]); const t0 = T - 30*MIN, it = PV('kishmish', t0, t0 + MIN, { owner_decision: { ans: 'pee', at: Date.now(), src: 'research_ui', rid: 'rp3' } }); SUG = [it]; await send();
      ok('research answer for a visit already logged by hand: the decision only, no duplicate', !own(it.id, 'kishmish').length && camjDec('sug:' + it.id).d === 'pee'); }
    { await fresh(); const t0 = T - 30*MIN, it = PV(null, t0, t0 + MIN, { owner_decision: { ans: 'pee', at: Date.now(), src: 'research_ui', rid: 'rp4', dog: 'kochik' } }); SUG = [it, PV(null, t0 - HOUR, t0 - HOUR + MIN, { owner_decision: { ans: 'pee', at: Date.now(), src: 'research_ui', rid: 'rp5' } })]; await send();
      ok('research answer on an unknown-identity visit naming Kochik: her pee; Kishmish still asked', !!byId(`cam:sug:${it.id}:kochik:pee`) && pvRows('kishmish').some(x => x.id === it.id));
      ok('…without a dog: ignored', !camjDec(`sug:${SUG[1].id}:kishmish`) && !camjDec(`sug:${SUG[1].id}:kochik`));
      ok('…bad answers ignored', !pvOD({ ...it, owner_decision: { ans: 'closed', at: 1, src: 'research_ui', rid: 'x' } }) && !pvOD({ ...it, owner_decision: { ans: 'pee', at: 1, src: 'label', rid: 'x', dog: 'kochik' } })); }

    // ---------- 10. the LIVE visit: provisional, never written ----------
    const GV = (o = {}) => ({ visit_id: 'v3_live1', kind: 'gravel_live', status: 'open', opened_at: T - 2*MIN + 1500, t_start: T - 2*MIN, last_seen: Date.now() - 5000, t_end: null, dog: 'kishmish', identity_confidence: 'reliable', ir: false, uncertain: false, model_version: 'cam3-live-1', ...o });
    const GDOC = (vs, o = {}) => ({ schema: 'cam-gravel-live/1', camera: 'cam3', published_at: Date.now(), model_version: 'cam3rec-1', coverage: { recorder_ok: true, status_age_s: 2, live_file_age_s: 1, reason: null }, visits: vs, ...o });
    { await fresh(); const L0 = JSON.stringify(state.log);
      ok('the live listener opens on Kishmish\'s screen (' + glDoc() + ')', !!subs[glDoc()] && glDoc() === (MODE === 'live' ? 'gravel_live' : 'gravel_live_preview'));
      GLD = GDOC([GV()]); await send();
      ok(D + 'an open visit: "בחצץ לפי המצלמה, לא אושר" with a running clock in the gravel card', !!$q('.gravel.glive') && $q('.gravel.glive').textContent.includes('בחצץ לפי המצלמה, לא אושר') && !!$q('.gravel.glive [data-since]'));
      ok('…nothing written, nothing sent', JSON.stringify(state.log) === L0 && !merged.length);
      ok('…first seen logged locally for the latency check', glSeenLog().some(r => r.id === 'v3_live1' && r.seen > 0 && r.shown === 1));
      GLD = GDOC([GV({ ir: true, identity_confidence: 'ask', dog: null, uncertain: true })]); await send();
      ok('an IR visit: hidden', !$q('.gravel.glive'));
      GLD = GDOC([GV({ uncertain: true })]); await send(); ok('an uncertain visit: hidden', !$q('.gravel.glive'));
      GLD = GDOC([GV({ last_seen: Date.now() - 5*MIN })]); await send(); ok('not seen for 5 min: hidden', !$q('.gravel.glive'));
      GLD = GDOC([GV({ dog: 'kochik' })]); await send(); ok('Kochik\'s visit: not on Kishmish\'s card', !$q('.gravel.glive'));
      GLD = GDOC([GV({ schema: 'x' })].map(v => ({ ...v, kind: 'other' }))); await send(); ok('a malformed visit: ignored', !GL.visits.length);
      GLD = GDOC([GV()]); await send(); ok('back: shown', !!$q('.gravel.glive'));
      // stale / unavailable = UNKNOWN (owner): no timer, and no "no visit" claim either
      GLD = GDOC([GV()], { published_at: Date.now() - 3*MIN }); await send(); ok('stale doc (an open visit, no heartbeat for 3 min): no timer', !$q('.gravel.glive') && GL.stale);
      GLD = GDOC([GV()], { coverage: { recorder_ok: false, status_age_s: 90, live_file_age_s: null, reason: 'status_stale' } }); await send(); ok('recorder_ok:false: no timer', !$q('.gravel.glive') && GL.stale);
      GLD = GDOC([], { published_at: Date.now() - 5*HOUR }); await send(); ok('an old doc with no visit (no idle heartbeat): nothing shown', !$q('.gravel.glive')); ok('…not read as stale', !GL.stale); ok('…the ordinary card, no "no visit" claim', !!$q('.gravel') && $q('.gravel').textContent.includes('יוצאים לחצץ?'));
      GLD = GDOC([GV()], { extra: 1 }); await send(); ok('an unknown top-level key: the doc is ignored', !GL.visits.length);
      GLD = GDOC([1, 2, 3, 4].map(i => GV({ visit_id: 'v' + i }))); await send(); ok('more than 3 visits (the rules\' cap): ignored', !GL.visits.length);
      GLD = GDOC([GV({ extra: 1 })]); await send(); ok('a visit with an unknown key: ignored', !GL.visits.length);
      GLD = GDOC([GV({ last_seen: Date.now() - 60000 }), GV({ last_seen: Date.now() - 4000 })]); await send();
      ok('the same visit_id twice: one visit, one timer', GL.visits.length === 1 && document.querySelectorAll('.gravel.glive').length === 1);
      // an interrupted connection: unknown until it reconnects
      subs[glDoc()] && (GL.unsub = GL.unsub);   // the listener is open
      { const on = fb.camDoc; let errFn = null; glStop(); fb.camDoc = (n, d, err) => { if(n === glDoc()){ subs[n] = d; errFn = err; return () => {}; } return on(n, d, err); };
        render(); await wait(2); subs[glDoc()](GDOC([GV()]), false); await wait(3); render(); await wait(2);
        ok('(re)subscribed: shown', !!$q('.gravel.glive'));
        errFn({ code: 'unavailable' }); await wait(3);
        ok('a listener error (connection lost): no timer (unknown), a retry is scheduled, no tight loop', !$q('.gravel.glive') && !GL.unsub && GL.retryAt > Date.now());
        GL.retryAt = 0; render(); await wait(2); subs[glDoc()](GDOC([GV()]), false); await wait(3); render(); await wait(2);
        ok('…reconnected: the same visit shows again, one timer, nothing written', !!$q('.gravel.glive') && JSON.stringify(state.log) === L0 && glSeenLog().filter(r => r.id === 'v3_live1').length === 1);
        fb.camDoc = on; glStop(); render(); await wait(2); GLD = GDOC([GV()]); await send(); }
      $q('.gravel.glive [data-act=dur][data-k=gravel]').click(); await wait(3); render(); await wait(2);
      const g = state.log.filter(e => e.k === 'gravel');
      ok('"יצאנו לחצץ" links to it: ONE outing from the camera\'s t_start', g.length === 1 && g[0].t === T - 2*MIN && g[0].end == null && g[0].cam && g[0].cam.vis === 'v3_live1');
      ok('…the live timer steps aside for her running outing', !$q('.gravel.glive') && !!$q('.gravel.on'));
      // the camera restarts and re-publishes the same visit_id: no second timer, no second outing
      GLD = GDOC([GV({ last_seen: Date.now() - 1000 })]); await send(); $q('[data-act=dur][data-k=gravel]') && null;
      ok('camera restart, the same visit re-published: still one outing, no live timer next to it', state.log.filter(e => e.k === 'gravel').length === 1 && !$q('.gravel.glive') && glSeenLog().filter(r => r.id === 'v3_live1').length === 1);
      // the visit closes -> the completed question takes over, and is written into her outing
      GLD = GDOC([GV({ status: 'closed', t_end: T - MIN })]); SUG = [PV('kishmish', T - 2*MIN, T - MIN, { visit_id: 'v3_live1' })]; await send();
      ok('closed: the completed visit asks, the outing stays one', !!q() && state.log.filter(e => e.k === 'gravel').length === 1);
      tap('pee'); await wait(3); close();
      ok('…answered: the pee lands in her linked outing, no second gravel entry', state.log.filter(e => e.k === 'gravel').length === 1 && gravelOf(state.log.find(e => e.k === 'pee' && e.t >= T - 2*MIN)).cam.vis === 'v3_live1'); }
    { await fresh(); subs[glDoc()] && subs[glDoc()](null, false); const L0 = JSON.stringify(state.log);
      GLD = GDOC([GV()]); SIMPLE = true; await send();
      ok(D + 'מסך יונתן: a quiet "בחצץ לפי המצלמה" line, no visit question', !!$q('.smp-gl') && $q('.smp-gl').textContent.includes('לא אושר') && !$q('.pvq'));
      ok('…nothing written', JSON.stringify(state.log) === L0);
      simpleAct('kishmish', 'gravel'); await wait(3);
      ok('…its "יצאנו לחצץ" links too (one outing from t_start)', state.log.filter(e => e.k === 'gravel').length === 1 && state.log.find(e => e.k === 'gravel').t === T - 2*MIN);
      SIMPLE = false; }
    { await fresh(); const t0 = T - 30*MIN; SUG = [PV('kishmish', t0, t0 + MIN)]; SIMPLE = true; await send();
      ok('מסך יונתן: no question (seven answers do not fit its three buttons); the full screen keeps it', !$q('.pvq') && pvRows('kishmish').length === 1); SIMPLE = false; render(); }
    // permission-denied: silent
    { await fresh(); const on = fb.camDoc; fb.camDoc = (n, d, err) => { if(n === glDoc()){ setTimeout(() => err({ code: 'permission-denied' }), 0); return () => {}; } return on(n, d, err); };
      glStop(); GL.denied = false; render(); await new Promise(r => setTimeout(r, 10)); await wait(3);
      ok('gravel_live refused by the rules: silently nothing, no retry loop', GL.denied && !GL.unsub && !$q('.gravel.glive')); }
    // the review: questions, answers, technical latency
    { await fresh(); const t0 = T - 30*MIN, it = PV('kishmish', t0, t0 + MIN); SUG = [it, PV(null, t0 - HOUR, t0 - HOUR + MIN)]; await send();
      camjReview(); await wait(2);
      ok('review: the open visits of both dogs are listed with their answers', sh.querySelectorAll('.cjr [data-pv=pee]').length === 3);
      sh.querySelector(`.cjr [data-pv=pee][data-id="${it.id}"]`).click(); await wait(3);
      ok('…answered there; listed under "ביקורים בחצץ שנענו" with "שינוי תשובה"', !!sh.querySelector('[data-cjd=pva]') && !!sh.querySelector(`[data-cjd=pva] [data-pvchg="${it.id}|kishmish"]`));
      ok('…the technical fold lists the visit\'s publish / answer times', !!sh.querySelector('[data-cjd=pvt]') && sh.querySelector('[data-cjd=pvt]').textContent.includes(it.id));
      close(); }
    // the red pee card: one neutral line, threshold unchanged
    { await fresh(() => [{ ...K0, k: 'pee', t: T - 7*HOUR, w: 'gravel' }, { ...K0, k: 'food', t: T - HOUR, m: 'meal' }, { ...K0, k: 'play', t: T - 5*MIN, y: 'rope' }]);
      const a0 = JSON.stringify(alerts('kishmish')); const t0 = T - 50*MIN; SUG = [PV('kishmish', t0, t0 + MIN)]; await send();
      ok('6 h without a pee + an unanswered visit: the red card stays, with one neutral camera line', JSON.stringify(alerts('kishmish')) === a0 && alerts('kishmish').some(a => a.k === 'pee') && [...document.querySelectorAll('.alertc')].some(c => c.textContent.includes(`המצלמה ראתה ביקור בחצץ ב־${clock(t0)}`)));
      ok('…the expired pee window says the visit is unanswered (not "no pee")', (forecastLine('kishmish').includes('לא נרשם פיפי') || forecastLine('kishmish').includes('לא ידוע אם עשתה פיפי')) && forecastLine('kishmish').includes(`המצלמה ראתה ביקור בחצץ ב־<bdi dir="ltr">${clock(t0)}</bdi>, לא נענה`)); }

    fb = null; glStop(); CAMJ.pv = []; CAMJ.ready = CAMJ.sready = false; setState(state); render();
    done();
  } catch(e){ crashed(e); }
})();
