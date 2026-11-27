// Release 6b, items 1, 2, 4, 6, 7 — one decider, a stale stage, honest last-recorded times, sleep as an estimate, the
// three answers at the top. Phone and desktop, both designs (build.py), both clocks.
// 1. The preview said "המצלמה רואה אותה בכלוב מ־18:55" (the advice line read the pending live entry directly) next to
//    "בפועל: לא בכלוב · לפי המצלמה" (currentState preferred the camera's fresh negative reading). Now `currentState`
//    decides and every line renders it: a pending entry + a later fresh negative = UNKNOWN, the camera against itself.
(async function(){
  try {
    const p = 'kishmish', K0 = { p };
    const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts, source: 'live_model', confidence: 0.95, status: 'active', model_version: 't', ...o });
    const camSet = (events, cn, cnAgo = 30000) => {
      const v = camjValid(events ? { schema: 'cam-events/1', events, coverage: [{ from: Date.now() - 30*HOUR, to: Date.now() }], door_spans: [] } : null);
      CAMJ.ev0 = v.ev; CAMJ.cov = v.cov; CAMJ.doors = v.doors; CAMJ.ready = !!events; CAMJ.fb = {}; CAMJ.fbLocal = {}; CAMJ.sev = []; CAMJ.sready = false; camjMerge();
      CAMS.status = cn ? { checked_at: Date.now() - 20000, crate_now: { status: cn, capture_ts: Date.now() - cnAgo } } : null; setState(state); render(); };
    const top = () => ($q('.nowtop') || {}).textContent || '', gda = () => { const g = $q('.card.cyc .gd .gd-a'); return g ? g.textContent : ''; };
    for(const phone of [true, false]){
      reset(); FAKE_PHONE = phone; const now = Date.now(), tag = (phone ? 'phone' : 'desktop') + (V2 ? ' v2' : ' v1') + ': ';
      // ---- 1. one decider ----
      const base = [{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 2*HOUR }, { ...K0, k:'pee', t: now - 118*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 70*MIN, m:'meal' }];
      seed(base); camSet([E('e1', 'crate_entry', now - 5*MIN)], 'negative', 40000);
      let cs = currentState(p);
      ok(tag + '1. pending entry + a later fresh negative: unknown, the camera against itself (no journal side)', cs.state === 'unknown' && cs.conflicts.length === 2 && cs.conflicts.every(c => c.src === 'camera') && !cs.occ);
      const lines = [top(), gda(), camjConflict(), actualText(cs)];
      ok(tag + '1. every line says the same: "לא ברור", nobody says "רואה אותה בכלוב"', lines.every(x => !/רואה אותה בכלוב מ|נראית בכלוב/.test(x)) && top().includes('לא ברור') && gda().includes('לא ברור') && camjConflict().includes('לא ברור'));
      camSet([E('e1', 'crate_entry', now - 5*MIN)], 'positive');
      cs = currentState(p);
      ok(tag + '1. + a fresh positive: in the crate (camera, unconfirmed) on every line', cs.state === 'in_crate' && cs.fresh && top().includes('נראית בכלוב') && gda().includes('נראית בכלוב') && camjConflict().includes('המצלמה רואה אותה בכלוב'));
      camSet(null, null); camSet([E('e1', 'crate_entry', now - 7*MIN)], 'uncertain');
      ok(tag + '1. an entry 7 min ago + only an uncertain reading (IR = no evidence): "זיהתה כניסה … עכשיו לא ברור" everywhere', currentState(p).state === 'in_crate' && !currentState(p).fresh && top().includes('עכשיו לא ברור') && camjConflict().includes('עכשיו לא ברור'));
      // the camera session's 18:55 case: a NEGATIVE published after the entry but captured BEFORE it cannot contradict it;
      // an older capture written later (two interleaved publishers) never replaces a newer one
      camSet(null, null); camSet([E('e2', 'crate_entry', now - 3*MIN)], 'negative', 3*MIN + 30000);
      ok(tag + '1. a negative captured 30 s before the entry: no contradiction — in the crate (camera)', currentState(p).state === 'in_crate' && !currentState(p).conflicts.length && !camjConflict().startsWith('לא ברור'));
      CAMS.status = { checked_at: now - 10000, crate_now: { status: 'positive', capture_ts: now - 60000 } }; camCN();
      CAMS.status = { checked_at: now - 5000, crate_now: { status: 'negative', capture_ts: now - 4*MIN } }; render();
      ok(tag + '1. monotonic: an older capture written later is ignored (still in)', camCN().status === 'positive' && camCN().capture_ts === now - 60000 && currentState(p).state === 'in_crate');
      camSet([E('e2', 'crate_entry', now - 3*MIN)], 'positive');
      // ---- 7. layout: alerts, then the three answers; the rings after the wheel and the sleep / cry tiles ----
      const side = [...$q('#side').children].map(x => x.className);
      ok(tag + '7. the top card is first (no alert now); the rings come after the sleep / cry tiles', /nowtop/.test(side[0]) && (!V2 || side.findIndex(c => /scores/.test(c)) > side.findIndex(c => /duo/.test(c))));
      ok(tag + '7. three rows: עכשיו / מה לעשות / מהמצלמה', $q('.nowtop .nt-a') && $q('.nowtop .nt-b') && $q('.nowtop .nt-c [data-camans]') && !$q('#side .card.slim.advice'));
      camSet(null, null);
      // ---- 2. a stale planned stage ----
      seed(base.map(e => e.k === 'food' ? { ...e, t: now - 100*MIN } : e));
      let g = guidance(p);
      ok(tag + '2. stage "צרכים" logged 100 min ago, nothing since: stale; the routine itself unchanged', g.mode === 'stale' && routine(p).i === 4 && !routine(p).done);
      ok(tag + '2. the wheel: "השלב האחרון שנרשם: צרכים", never "בשגרה: צרכים"; the step drawn as history, no "next"', $q('.card.cyc .gd .gd-p').textContent.startsWith('השלב האחרון שנרשם: צרכים') && $q('.card.cyc .rc').textContent.includes('השלב האחרון שנרשם') && $n('.card.cyc .sg.cur.stale') === 1 && !$q('.card.cyc .sg.nxt'));
      ok(tag + '2. the words follow the current state: check her, gravel first, never claims the stage happened or not', /קודם לחצץ/.test($q('.card.cyc .cyc-n').textContent) && !$q('.card.cyc .cyc-n').textContent.includes('אחרי האוכל מוציאים') && !/לא עשתה צרכים|עשתה צרכים אחרי/.test($q('.card.cyc .cyc-n').textContent) && top().includes('לבדוק מה היא עושה'));
      seed(base.map(e => e.k === 'food' ? { ...e, t: now - 80*MIN } : e));
      ok(tag + '2. 80 min (under ROUTINE_STALE = 90): not stale, the conditional words as before', guidance(p).mode === 'unknown' && $q('.card.cyc .gd .gd-p').textContent.startsWith('בשגרה: צרכים'));
      seed([...base.map(e => e.k === 'food' ? { ...e, t: now - 100*MIN } : e), { ...K0, k:'play', y:'rope', t: now - 10*MIN }]);
      ok(tag + '2. a sign 10 min ago supports the stage: not stale', guidance(p).mode !== 'stale');
      seed([...base.map(e => e.k === 'food' ? { ...e, t: now - 100*MIN } : e), { ...K0, k:'sleep', t: now - 60*MIN }]);
      ok(tag + '2. asleep (marked) on a stale stage: rest — no waking; "כשתתעורר, קודם לחצץ"', guidance(p).mode === 'rest' && guidance(p).what.includes('קודם לחצץ') && !/להעיר/.test(guidance(p).what));
      // ---- 4. last-recorded times ----
      seed([{ ...K0, k:'crate', t: now - 6*HOUR, end: now - 5*HOUR }, { ...K0, k:'pee', t: now - 5*HOUR + MIN, w:'gravel' }, { ...K0, k:'food', t: now - 5*HOUR + 5*MIN, m:'meal' }, { ...K0, k:'poop', t: now - 5*HOUR + 8*MIN, w:'gravel' }]);
      const card = k => $q('.card [data-act=pt][data-k=' + k + ']').closest('.card');
      ok(tag + '4. unobserved since: "פיפי אחרון שנרשם" + the time, "לא תועד מאז", no running clock', card('pee').querySelector('.lbl').textContent === 'פיפי אחרון שנרשם' && !card('pee').querySelector('.big[data-since]') && card('pee').textContent.includes('לא תועד מאז') && card('pee').querySelector('.big').textContent.trim() === clock(now - 5*HOUR + MIN));
      ok(tag + '4. food and poop the same', card('food').querySelector('.lbl').textContent === 'ארוחה אחרונה שנרשמה' && !card('food').querySelector('.big[data-since]') && card('poop').querySelector('.lbl').textContent === 'קקי אחרון שנרשם');
      ok(tag + '4. the passed pee window: "לא תועד מאז, לא ידוע אם עשתה פיפי", no late colour', card('pee').textContent.includes('לא ידוע אם עשתה פיפי') && !card('pee').querySelector('.fc.late'));
      seed([{ ...K0, k:'crate', t: now - 6*HOUR, end: now - 5*HOUR }, { ...K0, k:'pee', t: now - 5*HOUR + MIN, w:'gravel' }, { ...K0, k:'food', t: now - 5*HOUR + 5*MIN, m:'meal' }, { ...K0, k:'crate', t: now - 5*HOUR + 10*MIN, end: now - 20*MIN }, { ...K0, k:'play', y:'rope', t: now - 15*MIN }]);
      ok(tag + '4. observed since (logged crate stay, then play): the running clock stays', card('pee').querySelector('.big[data-since]') && card('pee').querySelector('.lbl').textContent !== 'פיפי אחרון שנרשם');
      // the camera's coverage counts: unlogged, but the camera saw her in the crate the whole time
      seed([{ ...K0, k:'crate', t: now - 3*HOUR, end: now - 2*HOUR }, { ...K0, k:'pee', t: now - 2*HOUR + MIN, w:'gravel' }]);
      camSet([E('s1', 'crate_entry', now - 2*HOUR + 10*MIN), E('s1x', 'crate_exit', now - 5*MIN)], null);
      ok(tag + '4. covered by the camera (a crate stay it saw, inside its coverage): the clock stays', coveredSince(p, K().pee) && card('pee').querySelector('.big[data-since]'));
      camSet(null, null);
      // ---- 6. sleep as an estimate ----
      seed([{ ...K0, k:'crate', t: now - 10*HOUR, end: now - 6*HOUR }, { ...K0, k:'sleep', t: now - 10*HOUR + 5*MIN, end: now - 6*HOUR - 5*MIN }, { ...K0, k:'pee', t: now - 6*HOUR, w:'gravel' }]);
      const s = scores(p), st = $q('#sec-rest').textContent;
      ok(tag + '6. "שינה מוערכת … · H:MM לא תועדו"; never "לפחות", never "נספרה שינה של"', st.includes('שינה מוערכת') && st.includes(hmm(s.unk) + ' לא תועדו') && !st.includes('לפחות') && !st.includes('נספרה שינה של'));
      ok(tag + '6. much unknown time: the range is "unknown", not "below"', s.range === 'unknown' && (!V2 || st.includes('לא ידוע אם בטווח הגיל')));
      if(V2) ok(tag + '6. the bar draws the unknown share (hatched)', !!$q('#sec-rest .gauge.goal .gu'));
      ok(tag + '6. nothing written by any of this', state.log.length === 3);
    }
    done();
  } catch(e){ crashed(e); }
})();
