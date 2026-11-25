// A guest (a babysitter, a friend): "אורח/ת" asks for a name; entries carry it; nothing else changes.
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = {p:'kishmish'};
    seed([{...K0, k:'pee', t: now - 30*MIN, w:'gravel', by:'shai'}]);
    me = null; renderMe();
    ok('no user yet: the button says "מי אני?"', $q('#me').textContent === 'מי אני?');
    openUserSheet();
    ok('the sheet offers the three of us and a guest', [...sh.querySelectorAll('.users button')].map(b => b.textContent).join() === 'יונתן,שי,ליזה,אורח/ת' && sh.querySelector('.guestf').hidden);
    sh.querySelector('[data-guest]').click();
    ok('"אורח/ת" opens a name field', !sh.querySelector('.guestf').hidden && !!sh.querySelector('#gname'));
    sh.querySelector('#gok').click();
    ok('an empty name is refused', bg.classList.contains('show') && sh.querySelector('#gname').classList.contains('bad') && me === null);
    sh.querySelector('#gname').value = 'שי'; sh.querySelector('#gok').click();
    ok('a name of one of us is refused (no mix-ups)', me === null);
    sh.querySelector('#gname').value = '  דנה <b>  '; sh.querySelector('#gok').click();
    ok('a name: saved on this phone, shown at the top', me === 'g:דנה <b>' && localStorage.getItem(LS_KEY + '-user') === 'g:דנה <b>' && $q('#me').textContent === 'דנה <b>' && !bg.classList.contains('show'));
    tile('food').click();
    const f = logOf('kishmish', 'food')[0];
    ok('her entries carry her name', f.by === 'g:דנה <b>');
    ok('shown by the entry, as text (no markup let in)', $q('.uni').innerHTML.includes('דנה &lt;b&gt;') && !$q('.uni b b'));
    ok('the tile says who logged it', $q('#sec-food').textContent.includes('דנה <b>'));
    ok('everyone else\'s entries are as they were', logOf('kishmish', 'pee')[0].by === 'shai' && $q('.uni').textContent.includes('שי'));
    // the guest name survives a reload of this phone's choice; a broken value is ignored
    ok('a stored guest is read back; junk is not', isGuest('g:דנה') && !isGuest('g:') && !isGuest('x:דנה') && !isGuest('g:' + 'א'.repeat(40)));
    // back to one of us
    openUserSheet(); ok('the sheet shows the guest name to edit', sh.querySelector('[data-guest]').classList.contains('sel') && sh.querySelector('#gname').value === 'דנה <b>');
    sh.querySelector('[data-u=shai]').click();
    ok('switching back to שי', me === 'shai' && $q('#me').textContent === 'שי');
    done();
  } catch(e){ crashed(e); }
})();
