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
    $q('[data-camj=review]').click(); await wait(2);
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
    await send([...DOC.events, E('ce_L0', 'crate_entry', Date.now() - 90*MIN, { source:'live_model' }), E('ce_L1', 'crate_entry', Date.now() - 20*MIN, { source:'live_model' })]); camjApply(); render(); await wait(2);
    ok('live entries: nothing written, ONE offer in the crate card (the latest), the rest counted', nOpen() === 0 && $n('.card .camjt') === 1 && $q('.card .camjt').textContent.includes(clock(Date.now() - 20*MIN)) && camjPlan(state.log, Date.now()).rv.liveMore === 1);
    $q('.card .camjt [data-camj=reject]').click(); await wait(2);
    ok('"לא נכון": no entry, kept as a negative example (feedback)', nOpen() === 0 && camjDec('ce_L1').d === 'rejected' && camjPlan(state.log, Date.now()).rv.rejected.some(e => e.event_id === 'ce_L1') && merged.some(([n, d]) => n === 'feedback' && d.decisions.ce_L1));
    render(); await wait(2);
    $q('.card .camjt [data-camj=start]').click(); await wait(2);
    ok('the next one: "שהייה מ־HH:MM" starts a session at the camera time, approved', !!byId('cam:ce_L0') && Math.abs(byId('cam:ce_L0').t - (now - 90*MIN)) < 60000);
    await send([...DOC.events, E('ce_LX', 'crate_exit', Date.now() - 5*MIN, { source:'live_model' })]); render(); await wait(2);
    ok('a live exit while a session is open: offered in the crate card', !!$q('.card .camjt') && $q('.card .camjt').textContent.includes('יצאה מהכלוב'));
    $q('.card .camjt [data-camj=end]').click(); await wait(2);
    ok('…"אישור" ends it at the camera time', Math.abs(byId('cam:ce_L0').end - (Date.now() - 5*MIN)) < 60000 && camjDec('ce_LX').d === 'approved');

    // 6b. the advice says when the camera disagrees with the journal (and changes nothing)
    { const id = 'zz_s'; commit('', () => state.log.push({ id, p:'kishmish', k:'sleep', t: Date.now() - 4*MIN }), { quiet: true });
      await send([...DOC.events, E('ce_Q', 'crate_exit', Date.now() - 2*MIN, { source:'live_model' })]); render(); await wait(2);
      ok('asleep in the journal + a live camera exit after it: the advice line says to check, the journal unchanged', !!$q('.advice') && $q('.advice').textContent.includes('המצלמה זיהתה יציאה') && byId(id).end == null);
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
    { const cc = $q('.card .camjb');
      ok('one component: the camera image card sits inside the crate card, not in a separate column card', !!cc && !!cc.querySelector('.camc') && !$q('#side .camc'));
      ok('an old image is "last seen", never "now"; "now" comes only from a fresh frame', cc.textContent.includes('נראתה לאחרונה') && cc.textContent.includes('עכשיו לפי המצלמה') && cc.textContent.includes('לא בכלוב'));
      ok('camera working: manual crate buttons folded under "עוד"', !!$q('.card details.cr-more [data-act=dur][data-k=crate]')); }
    CAMS.status = { checked_at: Date.now() - 40*MIN, crate_now: null }; render(); await wait(2);
    ok('camera not updating: says since when, and the manual buttons are up front again', $q('.card .camjb').textContent.includes('המצלמה לא מעדכנת') && !$q('details.cr-more') && !!$q('.card [data-act=dur][data-k=crate]'));
    ok('food / pee buttons never folded', !$q('details [data-act=pt][data-k=food]') && !$q('details [data-act=pt][data-k=pee]'));
    ok('coverage: outside vs inside', camjCov(now - 22*HOUR) === false && camjCov(now - HOUR) === true);

    ok('the live app reads camera/events, the preview its test copy', camjDoc() === 'events' && (MODE = 'preview', camjDoc()) === 'events_preview');
    MODE = 'live';
    ok('the only camera write path is camera/feedback (never the journal)', merged.length > 0 && merged.every(([n]) => n === 'feedback'));
    CAMS.doc = null; CAMS.status = null; fb = null; CAMJ.ready = false;
    done();
  } catch(e){ crashed(e); }
})();
