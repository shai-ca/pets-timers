// §18 (CAMERA-API): her EXPLICIT answer to an app-pending item, given in the camera's research UI on the Mac, arrives as
// `owner_decision {ans, at, src:'research_ui', rid}` inside the event (camera/events) or the suggestion item, and is
// applied ONCE per rid through the normal answer path (journal `cam:<id>` + feedback together, `prev` kept), with no
// second confirmation in the app. Guard: the journal only for items pending in the app's own plan. Research labels never
// become entries. Synthetic replicas only.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    const FEAT0 = CAM_FEATURES; CAM_FEATURES = { sleepSuggest: true, eatSuggest: true, drinkSuggest: true, irContext: true, liveSleepEstimate: false, foodWaterEvents: true };
    let T = Date.now(), EV = [], SUG = null;
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .8, status: 'active', created_at: T, model_version: 'm1', ...o });
    const OD = (ans, rid, at, o = {}) => ({ owner_decision: { ans, at: at == null ? Date.now() - MIN : at, src: 'research_ui', rid, ...o } });
    const send = async () => { if(subs.events) subs.events({ schema: 'cam-events/1', events: EV, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: [], published_at: T, updated_at: T }, false); await wait(3);
      if(SUG && subs[camjSugDoc()]) subs[camjSugDoc()]({ schema: 'cam-suggestions/1', suggestions: SUG, published_at: Date.now(), enabled: true }, false); await wait(3); render(); await wait(2); };
    const fresh = async mk => { reset(); localStorage.removeItem('pets-timers-v1-cam'); close();
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.fb = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; CAMJ.unsub = CAMJ.unsubS = CAMJ.unsubF = null; T = Date.now(); EV = []; SUG = null;
      seed(mk()); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const byId = id => state.log.find(e => e.id === id), crates = () => state.log.filter(e => e.k === 'crate');
    const base = () => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'food', t: T - 5*HOUR, m:'meal' }];

    // 0. a plain research label (no owner_decision) — or anything not an explicit research answer — changes nothing
    await fresh(base);
    EV = [E('ce_p', 'crate_entry', T - 30*MIN, { labels: [{ label: 'in_crate', basis: 'independent' }] }), E('ce_q', 'crate_entry', T - 50*MIN, { owner_decision: { ans: 'closed', at: T - MIN, src: 'label', rid: 'L1' } })];
    await send();
    { const rv = camjPlan(state.log, Date.now()).rv;
      ok('a research label alone: no journal entry, still pending in the app', !crates().length && rv.pending.some(e => e.event_id === 'ce_p') && !camjDec('ce_p'));
      ok('an owner_decision whose src is not research_ui: ignored, still pending', rv.pending.some(e => e.event_id === 'ce_q') && !camjDec('ce_q')); }
    ok('…and nothing was sent to feedback', !merged.length || merged.every(([n, d]) => !d.decisions.ce_p && !d.decisions.ce_q));

    // 1. her explicit answer "הייתה, דלת סגורה" in the research UI -> one session, as if she had tapped it
    await fresh(base);
    EV = [E('ce_1', 'crate_entry', T - 30*MIN, OD('closed', 'r1'))];
    await send();
    { const c = byId('cam:ce_1'), d = camjDec('ce_1');
      ok('research "closed" on a pending entry: ONE crate session cam:ce_1 at the camera time', crates().length === 1 && !!c && c.t === T - 30*MIN && c.cam.in === 'ce_1');
      ok('…by research_ui, the decision approved with its rid (door closed too)', c.cam.ok === 'research_ui' && d.d === 'approved' && d.by === 'research_ui' && d.rid === 'r1' && camjDec('door:ce_1').d === 'door_closed');
      ok('…not asked again in the app (no card question, nothing pending)', !$q('#sec-crate [data-camans]') && !camjPlan(state.log, Date.now()).rv.pending.some(e => e.event_id === 'ce_1'));
      ok('…the list row says it was approved in research', camjNote(c).includes('אושר במחקר'));
      ok('…the feedback carries it (live mode)', merged.some(([n, x]) => n === 'feedback' && x.decisions.ce_1 && x.decisions.ce_1.rid === 'r1')); }
    // 2. the same rid again (doc republished, another listener tick): a no-op
    { const L = JSON.stringify(state.log), D = JSON.stringify(CAMJ.fbLocal), m = merged.length; await send(); camjApply(); await wait(3);
      ok('the same rid again: nothing changes (journal, decision, feedback)', JSON.stringify(state.log) === L && JSON.stringify(CAMJ.fbLocal) === D && merged.length === m); }
    // 3. two phones applying it independently: one entry after the merge
    { const s1 = clone(state), s0 = clone(state); s0.log = s0.log.filter(e => e.id !== 'cam:ce_1');
      use(clone(s0)); CAMJ.fbLocal = {}; camjApply(); await wait(3); const s2 = clone(state);
      ok('phone B applies it on its own: also cam:ce_1', s2.log.filter(e => e.id === 'cam:ce_1').length === 1);
      ok('two phones: one entry after the merge', patch(diff(s0, s2), s1).log.filter(e => e.id === 'cam:ce_1').length === 1 && patch(diff(s0, s1), s2).log.filter(e => e.id === 'cam:ce_1').length === 1); }
    // 4. a correction in the research UI (a newer rid) flips it: the session goes, the history is kept
    EV = [E('ce_1', 'crate_entry', T - 30*MIN, OD('no', 'r2', Date.now()))]; await send();
    { const d = camjDec('ce_1');
      ok('a newer research answer "לא הייתה בכלוב": the session is removed', !byId('cam:ce_1') && !crates().length);
      ok('…rejected, rid r2, the earlier answer (r1) kept in prev', d.d === 'rejected' && d.rid === 'r2' && d.prev.some(p => p.rid === 'r1' && p.d === 'approved')); }
    // 5. a later in-app change still works and is not overridden by the older research answer
    camjSetAnswer('ce_1', 'closed'); await wait(3);
    ok('in-app "שינוי תשובה" afterwards: the session is back, by her in the app', !!byId('cam:ce_1') && byId('cam:ce_1').cam.ok === 'shai' && camjDec('ce_1').by === 'shai');
    await send(); camjApply(); await wait(3);
    ok('…the older research answer is not applied again', !!byId('cam:ce_1') && camjDec('ce_1').d === 'approved' && camjDec('ce_1').by === 'shai');
    document.getElementById('toast').classList.remove('show');

    // 6. matched to a manual entry: the decision only, never a duplicate
    await fresh(() => [...base(), { ...K0, k:'food', t: T - 20*MIN + 5*MIN }]);
    EV = [E('ce_f', 'food_seen', T - 20*MIN, OD('ok', 'r3'))]; await send();
    ok('food logged by hand nearby + research "אישור": no cam: entry next to the manual one', !byId('cam:ce_f') && state.log.filter(e => e.k === 'food').length === 2);
    ok('…the decision is recorded (approved, rid, research_ui)', camjDec('ce_f') && camjDec('ce_f').d === 'approved' && camjDec('ce_f').rid === 'r3' && camjDec('ce_f').by === 'research_ui');
    // 7. expired (older than the app asks about): the decision only
    await fresh(base);
    EV = [E('ce_old', 'crate_entry', T - 7*HOUR, OD('closed', 'r4'))]; await send();
    ok('an expired entry + research "closed": no session, the decision recorded', !crates().length && camjDec('ce_old').d === 'approved' && camjDec('ce_old').rid === 'r4');
    // 8. food: pending -> research "אישור" = one food entry; water "לא נכון" = no entry
    await fresh(base);
    EV = [E('ce_f2', 'food_seen', T - 15*MIN, OD('ok', 'r5')), E('ce_w2', 'water_seen', T - 12*MIN, OD('no', 'r6'))]; await send();
    ok('a pending food detection + research "אישור": one food entry cam:ce_f2, by research_ui', !!byId('cam:ce_f2') && byId('cam:ce_f2').k === 'food' && byId('cam:ce_f2').cam.ok === 'research_ui' && camjNote(byId('cam:ce_f2')).includes('אושר במחקר'));
    ok('a pending drink + research "לא נכון": no entry, rejected', !byId('cam:ce_w2') && camjDec('ce_w2').d === 'rejected' && !$q('.camjf'));
    // 9. suggestions (camera/suggestions items): eating "שתתה, לא אכלה", a sleep suggestion "אישור"
    await fresh(base);
    SUG = [{ id: 'e1', kind: 'eating_suggestion', ts: T - 10*MIN, lo: T - 11*MIN, hi: T - 9*MIN, status: 'active', confidence: .7, ...OD('drink', 'r7') },
           { id: 's1', kind: 'sleep_suggestion', ts: T - 80*MIN, end: T - 40*MIN, lo: T - 81*MIN, hi: T - 79*MIN, status: 'active', confidence: .7, ...OD('ok', 'r8') }];
    await send();
    ok('an eating suggestion + research "שתתה, לא אכלה": drinking, no food entry', camjDec('sug:e1') && camjDec('sug:e1').d === 'drinking' && !byId('cam:sug:e1'));
    ok('a sleep suggestion + research "אישור": one sleep entry cam:sug:s1, confirmed', !!byId('cam:sug:s1') && byId('cam:sug:s1').k === 'sleep' && camjDec('sug:s1').d === 'confirmed' && camjDec('sug:s1').rid === 'r8');
    ok('…the sleep wake companion carries no decision of its own', !camjDec('sug:s1:w'));
    // 10. a malformed answer for its kind is ignored (e.g. "closed" on food, "drink" on a camera food event)
    await fresh(base);
    EV = [E('ce_f3', 'food_seen', T - 15*MIN, OD('closed', 'r9')), E('ce_f4', 'food_seen', T - 25*MIN, OD('drink', 'r10'))]; await send();
    ok('answers outside the kind\'s own set: ignored, still pending', !camjDec('ce_f3') && !camjDec('ce_f4') && camjPlan(state.log, Date.now()).rv.feed.food.length === 2);
    // 11. §18b: an eating session she reviewed on footage (source owner_review, rv_…) with her decision
    const RV = (id, ts, ans, rid, o = {}) => ({ id, kind: 'eating_suggestion', ts, lo: ts, hi: ts + 6*MIN, status: 'active', validated: false, source: 'owner_review', dog: 'kishmish', owner_decision: { ans, rid, at: Date.now() - MIN, by: 'owner', src: 'research_ui' }, ...o });
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'food', t: T - 9*HOUR, m:'meal' }]);
    const food0 = K().food;
    SUG = [RV('rv_cam2_' + (T - 3*HOUR), T - 3*HOUR, 'ok', 'rr1')]; await send();
    { const id = 'cam:sug:rv_cam2_' + (T - 3*HOUR), e = byId(id);
      ok('owner_review eating session: one food entry at the ORIGINAL time (3 h ago, older than the 6 h-question window is not needed)', !!e && e.k === 'food' && e.t === T - 3*HOUR && state.log.filter(x => x.k === 'food').length === 2);
      ok('…the meal clock moved to it (a meal by the normal rules: 6 h after the last one)', mealKind(e) === 'meal' && K().food === T - 3*HOUR && food0 === T - 9*HOUR);
      ok('…provenance "מסקירה ידנית של צילום", never a model claim', camjNote(e).includes('מסקירה ידנית של צילום') && !camjNote(e).includes('הצעה מהמצלמה') && e.cam.src === 'owner_review');
      ok('…never asked as a question in the food card or the review', !$q('.camjf') && (camjReview(), !sh.querySelector('[data-camf]')));
      close();
      const L = JSON.stringify(state.log), D = JSON.stringify(CAMJ.fbLocal); await send(); camjApply(); await wait(3);
      ok('…the same rid again: no-op', JSON.stringify(state.log) === L && JSON.stringify(CAMJ.fbLocal) === D);
      ok('…excluded from camera figures (camjIsReview)', camjIsReview(e) && camjIsReview({ id: 'cam:sug:rv_x' }) && !camjIsReview({ id: 'cam:ce_1', cam: { src: 'live_model' } })); }
    // a reviewed meal 20 h ago (her decision just now), with a later meal already logged: written in the past, never the "latest meal"
    await fresh(() => [{ ...K0, k:'food', t: T - 26*HOUR, m:'meal' }, { ...K0, k:'food', t: T - 4*HOUR, m:'meal' }, { ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }]);
    SUG = [RV('rv_cam2_' + (T - 20*HOUR), T - 20*HOUR, 'ok', 'rr20')]; await send();
    { const e = byId('cam:sug:rv_cam2_' + (T - 20*HOUR));
      ok('a 20 h-old reviewed meal: one entry at its original time', !!e && e.t === T - 20*HOUR);
      ok('…the meal clock stays on the later meal (4 h ago)', K().food === T - 4*HOUR); }
    // her decision older than 48 h: not applied any more
    await fresh(base);
    SUG = [RV('rv_cam2_' + (T - 50*HOUR), T - 50*HOUR, 'ok', 'rr50', { owner_decision: { ans: 'ok', rid: 'rr50', at: T - 49*HOUR, by: 'owner', src: 'research_ui' } })]; await send();
    ok('her decision more than 48 h old: nothing written', !state.log.some(e => /^cam:sug:rv_/.test(e.id)));
    // §18b drinking, REVIEWED and answered "ok" (drinkSuggest stays off): a normal water entry at its original time
    await fresh(() => [...base(), { ...K0, k:'water', t: T - 1*HOUR }]); { const FD = CAM_FEATURES; CAM_FEATURES = { ...FD, drinkSuggest: false };
    SUG = [RV('rv_cam2_w' + (T - 3*HOUR), T - 3*HOUR, 'ok', 'rrw', { kind: 'drinking_suggestion', needs_app_flag: 'drinkSuggest' })]; await send();
    const w = byId('cam:sug:rv_cam2_w' + (T - 3*HOUR));
    ok('reviewed drinking + "ok" (drinkSuggest off): one water entry at its original time, "מסקירה ידנית של צילום"', !!w && w.k === 'water' && w.t === T - 3*HOUR && camjNote(w).includes('מסקירה ידנית של צילום'));
    ok('…"last drink" stays on the newer manual drink', K().water === T - 1*HOUR);
    ok('…no drink question anywhere (automatic drinking stays off)', !$q('.camjf[data-feed=water]'));
    CAM_FEATURES = FD; }
    // historical side effects: an old reviewed drink / meal never ends a stay or a sleep that is still running, nor a newer one
    await fresh(() => [...base(), { ...K0, k:'crate', t: T - 3*HOUR }]);
    SUG = [RV('rv_cam2_w' + (T - 2*HOUR), T - 2*HOUR, 'ok', 'rh1', { kind: 'drinking_suggestion' })]; await send();
    ok('a reviewed drink 2 h ago inside a crate stay still running: the stay is NOT ended (no evidence it ended then)', crates().length === 1 && crates()[0].end == null && !!byId('cam:sug:rv_cam2_w' + (T - 2*HOUR)));
    await fresh(() => [...base(), { ...K0, k:'crate', t: T - 50*MIN }, { ...K0, k:'sleep', t: T - 40*MIN }]);
    SUG = [RV('rv_cam2_' + (T - 3*HOUR), T - 3*HOUR, 'ok', 'rh2'), RV('rv_cam2_w' + (T - 4*HOUR), T - 4*HOUR, 'ok', 'rh3', { kind: 'drinking_suggestion' })]; await send();
    ok('an older reviewed meal / drink never ends a NEWER stay or sleep (began after them)', crates()[0].end == null && state.log.find(e => e.k === 'sleep').end == null && !!byId('cam:sug:rv_cam2_' + (T - 3*HOUR)) && !!byId('cam:sug:rv_cam2_w' + (T - 4*HOUR)));
    // a selective batch: 5 reviewed sessions, 3 answered "ok", 2 "no" -> exactly 3 entries
    await fresh(() => [{ ...K0, k:'pee', t: T - 30*MIN, w:'gravel' }]);
    SUG = [1, 2, 3, 4, 5].map(i => RV('rv_cam2_' + (T - i*HOUR), T - i*HOUR, i % 2 ? 'ok' : 'no', 'rb' + i)); await send();
    ok('a selective batch (3 of 5 approved): exactly 3 food entries, 2 rejected decisions', state.log.filter(e => /^cam:sug:rv_/.test(e.id)).length === 3 && [2, 4].every(i => camjDec('sug:rv_cam2_' + (T - i*HOUR)).d === 'rejected'));
    // attribution: list, text export, entry sheet
    { const e = byId('cam:sug:rv_cam2_' + (T - 1*HOUR)); render(); await wait(2);
      ok('attribution in the text export', logText('kishmish', T - 6*HOUR, T + MIN).includes('מסקירה ידנית של צילום'));
      openEntrySheet(state.log.indexOf(e)); await wait(2);
      ok('…and in the entry sheet', bg.classList.contains('show') && sh.textContent.includes('מסקירה ידנית של צילום')); close(); }
    // corrections in the app ("שינוי תשובה"): removed, re-created, history kept; a deleted entry is not re-applied
    { const id = 'sug:rv_cam2_' + (T - 1*HOUR);
      camjSetAnswer(id, 'no'); await wait(3);
      ok('in-app "לא נכון" on a reviewed meal: the entry is removed, the research rid kept in prev', !byId('cam:' + id) && camjDec(id).d === 'rejected' && camjDec(id).prev.some(p => p.rid === 'rb1'));
      camjSetAnswer(id, 'ok'); await wait(3);
      ok('…"אישור" again: re-created, one entry', state.log.filter(e => e.id === 'cam:' + id).length === 1);
      await send(); camjApply(); await wait(3);
      ok('…the research rid is not applied again', state.log.filter(e => e.id === 'cam:' + id).length === 1 && camjDec(id).by === 'shai');
      commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:' + id); }, { quiet: true }); await wait(3); await send(); camjApply(); await wait(3);
      ok('deleted from the list by a caregiver: "deleted", never re-imported from the same rid', !byId('cam:' + id) && camjDec(id).d === 'deleted');
      document.getElementById('toast').classList.remove('show'); }
    // camera-side TEST items (test:true) are refused outside a test harness
    await fresh(base);
    SUG = [RV('rv_cam2_test_eat_ok', T - 4*HOUR, 'ok', 'rt1', { test: true })]; EV = [E('ce_t', 'crate_entry', T - 30*MIN, { test: true, ...OD('closed', 'rt2') })]; await send();
    ok('test:true items (suggestion or event): dropped, nothing applied or shown', !state.log.some(e => /test|ce_t/.test(e.id)) && !CAMJ.ev.some(e => /test|ce_t/.test(e.event_id)) && !Object.keys(CAMJ.fbLocal).length);
    CAMJ_TEST_OK = true; await send(); CAMJ_TEST_OK = false;
    ok('…accepted only when a harness switches CAMJ_TEST_OK on', !!byId('cam:sug:rv_cam2_test_eat_ok'));
    // two phones applying the same reviewed meal: one entry
    await fresh(base);
    SUG = [RV('rv_cam2_' + (T - 3*HOUR), T - 3*HOUR, 'ok', 'r2p')]; await send();
    { const id = 'cam:sug:rv_cam2_' + (T - 3*HOUR), s1 = clone(state), s0 = clone(state); s0.log = s0.log.filter(e => e.id !== id);
      use(clone(s0)); CAMJ.fbLocal = {}; camjApply(); await wait(3); const s2 = clone(state);
      ok('two phones: each applies it, one entry after the merge', s2.log.some(e => e.id === id) && patch(diff(s0, s2), s1).log.filter(e => e.id === id).length === 1); }
    // a manual meal −5 / +20 min around it: skipped (the decision only)
    for(const d of [-5, 20]){
      await fresh(() => [...base(), { ...K0, k:'food', t: T - 2*HOUR + d*MIN, m:'meal' }]);
      SUG = [RV('rv_cam2_' + (T - 2*HOUR), T - 2*HOUR, 'ok', 'rr' + d)]; await send();
      ok(`a manual meal at ${d > 0 ? '+' : ''}${d} min: no cam:sug:rv_ entry, the decision recorded`, !state.log.some(e => /^cam:sug:rv_/.test(e.id)) && state.log.filter(e => e.k === 'food').length === 2 && camjDec('sug:rv_cam2_' + (T - 2*HOUR)).rid === 'rr' + d); }
    // another camera food entry nearby: skipped too
    await fresh(() => [...base(), { ...K0, id: 'cam:ce_zz', k:'food', t: T - 2*HOUR + 8*MIN, cam: { in: 'ce_zz', src: 'live_model', ok: 'shai' } }]);
    SUG = [RV('rv_cam2_' + (T - 2*HOUR), T - 2*HOUR, 'ok', 'rr9')]; await send();
    ok('another cam: food entry at +8 min: skipped', !state.log.some(e => /^cam:sug:rv_/.test(e.id)));
    // items without her decision, and automatic (unreviewed) drinking suggestions: ignored entirely (drinkSuggest off)
    await fresh(base);
    SUG = [RV('rv_cam2_' + (T - 70*MIN), T - 70*MIN, 'ok', 'x', { owner_decision: undefined }), { id: 'd1', kind: 'drinking_suggestion', ts: T - 20*MIN, lo: T - 21*MIN, hi: T - 19*MIN, status: 'active', confidence: .7, needs_app_flag: 'drinkSuggest' }]; await send();
    ok('owner_review without a decision / an automatic drinking suggestion: nothing (no entry, no question, no decision)', !state.log.some(e => /^cam:sug/.test(e.id)) && !$q('.camjf') && !Object.keys(CAMJ.fbLocal).length && !CAMJ.ev.some(e => e.source === 'owner_review' || e.kind === 'water_seen'));
    // research labels alone, an ordinary suggestion without a decision: still a question, nothing written
    SUG = [{ id: 'e9', kind: 'eating_suggestion', ts: T - 15*MIN, lo: T - 16*MIN, hi: T - 14*MIN, status: 'active', confidence: .7, labels: [{ label: 'eating' }] }]; await send();
    ok('a model suggestion with only research labels: still offered, nothing written', !byId('cam:sug:e9') && !!$q('.camjf[data-feed=food]') && !camjDec('sug:e9'));
    // the weekly line never counts her reviews (crate figures only; a review entry is filtered out)
    await fresh(() => [...base(), { ...K0, id: 'cam:sug:rv_cam2_q', k:'crate', t: T - 3*HOUR, end: T - 2*HOUR, cam: { src: 'owner_review' } }]);
    EV = []; await send(); camjReview();
    ok('review weekly figures exclude owner_review / cam:sug:rv_* entries', /השבוע: <b>0<\/b> שהיות נרשמו מהמצלמה/.test(sh.innerHTML)); close();
    // her reviewed SLEEP interval (owner, 27.11): start + end from her own record, outer bound; never an invented duration
    await fresh(base); const s0 = T - 20*HOUR, s1 = s0 + 4*MIN + 10000, OK = rid => ({ owner_decision: { ans: 'ok', at: Date.now() - MIN, src: 'research_ui', rid } });
    const RS = (id, ts, end, o = {}) => ({ id, kind: 'sleep_suggestion', ts, lo: ts, hi: end, end, status: 'active', source: 'owner_review', validated: false, interval_basis: 'outer_bound', ...o });
    SUG = [RS('rv_cam1_sleep_' + s0, s0, s1, OK('rs1')), RS('rv_cam1_sleep_' + (s0 + 3*HOUR), s0 + 3*HOUR, undefined, OK('rs2'))]; await send();
    { const sl = state.log.filter(e => e.k === 'sleep' && /^cam:sug:rv_cam1_sleep_/.test(e.id));
      ok('reviewed sleep interval: ONE sleep entry at her start and end, provenance owner_review, outer bound kept', sl.length === 1 && sl[0].t === s0 && sl[0].end === s1 && sl[0].cam.src === 'owner_review' && sl[0].cam.ob === 1);
      ok('…labelled as her review with the outer-bound note', camjNote(sl[0], true).includes('מסקירה ידנית של צילום') && camjNote(sl[0], true).includes('גבול חיצוני'));
      ok('…an item with no end: nothing (a duration is never invented)', !state.log.some(e => String(e.id).includes('rv_cam1_sleep_' + (s0 + 3*HOUR))));
      ok('…excluded from camera figures', camjIsReview(sl[0]));
      const n0 = state.log.length; await send(); ok('…re-sent: nothing added', state.log.length === n0); }
    // a sleep she logged by hand over the same time: no second entry
    await fresh(() => [...base(), { ...K0, k:'sleep', t: s0 - 2*MIN, end: s1 + MIN }]); SUG = [RS('rv_cam1_sleep_' + s0, s0, s1, OK('rs3'))]; await send();
    ok('reviewed sleep over a hand-logged sleep: no duplicate', state.log.filter(e => e.k === 'sleep').length === 1);
    CAM_FEATURES = FEAT0; fb = null; camjStop(); CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; CAMJ.fbLocal = {}; render();
    done();
  } catch(e){ crashed(e); }
})();
