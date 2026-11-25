// Notes for the vet (25.11): add, list newest first, mark done, edit, delete, copy; text only; nothing else changes.
(async function(){
  try {
    reset();
    const now = Date.now();
    pet = 'kochik'; seed([{p:'kochik', k:'pee', t: now - 30*MIN, w:'out', by:'shai'}]);
    const list0 = $q('.card.log').innerHTML;
    ok('the card is on Kochik\'s screen, empty', !!$q('#sec-notes') && $q('#sec-notes').textContent.includes('אין הערות פתוחות'));
    $q('[data-act=noteadd]').click();
    ok('an empty note is refused', logOf('kochik', 'note').length === 0 && $q('#noteIn').classList.contains('bad'));
    $q('#noteIn').value = 'לבדוק את הגוש <b>בבטן</b>'; $q('[data-act=noteadd]').click();
    const n1 = logOf('kochik', 'note')[0];
    ok('a note: saved with its text, by and time', n1 && n1.n === 'לבדוק את הגוש <b>בבטן</b>' && n1.by === 'shai' && $q('#sec-notes h2').textContent.includes('1'));
    ok('shown as text, never HTML', $q('#sec-notes .nt').textContent === 'לבדוק את הגוש <b>בבטן</b>' && !$q('#sec-notes .nt b'));
    ok('notes stay out of the history list and the counts', $q('.card.log').innerHTML === list0);
    $q('#noteIn').value = 'לשאול על התרופה'; $q('[data-act=noteadd]').click();
    ok('newest first', $q('#sec-notes .note-r .nt').textContent === 'לשאול על התרופה' && $q('#sec-notes h2').textContent.includes('2'));
    $q('#undo').click();
    ok('undo removes the last one', logOf('kochik', 'note').length === 1);
    // a draft survives a redraw (a sync from another phone)
    $q('#noteIn').value = 'טיוטה'; render();
    ok('text being typed survives a redraw', $q('#noteIn').value === 'טיוטה');
    $q('#noteIn').value = ''; render();
    // done
    $q('[data-act=notedone]').click();
    ok('"טופל": out of the open list, into a folded "טופלו (1)"', !!logOf('kochik', 'note')[0].done && $q('#sec-notes').textContent.includes('אין הערות פתוחות') && $q('[data-act=notesdone]').textContent.includes('טופלו (1)') && !$q('.note-r.done'));
    $q('[data-act=notesdone]').click();
    ok('…which opens', !!$q('.note-r.done'));
    // edit and delete from the sheet
    $q('.note-r.done').click();
    ok('tapping a note opens its sheet', bg.classList.contains('show') && sh.querySelector('#noteEd').value === n1.n);
    sh.querySelector('#reopen').click();
    ok('"להחזיר לפתוחות"', !logOf('kochik', 'note')[0].done);
    $q('.note-r').click(); sh.querySelector('#noteEd').value = 'הגוש בבטן — מאז מתי?'; sh.querySelector('#ok').click();
    ok('edited', logOf('kochik', 'note')[0].n === 'הגוש בבטן — מאז מתי?');
    $q('.note-r').click(); sh.querySelector('#del').click();
    ok('deleted, with undo', logOf('kochik', 'note').length === 0);
    $q('#undo').click(); ok('…undone', logOf('kochik', 'note').length === 1);
    pet = 'kishmish'; render();
    ok('Kishmish has her own card, without Kochik\'s notes', !!$q('#sec-notes') && $q('#sec-notes').textContent.includes('אין הערות פתוחות'));
    done();
  } catch(e){ crashed(e); }
})();
