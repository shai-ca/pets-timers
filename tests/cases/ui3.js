// v3 UI (agent E): night drink for both dogs, Kochik's slim night screen, carrier / pen / crate setup on the crate card,
// the advice line, summary rows — and the tap count of every common action stays what it was.
(async function(){
  try {
    // --- tap counts (ASK_WHEN on, as on the phone): every click from the first button until no sheet is left open
    const showing = () => bg.classList.contains('show');
    function taps(first){
      let n = 0; const click = el => { n++; el.click(); };
      const b = typeof first === 'string' ? $q(first) : first; if(!b) return -1;
      click(b);
      for(let guard = 0; showing() && guard < 8; guard++){
        const nx = sh.querySelector('[data-m="0"]') || sh.querySelector('[data-w=gravel]') || sh.querySelector('[data-w]') || sh.querySelector('[data-q]') || sh.querySelector('#ok');
        if(!nx) break; click(nx);
      }
      return n;
    }
    const counts = {};
    const K0 = {p:'kishmish'}, now0 = Date.now();
    const base = () => seed([{...K0, k:'food', t: now0 - 2*HOUR}, {...K0, k:'pee', t: now0 - 90*MIN, w:'gravel'}]);
    reset(); ASK_WHEN = true; base();
    counts.pee = taps('#main .card [data-act=pt][data-k=pee]');
    base(); counts.poop = taps('#main .card [data-act=pt][data-k=poop]');
    base(); counts.none = taps('#main .card [data-act=pt][data-k=none]');
    base(); counts.food = taps('#main .card [data-act=pt][data-k=food]');
    base(); counts.water = taps('#main .card [data-act=pt][data-k=water]');
    base(); counts.crateIn = taps('[data-act=dur][data-k=crate]');
    counts.crateOut = taps('[data-act=dur][data-k=crate]');
    base(); counts.asleep = taps('[data-act=dur][data-k=sleep]');
    counts.woke = taps('[data-act=dur][data-k=sleep]');
    base(); counts.gravelStart = taps('.card.gravel [data-act=dur][data-k=gravel]');
    counts.gravelStop = taps('.card.gravel.on .gend');
    pet = 'kochik'; seed([{p:'kochik', k:'food', t: now0 - 2*HOUR}]);
    counts.kPee = taps('#main .card [data-act=pt][data-k=pee]');
    counts.kPoop = taps('#main .card [data-act=pt][data-k=poop]');
    counts.kFood = taps('#main .card [data-act=pt][data-k=food]');
    counts.kWater = taps('#main .card [data-act=pt][data-k=water]');
    // the counts measured on the code before v3 (main@8e6cae3, both designs) — none may grow
    const BEFORE = {pee:3, poop:4, none:2, food:2, water:2, crateIn:2, crateOut:2, asleep:2, woke:2, gravelStart:2, gravelStop:2, kPee:3, kPoop:4, kFood:2, kWater:2};
    for(const k of Object.keys(BEFORE)) ok(`tap count unchanged: ${k} = ${BEFORE[k]}`, counts[k] === BEFORE[k]);
    // night: the same counts, and the drink is one tap + "when?" like the day
    pet = 'kishmish'; FAKE_HOUR = 2;
    const nbase = () => seed([{...K0, k:'food', t: now0 - 5*HOUR}, {...K0, k:'pee', t: now0 - 90*MIN, w:'gravel'}, {...K0, k:'crate', t: now0 - 80*MIN}]);
    nbase(); const nc = {};
    nc.water = taps('#main .nightw [data-act=pt][data-k=water]');
    ok('night drink: one tap + "now", logged as water', nc.water === 2 && logOf('kishmish', 'water').length === 1);
    ok('…the night screen stays, no advice, the drink ended the crate stay at its time', !!$q('.nightc') && !$q('.advice') && !K().crate.start && !$q('.cyc'));
    nbase(); nc.pee = taps('#main .card [data-act=pt][data-k=pee]');
    nbase(); nc.poop = taps('#main .card [data-act=pt][data-k=poop]');
    nbase(); nc.crateOut = taps('[data-act=dur][data-k=crate]'); nc.crateIn = taps('[data-act=dur][data-k=crate]');
    nbase(); nc.gravelStart = taps('.card.gravel [data-act=dur][data-k=gravel]'); nc.gravelStop = taps('.card.gravel.on .gend');
    ok('night tap counts = day tap counts', ['pee','poop','crateOut','crateIn','gravelStart','gravelStop'].every(k => nc[k] === BEFORE[k]));
    ASK_WHEN = false;

    // --- the night screens: exactly one new button per dog
    nbase();
    const sig = () => [...document.querySelectorAll('#main button')].map(b => (b.dataset.act || '?') + ':' + (b.dataset.k || '')).sort().join(' ');
    // before v3 (main@8e6cae3) Kishmish in the crate at 02:00 had exactly these:
    const KN_BEFORE = 'dur:crate dur:cry dur:gravel edit:crate nightfull: pt:none pt:pee pt:poop swap:';
    ok('Kishmish night: the old buttons + exactly one drink', sig() === (KN_BEFORE + ' pt:water').split(' ').sort().join(' '));
    ok('…no carrier / pen / setup controls at night', !$q('#main [data-k=carrier], #main [data-k=pen], #main [data-act=cset]'));
    pet = 'kochik'; seed([{p:'kochik', k:'food', t: now0 - 5*HOUR}, {p:'kochik', k:'pee', t: now0 - 3*HOUR, w:'out'}]);
    const kids = [...document.querySelectorAll('#main > .card')];
    ok('Kochik night: a slim screen — "show all", pee, poop, drink, vomit and nothing else', !!$q('.nightc [data-act=nightfull]') && kids.length === 5 && !!tile('pee') && !!tile('poop') && !!tile('vomit') && $n('#main [data-k=water]') === 1 && !tile('food') && !tile('gel') && !$q('.medc') && !$q('#sec-notes') && !$q('.log'));
    ok('…its buttons: the four + "show all"', sig() === 'nightfull: pt:pee pt:poop pt:vomit pt:water');
    ASK_WHEN = true; ok('…Kochik drinks at night: one tap + "now"', taps('#main [data-k=water]') === 2 && logOf('kochik', 'water').length === 1 && !!$q('.nightc')); ASK_WHEN = false;
    $q('[data-act=nightfull]').click(); ok('…"show all" brings her full screen', !$q('.nightc') && !!tile('food') && !!$q('.medc'));
    nightFull = false; FAKE_HOUR = 12; pet = 'kishmish';

    // --- carrier and pen: secondary actions inside the crate card
    seed([{...K0, k:'pee', t: now0 - 30*MIN, w:'gravel'}, {...K0, k:'crate', t: now0 - 20*MIN}]);
    const cxIn = sel => { const b = $q(sel); return !!b && !!b.closest('.card.item') && !!b.closest('.card.item').querySelector('[data-act=dur][data-k=crate]'); };
    ok('carrier, pen and setup sit inside the crate card', cxIn('.cx [data-k=carrier]') && cxIn('.cx [data-k=pen]') && cxIn('.cx [data-act=cset]'));
    ok('…not on the main screen as rows of their own', !$q('#main > .card [data-k=carrier]:not(.cx *)') && $n('[data-k=carrier]') === 1);
    $q('.cx [data-k=carrier]').click();
    ok('carrier: one tap starts it, out of the crate', !!K().carrier.start && !K().crate.start && logOf('kishmish', 'carrier').length === 1);
    ok('…running: a compact line with its stop button', !!$q('.cx-on [data-k=carrier]') && $q('.cx-on').textContent.includes(ITEMS.carrier.live) && $q('.cx-on [data-k=carrier]').textContent === ITEMS.carrier.stop && !$q('.cx-b[data-k=carrier]'));
    $q('.cx-on [data-k=carrier]').click();
    ok('…one tap stops it', !K().carrier.start && logOf('kishmish', 'carrier')[0].end != null && !!$q('.cx-b[data-k=carrier]'));
    ASK_WHEN = true; ok('carrier with "when?": button + "10 min ago"', (() => { $q('.cx [data-k=carrier]').click(); const c = sh.querySelector('[data-m="10"]'); if(!c) return false; c.click(); const e = logOf('kishmish', 'carrier').find(x => x.end == null); return !!K().carrier.start && Math.abs(e.t - (Date.now() - 10*MIN)) < 2*MIN; })());
    ok('…stop also asks "when?" and "now" ends it', taps('.cx-on [data-k=carrier]') === 2 && !K().carrier.start); ASK_WHEN = false;
    $q('.cx [data-k=pen]').click();
    ok('pen: one tap starts it', !!K().pen.start && !!$q('.cx-on [data-k=pen]') && $q('.cx-on [data-k=pen]').textContent === ITEMS.pen.stop);
    $q('.cx-on [data-k=pen]').click(); ok('…one tap stops it', !K().pen.start && logOf('kishmish', 'pen').length === 1 && logOf('kishmish', 'pen')[0].end != null);
    $q('[data-act=dur][data-k=crate]').click(); ok('in the crate: the secondary actions are still there', !!$q('.cx [data-k=pen]') && !!$q('.cx [data-k=carrier]'));

    // --- crate setup
    seed([{...K0, k:'crate', t: now0 - 20*MIN}]);
    ok('crate setup: "לא ידוע" before the first entry', $q('.cx-set small').textContent === 'לא ידוע');
    $q('[data-act=cset]').click();
    ok('…a sheet with door and cover, nothing selected yet', showing() && $n('[data-f=door]') === 2 && $n('[data-f=cover]') === 2 && !sh.querySelector('.sel'));
    sh.querySelector('[data-f=door][data-v=closed]').click();
    const cs = () => logOf('kishmish', 'cset');
    ok('…choosing writes one cset with just that field', cs().length === 1 && cs()[0].door === 'closed' && cs()[0].cover === undefined && !showing());
    ok('…and the card shows it', $q('.cx-set small').textContent === 'דלת סגורה · כיסוי: לא ידוע');
    $q('[data-act=cset]').click(); ok('…the current choice is marked', sh.querySelector('[data-f=door][data-v=closed]').classList.contains('sel'));
    sh.querySelector('[data-f=door][data-v=closed]').click(); ok('…choosing the same again writes nothing', cs().length === 1);
    $q('[data-act=cset]').click(); sh.querySelector('#cancel').click(); ok('…closing writes nothing', cs().length === 1 && !showing());
    $q('[data-act=cset]').click(); sh.querySelector('[data-f=cover][data-v=uncovered]').click();
    ok('…a real change is written', cs().length === 2 && cs()[1].cover === 'uncovered' && $q('.cx-set small').textContent === 'דלת סגורה · בלי כיסוי');
    ok('…and the data layer reads it', crateSetup('kishmish', Date.now()).door === 'closed' && crateSetup('kishmish', Date.now()).cover === 'uncovered');

    // --- advice line
    seed([{...K0, k:'pee', t: now0 - 30*MIN, w:'gravel'}]);
    ok('advice: nothing for level none', $n('.advice') === 0);
    const realAdvice = advice;
    advice = () => ({level:'info', text:'כנראה תצטרך לצאת לחצץ בעוד כחצי שעה', why:'לפי השבוע האחרון'});
    render();
    ok('advice: said once, inside the Now card (no separate advice card)', $n('.advice') === 0 && $q('.nowc .now-a').textContent.includes('חצץ') && $n('.nowc') === 1);
    const sideKids = [...$q('#side').children].filter(x => !x.classList.contains('alertc') && !x.classList.contains('spraydry'));
    ok('…the Now card is at the top of the side column (under any alert)', sideKids[0] === $q('.nowc'));
    advice = realAdvice; render(); ok('…gone again with level none', $n('.advice') === 0);

    // --- summary rows
    const Y = midnight() - 12*HOUR;   // yesterday noon: the day view does not depend on the real clock
    view = 'sum'; sumMode = 'day'; sumAnchor = Y;
    seed([{...K0, k:'pee', t: Y, w:'gravel'}]);
    ok('summary: no carrier / pen rows when there were none', !$q('.xsum'));
    seed([{...K0, k:'pee', t: Y, w:'gravel'}, {...K0, k:'carrier', t: Y, end: Y + 25*MIN}]);
    ok('summary: a carrier row when there was a walk, no pen row', !!$q('.xsum.carrier') && !$q('.xsum.pen') && $q('.xsum.carrier').textContent.includes(ITEMS.carrier.lbl) && $q('.xsum.carrier').textContent.includes('פעם אחת'));
    seed([{...K0, k:'pen', t: Y, end: Y + HOUR}, {...K0, k:'pen', t: Y + 2*HOUR, end: Y + 2*HOUR + 10*MIN}]);
    ok('summary: a pen row with its total', !!$q('.xsum.pen') && $q('.xsum.pen').textContent.includes('2 פעמים') && !$q('.xsum.carrier'));
    view = 'now';
    done(JSON.stringify(counts));
  } catch(e){ crashed(e); }
})();
