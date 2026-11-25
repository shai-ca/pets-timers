// A whole day as the owner uses the app, by tapping the screen only (no direct calls). Runs in both designs (the .v2
// copy has the new design on), so every step of her routine is checked to work the same in each.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, K0 = {p:'kishmish'};
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const click = sel => { const b = $q(sel); if(!b) throw new Error('not on the screen: ' + sel); b.click(); };
    const pick = sel => { const b = sh.querySelector(sel); if(!b) throw new Error('not in the sheet: ' + sel); b.click(); };
    const last = k => logOf('kishmish', k).slice(-1)[0];
    const cur = () => { const e = $q('.sg.cur, .fs.cur'); return e ? e.dataset.go : ''; };
    seed([{...K0, k:'pee', t: now - 150*MIN, w:'gravel'}, {...K0, k:'food', t: now - 140*MIN}]);
    // crate, sleep, wake, out
    click('#sec-crate [data-act=dur][data-k=crate]');
    ok('"נכנסה לכלוב": a running crate stay; the routine is on the crate', !!K().crate.start && cur() === 'crate');
    click('#sec-rest [data-act=dur][data-k=sleep]');
    ok('"נרדמה": a running sleep', !!K().sleep.start && !K().sleep.assumed);
    click('#sec-rest [data-act=dur][data-k=sleep]');
    ok('"התעוררה": the sleep ended, still in the crate', !K().sleep.start && !!K().crate.start);
    click('#sec-rest [data-act=dur][data-k=cry]');
    ok('"בוכה": a running cry', !!K().cry.start);
    click('#sec-rest [data-act=dur][data-k=cry]');
    ok('"נרגעה": the cry ended', !K().cry.start && logOf('kishmish', 'cry').length === 1);
    click('#sec-crate [data-act=dur][data-k=crate]');
    ok('"יצאה מהכלוב": the stay ended; the routine moves to the walk', !K().crate.start && cur() === 'potty');
    // gravel clock, pee on the gravel
    click('[data-act=dur][data-k=gravel]');
    ok('"יצאנו לחצץ": the gravel clock runs', !!(K().gravel || {}).start);
    click('.gravel [data-act=pt][data-k=pee]');
    pick('[data-w=gravel]');
    ok('פיפי from the gravel card, "על החצץ": saved with the place and the time on the gravel; the outing stays open', last('pee').w === 'gravel' && !!(K().gravel || {}).start && waitOf(last('pee')) != null);
    click('.gravel .gend');
    ok('"סיום" closes the outing', !(K().gravel || {}).start);
    ok('the routine moves to play', cur() === 'play');
    // play, meal, a bite and its correction
    click('#sec-play [data-act=play][data-k=rope]');
    ok('play with the rope', last('play').y === 'rope');
    click('#sec-food [data-act=pt][data-k=food]');
    ok('"אכלה" at the food step: a meal; the routine moves on', mealKind(last('food')) === 'meal' && cur() === 'potty');
    click('#sec-food [data-act=pt][data-k=food]');
    ok('a second "אכלה" right after: a bite, and the toast offers the correction', mealKind(last('food')) === 'bite' && !!$q('#toMeal'));
    click('#toMeal');
    ok('"זו הייתה ארוחה": now a meal', mealKind(last('food')) === 'meal');
    click('[data-act=pt][data-k=water]');
    ok('"שתתה"', !!last('water'));
    // poop, with place and kind
    click('#sec-potty [data-act=pt][data-k=poop]');
    pick('[data-w=gravel]'); pick('[data-q=ok]');
    ok('קקי on the gravel, ordinary: place and kind saved; the round is done', last('poop').w === 'gravel' && last('poop').q === 'ok');
    // "לא עשתה"
    click('.gravel [data-act=pt][data-k=none]');
    ok('"לא עשתה" from the gravel card', !!last('none'));
    // undo
    const n0 = state.log.length;
    click('#sec-potty [data-act=pt][data-k=pee]'); close();
    click('#undo');
    ok('a pee, then "ביטול": gone again', state.log.length === n0);
    // a poop in the crate keeps the stay
    click('#sec-crate [data-act=dur][data-k=crate]');
    click('#sec-potty [data-act=pt][data-k=poop]'); pick('[data-w=crate]'); close();
    ok('back in the crate; a poop "בכלוב" keeps her in it', !!K().crate.start && last('poop').w === 'crate');
    click('#sec-crate [data-act=dur][data-k=crate]');
    // fix an entry from the list
    click(`.uni .r[data-e="${state.log.indexOf(last('pee'))}"]`);
    ok('tapping a row of the day\'s list opens it for fixing', bg.classList.contains('show') && !!sh.querySelector('#tIn'));
    close();
    // add an entry a few days back, bath
    click('[data-act=addev]');
    pick('[data-kind=bath]'); pick('[data-day="3"]'); sh.querySelector('#tIn').value = '18:00'; pick('#ok');
    const d3 = new Date(now - 3*24*HOUR); d3.setHours(18, 0, 0, 0);
    ok('"הוספת רישום": a bath three days ago at 18:00', logOf('kishmish', 'bath').some(e => e.t === d3.getTime()));
    click('#sec-bath [data-act=pt][data-k=bath]');
    ok('"קילחתי"', logOf('kishmish', 'bath').length === 2);
    // the extra lines simply show (no "עוד", owner 25.11), and the cards have no "שעה אחרת" (the main button asks when)
    const peeCard = () => $q('#sec-potty [data-act=pt][data-k=pee]').closest('.card');
    ok('no "עוד" and no "שעה אחרת" on the cards; the extra lines show', !peeCard().querySelector('[data-act=more]') && !$q('.card.item [data-act=edit][data-k=pee]') && [...peeCard().querySelectorAll('.hint.x')].every(x => x.getClientRects().length > 0));
    // a step of the routine jumps to its cards
    click('button[data-go=food]');
    ok('a step of the routine jumps to its cards', $q('#sec-food').classList.contains('flash') || [...$q('#sec-food').querySelectorAll('.card')].some(c => c.classList.contains('flash')));
    // the summary and back
    click('[data-view=sum]');
    ok('the summary opens', view === 'sum' && !!$q('#main .tiles'));
    click('[data-view=now]');
    // Kochik
    click('[data-pet=kochik]');
    click('[data-act=med][data-k=am]');
    ok('Kochik: the morning medicine', Object.keys(V.kochik.meds).length === 1);
    click('[data-act=pt][data-k=gel]');
    ok('Kochik: ear gel', logOf('kochik', 'gel').length === 1);
    click('[data-act=pt][data-k=vomit]'); pick('[data-q=bile]');
    ok('Kochik: vomiting, with what came up', logOf('kochik', 'vomit')[0].q === 'bile');
    click('[data-act=pt][data-k=pee]'); pick('[data-w=out]');
    ok('Kochik: a pee outside', logOf('kochik', 'pee')[0].w === 'out');
    click('[data-act=dur][data-k=medoff]');
    ok('Kochik: medicines paused', !!(V.kochik.medoff || {}).start);
    click('[data-act=dur][data-k=medoff]');
    ok('…and back on', !(V.kochik.medoff || {}).start);
    done();
  } catch(e){ crashed(e); }
})();
