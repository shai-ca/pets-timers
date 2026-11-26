// Data saved by version 1 (pet objects next to the list, no ids) must come through unchanged in meaning.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), early = Math.max(m0 + MIN, now - 300*MIN), day = dayKey(now);
    const v1 = { kochik: { food: early, meds: { [day]: { am: early + MIN } } },
      kishmish: { pee: now - 22*HOUR, food: now - 2*HOUR, crate: { start: now - 40*MIN, lastStart: now - 5*HOUR, lastEnd: now - 4*HOUR }, sleep: { lastStart: now - 9*HOUR, lastEnd: now - 8*HOUR }, cyc: { i: 2, t: 1 }, hist: [{ i: 0, t: 1 }] },
      log: [ { p:'kochik', k:'food', t: early, by:'shai' }, { p:'kochik', k:'med_am', t: early + MIN },
             { p:'kishmish', k:'pee', t: now - 22*HOUR }, { p:'kishmish', k:'pee', t: now - 50*MIN, w:'gravel' }, { p:'kishmish', k:'food', t: now - 2*HOUR },
             { p:'kishmish', k:'crate', t: now - 5*HOUR, end: now - 4*HOUR }, { p:'kishmish', k:'crate', t: now - 5*HOUR, end: now - 4.5*HOUR },
             { p:'kishmish', k:'sleep', t: now - 9*HOUR, end: now - 8*HOUR }, { p:'kishmish', k:'bogus', t: 5 }, null ] };
    const a = norm(clone(v1)), b = norm(clone(v1));
    ok('every phone derives the same ids', canon(a) === canon(b) && a.log.every(e => e.id));
    ok('idempotent: normalising again changes nothing', canon(norm(clone(a))) === canon(a));
    ok('version stamped, unknown kinds and junk dropped, old pet objects kept aside', a.v === SCHEMA && !a.kishmish && a.legacy.kishmish.pee === now - 22*HOUR && a.log.every(e => e && e.k !== 'bogus'));
    ok('both of the look-alike crate stays survive', a.log.filter(e => e.k === 'crate' && e.end).length === 2);
    use(a, clone(a)); render();
    ok('the running crate timer became an entry and still runs from the same time', K().crate.start === now - 40*MIN && logOf('kishmish', 'crate').some(e => e.end == null && e.t === now - 40*MIN) && !!$q('.card.item.live'));
    ok('the stuck "22 hours" number is gone: last pee comes from the list', K().pee === now - 50*MIN);
    ok('last finished stay unchanged; her logged sleep is still there', K().crate.lastEnd === now - 4*HOUR && logOf('kishmish', 'sleep')[0].end === now - 8*HOUR && K().food === now - 2*HOUR);
    ok('medicine checklist unchanged', medsOf('kochik').am === early + MIN && !medsOf('kochik').pm && KO().food === early);
    // once it is version 2, the old pet objects are never read again, even though they stay in the document
    const again = norm(Object.assign(clone(a), { legacy: { kishmish: { crate: { start: 12345 } } } }));
    ok('legacy objects are not read back', again.log.filter(e => e.k === 'crate' && e.end == null).length === 1);
    const fixed = norm({ v:2, log:[{ p:'kishmish', k:'crate', t: 1000, end: 5000 }, { p:'kishmish', k:'crate', t: 1000, end: 9000 }, { p:'kishmish', k:'sleep', t: 2000, end: 12000 }, { p:'kishmish', k:'sleep', t: 9000, end: 20000 }, { p:'kochik', k:'food', t: 3000 }] });
    ok('a sleep begun in a crate stay is cut at that stay\'s end (the longest one), others untouched; and it is stable', fixed.log.find(e => e.k === 'sleep' && e.t === 2000).end === 9000 && fixed.log.find(e => e.k === 'sleep' && e.t === 9000).end === 20000 && canon(norm(clone(fixed))) === canon(fixed));
    tapDur('kishmish', 'crate'); await wait();
    ok('stopping the migrated timer makes one finished stay', !K().crate.start && logOf('kishmish', 'crate').filter(e => e.t === now - 40*MIN && e.end).length === 1);
    done();
  } catch(e){ crashed(e); }
})();
