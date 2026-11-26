// Sleep and the crate (25.11): a quiet "awake in the crate" line after CRATE_AWAKE_NOTE minutes; a neutral note over the
// top of the sleep range; and after a kong / lick mat / food in the crate no estimated sleep before CRATE_TREAT_AWAKE.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 420*MIN, K0 = { p:'kishmish' }, D = 24*HOUR;
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    SLEEP2_FROM = now - 5*D;   // the mesh crate's rules: with no marked sleeps there, nothing is estimated
    CRATE_TREAT_FROM = -Infinity;
    const card = () => $q('[data-act=dur][data-k=crate]').closest('.card'), note = () => { const e = card().querySelector('.crawake'); return e ? e.textContent : ''; };
    const stay = (a, extra) => ({ ...K0, id:'now', k:'crate', t: now - a*MIN, c:'mesh', ...(extra || {}) });
    // 1. awake in the crate
    seed([stay(20)]);
    ok('20 minutes awake in the crate: no note yet', note() === '' && !K().sleep.start);
    seed([stay(30)]);
    ok('30 minutes awake in the crate: one calm line', note() === 'ערה בכלוב כבר ' + words(30*MIN) && !card().classList.contains('cry') && !card().textContent.includes('להוציא'));
    seed([stay(60), { ...K0, k:'sleep', t: now - 50*MIN, end: now - 20*MIN }]);
    ok('counted from the end of her last sleep in the stay (20 minutes ago): no note', note() === '');
    seed([stay(70), { ...K0, k:'sleep', t: now - 60*MIN, end: now - 30*MIN }]);
    ok('30 minutes since she woke in the stay: the note, counted from the waking', note() === 'ערה בכלוב כבר ' + words(30*MIN) && crateAwakeSince('kishmish') === now - 30*MIN);
    seed([stay(70), { ...K0, k:'sleep', t: now - 60*MIN }]);
    ok('asleep: no note', note() === '' && crateAwakeSince('kishmish') === 0);
    seed([{ ...K0, k:'crate', t: now - 90*MIN, end: now - 40*MIN, c:'mesh' }]);
    ok('out of the crate: no note', !$q('.crawake'));
    // 2. a lot of sleep
    FAKE_TODAY = '2026-11-24';   // two months old: 18–20 hours
    seed([{ ...K0, k:'sleep', t: now - 23*HOUR, end: now - 2*HOUR }]);
    ok('21 hours in the last 24: neutral words about her waking hours, no "wake her"', sleepGoalHTML('kishmish').includes('ישנה הרבה היום — כדאי לשים לב איך היא בזמן הערות: אנרגיה ותיאבון') && !sleepGoalHTML('kishmish').includes('להעיר'));
    seed([{ ...K0, k:'sleep', t: now - 23*HOUR, end: now - 4*HOUR }]);
    ok('19 hours: in the range, no note', !sleepGoalHTML('kishmish').includes('חסרות') && !sleepGoalHTML('kishmish').includes('ישנה הרבה'));
    FAKE_TODAY = null;
    // 3. a treat in the crate
    const past = lats => lats.flatMap((m, i) => [{ ...K0, k:'crate', t: now - 2*D - i*3*HOUR, end: now - 2*D - i*3*HOUR + 100*MIN, c:'mesh' }, { ...K0, k:'sleep', t: now - 2*D - i*3*HOUR + m*MIN, end: now - 2*D - i*3*HOUR + 90*MIN }]);
    const mine = () => K().spans.filter(sp => sp.stay === 'now');
    const kong = t => [{ ...K0, k:'play', y:'kong', t: now - t*MIN }, { ...K0, k:'food', y:'play', t: now - t*MIN }];
    seed(past([10, 10, 10, 10, 10]).concat([stay(90)], kong(85)));
    ok('a kong five minutes in: asleep no sooner than ' + CRATE_TREAT_AWAKE + ' minutes after it (her usual is 10)', mine().length === 1 && mine()[0].t === now - 85*MIN + CRATE_TREAT_AWAKE*MIN);
    seed(past([10, 10, 10, 10, 10]).concat([stay(90), { ...K0, k:'food', m:'meal', t: now - 85*MIN }]));
    ok('a meal in the crate: the same', mine().length === 1 && mine()[0].t === now - 85*MIN + CRATE_TREAT_AWAKE*MIN);
    seed(past([10, 10, 10, 10, 10]).concat([stay(90), { ...K0, k:'play', y:'lick', t: now - 85*MIN }, { ...K0, k:'water', t: now - 80*MIN }]));
    ok('a lick mat, then a drink: the drink starts the stretch, the lick mat still holds the estimate back', mine().length === 1 && mine()[0].t === now - 85*MIN + CRATE_TREAT_AWAKE*MIN);
    seed(past([40, 40, 40, 40, 40]).concat([stay(90)], kong(85)));
    ok('her usual delay is longer (40): it wins', mine().length === 1 && mine()[0].t === now - 45*MIN);
    seed(past([10, 10, 10, 10, 10]).concat([stay(90), { ...K0, k:'play', y:'rope', t: now - 85*MIN }]));
    ok('a rope is not a treat: her usual delay', mine()[0].t === now - 75*MIN);
    seed(past([10, 10, 10, 10, 10]).concat([stay(90), { ...K0, k:'food', t: now - 90*MIN - 2*MIN }]));
    ok('food before going in does not count', mine()[0].t === now - 80*MIN);
    CRATE_TREAT_FROM = now - 60*MIN;
    seed(past([10, 10, 10, 10, 10]).concat([stay(90)], kong(85)));
    ok('a kong before the cut-off: the old estimate exactly (past days do not move)', mine()[0].t === now - 75*MIN);
    CRATE_TREAT_FROM = -Infinity;
    seed(past([10, 10, 10, 10, 10]).concat([stay(20)], kong(15)));
    ok('15 minutes after a kong (her usual is 10): still shown awake, and no note yet',mine().length === 0 && !K().sleep.start && note() === '');
    done();
  } catch(e){ crashed(e); }
})();
