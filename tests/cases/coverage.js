// Release 6b, owner's safeguard 2: the three alerts keep their thresholds, but a RED alarm only for a confirmed overdue
// event — the time since the last one is observed (journal: `dayParts` not "unknown"; camera: a crate stay it saw inside
// its coverage; `coveredSince`, COVER.gap = 20 min of unobserved time in all). Overdue with incomplete coverage → a
// calm, distinct card ("לא נרשם פיפי מאז … · לא תועד מאז, כדאי לבדוק"). Missing records alone never raise a red alarm.
// The food alert stays silent at night. מסך יונתן: no running clock across unobserved time either.
(async function(){
  try {
    const p = 'kishmish', K0 = { p };
    for(const phone of [true, false]){
      reset(); FAKE_PHONE = phone; const now = Date.now(), tag = (phone ? 'phone' : 'desktop') + (V2 ? ' v2' : ' v1') + ': ';
      const red = () => [...document.querySelectorAll('.alertc')].filter(x => !x.classList.contains('calm')).length, calm = () => [...document.querySelectorAll('.alertc.calm.unc')];
      // NOT covered: pee 7 h, meal 4 h, poop 49 h ago, nothing logged since → no red card, three calm ones
      seed([{ ...K0, k:'poop', t: now - 49*HOUR, w:'gravel' }, { ...K0, k:'pee', t: now - 7*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 4*HOUR, m:'meal' }]);
      let A = alerts(p);
      ok(tag + 'uncovered: the same three thresholds fire, all calm and marked unobserved', A.length === 3 && A.every(a => a.calm && a.unc) && red() === 0 && calm().length === 3);
      ok(tag + 'uncovered: the words — "לא נרשם פיפי מאז HH:MM", "לא תועד מאז, כדאי לבדוק"', A.find(a => a.k === 'pee').text === `לא נרשם פיפי מאז ${clock(now - 7*HOUR)}` && A.every(a => a.hint.startsWith('לא תועד מאז, כדאי לבדוק')) && A.find(a => a.k === 'food').text.startsWith('לא נרשמה ארוחה מאז'));
      ok(tag + 'uncovered: the food card still offers "הצעתי, לא אכלה"; the top card says to check her', !!$q('.alertc.unc [data-act=nofood]') && $q('.nowtop .nt-b').textContent.includes('לבדוק אותה'));
      // COVERED: logged crate stays all along, then out and seen (play) → the red alarms exactly as before
      seed([{ ...K0, k:'poop', t: now - 49*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 49*HOUR + MIN, end: now - 7*HOUR - MIN }, { ...K0, k:'pee', t: now - 7*HOUR, w:'gravel' },
        { ...K0, k:'crate', t: now - 7*HOUR + MIN, end: now - 40*MIN }, { ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'play', y:'rope', t: now - 30*MIN }]);
      A = alerts(p);
      ok(tag + 'covered: three RED alarms, release-5 wording', A.length === 3 && A.every(a => !a.calm && !a.unc) && red() === 3 && A.find(a => a.k === 'pee').hint === 'לשקול להתקשר לווטרינר.');
      // the boundary: 19 min unobserved = covered, 25 min = not (FAKE_HOUR 20: these hours are daytime whatever the run's clock)
      FAKE_HOUR = 20;
      seed([{ ...K0, k:'crate', t: now - 9*HOUR, end: now - 7*HOUR - 19*MIN }, { ...K0, k:'pee', t: now - 7*HOUR - 20*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 7*HOUR + 45*MIN, end: now - 10*MIN }, { ...K0, k:'play', y:'rope', t: now - 5*MIN }]);
      ok(tag + 'boundary: ' + hmm(unobserved(p, K().pee, now)) + ' unobserved after the pee (< 20 min) → covered, red', unobserved(p, K().pee, now) < COVER.gap && alerts(p).some(a => a.k === 'pee' && !a.calm));
      seed([{ ...K0, k:'crate', t: now - 9*HOUR, end: now - 7*HOUR - 19*MIN }, { ...K0, k:'pee', t: now - 7*HOUR - 20*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 7*HOUR + 60*MIN, end: now - 10*MIN }, { ...K0, k:'play', y:'rope', t: now - 5*MIN }]);
      ok(tag + 'boundary: ' + hmm(unobserved(p, K().pee, now)) + ' unobserved (≥ 20 min) → calm', unobserved(p, K().pee, now) >= COVER.gap && alerts(p).some(a => a.k === 'pee' && a.calm && a.unc));
      FAKE_HOUR = 12;
      // NIGHT: the food alert is silent, covered or not
      FAKE_HOUR = 2; nightFull = false;
      seed([{ ...K0, k:'food', t: now - 5*HOUR, m:'meal' }]);
      ok(tag + 'night: no food card (uncovered)', !alerts(p).some(a => a.k === 'food'));
      seed([{ ...K0, k:'food', t: now - 5*HOUR, m:'meal' }, { ...K0, k:'crate', t: now - 5*HOUR + MIN }]);
      ok(tag + 'night: no food card (covered)', !alerts(p).some(a => a.k === 'food'));
      FAKE_HOUR = 12;
      // מסך יונתן: the two clocks
      SIMPLE = true; seed([{ ...K0, k:'pee', t: now - 3*HOUR, w:'gravel' }, { ...K0, k:'food', t: now - 3*HOUR + 5*MIN, m:'meal' }]);
      const c = [...document.querySelectorAll('.smp-c')];
      ok(tag + 'מסך יונתן, uncovered: "פיפי אחרון שנרשם" + the time, "לא תועד מאז", no running clock; the state line on top', c.length === 2 && c[0].textContent.includes('פיפי אחרון שנרשם') && c[0].textContent.includes('לא תועד מאז') && !c[0].querySelector('[data-since]') && c[1].textContent.includes('ארוחה אחרונה שנרשמה') && !!$q('.smp-now'));
      seed([{ ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 25*MIN, m:'meal' }]);
      ok(tag + 'מסך יונתן, covered: the running clocks', $n('.smp-c [data-since]') === 2);
      SIMPLE = false; render();
      ok(tag + 'nothing written', state.log.length === 2);
    }
    done();
  } catch(e){ crashed(e); }
})();
