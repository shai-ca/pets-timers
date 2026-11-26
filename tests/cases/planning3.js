// Planning v3: durations without a fixed margin, activity classes, combined care, short windows labelled, the
// stricter "can go out" from evidence of staying alone, the optional "יצאתי / חזרתי" control, and the contracts.
(async function(){
  try {
    const RealDate = Date; let NOW = new RealDate(2026, 10, 25, 12, 0).getTime();
    class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
    window.Date = FD;
    reset();
    const at = (off, h, m = 0) => new RealDate(2026, 10, 25 + off, h, m).getTime(), K0 = {p:'kishmish'}, C0 = {p:'kochik'};
    // a steady round every 2:15 (gravel pee, meal, crate, asleep 5 min later for `nap` minutes); today she went in at
    // 11:40 and is asleep since 11:45 (unless `cur` says otherwise). Kochik: a pee every two hours, both medicines.
    const hist = (nap = 100, cur = 'asleep') => {
      const L = [], round = T => L.push({...K0, k:'pee', t: T, w:'gravel'}, {...K0, k:'food', t: T + 5*MIN}, {...K0, k:'crate', t: T + 20*MIN, end: T + (30 + nap)*MIN}, {...K0, k:'sleep', t: T + 25*MIN, end: T + (25 + nap)*MIN});
      for(const d of [-3, -2, -1]){
        for(const [h, m] of [[7, 0], [9, 15], [11, 30], [13, 45], [16, 0], [18, 15], [20, 30]]) round(at(d, h, m));
        for(let h = 7; h <= 21; h += 2) L.push({...C0, k:'pee', t: at(d, h), w:'out'});
        L.push({...C0, k:'med_am', t: at(d, 8)}, {...C0, k:'med_pm', t: at(d, 20, 30)}, {...C0, k:'food', t: at(d, 17)});
      }
      for(const [h, m] of [[7, 0], [9, 15]]) round(at(0, h, m));
      L.push({...K0, k:'pee', t: at(0, 11, 30), w:'gravel'}, {...K0, k:'food', t: at(0, 11, 35)});
      if(cur === 'asleep') L.push({...K0, k:'crate', t: at(0, 11, 40)}, {...K0, k:'sleep', t: at(0, 11, 45)});
      if(cur === 'kong') L.push({...K0, k:'crate', t: at(0, 11, 40)}, {...K0, k:'play', y:'kong', t: at(0, 11, 59)});
      if(cur === 'carrier') L.push({...K0, k:'crate', t: at(0, 11, 40), end: at(0, 11, 55)}, {...K0, k:'carrier', t: at(0, 11, 55)});
      L.push({...C0, k:'pee', t: at(0, 7, 30), w:'out'}, {...C0, k:'pee', t: at(0, 9, 40), w:'out'}, {...C0, k:'pee', t: at(0, 11, 50), w:'out'}, {...C0, k:'med_am', t: at(0, 8)});
      return L;
    };
    const away = (n, min, extra) => Array.from({length: n}, (_, i) => ({...K0, k:'away', t: at(-1 - i, 14), end: at(-1 - i, 14) + min*MIN, ctx:'home', res:'calm', ...(extra || {})}));
    const plan = (L, d = 0) => { seed(L); view = 'plan'; planDay = d; render(); return planBuild(d); };
    const union = ns => { const s = ns.map(n => [n.a, n.b]).sort((x, y) => x[0] - y[0]); let tot = 0, e = -Infinity; for(const [a, b] of s){ if(b > e){ tot += b - Math.max(a, e); e = b; } } return tot; };

    // 1. No fixed margin: her care lasts her learned out-of-crate time exactly; nothing is padded.
    let M = plan(hist());
    const D = M.dur.care.ms;
    ok('no 15-minute pad: PLAN has none, and every outing of hers is exactly her learned out-of-crate time', PLAN.pad === undefined && D === 25*MIN && M.ks.care.filter(n => !n.bath && !n.spray && n.b < M.to).every(n => n.b - n.a === D));
    ok('…called an indirect estimate in "איך זה מחושב"', $q('.pl-info').textContent.includes('הערכה עקיפה') && $q('.pl-info').textContent.includes('לא ספירה של הדקות שלך'));
    // 2. A day of long naps: free windows at home appear (15 min and up) and are listed.
    const lv = planLevels(M), homes = lv.filter(x => x.k === 'home');
    ok('long naps: free at home now and later, each stretch at least 15 min', homes.length >= 3 && homes.every(x => x.run >= PLAN.minWin) && planClass(M, NOW + MIN).k === 'home');
    ok('…listed under "החלונות שלי" as free at home', $n('.pl-list .pl-w.home') >= 2 && $q('.pl-list').textContent.includes('פנוי בבית'));
    ok('…the summary counts free at home, supervised and care apart', /כנראה בלי הפרעה/.test($q('.pl-stats').textContent) && !/^0 דק׳/.test($q('.pl-stats b').textContent));
    // 3. Kochik's pee inside Kishmish's outing: combinable, counted once
    const combo = M.kpee.filter(n => n.combo);
    const careMin = lv.filter(x => x.k === 'care').reduce((n, x) => n + x.b - x.a, 0), sumMin = M.needs.reduce((n, x) => n + Math.min(x.b, M.to) - Math.max(x.a, M.from), 0);
    ok('a Kochik pee inside Kishmish\'s outing is marked "אפשר לשלב"', combo.length >= 1 && combo.every(k => M.ks.care.some(o => o.a <= k.a && k.a < o.b)) && lv.some(x => x.k === 'care' && x.combo && x.a <= combo[0].a && combo[0].a < x.b) && $q('.pl-care').textContent.includes('אפשר לשלב'));
    ok('…and overlapping care is merged, never summed', Math.abs(careMin - union(M.needs.map(n => ({a: Math.max(n.a, M.from), b: Math.min(n.b, M.to)})))) < 1000 && careMin < sumMin);
    ok('…but not everything overlapping is called combinable (a medicine on its own is not)', M.needs.filter(n => n.kind === 'med' && !n.combo).every(n => !M.ks.care.some(o => o.a <= n.a && n.a < o.b)));
    // 4. Short windows are labelled, never hidden
    const realW4 = wakeExpect; wakeExpect = () => ({state:'asleep', since: at(0, 11, 45), sleepOn: null, likely: {from: at(0, 12, 5), to: at(0, 12, 5)}, wakeBy: null, words: 'likely', src: 'test', n: 9});   // a sure wake: no spread carried on
    M = plan(hist(20).concat(away(2, 90)));
    wakeExpect = realW4;
    const lv20 = planLevels(M), short = lv20.filter(x => x.k === 'home' && x.run >= PLAN.minWin && x.run < PLAN.shortWin);
    ok('short naps (20 min): a 15–25 min window is shown and labelled "קצר"', short.length >= 1 && !!$q('.pl-list .pl-badge.short') && $q('.pl-list .pl-badge.short').textContent === 'קצר');
    ok('…and quiet under 15 min is not a window (supervised)', lv20.filter(x => x.k === 'home').every(x => x.run >= PLAN.minWin));
    // 5. Activity classes
    M = plan(hist(100, 'carrier'));
    ok('carrier walk = supervised, not care', M.ks.ph[0].k === 'carrier' && planClass(M, NOW + MIN).k === 'sup' && !M.needs.some(n => n.dog === 'kishmish' && n.a <= NOW + MIN && NOW + MIN < n.b));
    M = plan(hist(100, 'kong'));
    ok('a kong in the crate = supervised, not care (and not counted as sleep yet)', !(V.kishmish.sleep && V.kishmish.sleep.start) && M.ks.ph[0].k === 'crate' && planClass(M, NOW + MIN).k === 'sup' && !M.needs.some(n => n.dog === 'kishmish' && n.a <= NOW + MIN && NOW + MIN < n.b));
    M = plan(hist(100, 'awake'));
    ok('awake out of the crate = care, until her usual time out ends', planClass(M, NOW + MIN).k === 'care' && M.ks.care[0].a === NOW);
    // 6. Can go out: closed without calm "home" evidence; opens only for lengths like the confirmed ones
    M = plan(hist());
    ok('no evidence of staying alone: no outing window, and it says why', M.free.length === 0 && !M.away.enough && M.ks.sleeps[0].why === 'עדיין אין מספיק ניסיון לבד' && $q('.pl-outl').textContent.includes('עדיין אין מספיק ניסיון לבד') && $q('.pl-want').textContent.includes('עדיין אין מספיק ניסיון לבד'));
    M = plan(hist().concat(away(3, 90, {ctx:'room'}), away(3, 90, {res:'unknown'}), away(2, 90, {res: undefined})));
    ok('calm in another room, "unknown" or no answer is not evidence for leaving home', M.free.length === 0 && M.away.n === 0);
    M = plan(hist().concat(away(3, 30)));
    const f30 = planBuild(0, 30*MIN).free[0];
    ok('three calm 30-min absences: no 45-min outing, but a 30-min one up to ~36 min', M.away.enough && M.free.length === 0 && !!f30 && f30.b - f30.a >= 30*MIN && f30.b - f30.a <= 36*MIN && /נשארה לבד רגועה/.test(f30.endWhy));
    M = plan(hist().concat(away(2, 90), [{...K0, k:'away', t: at(-1, 18), end: at(-1, 18, 40), ctx:'home', res:'much'}]));
    ok('a lot of crying on a 40-min absence lowers the cap to 40 min', M.away.cap === 40*MIN && M.free.length === 0);
    M = plan(hist().concat(away(2, 90)));
    ok('enough calm evidence: the outing opens (never on a sleep prediction alone)', M.away.enough && M.free.length >= 1 && M.free[0].notes.some(s => s.includes('נשארה לבד רגועה')));
    // 7. "יצאתי / חזרתי": optional, one tap, inside the planning tab
    seed(hist()); view = 'plan'; render();
    const n0 = state.log.length;
    ok('the control is there, small, in the planning tab, with three contexts', $n('.pl-away [data-pl=away]') === 3);
    $q('.pl-away [data-pl=away][data-v=home]').click();
    const run = state.log.find(e => e.k === 'away');
    ok('"יצאתי מהבית": one tap starts an away entry with its context, nothing else asked', state.log.length === n0 + 1 && run && run.ctx === 'home' && run.end == null && run.p === 'kishmish' && !bg.classList.contains('show') && $q('.pl-away.on').textContent.includes('חזרתי'));
    NOW += 50*MIN; render();
    $q('.pl-away [data-pl=back]').click();
    const done1 = state.log.find(e => e.k === 'away');
    ok('"חזרתי" ends it; the outcome is offered, not required', done1.end === NOW && done1.res === undefined && $n('.pl-away [data-pl=res]') === 4);
    ok('…not answering (and no cry logged) is not "calm"', planAway(NOW).n === 0);
    $q('.pl-away [data-pl=res][data-v=calm]').click();
    ok('one tap records the outcome, and the question goes away', state.log.find(e => e.k === 'away').res === 'calm' && $n('.pl-away [data-pl=res]') === 0 && planAway(NOW).n === 1);
    NOW = at(0, 12);
    // 8. Planning follows the contracts (stubbed here to known values)
    const real = {wakeExpect, kochikExpect, pottyExpect};
    wakeExpect = () => ({state:'asleep', since: at(0, 11, 45), sleepOn: null, likely: {from: at(0, 12, 30), to: at(0, 12, 50)}, wakeBy: null, words: 'unsure', src: 'test', n: 9});
    kochikExpect = () => ({gap: 90*MIN, from: at(0, 13), to: at(0, 13, 20), cap: 2*HOUR, sick: false, n: 9, src: 'learned'});
    M = plan(hist().concat(away(2, 90)));
    const s0 = M.ks.sleeps[0];
    ok('wakeExpect: the current sleep ends in its range (12:30–12:50), care at the middle', s0.wake.from === at(0, 12, 30) && s0.wake.to === at(0, 12, 50) && M.ks.care[0].a === at(0, 12, 40) && M.dur.wake === 'contract');
    ok('…free at home until 12:30, "maybe" (faded) 12:30–12:40, not busy', planClass(M, at(0, 12, 20)).k !== 'care' && planClass(M, at(0, 12, 35)).k === 'uns' && planLevels(M).some(x => x.k === 'uns' && x.a === at(0, 12, 30) && x.b === at(0, 12, 40)));
    const fc = planBuild(0, 20*MIN).free.find(f => f.sl.cur);
    ok('…with the contract\'s range the current sleep is not faded', !planLevels(M).find(x => x.a === NOW).est);
    ok('…the outing ends where her wake range begins, high confidence from the contract', !M.free.some(f => f.sl.cur) && !!fc && fc.a === NOW && fc.b === at(0, 12, 30) && fc.conf === 'high');
    ok('kochikExpect: her next pee follows its window and gap, combined with Kishmish\'s outing', M.kpee[0].a === at(0, 13) && M.kpee[0].combo && M.kpee[1].a === at(0, 14, 30));
    wakeExpect = real.wakeExpect;
    pottyExpect = () => ({pee: {from: at(0, 12, 5), to: at(0, 12, 20), trigger: 'gap', src: 'learned', n: 9}, poop: null});
    M = plan(hist().concat(away(2, 90)));
    ok('pottyExpect: her pee window ending at 12:20 closes the outing', M.free.every(f => f.a >= at(0, 12, 20) || f.b <= at(0, 12, 20)) && /חלון הפיפי/.test(M.ks.sleeps[0].why));
    wakeExpect = () => ({state:'unknown', since:null, sleepOn:null, likely:null, wakeBy:null, words:'unknown', src:'stub', n:0}); pottyExpect = () => ({pee:null, poop:null}); kochikExpect = () => ({gap:null, from:null, to:null, cap:null, sick:false, n:0, src:'stub'});
    M = plan(hist().concat(away(2, 90)));
    ok('contracts say nothing: the marked stand-ins are used (adapter), the plan still works', M.dur.wake === 'estimate' && M.kg.src === 'adapter' && M.free.length >= 1);
    ({wakeExpect, kochikExpect, pottyExpect} = real);
    // 9. Validator findings (26.11): later pee limits from her usual gap, not from a window stretched by sleep; a
    //    night sleep without a range follows the night rule; nap lengths from marked sleeps only.
    pottyExpect = () => ({pee: {from: at(0, 13, 20), to: at(0, 15, 40), trigger: 'wake', src: 'learned', n: 9}, poop: null});
    M = plan(hist().concat(away(2, 90)));
    const g9 = peeGapWin('kishmish', NOW), later = M.ks.sleeps.filter(x => !x.cur && x.peeTo);
    ok('S3: the current pee window from pottyExpect, later ones from her usual gap', M.ks.sleeps[0].peeTo === at(0, 15, 40) && !!g9 && later.length >= 1 && later.every(x => Math.abs(x.peeTo - x.prep.c) < (g9.to - g9.last) + 30*MIN) && M.dur.pee.span === g9.to - g9.last);
    ({wakeExpect, kochikExpect, pottyExpect} = real);
    wakeExpect = () => ({state:'asleep', since: at(-1, 22, 50), sleepOn: null, likely: null, wakeBy: null, words: 'unknown', src: 'model', n: 0});
    NOW = at(0, 6, 0);
    M = plan(hist(100, 'none').filter(e => e.t < at(0, 6)).concat([{...K0, k:'crate', t: at(-1, 22, 45)}, {...K0, k:'sleep', t: at(-1, 22, 50)}]));
    ok('S4: a night sleep with no range wakes by the night rule (her usual morning), not a day-nap range', M.dur.wake === 'night' && M.ks.sleeps[0].wake.from === planAt(NOW, M.st.morning));
    wakeExpect = real.wakeExpect; NOW = at(0, 12);
    seed(hist()); const n9 = planNaps(NOW).n;
    seed(hist().concat([{...K0, k:'crate', t: at(-1, 6, 30), end: at(-1, 6, 59)}, {...K0, k:'sleep', t: at(-1, 6, 31), end: at(-1, 6, 55), a: 1}]));
    ok('planNaps learns from marked sleeps only (a sleep whose start was the app\'s estimate is left out)', n9 > 0 && planNaps(NOW).n === n9 && episodes('kishmish', at(-1, 6), at(-1, 7)).some(e => e.src === 'mixed'));
    // 10. Owner, 26.11: away contexts kept apart; calibration — likely uninterrupted vs may be interrupted; preliminary.
    M = plan(hist().concat(away(2, 90, {ctx:'room'}), away(3, 60, {ctx:'other'})));
    const ev = M.away.by;
    ok('away evidence per context, never pooled: room 2 calm, other 3 calm, home none — and no outing from them', ev.room.calm === 2 && ev.other.calm === 3 && ev.home.n === 0 && ev.other.longestCalm === 60*MIN && ev.other.recency === NOW - (at(-1, 14) + 60*MIN) && !M.away.enough && M.free.length === 0);
    ok('…each context shown apart in "איך זה מחושב"', $q('.pl-info').textContent.includes('לבד בחדר (מישהו בבית): 2 פעמים, 2 רגועה') && $q('.pl-info').textContent.includes('עם מישהו אחר: 3 פעמים') && $q('.pl-info').textContent.includes('לבד בבית: עוד אין'));
    wakeExpect = () => ({state:'asleep', since: at(0, 11, 45), sleepOn: null, likely: {from: at(0, 13, 15), to: at(0, 13, 35)}, wakeBy: null, words: 'unsure', src: 'test', n: 9});
    M = plan(hist());
    const nx = M.ks.sleeps.find(x => !x.cur), lead = M.ks.bands.find(b => b.lead && b.a === nx.onset);
    ok('likely uninterrupted ends where her wake range begins (13:15); the rest of the range may be interrupted', planClass(M, at(0, 13, 10)).k === 'home' && planClass(M, at(0, 13, 20)).k === 'uns');
    ok('the next sleep is likely uninterrupted only after the carried uncertainty (10 min) has passed', !!lead && lead.b - lead.a === 10*MIN && planClass(M, nx.onset + 5*MIN).k === 'uns' && planClass(M, nx.onset + 15*MIN).k === 'home');
    ok('…and its likely-uninterrupted part also ends that much earlier', planClass(M, nx.wake.from - 5*MIN).k === 'uns');
    ok('every estimate is labelled preliminary', $q('.pl-hero .pl-pre').textContent === PL_PRE && [...document.querySelectorAll('.pl-list .pl-cert')].every(c => c.textContent.startsWith(PL_PRE)));
    wakeExpect = () => ({state:'asleep', since: at(0, 11, 45), sleepOn: null, likely: {from: at(0, 12, 10), to: at(0, 13, 40)}, wakeBy: null, words: 'unsure', src: 'test', n: 9});
    M = plan(hist());
    ok('"may be interrupted" stretches (a wide wake range: 12:10–12:55) are listed too, with their own badge', [...document.querySelectorAll('.pl-list .pl-badge.uns')].some(b => b.textContent === 'ייתכן שיפריעו') && /ייתכן שיפריעו/.test($q('.pl-stats').textContent));
    wakeExpect = real.wakeExpect;
    view = 'now'; window.Date = RealDate;
    done();
  } catch(e){ crashed(e); }
})();
