// Owner, 28.11: after unsuccessful NIGHT potty attempts she may safely go back to sleep — the retry cycle must not demand
// a pee indefinitely. At night (NIGHTS.screen, by the attempt's own hour) the cycle ends after RETRY.nightMax
// unsuccessful attempts; by day it continues as before. The safety alerts are unchanged.
(async function(){
  try {
    const p = 'kishmish', K = { p };
    const day = async hour => { reset(); FAKE_HOUR = hour; const T = Date.now();
      seed([{ ...K, k:'pee', t: T - 4*HOUR, w:'gravel' }, { ...K, k:'none', t: T - 30*MIN }, { ...K, k:'crate', t: T - 30*MIN + 1, end: T - 18*MIN }]); render(); await wait(2);
      const one = retry(p);
      seed([{ ...K, k:'pee', t: T - 4*HOUR, w:'gravel' }, { ...K, k:'none', t: T - 30*MIN }, { ...K, k:'crate', t: T - 30*MIN + 1, end: T - 18*MIN }, { ...K, k:'none', t: T - 17*MIN }, { ...K, k:'crate', t: T - 17*MIN + 1 }]); render(); await wait(2);
      return { one, two: retry(p), alerts: alerts(p).map(a => a.k).join(',') }; };
    const n = await day(2);
    ok('night, one unsuccessful attempt: the retry runs (one more try)', !!n.one);
    ok('night, a second unsuccessful attempt: the cycle ends — back to sleep, no further "לחצץ" prompt', !n.two && !$q('#side').textContent.includes('לנסות שוב בעוד'));
    const d = await day(12);
    ok('day, the same two attempts: the retry continues as before', !!d.one && !!d.two);
    ok('safety alerts unchanged by the night rule: the same as by day, minus the food alert that is silent at night by design (' + n.alerts + ' / ' + d.alerts + ')', n.alerts === d.alerts.split(',').filter(k => k && k !== 'food').join(','));
    FAKE_HOUR = 12; done();
  } catch(e){ crashed(e); }
})();
