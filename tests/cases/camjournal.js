// Camera events -> journal (CAMERA-API §11a, owner 26.11). A fake `fb.camDoc` delivers camera/events. Checks:
// owner_label commits once (idempotent, also across two phones), live_model only by approval (and expires), short
// visits never become stays, manual entries are linked not duplicated (with a time correction), human edits are
// protected, deletes / rejections are remembered, retractions undo only untouched camera work, an exit ends the
// stay and the sleep, coverage vs a missed detection, the uncertainty window, the manual-tap choice, the buttons
// under "עוד", nothing before the server copy arrived, and data version 3.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    reset(); localStorage.removeItem('pets-timers-v1-cam'); localStorage.removeItem('pets-timers-v1-camb');
    const now = Date.now(), K0 = { p:'kishmish' };
    let DOC = null; const subs = {};
    fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; if(DOC && n !== 'latest' && n !== 'status') setTimeout(() => on(DOC, false), 0); return () => { delete subs[n]; }; }, camGet: async () => null };
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'owner_label', confidence: null, status: 'active', created_at: now, model_version: 't', ...o });
    const send = async evs => { DOC = { schema: 'cam-events/1', events: evs, coverage: COV, published_at: now, updated_at: now }; if(subs.events) subs.events(DOC, false); await wait(3); };
    let COV = [{ from: now - 10*HOUR, to: now - 5*HOUR }, { from: now - 3*HOUR, to: now }];
    const stays = () => state.log.filter(e => e.p === 'kishmish' && e.k === 'crate');
    const byId = id => state.log.find(e => e.id === id);

    ok('data version 3: new data is v3, old v2 data still reads', blank().v === 3 && norm({ v: 2, log: [{ ...K0, k:'pee', t: now - HOUR, id:'a' }] }).log.length === 1);

    // nothing before the server copy arrived (never match against a stale journal)
    seed([{ ...K0, k:'food', t: now - 9*HOUR }]); serverSeen = false; pet = 'kishmish'; render(); await pause(20);
    await send([E('ce_a', 'crate_entry', now - 8*HOUR), E('ce_b', 'crate_exit', now - 7*HOUR)]);
    ok('before the server copy: nothing applied', stays().length === 0);
    serverSeen = true; camjApply(); await wait(2);
    const A = byId('cam:ce_a');
    ok('owner_label pair: one crate stay from the camera, start and end, source kept', !!A && A.t === now - 8*HOUR && A.end === now - 7*HOUR && A.cam.src === 'owner_label' && A.cam.in === 'ce_a' && A.cam.out === 'ce_b' && A.cam.ilo === now - 8*HOUR - 30000);
    camjApply(); camjApply(); await wait(2);
    ok('idempotent: applying again adds nothing', stays().length === 1);
    { const s1 = clone(state), s2 = clone(state); s2.log = s2.log.filter(e => e.id !== 'cam:ce_a');   // two phones both wrote it
      const merged = patch(diff(s2, s1), s1); ok('two phones writing the same event: one entry after the merge', merged.log.filter(e => e.id === 'cam:ce_a').length === 1); }

    // a short voluntary visit: never a stay, never a prompt, no change to the routine
    { const before = JSON.stringify([routine('kishmish'), V.kishmish.spans.length]);
      await send([...DOC.events, E('ce_v1', 'crate_entry', now - 6*HOUR), E('ce_v2', 'crate_exit', now - 6*HOUR + 4*MIN)]); camjApply(); await wait(2);
      ok('short visit (4 min): no stay, no card, routine and sleep unchanged', stays().length === 1 && camjCards().length === 0 && JSON.stringify([routine('kishmish'), V.kishmish.spans.length]) === before); }

    // a manual stay and the camera's event for it: linked, not duplicated; the time can be corrected
    commit('', () => state.log.push(newStay('kishmish', 'crate', now - 5*HOUR + 6*MIN, now - 4*HOUR)), { quiet: true });
    const M = stays().find(e => !e.id.startsWith('cam:') && e.t === now - 5*HOUR + 6*MIN);
    await send([...DOC.events, E('ce_m', 'crate_entry', now - 5*HOUR), E('ce_mx', 'crate_exit', now - 4*HOUR + 2*MIN)]); camjApply(); await wait(2); render(); await wait(2);
    ok('manual entry within 10 min: linked, no second stay', stays().length === 2 && byId(M.id).cam.in === 'ce_m' && byId(M.id).cam.out === 'ce_mx' && !byId('cam:ce_m'));
    ok('a card offers the camera\'s times (entry and exit)', camjCards().filter(c => c.type === 'fix' && c.id === M.id).length === 2 && $q('#side .camj').textContent.includes('המצלמה רשמה כניסה'));
    $q('#side .camj [data-camj=fix]').click(); await wait(2);
    ok('"לשעת המצלמה": the entry takes the camera time, the card goes, not marked as a human override', byId(M.id).t === now - 5*HOUR && byId(M.id).cam.fix === 1 && !byId(M.id).cam.h);
    $q('#side .camj [data-camj=keep]').click(); await wait(2);
    ok('"להשאיר": the manual end stays, no more cards', byId(M.id).end === now - 4*HOUR && byId(M.id).cam.okeep === 1 && camjCards().length === 0);
    ok('the camera window and the camera time show in the entry\'s details', camjNote(byId(M.id), true).includes('המצלמה ראתה גם'));

    // coverage vs a missed detection (manual stays with no camera event)
    commit('', () => { state.log.push(newStay('kishmish', 'crate', now - 4*HOUR + 20*MIN, now - 4*HOUR + 50*MIN)); state.log.push(newStay('kishmish', 'crate', now - 2*HOUR, now - 90*MIN)); }, { quiet: true });
    { const out = stays().find(e => e.t === now - 4*HOUR + 20*MIN), inn = stays().find(e => e.t === now - 2*HOUR);
      ok('outside the camera\'s coverage: said so', camjNote(out, true).includes('מחוץ לכיסוי המצלמה'));
      ok('inside coverage with no camera event: "the camera did not detect it"', camjNote(inn, true).includes('המצלמה לא זיהתה')); }

    // live_model: only a card; approve / reject; expiry
    await send([...DOC.events, E('ce_L', 'crate_entry', now - 40*MIN, { source: 'live_model', confidence: 0.9 })]); camjApply(); await wait(2); render(); await wait(2);
    ok('live event: nothing written, a card "אישור / לא נכון"', !byId('cam:ce_L') && camjCards().some(c => c.type === 'pending') && $q('#side .camj').textContent.includes('נרשם רק אם מאשרים'));
    $q('#side .camj [data-camj=ok]').click(); await wait(2);
    ok('approve: the stay is written at the camera time, with who approved', !!byId('cam:ce_L') && byId('cam:ce_L').t === now - 40*MIN && byId('cam:ce_L').cam.ok === me && byId('cam:ce_L').cam.src === 'live_model' && byId('cam:ce_L').end == null);
    await send([...DOC.events, E('ce_LX', 'crate_exit', now - 20*MIN, { source: 'live_model' })]); camjApply(); await wait(2); render(); await wait(2);
    $q('#side .camj [data-camj=no]').click(); await wait(2);
    ok('reject: nothing changes, a hidden record so no phone asks again', byId('cam:ce_L').end == null && byId('camx:ce_LX').cam.why === 'rejected' && camjCards().length === 0);
    ok('hidden: never listed', !state.log.filter(e => e.p === 'kishmish' && !ITEMS[e.k].hid).some(e => e.k === 'camx'));
    await send([...DOC.events, E('ce_old', 'crate_entry', now - 7*HOUR - 10*MIN, { source: 'live_model' })]); camjApply();
    ok('a live event older than 6 h: no card', !camjCards().some(c => c.ev && c.ev.event_id === 'ce_old'));

    // owner_label exit for the open (approved) stay: it ends, and so does a sleep inside it
    commit('', () => state.log.push({ p:'kishmish', k:'sleep', t: now - 30*MIN }), { quiet: true });
    await send([...DOC.events, E('ce_X', 'crate_exit', now - 10*MIN)]); camjApply(); await wait(2);
    ok('owner_label exit: ends the open stay at the camera time and the sleep in it', byId('cam:ce_L').end === now - 10*MIN && byId('cam:ce_L').cam.out === 'ce_X' && state.log.find(e => e.k === 'sleep' && e.t === now - 30*MIN).end === now - 10*MIN);

    // a human edit protects; a retraction undoes only untouched camera work
    commit('', () => { const x = byId('cam:ce_a'); x.end = now - 7*HOUR + 5*MIN; }, { quiet: true });
    ok('a human edit marks the camera stay as protected', byId('cam:ce_a').cam.h === 1);
    await send(DOC.events.map(e => e.event_id === 'ce_a' || e.event_id === 'ce_X' ? { ...e, status: 'retracted' } : e)); camjApply(); await wait(2);
    ok('retracted: a human-edited camera stay stays', !!byId('cam:ce_a'));
    ok('retracted exit: the end the camera set is taken back (nothing came after)', byId('cam:ce_L').end == null && !byId('cam:ce_L').cam.out);

    // a human deletes a camera stay: it never comes back
    commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:ce_L'); }, { quiet: true });
    camjApply(); await wait(2);
    ok('deleted by a human: remembered, not re-added', !byId('cam:ce_L') && byId('camx:ce_L').cam.why === 'deleted');

    // a manual tap while the camera has an unapproved entry within 10 min: one entry, her choice of time
    await send([...DOC.events, E('ce_T', 'crate_entry', Date.now() - 3*MIN, { source: 'live_model' })]); camjApply(); render(); await wait(2);
    tapDur('kishmish', 'crate'); await wait(2);
    ok('manual tap near a camera event: asks which time, nothing written yet', bg.classList.contains('show') && !!sh.querySelector('#cjCam') && !byId('cam:ce_T'));
    sh.querySelector('#cjCam').click(); await wait(2);
    ok('"לפי המצלמה": one stay at the camera time, approved', !!byId('cam:ce_T') && stays().filter(e => e.end == null).length === 1);
    commit('', () => { state.log = state.log.filter(e => e.id !== 'cam:ce_T'); }, { quiet: true });
    await send([...DOC.events, E('ce_T2', 'crate_entry', Date.now() - 2*MIN, { source: 'live_model' })]); camjApply(); render(); await wait(2);
    tapDur('kishmish', 'crate'); await wait(2); sh.querySelector('#cjNow').click(); await wait(3);
    { const o = stays().filter(e => e.end == null).pop();
      ok('"לפי עכשיו": one manual stay now, linked to the event, no card afterwards', !!o && !o.id.startsWith('cam:') && o.cam.in === 'ce_T2' && o.cam.keep === 1 && !camjCards().some(c => c.ev && c.ev.event_id === 'ce_T2')); }

    // the manual crate buttons are under "עוד" (one tap to open), food / potty unchanged
    render(); await wait(2);
    { const more = $q('.card details.cr-more');
      ok('crate buttons under "עוד · רישום ידני", still there as a fallback', !!more && !!more.querySelector('[data-act=dur][data-k=crate]') && more.querySelector('summary').textContent.includes('עוד'));
      ok('food / pee buttons unchanged (not folded)', !!$q('[data-act=pt][data-k=food]') && !$q('details [data-act=pt][data-k=food]') && !$q('details [data-act=pt][data-k=pee]')); }

    // an event inside a stay the same pass creates: never a second, overlapping stay; an exit is used once
    { const n0 = stays().length;
      await send([...DOC.events, E('ce_o1', 'crate_entry', now - 9*HOUR - 50*MIN, { pair_id: 'ce_o3' }), E('ce_o2', 'crate_entry', now - 9*HOUR - 30*MIN), E('ce_o3', 'crate_exit', now - 9*HOUR - 10*MIN)]); camjApply(); await wait(2);
      ok('overlapping camera entries: one stay, the inner entry marked, the exit used once', stays().length === n0 + 1 && byId('cam:ce_o1').end === now - 9*HOUR - 10*MIN && byId('camx:ce_o2').cam.why === 'inside'); }
    ok('the preview / sandbox read the test document, the live app the real one', camjDoc() === 'events' && (MODE = 'preview', camjDoc()) === 'events_preview');
    MODE = 'live'; fb = null; CAMJ.ready = false;
    done();
  } catch(e){ crashed(e); }
})();
