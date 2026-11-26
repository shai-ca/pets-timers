// Sleep / readiness / gravel rings (owner, 26.11): no reward for crate time or sleep length, no penalty for being awake.
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
    ok('all of it marked: observed = total, estimated 0', Math.abs(s.marked - s.total) < 1000 && s.est === 0);
    ok('no 0–100 sleep score and no readiness number (owner, 26.11)', s.sleep === undefined && s.ready === null);
    ok('the age range is information: below 18 h here', s.range === 'below' && s.g === 18 && s.top === 20);
    ok('gravel: 3 of 4 on the gravel = 75', s.gravel === 75 && s.good === 3 && s.all === 4);
    // awake time, play, the carrier, the pen change nothing in the rings
    const ringsTxt = () => { render(); return $q('.scores').textContent; };
    V2 = true; render();
    ok('three rings right above the routine (urgent cards stay first)', !!$q('#side > .card.scores + .card.cyc') && $n('.scores .scr') === 3 && $q('.scores').textContent.includes('75'));
    ok('sleep ring: observed and estimated apart, neutral colour; readiness: "אין מספיק נתונים"', $q('.scores').textContent.includes('נצפה ' + hmm(s.marked)) && $q('.scores').textContent.includes('משוער 0:00')
      && $q('.scores .scr').className.trim() === 'scr' && $q('.scores').textContent.includes('אין מספיק נתונים'));
    const before = ringsTxt();
    seed(L.concat([{...K0, k:'play', t: now - 10*MIN, y:'train'}, {...K0, k:'carrier', t: now - 8*MIN, end: now - 3*MIN}, {...K0, k:'pen', t: now - 2*MIN}]));
    ok('play, training, the carrier and the pen: the rings do not move', ringsTxt() === before);
    $q('[data-act=scores]').click();
    ok('tapping explains: observed / estimated, range as information, night hours from NIGHTS.score', bg.classList.contains('show') && sh.textContent.includes('לא יעד') && sh.textContent.includes('3 מתוך 4')
      && sh.textContent.includes(pad(NIGHTS.score.from) + ':00–' + pad(NIGHTS.score.to) + ':00') && !sh.textContent.includes('7 שעות') && sh.textContent.includes('אין מספיק נתונים'));
    close();
    // quiet crate time is not sleep unless estimated, and an estimate is listed as estimated
    seed([{...K0, k:'crate', t: now - 60*MIN, end: now - 10*MIN}]);
    const e = scores('kishmish');
    ok('an estimated sleep in the crate counts as "משוער", not observed', e.est > 0 && e.marked === 0 && e.total === e.est);
    seed([{...K0, k:'crate', t: now - 60*MIN, end: now - 10*MIN, ns: 1}]);
    ok('quiet crate time with "לא ישנה": no sleep at all', scores('kishmish').total === 0);
    seed(L.concat([{...K0, k:'sleep', t: now - 5*MIN}]));
    ok('asleep: still no readiness number', scores('kishmish').ready === null && $q('.scores').textContent.includes('אין מספיק נתונים'));
    V2 = false; render();
    ok('old design: no rings', !$q('.scores'));
    pet = 'kochik'; V2 = true; render();
    ok('Kochik: no rings (no sleep goal at her age)', !$q('.scores'));
    V2 = false;
    done();
  } catch(e){ crashed(e); } finally { window.Date = RealDate; }
})();
