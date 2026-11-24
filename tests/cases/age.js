// Birth dates and ages; the age-based hint for the puppy; "she drank" for kochik.
(async function(){
  try {
    reset();
    const now = Date.now(), age = (b, t) => ageText(ageParts(b, t)), bad = [];
    const eq = (b, t, want) => { const got = age(b, t); if(got !== want) bad.push(`${b}→${t}: "${got}" not "${want}"`); };
    // her two examples
    eq('2026-09-20', '2026-11-24', 'חודשיים ו־4 ימים'); eq('2010-03-20', '2026-11-24', '16 שנים ו־8 חודשים');
    // the special forms, and no zero part
    eq('2026-09-20', '2026-09-20', 'נולדה היום'); eq('2026-09-20', '2026-09-21', 'יום'); eq('2026-09-20', '2026-09-22', 'יומיים'); eq('2026-09-20', '2026-10-02', '12 ימים');
    eq('2026-09-20', '2026-10-20', 'חודש'); eq('2026-09-20', '2026-10-21', 'חודש ויום'); eq('2026-09-20', '2026-10-22', 'חודש ויומיים'); eq('2026-09-20', '2026-11-20', 'חודשיים');
    eq('2026-09-20', '2027-02-20', '5 חודשים'); eq('2026-09-20', '2027-09-19', '11 חודשים ו־30 ימים');
    // the birthday itself, the day before, the day after
    eq('2026-09-20', '2027-09-20', 'שנה'); eq('2026-09-20', '2027-09-21', 'שנה'); eq('2026-09-20', '2027-10-20', 'שנה וחודש'); eq('2026-09-20', '2027-11-25', 'שנה וחודשיים');
    eq('2026-09-20', '2028-09-20', 'שנתיים'); eq('2026-09-20', '2028-12-01', 'שנתיים וחודשיים'); eq('2026-09-20', '2029-09-20', '3 שנים'); eq('2026-09-20', '2030-02-20', '3 שנים ו־5 חודשים');
    eq('2010-03-20', '2026-03-19', '15 שנים ו־11 חודשים'); eq('2010-03-20', '2026-03-20', '16 שנים'); eq('2010-03-20', '2026-03-21', '16 שנים');
    // month ends
    eq('2025-01-31', '2025-02-27', '27 ימים'); eq('2025-01-31', '2025-02-28', 'חודש'); eq('2025-01-31', '2025-03-01', 'חודש ויום'); eq('2025-01-31', '2025-03-31', 'חודשיים');
    eq('2025-08-31', '2025-09-30', 'חודש'); eq('2025-08-31', '2025-10-01', 'חודש ויום'); eq('2025-08-31', '2025-10-31', 'חודשיים'); eq('2025-12-31', '2026-01-01', 'יום'); eq('2025-12-15', '2026-01-15', 'חודש');
    // leap years
    eq('2024-02-29', '2025-02-27', '11 חודשים ו־29 ימים'); eq('2024-02-29', '2025-02-28', 'שנה'); eq('2024-02-29', '2025-03-01', 'שנה'); eq('2024-02-29', '2028-02-28', '3 שנים ו־11 חודשים'); eq('2024-02-29', '2028-02-29', '4 שנים');
    eq('2023-02-28', '2024-02-28', 'שנה'); eq('2023-02-28', '2024-02-29', 'שנה'); eq('2024-01-30', '2024-02-29', 'חודש'); eq('2024-01-29', '2024-03-01', 'חודש ויום'); eq('2023-01-29', '2023-03-01', 'חודש ויום');
    ok('ages read correctly in Hebrew: examples, special forms, birthdays, month ends, leap years' + (bad.length ? ' — ' + bad.join(' | ') : ''), bad.length === 0);
    // a sweep: every day for three years from two awkward birth dates — never a zero part, never going backwards
    let sweep = '';
    for(const b of ['2024-02-29', '2025-08-31', '2026-09-20']){
      let prev = -1; const [y, m, d] = b.split('-').map(Number);
      for(let i = 0; i < 1100 && !sweep; i++){
        const t = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10), a = ageParts(b, t), s = ageText(a), rank = a.y*100000 + a.m*1000 + a.d;
        if(/(^|\s|־)0\s/.test(s) || !s || rank <= prev && i) sweep = `${b}→${t}: "${s}"`;
        if(a.y && /יום|ימים/.test(s) || !a.y && /שנ/.test(s)) sweep = `${b}→${t}: wrong units "${s}"`;
        prev = rank;
      }
    }
    ok('sweep over three years: no "0 …", the right units, always moving forward' + (sweep ? ' — ' + sweep : ''), !sweep);
    ok('before the birth date there is no age', ageParts('2026-09-20', '2026-09-19') === null && ageText(null) === '');
    // "today" is the date in Israel
    ok('today is taken in Asia/Jerusalem', todayIL(Date.UTC(2026, 10, 24, 21, 30)) === '2026-11-24' && todayIL(Date.UTC(2026, 10, 24, 22, 30)) === '2026-11-25' && todayIL(Date.UTC(2026, 6, 1, 20, 59)) === '2026-07-01' && todayIL(Date.UTC(2026, 6, 1, 21, 0)) === '2026-07-02');
    // on the screen
    FAKE_TODAY = '2026-11-24'; seed([{ p:'kishmish', k:'food', t: now - HOUR }]);
    const tab = p => $q('.seg button[data-pet=' + p + ']');
    ok('with nothing saved the built-in dates are used, and nothing is written', K().born === '2026-09-20' && KO().born === '2010-03-20' && state.log.length === 1 && noDiff(diff(base, state)));
    ok('the age is under each name at the top', tab('kishmish').textContent === 'קישמישחודשיים ו־4 ימים' && tab('kochik').querySelector('small.age').textContent === '16 שנים ו־8 חודשים');
    ok('the puppy\'s pee tile has the age line, even with no forecast yet', $q('#sec-potty .byage').textContent === 'לפי הגיל: עד כ־3 שעות' && !$q('#sec-potty').textContent.includes('הפיפי הבא צפוי'));
    FAKE_TODAY = '2026-10-01'; render(); ok('under a month old: up to about an hour', $q('.byage').textContent === 'לפי הגיל: עד כשעה');
    FAKE_TODAY = '2026-10-25'; render(); ok('one month: about two hours', $q('.byage').textContent === 'לפי הגיל: עד כשעתיים');
    FAKE_TODAY = '2027-08-01'; render(); ok('capped at eight hours', $q('.byage').textContent === 'לפי הגיל: עד כ־8 שעות');
    FAKE_TODAY = '2027-09-20'; render(); ok('from her first birthday the line is gone', !$q('.byage'));
    FAKE_TODAY = '2026-11-24'; pet = 'kochik'; seed([{ p:'kochik', k:'pee', t: now - HOUR }]); ok('never for kochik', !$q('.byage'));
    // editing
    pet = 'kishmish'; render(); tab('kochik').click();
    ok('tapping the other dog\'s tab just switches', pet === 'kochik' && !bg.classList.contains('show'));
    tab('kochik').click();
    ok('tapping the tab she is on opens her birth date', bg.classList.contains('show') && sh.querySelector('#bornIn').value === '2010-03-20' && sh.querySelector('#agePrev').textContent.includes('16 שנים ו־8 חודשים'));
    const el = sh.querySelector('#bornIn'); el.value = '2027-01-01'; el.oninput(); sh.querySelector('#ok').click();
    ok('a date in the future is refused', bg.classList.contains('show') && el.classList.contains('bad') && logOf('kochik', 'born').length === 0);
    el.value = '2010-03-25'; el.oninput();
    ok('the sheet previews the age', sh.querySelector('#agePrev').textContent.includes('16 שנים ו־7 חודשים'));
    sh.querySelector('#ok').click();
    ok('saving writes one entry, with who changed it; the tab follows', logOf('kochik', 'born').length === 1 && logOf('kochik', 'born')[0].d === '2010-03-25' && logOf('kochik', 'born')[0].by === 'shai' && KO().born === '2010-03-25' && tab('kochik').querySelector('small.age').textContent === '16 שנים ו־7 חודשים' && !noDiff(diff(base, state)));
    ok('it is not an event: not in the history, the summary list or the text export', !$q('#main .log').textContent.includes('תאריך לידה') && !logText('kochik', midnight(), midnight() + 24*HOUR).includes('תאריך לידה'));
    tab('kochik').click(); sh.querySelector('#bornIn').value = '2010-03-20'; sh.querySelector('#ok').click();
    ok('editing again replaces it — still one entry', logOf('kochik', 'born').length === 1 && KO().born === '2010-03-20');
    $q('#undo').click(); ok('undo restores the previous date', KO().born === '2010-03-25' && logOf('kochik', 'born').length === 1);
    // two phones: the later edit wins wherever it arrives
    const a1 = norm({ v: 2, log: [{ id:'x1', p:'kochik', k:'born', t: 1000, d:'2010-03-21' }, { id:'x2', p:'kochik', k:'born', t: 2000, d:'2010-03-22' }] }), a2 = norm({ v: 2, log: a1.log.slice().reverse() });
    ok('two edits from two phones: the later one wins in any order', derive(a1).kochik.born === '2010-03-22' && derive(a2).kochik.born === '2010-03-22' && derive(norm({ v: 2, log: [{ id:'x3', p:'kochik', k:'born', t: 5, d:'nonsense' }] })).kochik.born === '2010-03-20');
    const big = [{ id:'b0', p:'kishmish', k:'born', t: 1, d:'2026-09-19' }]; for(let i = 0; i < LOG_MAX + 50; i++) big.push({ id:'w' + i, p:'kishmish', k:'water', t: 1000 + i });
    use(norm({ v: 2, log: big }), blank()); tapPoint('kishmish', 'water');
    ok('the birth date survives the trimming of a very long list', state.log.length === LOG_MAX + 1 && state.log.some(e => e.id === 'b0') && K().born === '2026-09-19' && patch(diff(blank(), state), blank()).log.some(e => e.id === 'b0'));
    // kochik drinks
    reset('shai', 'kochik'); ASK_WHEN = true; seed([{ p:'kochik', k:'food', t: now - HOUR }]);
    const cards = [...$q('#main').children].map(x => x.className);
    ok('kochik has the same "she drank" row, right after the food card', !!$q('#main .card.slim.water') && cards[cards.findIndex(x => x.includes('water')) - 1].includes('item') && $q('#main .card.slim.water').previousElementSibling.textContent.includes('מאז האוכל האחרון') && $q('.water').textContent.includes('עוד לא נרשמה שתייה'));
    $q('.water [data-act=pt][data-k=water]').click(); sh.querySelector('[data-m="0"]').click();
    ok('"she drank" now: logged with who saw it, shown on the row and in the history', logOf('kochik', 'water').length === 1 && logOf('kochik', 'water')[0].by === 'shai' && !('w' in logOf('kochik', 'water')[0]) && $q('.water').textContent.includes('פעם אחרונה: היום') && $q('#main .log').textContent.includes('שתתה') && $q('#main .log .by').textContent === 'שי');
    DUP_MS = 0; $q('.water [data-act=pt][data-k=water]').click(); sh.querySelector('[data-day="1"]').click(); sh.querySelector('#tIn').value = '21:00'; sh.querySelector('#ok').click();
    ok('another time works: yesterday at 21:00', logOf('kochik', 'water').length === 2 && logOf('kochik', 'water')[0].t === midnight() - 3*HOUR);
    $q('.r[data-e="' + state.log.indexOf(logOf('kochik', 'water')[0]) + '"]').click(); sh.querySelector('#del').click();
    ok('the entry can be deleted from the history like any other', logOf('kochik', 'water').length === 1);
    pet = 'kishmish'; seed([{ p:'kishmish', k:'water', t: now - 20*MIN }]);
    ok('kishmish\'s row is the same component, in its place', $n('#sec-food .card.slim.water') === 1 && $q('#sec-food .water').textContent.includes('פעם אחרונה'));
    done();
  } catch(e){ crashed(e); }
})();
