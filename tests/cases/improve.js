// 24.11 improvements: pee window capped by age, the wheel while she sleeps in a retry, the night's part of today's
// sleep, what she got inside the crate, poop notes, joining stays in one crate, the gravel clock ending the crate.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), late = now - m0 > 420*MIN && m0 + 24*HOUR - now > 30*MIN, K0 = { p:'kishmish' };
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    FAKE_TODAY = '2026-11-24';   // two months old: about three hours
    // 2. the pee window: her 24.11 numbers — gaps of 93…284 minutes, last pee 60 minutes ago
    const gaps = [93, 167, 167, 196, 205, 230, 249, 273, 284]; let t = now - 60*MIN; const pees = [{ ...K0, k:'pee', t, w:'gravel' }];
    for(const g of gaps.slice().reverse()){ t -= g*MIN; pees.unshift({ ...K0, k:'pee', t, w:'gravel' }); }
    seed(pees);
    const f = peeForecast('kishmish'), last = now - 60*MIN;
    ok('the window starts at her 25th percentile and ends at the age limit, not after it', Math.abs(f.from - (last + 167*MIN)) < 1000 && f.to === last + 3*HOUR && f.capped === true && $q('#sec-potty .fc').textContent.includes(clock(last + 167*MIN) + '–' + clock(last + 180*MIN)));
    ok('that she usually holds longer is a note, not a longer window', $q('#sec-potty .longer').textContent.includes('בדרך כלל מחזיקה יותר') && $q('#sec-potty .longer').textContent.includes('3 שעות ו־25'));
    const potty = () => $q('#sec-potty').textContent, count = (h, n) => h.split(n).length - 1;
    ok('…and her usual gap is written once: no separate "usually every…" line beside it', count(potty(), '3 שעות ו־25') === 1 && !potty().includes('בדרך כלל כל') && potty().includes('לפי הגיל: עד כ־3 שעות'));
    const flat = m => { let u = now - 60*MIN; const L = [{ ...K0, k:'pee', t: u, w:'gravel' }]; for(let i = 0; i < 6; i++){ u -= m*MIN; L.unshift({ ...K0, k:'pee', t: u, w:'gravel' }); } return L; };
    seed(flat(190));
    ok('ten minutes from the age guideline: no "more / less" note, just the usual gap', !$q('#sec-potty .longer') && !$q('#sec-potty .shorter') && potty().includes('בדרך כלל כל 3 שעות ו־10'));
    seed(flat(150));
    ok('half an hour under it: "usually holds less", with the number once', $q('#sec-potty .shorter').textContent === 'בדרך כלל מחזיקה פחות: כ־שעתיים ו־30 דק׳' && !potty().includes('בדרך כלל כל'));
    seed(flat(195));
    ok('exactly fifteen minutes over: the note', !!$q('#sec-potty .longer') && !potty().includes('בדרך כלל כל'));
    seed(pees);
    $q('[data-act=fcwhy]').click();
    ok('the small "?" explains where the window comes from', bg.classList.contains('show') && sh.textContent.includes('תחילת החלון') && sh.textContent.includes('רבע מהמרווחים') && sh.textContent.includes('מגבלת הגיל')); close();
    FAKE_TODAY = '2027-06-20'; render();   // nine months: eight hours at most — no cap in practice
    ok('an older puppy with a higher limit gets the full window and no note', Math.abs(peeForecast('kishmish').to - (last + 249*MIN)) < 1000 && !$q('#sec-potty .longer'));
    FAKE_TODAY = '2026-10-10'; render();   // under a month: one hour — the start is past the limit too
    ok('when even the start is past the limit the line is just "until…"', peeForecast('kishmish').from === peeForecast('kishmish').to && $q('#sec-potty .fc').textContent.includes('עד ' + clock(last + HOUR)));
    FAKE_TODAY = '2026-11-24';
    // 3. the wheel while she sleeps in a retry
    seed([{ ...K0, k:'crate', t: now - 400*MIN, end: now - 20*MIN }, { ...K0, k:'pee', t: now - 200*MIN, w:'gravel' }]);
    tile('none').click();
    ok('retry, awake: "do what the card says"', $q('.cyc-n').textContent.includes('עושים מה שכתוב בכרטיס'));
    tapDur('kishmish', 'sleep');
    ok('retry, asleep: "let her sleep; when she wakes, straight to the gravel"', $q('.cyc-n').textContent.includes('נותנים לה לישון. כשהיא מתעוררת, ישר לחצץ.') && !$q('.cyc-n').textContent.includes('עושים מה שכתוב'));
    // 5. the night's part of today's sleep
    seed([{ ...K0, id:'nightc', k:'crate', t: m0 - 156*MIN, end: m0 + 77*MIN }, { ...K0, k:'crate', t: m0 + 80*MIN, end: m0 + 200*MIN }, { ...K0, k:'sleep', t: m0 + 80*MIN, end: m0 + 200*MIN }, { ...K0, k:'pee', t: m0 + 205*MIN, w:'gravel' }]);
    ok('the sleep card says how much of today\'s total came from the night', todayTotal('kishmish', 'sleep') === 77*MIN + 120*MIN && nightPart('kishmish') === 77*MIN && $q('#sec-rest').textContent.includes('כולל שעה ו־17 דק׳ מהלילה'));
    const groups = [...document.querySelectorAll('.uni .rd')], lastG = groups[groups.length - 1];
    ok('today\'s list ends with a "from the night" group: the stay and the sleep that began yesterday', lastG.classList.contains('night') && lastG.textContent.includes('מהלילה') && lastG.querySelectorAll('.r').length === 2 && lastG.textContent.includes('בכלוב') && lastG.textContent.includes('ישנה') && lastG.textContent.includes('אתמול'));
    seed([{ ...K0, k:'crate', t: m0 + 80*MIN, end: m0 + 200*MIN }]);
    ok('a day with nothing carried over shows neither', !$q('.uni .rd.night') && !$q('#sec-rest').textContent.includes('מהלילה'));
    // 6. what she got inside the crate
    seed([{ ...K0, k:'pee', t: now - 200*MIN, w:'gravel' }, { ...K0, k:'play', t: now - 150*MIN, y:'kong' }, { ...K0, k:'food', t: now - 150*MIN, y:'play' }, { ...K0, k:'crate', t: now - 120*MIN, end: now - 30*MIN }, { ...K0, k:'play', t: now - 100*MIN, y:'kong' }, { ...K0, k:'food', t: now - 100*MIN, y:'play' }, { ...K0, k:'food', t: now - 30*MIN }]);
    const txt = $q('.uni').textContent;
    ok('a kong inside a crate stay reads "got in the crate", the food with it "ate in the crate"', txt.includes('קיבלה בכלוב · קונג ממולא') && txt.includes('אכלה בכלוב'));
    ok('outside the crate, and a meal that ended a stay under the old rule, read as before', txt.includes('משחק · קונג ממולא') && (txt.match(/קיבלה בכלוב/g) || []).length === 1 && (txt.match(/אכלה בכלוב/g) || []).length === 1 && logText('kishmish', m0, m0 + 24*HOUR).includes('קיבלה בכלוב · קונג ממולא'));
    // 4. joining two stays in the same crate adds no change of crate
    seed([{ ...K0, id:'a', k:'crate', t: now - 200*MIN, end: now - 150*MIN, c:'mesh' }, { ...K0, k:'food', t: now - 150*MIN + 3000 }, { ...K0, id:'b', k:'crate', t: now - 150*MIN + 11000, end: now - 60*MIN, c:'mesh' }]);
    $q('.r[data-e="' + state.log.indexOf(state.log.find(e => e.id === 'b')) + '"]').click(); sh.querySelector('#join').click();
    ok('two stays in one crate join into one stay and one round, with no "moved to another crate" entry', logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].end === now - 60*MIN && logOf('kishmish', 'swap').length === 0 && roundStarts('kishmish').length === 1 && $q('.uni').textContent.includes('אכלה בכלוב'));
    // 7. poop
    seed([{ ...K0, k:'poop', t: now - 20*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 20*MIN }]);
    const pc = () => $q('#sec-potty').textContent;
    ok('twenty minutes after a meal: when a poop usually comes — a quiet line', pc().includes('אם היא צריכה קקי, זה בדרך כלל 10–30 דקות אחרי ארוחה') && !pc().includes('לא היה קקי'));
    seed([{ ...K0, k:'poop', t: now - 20*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 60*MIN }]); ok('an hour after the meal it is gone', !pc().includes('10–30'));
    seed([{ ...K0, k:'food', t: now - 20*MIN }, { ...K0, k:'poop', t: now - 5*MIN, w:'gravel' }]); ok('…and once she has pooped', !pc().includes('10–30'));
    seed([{ ...K0, k:'poop', t: now - 29*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 2*HOUR }]); ok('little history: 29 hours without a poop says nothing', !$q('.poopgap') && $n('.card.alertc') === 0);
    seed([{ ...K0, k:'poop', t: now - 31*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 2*HOUR }]);
    ok('…31 hours: a plain line, no red card, no claim about "usual"', $q('.poopgap').textContent === 'לא היה קקי כבר 31 שעות' && $n('.card.alertc') === 0);
    const hist = [100, 76, 52, 28].map(h => ({ ...K0, k:'poop', t: now - h*HOUR, w:'gravel' }));   // every 24 hours; the last one 28 hours ago
    seed(hist.concat([{ ...K0, k:'food', t: now - 2*HOUR }])); ok('her own rhythm (every 24 hours): 28 hours is still within one and a half times that', poopGap('kishmish') === 24*HOUR && !$q('.poopgap'));
    seed([124, 100, 76, 37].map(h => ({ ...K0, k:'poop', t: now - h*HOUR, w:'gravel' })).concat([{ ...K0, k:'food', t: now - 2*HOUR }]));
    ok('37 hours with a 24-hour rhythm: "longer than usual for her" — still no red card', $q('.poopgap').textContent === 'לא היה קקי כבר 37 שעות, יותר מהרגיל אצלה' && $n('.card.alertc') === 0);
    seed([{ ...K0, k:'poop', t: now - 49*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 2*HOUR }]); ok('the red card only after 48 hours', $n('.card.alertc') === 1);
    // "we went to the gravel" means out of the crate and awake
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'sleep', t: now - 50*MIN }]);
    $q('[data-act=dur][data-k=gravel]').click();
    const cr = logOf('kishmish', 'crate')[0], sl = logOf('kishmish', 'sleep')[0], gr = logOf('kishmish', 'gravel')[0];
    ok('starting the gravel clock in the crate, asleep: the crate stay and the sleep both end at that moment', !!gr && !gr.end && cr.end === gr.t && sl.end === gr.t && !K().crate.start && !K().sleep.start && !!K().gravel.start);
    seed([{ ...K0, k:'sleep', t: now - 50*MIN }]); $q('[data-act=dur][data-k=gravel]').click();
    ok('asleep outside the crate: the sleep ends', !!logOf('kishmish', 'sleep')[0].end && !!K().gravel.start);
    seed([{ ...K0, k:'crate', t: now - 60*MIN }]); tapDur('kishmish', 'gravel', now - 10*MIN);
    ok('"we went out ten minutes ago": the crate ended ten minutes ago', logOf('kishmish', 'crate')[0].end === now - 10*MIN);
    done();
  } catch(e){ crashed(e); }
})();
