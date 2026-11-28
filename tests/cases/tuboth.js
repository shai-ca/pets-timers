// @clock 07:34
// @window 520,1000
// Owner's manual preview test, 28.11 (times only): last exact pee 22:27 yesterday; "לא עשתה" 02:00 and 02:10; a poop on
// the gravel 02:28; then a pee AND a poop in the crate somewhere in 02:35–06:44, found 06:44. 8 exact potties on the
// gravel in the last 24 h. CROSS-COMPONENT: every surface must read the latest CONFIRMED elimination (a range), never the
// latest exactly-timed one as if it were the latest; no invented forecast; meal- and wake-based advice stays.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null;
    const p = 'kishmish', K = { p }, N = Date.now(), at = (h, m, back = 0) => { const d = new Date(N); d.setDate(d.getDate() - back); d.setHours(h, m, 0, 0); return d.getTime(); };
    const hist = [];   // her rhythm: exact daytime pees on the two earlier days
    for(const back of [2, 1]) for(const h of [8, 10, 12, 14, 16]) hist.push({ ...K, k:'pee', t: at(h, 0, back), w:'gravel' });
    const base = hist.concat([{ ...K, k:'pee', t: at(19, 50, 1), w:'gravel' }, { ...K, k:'pee', t: at(22, 27, 1), w:'gravel' },
      { ...K, k:'poop', t: at(21, 0, 1), w:'gravel' }, { ...K, k:'none', t: at(2, 0) }, { ...K, k:'none', t: at(2, 10) }, { ...K, k:'poop', t: at(2, 28), w:'gravel' }]);
    const TU = [{ ...K, k:'pee', t: at(6, 44), tu: [at(2, 35), at(6, 44)], w:'crate' }, { ...K, k:'poop', t: at(6, 44), tu: [at(2, 35), at(6, 44)], w:'crate' }];
    seed(base); render(); await wait(2);
    const gap0 = usualPeeGap(p, N), g0 = scores(p);
    ok('before: exact pee → a forecast exists, gravel ' + g0.good + '/' + g0.all, !!peeForecast(p) && g0.good === g0.all);
    seed(base.concat(TU)); render(); await wait(2);
    const txt = () => ($q('#side').textContent + ' ' + $q('#main').textContent).replace(/\s+/g, ' ');
    const card = k => $q('.card [data-act=pt][data-k=' + k + ']').closest('.card'), ct = k => card(k).textContent.replace(/\s+/g, ' ');
    const L = lastElim(p, 'pee'), Q = lastElim(p, 'poop');
    ok('model: latest CONFIRMED pee and poop = the range 02:35–06:44, not exact; latest EXACT pee still 22:27, poop 02:28', !L.exact && L.lo === at(2, 35) && L.hi === at(6, 44) && !Q.exact && Q.lo === at(2, 35) && Q.hi === at(6, 44) && V[p].pee === at(22, 27, 1) && V[p].poop === at(2, 28));
    for(const k of ['pee', 'poop']){
      ok(k + ' card: range clock; says the latest confirmed one is at an unknown time; the exact one is labelled "בשעה ידועה לאחרונה"', !!card(k).querySelector('.big.tu') && ct(k).includes('האחרון שאושר: בזמן לא ידוע') && ct(k).includes('בשעה ידועה לאחרונה') && !ct(k).includes('אחרון שנרשם') && !ct(k).includes('לא תועד מאז'));
    }
    ok('forecasts withheld for both: no window computed, none drawn, each card says why', peeForecast(p) === null && peeWindow(p) === null && poopWindow(p) === null && pottyExpect(p).pee.from == null && pottyExpect(p).poop.trigger !== 'gap' && ct('pee').includes('אין תחזית לפיפי הבא') && !ct('pee').includes('החלון עבר') && !ct('poop').includes('החלון עבר'));
    ok('nowhere says it is unknown whether she peed, or "nothing recorded since 22:27"', !txt().includes('לא ידוע אם עשתה') && !txt().includes('לא נרשם פיפי מאז') && !txt().includes('פיפי אחרון שנרשם') && !txt().includes('לא נרשם קקי מאז') && !/אחרי האוכל מוציאים[^.]*ולא נרשם אם עשתה/.test(txt()));
    ok('no "הפיפי לא תועדו" anywhere', !txt().includes('הפיפי לא תועדו') && !/ה(פיפי|קקי|אוכל) לא תועדו/.test(txt()));
    { const a = alerts(p); ok('alerts: no 6 h pee alert from 22:27, no poop alert', !a.some(x => x.k === 'pee' || x.k === 'poop')); }
    { const s = scores(p); ok('gravel ring includes BOTH crate accidents in its denominator: ' + s.good + '/' + s.all + ' (was ' + g0.good + '/' + g0.all + ')', s.all === g0.all + 2 && s.good === g0.good && s.gravel < 100); }
    { const d = successOf(p, sod(N).getTime(), Infinity); ok('day success rate (pees): the accident is a miss', d.all === 1 && d.good === 0); }
    ok('place counts: a miss for pee and for poop today', /פספוסים 1/.test(todayWhere(p, 'pee')) && /פספוסים 1/.test(todayWhere(p, 'poop')));
    ok('the exact gap sample is unchanged', JSON.stringify(usualPeeGap(p, N)) === JSON.stringify(gap0));
    setSimple(true); render(); await wait(2);
    ok('מסך יונתן: the pee clock is the range with the unknown time, not 22:27', $q('.smp-since').textContent.includes('זמן לא ידוע') && !$q('.smp-since').textContent.includes('פיפי אחרון שנרשם') && !!$q('.smp-since [data-since="' + at(6, 44) + '"]'));
    setSimple(false); render(); close();
    unknownSheet(p, 'pee'); await wait(2);
    ok('the entry dialog describes the range, not "the clock continues from the last exact time"', sh.textContent.includes('טווח') && !sh.textContent.includes('השעון ממשיך מהפעם האחרונה')); close();
    // MEAL- and WAKE-based advice stays, independent of the unknown time
    const T1 = N;
    seed(base.concat(TU, [{ ...K, k:'food', t: T1 - 10*MIN, m:'meal' }])); render(); await wait(2);
    ok('after a meal: "קקי אפשרי ב־30 הדקות שאחרי ארוחה" still shows', mealPoopCue(p) === T1 - 10*MIN && $q('.card [data-act=pt][data-k=poop]').closest('.card').textContent.includes('אחרי ארוחה') && pottyExpect(p).poop.trigger === 'meal');
    seed(base.concat(TU, [{ ...K, k:'sleep', t: T1 - 90*MIN, end: T1 - 5*MIN }])); render(); await wait(2);
    ok('after a long nap: "go to the gravel on waking" and the take-out reminder still show', !!napWake(p) && $q('.card.cyc').textContent.includes('ישר לחצץ') && !!pottyDue(p) && !!pottyExpect(p).pee.afterWake);
    seed(base.concat(TU, [{ ...K, k:'sleep', t: T1 - 20*MIN }])); render(); await wait(2);
    ok('asleep: "פיפי צפוי מיד כשהיא מתעוררת" still shows', $q('#sec-potty').textContent.includes('פיפי צפוי מיד כשהיא מתעוררת'));
    // a later EXACT pee restores the exact clock and the forecast
    seed(base.concat(TU, [{ ...K, k:'pee', t: N - MIN, w:'gravel' }])); render(); await wait(2);
    ok('a later exact pee: exact clock, forecast back', lastElim(p, 'pee').exact && !!peeForecast(p) && !$q('.card [data-act=pt][data-k=pee]').closest('.card').querySelector('.big.tu'));
    // Kochik: the same rule
    seed([{ p:'kochik', k:'pee', t: N - 5*HOUR, w:'gravel' }, { p:'kochik', k:'pee', t: N - 10*MIN, tu: [N - 3*HOUR, N - 10*MIN], w:'home' }]); pet = 'kochik'; render(); await wait(2);
    ok('Kochik: no window from the older timed pee; the card shows the range', kochikExpect().from == null && peeForecast('kochik') === null && !!$q('.card [data-act=pt][data-k=pee]').closest('.card').querySelector('.big.tu'));
    pet = 'kishmish'; done();
  } catch(e){ crashed(e); }
})();
