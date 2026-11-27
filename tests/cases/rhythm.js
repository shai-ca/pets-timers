// The pee window and the retry threshold from her own rhythm (owner's spec, 25.11): median of the last 3 days' gaps,
// nights (touching 23:00–05:00) and daytime gaps over 5 h left out; window 85%–115%; retry past 80%; by age with < 5.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, h = new Date(now).getHours();
    if(h < 6 || h >= 22 || now - midnight() < 200*MIN){ ok('skipped (night: the gaps below are placed by the clock)', true); done(); return; }
    FAKE_TODAY = '2026-11-24';   // two months: about three hours by age
    const at = (dayBack, hh, mm) => { const d = new Date(now); d.setDate(d.getDate() - dayBack); d.setHours(hh, mm, 0, 0); return d.getTime(); };
    // yesterday, in the day: 06:00, 08:30, 11:10, 14:00, 17:00, 20:10 → gaps 150, 160, 170, 180, 190 (median 170);
    // then 23:30 (a night gap); two days ago 08:00 → 14:30 (6:30, over 5 h); a night 22:00 → 02:00
    const day = [[6,0],[8,30],[11,10],[14,0],[17,0],[20,10],[23,30]].map(([a,b]) => ({...K0, k:'pee', t: at(1, a, b), w:'gravel'}));
    const old = [{...K0, k:'pee', t: at(2, 8, 0), w:'gravel'}, {...K0, k:'pee', t: at(2, 14, 30), w:'gravel'}, {...K0, k:'pee', t: at(2, 22, 0), w:'gravel'}, {...K0, k:'pee', t: at(1, 2, 0), w:'gravel'}];
    const last = now - 60*MIN, base = old.concat(day, [{...K0, k:'pee', t: last, w:'gravel'}]);
    seed(base);
    const u = usualPeeGap('kishmish', now);
    ok('usual gap: the median of the five daytime gaps (nights and the 6:30 left out)', !!u && u.n === 5 && u.med === 170*MIN);
    ok('night: a gap touching 23:00–05:00 counts as night; a daytime one does not', touchesNight(at(1, 20, 10), at(1, 23, 30)) && touchesNight(at(1, 2, 0), at(1, 6, 0)) && !touchesNight(at(1, 6, 0), at(1, 8, 30)));
    const f = peeForecast('kishmish');
    ok('window: 85%–115% of it after the last pee, not cut at the age limit', Math.abs(f.from - (last + .85*170*MIN)) < 1000 && Math.abs(f.to - (last + 1.15*170*MIN)) < 1000 && !f.byAge);
    ok('the card says where the window comes from', $q('#sec-potty .fcsrc').textContent.startsWith('לפי 5 מרווחים מ־3 הימים האחרונים'));
    ok('the age line carries her usual gap', $q('#sec-potty .byage').textContent === 'לפי הגיל: עד כ־3 שעות · בדרך כלל מחזיקה 2:50');
    // fewer than 5 gaps: by age
    seed(day.slice(0, 4).concat([{...K0, k:'pee', t: last, w:'gravel'}]));
    const g = peeForecast('kishmish');
    ok('fewer than 5 gaps: by age (85%–100% of three hours), and the card says so', g.byAge && Math.abs(g.from - (last + .85*3*HOUR)) < 1000 && g.to === last + 3*HOUR && $q('#sec-potty .fcsrc').textContent.includes('לפי הגיל'));
    // retry threshold: 80% of 170 = 136 minutes
    RETRY3_FROM = -Infinity;
    const p0 = now - 150*MIN, withPee = base.filter(e => e.t !== last).concat([{...K0, k:'pee', t: p0, w:'gravel'}]);
    seed(withPee.concat([{...K0, id:'n1', k:'none', t: p0 + 130*MIN}]));
    ok('"לא עשתה" 130 minutes after a pee (under 80%): only a note', !V.kishmish.retryNones.has(state.log.find(e => e.id === 'n1')));
    seed(withPee.concat([{...K0, id:'n2', k:'none', t: p0 + 140*MIN}]));
    ok('…140 minutes (past 80%): a retry', V.kishmish.retryNones.has(state.log.find(e => e.id === 'n2')));
    seed(day.slice(0, 3).concat([{...K0, k:'pee', t: p0, w:'gravel'}, {...K0, id:'n3', k:'none', t: p0 + 110*MIN}]));
    ok('too little data: the 2-hour threshold (110 minutes: a note)', !V.kishmish.retryNones.has(state.log.find(e => e.id === 'n3')));
    RETRY3_FROM = Infinity;
    seed(withPee.concat([{...K0, id:'n4', k:'none', t: p0 + 130*MIN}]));
    ok('before the cut-off an entry keeps the old rule (2 h: 130 minutes is a retry)', V.kishmish.retryNones.has(state.log.find(e => e.id === 'n4')));
    // "זה זמן טוב לנסות"
    const hint = () => { const x = $q('.gravel .trynow'); return x ? x.textContent : ''; };
    seed([{...K0, k:'pee', t: now - 90*MIN, w:'gravel'}, {...K0, k:'water', t: now - 15*MIN}]);
    ok('15 minutes after drinking: "a good time to try"', hint().includes('זה זמן טוב לנסות') && hint().includes('אחרי שתייה'));
    seed([{...K0, k:'pee', t: now - 90*MIN, w:'gravel'}, {...K0, k:'water', t: now - 5*MIN}]);
    ok('5 minutes after drinking: not yet', hint() === '');
    seed([{...K0, k:'pee', t: now - 90*MIN, w:'gravel'}, {...K0, k:'food', t: now - 15*MIN}, {...K0, k:'none', t: now - 2*MIN}]);
    ok('already went out since: no hint', hint() === '');
    seed([{...K0, k:'pee', t: now - 90*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 60*MIN, end: now - 3*MIN}]);
    ok('3 minutes after waking: the hint', hint().includes('אחרי שהתעוררה'));
    seed([{...K0, k:'pee', t: now - 90*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 30*MIN}, {...K0, k:'water', t: now - 15*MIN}]);
    ok('in the crate: no hint (she drinks inside the mesh crate too)', hint() === '');
    FAKE_TODAY = null;
    done();
  } catch(e){ crashed(e); }
})();
