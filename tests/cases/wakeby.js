// Steps 1–2 (owner, 25.11): asleep = no food banner (until the wake-by time); "let her sleep until HH:MM at the latest".
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'}, h = new Date(now).getHours();
    if(h < 9 || h >= 21){ ok('skipped (needs daytime: night sleeps have no wake-by)', true); done(); return; }
    // three naps of 60, 80, 100 min in the last days (daytime, yesterday) → 75th percentile 90
    const y = t => { const d = new Date(now - 86400000); d.setHours(...t, 0, 0); return d.getTime(); };
    const naps = [[[9,0],60],[[13,0],80],[[17,0],100]].map(([a, m]) => ({...K0, k:'sleep', t: y(a), end: y(a) + m*MIN}));
    FAKE_TODAY = '2026-11-24';   // two months old: three hours by age
    // ate 3:40 ago (past the 3:30 food alert), peed 1 h ago, asleep for 10 min
    const base = naps.concat([{...K0, k:'food', t: now - 220*MIN, m:'meal'}, {...K0, k:'pee', t: now - 60*MIN, w:'gravel'}]);
    seed(base);
    ok('awake, 3:40 after a meal: the food banner shows', $n('.card.alertc') === 1);
    seed(base.concat([{...K0, k:'sleep', t: now - 10*MIN}]));
    const w = wakeBy('kishmish');
    ok('asleep, but already past 3:30 from the meal: the banner and "wake her" agree', $n('.card.alertc') === 1 && w.past);
    seed(base.map(e => e.k === 'food' ? {...e, t: now - 200*MIN} : e).concat([{...K0, k:'sleep', t: now - 10*MIN}]));
    ok('asleep, 3:20 after the meal: no food banner yet', $n('.card.alertc') === 0 && !wakeBy('kishmish').past);
    seed(naps.concat([{...K0, k:'food', t: now - 30*MIN, m:'meal'}, {...K0, k:'pee', t: now - 150*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 10*MIN}]));
    ok('the pee cap is the age limit (3 h), not 4.5', wakeBy('kishmish').t === now - 150*MIN + 3*HOUR && wakeBy('kishmish').why.includes('לפי הגיל'));
    seed(base.concat([{...K0, k:'sleep', t: now - 10*MIN}]));
    ok('wake-by = the earliest: 3:30 after the meal (the food banner\'s time) beats the 90-minute nap and pee + 3 h', !!w && w.t === now - 220*MIN + 3.5*HOUR && w.why.includes('מהארוחה האחרונה'));
    seed(base.map(e => e.k === 'food' ? {...e, t: now - 200*MIN} : e).concat([{...K0, k:'sleep', t: now - 10*MIN}]));
    ok('the sleep card says until when, why, and what comes next', $q('#sec-rest').textContent.includes('נותנים לה לישון עד ' + clock(wakeBy('kishmish').t) + ' לכל המאוחר') && $q('#sec-rest').textContent.includes('כשהיא מתעוררת: חצץ ואז אוכל'));
    // nap median decides when it is the earliest
    seed(naps.concat([{...K0, k:'food', t: now - 30*MIN, m:'meal'}, {...K0, k:'pee', t: now - 20*MIN, w:'gravel'}, {...K0, k:'sleep', t: now - 10*MIN}]));
    ok('her usual long nap (75th percentile, 90 min) when it comes first', wakeBy('kishmish').t === now - 10*MIN + 90*MIN && wakeBy('kishmish').why.includes('נמנום רגיל'));
    // past the wake-by time
    seed(base.map(e => e.k === 'food' ? {...e, t: now - 230*MIN} : e).concat([{...K0, k:'sleep', t: now - 60*MIN}]));
    ok('past it: "wake her and go to the gravel", and the food banner is back', wakeBy('kishmish').past && $q('#sec-rest').textContent.includes('כדאי להעיר אותה ולצאת לחצץ') && $q('.cyc-n').textContent.includes('כדאי להעיר') && $n('.card.alertc') === 1);
    FAKE_TODAY = null;
    done();
  } catch(e){ crashed(e); }
})();
