// Kochik's treats: regular or fatty, what it was, who gave it — and what came before a diarrhoea.
(async function(){
  try {
    reset('shai', 'kochik');
    const now = Date.now(), m0 = midnight(), KO0 = { p:'kochik' }, card = () => $q('.treatc'), T = () => logOf('kochik', 'treat');
    seed([{ ...KO0, k:'food', t: now - 3*HOUR }]);
    const cards = [...$q('#sec-food').querySelectorAll('.card')].map(x => x.className);
    ok('kochik has the treat card after food and water, with two buttons', !!card() && cards.findIndex(x => x.includes('treatc')) === 2 && cards[1].includes('water') && [...card().querySelectorAll('button')].map(b => b.textContent).join() === 'חטיף רגיל,חטיף שומני' && card().textContent.includes('עוד לא נרשם') && card().textContent.includes('היום: בלי חטיפים'));
    pet = 'kishmish'; render(); ok('kishmish has none', !card());
    PETS.kishmish.treats = true; render(); ok('…until it is switched on for her: one flag', !!$q('#sec-food .treatc')); delete PETS.kishmish.treats; pet = 'kochik'; render();
    // logging, with the question sheet
    ASK_WHEN = true;
    $q('[data-act=treat][data-k=fat]').click();
    ok('one sheet: what it was (optional), then when', sh.querySelector('h3').textContent.includes('חטיף שומני') && !!sh.querySelector('#nmIn') && sh.querySelector('#nmIn').placeholder === 'לא חובה' && !!sh.querySelector('[data-m="0"]') && sh.querySelectorAll('[data-day]').length === 3 && sh.querySelectorAll('[data-n]').length === 0);
    const type = v => { const el = sh.querySelector('#nmIn'); el.value = v; el.oninput(); };
    type('נקניק'); sh.querySelector('[data-m="0"]').click();
    ok('logged: fatty, what it was, who gave it', T().length === 1 && T()[0].q === 'fat' && T()[0].n === 'נקניק' && T()[0].by === 'shai' && $q('#toastMsg').textContent.includes('חטיף שומני · נקניק'));
    ok('the card: kind · what · time · who, and today\'s count', card().textContent.includes('שומני · נקניק') && card().textContent.includes('היום ב־' + clock(T()[0].t)) && card().textContent.includes('· שי') && card().textContent.includes('היום: חטיף אחד, שומני'));
    ok('a treat does not reset the food clock', KO().food === now - 3*HOUR && +$q('#sec-food [data-since]').dataset.since === now - 3*HOUR);
    DUP_MS = 0; $q('[data-act=treat][data-k=reg]').click();
    ok('earlier answers are offered', [...sh.querySelectorAll('[data-n]')].map(b => b.textContent).join() === 'נקניק' && sh.querySelector('#nmList option').value === 'נקניק');
    sh.querySelector('[data-m="10"]').click();
    ok('the name is optional', T().length === 2 && T()[0].q === 'reg' && !('n' in T()[0]) && card().textContent.includes('היום: 2 חטיפים, מתוכם אחד שומני'));
    $q('[data-act=treat][data-k=fat]').click(); sh.querySelector('[data-n]').click();
    ok('tapping a suggestion fills the box', sh.querySelector('#nmIn').value === 'נקניק');
    sh.querySelector('[data-day="1"]').click(); sh.querySelector('#tIn').value = '21:00'; sh.querySelector('#ok').click();
    ok('another time: yesterday at 21:00, with the name', T().length === 3 && T()[0].t === m0 - 3*HOUR && T()[0].n === 'נקניק' && T()[0].q === 'fat' && card().textContent.includes('היום: 2 חטיפים'));
    $q('[data-act=treat][data-k=fat]').click(); type('<b>גבינה</b> "x"'); sh.querySelector('[data-m="0"]').click();
    ok('what a person typed is shown as text, never as HTML', T().pop().n === '<b>גבינה</b> "x"' && !card().querySelector('b:not(.x)') && card().textContent.includes('<b>גבינה</b> "x"') && !$q('#main .log b') && card().textContent.includes('היום: 3 חטיפים, מתוכם 2 שומניים'));
    $q('[data-act=treat][data-k=fat]').click();
    ok('…also where it is offered again', sh.querySelectorAll('[data-n]')[0].textContent === '<b>גבינה</b> "x"' && sh.querySelectorAll('[data-n] b').length === 0 && sh.querySelectorAll('[data-n]').length === 2); close();
    DUP_MS = 2*60000; $q('[data-act=treat][data-k=fat]').click(); sh.querySelector('[data-m="0"]').click();
    ok('the same button twice within two minutes asks first', bg.classList.contains('show') && T().length === 4); close(); DUP_MS = 0; ASK_WHEN = false;
    // history
    ok('history: "treat · fatty · what", with the giver', $q('#main .log').textContent.includes('חטיף · שומני · נקניק') && [...document.querySelectorAll('#main .log .r')].some(r => r.textContent.includes('חטיף · רגיל') && r.querySelector('.by').textContent === 'שי'));
    ok('the text export says it', logText('kochik', m0, m0 + 24*HOUR).includes('חטיף · רגיל') && logText('kochik', m0 - 24*HOUR, m0).includes('חטיף · שומני · נקניק'));
    const reg = T().find(e => e.q === 'reg'); $q('.r[data-e="' + state.log.indexOf(reg) + '"]').click();
    ok('the entry sheet: kind and name', sh.querySelector('[data-q].sel').dataset.q === 'reg' && sh.querySelector('#nmIn').value === '' && sh.querySelector('h3').textContent.includes('חטיף'));
    sh.querySelector('[data-q=fat]').click(); sh.querySelector('#nmIn').value = 'גבינה'; sh.querySelector('#ok').click();
    ok('edited: now fatty, with a name', T().find(e => e.id === reg.id).q === 'fat' && T().find(e => e.id === reg.id).n === 'גבינה');
    $q('.r[data-e="' + state.log.indexOf(T().find(e => e.id === reg.id)) + '"]').click(); sh.querySelector('#nmIn').value = ''; sh.querySelector('#ok').click();
    ok('the name can be cleared', !('n' in T().find(e => e.id === reg.id)));
    $q('.r[data-e="' + state.log.indexOf(T().find(e => e.id === reg.id)) + '"]').click(); sh.querySelector('#del').click();
    ok('and the entry deleted', T().length === 3 && !T().some(e => e.id === reg.id));
    $q('[data-act=addev]').click(); ok('"add an entry" offers a treat too', !!sh.querySelector('[data-kind=treat]')); close();
    // what came before a diarrhoea
    const fat = (h, by, n) => ({ ...KO0, k:'treat', t: now - h*HOUR, q:'fat', by, ...(n ? { n } : {}) }), dia = h => ({ ...KO0, k:'poop', t: now - h*HOUR, q:'dia', w:'out' });
    const rowOf = e => document.querySelector('.r[data-e="' + state.log.indexOf(e) + '"]');
    seed([fat(10.5, 'yonatan', 'נקניק'), dia(2)]);
    const at = clock(now - 10.5*HOUR), sameDay = dayKey(now - 10.5*HOUR) === dayKey(now - 2*HOUR);
    ok('diarrhoea 8.5 hours after a fatty treat: a small factual line with who and when', rowOf(logOf('kochik', 'poop')[0]).querySelector('.ctx').textContent === `8 שעות אחרי חטיף שומני (יונתן, ${sameDay ? '' : dayLabel(now - 10.5*HOUR) + ' '}${at})` && fatBefore(logOf('kochik', 'poop')[0]).n === 'נקניק');
    ok('neutral wording: nothing but what happened and when', !/בגלל|גרם|אשם|אזהרה/.test($q('#main .log').textContent) && !rowOf(logOf('kochik', 'poop')[0]).querySelector('.ctx').classList.contains('bad'));
    seed([fat(27, 'shai'), dia(2)]); ok('25 hours before: no line', !$q('.log .ctx') && fatBefore(logOf('kochik', 'poop')[0]) === null);
    seed([{ ...KO0, k:'treat', t: now - 5*HOUR, q:'reg', by:'shai' }, dia(2)]); ok('a regular treat: no line', !$q('.log .ctx'));
    seed([fat(5, 'shai'), { ...KO0, k:'poop', t: now - 2*HOUR, q:'ok', w:'out' }, { ...KO0, k:'poop', t: now - HOUR, w:'out' }]); ok('a normal or unmarked poop: no line', !$q('.log .ctx'));
    seed([fat(20, 'shai'), fat(3.2, 'liza'), dia(2)]); ok('two fatty treats: the later one is named', $q('.log .ctx').textContent.startsWith('שעה אחרי חטיף שומני (ליזה'));
    seed([fat(2.5, 'shai'), dia(2)]); ok('less than an hour', $q('.log .ctx').textContent.startsWith('פחות משעה אחרי'));
    seed([fat(4.1, 'shai'), dia(2)]); ok('two hours', $q('.log .ctx').textContent.startsWith('שעתיים אחרי'));
    seed([fat(1, 'shai'), dia(2)]); ok('a treat after the diarrhoea does not count', !$q('.log .ctx'));
    seed([{ p:'kishmish', k:'treat', t: now - 5*HOUR, q:'fat', by:'shai' }, dia(2)]); ok('another dog\'s treat does not count', !$q('.log .ctx'));
    seed([{ ...KO0, k:'treat', t: now - 6*HOUR, q:'fat' }, dia(2)]); ok('no name on the treat: time only', $q('.log .ctx').textContent === `4 שעות אחרי חטיף שומני (${dayKey(now - 6*HOUR) === dayKey(now - 2*HOUR) ? '' : dayLabel(now - 6*HOUR) + ' '}${clock(now - 6*HOUR)})`);
    ok('the export carries the line', logText('kochik', m0 - 24*HOUR, m0 + 24*HOUR).includes('אחרי חטיף שומני'));
    // summary: the last 30 days
    const D = 24*HOUR, old = [fat(29*24 + 5, 'shai'), dia(29*24), dia(20*24), fat(10*24 + 30, 'shai'), dia(10*24), fat(31*24 + 2, 'shai'), dia(31*24), fat(3, 'shai'), dia(1)];
    seed(old); view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('summary: diarrhoeas in the last 30 days, and how many followed a fatty treat', $q('.fat30').textContent.includes('ב־30 הימים האחרונים: 4 שלשולים') && $q('.fat30').textContent.includes('2 מהם היו בתוך 24 שעות אחרי חטיף שומני'));
    const txt = $q('.fat30').textContent; sumMode = 'week'; render(); const w = $q('.fat30').textContent; sumMode = 'month'; sumAnchor = now - 40*D; render();
    ok('the same whatever period is shown', w === txt && $q('.fat30').textContent === txt); sumMode = 'day'; sumAnchor = now;
    seed([fat(3, 'shai'), dia(1)]); view = 'sum'; render(); ok('one', $q('.fat30').textContent.includes('שלשול אחד') && $q('.fat30').textContent.includes('הוא היה בתוך 24 שעות אחרי חטיף שומני'));
    seed([dia(1), dia(30)]); view = 'sum'; render(); ok('none of them', $q('.fat30').textContent.includes('2 שלשולים') && $q('.fat30').textContent.includes('אף אחד מהם לא היה'));
    const early = Math.max(m0 + MIN, now - 3*HOUR), later = Math.max(m0 + 2*MIN, now - 2*HOUR);   // both today, also just after midnight
    seed([{ ...KO0, k:'food', t: now - HOUR }, { ...KO0, k:'treat', t: later, q:'fat', by:'shai' }, { ...KO0, k:'treat', t: early, q:'reg' }]); view = 'sum'; render();
    ok('no diarrhoea: it says so; and the period\'s tiles count the treats', $q('.fat30').textContent.includes('לא נרשמו שלשולים') && [...document.querySelectorAll('.tile')].some(t => t.textContent.includes('חטיפים') && t.querySelector('b').textContent === '2' && t.textContent.includes('שומניים 1')));
    pet = 'kishmish'; render(); ok('nothing of this in kishmish\'s summary', !$q('.fat30') && ![...document.querySelectorAll('.tile')].some(t => t.textContent.includes('חטיפים'))); view = 'now';
    done();
  } catch(e){ crashed(e); }
})();
