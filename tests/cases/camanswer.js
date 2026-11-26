// Crate occupancy: exactly four answers everywhere, and every camera answer can be CHANGED, the journal and the feedback
// moving together (owner, next-review). Synthetic replicas only.
(async function(){
  try {
    const K0 = { p:'kishmish' }, subs = {}, merged = [];
    let T = Date.now(), DOORS = [];
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .9, status: 'active', created_at: T, model_version: 'm1', ...o });
    const send = async (list, o = {}) => { if(subs.events) subs.events({ schema: 'cam-events/1', events: list, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: DOORS, published_at: T, updated_at: T, ...o }, false); await wait(3); render(); await wait(2); };
    const sugs = async d => { if(subs.suggestions) subs.suggestions(d, false); await wait(3); render(); await wait(2); };
    const fresh = async mk => { reset(); localStorage.removeItem('pets-timers-v1-cam'); close();
      fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
      CAMJ.fbLocal = {}; CAMJ.ev0 = []; CAMJ.sev = []; CAMJ.ev = []; CAMJ.ready = CAMJ.sready = false; T = Date.now(); DOORS = []; seed(mk()); serverSeen = true; pet = 'kishmish'; render(); await wait(2); };
    const crates = () => state.log.filter(e => e.k === 'crate'), byId = id => state.log.find(e => e.id === id);
    const dec = id => camjDec(id) && camjDec(id).d;

    // 1. the four answers, in order, on the card
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }]);
    await send([E('ce_1', 'crate_entry', T - 30*MIN)]);
    { const q = $q('#sec-crate .camjt');
      ok('card: exactly the four answers, in order', !!q && [...q.querySelectorAll('[data-camans]')].map(b => b.textContent).join('|') === 'הייתה, דלת סגורה|הייתה, דלת פתוחה|לא הייתה בכלוב|לא זוכרת' && !q.querySelector('[data-camj=start], [data-camj=reject]')); }
    for(const [a, d, entry] of [['closed', 'approved', true], ['open', 'visit', false], ['no', 'rejected', false], ['unsure', 'unsure', false]]){
      await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }]);
      await send([E('ce_a', 'crate_entry', T - 30*MIN)]);
      $q(`#sec-crate [data-camans=${a}]`).click(); await wait(3);
      ok(`"${CAMJ_ANS[a]}": decision ${d}, ${entry ? 'ONE session at the camera time' : 'no crate entry'}, the question gone`, dec('ce_a') === d && crates().length === (entry ? 1 : 0) && (!entry || crates()[0].id === 'cam:ce_a') && !$q('#sec-crate .camjt [data-camans]'));
      if(a === 'unsure') ok('"לא זוכרת" is not a negative label: not listed as wrong, not "rejected"', !camjPlan(state.log, Date.now()).rv.rejected.some(e => e.event_id === 'ce_a') && merged.some(([n, x]) => x.decisions.ce_a && x.decisions.ce_a.d === 'unsure'));
    }
    // 2. changing the answer: both sides together, history kept, idempotent
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }]);
    await send([E('ce_c', 'crate_entry', T - 40*MIN)]);
    camjSetAnswer('ce_c', 'closed'); await wait(3);
    ok('closed: one session', crates().length === 1 && !!byId('cam:ce_c'));
    camjSetAnswer('ce_c', 'closed'); await wait(3);
    ok('the same answer again: still one', crates().length === 1);
    camjSetAnswer('ce_c', 'open'); await wait(3);
    ok('closed → open: the session is removed, decision visit, the earlier answer kept in prev', !crates().length && dec('ce_c') === 'visit' && camjDec('ce_c').prev.some(p => p.d === 'approved'));
    camjSetAnswer('ce_c', 'closed'); await wait(3);
    ok('open → closed: exactly one session again, at the camera time', crates().length === 1 && Math.abs(byId('cam:ce_c').t - (T - 40*MIN)) < 1000 && camjDec('ce_c').prev.length === 2);
    camjSetAnswer('ce_c', 'unsure'); await wait(3);
    ok('closed → "לא זוכרת": session removed, nothing negative', !crates().length && dec('ce_c') === 'unsure');
    camjSetAnswer('ce_c', 'no'); await wait(3);
    ok('→ "לא הייתה בכלוב": still nothing, rejected', !crates().length && dec('ce_c') === 'rejected');
    // the toast and the change sheet
    camjSetAnswer('ce_c', 'open'); await wait(3);
    { const tb = $q('#toastWhere [data-camchg]');
      ok('every answer shows a toast with "שינוי תשובה" (no plain undo)', !!tb && tb.textContent === 'שינוי תשובה' && document.getElementById('undo').hidden);
      tb.click(); await wait(2);
      const chips = [...sh.querySelectorAll('[data-chg]')];
      ok('…it reopens the same four choices, the current one marked', chips.map(b => b.textContent).join('|') === 'הייתה, דלת סגורה|הייתה, דלת פתוחה|לא הייתה בכלוב|לא זוכרת' && chips.find(b => b.classList.contains('sel')).dataset.chg === 'open');
      sh.querySelector('[data-chg=closed]').click(); await wait(3);
      ok('…choosing "דלת סגורה" there creates the session', crates().length === 1 && dec('ce_c') === 'approved'); }
    // the review: every decided row under its fold, changeable
    camjReview(); await wait(2);
    { const f = sh.querySelector('details[data-cjd=ans]');
      ok('review "התשובות שלך": the answer and "שינוי תשובה"', !!f && f.textContent.includes('הייתה, דלת סגורה') && !!f.querySelector('[data-camchg=ce_c]'));
      f.querySelector('[data-camchg=ce_c]').click(); await wait(2); sh.querySelector('[data-chg=open]').click(); await wait(3);
      ok('…changed from the review: session gone', !crates().length && dec('ce_c') === 'visit'); close(); }
    // two phones
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }]);
    await send([E('ce_2', 'crate_entry', T - 40*MIN)]);
    { const s0 = clone(state);
      camjSetAnswer('ce_2', 'closed'); await wait(3); const A = clone(state);
      const B = clone(s0); B.log.push({ ...clone(byId('cam:ce_2')), by: 'other' });   // the other phone answered the same
      let srv = patch(diff(s0, A), clone(s0)); srv = patch(diff(s0, B), srv);
      ok('two phones answering "דלת סגורה": one session after the merge', srv.log.filter(e => e.id === 'cam:ce_2').length === 1);
      camjSetAnswer('ce_2', 'open'); await wait(3); const A2 = clone(state);
      srv = patch(diff(A, A2), srv);
      ok('…one of them changes it to "דלת פתוחה": the session is gone for both', !srv.log.some(e => e.id === 'cam:ce_2')); }
    // her labelled entry (the door question): the same answers through the reconcile
    await fresh(() => [{ ...K0, k:'pee', t: T - 2*HOUR }]);
    await send([E('ce_l', 'crate_entry', T - 30*MIN, { source: 'owner_label', confidence: null })]); camjApply(); await wait(3);
    ok('her label, door unknown: the four answers', $n('#sec-crate [data-camans]') === 4);
    $q('#sec-crate [data-camans=closed]').click(); await wait(3);
    ok('…"דלת סגורה": her session', crates().length === 1 && !!byId('cam:ce_l'));
    camjSetAnswer('ce_l', 'open'); await wait(3);
    ok('…changed to "דלת פתוחה": the session is removed (visit)', !crates().length);
    camjSetAnswer('ce_l', 'no'); await wait(3);
    ok('…"לא הייתה בכלוב": no stay from that label at all', !crates().length && !camjStays(Date.now()).some(s => s.e.event_id === 'ce_l'));
    // suggestions: confirmed ↔ the other answers reverses the entry
    await fresh(() => [{ ...K0, k:'pee', t: T - 3*HOUR }]);
    await sugs({ schema: 'cam-suggestions/1', enabled: true, suggestions: [{ id: 'sug_f', kind: 'eating_suggestion', ts: T - 30*MIN, lo: T - 31*MIN, hi: T - 29*MIN, ir: false, status: 'active' },
      { id: 'sug_z', kind: 'sleep_suggestion', ts: T - 100*MIN, lo: T - 101*MIN, hi: T - 100*MIN, end: T - 60*MIN, lo2: T - 60*MIN, hi2: T - 58*MIN, ir: false, status: 'active' }], published_at: Date.now() });
    $q('.camjf [data-camf=ok]').click(); await wait(3);
    ok('eating suggestion confirmed: a food entry', !!byId('cam:sug:sug_f'));
    camjSetAnswer('sug:sug_f', 'drink'); await wait(3);
    ok('…changed to "שתתה, לא אכלה": the food entry removed, decision drinking, history kept', !byId('cam:sug:sug_f') && dec('sug:sug_f') === 'drinking' && camjDec('sug:sug_f').prev[0].d === 'confirmed');
    camjSetAnswer('sug:sug_f', 'ok'); await wait(3); camjSetAnswer('sug:sug_f', 'ok'); await wait(3);
    ok('…back to אישור: exactly one food entry', state.log.filter(e => e.id === 'cam:sug:sug_f').length === 1);
    $q('#sec-rest [data-camss=ok]').click(); await wait(3);
    ok('sleep suggestion confirmed: a sleep entry', !!byId('cam:sug:sug_z'));
    camjSetAnswer('sug:sug_z', 'unsure'); await wait(3);
    ok('…changed to "לא בטוחה": the sleep entry removed, back to nothing (no estimate either)', !byId('cam:sug:sug_z') && dec('sug:sug_z') === 'unsure' && !V.kishmish.spans.some(x => x.cam === 'sug:sug_z'));
    camjSetAnswer('sug:sug_z', 'ok'); await wait(3);
    ok('…and confirmed again: one sleep entry', state.log.filter(e => e.id === 'cam:sug:sug_z').length === 1);
    ok('only camera/feedback is written outside the journal', merged.every(([n]) => n === 'feedback'));
    fb = null; CAMJ.ready = CAMJ.sready = false; CAMJ.ev = []; CAMJ.ev0 = []; CAMJ.sev = []; setState(state);
    done();
  } catch(e){ crashed(e); }
})();
