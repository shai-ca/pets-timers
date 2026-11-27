// "היום במבט אחד": sleep / awake in the crate / out (observed + inferred) / not documented add up to the time since
// midnight, and agree with the sleep card. Since 27.11 time out of the crate counts as "out" only near a sign of her
// being awake (reduced logging); the rest is "לא תועד".
(async function(){
  try {
    reset();
    const now = Date.now(), a = midnight(), late = now - a > 400*MIN, K0 = {p:'kishmish'};
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{...K0, k:'crate', t: a - 60*MIN, end: a + 120*MIN}, {...K0, k:'sleep', t: a - 50*MIN, end: a + 100*MIN},
          {...K0, k:'pee', t: a + 121*MIN, w:'gravel'}, {...K0, k:'crate', t: a + 200*MIN, end: a + 260*MIN}, {...K0, k:'sleep', t: a + 210*MIN, end: a + 250*MIN},
          {...K0, k:'sleep', t: a + 300*MIN, end: a + 320*MIN}, {...K0, k:'crate', t: now - 10*MIN}]);
    const dp = dayParts('kishmish', a, now), t = dp.tot;
    ok('the parts (with "לא תועד") add up to the time since midnight', Math.abs(t.sleep + t.crate + t.out + t.outi + t.unk - (now - a)) < 1000);
    ok('sleep = the sleep card\'s total for today', Math.abs(t.sleep - todayTotal('kishmish', 'sleep')) < 1000);
    // independent count, minute by minute (the estimate in the running stay starts two minutes in: closed-box rule)
    // awake signs: every MEANINGFUL entry's start and end, and every waking; by day 45 min after, at night 5 min around
    const signs = state.log.filter(e => MEANINGFUL[e.k]).flatMap(e => [e.t, e.end]).concat(V.kishmish.spans.map(x => x.end)).filter(x => x != null && x <= now);
    const nightAt = x => { const h = new Date(x).getHours(); return h >= 23 || h < 6; };
    let s = 0, c = 0, o = 0, u = 0;
    for(let m = a + 30000; m < now; m += 60000){
      const sl = V.kishmish.spans.some(x => x.t <= m && m < (x.end == null ? now : x.end)), cr = state.log.some(e => e.k === 'crate' && e.t <= m && m < (e.end == null ? now : e.end));
      const near = signs.some(x => nightAt(x) ? Math.abs(m - x) < 5*MIN : x <= m && m < x + 45*MIN);
      if(sl) s++; else if(cr) c++; else if(near) o++; else u++;
    }
    ok('minute by minute, the same split', Math.abs(t.sleep/MIN - s) <= 2 && Math.abs(t.crate/MIN - c) <= 2 && Math.abs((t.out + t.outi)/MIN - o) <= 2 && Math.abs(t.unk/MIN - u) <= 2);
    ok('there is undocumented time in this day (after the last sleep, nothing logged for hours)', t.unk > 60*MIN && !!dp.segs.find(x => x.k === 'unk'));
    ok('a sleep out of the crate counts as sleep (not "out")', dp.segs.some(x => x.k === 'sleep' && x.a === a + 300*MIN));
    ok('no gaps, no overlaps, in time order', dp.segs.every((x, i) => i === 0 ? x.a === a : x.a === dp.segs[i-1].b) && dp.segs[dp.segs.length-1].b <= now);
    V2 = true; render();
    ok('the ribbon shows the totals, and the pee on the gravel as a green mark', $q('.ribbon .rtot').textContent.includes(hmm(t.sleep)) && !!$q('.ribbon .mk.pee:not(.bad)'));
    ok('"לא תועד" is its own part, total and legend entry; out shows its inferred part', !!$q('.ribbon .pt.unk') && $q('.ribbon .rtot .unk').textContent.includes('לא תועד') && $q('.ribbon .rtot .unk').textContent.includes(hmm(t.unk)) && $q('.ribbon .rlg2').textContent.includes('לא תועד') && !!$q('.ribbon .pt.outi') && $q('.ribbon .rtot .out').textContent.includes('משוער'));
    $q('.ribbon .pt.sleep').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    ok('tapping a part of the bar writes its times under it', /שינה \d\d:\d\d–\d\d:\d\d/.test($q('.ribbon .pbar .ptip').textContent));
    $q('.ribbon .mk.pee').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    ok('…and a mark: what and when', $q('.ribbon .pbar .ptip').textContent.includes('פיפי ' + clock(a + 121*MIN)) && $q('.ribbon .pbar .ptip').textContent.includes('על החצץ'));
    $q('.uni .rbar .pt').dispatchEvent(new MouseEvent('pointerover', {bubbles:true}));
    ok('hover works on the round bars too; each shows its start and end', $q('.uni .rbar .ptip').textContent.includes('–') && !!$q('.uni .rbar .rends'));
    ok('wide parts carry their start time on them', $n('.ribbon .pt i') > 0 && [...document.querySelectorAll('.ribbon .pt')].every(p => (parseFloat(p.style.width) >= 13) === !!p.querySelector('i') && (!p.querySelector('i') || p.dataset.tip.includes(p.querySelector('i').textContent + '–'))));
    seed(state.log.concat([{...K0, k:'poop', t: a + 122*MIN, w:'pad'}]));
    ok('a poop on the pad is a red mark', !!$q('.ribbon .mk.poop.bad'));
    V2 = false;
    done();
  } catch(e){ crashed(e); }
})();
