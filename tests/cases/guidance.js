// @clock 12:00
// The three layers (owner, 27.11 evening): 1. the trainer's routine (`routine`, the wheel — unchanged, central);
// 2. what is actually known (`currentState`); 3. the words that reconcile them (`guidance`: the "מה עושים עכשיו?" box and
// the wheel's "בשגרה / בפועל" line). Synthetic lists, by day, phone and desktop, both designs. Nothing may be written.
(async function(){
  try {
    const K0 = { p:'kishmish' }, p = 'kishmish';
    const what = () => $q('.card.cyc .cyc-n').textContent, gd = () => $q('.card.cyc .gd'), gda = () => (gd() ? gd().querySelector('.gd-a').textContent : '');
    const camSet = (events, cn) => {
      const v = camjValid(events ? { schema: 'cam-events/1', events, coverage: [{ from: Date.now() - 30*HOUR, to: Date.now() }], door_spans: [] } : null);
      CAMJ.ev0 = v.ev; CAMJ.cov = v.cov; CAMJ.doors = v.doors; CAMJ.ready = !!events; CAMJ.fb = {}; CAMJ.fbLocal = {}; CAMJ.sev = []; CAMJ.sready = false; camjMerge();
      CAMS.status = cn ? { checked_at: Date.now() - 30000, crate_now: { status: cn, capture_ts: Date.now() - 30000 } } : null; setState(state); render(); };
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts, source: 'live_model', confidence: 0.95, status: 'active', model_version: 't', ...o });
    for(const phone of [true, false]){
      reset(); FAKE_PHONE = phone; const now = Date.now(), tag = (phone ? 'phone' : 'desktop') + (V2 ? ' v2' : ' v1') + ': ';
      // (release 6b: a stage older than ROUTINE_STALE (90 min) is "stale" — tested in staleroutine.js; here the stages are younger)
      const base = [{ ...K0, k:'crate', t: now - 2*HOUR, end: now - 80*MIN }, { ...K0, k:'pee', t: now - 78*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 70*MIN, m:'meal' }];
      // A. awake, out, the plan fits: the trainer's words as before, no extra line
      camSet(null, null); seed([{ ...K0, k:'crate', t: now - 2*HOUR, end: now - 20*MIN }, { ...K0, k:'pee', t: now - 15*MIN, w:'gravel' }]);
      let log0 = JSON.stringify(state.log), cs = currentState(p);
      ok(tag + 'A. awake out of the crate (inferred from the pee 15 min ago): "זמן משחק" as before, no planned / actual line', cs.state === 'out' && cs.basis === 'inferred' && cs.awake && guidance(p).mode === 'plan' && what().includes('זמן משחק') && !gd());
      // B. a "play" step with nothing since 70 minutes ago (past the 45-min horizon, under ROUTINE_STALE) → unknown; the stage stays, the words are conditional
      seed(base); cs = currentState(p);
      ok(tag + 'B. stale step: unknown, basis none', cs.state === 'unknown' && cs.basis === 'none' && !cs.conflicts.length);
      { const r = routine(p); ok(tag + 'B. planned stage unchanged by the gap (no skip, no repeat): ' + JSON.stringify({ i: r.i, next: r.next }), r.i === 4 && r.next === 0 && !r.done);
        ok(tag + 'B. "לא נרשם אם עשתה צרכים אחרי האוכל", the instruction after "אם היא ערה ומחוץ לכלוב:"', what().includes('לא ידוע אם קישמיש ערה, ישנה או בכלוב') && what().includes('לא נרשם אם עשתה צרכים אחרי האוכל') && what().indexOf('אחרי האוכל מוציאים') > what().indexOf('אם היא ערה ומחוץ לכלוב') && gd().querySelector('.gd-p').textContent.startsWith('בשגרה: צרכים')); }
      // the play step itself (pee, no meal yet), stale
      seed([{ ...K0, k:'crate', t: now - 2*HOUR, end: now - 80*MIN }, { ...K0, k:'pee', t: now - 75*MIN, w:'gravel' }]);
      ok(tag + 'B. stale play: never a bare "זמן משחק"', routine(p).i === 2 && what().indexOf('זמן משחק') > what().indexOf('אם היא ערה ומחוץ לכלוב') && what().includes('לא נרשם אם שיחקה או אכלה') && routineTap(p).join() === 'play,food');
      ok(tag + 'B. nothing written', state.log.length === 2);
      // C. fresh camera occupancy overrides the stale "play" (occupancy only); a voluntary visit starts no cycle
      const r0 = JSON.stringify(routine(p)), n0 = roundStarts(p).length; log0 = JSON.stringify(state.log);
      camSet([E('c1', 'crate_entry', now - 4*MIN)], 'positive'); cs = currentState(p);
      ok(tag + 'C. fresh positive + a live entry: in_crate, camera-unconfirmed, fresh', cs.state === 'in_crate' && cs.basis === 'camera-unconfirmed' && cs.fresh && cs.since === now - 4*MIN);
      ok(tag + 'C. "בשגרה: משחק" · "בפועל: נראית בכלוב … לפי המצלמה, לא אושר"; box: if she sleeps, leave her; approve in the crate card', gd().querySelector('.gd-p').textContent.startsWith('בשגרה: משחק') && gda().includes('נראית בכלוב מ־') && gda().includes('לפי המצלמה, לא אושר') && what().includes('אם היא בכלוב ונרדמה, אפשר להשאיר אותה') && what().includes('לענות לשאלה מהמצלמה') && $q('.nowtop .nt-c [data-camans]') && !what().includes('זמן משחק'));
      ok(tag + 'C. the camera never advances the routine, adds no round, writes nothing', JSON.stringify(routine(p)) === r0 && roundStarts(p).length === n0 && JSON.stringify(state.log) === log0);
      camSet([], 'positive'); cs = currentState(p);
      ok(tag + 'C. a fresh positive reading alone (a visit already answered): "נראית בכלוב עכשיו", still no cycle', cs.state === 'in_crate' && cs.src === 'now' && gda().includes('נראית בכלוב עכשיו') && JSON.stringify(routine(p)) === r0 && roundStarts(p).length === n0);
      // the camera entry after a door-open visit decision: no session, no cycle
      camSet([E('c2', 'crate_entry', now - 6*MIN)], null); CAMJ.fbLocal['c2'] = { d: 'visit', at: now - 5*MIN }; setState(state); render();
      ok(tag + 'C. a visit decision: no pending entry, no cycle, nothing written', !camjPendingEntry() && JSON.stringify(routine(p)) === r0 && roundStarts(p).length === n0 && JSON.stringify(state.log) === log0);
      // D. conflict: the journal has her at the gravel, the camera has her in the crate → unknown, both shown
      camSet(null, null); seed([{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 2*HOUR }, { ...K0, k:'gravel', t: now - 12*MIN }]);
      camSet([E('c3', 'crate_entry', now - 5*MIN)], 'positive'); cs = currentState(p);
      ok(tag + 'D. gravel running + camera in the crate: unknown, both in conflicts, occupancy from the fresh camera', cs.state === 'unknown' && cs.conflicts.length === 2 && cs.conflicts[0].src === 'journal' && cs.conflicts[0].what === 'gravel' && cs.conflicts[1].src === 'camera' && cs.occ === 'in');
      ok(tag + 'D. both shown: "ברישום: בחצץ … · המצלמה: בכלוב … (לא אושר)"; the box says they disagree', guidance(p).mode === 'unknown' && gda().includes('ברישום: בחצץ') && gda().includes('המצלמה: בכלוב') && gda().includes('לא אושר') && what().includes('הרישום והמצלמה לא מסכימים'));
      camSet(null, null); seed([{ ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }]);
      camSet([], 'negative'); cs = currentState(p);
      ok(tag + 'D. a crate session logged (with the app\'s assumed sleep in it) + the camera reads her outside now: unknown, both shown, occupancy "out"; the journal untouched', cs.state === 'unknown' && cs.occ === 'out' && cs.conflicts.map(c => c.src + ':' + c.state).join() === 'journal:in_crate,camera:out' && actualText(cs).includes('ברישום: בכלוב') && $q('.nowtop .nt-a').textContent.includes('המצלמה: לא בכלוב') && camjConflict().includes('המצלמה לא רואה אותה בכלוב') && !!K().crate.start);
      // E. planned play, she falls asleep (marked, outside the crate) → rest; never "wake her to play"
      camSet(null, null); seed([{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 40*MIN }, { ...K0, k:'pee', t: now - 38*MIN, w:'gravel' }, { ...K0, k:'sleep', t: now - 20*MIN }]); cs = currentState(p);
      ok(tag + 'E. asleep by her mark during the play step: rest, "נותנים לה לישון … ממשיכים בשגרה מ״משחק״"', routine(p).i === 2 && cs.state === 'asleep' && cs.basis === 'logged' && guidance(p).mode === 'rest' && what().includes('נותנים לה לישון') && what().includes('ממשיכים בשגרה מ״משחק״') && !what().includes('זמן משחק') && !/להעיר/.test(what()));
      // …she went into the open crate herself and slept there (camera, her approval → a cam: sleep entry, no session)
      seed([{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 40*MIN }, { ...K0, k:'pee', t: now - 38*MIN, w:'gravel' }, { ...K0, id:'cam:sug:t', k:'sleep', t: now - 15*MIN, cam:{ src:'live_model', conf:1 } }]); cs = currentState(p);
      ok(tag + 'E. a camera-confirmed sleep in a visit: rest, basis camera-confirmed, no new round', cs.basis === 'camera-confirmed' && guidance(p).mode === 'rest' && gda().includes('מהמצלמה, אושר') && roundStarts(p).length === 1 && routine(p).i === 2);
      // safety stays: asleep past wake-by (meal 3.5 h ago) → "כדאי להעיר" as before, guidance steps aside
      seed([{ ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'crate', t: now - 3*HOUR, end: now - 40*MIN }, { ...K0, k:'pee', t: now - 38*MIN, w:'gravel' }, { ...K0, k:'sleep', t: now - 20*MIN }]);
      ok(tag + 'E. past wake-by: the safety rule speaks ("כדאי להעיר"), guidance does not', wakeBy(p).past && guidance(p).mode === 'plan' && what().includes('כדאי להעיר את קישמיש'));
      // F. the three red alerts: same presence and wording — when the time since each event is OBSERVED (release 6b: a
      // play entry every 40 min keeps her documented awake; without it the cards are calm, tested in coverage.js)
      seed([{ ...K0, k:'poop', t: now - 49*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 49*HOUR + MIN, end: now - 7*HOUR - MIN }, { ...K0, k:'pee', t: now - 7*HOUR, w:'gravel' },
        { ...K0, k:'crate', t: now - 7*HOUR + MIN, end: now - 40*MIN }, { ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'play', y:'rope', t: now - 30*MIN }]);
      ok(tag + 'F. the three alerts, release-5 wording', JSON.stringify(alerts(p).map(a => [a.k, a.text, a.hint])) === JSON.stringify([['food', 'עברו ' + words(4*HOUR) + ' מאז האוכל האחרון', 'הגיע הזמן להציע לה אוכל.'], ['pee', words(7*HOUR) + ' בלי פיפי', 'לשקול להתקשר לווטרינר.'], ['poop', wordsLong(49*HOUR) + ' בלי קקי', 'לשקול להתקשר לווטרינר.']]) && $n('.alertc') === 3);
      seed([{ ...K0, k:'food', t: now - 3*HOUR - 20*MIN, m:'meal' }]);
      ok(tag + 'F. 3:20 after a meal: no food alert (threshold 3.5 h unchanged)', !alerts(p).length);
      // G. expired pee window: "החלון עבר (A–B) · לא נרשם פיפי", line and bar
      { const L = []; for(let i = 8; i >= 1; i--) L.push({ ...K0, k:'pee', t: now - 20*HOUR - i*90*MIN, w:'gravel' }); L.push({ ...K0, k:'pee', t: now - 4*HOUR, w:'gravel' });
        L.push({ ...K0, k:'crate', t: now - 4*HOUR + MIN });   // logged in the crate since: the time after the pee is observed
        seed(L); const f = peeForecast(p), c = $q('.card [data-act=pt][data-k=pee]').closest('.card'), want = `החלון עבר (${clock(f.from)}–${clock(f.to)}) · לא נרשם פיפי`;
        ok(tag + 'G. a passed pee window: ' + want, f.state === 'late' && c.textContent.includes(want) && !c.textContent.includes('היה צפוי'));
        if(V2) ok(tag + 'G. …the bar says the same, drawn as past', c.querySelector('.gauge.past small').textContent === want); }
      // H. the night potty routine is separate and unchanged
      FAKE_HOUR = 2; nightFull = true; seed([{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 14*MIN }, { ...K0, k:'pee', t: now - 12*MIN, w:'gravel' }]);
      ok(tag + 'H. night potty: the night step, guidance steps aside, no planned / actual line', routine(p).night && guidance(p).mode === 'plan' && !gd() && what().includes('לילה'));
      FAKE_HOUR = 12; nightFull = false; camSet(null, null);
      // I. Kochik
      pet = 'kochik'; render(); ok(tag + 'I. Kochik: no planned / actual line, guidance plan', !gd() && !$q('.gd') && guidance('kochik').mode === 'plan'); pet = 'kishmish'; render();
    }
    done();
  } catch(e){ crashed(e); }
})();
