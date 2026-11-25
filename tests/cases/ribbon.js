// "היום במבט אחד": sleep / awake in the crate / out add up to the time since midnight, and agree with the sleep card.
(async function(){
  try {
    reset();
    const now = Date.now(), a = midnight(), late = now - a > 400*MIN, K0 = {p:'kishmish'};
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{...K0, k:'crate', t: a - 60*MIN, end: a + 120*MIN}, {...K0, k:'sleep', t: a - 50*MIN, end: a + 100*MIN},
          {...K0, k:'pee', t: a + 121*MIN, w:'gravel'}, {...K0, k:'crate', t: a + 200*MIN, end: a + 260*MIN}, {...K0, k:'sleep', t: a + 210*MIN, end: a + 250*MIN},
          {...K0, k:'sleep', t: a + 300*MIN, end: a + 320*MIN}, {...K0, k:'crate', t: now - 10*MIN}]);
    const dp = dayParts('kishmish', a, now), t = dp.tot;
    ok('the three parts add up to the time since midnight', Math.abs(t.sleep + t.crate + t.out - (now - a)) < 1000);
    ok('sleep = the sleep card\'s total for today', Math.abs(t.sleep - todayTotal('kishmish', 'sleep')) < 1000);
    // independent count, minute by minute (the estimate in the running stay starts two minutes in: closed-box rule)
    let s = 0, c = 0, o = 0;
    for(let m = a + 30000; m < now; m += 60000){
      const sl = V.kishmish.spans.some(x => x.t <= m && m < (x.end == null ? now : x.end)), cr = state.log.some(e => e.k === 'crate' && e.t <= m && m < (e.end == null ? now : e.end));
      if(sl) s++; else if(cr) c++; else o++;
    }
    ok('minute by minute, the same split', Math.abs(t.sleep/MIN - s) <= 2 && Math.abs(t.crate/MIN - c) <= 2 && Math.abs(t.out/MIN - o) <= 2);
    ok('a sleep out of the crate counts as sleep (not "out")', dp.segs.some(x => x.k === 'sleep' && x.a === a + 300*MIN));
    ok('no gaps, no overlaps, in time order', dp.segs.every((x, i) => i === 0 ? x.a === a : x.a === dp.segs[i-1].b) && dp.segs[dp.segs.length-1].b <= now);
    V2 = true; render();
    ok('the ribbon shows the totals, and the pee on the gravel as a green mark', $q('.ribbon .rtot').textContent.includes(hmm(t.sleep)) && !!$q('.ribbon .mk.pee:not(.bad)'));
    seed(state.log.concat([{...K0, k:'poop', t: a + 122*MIN, w:'pad'}]));
    ok('a poop on the pad is a red mark', !!$q('.ribbon .mk.poop.bad'));
    V2 = false;
    done();
  } catch(e){ crashed(e); }
})();
