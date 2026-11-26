// "יוצאים לחצץ?" says how the LAST gravel outing ended (owner, 26.11), from the results that belong to that outing:
// pee within the outing (time from its clock), pee + poop, "לא עשתה", an outing with no result (no line, never
// "לא עשתה"), a running outing (its own clock, no "last attempt" line). Statistics unchanged.
(async function(){
  try {
    const row = () => { const c = [...document.querySelectorAll('#sec-potty .card.slim.gravel, .card.slim.gravel')][0]; return c ? c.textContent : ''; };
    const at = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
    const K0 = { p:'kishmish' };
    const usual = () => JSON.stringify([usualWait('kishmish', ['pee'], 0, Date.now() + 1), gravelRates('kishmish'), peeForecast('kishmish')]);

    reset(); seed([{ ...K0, k:'pee', t: at(9, 0) }, { ...K0, k:'gravel', t: at(10, 40), end: at(10, 45) }, { ...K0, k:'pee', t: at(10, 41), w:'gravel' }]); FAKE_HOUR = 12; render(); await wait(2);
    ok('pee within the outing: "ניסיון אחרון: פיפי תוך דקה · 10:40"', row().includes('ניסיון אחרון: פיפי תוך דקה') && row().includes(clock(at(10, 40))) && !row().includes('לא עשתה לאחרונה'));

    reset(); seed([{ ...K0, k:'gravel', t: at(9, 55), end: at(10, 5) }, { ...K0, k:'pee', t: at(9, 58), w:'gravel' }, { ...K0, k:'poop', t: at(10, 2), w:'gravel' }]); render(); await wait(2);
    ok('pee and poop: "ניסיון אחרון: פיפי וקקי"', row().includes('ניסיון אחרון: פיפי וקקי') && row().includes(clock(at(9, 55))));

    reset(); seed([{ ...K0, k:'pee', t: at(8, 0) }, { ...K0, k:'gravel', t: at(10, 15), end: at(10, 17) }, { ...K0, k:'none', t: at(10, 17) }]); render(); await wait(2);
    ok('"לא עשתה" that ended the outing: "ניסיון אחרון: לא עשתה"', row().includes('ניסיון אחרון: לא עשתה') && row().includes(clock(at(10, 15))));

    // the latest outing has nothing recorded; an older one had "לא עשתה", and a pee was logged later outside any outing
    reset(); seed([{ ...K0, k:'gravel', t: at(8, 0), end: at(8, 3) }, { ...K0, k:'none', t: at(8, 3) }, { ...K0, k:'gravel', t: at(10, 0), end: at(10, 10) }, { ...K0, k:'pee', t: at(10, 30), w:'pad' }]); render(); await wait(2);
    ok('an outing with no result: no line — never "לא עשתה", not the older outing, not the later pee', !row().includes('ניסיון אחרון') && !row().includes('לא עשתה לאחרונה') && lastOuting('kishmish') === null);

    reset(); const t0 = Date.now() - 4*MIN; seed([{ ...K0, k:'gravel', t: at(9, 0), end: at(9, 5) }, { ...K0, k:'pee', t: at(9, 2), w:'gravel' }, { ...K0, k:'gravel', t: t0 }]); render(); await wait(2);
    ok('a running outing: its own clock, no "last attempt" line', row().includes('בחצץ כבר') && !!$q('.card.slim.gravel.on [data-since="' + t0 + '"]') && !row().includes('ניסיון אחרון'));

    reset(); seed([{ ...K0, k:'gravel', t: at(10, 40), end: at(10, 45) }, { ...K0, k:'pee', t: at(10, 41), w:'gravel', g: 3 }]); render(); await wait(2);
    ok('time to pee only from the outing\'s clock (not the typed minutes)', row().includes('פיפי תוך דקה'));
    { const s = usual(); render(); ok('statistics and forecasts unchanged by the line', usual() === s); }
    done();
  } catch(e){ crashed(e); }
})();
