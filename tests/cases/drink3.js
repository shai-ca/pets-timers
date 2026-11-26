// v3 validation (Agent F): Kishmish's drink ends the crate stay and the sleep at its own time and starts no cycle step,
// no "ישר לחצץ", no take-out reminder, no retry — by day and at night (the night screen stays). Kochik: a drink ends a
// marked sleep. The slim night screen carries no advice line.
(async function(){
  const RealDate = Date, real0 = RealDate.now();
  const d0 = new RealDate(real0); d0.setDate(d0.getDate() - 1); d0.setHours(13, 0, 0, 0);
  const T0 = d0.getTime();
  class FakeDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(T0 + (RealDate.now() - real0)); } static now(){ return T0 + (RealDate.now() - real0); } }
  window.Date = FakeDate;
  try {
    const now = Date.now(), K0 = {p:'kishmish'}, P = 'kishmish';
    const L = night => (night ? [] : [{...K0, k:'food', t: now - 90*MIN, m:'meal'}]).concat([{...K0, k:'pee', t: now - 80*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 75*MIN}, {...K0, k:'sleep', t: now - 65*MIN}]);
    for(const night of [false, true]){
      reset(); if(night) FAKE_HOUR = 2;
      seed(L(night)); await wait();
      $q('#main [data-act=pt][data-k=water]').click(); await wait(2);
      const w = logOf(P, 'water')[0], c = logOf(P, 'crate')[0], s = logOf(P, 'sleep')[0], tag = night ? 'night' : 'day';
      ok(tag + ': the drink ends the crate stay and the sleep at its own time', !!w && c.end === w.t && s.end === w.t);
      ok(tag + ': no cycle step, no potty tiles tagged', routineTap(P).length === 0 && (!routine(P) || routine(P).i !== 1));
      ok(tag + ': no "ישר לחצץ", no take-out reminder, no retry, no "זמן טוב לנסות" after it', !napWake(P) && !pottyDue(P) && !retry(P) && !tryNow(P) && !($q("#side").textContent + $q("#main").textContent).includes("ישר לחצץ"));
      if(night) ok('night: the night screen stays, with no advice line', !!$q('.nightc') && !$q('.card.advice'));
    }
    reset('shai', 'kochik'); seed([{p:'kochik', k:'sleep', t: now - 30*MIN}]);
    $q('#main [data-act=pt][data-k=water]').click(); await wait(2);
    ok('Kochik: a drink ends her marked sleep', logOf('kochik', 'sleep')[0].end === logOf('kochik', 'water')[0].t);
    done();
  } catch(e){ crashed(e); } finally { window.Date = RealDate; }
})();
