// A pee / poop whose time is unknown (owner, 26.11: found in the crate in the morning): `t` = found, `tu` = [from, to].
// Counted (counts, places, misses); never a time she peed (clock, gaps, forecast, retry, rates, sleep untouched); logging
// it ends nothing; "לא ידוע מתי" sits inside the ordinary "מתי?" sheet (no extra tap on the ordinary path); day and night;
// both dogs; text export; sync keeps `tu`. Runs on a fake clock at 13:00 the day before the real day.
(async function(){
  const RealDate = Date, real0 = RealDate.now();
  const d0 = new RealDate(real0); d0.setDate(d0.getDate() - 1); d0.setHours(13, 0, 0, 0);
  const T0 = d0.getTime();
  class FakeDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(T0 + (RealDate.now() - real0)); } static now(){ return T0 + (RealDate.now() - real0); } }
  window.Date = FakeDate;
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, P = 'kishmish';
    const tileBtn = k => $q(`#main [data-act=pt][data-k=${k}]`) || $q(`[data-act=pt][data-k=${k}]`);
    // a morning: known pees every ~2:30 the day before, crate since 5 h ago with a marked sleep still running
    const base = []; for(let i = 0; i < 7; i++) base.push({...K0, k:'pee', t: now - 6*HOUR - (6 - i) * 40*MIN, w:'gravel'});
    const lastKnown = base[base.length - 1].t;
    const stay = {...K0, k:'crate', t: now - 5*HOUR}, slp = {...K0, k:'sleep', t: now - 290*MIN};
    const L = base.concat([{...K0, k:'food', t: now - 330*MIN, m:'meal'}, stay, slp]);
    seed(L.map(e => ({...e})));
    const gap0 = usualPeeGap(P, Date.now()), fc0 = peeForecast(P), spans0 = JSON.stringify(K().spans), rates0 = JSON.stringify(gravelRates(P));

    // ---- the ordinary path is unchanged: tile → "עכשיו" logs at once ----
    ASK_WHEN = true;
    tileBtn('pee').click();
    ok('the "מתי?" sheet of a pee offers "לא ידוע מתי" as one small extra', bg.classList.contains('show') && !!sh.querySelector('#tuGo') && !!sh.querySelector('[data-m="0"]'));
    sh.querySelector('[data-m="0"]').click();
    ok('ordinary pee: still two taps (tile, "עכשיו"), a known time, no range — and it ends the stay as before', logOf(P, 'pee').length === 8 && !logOf(P, 'pee').some(e => e.tu) && !K().crate.start);
    if(bg.classList.contains('show')) sh.querySelector('#cancel').click();
    ASK_WHEN = false; seed(L.map(e => ({...e}))); ASK_WHEN = true;
    tileBtn('food').click();
    ok('…not on other kinds (food)', !sh.querySelector('#tuGo')); close();

    // ---- "לא ידוע מתי": the range from the crate stay, editable ----
    tileBtn('pee').click(); sh.querySelector('#tuGo').click();
    ok('suggested range: from the crate entry to now', sh.querySelector('#tuA').value === clock(stay.t) && sh.querySelector('#tuB').value === clock(now) && sh.textContent.includes('מהכניסה לכלוב'));
    const fromEdit = now - 4*HOUR; sh.querySelector('#tuA').value = clock(fromEdit);
    sh.querySelector('#ok').click();
    const u = logOf(P, 'pee').find(e => e.tu);
    ok('logged: t = found, tu = [edited from, found], in the crate the whole time → "בכלוב"', !!u && Math.abs(u.t - now) < 120000 && Math.abs(u.tu[0] - Math.floor(fromEdit / 60000) * 60000) < 1000 && u.tu[1] === u.t && u.w === 'crate');
    ok('…then the usual "where?" question, "בכלוב" preselected', bg.classList.contains('show') && !!sh.querySelector('.chips.where [data-w=crate].sel'));
    sh.querySelector('#cancel').click();
    ASK_WHEN = false;
    ok('nothing ended: the crate stay and the marked sleep go on', !!K().crate.start && !!K().sleep.start && logOf(P, 'crate')[0].end == null && logOf(P, 'sleep').find(e => e.t === slp.t).end == null);
    ok('the last KNOWN pee stays the reference; the clock is now the RANGE since the unknown-time pee (owner, 28.11)', K().pee === lastKnown && !!$q('#sec-potty .big.tu') && $q(`#sec-potty .big.tu [data-since="${u.tu[1]}"]`) != null && $q(`#sec-potty .big.tu [data-since="${u.tu[0]}"]`) != null);
    ok('…and the card says a pee was found, time unknown', !!$q('.tuline') && $q('.tuline').textContent.includes('בזמן לא ידוע'));
    ok('usual gap and pee forecast unchanged', JSON.stringify(usualPeeGap(P, Date.now())) === JSON.stringify(gap0) && peeForecast(P).from === fc0.from && peeForecast(P).to === fc0.to);
    ok('sleep pieces unchanged (no waking inferred)', JSON.stringify(K().spans) === spans0);
    ok('gravel rates unchanged', JSON.stringify(gravelRates(P)) === rates0);
    ok('peeGapsObs: not a gap, an interval-censored record', peeGapsObs(P, now - 2*86400000, now + MIN).gaps.length === 6 && peeGapsObs(P, now - 2*86400000, now + MIN).intervals.length === 1 && peeGapsObs(P, now - 2*86400000, now + MIN).intervals[0].censored === 'interval');
    // counts and misses
    const st = stats(P, sod(now).getTime(), sod(now).getTime() + DAY), sc = successOf(P, sod(now).getTime(), sod(now).getTime() + DAY);
    ok('counted: in the day\'s pees, the places, and as a miss', st.pee >= 1 && st.w.pee.crate === 1 && sc.all >= 1 && todayWhere(P, 'pee').includes('פספוסים'));
    ok('list row: "פיפי · בכלוב · בזמן לא ידוע (בין … ל־…, נמצא ב־…)"', $q('#main').textContent.includes('פיפי · בכלוב · בזמן לא ידוע (בין '));
    const txt = logText(P, sod(now).getTime() - DAY, sod(now).getTime() + DAY);
    ok('export text the same way', txt.includes(`פיפי · בכלוב · בזמן לא ידוע (בין ${clock(u.tu[0])} ל־${clock(u.tu[1])}, נמצא ב־${clock(u.t)})`));
    const tl = timelineHTML(P, sod(now).getTime(), sod(now).getTime() + DAY);
    ok('timeline: a faint range, not a dot', tl.includes('class="u pee') && !tl.includes(`data-e="${state.log.indexOf(u)}" style="left:${((u.t - sod(now).getTime()) / DAY * 100).toFixed(2)}%" title`));
    // retry: the unknown pee does not count as "she peed"
    seed(L.filter(e => e !== stay && e !== slp).concat([{...K0, k:'pee', t: now - 30*MIN, tu: [now - 3*HOUR, now - 30*MIN], w:'floor'}, {...K0, k:'none', t: now - 2*MIN}]));
    ok('retry: a "לא עשתה" 6 h after the last KNOWN pee still calls one', !!retry(P));
    ok('…and the wheel does not move to "משחק" for it', !(routine(P) && routine(P).i === 2 && routine(P).t === now - 30*MIN));

    // ---- night screen: the same buttons reach it ----
    seed(L.map(e => ({...e})));
    FAKE_HOUR = 2; nightFull = false; render(); ASK_WHEN = true;
    ok('night: the slim screen', !!$q('.nightc'));
    tileBtn('pee').click();
    ok('night: the pee button\'s "מתי?" has "לא ידוע מתי"', !!sh.querySelector('#tuGo'));
    sh.querySelector('#tuGo').click(); sh.querySelector('#ok').click(); if(bg.classList.contains('show')) sh.querySelector('#cancel').click();
    ok('night: logged with a range, the stay still running', logOf(P, 'pee').some(e => e.tu) && !!K().crate.start);
    FAKE_HOUR = 12; ASK_WHEN = false; render();

    // ---- Kochik: a poop found at home, time unknown ----
    pet = 'kochik';
    seed([{p:'kochik', k:'poop', t: now - 7*HOUR, w:'out', q:'ok'}, {p:'kochik', k:'pee', t: now - HOUR, w:'out'}]);
    const g = tuSuggest('kochik', 'poop', now);
    ok('Kochik: suggested from her last known poop', g.from === now - 7*HOUR && g.to === now);
    logUnknown('kochik', 'poop', now - 5*HOUR, now); if(bg.classList.contains('show')) close();
    ok('Kochik: counted, clock unchanged, no where preset', KO().poop === now - 7*HOUR && stats('kochik', sod(now).getTime() - DAY, sod(now).getTime() + DAY).poop === 2 && !logOf('kochik', 'poop').find(e => e.tu).w);
    pet = 'kishmish';

    // ---- sync: tu survives norm / diff / patch, and is validated ----
    const a = norm({v:2, log: [{id:'x1', p:P, k:'pee', t: now, tu: [now - HOUR, now], w:'crate'}]});
    const b = patch(diff(norm({v:2, log: []}), a), norm({v:2, log: []}));
    ok('sync round-trip keeps tu', JSON.stringify(b.log[0].tu) === JSON.stringify([now - HOUR, now]));
    const bad = norm({v:2, log: [{id:'x2', p:P, k:'pee', t: now, tu: [now + HOUR, now - HOUR]}, {id:'x3', p:P, k:'pee', t: now, tu: 'x'}]}).log;
    ok('norm repairs a bad range (sorted, to ≤ t) and never drops it', bad[0].tu[0] === now - HOUR && bad[0].tu[1] === now && Array.isArray(bad[1].tu) && bad[1].tu[0] < bad[1].tu[1] + 1 && bad[1].tu[1] === now);
    // across midnight: counted in neither day, once in a period holding the whole range; the clock wording says it
    { const m0 = midnight(), ev = { p:'kishmish', k:'pee', t: m0 + 6*HOUR, w:'crate', tu:[m0 - 2*HOUR, m0 + 6*HOUR] };
      seed([{ p:'kishmish', k:'pee', t: m0 - 5*HOUR, w:'gravel' }, ev]);
      const d1 = stats('kishmish', m0 - 24*HOUR, m0), d2 = stats('kishmish', m0, m0 + 24*HOUR), both = stats('kishmish', m0 - 24*HOUR, m0 + 24*HOUR);
      ok('unknown time across midnight: in neither day, "unsure" in both, counted once over the two days', d1.pee === 1 && d2.pee === 0 && d1.unsure.pee === 1 && d2.unsure.pee === 1 && both.pee === 2 && !both.unsure.pee);
      ok('…and the miss is not given to the discovery day', successOf('kishmish', m0, m0 + 24*HOUR).all === 0);
      view = 'sum'; sumMode = 'day'; sumAnchor = m0 + HOUR; render();
      ok('the day summary says it is not counted there', !!$q('.tuunsure') && $q('.tuunsure').textContent.includes('לא ידוע באיזה יום')); view = 'now'; render();
      ok('the pee clock says a later pee at an unknown time happened', ($q('#sec-potty').textContent.includes('מאז הפיפי האחרון שזמנו ידוע') || $q('#sec-potty').textContent.includes('פיפי אחרון שנרשם') || $q('#sec-potty').textContent.includes('זמן לא ידוע')) && $q('#sec-potty').textContent.includes('לא אומר שהיא התאפקה'));
    }
    done();
  } catch(e){ crashed(e); }
  finally { window.Date = RealDate; }
})();
