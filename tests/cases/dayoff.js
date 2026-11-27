// ACCEPTANCE (owner's safeguards, release 6b): she stops manual logging for a whole day. A synthetic day: the night in
// the crate (marked sleep), morning entries until 08:00, then NOTHING manual for 16 h; the camera publishes all day
// (coverage, 21 live crate entries / 22 exits incl. a duplicate entry and a model-switch flap, three eating
// suggestions) and nobody answers it. Checked at 09:30, 12:00, 15:00, 18:00, 21:30 and 23:30 (each checkpoint = the day
// moved so that it is "now"; only what existed by then is shown). The app must stay COHERENT (one state on every line),
// USEFUL (the three answers present), HONEST (no running clock across unobserved time, no red alarm from missing
// records, no "awake N h"), and keep the visible camera queue at CAMJ_QMAX (3) or less with one question on screen.
(async function(){
  try {
    const p = 'kishmish', K0 = { p }, stats = [];
    const day = () => {
      const L = [], e = (k, a, b, x) => L.push({ ...K0, k, t: a, ...(b != null ? { end: b } : {}), ...(x || {}) }), H = h => h*HOUR;
      e('crate', H(-1.5), H(6.5)); e('sleep', H(-1.3), H(6.4));
      e('gravel', H(6.52), H(6.57)); e('pee', H(6.53), null, { w:'gravel' }); e('poop', H(6.55), null, { w:'gravel', q:'ok' });
      e('food', H(6.75), null, { m:'meal' }); e('play', H(7), null, { y:'rope' }); e('crate', H(7.33), H(7.9)); e('gravel', H(7.92), H(7.97)); e('pee', H(7.95), null, { w:'gravel' });
      // the camera: [entry, exit] in hours; 9.2 is a duplicate entry (no exit between); 14.0/14.03 a model-switch flap
      const st = [[8.5, 8.9], [9.15, 9.6], [10.0, 10.7], [10.75, 11.2], [11.5, 12.3], [12.6, 13.1], [13.4, 14.0], [14.04, 14.6], [15.0, 15.5], [15.8, 16.5],
        [16.9, 17.3], [17.6, 18.1], [18.4, 18.9], [19.2, 19.8], [20.1, 20.6], [20.9, 21.4], [21.7, 22.2], [22.6, 23.2], [23.4, null]];
      const ev = []; let n = 0; const E = (kind, ts, o) => ev.push({ event_id: 'z' + (n++), kind, ts: H(ts), lo: H(ts) - 30000, hi: H(ts), source: 'live_model', confidence: 0.93, status: 'active', model_version: 't', created_at: H(ts) + 90000, ...(o || {}) });
      for(const [a, b] of st){ E('crate_entry', a, a === 14.04 ? { model_switch: true } : null); if(a === 9.15) E('crate_entry', 9.2); if(b != null) E('crate_exit', b, b === 14.0 ? { model_switch: true } : null); }
      const sug = [10.25, 13.33, 16.67].map((h, i) => ({ id: 'sug_d' + i, kind: 'eating_suggestion', ts: H(h), lo: H(h) - 60000, hi: H(h), ir: false, status: 'active', created_at: H(h) + 120000 }));
      return { L, ev, sug, stays: st };
    };
    const D = day();
    for(const phone of [true, false]){
      reset(); FAKE_PHONE = phone; const tag0 = (phone ? 'phone' : 'desktop') + (V2 ? ' v2' : ' v1') + ' ';
      for(const ck of [9.5, 12, 15, 18, 21.5, 23.5]){
        const now = Date.now(), O = now - ck*HOUR, at = t => O + t, tag = tag0 + String(Math.floor(ck)).padStart(2, '0') + ':' + (ck % 1 ? '30' : '00') + ': ';
        FAKE_HOUR = Math.floor(ck); nightFull = ck >= 23;   // at night: "להציג הכול" so the full screen can be checked too
        seed(D.L.filter(e => e.t <= ck*HOUR).map(e => ({ ...e, t: at(e.t), ...(e.end != null ? (e.end <= ck*HOUR ? { end: at(e.end) } : { end: undefined }) : {}) })));
        const ev = D.ev.filter(e => e.created_at <= ck*HOUR).map(e => ({ ...e, ts: at(e.ts), lo: at(e.lo), hi: at(e.hi), created_at: at(e.created_at) }));
        const v = camjValid({ schema: 'cam-events/1', events: ev, coverage: [{ from: at(-2*HOUR), to: now - 20000 }], door_spans: [] });
        CAMJ.ev0 = v.ev; CAMJ.cov = v.cov; CAMJ.doors = v.doors; CAMJ.ready = true; CAMJ.fb = {}; CAMJ.fbLocal = {};
        CAMJ.sev = camjSugValid({ schema: 'cam-suggestions/1', enabled: true, suggestions: D.sug.filter(g => g.created_at <= ck*HOUR).map(g => ({ ...g, ts: at(g.ts), lo: at(g.lo), hi: at(g.hi) })), published_at: now - 60000 });
        CAMJ.sready = !!CAMJ.sev.length; CAMJ.sAt = now - 60000; camjMerge();
        const inNow = D.stays.some(([a, b]) => a*HOUR <= ck*HOUR - 60000 && (b == null || b*HOUR > ck*HOUR));
        CAMS.status = { checked_at: now - 20000, crate_now: { status: inNow ? 'positive' : 'negative', capture_ts: now - 30000, confidence: .9 } };
        setState(state); render();
        const cs = currentState(p), A = nowAssess(p), R = camjPlan(state.log, now).rv, top = $q('.nowtop');
        // COHERENT
        const want = actualText(cs).replace(/<[^>]+>/g, ''), a = top ? top.querySelector('.nt-a > span').textContent : '', w = ($q('.card.cyc .gd .gd-a') || {}).textContent || '', cf = camjConflict().replace(/<[^>]+>/g, '');
        const contra = cs.state === 'in_crate' ? /לא בכלוב|לא רואה אותה/.test(cf) : /(?<!לא )רואה אותה בכלוב|נראית בכלוב/.test(cf);
        ok(tag + 'coherent: one state (' + cs.state + '/' + cs.basis + ') on the top card, the wheel and the camera line', !!top && a.startsWith(want) && (!w || w === 'בפועל: ' + want) && !contra);
        ok(tag + 'coherent: the camera now ' + (inNow ? 'in' : 'out') + ' → state agrees', inNow ? cs.state === 'in_crate' || (cs.state === 'unknown' && cs.conflicts.length) : cs.state !== 'in_crate');
        // USEFUL
        ok(tag + 'useful: (a) and (b) answered', A.doing.length > 4 && A.todo.length > 4 && top.querySelector('.nt-b').textContent.length > 8);
        // HONEST
        const card = k => $q('.card [data-act=pt][data-k=' + k + ']').closest('.card');
        ok(tag + 'honest: no running clock on pee / food / poop across unobserved time', ['pee', 'food', 'poop'].every(k => coveredSince(p, K()[k]) || !card(k).querySelector('.big[data-since]')));
        ok(tag + 'honest: no red alarm from missing records', [...document.querySelectorAll('.alertc')].every(x => x.classList.contains('calm')) && alerts(p).every(a => a.calm));
        ok(tag + 'honest: no "awake N h" claim', !awakeFrom(p) && !$q('#sec-rest').textContent.includes('ערה כבר') && !/נראתה ערה כבר/.test($q('#sec-rest').textContent));
        ok(tag + 'honest: the routine stage is shown as history, not as now', ck < 10 || guidance(p).mode !== 'plan' || !routine(p) || routine(p).night || routine(p).i === 0 || routine(p).done);   // (no routine: the run's own midnight cut it)
        // NO BACKLOG
        ok(tag + 'queue: ' + (R.eps || []).length + ' visible (cap ' + CAMJ_QMAX + '), ' + (R.retired || []).length + ' retired, ' + (R.pending || []).length + ' raw pending; one question on screen', (R.eps || []).length <= CAMJ_QMAX && $n('.nowtop [data-camans="closed"]') <= 1 && $n('[data-camans="closed"]') <= 1 && Object.keys(CAMJ.fbLocal).length === 0);
        ok(tag + 'nothing written', !state.log.some(e => /^cam:/.test(e.id || '')) && state.log.length === D.L.filter(e => e.t <= ck*HOUR).length);
        if(phone && V2) stats.push(`${Math.floor(ck)}:${ck % 1 ? '30' : '00'} ${cs.state}/${cs.basis} q${(R.eps || []).length} r${(R.retired || []).length} p${(R.pending || []).length} alerts:${alerts(p).map(a => a.k + (a.calm ? '~' : '!')).join(',') || '-'} mode:${guidance(p).mode}`);
      }
      FAKE_HOUR = 12; nightFull = false;
    }
    done(stats.join(' | '));
  } catch(e){ crashed(e); }
})();
