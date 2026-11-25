// The planning tab ("תכנון"): free / needed / unsure time for both dogs, rebuilt from the list, never writing to it.
(async function(){
  try {
    // A fixed clock (this page only): 25.11.2026 12:00 local.
    const RealDate = Date; let NOW = new RealDate(2026, 10, 25, 12, 0).getTime();
    class FD extends RealDate { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
    window.Date = FD;
    reset();
    const at = (off, h, m = 0) => new RealDate(2026, 10, 25 + off, h, m).getTime(), K0 = {p:'kishmish'}, C0 = {p:'kochik'};
    const hist = () => {
      const L = [];
      for(const d of [-3, -2, -1]){
        // Kishmish: a steady round every 2:15 — gravel pee, meal, crate, asleep 5 min later for 100 min
        for(const [h, m] of [[7, 0], [9, 15], [11, 30], [13, 45], [16, 0], [18, 15], [20, 30]]){
          const T = at(d, h, m);
          L.push({...K0, k:'pee', t: T, w:'gravel'}, {...K0, k:'food', t: T + 5*MIN}, {...K0, k:'crate', t: T + 20*MIN, end: T + 130*MIN}, {...K0, k:'sleep', t: T + 25*MIN, end: T + 125*MIN});
        }
        // Kochik: a pee every two hours, both medicines, a meal at 17:00
        for(let h = 7; h <= 21; h += 2) L.push({...C0, k:'pee', t: at(d, h), w:'out'});
        L.push({...C0, k:'med_am', t: at(d, 8)}, {...C0, k:'med_pm', t: at(d, 20, 30)}, {...C0, k:'food', t: at(d, 17)});
      }
      for(const [h, m] of [[7, 0], [9, 15]]){ const T = at(0, h, m); L.push({...K0, k:'pee', t: T, w:'gravel'}, {...K0, k:'food', t: T + 5*MIN}, {...K0, k:'crate', t: T + 20*MIN, end: T + 130*MIN}, {...K0, k:'sleep', t: T + 25*MIN, end: T + 125*MIN}); }
      L.push({...K0, k:'pee', t: at(0, 11, 30), w:'gravel'}, {...K0, k:'food', t: at(0, 11, 35)}, {...K0, k:'crate', t: at(0, 11, 40)}, {...K0, k:'sleep', t: at(0, 11, 45)});
      L.push({...C0, k:'pee', t: at(0, 7, 30), w:'out'}, {...C0, k:'pee', t: at(0, 9, 40), w:'out'}, {...C0, k:'pee', t: at(0, 11, 50), w:'out'}, {...C0, k:'med_am', t: at(0, 8)});
      return L;
    };
    let commits = 0; const realCommit = commit; commit = (...a) => { commits++; return realCommit(...a); };
    const plan = (L, d = 0) => { seed(L); view = 'plan'; planDay = d; render(); return planBuild(d); };
    // 1. Asleep in the crate after a pee on the gravel, Kochik just peed: free from now until 15 min before she wakes.
    let L = hist();
    let M = plan(L); const before = JSON.stringify(state.log);
    const f = M.free[0];
    ok('three lanes (לי / קישמיש / קוצ׳יק) on the planning tab', $n('#main .pl-lane') === 3 && $q('#main .pl-tl').textContent.includes('קוצ׳יק') && !!$q('.seg [data-view=plan]') && $q('.seg [data-view=plan]').classList.contains('on'));
    ok('free now: 12:00 until 15 min before her expected wake (11:45 + 100 min)', !!f && f.a === NOW && f.b === at(0, 13, 10) && /קישמיש צפויה להתעורר/.test(f.endWhy));
    ok('…high confidence: three steady days of both dogs', f && f.conf === 'high');
    ok('…the card says it, with times and a calendar button', $q('.pl-card.free').textContent.includes('12:00–13:10') && $q('.pl-card.free').textContent.includes('ביטחון גבוה') && !!$q('.pl-card.free [data-pl=ics]'));
    ok('Kochik peed 10 minutes before: no "take her out", her pee is named instead', f && !f.kochikPee && f.before.some(s => s.includes('קוצ׳יק עשתה פיפי ב־11:50')));
    ok('Kishmish asleep already: "do not wake her"', f && f.before[0].includes('לא להעיר'));
    ok('the evening medicine is needed 20:00–21:00', M.needs.some(n => n.kind === 'med' && n.slot === 'pm' && n.a === at(0, 20) && n.b === at(0, 21)) && !M.needs.some(n => n.kind === 'med' && n.slot === 'am'));
    ok('Kishmish\'s waking is needed time, with a margin before it', M.needs.some(n => n.dog === 'kishmish' && n.a === at(0, 13, 10)));
    ok('no free window overlaps a need', M.free.every(fr => !M.needs.some(n => n.a < fr.b && n.b > fr.a)));
    ok('every free window starts within 15 min after a Kochik pee and is at least 45 min', M.free.every(fr => fr.b - fr.a >= PLAN.minFree && (fr.kochikPee || fr.a - fr.anchor <= PLAN.pad)));
    ok('every free window keeps Kochik within her gap and Kishmish within her pee window and crate limit', M.free.every(fr => fr.b <= fr.anchor + M.kg.gap && fr.b <= fr.sl.c + M.ks.alone));
    const me = planLanes(M).me;
    ok('the "לי" lane covers the day without gaps and explains every unsure stretch naming a dog', me[0].a === M.from && me[me.length-1].b === M.to && me.every((s, i) => !i || s.a === me[i-1].b) && me.filter(s => s.k === 'uns').every(s => /קישמיש|קוצ׳יק|לילה/.test(s.tip)));
    ok('the timeline uses the bar tips (tap shows the times and why)', $n('#main .pbar [data-tip]') > 5 && (() => { const s = $q('#main .pl-s.free'); s.click(); return /^אפשר לצאת · 12:00–13:10/.test($q('#main .pl-tl .ptip').textContent); })());
    // the redesign (25.11): my day first, three levels, certainty apart
    const lv = planLevels(M);
    ok('my lane: no gaps, every stretch is can-go-out / free at home / supervised / care / night', lv[0].a === M.from && lv[lv.length-1].b === M.to && lv.every((s, i) => !i || s.a === lv[i-1].b) && lv.every(s => ['free','home','sup','care','off'].includes(s.k)));
    ok('free now: the hero says so first, with what is left, the end and the certainty', $q('.pl-hero.now .pl-eye').textContent === 'אפשר לצאת עכשיו' && $q('.pl-hero .pl-big').textContent.includes('שעה ו־10') === false && $q('.pl-hero .pl-big').textContent.startsWith('עוד') && $q('.pl-hero .pl-meta').textContent.includes('עד 13:10') && $q('.pl-hero .pl-meta').textContent.includes('ודאות גבוהה'));
    ok('a compact summary: free time left, supervised time, the longest stretch, both at once', $n('.pl-stats > span') === 4 && $q('.pl-stats').textContent.includes('פנוי בבית בהמשך היום') && $q('.pl-stats').textContent.includes('אפשר לצאת') && $q('.pl-stats').textContent.includes('הרצף הפנוי הארוך'));
    ok('my windows: free and supervised, each with times, length, kind, certainty and a calendar button; the longest marked', $n('.pl-list .pl-w') >= 1 && !!$q('.pl-list .pl-w.longest') && [...document.querySelectorAll('.pl-list .pl-w')].every(w => !!w.querySelector('.pl-badge') && !!w.querySelector('[data-pl=ics]')));
    ok('free at home is its own level: Kishmish asleep in the crate, no need of either dog, never shorter than 25 min', lv.filter(x => x.k === 'home').every(x => { let a = x.a, b = x.b; for(const y of lv){ if((y.k === 'home' || y.k === 'free') && y.b === a) a = y.a; } for(const y of lv){ if((y.k === 'home' || y.k === 'free') && y.a === b) b = y.b; } return b - a >= PLAN.homeMin; }) && lv.filter(x => x.k === 'home').every(x => !M.needs.some(n => n.a < x.b && n.b > x.a)));
    ok('the outing windows are exactly planBuild\'s strict ones (unchanged)', lv.filter(x => x.k === 'free').every(x => M.free.some(f => f.a <= x.a && x.b <= f.b)));
    ok('planning stands on its own: no dog selector on this tab, and it is back on the others', getComputedStyle($q('.wrap > .seg:not(.sm)')).display === 'none' && (() => { view = 'now'; render(); const back = getComputedStyle($q('.wrap > .seg:not(.sm)')).display !== 'none'; view = 'plan'; render(); return back; })());
    ok('the next task of each dog is at the top, Kochik included; the task list is open and names the dog', $n('.pl-next li b') >= 2 && [...document.querySelectorAll('.pl-next li b')].map(b => b.textContent).join() .includes('קוצ׳יק') && !!$q('details.pl-care[open]') && [...document.querySelectorAll('.pl-care li .pl-td')].some(x => x.textContent === 'קוצ׳יק'));
    ok('the timeline: an hour grid, a now line, labels inside wide stretches', $n('.pl-grid i') >= 8 && !!$q('.pl-grid .pl-now') && !!$q('.pl-lane.me .pl-s i'));
    ok('later rounds are drawn as an estimate (hatched), what is happening now is not', $n('.pl-lane.me .pl-s.est') >= 1 && !$q('.pl-lane.me .pl-s.lv-free').classList.contains('est'));
    // 2. Read-only: building, clicking, toggling never writes
    $q('[data-pl=day][data-v="1"]').click();
    ok('tomorrow: a whole day from her morning, at most medium confidence', $q('.pl-range').textContent.includes('מחר') && planBuild(1).from > at(1, 5) && planBuild(1).free.every(x => x.conf !== 'high'));
    $q('[data-pl=day][data-v="0"]').click();
    let got = null; const realDl = planDownload; planDownload = (text, name) => { got = {text, name}; };
    $q('.pl-card.free [data-pl=ics]').click();
    ok('"add to calendar" makes an .ics with the window in Jerusalem time', !!got && /\.ics$/.test(got.name) && got.text.includes('BEGIN:VEVENT') && got.text.includes('DTSTART;TZID=Asia/Jerusalem:20261125T120000') && got.text.includes('DTEND;TZID=Asia/Jerusalem:20261125T131000') && got.text.includes('SUMMARY:זמן פנוי') && got.text.includes('ביטחון גבוה'));
    ok('…lines end in CRLF and are at most 75 octets', got.text.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75) && !/[^\r]\n/.test(got.text));
    $q('[data-pl=icsall]').click();
    ok('the whole day to the calendar: every free and needed window, titles naming the dog', got.text.split('BEGIN:VEVENT').length - 1 === M.free.length + M.needs.length && got.text.includes('SUMMARY:קוצ׳יק: תרופת ערב'));
    planDownload = realDl;
    $q('[data-pl=want][data-v="60"]').click();
    ok('"I want to go out" for an hour: the window and what to do before', $q('.pl-want .pl-fit') && $q('.pl-want').textContent.includes('12:00–13:10'));
    $q('[data-pl=want][data-v="120"]').click();
    ok('two hours: longer than Kochik can wait — someone will need to let her out', $q('.pl-want').textContent.includes('מישהו יצטרך להוציא את קוצ׳יק'));
    const inp = $q('#plWant'); inp.value = '50'; inp.dispatchEvent(new Event('input', {bubbles: true}));
    ok('a custom number of minutes', planWant === 50 && $q('#plWant').value === '50' && $q('.pl-want').textContent.includes('12:00–13:10'));
    planWant = 60; planCustom = '';
    ok('nothing written: the list is unchanged and no commit ran', JSON.stringify(state.log) === before && commits === 0);
    // 3. Kochik drank five minutes ago: her pee comes sooner, so no free time now
    M = plan(hist().concat([{...C0, k:'water', t: at(0, 11, 55)}]));
    ok('Kochik drank: her next pee 30 min after it closes the window', !M.free.some(x => x.a < at(0, 12, 30)) && M.ks.sleeps[0].why.includes('קוצ׳יק שתתה'));
    // 4. Diarrhoea in the last 24 h: at most 1.5 h between pees, and the card says why
    M = plan(hist().concat([{...C0, k:'poop', t: at(0, 9), q:'dia', w:'out'}]));
    ok('diarrhoea: Kochik\'s cap is 1.5 h and the window ends for her', M.kg.gap === PLAN.kochikSick && M.free[0] && M.free[0].b === at(0, 11, 50) + PLAN.kochikSick - PLAN.pad && M.free[0].endDog === 'kochik' && M.free[0].notes.some(s => s.includes('שלשול')));
    // 5. Kishmish went in after "לא עשתה" with no gravel pee in the last hour: not free
    L = hist().filter(e => !(e.p === 'kishmish' && e.k === 'pee' && e.t === at(0, 11, 30))).concat([{...K0, k:'none', t: at(0, 11, 38)}]);
    M = plan(L);
    ok('in the crate without a pee on the gravel: no free time in that sleep, and it says why', !M.free.some(x => x.a < M.ks.sleeps[0].wake) && M.ks.sleeps[0].why.includes('בלי פיפי בחצץ') && planWhy(M, at(0, 12, 30)).tip.includes('קישמיש'));
    if(!M.free.some(x => x.b > NOW)) ok('no free time ahead: the hero says so plainly and offers the next quiet (supervised) stretch', !!$q('.pl-hero.none') && $q('.pl-hero .pl-eye').textContent.includes('אין זמן פנוי') && (!!$q('.pl-hero .pl-big.sup') || $q('.pl-hero').textContent.includes('אין גם זמן שקט')));
    // 6. In the crate but not (yet) asleep: free time only once she is seen asleep
    M = plan(hist().filter(e => !(e.k === 'sleep' && e.end == null)).map(e => e.k === 'crate' && e.end == null ? {...e, ns: 1} : e));
    ok('in the crate, not asleep yet: not free now', !M.free.some(x => x.a < at(0, 12, 30)) && /עוד לא נרדמה/.test(M.ks.sleeps[0].why));
    // 7. Medicines: marked → no window; on a break → none at all
    M = plan(hist().concat([{...C0, k:'med_pm', t: at(0, 11, 55)}]));
    ok('evening medicine already marked: no window for it', !M.needs.some(n => n.kind === 'med'));
    M = plan(hist().concat([{...C0, k:'medoff', t: at(-1, 10)}]));
    ok('on a medicine break: no medicine windows', !M.needs.some(n => n.kind === 'med') && !planBuild(1).needs.some(n => n.kind === 'med'));
    ok('tomorrow both medicines are needed', planBuild(1, 0) && (seed(hist()), planBuild(1).needs.filter(n => n.kind === 'med').length === 2));
    // 8. Grooming: bath day for Kishmish is needed time; a spray an hour ago blocks free time for two hours after it
    M = plan(hist().concat([{...K0, k:'bath', t: at(-10, 18)}]));
    ok('bath day: Kishmish\'s bath (45 min with drying) is planned in her next waking', M.needs.some(n => n.dog === 'kishmish' && /מקלחת/.test(n.title) && n.bath && n.bath[1] - n.bath[0] === PLAN.bath.kishmish));
    M = plan(hist().concat([{...C0, k:'flea', t: at(0, 11)}]));
    ok('a spray an hour ago: nothing free until two hours after it', !M.free.some(x => x.a < at(0, 11) + FLEA_DRY) && planWhy(M, at(0, 12, 20)).tip.includes('הספריי'));
    // 9. Night: the day's plan is over
    NOW = at(0, 23); M = plan(hist());
    ok('at night: today has no plan, tomorrow does', M.from >= M.to && $q('.pl-empty') && planBuild(1).needs.length > 0);
    NOW = at(0, 12);
    // 10. An empty list does not break it
    M = plan([]);
    ok('no data at all: still draws; nothing high-confidence', $n('#main .pl-lane') === 3 && M.free.every(x => x.conf === 'medium'));
    ok('nothing was ever written', commits === 0);
    view = 'now'; window.Date = RealDate;
    done();
  } catch(e){ crashed(e); }
})();
