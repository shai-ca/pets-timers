// v3 single source of truth (Agent F, independent validation): for the same moment, the tracking cards, the "still
// asleep?" card, advice and planning must give the same pee window / wake range / Kochik window as the contracts
// (`pottyExpect`, `wakeExpect`, `kochikExpect`). Seeded situations: asleep, awake after waking, after a meal, Kochik
// after a drink. Runs at a fixed daytime (13:00 the day before the real day) so it never lands on the night screen.
(async function(){
  const RealDate = Date, real0 = RealDate.now();
  const d0 = new RealDate(real0); d0.setDate(d0.getDate() - 1); d0.setHours(13, 0, 0, 0);
  const T0 = d0.getTime();
  class FakeDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(T0 + (RealDate.now() - real0)); } static now(){ return T0 + (RealDate.now() - real0); } }
  window.Date = FakeDate;
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, C0 = {p:'kochik'}, P = 'kishmish';
    const day = (k, h, m = 0) => { const d = new Date(now); d.setDate(d.getDate() - k); d.setHours(h, m, 0, 0); return d.getTime(); };
    // her history: eight marked day naps (50–70 min), each after a gravel pee, and pees every ~70 min by day
    const hist = [];
    [50, 55, 60, 60, 65, 70, 60, 55].forEach((m, i) => { const s = day(1 + (i >> 1), i % 2 ? 15 : 10); hist.push({...K0, k:'pee', t: s - 5*MIN, w:'gravel'}, {...K0, k:'crate', t: s - 3*MIN, end: s + m*MIN + 2*MIN}, {...K0, k:'sleep', t: s, end: s + m*MIN}); });
    for(let k = 1; k <= 3; k++) for(let h = 7; h <= 20; h++) if(h !== 10 && h !== 15) hist.push({...K0, k:'pee', t: day(k, h, 20), w:'gravel'});
    // Kochik: a pee every two hours by day, the last three days
    const koch = []; for(let k = 1; k <= 3; k++) for(let h = 7; h <= 21; h += 2) koch.push({...C0, k:'pee', t: day(k, h), w:'out'});
    const near = (a, b, tol = 1000) => a != null && b != null && Math.abs(a - b) <= tol;
    const plan = () => { const M = planBuild(0); view = 'now'; return M; };

    // ---- 1. asleep (marked, in the closed crate, 30 min in) ----
    let st = now - 30*MIN;
    seed(hist.concat(koch, [{...K0, k:'food', t: st - 15*MIN, m:'meal'}, {...K0, k:'pee', t: st - 8*MIN, w:'gravel'}, {...K0, k:'crate', t: st - 5*MIN}, {...K0, k:'sleep', t: st}]));
    let w = wakeExpect(P), pe = pottyExpect(P).pee;
    ok('asleep: the contract has a forward wake range', !!w.likely && w.likely.from >= now - 1000);
    ok('asleep: the pee card shows the contract\'s "on waking" (no gap window)', pe.trigger === 'wake' && !!$q('.wakepee') && !$q('#sec-potty .fc:not(.wakepee)'));
    let M = plan(), cs = M.ks.sleeps.find(s => s.cur && s.seen);
    ok('asleep: planning\'s current wake is wakeExpect.likely (src contract)', !!cs && cs.wake.src === 'contract' && near(cs.wake.from, Math.max(w.likely.from, M.from + MIN)) && near(cs.wake.to, w.wakeBy && w.wakeBy < w.likely.to ? w.wakeBy : w.likely.to));
    ok('asleep: planning\'s pee limit for this sleep is pottyExpect.pee.to', !!cs && near(cs.peeTo, pe.to));
    ok('asleep: planning\'s wake-by is the safety rule wakeBy()', !!cs && cs.wake.wakeBy === wakeBy(P).t);
    // long into the nap: the "still asleep?" card shows the same range as the contract
    st = now - 85*MIN;
    seed(hist.concat(koch, [{...K0, k:'food', t: st - 15*MIN, m:'meal'}, {...K0, k:'pee', t: st - 8*MIN, w:'gravel'}, {...K0, k:'crate', t: st - 5*MIN}, {...K0, k:'sleep', t: st}]));
    w = wakeExpect(P); const sa = stillAsleep(P);
    ok('"still asleep?" (when shown) uses wakeExpect\'s range and start', !sa || (sa.src === 'learned' && sa.likely.from === w.likely.from && sa.likely.to === w.likely.to && sa.since === w.since));
    ok('…and its card prints that range', !sa || $q('.sleepq.still').textContent.includes(clock(w.likely.from) + '–' + clock(w.likely.to)));
    M = plan(); cs = M.ks.sleeps.find(s => s.cur && s.seen);
    ok('…planning agrees at the same moment', !!cs && cs.wake.src === 'contract' && near(cs.wake.from, Math.max(w.likely.from, M.from + MIN)));

    // ---- 2. awake after waking (out of the crate, peed on waking) ----
    const wk = now - 25*MIN;
    seed(hist.concat(koch, [{...K0, k:'food', t: wk - 90*MIN, m:'meal'}, {...K0, k:'crate', t: wk - 80*MIN, end: wk}, {...K0, k:'sleep', t: wk - 70*MIN, end: wk}, {...K0, k:'pee', t: wk + 3*MIN, w:'gravel'}]));
    pe = pottyExpect(P).pee; let f = peeForecast(P);
    ok('awake: pottyExpect uses her gap', pe.trigger === 'gap' && pe.src === 'learned');
    ok('awake: the tracking window (peeForecast) is the contract\'s', !!f && f.from === pe.from && f.to === pe.to);
    ok('awake: the pee card prints that window', $q('#sec-potty') ? $q('#sec-potty').textContent.includes(clock(pe.from) + '–' + clock(pe.to)) || $q('#sec-potty').textContent.includes(clock(pe.to)) : true);
    ok('awake: peeWindow (the gauge) has the same ends', peeWindow(P).from === pe.from && peeWindow(P).to === pe.to);
    ok('awake: planning\'s pee input is the contract\'s', planPee(now).src === 'contract' && planPee(now).to === pe.to);
    ok('awake: wakeExpect says awake since the waking', wakeExpect(P).state === 'awake' && wakeExpect(P).since === awakeSince(P));

    // ---- 3. after a meal (a meal 10 min ago, no poop since) ----
    seed(hist.concat(koch, [{...K0, k:'poop', t: now - 3*HOUR, w:'gravel'}, {...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'food', t: now - 10*MIN, m:'meal'}]));
    const po = pottyExpect(P).poop; pe = pottyExpect(P).pee; f = peeForecast(P);
    ok('after a meal: poop trigger meal, to = meal + 30 min', po.trigger === 'meal' && po.to === now - 10*MIN + POTTY_CUE.mealPoop);
    ok('…the poop card prints the same end', $q('.mealpoop') && $q('.mealpoop').textContent.includes(clock(po.to)));
    ok('…pee: tracking and contract still agree', !!f && f.from === pe.from && f.to === pe.to);
    const ad = advice(P);
    ok('…advice never names a pee window other than the contract\'s', !ad.why || !/הפיפי הבא צפוי/.test(ad.why) || ad.why.includes(clock(pe.from) + '–' + clock(pe.to)));

    // ---- 4. Kochik after a drink ----
    const kp = now - 40*MIN, kd = now - 20*MIN;
    seed(hist.concat(koch, [{...C0, k:'pee', t: kp, w:'out'}, {...C0, k:'water', t: kd}]));
    const ke = kochikExpect(now), pk = planKochik(now);
    ok('Kochik: the contract opens a drink window 30–90 min after the drink', ke.drinkFrom === kd + 30*MIN && ke.drinkTo === kd + 90*MIN);
    ok('Kochik: planning reads kochikExpect unchanged (gap, window, cap)', pk.gap === ke.gap && pk.from === ke.from && pk.to === ke.to && pk.cap === ke.cap && pk.drinkFrom === ke.drinkFrom);
    M = plan();
    const first = M.kpee[0];
    ok('Kochik: planning\'s next task is the drink window (or pulled into Kishmish\'s outing)', !!first && first.kind === 'drink' && (near(first.at, ke.drinkFrom) || (first.combo && first.at <= ke.drinkFrom)));
    ok('Kochik: kochikGap (old shape) is the same rule', kochikGap(now).gap === ke.gap && kochikGap(now).cap === ke.cap);
    // Kochik: the drink ended a marked sleep only
    seed(hist.concat(koch, [{...C0, k:'sleep', t: now - 30*MIN}]));
    ok('Kochik asleep (marked): wakeExpect asleep, no range', wakeExpect('kochik').state === 'asleep' && wakeExpect('kochik').likely === null);

    // KNOWN divergence (reported, not asserted): where wakeExpect has NO range (fewer than 5 marked naps, or a sleep
    // touching the night) planning's adapter `planWakeNow` still makes one from `planNaps` (src 'adapter').
    seed([{...K0, k:'food', t: now - 45*MIN, m:'meal'}, {...K0, k:'pee', t: now - 40*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 35*MIN}, {...K0, k:'sleep', t: now - 30*MIN}]);
    const noRange = wakeExpect(P).likely === null, ad2 = (planWakeNow(Date.now()) || {}).src;
    done(`known: contract range null=${noRange}, planning wake src=${ad2}`);
  } catch(e){ crashed(e); }
  finally { window.Date = RealDate; }
})();
