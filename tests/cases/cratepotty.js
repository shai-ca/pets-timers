// "בכלוב" as a place for Kishmish's pee / poop (25.11: she pooped in the crate). Choosing it keeps her in the crate.
(async function(){
  try {
    reset();
    const now = Date.now(), late = now - midnight() > 200*MIN, K0 = { p:'kishmish' }, stays = () => logOf('kishmish', 'crate');
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    seed([{ ...K0, k:'crate', t: now - 30*MIN }]);
    tile('poop').click();
    ok('"בכלוב" is offered for Kishmish', !!sh.querySelector('[data-w=crate]') && sh.querySelector('[data-w=crate]').textContent === 'בכלוב');
    sh.querySelector('[data-w=crate]').click();
    const pp = logOf('kishmish', 'poop')[0];
    ok('a poop in the crate: saved with the place, and she is still in the crate (same stay, same round)', pp.w === 'crate' && stays().length === 1 && !stays()[0].end && !!K().crate.start && roundStarts('kishmish').length === 1);
    ok('shown as an accident in the list', !!$q('.uni .wh.crate'));
    // any other place still means she came out
    seed([{ ...K0, k:'crate', t: now - 30*MIN }]);
    tile('pee').click(); sh.querySelector('[data-w=gravel]').click();
    ok('the gravel still ends the stay', !!stays()[0].end && !K().crate.start);
    // fixed later from the entry's sheet
    seed([{ ...K0, k:'crate', t: now - 30*MIN, end: now - 10*MIN }, { ...K0, id:'pp', k:'poop', t: now - 10*MIN, w:'floor' }]);
    pottyInCrate(state.log.find(e => e.id === 'pp'));
    ok('changing the place to the crate reopens the stay it ended', !stays()[0].end);
    // a later stay already began: nothing is reopened
    seed([{ ...K0, k:'crate', t: now - 60*MIN, end: now - 40*MIN }, { ...K0, id:'pp', k:'poop', t: now - 40*MIN }, { ...K0, k:'crate', t: now - 20*MIN }]);
    pottyInCrate(state.log.find(e => e.id === 'pp'));
    ok('…but not when a later stay has begun', stays()[0].end === now - 40*MIN && stays().length === 2);
    ok('Kochik is not offered the crate', !PETS.kochik.where.includes('crate'));
    done();
  } catch(e){ crashed(e); }
})();
