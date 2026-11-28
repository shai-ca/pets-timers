// @clock 07:00
// Owner, 28.11 (real morning, times only): last confirmed pee 22:27; two unsuccessful night attempts at 02:20 and 02:35;
// a pee AND a poop in the crate somewhere between 02:35 and 06:44, found at 06:44 (interval-censored). Checked at 07:00.
// Asserts: no fabricated time; the clock is a range; alerts use the interval (not the found time, not the old pee);
// counted as an accident; never used as an exact time for intervals; the night reassessment card; nothing else written.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null;
    const p = 'kishmish', K = { p }, N = Date.now(), at = (h, m, dayBack = 0) => { const d = new Date(N); d.setDate(d.getDate() - dayBack); d.setHours(h, m, 0, 0); return d.getTime(); };
    const base = [{ ...K, k:'pee', t: at(19, 50, 1), w:'gravel' }, { ...K, k:'pee', t: at(22, 27, 1), w:'gravel' },
      { ...K, k:'none', t: at(2, 20) }, { ...K, k:'none', t: at(2, 35) }];
    seed(base); render();
    const gap0 = usualPeeGap(p, N);
    // before the accident is logged: two failed night attempts, last confirmed pee > 4 h before them → reassess earlier
    const r = nightRecheck(p);
    ok('night: 2 unsuccessful attempts → back to sleep (no retry), with an earlier check recommended 45 min after the last', !retry(p) && !!r && r.at === at(2, 35) + 45*MIN && r.due && !!$q('.recheck') && $q('.recheck').textContent.includes('כדאי לבדוק אותה עכשיו'));
    // she logs what she found: pee + poop in the crate, between 02:35 and 06:44, found 06:44
    seed(base.concat([{ ...K, k:'pee', t: at(6, 44), tu: [at(2, 35), at(6, 44)], w:'crate' }, { ...K, k:'poop', t: at(6, 44), tu: [at(2, 35), at(6, 44)], w:'crate' }])); render();
    ok('no fabricated time: the last KNOWN pee is still 22:27; the found time is not the occurrence', V[p].pee === at(22, 27, 1) && V[p].peeU && V[p].peeU.t === at(6, 44));
    const card = k => $q('.card [data-act=pt][data-k=' + k + ']').closest('.card');
    ok('pee clock is a RANGE: at least 0:16 (from 06:44), at most 4:25 (from 02:35); title says the time is unknown', !!card('pee').querySelector('.big.tu') && card('pee').querySelector('.big.tu [data-since="' + at(6, 44) + '"]') && card('pee').querySelector('.big.tu [data-since="' + at(2, 35) + '"]') && card('pee').textContent.includes('זמן לא ידוע'));
    ok('poop clock is a range too', !!card('poop').querySelector('.big.tu'));
    ok('alerts: none from the old 22:27 pee (8.5 h) — a confirmed pee lies in 02:35–06:44, within 6 h', !alerts(p).some(a => a.k === 'pee'));
    ok('…and the discovery time is shown as discovery ("נמצא ב־06:44")', $q('#sec-potty').textContent.includes('06:44'));
    { const s = successOf(p, sod(N).getTime(), Infinity); ok('counted as an accident: a miss in today\'s place counts, and a not-on-gravel pee in the success rate (' + s.good + '/' + s.all + ')', /פספוסים 1/.test(todayWhere(p, 'pee')) && /פספוסים 1/.test(todayWhere(p, 'poop')) && s.all === 1 && s.good === 0); }
    ok('never an exact time for the usual-gap estimate', usualPeeGap(p, N) === gap0);
    ok('the reassessment card is gone once the accident is logged (a pee is known to have happened after)', !nightRecheck(p));
    // 7 h later with nothing new: the interval decides — certain only when even 06:44 is 6 h ago
    const tu = tuNewer(p, 'pee');
    ok('the alert logic: possible (calm) between 6 h after 02:35 and 6 h after 06:44; certain (red) only after that', !!tu && tu.tu[0] === at(2, 35) && tu.tu[1] === at(6, 44));
    done();
  } catch(e){ crashed(e); }
})();
