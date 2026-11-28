// @clock 03:20
// @window 520,1000
// Last night, 27–28.11 (owner's real sequence, times only): pee 22:27 on the gravel; crate until 01:58; three night
// attempts without a pee — outing 01:58–02:00 "לא עשתה", outing 02:05–02:10 "לא עשתה", outing 02:26–02:32 with a poop
// only; food and water in between (the automatic retry crate stay ended with the water); back to sleep with no
// confirmed pee. The reassessment must stay due: not cancelled by the poop or a crate exit; the 4 h judged at the check.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null;
    const p = 'kishmish', K = { p }, N = Date.now(), at = (h, m, s = 0, back = 0) => { const d = new Date(N); d.setDate(d.getDate() - back); d.setHours(h, m, s, 0); return d.getTime(); };
    const g = (a, b) => ({ ...K, k:'gravel', t: a, end: b }), cr = (a, b) => ({ ...K, k:'crate', t: a, end: b });
    const start = [g(at(22,24,0,1), at(22,29,0,1)), { ...K, k:'water', t: at(22,25,0,1) }, { ...K, k:'pee', t: at(22,27,0,1), w:'gravel' }, { ...K, k:'poop', t: at(22,29,0,1), w:'gravel' }, cr(at(22,33,0,1), at(1,58))];
    const try1 = [g(at(1,58), at(2,0,28)), { ...K, k:'none', t: at(2,0,28) }, cr(at(2,0,28), at(2,3,4)), { ...K, k:'food', t: at(2,1) }, { ...K, k:'water', t: at(2,3,4) }, { ...K, k:'food', t: at(2,3,17) }];
    const try2 = [g(at(2,5), at(2,10,23)), { ...K, k:'none', t: at(2,10,23) }, cr(at(2,10,23), at(2,10,50)), { ...K, k:'food', t: at(2,10,42) }, { ...K, k:'water', t: at(2,10,50) }];
    const try3 = [g(at(2,26), at(2,32,27)), { ...K, k:'poop', t: at(2,28), w:'gravel' }, { ...K, k:'water', t: at(2,32,58) }, { ...K, k:'food', t: at(2,33,54) }];
    const R = (list, now) => { seed(list); return nightRecheck(p, now); };
    ok('one unsuccessful attempt: no reassessment yet (the retry itself runs)', R(start.concat(try1), at(2,1)) === null);
    let r = R(start.concat(try1, try2), at(2,12));
    ok('two attempts: scheduled 45 min after the second (02:55), the 4 h from 22:27 already reached by then', !!r && r.tries === 2 && r.at === at(2,55,23) && !r.due);
    r = R(start.concat(try1, try2, try3), at(2,40));
    ok('the 02:26–02:32 outing (poop only) is a third attempt and moves the check to 03:17; the poop cancels nothing', !!r && r.tries === 3 && r.at === at(3,17,27) && !r.due);
    ok('…water ending the automatic crate stay, and food, cancel nothing either', !!R(start.concat(try1, try2), at(2,20)));
    ok('unsuccessful attempts never restart the pee clock: the latest confirmed pee is still 22:27', lastElim(p, 'pee').exact && lastElim(p, 'pee').lo === at(22,27,0,1));
    ok('due at 03:17 and still due later in the night', R(start.concat(try1, try2, try3), at(3,18)).due && R(start.concat(try1, try2, try3), at(6,0)).due);
    // the screen at 03:20, as it would have looked while she slept
    const full = start.concat(try1, try2, try3); seed(full); render(); await wait(2);
    const card = () => $q('.recheck'), txt = () => (card() || {}).textContent || '';
    ok('the card at 03:20: "כדאי לבדוק אותה עכשיו" · 3 attempts · last confirmed pee 4:53 ago', !!card() && txt().includes('כדאי לבדוק אותה עכשיו') && txt().includes('3 ניסיונות') && txt().includes('פיפי אחרון שאושר לפני ' + words(Date.now() - at(22,27,0,1))));
    ok('…on the slim night screen too (the one open at night)', !nightFull && !!$q('#side .recheck'));
    ok('safety alerts are not touched: none yet at 4:53 from the pee', !alerts(p).some(a => a.k === 'pee' || a.k === 'poop'));
    ok('nothing written by showing it', JSON.stringify(state.log) === JSON.stringify(norm({ v:2, log: state.log }).log));
    // the pee's age is judged AT THE CHECK: with a pee at 23:00 the check waits for 03:00, not 02:55
    r = R([{ ...K, k:'pee', t: at(23,0,0,1), w:'gravel' }].concat(try1, try2), at(2,56));
    ok('a pee at 23:00: the check moves to 03:00 (4 h at the check), not 45 min after the last attempt', !!r && r.at === at(3,0) && !r.due && R([{ ...K, k:'pee', t: at(23,0,0,1), w:'gravel' }].concat(try1, try2), at(3,1)).due);
    // ONLY a confirmed pee ends it
    ok('an exact pee ends it', R(full.concat([{ ...K, k:'pee', t: at(3,19), w:'gravel' }]), at(3,20)) === null);
    { const R0 = Date.now, sh2 = at(6,50) - R0(); Date.now = () => R0() + sh2;   // it was found at 06:44: the clock must be past that
      ok('this morning\'s accident (unknown time 02:35–06:44, after all the attempts) ends it', R(full.concat([{ ...K, k:'pee', t: at(6,44), tu:[at(2,35), at(6,44)], w:'crate' }]), at(6,50)) === null);
      Date.now = R0; }
    ok('a poop at an unknown time does not end it', !!R(full.concat([{ ...K, k:'poop', t: at(3,0), tu:[at(2,35), at(3,0)], w:'crate' }]), at(3,20)));
    // an interval-censored pee that overlaps the attempts: counted from its earliest moment, said as uncertain
    const iv = [{ ...K, k:'pee', t: at(22,0,0,1), w:'gravel' }, { ...K, k:'pee', t: at(1,59), tu:[at(1,0), at(1,59)], w:'crate' }].concat(try1, try2, try3);
    r = R(iv, at(3,20));
    ok('a pee at an unknown time (01:00–01:59) before the attempts: the check is at 05:00 (4 h from the earliest it can have been)', !!r && r.at === at(5,0) && !r.due && !r.pee.exact);
    ok('…worded as uncertain: the range, never an exact "ago"', nightPeeAge(r, at(5,5)).includes('בזמן לא ידוע') && nightPeeAge(r, at(5,5)).includes('ייתכן') && !nightPeeAge(r, at(5,5)).includes('פיפי אחרון שאושר לפני') && nightPeeAge(r, at(6,30)).includes('לפחות'));
    // not by day, not while an outing runs, and it ends after the night
    ok('while an outing is running the card steps aside', R(full.concat([{ ...K, k:'gravel', t: at(3,18) }]), at(3,20)) === null);
    ok('the same sequence by day: no night reassessment', R([{ ...K, k:'pee', t: at(8,0,0,1), w:'gravel' }, { ...K, k:'none', t: at(13,0,0,1) }, { ...K, k:'none', t: at(13,20,0,1) }], at(13,0,0,1) + 2*HOUR) === null);
    ok('gone long after the night (7 h after the last attempt)', R(full, at(2,32,27) + NIGHT_SPAN + MIN) === null);
    // the optional reminder: offered before it is due, honest about what it can do
    seed(start.concat(try1, try2)); const live = nightRecheck(p, at(2,40));
    const ics = nightICS(p, live.at);
    ok('the calendar file has one event at the check time with an alert at its start', ics.includes('BEGIN:VALARM') && ics.includes('TRIGGER:PT0S') && ics.includes('DTSTART:' + new Date(Math.ceil(live.at / MIN) * MIN).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')) && (ics.match(/BEGIN:VEVENT/g) || []).length === 1);
    const RD = Date.now, shift = at(2,40) - RD(); Date.now = () => RD() + shift; render(); await wait(2);
    ok('before it is due the card says the app cannot wake her, names a clock alarm as safest, warns about focus modes', !!$q('.recheck [data-act=nightcal]') && txt().includes('האפליקציה לא יכולה להעיר אותך') && txt().includes('שעון מעורר') && txt().includes('עלול להשתיק'));
    let got = null; const D0 = planDownload; planDownload = (t, n) => { got = [t, n]; }; const log0 = JSON.stringify(state.log), W0 = WRITE_CALLS;
    $q('.recheck [data-act=nightcal]').click(); await wait(2); planDownload = D0; Date.now = RD;
    ok('the button only makes the calendar file: nothing written', !!got && got[1] === 'night-check.ics' && got[0].includes('VALARM') && JSON.stringify(state.log) === log0 && WRITE_CALLS === W0);
    done();
  } catch(e){ crashed(e); }
})();
