// Release 6 integration (owner, 27.11): an APPROVED camera event must flow through to the journal, the timers, the actual
// state (`currentState`) and the guidance (`guidance`) — while the trainer's routine (`routine`) moves only as the journal
// says, exactly as for a tap. An unapproved detection informs the guidance only. Synthetic replicas only.
(async function(){
  try {
    const K0 = { p:'kishmish' }, p = 'kishmish', subs = {};
    let T = Date.now(), EV = [];
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .8, status: 'active', created_at: T, model_version: 'm1', ...o });
    const OD = (ans, rid) => ({ owner_decision: { ans, at: Date.now() - MIN, src: 'research_ui', rid } });
    const send = async () => { subs.events && subs.events({ schema: 'cam-events/1', events: EV, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: [], published_at: T, updated_at: T }, false); await wait(3); render(); await wait(2); };
    reset(); localStorage.removeItem('pets-timers-v1-cam');
    fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async () => {} };
    CAMJ.fbLocal = {}; CAMJ.fb = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; CAMJ.unsub = CAMJ.unsubS = CAMJ.unsubF = null;
    // out of the crate after a gravel pee 25 min ago: the trainer's step is "משחק"
    seed([{ ...K0, k:'crate', t: T - 3*HOUR, end: T - 30*MIN }, { ...K0, k:'gravel', t: T - 30*MIN, end: T - 25*MIN }, { ...K0, k:'pee', t: T - 25*MIN, w:'gravel' }, { ...K0, k:'food', t: T - 4*HOUR, m:'meal' }]);
    serverSeen = true; pet = p; render(); await wait(2);
    const r0 = routine(p);
    ok('start: the trainer\'s step is "משחק", out of the crate', r0.i === 2 && !V[p].crate.start);
    // 1. an UNAPPROVED live crate entry 10 min ago: guidance only, nothing written, the routine unmoved
    EV = [E('ce_a', 'crate_entry', T - 10*MIN)]; await send();
    let cs = currentState(p), g = guidance(p);
    ok('unapproved entry: actual state "in the crate", camera-unconfirmed', cs.state === 'in_crate' && cs.basis === 'camera-unconfirmed');
    ok('…guidance adapts (crate mode), the routine still "משחק", nothing in the journal', g.mode === 'crate' && routine(p).i === 2 && !state.log.some(e => e.k === 'crate' && e.t > T - 20*MIN));
    // 2. her explicit research answer "closed" on it: one session, the actual state confirmed, the trainer's routine moves
    EV = [E('ce_a', 'crate_entry', T - 10*MIN, OD('closed', 'r1'))]; await send();
    const ses = state.log.filter(e => e.k === 'crate' && e.id === 'cam:ce_a');
    cs = currentState(p); g = guidance(p);
    ok('approved: one crate session at the camera time', ses.length === 1 && ses[0].t === T - 10*MIN && ses[0].end == null);
    ok('…the crate timer runs from it', V[p].crate.start === T - 10*MIN);
    ok('…actual state: in the crate (the session is camera-confirmed; in a closed crate the usual estimate then reads her probably asleep)', cs.occ === 'in' && ((cs.state === 'in_crate' && cs.basis === 'camera-confirmed') || (cs.state === 'asleep' && cs.basis === 'inferred')) && ses[0].cam && ses[0].cam.ok === 'research_ui');
    ok('…the trainer\'s routine follows the journal: step "כלוב" (a new round)', routine(p).i === 0);
    ok('…guidance steps aside for the trainer\'s crate step (plan mode)', g.mode === 'plan');
    // 3. her approved eating suggestion (the production path: eatSuggest on) moves the meal clock as a tap would
    const sugDoc = items => subs[camjSugDoc()] && subs[camjSugDoc()]({ schema: 'cam-suggestions/1', suggestions: items, published_at: Date.now(), enabled: true }, false);
    sugDoc([{ id: 'sug_f', kind: 'eating_suggestion', ts: T - 5*MIN, lo: T - 6*MIN, hi: T - 4*MIN, status: 'active', confidence: .7, model_version: 'm1', ...OD('ok', 'r2') }]); await wait(3); render(); await wait(2);
    ok('approved eating suggestion: one food entry at its time, the meal clock at it', state.log.filter(e => e.id === 'cam:sug:sug_f').length === 1 && V[p].food === T - 5*MIN);
    // 4. the same answers again: nothing changes
    const n0 = state.log.length; await send();
    ok('re-sent: idempotent (same rids)', state.log.length === n0);
    CAMS.status = null; fb = null; done();
  } catch(e){ crashed(e); }
})();
