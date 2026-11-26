// "סגרתי את הדלת" / "פתחתי את הדלת" (owner, next-review): door state, physical occupancy and sleep stay independent.
// Synthetic replicas only.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {};
    let T = Date.now(), DOORS = [];
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .9, status: 'active', created_at: T, model_version: 'm1', ...o });
    const send = async (list, o = {}) => { if(subs.events) subs.events({ schema: 'cam-events/1', events: list, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: DOORS, published_at: T, updated_at: T, ...o }, false); await wait(3); render(); await wait(2); };
    const fresh = async mk => { reset(); localStorage.removeItem('pets-timers-v1-cam'); close();
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async () => {} };
      CAMJ.fbLocal = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; T = Date.now(); DOORS = []; seed(mk()); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const crates = () => state.log.filter(e => e.k === 'crate'), sleeps = () => state.log.filter(e => e.k === 'sleep');

    // 1. she went in on her own (door open, a confirmed visit); then the door is closed
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'cset', t: T - 3*HOUR, door:'open' }]);
    await send([E('ce_v', 'crate_entry', T - 40*MIN)]);
    ok('door open + a live entry: a visit, no stay offered', !camjPlan(state.log, Date.now()).rv.live.length && !crates().length);
    camjSetAnswer('ce_v', 'open'); await wait(3);
    { const b = $q('#sec-crate [data-door=close]');
      ok('the crate card offers "סגרתי את הדלת"', !!b && b.textContent.includes('סגרתי את הדלת'));
      const n0 = state.log.length; b.click(); await wait(3);
      const c = crates()[0], cs = state.log.filter(e => e.k === 'cset' && e.door === 'closed');
      ok('one commit: the door closed AND a session, both at that moment (not backdated to her entry)', crates().length === 1 && cs.length === 1 && Math.abs(c.t - cs[0].t) < 5 && Date.now() - c.t < 60000 && c.end == null && state.log.length === n0 + 2);
      ok('…the visit stays a visit, no sleep entry', camjDec('ce_v').d === 'visit' && !sleeps().length);
      ok('…the card now offers "פתחתי את הדלת" next to "יצאה מהכלוב"', !!$q('#sec-crate [data-door=open]') && !!$q('#sec-crate [data-act=dur][data-k=crate]')); }
    // 2. the camera reconciles without a second session; its exit ends this one
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'cset', t: T - 3*HOUR, door:'open' }]);
    await send([E('ce_x', 'crate_entry', T - 40*MIN)]);
    doorClose('kishmish', T - 10*MIN); await wait(3);
    { const rv = camjPlan(state.log, Date.now()).rv;
      ok('the live entry of that occupancy (before the door closed): not offered, not pending — no second session', !rv.live.some(l => l.kind === 'start') && !rv.pending.some(e => e.event_id === 'ce_x') && crates().length === 1); }
    await send([...CAMJ.ev0, E('ce_xx', 'crate_exit', T - 4*MIN)]);
    { const lv = camjPlan(state.log, Date.now()).rv.live[0];
      ok('…the camera\'s exit is offered for THIS session', !!lv && lv.kind === 'end' && lv.stay === crates()[0].id);
      $q('#sec-crate .camjt [data-camj=end]').click(); await wait(3);
      ok('…and ends it there; still one session', crates().length === 1 && crates()[0].end === T - 4*MIN); }
    // her labels: the same occupancy becomes the same session (linked, not duplicated)
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'cset', t: T - 3*HOUR, door:'open' }]);
    await send([E('ce_l', 'crate_entry', T - 40*MIN, { source: 'owner_label', confidence: null })]);
    doorClose('kishmish', T - 10*MIN); await wait(3); camjApply(); await wait(3);
    ok('her labelled entry + the door closed by her: one session, linked to the camera, from the closing', crates().length === 1 && crates()[0].t === T - 10*MIN && !!(crates()[0].cam && crates()[0].cam.cid === 'cam:ce_l'));

    // 3. "פתחתי את הדלת": the session ends, NOTHING else
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR, w:'gravel' }, { ...K0, k:'food', t: T - 2*HOUR }, { ...K0, k:'crate', t: T - 60*MIN }, { ...K0, k:'sleep', t: T - 50*MIN }]);
    { const pd0 = pottyDue('kishmish'), rt0 = retry('kishmish');
      $q('#sec-crate [data-door=open]').click(); await wait(3);
      const c = crates()[0];
      ok('door opened: the session ends at that moment', c.end != null && Date.now() - c.end < 60000 && state.log.some(e => e.k === 'cset' && e.door === 'open' && e.t === c.end));
      ok('…her sleep goes on (no leaveCrate, enforce does not cut it), not awake', sleeps()[0].end == null && !!V.kishmish.sleep.start && !awakeSince('kishmish'));
      ok('…no take-out reminder, no retry, no "out" step', !pottyDue('kishmish') && !retry('kishmish') && pd0 === null && rt0 === null && routine('kishmish').free === 'opened' && routine('kishmish').i === -1);
      ok('…the wheel says the door is open, not that she came out', cycleHTML('kishmish').includes('הדלת פתוחה') && !cycleHTML('kishmish').includes('יצאה בעצמה'));
      commit('', () => { const x = state.log.find(e => e.k === 'sleep'); x.end = Date.now() - 1000; }, { quiet: true });
      ok('…and when she wakes later, retryScan / pottyDue still read it as no "taken out" exit', !retry('kishmish') && selfExit('kishmish', c.end) === 'opened'); }
    // an ESTIMATED sleep running when the door is opened goes on too
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR, w:'gravel' }, { ...K0, k:'crate', t: T - 60*MIN }]);
    ok('an estimate in the session (fixed delay)', V.kishmish.sleep.start === T - 60*MIN + ASSUME_SLEEP && V.kishmish.sleep.assumed);
    doorOpen('kishmish', T - 5*MIN); await wait(3);
    ok('door opened: the estimate goes on (not awake), no sleep entry written', V.kishmish.sleep.start === T - 60*MIN + ASSUME_SLEEP && !sleeps().length && !awakeSince('kishmish'));
    commit('', () => state.log.push({ p:'kishmish', k:'play', y:'rope', t: T - 2*MIN }), { quiet: true });
    ok('…something showing her awake ends it there', !V.kishmish.sleep.start && awakeSince('kishmish') === T - 2*MIN);
    // closing the door implies no sleep in either direction
    await fresh(() => [{ ...K0, k:'pee', t: T - 30*MIN, w:'gravel' }, { ...K0, k:'cset', t: T - 3*HOUR, door:'open' }]);
    { const aw0 = awakeSince('kishmish'); doorClose('kishmish', Date.now()); await wait(3);
      ok('closing the door: no sleep entry, still awake right now', !sleeps().length && !V.kishmish.sleep.start && awakeSince('kishmish') === aw0); }
    fb = null; CAMJ.ready = CAMJ.sready = false; CAMJ.ev = []; CAMJ.ev0 = []; CAMJ.sev = []; setState(state);
    done();
  } catch(e){ crashed(e); }
})();
