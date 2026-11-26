// Next camera version (CAMERA-API §12; synthetic events only, fake `fb.camDoc` serves camera/events).
// Checks: with today's event kinds nothing new shows; food / water detections are offered for ONE tap inside the existing
// food card / water row, approval writes a normal entry `cam:<event_id>` (once, also across two phones), rejection and
// deletion go to feedback, a manual entry nearby (incl. late) is the same event, IR / uncertain are context only;
// an event's image is shown only if captured inside its window; the live model's probable sleep is ESTIMATED sleep
// (never written, never over marked sleep or awake entries, never teaching), "לא נרדמה" only sends feedback; a wake
// known as a window is carried through the forecasts as a range.
(async function(){
  try {
    reset(); localStorage.removeItem('pets-timers-v1-cam'); localStorage.removeItem('pets-timers-v1-camb');
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
    let T = Date.now(), COV = [{ from: T - 30*HOUR, to: T }], DOC = null;
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .8, status: 'active', created_at: T, model_version: 't', ...o });
    const send = async evs => { DOC = { schema: 'cam-events/1', events: evs, coverage: COV, door_spans: [], published_at: T, updated_at: T }; if(subs.events) subs.events(DOC, false); await wait(3); };
    const fresh = async (list) => { reset(); seed(list); serverSeen = true; pet = 'kishmish'; CAMJ.fbLocal = {}; CAMJ.imgs = {}; T = Date.now(); COV = [{ from: T - 30*HOUR, to: T }]; render(); await wait(2); };
    const byId = id => state.log.find(e => e.id === id);

    // 0. gating: today's kinds only -> nothing new on the screen, no estimated camera sleep
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }, { ...K0, k:'food', t: T - 3*HOUR }]);
    await send([E('ce_c1', 'crate_entry', T - 50*MIN, { image_id: 'f1', image_ts: T - 50*MIN, ir: false, uncertain: false })]); render(); await wait(2);
    ok('only crate events (as published today): no food / water offers, no camera sleep', !$q('.camjf') && !V.kishmish.spans.some(x => x.cam) && !camjPlan(state.log, Date.now()).rv.feed.food.length);

    // 1. food / water: offered in their own cards, nothing written without a tap
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    const L0 = () => JSON.stringify(state.log);
    { const before = L0();
      await send([E('ce_f1', 'food_seen', T - 20*MIN), E('ce_w1', 'water_seen', T - 15*MIN), E('ce_f0', 'food_seen', T - 40*MIN)]); render(); await wait(2);
      ok('a food detection: ONE offer inside the food card (the newest) + "עוד 1"', $n('#sec-food .card.item .camjf[data-feed=food]') === 1 && $q('#sec-food .card.item .camjf').textContent.includes(clock(T - 20*MIN)) && $q('#sec-food').textContent.includes('עוד 1 זיהויים לאישור'));
      ok('a water detection: inside the water row', !!$q('#sec-food .card.water .camjf[data-feed=water]'));
      ok('…and nothing was written', L0() === before && camjDoc() === 'events'); }
    $q('#sec-food .camjf[data-feed=food] [data-camf=no]').click(); await wait(3);
    ok('"לא נכון": no entry, a "rejected" decision to camera/feedback', !state.log.some(e => e.k === 'food') && camjDec('ce_f1').d === 'rejected' && merged.some(([n, d]) => n === 'feedback' && d.decisions.ce_f1 && d.decisions.ce_f1.d === 'rejected'));
    ok('…the older one is offered next', $q('#sec-food .camjf[data-feed=food]').textContent.includes(clock(T - 40*MIN)));
    $q('#sec-food .camjf[data-feed=water] [data-camf=ok]').click(); await wait(3);
    { const w = byId('cam:ce_w1');
      ok('"אישור" on water: a normal water entry at the camera time, camera provenance, approved by her', !!w && w.k === 'water' && w.t === T - 15*MIN && w.cam.src === 'live_model' && w.cam.in === 'ce_w1' && w.cam.ok === 'shai' && camjDec('ce_w1').d === 'approved');
      ok('…the offer is gone; the list row says it came from the camera', !$q('.camjf[data-feed=water]') && camjNote(w).includes('מצלמה'));
      commit('', () => camjDo({ do: 'feed', ev: CAMJ.ev.find(e => e.event_id === 'ce_w1') }, me), { quiet: true, cam: true });
      ok('approving again: still one entry (deterministic id)', state.log.filter(e => e.id === 'cam:ce_w1').length === 1);
      const s1 = clone(state), s2 = clone(state); s2.log = s2.log.filter(e => e.id !== 'cam:ce_w1');
      ok('two phones approving the same detection: one entry after the merge', patch(diff(s2, s1), s1).log.filter(e => e.id === 'cam:ce_w1').length === 1);
      commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:ce_w1'); }, { quiet: true }); render(); await wait(2);
      ok('deleted by a caregiver: "deleted" to feedback, never offered again', !byId('cam:ce_w1') && camjDec('ce_w1').d === 'deleted' && !$q('.camjf[data-feed=water]')); }

    // 2. duplicates: a manual entry nearby (also logged late) is the same event; outside the match window it is not
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }, { ...K0, k:'food', t: T - 30*MIN + 20*MIN }, { ...K0, k:'water', t: T - 90*MIN }]);
    await send([E('ce_f2', 'food_seen', T - 30*MIN), E('ce_w2', 'water_seen', T - 70*MIN)]); render(); await wait(2);
    { const rv = camjPlan(state.log, Date.now()).rv;
      ok('food logged by hand 20 min after the camera saw it: matched, not offered, nothing changed', !rv.feed.food.length && rv.fmatched.some(m => m.ev.event_id === 'ce_f2') && !$q('.camjf[data-feed=food]'));
      ok('water logged by hand 20 min BEFORE the detection: a different drink, offered', rv.feed.water.some(e => e.event_id === 'ce_w2')); }

    // 3. a drink approved while she is in the crate: exactly what logging it at that time does (awake and out)
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }, { ...K0, k:'crate', t: T - 60*MIN }]);
    await send([E('ce_w3', 'water_seen', T - 10*MIN)]); render(); await wait(2);
    $q('.camjf[data-feed=water] [data-camf=ok]').click(); await wait(3);
    ok('approved drink inside a crate stay: the stay ends at the drink, as a hand-logged one would', state.log.find(e => e.k === 'crate').end === T - 10*MIN && !!byId('cam:ce_w3'));

    // 4. IR / uncertain / old: context only
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await send([E('ce_i1', 'food_seen', T - 10*MIN, { ir: true, uncertain: true }), E('ce_i2', 'water_seen', T - 12*MIN, { uncertain: true }), E('ce_i3', 'crate_entry', T - 8*MIN, { ir: true }), E('ce_old', 'food_seen', T - 7*HOUR)]); render(); await wait(2);
    { const rv = camjPlan(state.log, Date.now()).rv;
      ok('IR / uncertain detections: never offered (food, water, crate), only listed as context', !$q('.camjf') && !$q('#sec-crate .camjt') && !rv.live.length && !rv.pending.length && ['ce_i1', 'ce_i2', 'ce_i3'].every(id => rv.context.some(e => e.event_id === id)));
      ok('a detection older than 6 h: not offered', !rv.feed.food.some(e => e.event_id === 'ce_old'));
      camjReview(); await wait(2);
      ok('the review shows them under "להקשר בלבד", with no approve button', sh.textContent.includes('להקשר בלבד') && sh.textContent.includes('תאורת לילה') && !sh.querySelector('[data-camf]')); close(); }

    // 5. images: only a frame captured inside the event's window, only on a device with the private service
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await send([E('ce_g1', 'food_seen', T - 20*MIN, { image_id: 'img_old', image_ts: T - 3*HOUR }), E('ce_g2', 'water_seen', T - 12*MIN, { image_id: 'img_ok', image_ts: T - 12*MIN + 10000 })]); render(); await wait(2);
    ok('camjEvImg: older frame refused, frame inside the window accepted', camjEvImg(CAMJ.ev.find(e => e.event_id === 'ce_g1')).why === 'older' && camjEvImg(CAMJ.ev.find(e => e.event_id === 'ce_g2')).ok);
    ok('an older image is never shown as evidence: the card says so instead', $q('.camjf[data-feed=food]').textContent.includes('התמונה מוקדמת מהזיהוי') && !$q('.camjf[data-feed=food] img'));
    ok('no private service on this device: a quiet line, no image', $q('.camjf[data-feed=water]').textContent.includes('רק במכשיר עם גישה למצלמה') && !$q('.camjf img'));
    { const keep = camImage, asked = []; camImage = async path => { asked.push(path); return { ok: true, url: 'blob:fake-' + path.split('=')[1] }; };
      localStorage.setItem(CAM_KEY, 'http://127.0.0.1:8787'); CAM.st = 'ok'; camjLast = ''; render(); await wait(4); render(); await wait(2);
      const im = $q('.camjf[data-feed=water] img.camj-img');
      ok('with the private service: the event\'s own frame is shown, the older one is never fetched', !!im && im.getAttribute('src') === 'blob:fake-img_ok' && asked.length === 1 && asked[0].includes('img_ok') && !$q('.camjf[data-feed=food] img'));
      camImage = keep; localStorage.removeItem(CAM_KEY); CAM.st = 'off'; }

    // 6. probable sleep (live model): estimated, never written, never over what is known
    await fresh([{ ...K0, k:'pee', t: T - 3*HOUR }, { ...K0, k:'food', t: T - 3*HOUR - 10*MIN }]);
    { const before = L0(), samp = JSON.stringify(sleepSamples('kishmish', state.log, Date.now()));
      await send([E('ce_s1', 'sleep_onset', T - 100*MIN, { lo: T - 105*MIN, hi: T - 100*MIN, pair_id: 'ce_s1w' }), E('ce_s1w', 'sleep_wake', T - 35*MIN, { lo: T - 35*MIN, hi: T - 20*MIN })]); render(); await wait(2);
      const cp = V.kishmish.spans.filter(x => x.cam);
      ok('a daylight live sleep: one ESTIMATED piece (assumed, cam), nothing written', cp.length === 1 && cp[0].t === T - 100*MIN && cp[0].end === T - 35*MIN && cp[0].assumed && L0() === before);
      const sc = scores('kishmish');
      ok('…the ring counts it as "משוער", not "נצפה"', sc.marked === 0 && Math.abs(sc.est - 65*MIN) < 2000);
      ok('…it never teaches: no episodes / nap model / sleep samples from it', episodes('kishmish', T - 5*HOUR, Date.now()).length === 0 && learnEpisodes('kishmish', T - 5*HOUR, Date.now()).length === 0 && napMedian('kishmish') === 0 && JSON.stringify(sleepSamples('kishmish', state.log, Date.now())) === samp);
      ok('…in the list as "משוער · מצלמה", its row opens its own sheet', !!$q('.r.guess[data-camsl="ce_s1"]') && $q('.r.guess[data-camsl="ce_s1"]').textContent.includes('מצלמה'));
      // 7. the waking is a window [35, 20 min ago]: carried through as a range
      const w = wakeWin('kishmish');
      ok('wake window from the camera: {lo, hi}; timing logic keeps the earliest waking', !!w && w.lo === T - 35*MIN && w.hi === T - 20*MIN && awakeSince('kishmish') === w.lo);
      const sw = sleepWindow('kishmish');
      ok('sleep window bar: earliest waking + 45 min … latest waking + 60 min', sw.last === w.lo && sw.from === w.lo + AWAKE.warn && sw.to === w.hi + AWAKE.max);
      const nw = napWake('kishmish'), tn = tryNow('kishmish');
      ok('"ישר לחצץ" after a nap still holds 35 min after the earliest waking (20 after the latest), with the range', !!nw && nw.t === w.lo && nw.hi === w.hi && !!tn && tn.hi === w.hi && tryNowHTML('kishmish').includes('–'));
      const pe = pottyExpect('kishmish').pee;
      ok('pee after waking: a range (earliest waking + 15 … latest waking + 15)', !!pe.afterWake && pe.afterWake.range && pe.afterWake.from === w.lo && pe.afterWake.to === w.hi + 15*MIN && $q('#sec-potty').textContent.includes('פיפי צפוי עד'));
      const pd = pottyDue('kishmish');
      ok('take-out reminder after the sleep carries the latest waking', !pd || pd.t !== w.lo || pd.hi === w.hi);
      ok('the sleep tile shows the awake time as a range', $q('#sec-rest .card.item').textContent.includes('התעוררה בין')); }
    // a marked sleep and an awake entry inside it: the estimate steps aside
    commit('', () => { state.log.push({ p:'kishmish', k:'sleep', t: T - 80*MIN, end: T - 70*MIN }); state.log.push({ p:'kishmish', k:'play', y:'rope', t: T - 55*MIN }); }, { quiet: true });
    { const cp = V.kishmish.spans.filter(x => x.cam), mk = V.kishmish.spans.filter(x => !x.cam);
      const over = cp.some(c => mk.some(m => c.t < m.end && c.end > m.t));
      ok('never over a marked sleep, split at what shows her awake (play), pieces under 5 min dropped', !over && cp.length === 3 && cp[0].t === T - 100*MIN && cp[0].end === T - 80*MIN && cp[1].t === T - 70*MIN && cp[1].end === T - 55*MIN && cp[2].t === T - 55*MIN && cp[2].end === T - 35*MIN);
      commit('', () => state.log.push({ p:'kishmish', k:'pee', t: T - 67*MIN }), { quiet: true });
      ok('…a piece cut to under 5 min by an entry is not shown', !V.kishmish.spans.some(x => x.cam && x.t >= T - 70*MIN && x.end <= T - 67*MIN)); }
    // IR / uncertain / rejected / no coverage: nothing
    await fresh([{ ...K0, k:'pee', t: T - 3*HOUR }]);
    await send([E('ce_n1', 'sleep_onset', T - 100*MIN, { ir: true, pair_id: 'ce_n1w' }), E('ce_n1w', 'sleep_wake', T - 60*MIN, { ir: true }), E('ce_n2', 'sleep_onset', T - 50*MIN, { uncertain: true, pair_id: 'ce_n2w' }), E('ce_n2w', 'sleep_wake', T - 30*MIN)]); render(); await wait(2);
    ok('IR or uncertain sleep: no estimate at all, context in the review', !V.kishmish.spans.length && camjPlan(state.log, Date.now()).rv.context.some(e => e.event_id === 'ce_n1'));
    // running: an open onset while the camera is watching
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    { const before = L0();
      await send([E('ce_r1', 'sleep_onset', T - 20*MIN)]); render(); await wait(2);
      ok('an open onset while the camera covers now: "ישנה כנראה", an estimate from the camera', V.kishmish.sleep.start === T - 20*MIN && V.kishmish.sleep.assumed && V.kishmish.sleep.cam === 'ce_r1' && nowState('kishmish').w === 'ישנה כנראה' && $q('#sec-rest').textContent.includes('הערכת מצלמה'));
      notAsleep('kishmish', true); await wait(3);
      ok('"לא נרדמה" on it: feedback only, the journal untouched, the estimate gone', !V.kishmish.sleep.start && camjDec('ce_r1').d === 'rejected' && L0() === before && merged.some(([n, d]) => n === 'feedback' && d.decisions.ce_r1)); }
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    COV = [{ from: T - 30*HOUR, to: T - 10*MIN }];
    await send([E('ce_r2', 'sleep_onset', T - 40*MIN)]); render(); await wait(2);
    ok('an open onset when the camera stopped watching 10 min ago: no running estimate', !V.kishmish.sleep.start && !V.kishmish.spans.length);
    // owner-label sleep is still imported as before, and never mixed with the live kind
    await fresh([{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await send([E('ce_o1', 'sleep_onset', T - 60*MIN, { source: 'owner_label', pair_id: 'ce_o1w' }), E('ce_o1w', 'sleep_wake', T - 30*MIN, { source: 'owner_label' }), E('ce_l1', 'sleep_onset', T - 25*MIN, { pair_id: 'ce_l1w' }), E('ce_l1w', 'sleep_wake', T - 10*MIN)]);
    camjApply(); await wait(3);
    ok('her labeled sleep still becomes a marked entry; the live one stays an estimate beside it', !!byId('cams:ce_o1') && !state.log.some(e => e.id && e.id.includes('ce_l1')) && V.kishmish.spans.some(x => x.cam === 'ce_l1'));
    ok('the only camera write path is camera/feedback', merged.every(([n]) => n === 'feedback'));
    CAMS.doc = null; CAMS.status = null; fb = null; CAMJ.ready = false; CAMJ.ev = []; setState(state);
    done();
  } catch(e){ crashed(e); }
})();
