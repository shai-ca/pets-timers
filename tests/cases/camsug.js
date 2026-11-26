// Assisted-logging beta (CAMERA-API §13; owner decisions 26.11 evening). Fake `fb.camDoc` serves camera/suggestions and
// camera/events; every suggestion here is a synthetic replica of the published shape (no real data).
// Checks: a missing / empty / disabled doc shows nothing; eating -> the food card with אישור / לא נכון / שתתה, לא אכלה /
// לא בטוחה (only אישור writes: a normal food entry `cam:sug:<id>`); sleep -> estimated only, its own three choices in the
// sleep card, אישור writes a confirmed sleep entry; ir / retracted skipped; dedup vs manual; decisions to feedback as
// `sug:<id>`; no rate / accuracy / "validated" on screen. Decisions: her food labels import directly; her marked waking
// ends a camera estimate; an unconfirmed camera estimate never holds the food banner. Fix: a linked manual crate
// session keeping its own time is never `unc`.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    let T = Date.now();
    const SUG = (id, kind, ts, o = {}) => ({ id, kind, ts, lo: ts - 60000, hi: ts + 60000, confidence: .9, image_id: 's:20990101/000000.jpg', image_ts: ts, ir: false,
      status: 'active', validated: false, model_version: 'sug-v0.1-unvalidated', created_at: T, evidence: { frames: 10, camera: 'cam1' }, ...o });
    const DOCS = (list, o = {}) => ({ schema: 'cam-suggestions/1', enabled: true, disabled: false, lighting: { cam1: 'day', cam2: 'day' }, suggestions: list, note: 'synthetic', published_at: Date.now(), model_version: 'sug-v0.1-unvalidated', ...o });
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'owner_label', confidence: null, status: 'active', created_at: T, model_version: 't', ...o });
    const sugs = async d => { if(subs.suggestions) subs.suggestions(d, false); await wait(3); render(); await wait(2); };
    const evs = async (list, o = {}) => { if(subs.events) subs.events({ schema: 'cam-events/1', events: list, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: [], published_at: T, updated_at: T, ...o }, false); await wait(3); render(); await wait(2); };
    const fresh = async list => { reset(); localStorage.removeItem('pets-timers-v1-cam');
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; T = Date.now(); seed(typeof list === 'function' ? list() : list); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const byId = id => state.log.find(e => e.id === id), L0 = () => JSON.stringify(state.log);
    const noStats = () => !/%|דיוק|validated|מאומת חלקית|false positive/i.test(($q('#sec-food') || {}).textContent + ($q('#sec-rest') || {}).textContent);

    // 0. tonight: no doc, an empty doc, the kill switch — nothing at all
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }]);
    ok('the app listens to camera/suggestions (live) and suggestions_preview elsewhere', !!subs.suggestions && camjSugDoc() === 'suggestions' && (MODE = 'preview', camjSugDoc()) === 'suggestions_preview'); MODE = 'live';
    await sugs(null);
    ok('missing doc: nothing shown, nothing estimated', !$q('.camjf') && !$q('[data-camss]') && !V.kishmish.spans.length && !camjOn());
    await sugs(DOCS([]));
    ok('empty doc: nothing', !$q('.camjf') && !camjOn());
    await sugs(DOCS([SUG('sug_k1', 'eating_suggestion', T - 20*MIN), SUG('sug_k2', 'sleep_suggestion', T - 90*MIN, { end: T - 40*MIN, lo2: T - 41*MIN, hi2: T - 39*MIN })], { disabled: true }));
    ok('kill switch (disabled:true): no suggestion, no estimate', !$q('.camjf') && !$q('[data-camss]') && !V.kishmish.spans.some(x => x.cam));
    await sugs(DOCS([SUG('sug_k1', 'eating_suggestion', T - 20*MIN)], { enabled: false }));
    ok('kill switch (enabled:false): nothing', !$q('.camjf') && !camjOn());

    // 1. eating suggestion: four answers in the food card; only "אישור" writes
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }, { ...K0, k:'food', t: T - 4*HOUR }]);
    { const before = L0();
      await sugs(DOCS([SUG('sug_e1', 'eating_suggestion', T - 20*MIN), SUG('sug_ir', 'eating_suggestion', T - 15*MIN, { ir: true }), SUG('sug_rt', 'eating_suggestion', T - 10*MIN, { status: 'retracted' })]));
      const c = $q('#sec-food .card.item .camjf[data-feed=food]');
      ok('an eating suggestion: in the food card, neutral wording, four answers', !!c && c.textContent.includes('הצעה מהמצלמה, ניסיונית') && ['ok', 'no', 'drink', 'unsure'].every(a => !!c.querySelector(`[data-camf=${a}]`)) && c.textContent.includes('שתתה, לא אכלה') && c.textContent.includes('לא בטוחה'));
      ok('…ir:true and retracted ones are skipped; nothing written', $n('.camjf') === 1 && c.textContent.includes(clock(T - 20*MIN)) && L0() === before);
      ok('no rate, accuracy or "validated" on screen', noStats()); }
    $q('.camjf [data-camf=ok]').click(); await wait(3);
    { const f = byId('cam:sug:sug_e1');
      ok('"אישור": a normal food entry cam:sug:<id> at the suggestion time — the meal timer moves as for a manual meal', !!f && f.k === 'food' && f.t === T - 20*MIN && V.kishmish.food === T - 20*MIN && mealKind(f) === 'meal' && f.cam.ok === 'shai');
      ok('…decision "confirmed" to camera/feedback under sug:<id>', camjDec('sug:sug_e1').d === 'confirmed' && merged.some(([n, d]) => n === 'feedback' && d.decisions['sug:sug_e1'] && d.decisions['sug:sug_e1'].d === 'confirmed'));
      ok('…its row says it came from a camera suggestion', camjNote(f).includes('הצעה מהמצלמה')); }
    for(const [ans, d] of [['no', 'rejected'], ['drink', 'drinking'], ['unsure', 'unsure']]){
      await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }]);
      const before = L0(); await sugs(DOCS([SUG('sug_a', 'eating_suggestion', T - 25*MIN)]));
      $q('.camjf [data-camf=' + ans + ']').click(); await wait(3);
      ok(`"${ans}": nothing written, hidden, "${d}" to feedback`, L0() === before && !$q('.camjf') && camjDec('sug:sug_a').d === d && merged.some(([n, x]) => n === 'feedback' && x.decisions['sug:sug_a'] && x.decisions['sug:sug_a'].d === d));
    }
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }, { ...K0, k:'food', t: T - 30*MIN + 15*MIN }]);
    await sugs(DOCS([SUG('sug_d', 'eating_suggestion', T - 30*MIN)]));
    ok('dedup: a meal logged by hand 15 min after the suggestion is the same meal — not offered', !$q('.camjf'));

    // 2. sleep suggestion: estimated only; three answers in the sleep card; "אישור" writes a confirmed sleep
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }, { ...K0, k:'food', t: T - 3*HOUR }]);
    { const before = L0();
      await sugs(DOCS([SUG('sug_s1', 'sleep_suggestion', T - 100*MIN, { end: T - 40*MIN, lo2: T - 40*MIN, hi2: T - 30*MIN })]));
      const cp = V.kishmish.spans.filter(x => x.cam);
      ok('a sleep suggestion: an ESTIMATED piece only ("משוער"), nothing written', cp.length === 1 && cp[0].assumed && cp[0].t === T - 100*MIN && cp[0].end === T - 40*MIN && L0() === before && scores('kishmish').marked === 0);
      const c = $q('#sec-rest [data-camss]') && $q('#sec-rest .camjs');
      ok('…its question in the sleep card, three answers, neutral wording', !!c && ['ok', 'no', 'unsure'].every(a => !!c.querySelector(`[data-camss=${a}]`)) && c.textContent.includes('הצעה מהמצלמה, ניסיונית') && noStats()); }
    $q('#sec-rest [data-camss=ok]').click(); await wait(3);
    { const s = byId('cam:sug:sug_s1');
      ok('"אישור": a sleep entry cam:sug:<id>, confirmed from the camera; the estimate gives way to it', !!s && s.k === 'sleep' && s.t === T - 100*MIN && s.end === T - 40*MIN && s.cam.conf === 1 && !V.kishmish.spans.some(x => x.cam) && V.kishmish.sleep.lastEnd === T - 40*MIN && camjDec('sug:sug_s1').d === 'confirmed');
      ok('…counted as logged sleep, and the wake window carries through', scores('kishmish').marked > 0 && wakeWin('kishmish') && wakeWin('kishmish').hi === T - 30*MIN); }
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    { const before = L0(); await sugs(DOCS([SUG('sug_s2', 'sleep_suggestion', T - 100*MIN, { end: T - 40*MIN, lo2: T - 41*MIN, hi2: T - 39*MIN })]));
      $q('#sec-rest [data-camss=unsure]').click(); await wait(3);
      ok('"לא בטוחה": nothing written, the question and the estimate hidden', L0() === before && !$q('[data-camss]') && !V.kishmish.spans.some(x => x.cam) && camjDec('sug:sug_s2').d === 'unsure'); }
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }, { ...K0, k:'sleep', t: T - 95*MIN, end: T - 60*MIN }]);
    await sugs(DOCS([SUG('sug_s3', 'sleep_suggestion', T - 100*MIN, { end: T - 40*MIN, lo2: T - 41*MIN, hi2: T - 39*MIN })]));
    ok('dedup: a sleep she logged over the same time — not asked about', !$q('[data-camss]'));

    // 3. decision 4: an unconfirmed camera estimate never holds the food banner
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }, { ...K0, k:'food', t: T - 3*HOUR - 40*MIN }]); FAKE_HOUR = 12;
    await sugs(DOCS([SUG('sug_r', 'sleep_suggestion', T - 20*MIN)]));
    ok('an open sleep suggestion while the doc is fresh: "ישנה כנראה" (estimate)', V.kishmish.sleep.start === T - 20*MIN && V.kishmish.sleep.assumed && V.kishmish.sleep.cam === 'sug:sug_r');
    ok('…the food banner is NOT held back by it', alerts('kishmish').some(a => a.k === 'food') && !CAMJ_OWNER.estHoldsAlerts);
    await sugs(DOCS([SUG('sug_r', 'sleep_suggestion', T - 20*MIN)], { published_at: Date.now() - 40*MIN }));
    ok('an open suggestion in an old doc: no running estimate', !V.kishmish.sleep.start);

    // 4. decision 1: food / water from HER labels are imported directly (no tap), with the same dedup
    const FEAT0 = CAM_FEATURES; CAM_FEATURES = { ...FEAT0, foodWaterEvents: true, drinkSuggest: true };   // her food / water labels: built, off in this release until the camera publishes them
    await fresh(() => [{ ...K0, k:'pee', t: T - HOUR }, { ...K0, k:'water', t: T - 2*HOUR + 20*MIN }]);
    await evs([E('ce_lf', 'food_seen', T - 30*MIN), E('ce_lw', 'water_seen', T - 2*HOUR), E('ce_lf_old', 'food_seen', T - 20*HOUR)]);
    camjApply(); await wait(3);
    { const f = byId('cam:ce_lf');
      ok('her food label: imported without a tap, at her time, never offered', !!f && f.k === 'food' && f.t === T - 30*MIN && !f.cam.ok && !$q('.camjf') && camjNote(f).includes('מהתיוג שלך'));
      ok('…older labels too (no 6 h limit for her own labels)', !!byId('cam:ce_lf_old'));
      ok('her water label with a drink logged by hand 20 min later: the same drink, not duplicated', !byId('cam:ce_lw') && state.log.filter(e => e.k === 'water').length === 1);
      camjApply(); camjApply(); await wait(3);
      ok('idempotent', state.log.filter(e => e.id === 'cam:ce_lf').length === 1);
      commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:ce_lf'); }, { quiet: true }); camjApply(); await wait(3);
      ok('deleted by a caregiver: never re-imported', !byId('cam:ce_lf') && camjDec('ce_lf').d === 'deleted'); }

    CAM_FEATURES = FEAT0;
    // 5. decision 2: her marked waking ENDS a camera estimate; only a NEW onset starts a new one
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }, { ...K0, k:'sleep', t: T - 95*MIN, end: T - 80*MIN }]);
    await sugs(DOCS([SUG('sug_w1', 'sleep_suggestion', T - 110*MIN, { end: T - 50*MIN, lo2: T - 50*MIN, hi2: T - 45*MIN }), SUG('sug_w2', 'sleep_suggestion', T - 35*MIN, { end: T - 15*MIN, lo2: T - 15*MIN, hi2: T - 14*MIN })]));
    { const cp = V.kishmish.spans.filter(x => x.cam);
      ok('her waking at -80 ends the -110…-50 estimate (nothing after it), a new suggestion at -35 is a new estimate', cp.length === 2 && cp[0].t === T - 110*MIN && cp[0].end === T - 95*MIN && cp[1].t === T - 35*MIN && cp[1].end === T - 15*MIN && !cp.some(x => x.t >= T - 80*MIN && x.t < T - 35*MIN)); }

    // 6. fix: a manual crate session linked to a camera stay whose entry window is wide keeps its time and is NOT `unc`
    await fresh(() => [{ ...K0, k:'pee', t: T - 4*HOUR }, { ...K0, k:'sleep', t: T - 3*HOUR + 20*MIN, end: T - 2*HOUR - 10*MIN }]);
    commit('', () => state.log.push(newStay('kishmish', 'crate', T - 3*HOUR, T - 2*HOUR)), { quiet: true });
    { const M = state.log.find(e => e.k === 'crate');
      await evs([E('ce_x', 'crate_entry', T - 3*HOUR + 4*MIN, { lo: T - 3*HOUR - 10*MIN, hi: T - 3*HOUR + 10*MIN, wide: true, pair_id: 'ce_xx' }), E('ce_xx', 'crate_exit', T - 2*HOUR)],
        { door_spans: [{ from: T - 3*HOUR - 15*MIN, to: T - 2*HOUR + MIN, value: 'closed' }] });
      camjApply(); await wait(3);
      const x = byId(M.id);
      ok('linked to a wide camera window: her start kept, linked, and NOT marked uncertain', !!x.cam && x.cam.cid === 'cam:ce_x' && x.t === T - 3*HOUR && !x.cam.unc && !camjNote(x, true).includes('לא ודאית'));
      ok('…so the sleep in it still teaches the delay (sleepSamples)', sleepSamples('kishmish', state.log, Date.now()).some(s => s.t === T - 3*HOUR + 20*MIN));
      commit('', () => { byId(M.id).cam.unc = 1; }, { quiet: true, cam: true });
      ok('an entry saved with the old bug (manual id + unc): read as certain', sleepSamples('kishmish', state.log, Date.now()).some(s => s.t === T - 3*HOUR + 20*MIN) && !camjNote(byId(M.id), true).includes('לא ודאית')); }

    ok('the only camera write path is camera/feedback', merged.length > 0 && merged.every(([n]) => n === 'feedback'));
    fb = null; CAMJ.ready = CAMJ.sready = false; CAMJ.ev = []; CAMJ.ev0 = []; CAMJ.sev = []; setState(state);
    // an approved eating suggestion that the two-hour rule reads as a bite: the same "זו הייתה ארוחה" as a manual entry
    await fresh(() => [{ ...K0, k:'food', t: T - 100*MIN, m:'meal' }]);
    await sugs(DOCS([SUG('sug_bite', 'eating_suggestion', T - 5*MIN)]));
    { const b = $q('#sec-food [data-camf=ok]'); if(b) b.click(); await wait(3);
      const fe = byId('cam:sug:sug_bite');
      ok('approved eating 1h35 after a meal: written (a bite by the two-hour rule) and the toast offers "זו הייתה ארוחה"', !!fe && mealKind(fe) === 'bite' && !!$q('#toMeal'));
      if($q('#toMeal')) $q('#toMeal').click(); await wait(2);
      ok('…one tap makes it the meal: the meal timer moves to the camera time', !!byId('cam:sug:sug_bite') && mealKind(byId('cam:sug:sug_bite')) === 'meal' && V.kishmish.food === T - 5*MIN); }
    done();
  } catch(e){ crashed(e); }
})();
