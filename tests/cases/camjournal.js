// Camera observations -> the crate (CAMERA-API §11c, owner 26.11 evening). Fake `fb.camDoc` serves camera/events.
// Checks: a session only when inside AND door closed (starting at the door closing); open / unknown door = a visit,
// never stored, no routine or sleep effect; her labels imported without approval, once, also across two phones;
// a late manual entry takes the camera's time (even if hand-corrected before); a later hand correction is protected;
// wide windows are not applied but offered for resolution; live events only where they matter, one at a time, and
// rejections go to feedback; retractions undo; exits end an open session; manual buttons fold only while the camera
// works; the image card sits inside the crate card; stale image never reads as "now"; nothing before the server copy.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    reset(); localStorage.removeItem('pets-timers-v1-cam'); localStorage.removeItem('pets-timers-v1-camb');
    const now = Date.now(), K0 = { p:'kishmish' };
    let DOC = null; const subs = {}, merged = [];
    fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; if(DOC && n === 'events') setTimeout(() => on(DOC, false), 0); return () => { delete subs[n]; }; },
      camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'owner_label', confidence: null, status: 'active', created_at: now, model_version: 't', ...o });
    let COV = [{ from: now - 30*HOUR, to: now - 26*HOUR }, { from: now - 20*HOUR, to: now }], DOORS = [];
    const send = async evs => { DOC = { schema: 'cam-events/1', events: evs, coverage: COV, door_spans: DOORS, published_at: now, updated_at: now }; if(subs.events) subs.events(DOC, false); await wait(3); };
    const stays = () => state.log.filter(e => e.p === 'kishmish' && e.k === 'crate');
    const byId = id => state.log.find(e => e.id === id);

    ok('data version stays 2 (no new kind)', SCHEMA === 2 && !ITEMS.camx);
    seed([{ ...K0, k:'food', t: now - 30*HOUR }]); serverSeen = false; pet = 'kishmish'; render(); await pause(20);

    // 1. door closed while inside = a session; it starts when the door closed
    DOORS = [{ from: now - 19*HOUR - MIN, to: now - 19*HOUR + 5*MIN, value: 'open' }, { from: now - 19*HOUR + 5*MIN, to: now - 18*HOUR + 30*MIN, value: 'closed' }];   // she went in with the door open, then it was closed
    await send([E('ce_a', 'crate_entry', now - 19*HOUR, { pair_id: 'ce_b' }), E('ce_b', 'crate_exit', now - 18*HOUR)]);
    ok('before the server copy: nothing applied', stays().length === 0);
    serverSeen = true; camjApply(); await wait(2);
    const A = stays()[0];
    ok('inside + door closed: one session, from the door closing to her exit; labels never re-approved', stays().length === 1 && A.t === now - 19*HOUR + 5*MIN && A.end === now - 18*HOUR && A.cam.src === 'owner_label' && A.cam.in === 'ce_a' && A.id === 'cam:ce_a');
    camjApply(); camjApply(); await wait(2);
    ok('idempotent', stays().length === 1);
    { const keep = DOORS; CAMJ.doors = [{ from: now - 19*HOUR + 5*MIN, to: now - 18*HOUR + 30*MIN, value: 'closed' }];   // door not marked at her entry
      ok('door unknown at entry (not marked): the session starts at her entry, not at the first closed mark', camjSessions(Date.now()).find(c => c.id === 'cam:ce_a').t === now - 19*HOUR);
      CAMJ.doors = [{ from: now - 19*HOUR, to: now - 18*HOUR - 20*MIN, value: 'closed' }, { from: now - 18*HOUR - 20*MIN, to: now - 18*HOUR - 20*MIN, value: 'open' }, { from: now - 18*HOUR - 15*MIN, to: now - 18*HOUR - 5*MIN, value: 'closed' }];
      ok('a brief open mark mid-stay does not split it: one session', camjSessions(Date.now()).filter(c => c.s.e.event_id === 'ce_a').length === 1);
      CAMJ.doors = [{ from: now - 19*HOUR, to: now - 18*HOUR - 10*MIN, value: 'closed' }, { from: now - 18*HOUR - 10*MIN, to: now - 17*HOUR, value: 'open' }];
      ok('door marked open while still inside after its last closed mark: the session ends at the opening', camjSessions(Date.now()).find(c => c.id === 'cam:ce_a').end === now - 18*HOUR - 10*MIN);
      DOORS = keep; await send(DOC.events); }
    { const s1 = clone(state), s2 = clone(state); s2.log = s2.log.filter(e => e.id !== A.id);
      ok('two phones importing the same label: one entry after the merge', patch(diff(s2, s1), s1).log.filter(e => e.id === A.id).length === 1); }

    // 2. open door / unknown door: a visit — shown, never stored, no effect on routine or sleep
    { const before = JSON.stringify([routine('kishmish'), V.kishmish.spans.length, stays().length]);
      DOORS = [...DOORS, { from: now - 17*HOUR, to: now - 15*HOUR, value: 'open' }];
      await send([...DOC.events, E('ce_v1', 'crate_entry', now - 16*HOUR - 30*MIN, { pair_id: 'ce_v2' }), E('ce_v2', 'crate_exit', now - 15*HOUR - 10*MIN), E('ce_u1', 'crate_entry', now - 14*HOUR, { pair_id: 'ce_u2' }), E('ce_u2', 'crate_exit', now - 13*HOUR)]);
      camjApply(); await wait(2);
      const { rv } = camjPlan(state.log, Date.now());
      ok('open-door stay (80 min) and unknown-door stay (60 min): visits, nothing stored, routine / sleep unchanged — no duration rule', JSON.stringify([routine('kishmish'), V.kishmish.spans.length, stays().length]) === before && rv.visits.some(v => v.door === 'open') && rv.visits.some(v => v.door === 'unknown')); }

    // 3. a late manual entry: the camera's time wins (even after a hand correction); old times kept
    commit('', () => state.log.push(newStay('kishmish', 'crate', now - 12*HOUR + 20*MIN, now - 11*HOUR + 15*MIN)), { quiet: true });
    { const M = stays().find(e => !e.id.startsWith('cam:'));
      commit('', () => { const x = byId(M.id); x.t = now - 12*HOUR + 22*MIN; }, { quiet: true });   // she corrected it by hand once
      DOORS = [...DOORS, { from: now - 12*HOUR - 10*MIN, to: now - 11*HOUR, value: 'closed' }];
      await send([...DOC.events, E('ce_m', 'crate_entry', now - 12*HOUR, { pair_id: 'ce_mx' }), E('ce_mx', 'crate_exit', now - 11*HOUR + 5*MIN)]); camjApply(); await wait(2);
      const x = byId(M.id);
      ok('logged 22 min late: same session, no duplicate, takes the camera times, old ones kept', stays().length === 2 && x.t === now - 12*HOUR && x.end === now - 11*HOUR + 5*MIN && x.cam.was.t === now - 12*HOUR + 22*MIN && !x.cam.h);
      ok('its details say so', camjNote(x, true).includes('תוקן לפי המצלמה') && camjNote(x, true).includes('נרשם ידנית'));
      commit('', () => { byId(M.id).end = now - 11*HOUR + 8*MIN; }, { quiet: true });
      // (and an approved live session is never removed just because no label backs it)
      camjApply(); await wait(2);
      ok('a NEW hand correction after the camera: protected from later camera changes', byId(M.id).end === now - 11*HOUR + 8*MIN && byId(M.id).cam.h === 1); }

    // 3b. real-data cases (26.11): a session the journal contradicts; a manual time inside the camera's window
    { DOORS = [...DOORS, { from: now - 8*HOUR, to: now - 7*HOUR, value: 'closed' }];
      commit('', () => { state.log.push({ p:'kishmish', k:'gravel', t: now - 8*HOUR - 2*MIN, end: now - 8*HOUR + MIN }); state.log.push({ p:'kishmish', k:'none', t: now - 8*HOUR + MIN }); }, { quiet: true });
      await send([...DOC.events, E('ce_g', 'crate_entry', now - 8*HOUR - MIN, { pair_id: 'ce_gx' }), E('ce_gx', 'crate_exit', now - 7*HOUR - 30*MIN)]); camjApply(); await wait(2);
      const r = camjPlan(state.log, Date.now()).rv.resolve.find(r => r.c && r.c.id === 'cam:ce_g');
      ok('"לא עשתה" logged inside the camera stay: no session, no cycle, no sleep — to resolve, with the reason', !byId('cam:ce_g') && r && r.why === 'journal' && ['none', 'gravel'].includes(r.clash.k)); }
    { commit('', () => state.log.push(newStay('kishmish', 'crate', now - 6*HOUR, now - 5*HOUR + 8*MIN)), { quiet: true });
      const M2 = stays().find(e => e.t === now - 6*HOUR);
      DOORS = [...DOORS, { from: now - 6*HOUR - MIN, to: now - 5*HOUR + 9*MIN, value: 'closed' }];
      await send([...DOC.events, E('ce_p', 'crate_entry', now - 6*HOUR + MIN, { pair_id: 'ce_px' }), E('ce_px', 'crate_exit', now - 5*HOUR + 7*MIN, { lo: now - 5*HOUR, hi: now - 5*HOUR + 15*MIN, wide: false })]); camjApply(); await wait(2);
      ok('a manual exit inside the camera\'s window (like 08:38 in 08:30–08:45): kept, not replaced or questioned', byId(M2.id).end === now - 5*HOUR + 8*MIN && byId(M2.id).t === now - 6*HOUR + MIN);
      // the start outside the window takes the camera's; the end inside it stays hers
    }
    // 4. wide windows: not applied as exact; resolvable
    DOORS = [...DOORS, { from: now - 10*HOUR - 30*MIN, to: now - 9*HOUR, value: 'closed' }];
    await send([...DOC.events, E('ce_w', 'crate_entry', now - 10*HOUR, { lo: now - 10*HOUR - 10*MIN, hi: now - 10*HOUR + 10*MIN, wide: true, pair_id: 'ce_wx' }), E('ce_wx', 'crate_exit', now - 9*HOUR - 20*MIN)]); camjApply(); await wait(2);
    { const { rv } = camjPlan(state.log, Date.now());
      ok('a 20-min window: no session written, offered for resolution with the reason', !byId('cam:ce_w') && rv.resolve.some(r => r.c && r.c.id === 'cam:ce_w' && r.why === 'wide')); }
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: null }; render(); await wait(2);
    camjReview(); await wait(2);   // (opened from the camera sheet's "מה המצלמה ראתה")
    ok('the review view: imported, matched, to resolve, visits, and the weekly saving', bg.classList.contains('show') && ['אומתו מול רישום ידני', 'לבירור', 'ביקורים', 'השבוע:'].every(s => sh.textContent.includes(s)));
    { const i = sh.querySelector('.cj-t'); i.value = clock(now - 10*HOUR + 5*MIN); sh.querySelector('[data-cjr=pick]').click(); await wait(2);
      const w = byId('cam:ce_w');
      ok('resolved by her: a session at her time, still marked uncertain', !!w && Math.abs(w.t - (now - 10*HOUR + 5*MIN)) < 60000 && w.cam.unc === 1 && camjNote(w, true).includes('לא נכנס לחישובי זמנים'));
      ok('an uncertain session never teaches the sleep-timing model', !sleepSamples('kishmish', state.log.concat([{ p:'kishmish', k:'sleep', t: now - 10*HOUR + 20*MIN, end: now - 9*HOUR - 30*MIN, id:'zz' }]), Date.now()).some(s => s.t === now - 10*HOUR + 20*MIN)); }

    // 5. retraction: the camera-made session goes
    await send(DOC.events.map(e => e.event_id === 'ce_a' ? { ...e, status: 'retracted' } : e)); camjApply(); await wait(2);
    ok('retracted label: the camera-made session goes', !byId(A.id));

    // 6. live: nothing written without a tap; only the latest; reject -> feedback
    const nOpen = () => stays().filter(e => e.end == null).length;
    DOORS = [...DOORS, { from: Date.now() - 100*MIN, to: Date.now() + HOUR, value: 'closed' }];   // live approvals below: door marked closed (an open / unknown door is covered in camfix.js)
    await send([...DOC.events, E('ce_L0', 'crate_entry', Date.now() - 90*MIN, { source:'live_model' }), E('ce_L1', 'crate_entry', Date.now() - 20*MIN, { source:'live_model' })]); camjApply(); render(); await wait(2);
    ok('live entries: nothing written, ONE offer in the crate card (the latest), the rest counted', nOpen() === 0 && $n('.card .camjt') === 1 && $q('.card .camjt').textContent.includes(clock(Date.now() - 20*MIN)) && (camjPlan(state.log, Date.now()).rv.eps || []).length >= 2);   // release 6b: entries 70 min apart are separate episodes; the latest is asked, the other waits
    $q('.card .camjt [data-camans=no]').click(); await wait(2);
    ok('"לא נכון": no entry, kept as a negative example (feedback)', nOpen() === 0 && camjDec('ce_L1').d === 'rejected' && camjPlan(state.log, Date.now()).rv.rejected.some(e => e.event_id === 'ce_L1') && merged.some(([n, d]) => n === 'feedback' && d.decisions.ce_L1));
    render(); await wait(2);
    $q('.card .camjt [data-camans=closed]').click(); await wait(2);
    ok('the next one: "הייתה, דלת סגורה" starts a session at the camera time, approved', !!byId('cam:ce_L0') && Math.abs(byId('cam:ce_L0').t - (now - 90*MIN)) < 60000);
    await send([...DOC.events, E('ce_LX', 'crate_exit', Date.now() - 5*MIN, { source:'live_model' })]); render(); await wait(2);
    ok('a live exit while a session is open: offered in the crate card', !!$q('.card .camjt') && $q('.card .camjt').textContent.includes('יצאה מהכלוב'));
    $q('.card .camjt [data-camj=end]').click(); await wait(2);
    ok('…"אישור" ends it at the camera time', Math.abs(byId('cam:ce_L0').end - (Date.now() - 5*MIN)) < 60000 && camjDec('ce_LX').d === 'approved');

    // 6b. the advice says when the camera disagrees with the journal (and changes nothing)
    { const id = 'zz_s'; commit('', () => state.log.push({ id, p:'kishmish', k:'sleep', t: Date.now() - 4*MIN }), { quiet: true });
      await send([...DOC.events, E('ce_Q', 'crate_exit', Date.now() - 2*MIN, { source:'live_model' })]); render(); await wait(2);
      ok('asleep in the journal + a live camera exit after it: the advice line says to check, the journal unchanged', !!$q('.nowtop') && $q('.nowtop').textContent.includes('המצלמה זיהתה יציאה') && byId(id).end == null);   // release 6b: the one current-state card
      commit('', () => { state.log = state.log.filter(e => e.id !== id); }, { quiet: true }); }
    // 7. a deleted camera session never comes back
    commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:ce_L0'); }, { quiet: true }); camjApply(); await wait(2);
    ok('deleted by a caregiver: remembered (feedback), not re-added', !byId('cam:ce_L0') && camjDec('cam:ce_L0') && camjDec('cam:ce_L0').d === 'deleted');

    // 8. manual tap near a live event: one entry, camera time recommended
    await send([...DOC.events, E('ce_T', 'crate_entry', Date.now() - 12*MIN, { source:'live_model' })]); render(); await wait(2);
    tapDur('kishmish', 'crate'); await wait(2);
    ok('manual tap 12 min after the camera saw it: asks, camera time first', bg.classList.contains('show') && !!sh.querySelector('#cjCam') && sh.querySelector('#cjCam').classList.contains('sel'));
    sh.querySelector('#cjCam').click(); await wait(2);
    ok('…one session at the camera time', !!byId('cam:ce_T') && nOpen() === 1);

    // 9. the crate card: image card inside, "now" only from a fresh frame, outage brings manual buttons back
    CAMS.doc = { b64: 'AAAA', capture_ts: Date.now() - 3*HOUR, detection: { status: 'positive' }, image_type: 'image/jpeg' };
    CAMS.status = { checked_at: Date.now() - MIN, crate_now: { status: 'negative', capture_ts: Date.now() - MIN } }; render(); await wait(2);
    { const cc = $q('#sec-crate .card.item .crcam');
      ok('the camera is a row of the crate card: large image, capture time and refresh on its corner', !!cc && !!cc.querySelector('.camc') && $n('.camc') === 1 && !!cc.querySelector('.crcam-ov [data-act=camrefresh]'));
      ok('an old image says when it was seen, never "now"', cc.querySelector('.crcam-ov').textContent.includes('נראתה') && !cc.textContent.includes('עכשיו: בכלוב'));
      ok('camera working: manual crate buttons folded under "עוד"', !!$q('.card details.cr-more [data-act=dur][data-k=crate]')); }
    CAMS.status = { checked_at: Date.now() - 40*MIN, crate_now: null }; render(); await wait(2);
    ok('camera not updating: says since when, and the manual buttons are up front again', $q('#sec-crate .crcam').textContent.includes('המצלמה לא מעדכנת') && !$q('details.cr-more') && !!$q('.card [data-act=dur][data-k=crate]'));
    ok('food / pee buttons stay one tap away on their cards, never folded', !!$q('#sec-food [data-act=pt][data-k=food]') && !!$q('#sec-potty [data-act=pt][data-k=pee]') && !$q('details [data-act=pt][data-k=food]'));
    ok('coverage: outside vs inside', camjCov(now - 22*HOUR) === false && camjCov(now - HOUR) === true);

    // REGRESSION (real case 26.11, 16:56): door open since 15:02, she went in at 16:23 (her label), a FALSE live exit at
    // 16:34 (disputed by her labels), one "asleep" mark at 16:38. The app said "awake since 15:02". Replica, not real data.
    { reset(); seed([{ ...K0, k:'food', t: Date.now() - 115*MIN }, { ...K0, k:'pee', t: Date.now() - 40*MIN }]); serverSeen = true; pet = 'kishmish';
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      const T = Date.now(); DOORS = [{ from: T - 115*MIN, to: T - 6*MIN, value: 'open' }]; COV = [{ from: T - 3*HOUR, to: T - 6*MIN }]; render(); await wait(2);
      await send([E('ce_r_in', 'crate_entry', T - 33*MIN), E('ce_r_x', 'crate_exit', T - 22*MIN, { source: 'live_model', disputed_by_labels: { label_before: T - 32*MIN, label_after: T - 18*MIN } }),
        E('ce_r_on', 'sleep_onset', T - 18*MIN, { lo: T - 32*MIN, hi: T - 18*MIN, single_mark: true, n_asleep_marks: 1 })]);
      camjApply(); render(); await wait(2);
      const sl = state.log.find(e => e.id === 'cams:ce_r_on');
      ok('regression 16:56: her single "asleep" mark makes her asleep now (uncertain), no session, the door irrelevant', !!sl && sl.end == null && sl.cam.unc === 1 && nowState('kishmish').w === 'ישנה' && !state.log.some(e => e.k === 'crate'));
      ok('…not "awake since 15:02", no "to the crate" advice', !awakeSince('kishmish') && !/לכלוב$/.test(nowWhat('kishmish').t || ''));
      ok('…the false live exit is never offered, only listed as disputed', camjPlan(state.log, Date.now()).rv.live.length === 0 && camjPlan(state.log, Date.now()).rv.disputed.length === 1 && !camjConflict());
      ok('…an uncertain sleep never teaches the timing models', !sleepSamples('kishmish', state.log, Date.now()).some(s => s.t === sl.t));
      // before the sleep mark: in the crate by her label, the state is uncertain — never a confident awake timer
      await send(DOC.events.filter(e => e.event_id !== 'ce_r_on')); commit('', () => { state.log = state.log.filter(e => e.id !== 'cams:ce_r_on'); }, { quiet: true, cam: true }); render(); await wait(2);
      ok('…with only her entry label: "in the crate, asleep or awake?", and the useful tap is "נרדמה"', nowState('kishmish').w.includes('ישנה או ערה') && nowWhat('kishmish').b.includes('data-k="sleep"')); }
    // a sleep she logged by hand is never shortened by her camera marks (owner, 26.11): linked, both kept
    { reset(); const T = Date.now(); seed([{ ...K0, k:'sleep', t: T - 3*HOUR, end: T - HOUR }]); serverSeen = true; pet = 'kishmish';
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} }; render(); await wait(2);
      await send([E('ce_s1', 'sleep_onset', T - 150*MIN, { lo: T - 155*MIN, hi: T - 150*MIN, pair_id: 'ce_s1w' }), E('ce_s1w', 'sleep_wake', T - 120*MIN, { lo: T - 120*MIN, hi: T - 115*MIN }),
        E('ce_s2', 'sleep_onset', T - 100*MIN, { lo: T - 115*MIN, hi: T - 100*MIN, pair_id: 'ce_s2w' }), E('ce_s2w', 'sleep_wake', T - 70*MIN, { lo: T - 70*MIN, hi: T - 64*MIN })]);
      camjApply(); await wait(2);
      const s = state.log.filter(e => e.k === 'sleep');
      ok('a manual 3h–1h sleep with two labeled episodes and a waking inside: unchanged, linked, no extra sleeps, no review', s.length === 1 && s[0].t === T - 3*HOUR && s[0].end === T - HOUR && s[0].cam && s[0].cam.src === 'owner_label' && !s[0].cam.was && !(camjPlan(state.log, Date.now()).rv.optional || []).length);
      await send(DOC.events.map(e => e.event_id === 'ce_s2w' ? { ...e, ts: T - 45*MIN, lo: T - 45*MIN, hi: T - 40*MIN } : e)); camjApply(); await wait(2);   // her last asleep mark of that nap is 15 min after the waking she logged
      ok('her marks show her still asleep after the waking she logged: unchanged, one optional note (not "לבירור")', state.log.filter(e => e.k === 'sleep').length === 1 && state.log.find(e => e.k === 'sleep').end === T - HOUR && (camjPlan(state.log, Date.now()).rv.optional || []).some(o => o.sleepDiff && o.sleepDiff.after) && !camjPlan(state.log, Date.now()).rv.resolve.some(r => r.c && r.c.k === 'sleep')); }
    // a camera entry the journal has since taken her out of (real case 26.11, 17:19 → gravel 17:4x)
    { reset(); const T = Date.now(); seed([{ ...K0, k:'none', t: T - 45*MIN }]); serverSeen = true; pet = 'kishmish';
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      DOORS = []; await send([E('ce_k', 'crate_entry', T - 40*MIN, { source: 'live_model' })]);   // door unknown: the card asks about the door
      CAMS.status = { checked_at: Date.now() - MIN, crate_now: null }; render(); await wait(2);
      ok('pending camera entry, she is still out in the journal: the routine / advice point to the crate card; manual buttons visible', !!camjPendingEntry() && /המצלמה זיהתה כניסה לכלוב/.test(camjConflict()) && !!$q('.nowtop .camjt') && !$q('details.cr-more') && !!$q('#sec-crate [data-act=dur][data-k=crate]'));
      commit('', () => state.log.push({ p:'kishmish', k:'gravel', t: T - 10*MIN, end: T - 5*MIN }), { quiet: true }); render(); await wait(2);
      ok('…then taken to the gravel: no longer "in the crate now"; offered as a past stay', !camjPendingEntry() && $q('.nowtop .camjt').textContent.includes('הייתה בכלוב'));
      $q('.nowtop .camjt [data-camans=closed]').click(); await wait(3);   // "סגרת את הדלת?" כן
      const s = state.log.find(e => e.id === 'cam:ce_k');
      ok('…approved: a finished stay, ending when she was taken out (never an open session while she is outside)', !!s && Math.abs(s.t - (T - 40*MIN)) < 1000 && s.end === T - 10*MIN);
      ok('no statistics on the crate card; the review is reachable from the camera sheet', !$q('#sec-crate .camj-rv') && !$q('#sec-crate').textContent.includes('שהיות ב־24'));
      CAMS.status = null; }
    // "סגרת את הדלת?" only for her CURRENT verified stay with the door unknown; the answer decides session vs visit
    { reset(); const T = Date.now(); seed([{ ...K0, k:'pee', t: T - 2*HOUR }]); serverSeen = true; pet = 'kishmish';
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      DOORS = [{ from: T - 5*HOUR, to: T - 3*HOUR, value: 'open' }];   // an old mark that has stopped carrying forward
      await send([E('ce_p1', 'crate_entry', T - 4*HOUR, { pair_id: 'ce_p1x' }), E('ce_p1x', 'crate_exit', T - 4*HOUR + 5*MIN), E('ce_d1', 'crate_entry', T - 30*MIN)]);
      camjApply(); render(); await wait(2);
      ok('door unknown at her current entry, no session: one question in the crate card; the past visit is not asked about', !!camjDoorAsk('kishmish') && camjDoorAsk('kishmish').event_id === 'ce_d1' && $n('[data-camans]') === 4 && !state.log.some(e => e.k === 'crate'));
      ok('…until answered nothing starts: no session, no routine change', !state.log.some(e => e.k === 'crate') && !(V.kishmish.crate || {}).start);
      $q('[data-camans=closed]').click(); await wait(3);
      const s = state.log.find(e => e.k === 'crate');
      ok('"כן": a session from her entry (her labels), the question gone', !!s && Math.abs(s.t - (T - 30*MIN)) < 1000 && s.end == null && !camjDoorAsk('kishmish'));
      reset(); seed([{ ...K0, k:'pee', t: T - 2*HOUR }]); serverSeen = true; pet = 'kishmish'; CAMJ.fbLocal = {}; await send(DOC.events); camjApply(); render(); await wait(2);
      $q('[data-camans=open]').click(); await wait(3);
      ok('"לא": a visit — no session, never asked again', !state.log.some(e => e.k === 'crate') && !camjDoorAsk('kishmish')); CAMJ.fbLocal = {}; DOORS = []; }
    // real case 26.11 18:30: an "asleep" mark at 16:38 with no wake mark, then the gravel at 17:13 in the journal
    { reset(); const T = Date.now(); seed([{ ...K0, k:'gravel', t: T - 75*MIN, end: T - 72*MIN }]); serverSeen = true; pet = 'kishmish';
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      DOORS = []; await send([E('ce_q1', 'sleep_onset', T - 110*MIN, { lo: T - 124*MIN, hi: T - 110*MIN, single_mark: true })]); camjApply(); await wait(2);
      const q = state.log.find(e => e.id === 'cams:ce_q1');
      ok('an open sleep the journal later shows her awake in: imported (not dropped), ending at her mark, the wake window up to that entry', !!q && q.end != null && q.cam.unc === 1 && q.cam.ohi === T - 75*MIN && !camjPlan(state.log, Date.now()).rv.resolve.some(r => r.c && r.c.id === 'cams:ce_q1'));
      ok('…so "awake since" starts at that sleep, not hours earlier', awakeSince('kishmish') >= T - 110*MIN); }
    // the camera sentence appears once (advice line), not repeated in the routine's line
    { reset(); const T = Date.now(); seed([{ ...K0, k:'pee', t: T - 90*MIN }]); serverSeen = true; pet = 'kishmish'; FAKE_HOUR = 12;
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      await send([E('ce_z', 'crate_entry', T - 5*MIN, { source: 'live_model' })]); render(); await wait(2);
      const n = (($q('#side').innerText + $q('#main').innerText).match(/לענות לשאלה מהמצלמה/g) || []).length;
      ok('a waiting camera entry: the instruction appears once on the screen (' + n + ')', n === 1); }
    // waking known only as a window: the screen shows a range, never a made-up moment
    { reset(); const T = Date.now(); seed([{ ...K0, k:'gravel', t: T - 60*MIN, end: T - 57*MIN }, { ...K0, k:'play', t: T - 15*MIN, y:'rope' }]); serverSeen = true; pet = 'kishmish';   // (release 5: a play 15 min ago shows her awake now; 27.11: and within 45 min of the gravel's end, so the chain from the waking is unbroken)
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      await send([E('ce_w1', 'sleep_onset', T - 100*MIN, { lo: T - 110*MIN, hi: T - 100*MIN, single_mark: true })]); camjApply(); render(); await wait(2);
      const w = wakeWin('kishmish'), tile = $q('#sec-rest .card.item');
      if(!isNightAt(T)) ok('woke between her last asleep mark and the gravel: a window, the awake time shown as a range', !!w && w.lo === T - 100*MIN + 1 && w.hi === T - 60*MIN && tile.textContent.includes('התעוררה בין') && !!tile.querySelector('.big .rng'));
      else ok('…at night (27.11) the same window, but no awake range is claimed: night signs show her awake only for minutes', !!w && w.lo === T - 100*MIN + 1 && w.hi === T - 60*MIN && awakeUnknown('kishmish') && !tile.querySelector('.big .rng') && tile.textContent.includes('לא נרשמה שינה מאז'));
      ok('…timing logic uses the earliest possible waking (no invented moment)', awakeSince('kishmish') === w.lo); }
    // several pending detections: the card shows the newest + a link; every one is approvable in the review
    { reset(); const T = Date.now(); seed([{ ...K0, k:'pee', t: T - 5*HOUR }]); serverSeen = true; pet = 'kishmish'; CAMJ.fbLocal = {};
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
      await send([E('ce_a1', 'crate_entry', T - 4*HOUR, { source:'live_model' }), E('ce_a1x', 'crate_exit', T - 3*HOUR, { source:'live_model' }), E('ce_a2', 'crate_entry', T - 2*HOUR, { source:'live_model' }), E('ce_a2x', 'crate_exit', T - 90*MIN, { source:'live_model' }), E('ce_a3', 'crate_entry', T - 20*MIN, { source:'live_model' })]);
      render(); await wait(2);
      ok('the card: one approval (the newest) + "עוד 2 זיהויים לאישור"', $n('.nowtop .camjt') === 1 && $q('.nowtop').textContent.includes('עוד 2 לאישור'));
      camjReview(); await wait(2);
      ok('the review lists every pending entry with its own buttons', sh.querySelectorAll('[data-camans=closed]').length === 3);
      [...sh.querySelectorAll('[data-camans=closed]')].find(b => b.dataset.ev === 'ce_a1').click(); await wait(3);
      const s = state.log.find(e => e.id === 'cam:ce_a1');
      ok('a past entry approved later: a finished stay, ending at the exit the camera saw after it', !!s && s.end === T - 3*HOUR && $q('#sec-crate') && sh.querySelectorAll('[data-camans=closed]').length === 2);
      close(); CAMJ.fbLocal = {}; }
    ok('the live app reads camera/events, the preview its test copy', camjDoc() === 'events' && (MODE = 'preview', camjDoc()) === 'events_preview');
    MODE = 'live';
    ok('the only camera write path is camera/feedback (never the journal)', merged.length > 0 && merged.every(([n]) => n === 'feedback'));
    CAMS.doc = null; CAMS.status = null; fb = null; CAMJ.ready = false;
    done();
  } catch(e){ crashed(e); }
})();
