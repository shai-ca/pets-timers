// The mesh crate: eating inside it, changing crate without splitting the round, which round an entry is listed
// under, and a cry timer left running.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 400*MIN, K0 = { p:'kishmish' }, cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; }, stays = () => logOf('kishmish', 'crate');
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    // 1. food and enrichment inside the crate
    seed([{ ...K0, k:'pee', t: now - 100*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 60*MIN }]);
    const card = () => $q('#sec-crate .card.item');
    ok('while she is in the crate its card offers kong, lick mat and a meal', [...card().querySelectorAll('.incr button')].map(b => b.textContent).join() === 'קונג ממולא,משטח ליקוק,ארוחה');
    card().querySelector('.incr [data-act=play][data-k=kong]').click();
    ok('a kong in the crate: still in the crate, same round, wheel on "crate", counted as food', !!K().crate.start && stays().length === 1 && !stays()[0].end && roundStarts('kishmish').length === 1 && cur() === 'כלוב' && logOf('kishmish', 'play')[0].y === 'kong' && logOf('kishmish', 'food').length === 1 && mealKind(logOf('kishmish', 'food')[0]) === 'meal');
    card().querySelector('.incr [data-act=crfood]').click();
    ok('a meal in the crate: the same', !!K().crate.start && stays().length === 1 && logOf('kishmish', 'food').length === 2 && cur() === 'כלוב');
    tile('food').click(); tile('water').click(); logPlay('kishmish', 'lick', true); logPlay('kishmish', 'rope', true); logNoFood('kishmish', true);
    ok('from the food and play cards too: eating, drinking and playing never end the crate', !!K().crate.start && stays().length === 1 && roundStarts('kishmish').length === 1 && cur() === 'כלוב');
    ok('they are listed in the current round', $n('.uni .rd') === 2 && $q('.uni .rd').textContent.includes('קונג ממולא') && $q('.uni .rd').textContent.includes('שתתה'));
    { const t0 = Date.now(); while(Date.now() < t0 + 3); }   // real taps are never in the same millisecond as the meal before them
    tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    ok('a pee still means she came out', !K().crate.start && !!stays()[0].end && !$q('#sec-crate .incr'));
    ok('out of the crate the wheel goes on from what happened since, not from the meal she had inside', cur() === 'משחק');
    // 2. changing crate
    SLEEP2_FROM = now - 500*MIN;
    seed([{ ...K0, k:'crate', t: now - 600*MIN, end: now - 560*MIN }, { ...K0, k:'crate', t: now - 90*MIN }]);
    ok('entries with no crate on them are read by their time: the box before the move, the mesh crate after', crateKind(stays()[0]) === 'box' && crateKind(stays()[1]) === 'mesh' && crateAt('kishmish', now) === 'mesh' && crateAt('kishmish', now - 580*MIN) === 'box' && crateAt('kishmish', now - 300*MIN) === null && card().textContent.includes('כלוב רשת') && !('c' in stays()[0]));
    $q('[data-act=swap]').click();
    const sw = logOf('kishmish', 'swap')[0];
    ok('"change of crate": one entry inside the stay; the stay, its timer and the round go on', !!sw && sw.c === 'box' && stays().length === 2 && !stays()[1].end && K().crate.start === now - 90*MIN && roundStarts('kishmish').filter(r => r.t > now - 200*MIN).length === 1 && cur() === 'כלוב');
    ok('she is now in the other crate; the list says so', crateAt('kishmish', Date.now()) === 'box' && crateAt('kishmish', now - 30*MIN) === 'mesh' && card().textContent.includes('בוקס') && $q('.uni').textContent.includes('הועברה לבוקס'));
    tapDur('kishmish', 'crate'); tapDur('kishmish', 'crate');
    ok('"went into the crate" means the crate used last, and new entries say which', stays()[2].c === 'box' && crateAt('kishmish', Date.now()) === 'box');
    ASK_WHEN = true; $q('[data-act=swap]').click();
    ok('the sheet: which crate (the other one chosen), then when', [...sh.querySelectorAll('[data-c]')].map(b => b.textContent).join() === 'בוקס,כלוב רשת' && sh.querySelector('[data-c].sel').dataset.c === 'mesh' && !!sh.querySelector('[data-m="0"]'));
    sh.querySelector('[data-m="0"]').click(); ASK_WHEN = false;
    ok('…and back to the mesh crate', crateAt('kishmish', Date.now()) === 'mesh' && logOf('kishmish', 'swap').length === 2);
    // joining two stays that were really one (the 12:06 / 12:11 split)
    seed([{ ...K0, id:'s1', k:'crate', t: now - 200*MIN, end: now - 100*MIN, c:'box' }, { ...K0, k:'cry', t: now - 150*MIN, end: now - 145*MIN }, { ...K0, id:'f1', k:'food', t: now - 95*MIN + 20000 - 60000 }, { ...K0, id:'s2', k:'crate', t: now - 95*MIN, end: now - 30*MIN, c:'mesh' }, { ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }]);
    ok('before: two stays, two rounds', roundStarts('kishmish').length === 2);
    $q('.r[data-e="' + state.log.indexOf(state.log.find(e => e.id === 's2')) + '"]').click();
    ok('the later stay\'s sheet offers its crate kind and to join it to the stay before', sh.querySelector('[data-c].sel').dataset.c === 'mesh' && !!sh.querySelector('#join'));
    sh.querySelector('#join').click();
    ok('joined: one stay from the first entry to the last exit, a change of crate at the join, one round', stays().length === 1 && stays()[0].id === 's1' && stays()[0].t === now - 200*MIN && stays()[0].end === now - 30*MIN && stays()[0].c === 'box' && logOf('kishmish', 'swap').length === 1 && logOf('kishmish', 'swap')[0].t === now - 95*MIN && logOf('kishmish', 'swap')[0].c === 'mesh' && roundStarts('kishmish').length === 1 && crateAt('kishmish', now - 60*MIN) === 'mesh' && crateAt('kishmish', now - 120*MIN) === 'box');
    $q('#undo').click(); ok('undo splits them again', stays().length === 2 && logOf('kishmish', 'swap').length === 0);
    $q('.r[data-e="' + state.log.indexOf(state.log.find(e => e.id === 's1')) + '"]').click();
    ok('a stay with nothing just before it has no join button; its crate kind can be corrected', !sh.querySelector('#join') && sh.querySelector('[data-c].sel').dataset.c === 'box');
    sh.querySelector('[data-c=mesh]').click(); sh.querySelector('#ok').click();
    ok('corrected by hand', state.log.find(e => e.id === 's1').c === 'mesh');
    // the comparison
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN, c:'box' }, { ...K0, k:'cry', t: now - 290*MIN, end: now - 280*MIN }, { ...K0, k:'sleep', t: now - 270*MIN, end: now - 210*MIN }, { ...K0, k:'crate', t: now - 100*MIN, end: now - 40*MIN, c:'mesh' }, { ...K0, k:'cry', t: now - 100*MIN, end: now - 75*MIN }]);
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    const cmp = [...document.querySelectorAll('.cmp-r')].map(r => r.textContent);
    ok('summary: the two crates side by side — time, sleep, crying', cmp.length === 2 && cmp[0].includes('בוקס') && cmp[0].includes('בכלוב שעה ו־40 דק׳') && cmp[0].includes('שינה שעה') && cmp[0].includes('בכי 10 דקות') && cmp[1].includes('כלוב רשת') && cmp[1].includes('בכלוב שעה') && cmp[1].includes('בכי 25 דקות'));
    seed([{ ...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN, c:'box' }]); view = 'sum'; render(); ok('one crate only: no comparison', !$q('.cmp')); view = 'now';
    SLEEP2_FROM = Infinity;
    // 5. which round
    const T = Math.floor((now - 60*MIN) / MIN) * MIN + 40000;   // a crate entry at :40 of some minute
    seed([{ ...K0, k:'crate', t: T - 120*MIN, end: T - 20*MIN }, { ...K0, id:'meal', k:'food', t: T - 30000 }, { ...K0, id:'pee', k:'pee', t: T - 35000, w:'gravel' }, { ...K0, id:'cryx', k:'cry', t: T - 20000, end: T + 5*MIN }, { ...K0, id:'early', k:'water', t: T - 70000 }, { ...K0, k:'crate', t: T }]);
    const rounds = [...document.querySelectorAll('.uni .rd')].map(r => r.textContent), newest = rounds[0], prev = rounds[1];
    ok('logged in the minute the round begins: the meal and the cry belong to the new round', newest.includes('אכלה') && newest.includes('בכתה') && !prev.includes('אכלה') && !prev.includes('בכתה'));
    ok('…a pee in that minute stays with the round that is ending, and so does anything from a minute earlier', prev.includes('פיפי') && !newest.includes('פיפי') && prev.includes('שתתה') && !newest.includes('שתתה'));
    ok('nothing saved moved: only where the row is listed', state.log.find(e => e.id === 'meal').t === T - 30000 && noDiff(diff(base, state)));
    seed([{ ...K0, k:'crate', t: T - 120*MIN, end: T - 20*MIN }, { ...K0, k:'poop', t: T, w:'gravel' }, { ...K0, k:'pee', t: T + 15000, w:'gravel' }, { ...K0, k:'none', t: T - 5*MIN }, { ...K0, k:'play', t: T + 15000, y:'kong' }, { ...K0, id:'in', k:'crate', t: T, end: T + 30*MIN }]);
    const r2 = [...document.querySelectorAll('.uni .rd')].map(r => r.textContent);
    ok('a poop stamped at the crate\'s own time, and a pee seconds after it in that minute, belong to the round that is ending; a kong then is in the new one', r2[1].includes('קקי') && r2[1].includes('פיפי') && !r2[0].includes('קקי') && !r2[0].includes('פיפי') && r2[0].includes('קונג') && state.log.find(e => e.id === 'in').end === T + 30*MIN);
    seed([{ ...K0, k:'poop', t: T, w:'gravel' }, { ...K0, k:'crate', t: T }]);
    const r3 = [...document.querySelectorAll('.uni .rd')];
    ok('with no earlier round it is listed before the first round', r3.length === 2 && r3[1].textContent.includes('לפני הסבב הראשון') && r3[1].textContent.includes('קקי'));
    // 4. a cry timer left running
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 20*MIN }]);
    tile('food').click();
    ok('a meal while a cry has been "running" for 20 minutes: is she still crying?', bg.classList.contains('show') && sh.querySelector('h3').textContent.includes('היא עדיין בוכה') && sh.querySelector('#calm').textContent.includes('לא, נרגעה ב־') && !!sh.querySelector('#still'));
    sh.querySelector('#calm').click();
    const cry = logOf('kishmish', 'cry')[0], meal = logOf('kishmish', 'food')[0];
    ok('"no": the cry ends at the time of the meal', cry.end === meal.t && !K().cry.start && !bg.classList.contains('show'));
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 20*MIN }]);
    logPlay('kishmish', 'kong', true); sh.querySelector('#still').click();
    ok('"yes, still crying": it keeps running', !!K().cry.start && !logOf('kishmish', 'cry')[0].end);
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 4*MIN }]);
    tile('water').click(); ok('under five minutes: no question', !bg.classList.contains('show') && !!K().cry.start);
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 20*MIN }]);
    tile('pee').click();
    ok('with a pee the question comes first…', sh.querySelector('h3').textContent.includes('היא עדיין בוכה'));
    sh.querySelector('#calm').click();
    ok('…and "where?" follows as usual', bg.classList.contains('show') && !!sh.querySelector('[data-w=gravel]') && !K().cry.start); close();
    seed([{ ...K0, k:'crate', t: now - 60*MIN }, { ...K0, k:'cry', t: now - 20*MIN }]);
    tapPoint('kishmish', 'food', now - 17*MIN);
    ok('judged at the time of the action, not of the tap: a meal logged for 3 minutes into the cry asks nothing', !bg.classList.contains('show'));
    pet = 'kochik'; seed([{ p:'kochik', k:'food', t: now - HOUR }]); tile('food').click(); ok('nothing of this for kochik', !bg.classList.contains('show') && !$q('.incr') && !$q('[data-act=swap]'));
    done();
  } catch(e){ crashed(e); }
})();
