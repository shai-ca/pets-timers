// Wake-by, revised (owner, 25.11): no waking for a long nap; while she sleeps by day "wake her" only after 4 h from the
// last pee or ALERT.food (3:30) from the meal; past the age limit from the pee, a calm note only. Food banner held meanwhile.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, h = new Date(now).getHours();
    if(h < 9 || h >= 21){ ok('skipped (needs daytime: night sleeps have no wake-by)', true); done(); return; }
    FAKE_TODAY = '2026-11-24';   // two months old: three hours by age
    const y = t => { const d = new Date(now - 86400000); d.setHours(...t, 0, 0); return d.getTime(); };
    const naps = [[[9,0],30],[[13,0],40],[[17,0],50]].map(([a, m]) => ({...K0, k:'sleep', t: y(a), end: y(a) + m*MIN}));
    // a long nap (2 h already, far past her usual), meal 1 h ago, pee 2 h ago: nothing says wake her
    seed(naps.concat([{...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'pee', t: now - 120*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 120*MIN}]));
    let w = wakeBy('kishmish');
    ok('a long nap alone never makes "wake her": the earliest need is pee + 4 h', w.t === now - 120*MIN + 4*HOUR && !w.past && w.why.includes('מהפיפי'));
    ok('her usual long nap is only described', $q('#sec-rest').textContent.includes('נמנום ארוך רגיל אצלה') && $q('#sec-rest').textContent.includes('נותנים לה לישון עד ' + clock(w.t)));
    // past the age limit from the pee (3 h), not yet 4 h: a calm note, no "wake her"
    seed(naps.concat([{...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'pee', t: now - 200*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 60*MIN}]));
    ok('3:20 after the pee, asleep: an information line, no "wake her"', !!sleepPeeNote('kishmish') && $q('#sec-rest').textContent.includes('לא חייבים להעיר') && !wakeBy('kishmish').past && !$q('#sec-rest').textContent.includes('כדאי להעיר'));
    // 4 h from the pee: wake her
    seed(naps.concat([{...K0, k:'food', t: now - 60*MIN, m:'meal'}, {...K0, k:'pee', t: now - 245*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 60*MIN}]));
    ok('4 h after the pee: "wake her and go to the gravel"', wakeBy('kishmish').past && $q('#sec-rest').textContent.includes('כדאי להעיר אותה ולצאת לחצץ') && $q('.cyc-n').textContent.includes('כדאי להעיר'));
    // food: held while asleep until 3:30 from the meal, then wake her and the banner agree
    seed(naps.concat([{...K0, k:'food', t: now - 200*MIN, m:'meal'}, {...K0, k:'pee', t: now - 60*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 10*MIN}]));
    ok('asleep, 3:20 after the meal: no food banner', $n('.card.alertc') === 0 && !wakeBy('kishmish').past);
    seed(naps.concat([{...K0, k:'food', t: now - 220*MIN, m:'meal'}, {...K0, k:'pee', t: now - 60*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 10*MIN}]));
    ok('3:40 after the meal: "wake her" and the banner agree', wakeBy('kishmish').past && wakeBy('kishmish').why.includes('מהארוחה') && $n('.card.alertc') === 1);
    // the crate: asleep there is not "too long"
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 150*MIN}, {...K0, k:'sleep', t: now - 140*MIN}]);
    ok('2:30 in the crate, asleep most of it: no red', !crateOver('kishmish') && !$q('.card.cyc .duemsg'));
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel'}, {...K0, k:'crate', t: now - 150*MIN}, {...K0, k:'cry', t: now - 145*MIN}]);
    ok('2:30 awake in the crate: the warning says "awake"', crateOver('kishmish') && $q('.card.cyc').textContent.includes('ערה בכלוב יותר'));
    // sleep goal as a range
    ok('sleep goal: a range of 18–20 hours', sleepGoalHTML('kishmish').includes('מתוך 18–20 שעות'));
    FAKE_TODAY = null;
    done();
  } catch(e){ crashed(e); }
})();
