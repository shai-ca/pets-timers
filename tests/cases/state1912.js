// @clock 19:12
// @window 520,1000
// Regression from the owner's real screen (27.11 ~19:12, production release 5): Kishmish was asleep in the crate, but
// almost no sleep was logged that day (the last recorded sleep ended 13:50). The wheel's step was "צרכים" (after the
// 16:38 meal) and the box said, bare, "אחרי האוכל מוציאים שוב לצרכים" — an instruction to take a sleeping puppy out.
// A TIMES-ONLY replica (no names, ids or notes): the trainer's planned stage stays "צרכים"; with the camera seeing her in
// the crate the guidance says to let her sleep if she sleeps; without the camera it is conditional, the state unknown.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null;
    const p = 'kishmish', N = Date.now(), at = (h, m) => { const d = new Date(N); d.setHours(h, m, 0, 0); return d.getTime(); }, K = { p };
    const cam = (id, x) => ({ id: 'cam:sug:' + id, cam: { src: 'live_model', ok: 'shai' }, ...x });
    seed([
      { ...K, k:'pee', t: at(8, 35), w:'gravel' }, { ...K, k:'food', t: at(9, 43), m:'meal' },
      { ...K, ...cam('s1', {}), k:'sleep', t: at(12, 42), end: at(13, 50) },
      { ...K, k:'food', t: at(13, 36) }, { ...K, ...cam('b1', {}), k:'food', t: at(14, 17) },
      { ...K, k:'gravel', t: at(16, 24), end: at(16, 26) }, { ...K, k:'none', t: at(16, 26) },
      { ...K, k:'crate', t: at(16, 26) + 1, end: at(16, 32) },
      { ...K, k:'gravel', t: at(16, 32), end: at(16, 35) }, { ...K, k:'pee', t: at(16, 35), w:'gravel' },
      { ...K, ...cam('m1', {}), k:'food', t: at(16, 38) }, { ...K, ...cam('b2', {}), k:'food', t: at(18, 16) }]);
    const camOn = on => {
      const v = camjValid({ schema:'cam-events/1', events: [], coverage: [{ from: N - 6*HOUR, to: N }], door_spans: [], published_at: N - MIN, updated_at: N - MIN });
      CAMJ.ev0 = v.ev; CAMJ.cov = v.cov; CAMJ.doors = v.doors; CAMJ.ready = true; CAMJ.fb = {}; CAMJ.fbLocal = {}; CAMJ.sev = []; CAMJ.sready = false; camjMerge();
      CAMS.status = on ? { checked_at: N - MIN, service: 'pets-camera', crate_now: { status: 'positive', capture_ts: N - MIN, confidence: 0.99 } } : null;
      setState(state); render();
    };
    const log0 = JSON.stringify(state.log), what = () => $q('.card.cyc .cyc-n').textContent, cyc = () => $q('.card.cyc').textContent, tile = () => $q('#sec-rest .card.item').textContent;
    const r = routine(p);
    ok('replica: the trainer\'s planned stage is "צרכים" since the 16:38 meal; last recorded sleep ended 13:50', r.i === 4 && clock(r.t) === '16:38' && clock(awakeSince(p)) === '13:50');
    camOn(true);
    let cs = currentState(p);
    ok('camera sees her in the crate now: actual state in_crate, unconfirmed, fresh', cs.state === 'in_crate' && cs.basis === 'camera-unconfirmed' && cs.fresh === true);
    ok('the planned stage stays on the wheel: "בשגרה: צרכים"', cyc().includes('בשגרה: צרכים') && routine(p).i === 4);
    ok('no bare "take her out" while she may be asleep; "if she is in the crate and asleep, leave her"', !what().includes('אחרי האוכל מוציאים שוב לצרכים') && what().includes('אם היא בכלוב ונרדמה, אפשר להשאיר אותה') && what().includes('ממשיכים בשגרה מ״צרכים״'));
    ok('sleep tile: the last RECORDED sleep, "maybe asleep unlogged", never "ערה כבר"', tile().includes('שינה אחרונה שנרשמה') && tile().includes('ייתכן שישנה בלי רישום') && !tile().includes('ערה כבר'));
    // the camera reads her OUT of the crate now (awake unknown): the guidance names the last LOGGED sign, not the camera time
    CAMS.status = { checked_at: N - MIN, service: 'pets-camera', crate_now: { status: 'negative', capture_ts: N - MIN, confidence: 0.99 } }; setState(state); render();
    ok('camera "out", awake unknown: "מאז 18:16 לא נרשם כלום", never the camera reading time', currentState(p).state === 'out' && what().includes('מאז 18:16 לא נרשם כלום') && !what().includes('מאז ' + clock(N - MIN) + ' לא נרשם'));
    camOn(false);
    cs = currentState(p);
    ok('no camera: the actual state is unknown (nothing logged since 18:16 supports awake)', cs.state === 'unknown');
    ok('…the guidance is conditional ("אם היא ערה ומחוץ לכלוב"), the plan unchanged', what().includes('אם היא ערה ומחוץ לכלוב') && cyc().includes('בשגרה: צרכים') && routine(p).i === 4);
    ok('nothing written: the list is byte-identical', JSON.stringify(state.log) === log0);
    CAMS.status = null; done();
  } catch(e){ crashed(e); }
})();
