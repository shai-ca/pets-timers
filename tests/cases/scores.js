// Sleep / readiness / gravel rings (new design): the numbers follow the stated formulas.
(async function(){
  // runs on a fake clock at yesterday 13:00 (moving forward in real time), so its "last 24 hours" and "today" never straddle midnight
  const RealDate = Date, real0 = RealDate.now(), d0 = new RealDate(real0); d0.setDate(d0.getDate() - 1); d0.setHours(13, 0, 0, 0);
  const T0 = d0.getTime();
  class FakeDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(T0 + (RealDate.now() - real0)); } static now(){ return T0 + (RealDate.now() - real0); } }
  window.Date = FakeDate;
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'};
    const n0 = new Date(now); n0.setHours(0, 0, 0, 0); n0.setHours(-2); if(now < n0.getTime() + 8*HOUR) n0.setDate(n0.getDate() - 1);
    const N = n0.getTime();
    // 9 hours of sleep: last night 22:00–05:00 in one stretch (7 h), and 2 h in two 1-hour naps; awake 30 min now
    const L = [{...K0, k:'sleep', t: N, end: N + 7*HOUR}, {...K0, k:'sleep', t: now - 4*HOUR, end: now - 3*HOUR}, {...K0, k:'sleep', t: now - 90*MIN, end: now - 30*MIN},
      {...K0, k:'pee', t: now - 20*MIN, w:'gravel'}, {...K0, k:'pee', t: now - 200*MIN, w:'gravel'}, {...K0, k:'poop', t: now - 100*MIN, w:'pad'}, {...K0, k:'pee', t: now - 300*MIN, w:'gravel'}];
    seed(L.filter(e => e.t + (e.end ? 0 : 0) > now - 24*HOUR || e.k === 'sleep'));
    const s = scores('kishmish');
    const inDay = Math.min(7*HOUR, N + 7*HOUR - Math.max(N, now - 24*HOUR)) + 2*HOUR;
    ok('sleep total is the last 24 hours', Math.abs(s.total - inDay) < 1000);
    ok('the sleep score adds up its three parts', s.sleep === Math.round(Math.min(1, s.total / (18*HOUR))*50 + Math.min(1, s.avg / HOUR)*25 + Math.min(1, s.night / (7*HOUR))*25));
    ok('readiness: 100 − 30 minutes awake − 10 per missing hour (up to 40)', s.ready === Math.max(0, Math.round(100 - 30 - Math.min(40, (18*HOUR - s.total) / HOUR * 10))));
    ok('gravel: 3 of 4 on the gravel = 75', s.gravel === 75 && s.good === 3 && s.all === 4);
    V2 = true; render();
    ok('three rings right above the routine (urgent cards stay first)', !!$q('#side > .card.scores + .card.cyc') && $n('.scores .scr') === 3 && $q('.scores').textContent.includes('75'));
    $q('[data-act=scores]').click();
    ok('tapping explains how each is worked out', bg.classList.contains('show') && sh.textContent.includes('מתוך 18 שעות') && sh.textContent.includes('3 מתוך 4'));
    close();
    seed(L.concat([{...K0, k:'sleep', t: now - 5*MIN}]));
    ok('asleep: no readiness number', scores('kishmish').ready === null && $q('.scores').textContent.includes('ישנה עכשיו'));
    V2 = false; render();
    ok('old design: no rings', !$q('.scores'));
    pet = 'kochik'; V2 = true; render();
    ok('Kochik: no rings (no sleep goal at her age)', !$q('.scores'));
    V2 = false;
    done();
  } catch(e){ crashed(e); } finally { window.Date = RealDate; }
})();
