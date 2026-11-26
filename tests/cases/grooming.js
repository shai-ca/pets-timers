// "טיפוח" (25.11): bath, Frontline Spray (dose from weight, 48-hour rule, drying card), brushing, teeth, weight; vet notes.
(async function(){
  try {
    reset();
    const now = Date.now(), DAY = 24*HOUR, C0 = {p:'kochik'}, K0 = {p:'kishmish'};
    if(now - midnight() < 180*MIN){ ok('skipped (too close to midnight)', true); done(); return; }
    pet = 'kochik'; seed([]);
    const card = k => $q(`#sec-bath [data-act=pt][data-k=${k}]`).closest('.card');
    ok('in order of how often: brushing, teeth, bath, spray, weight', [...document.querySelectorAll('#sec-bath .groom > .card.item [data-act=pt]')].map(b => b.dataset.k).join() === 'brush,teeth,bath,flea,weight');
    ok('the group is "טיפוח": bath, spray, brushing, teeth, weight', $q('#sec-bath h2').textContent.includes('טיפוח') && ['bath','flea','brush','teeth','weight'].every(k => !!$q(`#sec-bath [data-act=pt][data-k=${k}]`)));
    ok('no weight yet: the spray tile asks for one', card('flea').textContent.includes('צריך לרשום משקל'));
    // weight
    $q('#sec-bath [data-act=pt][data-k=weight]').click();
    sh.querySelector('#kgIn').value = 'abc'; sh.querySelector('#ok').click();
    ok('a weight that is not a number is refused', bg.classList.contains('show') && logOf('kochik', 'weight').length === 0);
    sh.querySelector('#kgIn').value = '2,3'; sh.querySelector('#ok').click();
    const w = logOf('kochik', 'weight')[0];
    ok('"2,3" is saved as 2.3 kg', w && w.kg === 2.3 && card('weight').textContent.includes('2.3 ק״ג'));
    ok('dose for Kochik (high, 4/kg): ⌈2.3 × 4⌉ = 10 sprays, 15 mL', card('flea').textContent.includes('10 ריסוסים') && card('flea').textContent.includes('15 מ״ל'));
    seed([{...C0, k:'weight', t: now - 40*DAY, kg: 2.5}, {...C0, k:'weight', t: now - 35*DAY, kg: 2.4}]);
    ok('a weight older than 30 days: "כדאי לשקול שוב", the change shown, and the dose may be out of date', card('weight').textContent.includes('כדאי לשקול שוב') && card('weight').textContent.includes('−0.1 ק״ג') && card('flea').textContent.includes('אולי המינון לא מעודכן'));
    pet = 'kishmish'; seed([{...K0, k:'weight', t: now - HOUR, kg: 1.1}]);
    ok('Kishmish (low, 2/kg): ⌈1.1 × 2⌉ = 3 sprays', card('flea').textContent.includes('3 ריסוסים'));
    // spray, the 48-hour rule, drying card, brushing
    $q('#sec-bath [data-act=pt][data-k=flea]').click();
    ok('a spray is logged', logOf('kishmish', 'flea').length === 1);
    ok('for two hours: the drying card (no heat, keep the dogs apart) and "do not brush"', !!$q('.spraydry') && $q('.spraydry').textContent.includes('בלי פן ובלי תנור') && $q('.spraydry').textContent.includes('להפריד בין הכלבות') && card('brush').textContent.includes('לא לסרק עד שהפרווה יבשה'));
    ok('the bath tile: "לא לקלח עד …" instead of its due date', card('bath').textContent.includes('לא לקלח עד'));
    $q('#sec-bath [data-act=pt][data-k=bath]').click();
    ok('"קילחתי" within 48 h of a spray asks first', bg.classList.contains('show') && sh.textContent.includes('עברו רק') && sh.textContent.includes('מהריסוס') && logOf('kishmish', 'bath').length === 0);
    sh.querySelector('#cancel').click();
    ok('cancel: nothing logged', logOf('kishmish', 'bath').length === 0);
    $q('#sec-bath [data-act=pt][data-k=bath]').click(); sh.querySelector('#ok').click();
    ok('"לרשום בכל זאת": logged', logOf('kishmish', 'bath').length === 1);
    seed([{...K0, k:'bath', t: now - 5*HOUR}]);
    $q('#sec-bath [data-act=pt][data-k=flea]').click();
    ok('a spray within 48 h of a bath asks too', bg.classList.contains('show') && sh.textContent.includes('מהמקלחת')); close();
    // planning the next spray and bath; bath due kept 48 h clear
    seed([{...K0, k:'flea', t: now - 27*DAY}, {...K0, k:'bath', t: now - 8*DAY}, {...K0, k:'weight', t: now - DAY, kg: 1.1}]);
    ok('5 days or less before the spray: "מקלחת עד …, ריסוס ב־…"', card('flea').textContent.includes('מקלחת עד') && card('flea').textContent.includes('ריסוס ב־'));
    const due = bathDue('kishmish'), fd = fleaDue('kishmish');
    ok('the bath that would fall within 48 h of the spray moves to two days before it', Math.abs(fd - due) >= 2*DAY - HOUR && due < fd);
    // brushing / teeth overdue, calm
    seed([{...K0, k:'brush', t: now - 2*DAY - HOUR}, {...K0, k:'teeth', t: now - 3*HOUR}]);
    ok('brushing two days ago: "עברו יומיים מהסירוק", calm (no alert colours)', card('brush').textContent.includes('עברו יומיים מהסירוק') && !card('brush').querySelector('.alert, .late') && !card('brush').classList.contains('warn'));
    ok('teeth today: no overdue line', !card('teeth').textContent.includes('עברו'));
    // summary
    seed([{...K0, k:'brush', t: now - HOUR}, {...K0, k:'teeth', t: now - HOUR}, {...K0, k:'weight', t: now - 3*DAY, kg: 1.0}, {...K0, k:'weight', t: now - HOUR, kg: 1.1}]);
    view = 'sum'; sumMode = 'day'; sumAnchor = now; render();
    ok('summary: grooming counts and the weight chart', $q('.groomsum').textContent.includes('סירוקים 1') && $q('.groomsum').textContent.includes('צחצוחים 1') && $n('.wchart .wd') === 2);
    view = 'now'; render();
    done();
  } catch(e){ crashed(e); }
})();
