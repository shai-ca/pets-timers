// Production observations of 26.11 night (synthetic replicas, no real data) + the release's camera feature flags.
// 1. an approved live entry with the door OPEN started a routine cycle (18:47): an open-door visit never becomes a crate
//    entry, by any path; an unknown door asks first. 2. with the camera working the routine points to its approval.
// 3. a drink (or her verified exit) ends a running sleep, marked, imported or estimated. 4. sleep, physical occupancy and
//    intentional sessions stay separate: a voluntary return or a self-started sleep starts no cycle. 5. flags.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    let T = Date.now(), DOORS = [];
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'owner_label', confidence: null, status: 'active', created_at: T, model_version: 't', ...o });
    const send = async (list, o = {}) => { if(subs.events) subs.events({ schema: 'cam-events/1', events: list, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: DOORS, published_at: T, updated_at: T, ...o }, false); await wait(3); render(); await wait(2); };
    const sugs = async d => { if(subs.suggestions) subs.suggestions(d, false); await wait(3); render(); await wait(2); };
    const fresh = async mk => { reset(); localStorage.removeItem('pets-timers-v1-cam');
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; T = Date.now(); DOORS = []; seed(mk()); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const crates = () => state.log.filter(e => e.k === 'crate'), rounds = () => roundStarts('kishmish').length;

    // 1a. the production case: door marked open, a live entry, she is in for a while
    await fresh(() => [{ ...K0, k:'pee', t: T - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: T - 3*HOUR, end: T - 2*HOUR }]);
    { const r0 = rounds(), rt0 = JSON.stringify(routine('kishmish'));
      DOORS = [{ from: T - 2*HOUR, to: T, value: 'open' }];
      await send([E('ce_o', 'crate_entry', T - 30*MIN, { source: 'live_model' })]);
      const { rv } = camjPlan(state.log, Date.now());
      ok('door OPEN at a live entry: not offered as a stay, listed as a visit, not in the review\'s approvals', !rv.live.length && !rv.pending.length && rv.visits.some(v => v.live && v.door === 'open') && !$q('#sec-crate .camjt'));
      commit('', () => camjDo({ do: 'start', ev: CAMJ.ev.find(e => e.event_id === 'ce_o') }, me), { quiet: true, cam: true });
      ok('…even if an approval reaches the action, no crate entry: no new cycle, routine unchanged', crates().length === 1 && rounds() === r0 && JSON.stringify(routine('kishmish')) === rt0);
      // the app's own "הגדרות כלוב: דלת פתוחה" counts the same
      DOORS = []; commit('', () => state.log.push({ p:'kishmish', k:'cset', t: T - 40*MIN, door:'open' }), { quiet: true }); await send(CAMJ.ev0);
      ok('door open by the app\'s own setting: the same', !camjPlan(state.log, Date.now()).rv.live.length && crates().length === 1); }
    // 1b. door unknown: the card asks; "לא" = a visit, nothing stored
    await fresh(() => [{ ...K0, k:'pee', t: T - 50*MIN, w:'gravel' }]);
    { const r0 = rounds();
      await send([E('ce_u', 'crate_entry', T - 30*MIN, { source: 'live_model' })]);
      const q = $q('#sec-crate .camjt');
      ok('door unknown: the card asks with the four answers', !!q && q.textContent.includes('הדלת לא ידועה') && q.querySelector('[data-camans=closed]').textContent === 'הייתה, דלת סגורה' && q.querySelector('[data-camans=open]').textContent === 'הייתה, דלת פתוחה' && !q.querySelector('[data-camj=start]'));
      q.querySelector('[data-camans=open]').click(); await wait(3);
      ok('"לא": a visit — no crate entry, no cycle, decisions to feedback, not asked again', !crates().length && rounds() === r0 && camjDec('ce_u').d === 'visit' && camjDec('door:ce_u').d === 'door_open' && !$q('#sec-crate .camjt')); }
    await fresh(() => [{ ...K0, k:'pee', t: T - 50*MIN, w:'gravel' }]);
    await send([E('ce_y', 'crate_entry', T - 30*MIN, { source: 'live_model' })]);
    $q('#sec-crate .camjt [data-camans=closed]').click(); await wait(3);
    ok('"כן": an intentional session from the camera time', crates().length === 1 && Math.abs(crates()[0].t - (T - 30*MIN)) < 1000 && crates()[0].id === 'cam:ce_y');
    // 1c. retrospective approvals in the review
    await fresh(() => [{ ...K0, k:'pee', t: T - 5*HOUR }]);
    DOORS = [{ from: T - 4*HOUR - 10*MIN, to: T - 3*HOUR, value: 'open' }];
    await send([E('ce_r1', 'crate_entry', T - 4*HOUR, { source: 'live_model' }), E('ce_r1x', 'crate_exit', T - 3*HOUR - 30*MIN, { source: 'live_model' }), E('ce_r2', 'crate_entry', T - 2*HOUR, { source: 'live_model' }), E('ce_r2x', 'crate_exit', T - 90*MIN, { source: 'live_model' })]);
    camjReview(); await wait(2);
    { const okb = [...sh.querySelectorAll('[data-camans=closed]')];
      ok('review: the open-door entry is not approvable; the unknown-door one offers "שהייה, דלת סגורה" or "ביקור"', okb.length === 1 && okb[0].dataset.ev === 'ce_r2' && okb[0].textContent.includes('דלת סגורה') && !!sh.querySelector('[data-camans=open][data-ev=ce_r2]'));
      sh.querySelector('[data-camans=open][data-ev=ce_r2]').click(); await wait(3);
      ok('…"ביקור": nothing stored', !crates().length && camjDec('ce_r2').d === 'visit'); close(); }
    // 1d. her own labels: an open-door stay stays a visit (unchanged), whatever its length
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    DOORS = [{ from: T - 2*HOUR, to: T, value: 'open' }];
    await send([E('ce_l', 'crate_entry', T - 100*MIN, { pair_id: 'ce_lx' }), E('ce_lx', 'crate_exit', T - 10*MIN)]); camjApply(); await wait(3);
    ok('her labels, door open for 90 min: a visit, no crate entry, no cycle', !crates().length && !rounds());

    // 2. the routine's crate line points to the camera while it works (same length, manual stays the fallback)
    await fresh(() => [{ ...K0, k:'pee', t: T - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: T - 20*MIN }]);
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: null }; render(); await wait(2);
    { const h = cycleHTML('kishmish');
      ok('camera working: "המצלמה תציע לאשר", no "לוחצים ״יצאה מהכלוב״"', h.includes('המצלמה תציע לאשר') && !h.includes('לוחצים <b>״יצאה מהכלוב״</b>'));
      ok('…the manual exit button is still in the crate card (folded)', !!$q('#sec-crate [data-act=dur][data-k=crate]')); }
    CAMS.status = { checked_at: Date.now() - 40*MIN, crate_now: null }; render(); await wait(2);
    ok('camera not updating: the manual instruction is back', cycleHTML('kishmish').includes('לוחצים <b>״יצאה מהכלוב״</b>'));
    CAMS.status = null;

    // 3. a drink ends a running sleep at the drink's time — marked, imported from her labels, or a confirmed suggestion
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }, { ...K0, k:'sleep', t: T - 36*MIN }]);
    tapPoint('kishmish', 'water', T - 6*MIN); await wait(3);
    ok('a marked sleep since -36 min, a drink logged for -6 min (late): the sleep ends at the drink', state.log.find(e => e.k === 'sleep').end === T - 6*MIN && !V.kishmish.sleep.start);
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await send([E('ce_s', 'sleep_onset', T - 36*MIN, { lo: T - 40*MIN, hi: T - 36*MIN })]); camjApply(); await wait(3);
    ok('her "asleep" label with no wake mark yet: imported, running (the production 18:58 case)', !!state.log.find(e => e.id === 'cams:ce_s') && state.log.find(e => e.id === 'cams:ce_s').end == null);
    tapPoint('kishmish', 'water', T - 6*MIN); await wait(3); camjApply(); await wait(3);
    ok('…a drink at -6: the imported sleep ends there, and the camera does not reopen it', state.log.find(e => e.id === 'cams:ce_s').end === T - 6*MIN && !V.kishmish.sleep.start);
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await sugs({ schema: 'cam-suggestions/1', enabled: true, disabled: false, suggestions: [{ id: 'sug_q', kind: 'sleep_suggestion', ts: T - 36*MIN, lo: T - 37*MIN, hi: T - 36*MIN, confidence: .9, ir: false, status: 'active', image_id: 's:x/1.jpg', image_ts: T - 36*MIN }], published_at: Date.now() });
    ok('an open sleep suggestion: estimated sleep now', V.kishmish.sleep.start === T - 36*MIN && V.kishmish.sleep.assumed);
    tapPoint('kishmish', 'water', T - 6*MIN); await wait(3);
    ok('…a drink at -6 cuts the estimate there (nothing written for the sleep)', !V.kishmish.sleep.start && V.kishmish.spans.some(x => x.cam && x.end === T - 6*MIN) && !state.log.some(e => e.k === 'sleep'));
    $q('#sec-rest [data-camss=ok]') && $q('#sec-rest [data-camss=ok]').click(); await wait(3);
    ok('…and a drink inside it means the suggestion is not offered as one long sleep', !state.log.some(e => e.id === 'cam:sug:sug_q'));
    // her verified exit ends the sleep she was in (no session: the door was open)
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }]);
    DOORS = [{ from: T - 90*MIN, to: T, value: 'open' }];
    await send([E('ce_v', 'crate_entry', T - 60*MIN), E('ce_vs', 'sleep_onset', T - 40*MIN, { lo: T - 45*MIN, hi: T - 40*MIN })]); camjApply(); await wait(3);
    ok('in the crate by her label (a visit), asleep by her label: no crate entry, sleep running', !crates().length && state.log.find(e => e.id === 'cams:ce_vs').end == null);
    await send([...CAMJ.ev0, E('ce_vx', 'crate_exit', T - 10*MIN)]); camjApply(); await wait(3);
    ok('her label says she walked out at -10: the sleep ends there', state.log.find(e => e.id === 'cams:ce_vs').end === T - 10*MIN && !V.kishmish.sleep.start);
    // an approved live exit from a session ends the sleep with it
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }, { ...K0, k:'crate', t: T - 60*MIN }, { ...K0, k:'sleep', t: T - 40*MIN }]);
    await send([E('ce_lx2', 'crate_exit', T - 8*MIN, { source: 'live_model' })]);
    $q('#sec-crate .camjt [data-camj=end]').click(); await wait(3);
    ok('an approved live exit: the session and the sleep end at the camera time', crates()[0].end === T - 8*MIN && state.log.find(e => e.k === 'sleep').end === T - 8*MIN);

    // 4. separate states: occupancy (camera) / session (journal) / sleep — a voluntary return and her own sleep start no cycle
    await fresh(() => [{ ...K0, k:'pee', t: T - 50*MIN, w:'gravel' }, { ...K0, k:'food', t: T - 40*MIN }]);
    { const r0 = JSON.stringify(routine('kishmish')), n0 = rounds();
      DOORS = [{ from: T - 30*MIN, to: T, value: 'open' }];
      await send([E('ce_b', 'crate_entry', T - 20*MIN), E('ce_bs', 'sleep_onset', T - 12*MIN, { lo: T - 15*MIN, hi: T - 12*MIN })]); camjApply(); await wait(3);
      ok('she went back in on her own (door open) and fell asleep: in the crate by the camera, asleep in the journal, NO crate entry', !crates().length && !!camjOccNow('kishmish') && !!V.kishmish.sleep.start && !(V.kishmish.crate || {}).start);
      ok('…no new cycle, the routine step unchanged', rounds() === n0 && JSON.stringify({ ...routine('kishmish'), since: 0 }) === JSON.stringify({ ...JSON.parse(r0), since: 0 })); }

    // 5. the release's flags: what is off never shows, even when its events arrive
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }]);
    ok('flags: sleep / eating suggestions on; drinking, live sleep estimates, food / water events off; IR context on', CAM_FEATURES.sleepSuggest && CAM_FEATURES.eatSuggest && !CAM_FEATURES.drinkSuggest && !CAM_FEATURES.liveSleepEstimate && !CAM_FEATURES.foodWaterEvents && CAM_FEATURES.irContext);
    await send([E('ce_f', 'food_seen', T - 20*MIN, { source: 'live_model' }), E('ce_w', 'water_seen', T - 15*MIN, { source: 'live_model' }), E('ce_fl', 'food_seen', T - 50*MIN), E('ce_wl', 'water_seen', T - 55*MIN),
      E('ce_p', 'sleep_onset', T - 100*MIN, { source: 'live_model', pair_id: 'ce_pw' }), E('ce_pw', 'sleep_wake', T - 70*MIN, { source: 'live_model' })]);
    await sugs({ schema: 'cam-suggestions/1', enabled: true, disabled: false, suggestions: [{ id: 'sug_dr', kind: 'drinking_suggestion', ts: T - 10*MIN, lo: T - 11*MIN, hi: T - 10*MIN, ir: false, status: 'active' }], published_at: Date.now() });
    camjApply(); await wait(3);
    ok('OFF flags: no food / water offer or import, no drinking UI, no live sleep estimate', !$q('.camjf') && !state.log.some(e => /^cam:/.test(e.id || '')) && !V.kishmish.spans.some(x => x.cam) && !$q('.card.water .camjf'));
    await sugs({ schema: 'cam-suggestions/1', enabled: true, disabled: false, suggestions: [{ id: 'sug_e', kind: 'eating_suggestion', ts: T - 10*MIN, lo: T - 11*MIN, hi: T - 9*MIN, ir: false, status: 'active' }], published_at: Date.now() });
    ok('ON flag: an eating suggestion still shows (only with a tap)', !!$q('#sec-food .camjf[data-feed=food]') && !state.log.some(e => e.k === 'food'));
    { const keep = CAM_FEATURES; CAM_FEATURES = { ...keep, sleepSuggest: false, eatSuggest: false, irContext: false };
      await sugs({ schema: 'cam-suggestions/1', enabled: true, suggestions: [{ id: 'sug_e2', kind: 'eating_suggestion', ts: T - 10*MIN, lo: T - 11*MIN, hi: T - 9*MIN, ir: false, status: 'active' }, { id: 'sug_s2', kind: 'sleep_suggestion', ts: T - 40*MIN, lo: T - 41*MIN, hi: T - 40*MIN, end: T - 20*MIN, ir: false, status: 'active' }], published_at: Date.now() });
      await send([E('ce_ir', 'crate_entry', T - 5*MIN, { source: 'live_model', ir: true })]);
      ok('all suggestion flags off and IR context off: nothing at all', !$q('.camjf') && !$q('[data-camss]') && !V.kishmish.spans.some(x => x.cam) && !camjPlan(state.log, Date.now()).rv.context.length && !$q('#sec-crate .camjt'));
      CAM_FEATURES = keep; }
    ok('the only camera write path is camera/feedback', merged.every(([n]) => n === 'feedback'));
    fb = null; CAMJ.ready = CAMJ.sready = false; CAMJ.ev = []; CAMJ.ev0 = []; CAMJ.sev = []; setState(state);
    done();
  } catch(e){ crashed(e); }
})();
