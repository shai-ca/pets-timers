// The camera review sheet, simplified (owner, next-review). Synthetic replicas only. Checks: what needs her first, the
// rest folded with counts; "להסתיר" hides without marking wrong (kept, listed); "ביקור מרצון (דלת פתוחה)" is a
// decision only (no crate entry, no cycle); a SLEEP is never listed as a crate stay; no "17:40–17:40" rows; one matched
// row per journal entry; a detection right after a camera model switch is not a genuine new entry; a door answer covers
// its own stay only.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    let T = Date.now(), DOORS = [];
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'owner_label', confidence: null, status: 'active', created_at: T, model_version: 'm1', ...o });
    const L = (id, kind, ts, o = {}) => E(id, kind, ts, { source: 'live_model', ...o });
    const send = async (list, o = {}) => { if(subs.events) subs.events({ schema: 'cam-events/1', events: list, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: DOORS, published_at: T, updated_at: T, ...o }, false); await wait(3); render(); await wait(2); };
    const sugs = async d => { if(subs.suggestions) subs.suggestions(d, false); await wait(3); render(); await wait(2); };
    const fresh = async mk => { reset(); localStorage.removeItem('pets-timers-v1-cam'); close();
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; CAMJ_RVOPEN.clear(); T = Date.now(); DOORS = []; seed(mk()); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const crates = () => state.log.filter(e => e.k === 'crate'), L0 = () => JSON.stringify(state.log);
    const review = async () => { camjReview(); await wait(2); return sh.querySelector('.cam-sheet'); };

    // 1. order and folding
    await fresh(() => [{ ...K0, k:'pee', t: T - 8*HOUR }, { ...K0, k:'crate', t: T - 6*HOUR - 2*MIN, end: T - 5*HOUR }]);
    DOORS = [{ from: T - 7*HOUR, to: T - 4*HOUR, value: 'closed' }, { from: T - 3*HOUR, to: T - 2*HOUR, value: 'open' }];
    await send([E('ce_i', 'crate_entry', T - 7*HOUR + 10*MIN, { pair_id: 'ce_ix' }), E('ce_ix', 'crate_exit', T - 6*HOUR - 30*MIN),
      E('ce_m', 'crate_entry', T - 6*HOUR, { pair_id: 'ce_mx' }), E('ce_mx', 'crate_exit', T - 5*HOUR),
      E('ce_v', 'crate_entry', T - 3*HOUR + 5*MIN, { pair_id: 'ce_vx' }), E('ce_vx', 'crate_exit', T - 2*HOUR - 30*MIN),
      L('ce_ir', 'crate_entry', T - 70*MIN, { ir: true }), L('ce_p1', 'crate_entry', T - 40*MIN), L('ce_p1x', 'crate_exit', T - 35*MIN), L('ce_p2', 'crate_entry', T - 20*MIN)]);
    camjApply(); await wait(3);
    { const r = await review(), html = r.innerHTML;
      const iAct = html.indexOf('זיהויים לאישור'), iFold = html.indexOf('class="cjfolds"');
      ok('pending approvals come FIRST, before every folded section', iAct > 0 && iFold > iAct);
      const folds = [...r.querySelectorAll('details.cjd')];
      ok('imported, matched, visits, context: folded by default, each with its count', folds.length >= 4 && folds.every(d => !d.open) && ['imp', 'mat', 'vis', 'ctx'].every(id => !!r.querySelector(`details[data-cjd=${id}] .cjn`)) && r.querySelector('details[data-cjd=imp] .cjn').textContent === '(1)');
      ok('each pending entry has שהייה / ביקור מרצון / לא נכון / להסתיר', r.querySelectorAll('[data-cjp=ok]').length === 2 && r.querySelectorAll('[data-cjp=visit]').length === 2 && r.querySelectorAll('[data-cjp=dismiss]').length === 2 && r.textContent.includes('ביקור מרצון (דלת פתוחה)')); }

    // 2. "להסתיר": not wrong, nothing written, gone from the pending list, kept under "הוסתרו"
    { const before = L0(); sh.querySelector('[data-cjp=dismiss][data-ev=ce_p1]').click(); await wait(3);
      const r = sh.querySelector('.cam-sheet');
      ok('"להסתיר": decision "dismissed" (not "rejected"), journal unchanged, feedback sent', camjDec('ce_p1').d === 'dismissed' && L0() === before && merged.some(([n, d]) => n === 'feedback' && d.decisions.ce_p1 && d.decisions.ce_p1.d === 'dismissed'));
      ok('…gone from the pending list, listed (folded) under "הוסתרו"; still in the camera data', !r.querySelector('[data-cjp=ok][data-ev=ce_p1]') && r.querySelector('details[data-cjd=hid]').textContent.includes(clock(T - 40*MIN)) && !camjPlan(state.log, Date.now()).rv.rejected.some(e => e.event_id === 'ce_p1') && CAMJ.ev.some(e => e.event_id === 'ce_p1')); }
    // 3. "ביקור מרצון" from the review: a decision only
    { const n0 = roundStarts('kishmish').length, c0 = crates().length; sh.querySelector('[data-cjp=visit][data-ev=ce_p2]').click(); await wait(3);
      ok('review "ביקור מרצון": no crate entry, no cycle, decision "visit", listed as a visit', crates().length === c0 && roundStarts('kishmish').length === n0 && camjDec('ce_p2').d === 'visit' && sh.querySelector('details[data-cjd=vis]').textContent.includes('ביקור מרצון')); close(); }
    // …and from the card, with the door marked closed (the "שהייה" offer gets its visit twin)
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR, w:'gravel' }]);
    DOORS = [{ from: T - 40*MIN, to: T, value: 'closed' }];
    await send([L('ce_c', 'crate_entry', T - 20*MIN)]);
    { const q = $q('#sec-crate .camjt'), r0 = JSON.stringify(routine('kishmish'));
      ok('card: "שהייה מ־HH:MM" / "ביקור מרצון (דלת פתוחה)" / "לא נכון"', !!q && !!q.querySelector('[data-camj=start]') && q.querySelector('[data-camvisit]').textContent.includes('ביקור מרצון') && !!q.querySelector('[data-camj=reject]'));
      q.querySelector('[data-camvisit]').click(); await wait(3);
      ok('…"ביקור מרצון": no crate entry, routine unchanged, nothing more to approve', !crates().length && JSON.stringify(routine('kishmish')) === r0 && camjDec('ce_c').d === 'visit' && !$q('#sec-crate .camjt')); }
    // dismissing an eating suggestion and a sleep suggestion
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    await sugs({ schema: 'cam-suggestions/1', enabled: true, suggestions: [{ id: 'sug_e', kind: 'eating_suggestion', ts: T - 30*MIN, lo: T - 31*MIN, hi: T - 29*MIN, ir: false, status: 'active' }, { id: 'sug_s', kind: 'sleep_suggestion', ts: T - 100*MIN, lo: T - 101*MIN, hi: T - 100*MIN, end: T - 60*MIN, lo2: T - 60*MIN, hi2: T - 55*MIN, ir: false, status: 'active' }], published_at: Date.now() });
    { const before = L0(), r = await review();
      ok('suggestions are in the actionable part, each with "להסתיר"', !!r.querySelector('[data-camf=dismiss][data-ev="sug:sug_e"]') && !!r.querySelector('[data-camss=dismiss][data-ev="sug:sug_s"]'));
      r.querySelector('[data-camf=dismiss]').click(); await wait(3); sh.querySelector('[data-camss=dismiss]').click(); await wait(3);
      ok('…dismissed: nothing written, hidden from the cards, decisions "dismissed"', L0() === before && camjDec('sug:sug_e').d === 'dismissed' && camjDec('sug:sug_s').d === 'dismissed' && !$q('.camjf') && !$q('[data-camss]') && sh.querySelector('details[data-cjd=hid]').textContent.includes('אכלה')); close(); }

    // 4a. a SLEEP is never listed as a crate stay; 4b. no zero-length "17:40–17:40" rows; one row per matched entry
    await fresh(() => [{ ...K0, k:'pee', t: T - 4*HOUR }, { ...K0, k:'gravel', t: T - 75*MIN, end: T - 72*MIN }, { ...K0, k:'sleep', t: T - 3*HOUR, end: T - 2*HOUR }]);
    await send([E('ce_s1', 'sleep_onset', T - 110*MIN, { lo: T - 124*MIN, hi: T - 110*MIN, single_mark: true }),
      E('ce_a1', 'sleep_onset', T - 170*MIN, { pair_id: 'ce_a1w' }), E('ce_a1w', 'sleep_wake', T - 150*MIN), E('ce_a2', 'sleep_onset', T - 140*MIN, { pair_id: 'ce_a2w' }), E('ce_a2w', 'sleep_wake', T - 125*MIN)]);
    camjApply(); await wait(3);
    { const r = await review(), imp = r.querySelector('details[data-cjd=imp]'), mat = r.querySelector('details[data-cjd=mat]');
      ok('imported sleep listed as "שינה", never as "שהייה … דלת סגורה"', !!imp && imp.textContent.includes('שינה') && !imp.textContent.includes('שהייה') && !imp.textContent.includes('דלת סגורה'));
      ok('a sleep that ended at an unknown moment: "נרדמה HH:MM · התעוררה עד HH:MM", not a zero-length range', imp.textContent.includes('התעוררה עד') && !new RegExp(clock(T - 110*MIN) + '–' + clock(T - 110*MIN)).test(r.textContent));
      ok('two camera episodes matching one sleep she logged: ONE matched row, "2 תצפיות", as a sleep', !!mat && mat.querySelectorAll('.cjr').length === 1 && mat.textContent.includes('2 תצפיות') && mat.textContent.includes('שינה')); close(); }
    // a crate stay of a few seconds reads "פחות מדקה"
    await fresh(() => [{ ...K0, k:'pee', t: T - 4*HOUR }]);
    DOORS = [{ from: T - 3*HOUR, to: T - 2*HOUR, value: 'closed' }];
    await send([E('ce_z', 'crate_entry', T - 150*MIN, { pair_id: 'ce_zx' }), E('ce_zx', 'crate_exit', T - 150*MIN + 15000)]); camjApply(); await wait(3);
    { const r = await review(); ok('a 15-second stay: "פחות מדקה", not "HH:MM–HH:MM"', r.querySelector('details[data-cjd=imp]').textContent.includes('פחות מדקה') && !r.querySelector('details[data-cjd=imp]').textContent.includes(clock(T - 150*MIN) + '–')); close(); }

    // 4c. a camera model switch (camera §15: model_switch / prev_model_version on the event)
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    DOORS = [{ from: T - 2*HOUR, to: T, value: 'closed' }];
    await send([L('ce_o1', 'crate_exit', T - 60*MIN, { model_version: 'occ-A' }), L('ce_n1', 'crate_entry', T - 30*MIN, { model_version: 'occ-B', model_switch: true, prev_model_version: 'occ-A' })]);
    { const rv = camjPlan(state.log, Date.now()).rv;
      ok('model_switch:true entry: never offered (card or pending), uncertain context', !rv.live.length && !rv.pending.length && rv.context.some(e => e.event_id === 'ce_n1') && !$q('#sec-crate .camjt'));
      const r = await review(), ctx = r.querySelector('details[data-cjd=ctx]');
      ok('…listed in the folded "להקשר בלבד" with a neutral note and "להסתיר", no approve button', !!ctx && !ctx.open && ctx.textContent.includes('החליפה מודל') && !!ctx.querySelector('[data-cjp=dismiss][data-ev=ce_n1]') && !r.querySelector('[data-cjp=ok][data-ev=ce_n1]'));
      ctx.querySelector('[data-cjp=dismiss]').click(); await wait(3);
      ok('…"להסתיר": moves to "הוסתרו", decision "dismissed", nothing written', camjDec('ce_n1').d === 'dismissed' && !camjPlan(state.log, Date.now()).rv.context.some(e => e.event_id === 'ce_n1') && sh.querySelector('details[data-cjd=hid]').textContent.includes(clock(T - 30*MIN)) && !crates().length); close(); }
    await send([L('ce_g', 'crate_entry', T - 15*MIN, { model_version: 'occ-C', prev_model_version: 'occ-B' })]);
    ok('a prev_model_version that differs (no model_switch key): the same, context only', camjPlan(state.log, Date.now()).rv.context.some(e => e.event_id === 'ce_g') && !camjPlan(state.log, Date.now()).rv.live.length);
    await send([L('ce_o2', 'crate_exit', T - 60*MIN, { model_version: 'occ-A' }), L('ce_h', 'crate_entry', T - 12*MIN, { model_version: 'occ-B' })]);
    ok('an unflagged first entry of a new version is a normal detection (no guessing from model_version)', camjPlan(state.log, Date.now()).rv.live.some(l => l.ev.event_id === 'ce_h'));
    { const keep = CAM_FEATURES; CAM_FEATURES = { ...keep, irContext: false };
      await send([L('ce_k', 'crate_entry', T - 15*MIN, { model_version: 'occ-C', model_switch: true })]);
      ok('IR context switched off: a model-switch event is still listed (and still never offered)', camjPlan(state.log, Date.now()).rv.context.some(e => e.event_id === 'ce_k') && !camjPlan(state.log, Date.now()).rv.live.length); CAM_FEATURES = keep; }

    // a door answer is about its own stay — it never decides a later entry
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    await send([L('ce_d1', 'crate_entry', T - 100*MIN), L('ce_d1x', 'crate_exit', T - 80*MIN), L('ce_d2', 'crate_entry', T - 20*MIN)]);
    camjDecide('door:ce_d1', 'door_closed');
    ok('"closed" answered for the 100-min-ago stay: the entry 20 min ago is still "door unknown"', camjLiveDoor(CAMJ.ev.find(e => e.event_id === 'ce_d1'), Date.now()) === 'closed' && camjLiveDoor(CAMJ.ev.find(e => e.event_id === 'ce_d2'), Date.now()) === 'unknown');

    ok('nothing deleted from the camera data; only camera/feedback written', merged.every(([n]) => n === 'feedback'));
    fb = null; CAMJ.ready = CAMJ.sready = false; CAMJ.ev = []; CAMJ.ev0 = []; CAMJ.sev = []; setState(state);
    done();
  } catch(e){ crashed(e); }
})();
