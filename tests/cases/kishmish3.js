// v3, Kishmish (agent B): wakeExpect (a forward range from the conditional continuation, wake-by unchanged),
// pottyExpect (pee on waking; "לא עשתה" never moves the gap), advice (one calm line or none), independence (a door-open
// exit / the carrier / the pen start no retry and do not move the wheel to "טיול וצרכים"), sleepOrigin.
// Runs at a fixed daytime (13:00 the day before the real day, the clock moving on from there) so it never skips at night.
(async function(){
  const RealDate = Date, real0 = RealDate.now();
  const d0 = new RealDate(real0); d0.setDate(d0.getDate() - 1); d0.setHours(13, 0, 0, 0);
  const T0 = d0.getTime();
  class FakeDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(T0 + (RealDate.now() - real0)); } static now(){ return T0 + (RealDate.now() - real0); } }
  window.Date = FakeDate;
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, P = 'kishmish';
    // her history: eight marked day naps of 50–70 minutes on the four days before, each after a pee
    const day = (k, h) => { const d = new Date(now); d.setDate(d.getDate() - k); d.setHours(h, 0, 0, 0); return d.getTime(); };
    const lens = [50, 55, 60, 60, 65, 70, 60, 55], hist = [];
    lens.forEach((m, i) => { const s = day(1 + (i >> 1), i % 2 ? 15 : 10); hist.push({...K0, k:'pee', t: s - 5*MIN, w:'gravel'}, {...K0, k:'sleep', t: s, end: s + m*MIN}); });
    const fed = t => [{...K0, k:'food', t: t - 10*MIN, m:'meal'}, {...K0, k:'pee', t: t - 5*MIN, w:'gravel'}];

    // ---- wakeExpect ----
    let st = now - 120*MIN;
    seed(hist.concat(fed(st), [{...K0, k:'sleep', t: st}]));
    let w = wakeExpect(P);
    ok('asleep 2 h, far past her usual nap: state asleep, marked, since = the start', w.state === 'asleep' && w.src === 'marked' && w.since === st && w.n === 9);   // 8 past naps + this one, censored
    ok('…still a forward RANGE (not "typical minus elapsed", which is in the past)', !!w.likely && w.likely.from >= now - 1000 && w.likely.to > w.likely.from);
    ok('…sleepOn passed through with its words', w.sleepOn && w.sleepOn.n === 9 && w.sleepOn.censored === 1 && ['likely','unsure','unlikely'].includes(w.words));
    ok('wake-by unchanged: the same time as wakeBy()', w.wakeBy === wakeBy(P).t && w.wakeBy === Math.min(st - 5*MIN + 4*HOUR, st - 10*MIN + ALERT.food));
    ok('a long nap alone never says "wake her"', !$q('.cyc-n').textContent.includes('כדאי להעיר') && !wakeBy(P).past);
    ok('…advice: let her sleep', advice(P).text === 'אפשר לתת לה להמשיך לישון' && advice(P).level === 'info');
    st = now - 10*MIN; seed(hist.concat(fed(st), [{...K0, k:'sleep', t: st}]));
    const early = wakeExpect(P);
    ok('early in a nap the range lies further ahead', early.likely && early.likely.to > early.likely.from && early.likely.from >= now);
    // too little data: no range
    seed(fed(st).concat([{...K0, k:'sleep', t: st}]));
    w = wakeExpect(P);
    ok('fewer than 5 marked naps: likely null, words unknown, wake-by still there', w.likely === null && w.words === 'unknown' && w.wakeBy === wakeBy(P).t);
    // awake / Kochik
    seed(hist.concat(fed(now)));
    ok('awake: state awake, no range', wakeExpect(P).state === 'awake' && wakeExpect(P).likely === null);
    ok('Kochik: never a range; her advice is a calm line or none (kochik3.js)', wakeExpect('kochik').likely === null && advice('kochik').level !== 'act');

    // ---- short waking and back to sleep: one episode ----
    const a = now - 70*MIN;
    seed(hist.concat(fed(a), [{...K0, k:'sleep', t: a, end: a + 40*MIN}, {...K0, k:'sleep', t: a + 45*MIN}]));
    ok('a MARKED waking 5 minutes before (validation S1): a new sleep, not merged across it', wakeExpect(P).since === a + 45*MIN && episodes(P, a - MIN, now).length === 2);
    // estimated pieces split by something that is not meaningful (a setup change) still join
    seed([{...K0, k:'crate', t: now - 60*MIN}, {...K0, k:'cset', t: now - 30*MIN, cover:'uncovered'}]);
    ok('…estimated pieces with only a crate-setup change between them: one episode', K().spans.filter(x => x.assumed).length >= 2 && episodes(P, now - 2*HOUR, now).length === 1);
    seed(hist.concat(fed(a), [{...K0, k:'sleep', t: a, end: a + 40*MIN}, {...K0, k:'pee', t: a + 42*MIN, w:'gravel'}, {...K0, k:'sleep', t: a + 45*MIN}]));
    ok('…a pee in between: a new sleep', wakeExpect(P).since === a + 45*MIN);

    // ---- "היא עדיין ישנה?" from her continuation, not a fixed nap ----
    seed(hist.concat(fed(now - 10*MIN), [{...K0, k:'sleep', t: now - 10*MIN}]));
    ok('10 minutes into a nap: no question', !stillAsleep(P) && !$q('.sleepq.still'));
    seed(hist.concat(fed(now - 50*MIN), [{...K0, k:'sleep', t: now - 50*MIN}]));
    ok('50 minutes (most of her naps last longer): no question', !stillAsleep(P));
    seed(hist.concat(fed(now - 80*MIN), [{...K0, k:'sleep', t: now - 80*MIN}]));
    ok('80 minutes, nothing practical due (owner, 26.11): no question, only the passive line with her range', !stillAsleep(P) && !$q('.sleepq.still') && $q('.card.cyc').textContent.includes('כנראה תתעורר בין'));
    const due = [{...K0, k:'food', t: now - 100*MIN, m:'meal'}, {...K0, k:'pee', t: now - 160*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 80*MIN}];
    seed(hist.concat(due));
    ok('80 minutes and her pee window open: the question, with a forward range and why', !!stillAsleep(P) && stillAsleep(P).src === 'learned' && !!$q('.sleepq.still') && $q('.sleepq.still').textContent.includes('ייתכן'));
    $q('.sleepq.still [data-act=stillasleep]').click();
    ok('"עדיין ישנה" still hides it for 20 minutes, nothing saved', !$q('.sleepq.still') && stillUntil > Date.now() && logOf(P, 'sleep').filter(e => e.end == null).length === 1);
    stillUntil = 0; render();
    ok('…and never asks again about this sleep (once per episode)', !stillAsleep(P) && !$q('.sleepq.still'));
    stillDone.clear();
    const n2 = new Date(now); n2.setHours(22, 40, 0, 0); 
    ok('never at night (22:30–07:00 or touching the night)', planNight(n2.getTime(), n2.getTime() + MIN));

    // ---- pottyExpect ----
    st = now - 30*MIN; seed(hist.concat(fed(st), [{...K0, k:'sleep', t: st}]));
    let pe = pottyExpect(P).pee; w = wakeExpect(P);
    ok('asleep: pee expected on waking (trigger wake, to = wake range end + 15 min)', pe.trigger === 'wake' && pe.src === 'learned' && pe.from === w.likely.from && pe.to === w.likely.to + 15*MIN);
    ok('…and the pee card says so', $q('#sec-potty') ? $q('#sec-potty').textContent.includes('פיפי צפוי מיד כשהיא מתעוררת') : true);
    seed(fed(st).concat([{...K0, k:'sleep', t: st}]));
    pe = pottyExpect(P).pee;
    ok('asleep, no nap data: wake trigger by rule, until wake-by + 15 min', pe.trigger === 'wake' && pe.src === 'rule' && pe.to === wakeBy(P).t + 15*MIN);
    // awake: gaps
    const pees = []; for(let i = 0; i < 7; i++) pees.push({...K0, k:'pee', t: now - 20*MIN - (6 - i) * 70*MIN, w:'gravel'});
        seed(pees.concat([{...K0, k:'food', t: now - 20*MIN, m:'meal'}]));
    const g1 = usualPeeGap(P, Date.now()), x1 = pottyExpect(P).pee, f1 = peeForecast(P);
    ok('awake with enough gaps: trigger gap, learned', !!g1 && x1.trigger === 'gap' && x1.src === 'learned' && x1.n === g1.n);
    ok('…peeForecast reads the same window', f1.from === x1.from && f1.to === x1.to);
    const withNones = state.log.concat(pees.slice(1).map(e => ({...K0, k:'none', t: e.t - 40*MIN})));
    seed(withNones.map(e => ({...e})));
    const g2 = usualPeeGap(P, Date.now()), x2 = pottyExpect(P).pee;
    ok('"לא עשתה" between pees changes neither the usual gap nor the window', g2.med === g1.med && g2.n === g1.n && x2.from === x1.from && x2.to === x1.to);
    ok('…it is an attempt, not a gap', peeGapsObs(P, now - 2*86400000, now + 1).attempts.length === 6);
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}]);
    ok('too few gaps: by age', pottyExpect(P).pee.trigger === 'age' && pottyExpect(P).pee.src === 'rule');
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'poop', t: now - 3*HOUR, w:'gravel'}, {...K0, k:'food', t: now - 10*MIN, m:'meal'}]);
    ok('poop: a meal 10 minutes ago, no poop since: trigger meal', pottyExpect(P).poop.trigger === 'meal' && pottyExpect(P).poop.to === now - 10*MIN + POTTY_CUE.mealPoop);

    // ---- advice ----
    const calm = [{...K0, k:'food', t: now - 70*MIN, m:'meal'}, {...K0, k:'pee', t: now - 50*MIN, w:'gravel'}];
    seed(calm);
    ok('awake, out, nothing due: "אין צורך לעשות דבר כרגע"', advice(P).text === 'אין צורך לעשות דבר כרגע' && !!advice(P).why);
    seed([{...K0, k:'pee', t: now - 50*MIN, w:'gravel'}]);
    ok('no meal in the list: "עוד אין מספיק נתונים להעריך"', advice(P).text === 'עוד אין מספיק נתונים להעריך');
    seed(calm.concat([{...K0, k:'crate', t: now - 20*MIN}, {...K0, k:'sleep', t: now - 20*MIN, end: now - 3*MIN}]));   // woke 3 min ago: before the "נרדמה?" card would ask
    ok('awake in the crate, quiet: "היא יכולה להעסיק את עצמה"', advice(P).text === 'היא יכולה להעסיק את עצמה');
    CRATE_TREAT_FROM = -Infinity;   // a kong keeps her awake a while (no estimate right after it)
    seed(calm.concat([{...K0, k:'crate', t: now - 20*MIN}, {...K0, k:'play', t: now - 15*MIN, y:'kong'}]));
    ok('kong in the crate: the same line, and why says so', advice(P).text === 'היא יכולה להעסיק את עצמה' && advice(P).why.includes('קונג') && !!K().crate.start);
    CRATE_TREAT_FROM = Infinity;
    seed(calm.concat([{...K0, k:'crate', t: now - 20*MIN}, {...K0, k:'cry', t: now - 3*MIN}]));
    ok('crying in the crate: no calm line', advice(P).level === 'none');
    // cry inside a sleep
    seed(hist.concat(fed(now - 40*MIN), [{...K0, k:'crate', t: now - 40*MIN}, {...K0, k:'sleep', t: now - 35*MIN}, {...K0, k:'cry', t: now - 2*MIN}]));
    ok('a cry inside a marked sleep: still asleep, but no calm line while it runs', wakeExpect(P).state === 'asleep' && advice(P).level === 'none');
    seed(hist.concat(fed(now - 40*MIN), [{...K0, k:'crate', t: now - 40*MIN}, {...K0, k:'sleep', t: now - 35*MIN}, {...K0, k:'cry', t: now - 6*MIN, end: now - 4*MIN}]));
    ok('…once it ended: let her sleep', advice(P).text === 'אפשר לתת לה להמשיך לישון');
    // pen
    seed(calm.concat([{...K0, k:'pen', t: now - 10*MIN}]));
    ok('in the pen: "היא יכולה להעסיק את עצמה"', advice(P).text === 'היא יכולה להעסיק את עצמה');
    seed(calm.concat([{...K0, k:'pen', t: now - 10*MIN}, {...K0, k:'cry', t: now - 2*MIN}]));
    ok('…the pen is never assumed calm: crying there, no line', advice(P).level === 'none');
    // none when something else speaks
    seed([{...K0, k:'food', t: now - 4*HOUR, m:'meal'}, {...K0, k:'pee', t: now - 30*MIN, w:'gravel'}]);
    ok('a red food card: advice none', $n('.card.alertc') >= 1 && advice(P).level === 'none');
    seed([{...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'pee', t: now - 150*MIN, w:'gravel'}, {...K0, k:'none', t: now - 2*MIN}]);
    ok('a retry on: advice none', !!retry(P) && advice(P).level === 'none');
    seed([{...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'pee', t: now - 250*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 30*MIN}]);
    ok('past wake-by ("כדאי להעיר"): advice none', wakeBy(P).past && advice(P).level === 'none');
    seed([{...K0, k:'pee', t: now - 50*MIN, w:'gravel'}, {...K0, k:'food', t: now - 20*MIN, m:'meal'}]);
    ok('"זמן להוציא לצרכים" on the wheel: advice none', !!pottyDue(P) && advice(P).level === 'none');

    // ---- independence ----
    const pre = [{...K0, k:'food', t: now - 90*MIN, m:'meal'}, {...K0, k:'pee', t: now - 60*MIN, w:'gravel'}];
    seed(pre.concat([{...K0, k:'cset', t: now - 50*MIN, door:'open'}, {...K0, k:'crate', t: now - 45*MIN, end: now - 5*MIN}]));
    let r = routine(P);
    ok('door-open exit: the wheel does not move to "טיול וצרכים"', r && r.free === 'door' && r.i !== 1 && routineTap(P).length === 0);
    ok('…no take-out reminder', !pottyDue(P) && !$q('.card.cyc .duemsg'));
    ok('…the wheel says she came out on her own', $q('.cyc-n').textContent.includes('יצאה בעצמה'));
    $q('[data-act=pt][data-k=none]') ? 0 : 0;
    seed(pre.concat([{...K0, k:'cset', t: now - 50*MIN, door:'open'}, {...K0, k:'crate', t: now - 45*MIN, end: now - 5*MIN}, {...K0, k:'play', t: now - 3*MIN, y:'rope'}]));
    ok('…she plays: still not insisting on the next step', routine(P).free === 'door');
    seed(pre.concat([{...K0, k:'cset', t: now - 50*MIN, door:'open'}, {...K0, k:'crate', t: now - 45*MIN, end: now - 5*MIN}, {...K0, k:'pee', t: now - 2*MIN, w:'gravel'}]));
    ok('…a pee after it moves the wheel as usual (it follows what happened)', routine(P).i === 2);
    seed(pre.concat([{...K0, k:'cset', t: now - 50*MIN, door:'closed'}, {...K0, k:'crate', t: now - 45*MIN, end: now - 5*MIN}]));
    ok('closed door: as before, "טיול וצרכים" and the reminder', routine(P).i === 1 && !!pottyDue(P));
    // the old retry triggers (waking / leaving the crate within the hour) ignore an exit of her own
    RETRY2_FROM = Infinity;
    const L0 = [{...K0, k:'pee', t: now - 100*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 45*MIN, end: now - 10*MIN}, {...K0, k:'none', t: now - 5*MIN}];
    seed(L0.map(e => ({...e})));
    ok('(old rule) a closed-crate exit 5 min before "לא עשתה" calls a retry', !!retry(P));
    seed([{...K0, k:'cset', t: now - 50*MIN, door:'open'}].concat(L0.map(e => ({...e}))));
    ok('(old rule) the same with the door open: no retry', !retry(P));
    RETRY2_FROM = -Infinity;
    // carrier: from a sleep in the crate
    seed(pre.concat([{...K0, k:'crate', t: now - 45*MIN, end: now - 10*MIN}, {...K0, k:'sleep', t: now - 40*MIN}, {...K0, k:'carrier', t: now - 10*MIN}]));
    ok('carrier: no step change, no reminder, no retry, the sleep goes on', routine(P).free === 'carrier' && !pottyDue(P) && !retry(P) && !!K().sleep.start);
    seed(pre.concat([{...K0, k:'crate', t: now - 45*MIN, end: now - 10*MIN}, {...K0, k:'pen', t: now - 10*MIN}]));
    ok('pen: the same (free time, no reminder, no retry)', routine(P).free === 'pen' && !pottyDue(P) && !retry(P));

    // ---- sleepOrigin ----
    seed([{...K0, k:'crate', t: now - 60*MIN, end: now - 40*MIN}, {...K0, k:'sleep', t: now - 55*MIN, end: now - 40*MIN}]);
    let sp = state.log.find(e => e.k === 'sleep');
    ok('no cset yet: unknown, observed', JSON.stringify(sleepOrigin(P, sp)) === JSON.stringify({origin:'unknown', basis:'observed'}));
    seed([{...K0, k:'cset', t: now - 70*MIN, door:'closed', cover:'covered'}, {...K0, k:'crate', t: now - 60*MIN, end: now - 40*MIN}, {...K0, k:'sleep', t: now - 55*MIN, end: now - 40*MIN}]);
    sp = state.log.find(e => e.k === 'sleep');
    ok('closed crate: placed', sleepOrigin(P, sp).origin === 'placed' && sleepOrigin(P, sp).basis === 'observed');
    seed([{...K0, k:'cset', t: now - 70*MIN, door:'open'}, {...K0, k:'crate', t: now - 60*MIN, end: now - 40*MIN}, {...K0, k:'sleep', t: now - 55*MIN, end: now - 40*MIN}]);
    sp = state.log.find(e => e.k === 'sleep');
    ok('door open: self', sleepOrigin(P, sp).origin === 'self');
    seed([{...K0, k:'pen', t: now - 60*MIN, end: now - 30*MIN}, {...K0, k:'sleep', t: now - 55*MIN, end: now - 40*MIN}]);
    sp = state.log.find(e => e.k === 'sleep');
    ok('in the pen: self', sleepOrigin(P, sp).origin === 'self');
    seed([{...K0, k:'cset', t: now - 70*MIN, door:'closed'}, {...K0, k:'crate', t: now - 60*MIN, end: now - 20*MIN}]);
    sp = K().spans.find(x => x.assumed);
    ok('an estimated sleep: placed, inferred', !!sp && sleepOrigin(P, sp).origin === 'placed' && sleepOrigin(P, sp).basis === 'inferred');
    const ep = episodes(P, now - 2*HOUR, now)[0];
    ok('…an episode works too', !!ep && sleepOrigin(P, ep).basis === 'inferred');
    // ---- validation fixes ----
    // B1: a drink ends the crate and the sleep but starts no cycle and no potty advice
    seed(hist.concat(fed(now - 80*MIN), [{...K0, k:'crate', t: now - 75*MIN}, {...K0, k:'sleep', t: now - 65*MIN}]));
    tapPoint(P, 'water'); render();
    ok('B1: a drink ends the stay and the sleep', !K().crate.start && !K().sleep.start);
    r = routine(P);
    ok('B1: …the wheel does not go to "טיול וצרכים", no potty tiles tagged', r && r.free === 'water' && routineTap(P).length === 0 && !$q('.cyc-n').textContent.includes('מוציאים את'));
    ok('B1: …no "ישר לחצץ", no take-out reminder', !napWake(P) && !$q('.cyc-n').textContent.includes('ישר לחצץ') && !pottyDue(P));
    FAKE_HOUR = 2; nightFull = false; render();
    ok('B1: …at night either', routineTap(P).length === 0);
    // S5: the slim night screen draws no advice line
    seed(calm.concat([{...K0, k:'crate', t: now - 20*MIN}]));
    ok('S5: slim night screen, no advice line', !!$q('.nightc') && !$q('.card.advice'));
    FAKE_HOUR = 12; render();
    ok('S5: …by day it is there (release 6b: inside the top card\'s "מה לעשות")', !!$q('.nowtop .nt-b'));
    // S3: censorNear censors only ends next to a possible intervention
    seed(hist.map(e => ({...e})).concat([{...K0, k:'pee', t: hist[1].end + MIN, w:'gravel'}]));
    const s0 = sleepOn(P, 15*MIN), s1 = sleepOn(P, 15*MIN, {censorNear: true}), s2 = sleepOn(P, 15*MIN, {endAsCensored: true});
    ok('S3: censorNear censors the one end next to a pee, keeps the others as events', s0.censored === 0 && s1.censored === 1 && s1.pAtLeast[0].p > 0 && s1.pAtLeast[0].p < 1);
    ok('S3: endAsCensored (every end censored) has no real endings → "unknown", no fake certainty', s2.censored === 8 && s2.pAtLeast[0].p === null && s2.words === 'unknown');
    // S4: the old-rule question shows no wake time
    stillDone.clear();
    seed([{...K0, k:'food', t: now - 100*MIN, m:'meal'}, {...K0, k:'pee', t: now - 160*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 70*MIN}]);
    ok('S4: too few naps: asked by the old rule, "not enough data", no expected time', !!stillAsleep(P) && stillAsleep(P).src === 'rule' && !('exp' in stillAsleep(P))
      && $q('.sleepq.still').textContent.includes('עוד אין מספיק נתונים') && !$q('.sleepq.still').textContent.includes('צפוי'));
    ok('nothing is stored by any of it', state.log.every(e => !('origin' in e) && !('likely' in e)));
    done();
  } catch(e){ crashed(e); }
  finally { window.Date = RealDate; }
})();
