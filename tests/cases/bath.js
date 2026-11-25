// Last bath (both dogs): a tile with the time since, and by when the next one is due (at most BATH_DAYS days).
(async function(){
  try {
    reset();
    const now = Date.now(), DAY = 86400000;
    seed([]);
    const card = () => $q('#sec-bath .card.item');
    ok('Kishmish has a bath tile, empty at first', !!card() && card().textContent.includes('עוד לא נרשם') && card().textContent.includes('לא יותר מ־10 ימים'));
    tile('bath').click();
    ok('one tap logs a bath', logOf('kishmish', 'bath').length === 1 && V.kishmish.bath > 0 && card().textContent.includes('עוד 10 ימים'));
    seed([{ p:'kishmish', k:'bath', t: now - 9*DAY }]);
    ok('nine days ago: due tomorrow', card().textContent.includes('המקלחת הבאה עד מחר'));
    seed([{ p:'kishmish', k:'bath', t: now - 10*DAY }]);
    ok('ten days ago: today', card().textContent.includes('היום הגיע הזמן למקלחת'));
    seed([{ p:'kishmish', k:'bath', t: now - 12*DAY }]);
    ok('twelve days ago: past due', !!card().querySelector('.bathdue'));
    ok('not a column in the summary', !PETS.kishmish.items.includes('bath') && !PETS.kochik.items.includes('bath'));
    seed([]); openAddSheet('kishmish');
    ok('"הוספת רישום" offers a week of days and the bath', $n('[data-day]') === 7 && !!sh.querySelector('[data-kind=bath]'));
    sh.querySelector('[data-kind=bath]').click(); sh.querySelector('[data-day="3"]').click();
    sh.querySelector('#tIn').value = '18:00'; sh.querySelector('#ok').click();
    const d3 = new Date(now - 3*DAY); d3.setHours(18, 0, 0, 0);
    ok('a bath three days ago at 18:00', logOf('kishmish', 'bath').length === 1 && logOf('kishmish', 'bath')[0].t === d3.getTime());
    reset('shai', 'kochik'); seed([{ p:'kochik', k:'bath', t: now - 3*DAY }]);
    ok('Kochik has one too', !!card() && card().textContent.includes('עוד 7 ימים'));
    done();
  } catch(e){ crashed(e); }
})();
