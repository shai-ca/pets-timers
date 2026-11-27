// Release 6b, item 3 (owner 27.11: 14 crate questions waiting, 15 answered one by one as "door open"). Live crate
// detections are grouped into EPISODES only when the camera gives no evidence she left between them (a second entry
// with no exit, or an exit that is context only / disputed / rejected); a real exit separates them however short the
// gap (owner's safeguard: never carry an answer across episodes). One answer = one decision per event id and at most
// one journal session. The visible queue is capped (CAMJ_QMAX = 3); the rest is RETIRED — derived, no decision written,
// still in the review's folded history. The question lives in the top card only.
(async function(){
  try {
    const p = 'kishmish';
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts, source: 'live_model', confidence: 0.95, status: 'active', model_version: 't', ...o });
    const camSet = (events, cn) => {
      const v = camjValid({ schema: 'cam-events/1', events, coverage: [{ from: Date.now() - 30*HOUR, to: Date.now() }], door_spans: [] });
      CAMJ.ev0 = v.ev; CAMJ.cov = v.cov; CAMJ.doors = v.doors; CAMJ.ready = true; CAMJ.fb = {}; CAMJ.fbLocal = {}; CAMJ.sev = []; CAMJ.sready = false; camjMerge();
      CAMS.status = { checked_at: Date.now() - 30000, crate_now: cn ? { status: cn, capture_ts: Date.now() - 30000 } : null }; setState(state); render(); };
    const rv = () => camjPlan(state.log, Date.now()).rv, dec = id => CAMJ.fbLocal[id];
    for(const phone of [true, false]){
      reset(); FAKE_PHONE = phone; const now = Date.now(), tag = (phone ? 'phone' : 'desktop') + (V2 ? ' v2' : ' v1') + ': ';
      const K0 = { p }, base = [{ ...K0, k:'crate', t: now - 5*HOUR, end: now - 4*HOUR }, { ...K0, k:'pee', t: now - 4*HOUR + MIN, w:'gravel' }];
      // NEAR MISS: two distinct visits 20 min apart (a real exit between) → two questions, never one answer for both
      seed(base); camSet([E('a1', 'crate_entry', now - 50*MIN), E('a1x', 'crate_exit', now - 45*MIN), E('a2', 'crate_entry', now - 25*MIN), E('a2x', 'crate_exit', now - 20*MIN)]);
      let R = rv();
      ok(tag + 'near miss: two visits 20 min apart = two questions', R.eps.length === 2 && R.eps.every(q => q.n === 1) && R.eps[0].head.event_id === 'a2');
      ok(tag + 'the question is in the top card only (one set of answers on screen)', $n('.nowtop [data-camans="closed"]') === 1 && !$q('[data-k=crate]').closest('.card').querySelector('[data-camans]'));
      camjSetAnswer('a2', 'open');
      ok(tag + 'answering the newer one decides only it', dec('a2') && dec('a2').d === 'visit' && !dec('a1') && rv().eps.length === 1 && rv().eps[0].head.event_id === 'a1');
      // a SHORT real exit still separates (3 min) — the rule is the evidence, not the gap
      camSet([E('b1', 'crate_entry', now - 30*MIN), E('b1x', 'crate_exit', now - 28*MIN), E('b2', 'crate_entry', now - 25*MIN)]);
      ok(tag + 'a real exit 3 min long still separates', rv().eps.length === 2);
      // DUPLICATE entries (no exit between) → one episode, one answer for both, per event id
      camSet([E('c1', 'crate_entry', now - 40*MIN), E('c2', 'crate_entry', now - 37*MIN), E('c3', 'crate_entry', now - 33*MIN), E('cx', 'crate_exit', now - 10*MIN)]);
      R = rv();
      ok(tag + 'three entries with no exit between: one episode of 3', R.eps.length === 1 && R.eps[0].n === 3 && R.eps[0].head.event_id === 'c1' && R.eps[0].to === now - 10*MIN);
      ok(tag + 'the question names the episode: "הייתה בכלוב 40–10" + "3 זיהויים"', $q('.nowtop .nt-c').textContent.includes(`${clock(now - 40*MIN)}–${clock(now - 10*MIN)}`) && $q('.nowtop .nt-c').textContent.includes('3 זיהויים'));
      const n0 = state.log.length;
      $q('.nowtop [data-camans="closed"]').click(); await wait();
      const ses = state.log.filter(e => e.k === 'crate' && /^cam:/.test(e.id || ''));
      ok(tag + '"הייתה, דלת סגורה": a decision per event id, ONE session from the first entry to the episode\'s exit', ['c1', 'c2', 'c3'].every(i => dec(i) && dec(i).d === 'approved') && dec('c2').ep === 'c1' && !dec('c1').ep
        && ses.length === 1 && ses[0].id === 'cam:c1' && ses[0].t === now - 40*MIN && ses[0].end === now - 10*MIN && state.log.length === n0 + 1);
      camjSetAnswer('c3', 'open');   // changing the answer from any member changes the whole episode, and removes the session
      ok(tag + 'changing it from a member: all three → visit, the session removed', ['c1', 'c2', 'c3'].every(i => dec(i).d === 'visit') && !state.log.some(e => e.id === 'cam:c1'));
      // an exit that is only CONTEXT (a model switch) does not split the occupancy
      seed(base); camSet([E('d1', 'crate_entry', now - 40*MIN), E('dx', 'crate_exit', now - 38*MIN, { model_switch: true }), E('d2', 'crate_entry', now - 37*MIN, { model_switch: true }), E('d3', 'crate_entry', now - 36*MIN)]);
      R = rv();
      ok(tag + 'across a model switch: one episode (the switched events are context, not members)', R.eps.length === 1 && R.eps[0].members.map(e => e.event_id).join() === 'd1,d3');
      // RETIRED: explained (another member already answered), old (> 6 h), beyond the cap — no decision written
      seed(base); const L = []; for(let i = 0; i < 6; i++){ L.push(E('q' + i, 'crate_entry', now - (100 - i*15)*MIN), E('q' + i + 'x', 'crate_exit', now - (95 - i*15)*MIN)); }
      L.push(E('o1', 'crate_entry', now - 8*HOUR), E('o1x', 'crate_exit', now - 8*HOUR + 5*MIN));
      L.push(E('m1', 'crate_entry', now - 7*HOUR), E('m2', 'crate_entry', now - 7*HOUR + 2*MIN), E('mx', 'crate_exit', now - 7*HOUR + 9*MIN));
      camSet(L); CAMJ.fbLocal.m1 = { d: 'visit', at: now - 6*HOUR }; setState(state); render(); R = rv();
      ok(tag + 'the visible queue is capped at ' + CAMJ_QMAX + ': the three newest episodes', R.eps.length === 3 && R.eps.map(q => q.head.event_id).join() === 'q5,q4,q3');
      ok(tag + 'retired: 3 beyond the cap, 1 old, 1 explained (m2: m1 of the same stay was answered)', R.retired.filter(q => q.why === 'more').length === 3 && R.retired.some(q => q.why === 'old' && q.head.event_id === 'o1') && R.retired.some(q => q.why === 'explained' && q.head.event_id === 'm2'));
      ok(tag + 'retired items stay UNRESOLVED: no decision of any kind was written for them', ['q0', 'q1', 'q2', 'o1', 'm2'].every(i => !dec(i)) && Object.keys(CAMJ.fbLocal).join() === 'm1');
      ok(tag + 'the top card: one question + "עוד 2 לאישור"', $n('.nowtop [data-camans="closed"]') === 1 && $q('.nowtop').textContent.includes('עוד 2 לאישור'));
      camjReview();
      ok(tag + 'the review: 3 to answer, the retired ones folded under "לא נשאלו (בלי תשובה)", still answerable', $n('.cam-sheet .cjr [data-camans="closed"]') >= 8 && $q('.cam-sheet details[data-cjd="ret"] summary').textContent.includes('(5)') && $q('.cam-sheet details[data-cjd="ret"]').textContent.includes('לא נספר'));
      close();
      ok(tag + 'nothing in the journal from showing / retiring', !state.log.some(e => /^cam:/.test(e.id || '')));
      // the door: an old "door closed" setting no longer makes every later visit a session question — her later "door open" answer ends it
      seed([...base, { ...K0, k:'cset', door:'closed', t: now - 20*HOUR }]); camSet([E('v1', 'crate_entry', now - 60*MIN), E('v1x', 'crate_exit', now - 55*MIN), E('v2', 'crate_entry', now - 20*MIN)]);
      ok(tag + 'door: before her answer, the old cset says "closed"', camjLiveDoor(CAMJ.ev.find(e => e.event_id === 'v2'), now) === 'closed');
      camjSetAnswer('v1', 'open');
      ok(tag + 'door: after "הייתה, דלת פתוחה" for an earlier visit, the old setting is superseded ("unknown", asked, never assumed closed)', camjLiveDoor(CAMJ.ev.find(e => e.event_id === 'v2'), now) === 'unknown');
    }
    done();
  } catch(e){ crashed(e); }
})();
