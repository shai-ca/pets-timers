// Potty by waking and by meals (25.11, POTTY_CUE): asleep → "pee right when she wakes" (window back after 4 h from the
// pee); waking from a nap of 45 min+ → "ישר לחצץ"; the usual pee gap leaves out gaps she mostly slept through;
// up to 30 min after a MEAL → "קקי אפשרי" and "gravel before the crate"; the gravel hint 10–15 min after a meal.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, h = new Date(now).getHours();
    if(h < 6 || h >= 22 || now - midnight() < 200*MIN){ ok('skipped (night: the gaps below are placed by the clock)', true); done(); return; }
    FAKE_TODAY = '2026-11-24';   // two months: three hours by age
    const pc = () => $q('#sec-potty').textContent, gv = () => { const x = $q('.gravel .trynow'); return x ? x.textContent : ''; };
    const what = () => $q('.cyc-n').textContent;
    // --- step 3: pee while she sleeps
    seed([{...K0, k:'pee', t: now - 60*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 30*MIN}]);
    ok('asleep: "pee right when she wakes" instead of the window', $q('#sec-potty .wakepee').textContent === 'פיפי צפוי מיד כשהיא מתעוררת' && !pc().includes('הפיפי הבא צפוי') && !$q('#sec-potty .gauge'));
    seed([{...K0, k:'pee', t: now - 200*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 30*MIN}]);
    ok('asleep 3:20 after the pee (past the window by age): still no late colours', !!$q('#sec-potty .wakepee') && !$q('#sec-potty .fc.late'));
    seed([{...K0, k:'pee', t: now - 250*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 30*MIN}]);
    ok('asleep 4 h after the pee: the window and its late colour are back', !$q('#sec-potty .wakepee') && !!$q('#sec-potty .fc.late') && peeAsleep('kishmish') === 'late');
    seed([{...K0, k:'pee', t: now - 250*MIN, w:'gravel'}]);
    ok('awake: the ordinary window line', !$q('#sec-potty .wakepee') && pc().includes('הפיפי היה צפוי'));
    // --- waking from a nap of 45 min or more
    seed([{...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 65*MIN, end: now - 5*MIN}]);
    ok('woke 5 min ago from an hour: "straight to the gravel" on the gravel card', gv().startsWith('ישר לחצץ') && gv().includes('אחרי שהתעוררה'));
    ok('…and in "what now?"', what().includes('ישר לחצץ') && what().includes('התעוררה משינה של'));
    seed([{...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 65*MIN, end: now - 20*MIN}]);
    ok('20 min after waking: still "straight to the gravel" (nothing logged since)', gv().startsWith('ישר לחצץ'));
    seed([{...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 65*MIN, end: now - 5*MIN}, {...K0, k:'none', t: now - 2*MIN}]);
    ok('"לא עשתה" since waking: gone from both', gv() === '' && !what().includes('ישר לחצץ'));
    seed([{...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 35*MIN, end: now - 5*MIN}]);
    ok('a 30-minute nap: the ordinary "good time to try", not "straight to the gravel"', gv().startsWith('זה זמן טוב לנסות') && !what().includes('ישר לחצץ'));
    seed([{...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 70*MIN}, {...K0, k:'sleep', t: now - 65*MIN, end: now - 3*MIN}]);
    ok('woke in the crate: "straight to the gravel" there too', gv().startsWith('ישר לחצץ') && what().includes('ישר לחצץ'));
    // --- the usual gap still counts gaps she slept through (owner, 25.11: the "less than half asleep" filter left 3 gaps)
    const at = (dayBack, hh, mm) => { const d = new Date(now); d.setDate(d.getDate() - dayBack); d.setHours(hh, mm, 0, 0); return d.getTime(); };
    const pees = [[5,10],[9,10],[11,40],[14,20],[17,10],[20,10],[22,50]].map(([a,b]) => ({...K0, k:'pee', t: at(1, a, b), w:'gravel'}));
    const sl = [{...K0, k:'sleep', t: at(1, 5, 20), end: at(1, 8, 50)}];
    seed(pees.concat(sl, [{...K0, k:'pee', t: now - 60*MIN, w:'gravel'}]));
    ok('a gap she slept through still counts (six gaps)', usualPeeGap('kishmish', now).n === 6);
    // --- step 4: poop by meals
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'food', t: now - 12*MIN, m:'meal'}]);
    ok('12 min after a meal: "a poop is possible", until meal + 30', $q('#sec-potty .mealpoop').textContent.includes('קקי אפשרי') && $q('#sec-potty .mealpoop').textContent.includes(clock(now - 12*MIN + 30*MIN)));
    ok('while the after-meal line shows, the usual-window bar ("עוד … לחלון") is hidden', !$q('#sec-potty [data-act=pt][data-k=poop]').closest('.card').querySelector('.gauge') && !$q('#sec-potty [data-act=pt][data-k=poop]').closest('.card').textContent.includes('לחלון'));
    ok('…the crate card says "gravel before the crate"', !!$q('#sec-crate .mealcrate') && $q('#sec-crate .mealcrate').textContent === 'כדאי לנסות חצץ לפני כלוב');
    ok('…and the gravel card "a good time to go to the gravel"', gv().startsWith('זה זמן טוב לצאת לחצץ') && gv().includes('אחרי ארוחה'));
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'food', t: now - 20*MIN, m:'meal'}]);
    ok('20 min after: the poop line stays, the try-now window (10–15) is over', !!$q('#sec-potty .mealpoop') && gv() === '');
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'food', t: now - 40*MIN, m:'meal'}]);
    ok('40 min after: nothing about the meal', !$q('#sec-potty .mealpoop') && !$q('.mealcrate'));
    seed([{...K0, k:'food', t: now - 90*MIN, m:'meal'}, {...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'food', t: now - 12*MIN, m:'bite'}]);
    ok('a bite is not a meal: no poop line, no hint', !$q('#sec-potty .mealpoop') && gv() === '');
    seed([{...K0, k:'food', t: now - 12*MIN, m:'meal'}, {...K0, k:'poop', t: now - 3*MIN, w:'gravel'}]);
    ok('pooped since the meal: gone', !$q('#sec-potty .mealpoop') && !$q('.mealcrate'));
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 20*MIN}, {...K0, k:'food', t: now - 12*MIN, m:'meal'}]);
    ok('a meal in the crate: the poop line, but no "before the crate" (she is in it)', !!$q('#sec-potty .mealpoop') && !$q('.mealcrate'));
    FAKE_TODAY = null;
    done();
  } catch(e){ crashed(e); }
})();
