// Night routine (owner, 27.11): at night (NIGHTS.screen, `isNight`) the round is sleep → potty → back to the crate → sleep.
// No play / meal step, no free time, no daytime wake window, no sleep-onset prediction; a missing crate or sleep entry is
// unknown, nothing is written. A synthetic night like hers: asleep in the crate, out to the gravel, pee + poop, "סיום".
(async function(){
  try {
    reset();
    const now = Date.now(), K0 = { p:'kishmish' };
    const night = (extra = []) => [
      { ...K0, k:'food', t: now - 5*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 4*HOUR - 30*MIN, w:'gravel' },
      { ...K0, k:'crate', t: now - 4*HOUR, end: now - 14*MIN }, { ...K0, k:'sleep', t: now - 4*HOUR + 2*MIN, end: now - 14*MIN },
      { ...K0, k:'gravel', t: now - 14*MIN, end: now - 9*MIN }, { ...K0, k:'pee', t: now - 13*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 10*MIN, w:'gravel' },
    ].concat(extra);
    const txt = () => ($q('.cyc') || {}).textContent || '';
    const tags = () => [...document.querySelectorAll('#main .nowt, #main section.grp.now')].map(c => c.id || (c.querySelector('[data-k]') || {}).dataset?.k || c.className).join();
    const noDay = what => {
      const t = txt();
      ok(what + ': no play step / play text', !t.includes('זמן משחק') && !$q('.sg.cur[data-go=play]') && !$q('.card.playc.nowt') && !$q('#sec-play.now') && !$q('#sec-food.now'));
      ok(what + ': no "ערה כבר … · לכלוב לישון" / 3-hours note / free time', !t.includes('· לכלוב לישון') && !t.includes('להוציא לחצץ') && !$q('.card.free') && !$q('.frm'));
      ok(what + ': no daytime sleep window (no "לשינה" bar), no orange awake tile', sleepWindow('kishmish') === null && ![...document.querySelectorAll('.gauge small')].some(s => s.textContent.includes('לשינה')) && !$q('.card.item.warn'));
    };
    // 1. at night, potty only — no crate entry, no sleep entry
    FAKE_HOUR = 1; nightFull = true; seed(night()); const before = state.log.length;
    let r = routine('kishmish');
    ok('night potty, nothing else: the night step, next = the crate', !!r && r.night === true && r.i === 1 && r.next === 0 && r.t === now - 10*MIN);
    ok('…the wheel says night, back to the crate, crate logging optional', txt().includes('לילה') && txt().includes('לכלוב') && txt().includes('לא חובה') && !!$q('.sg.cur[data-go=potty]') && !!$q('.sg.nxt[data-go=crate]'));
    ok('…only the crate is tagged "עכשיו בשגרה"', routineTap('kishmish').join() === 'crate' && !!$q('#sec-crate.now'));
    noDay('no crate, no sleep');
    ok('…nothing invented: no crate / sleep entry written, not asleep, not in the crate', state.log.length === before && !K().crate.start && !K().sleep.start);
    // awake an hour+ / three hours since the pee, by the list: daytime notes by day, none after a night potty
    const long = [{ ...K0, k:'food', t: now - 5*HOUR, m:'meal' }, { ...K0, k:'crate', t: now - 6*HOUR, end: now - 3*HOUR - 40*MIN }, { ...K0, k:'pee', t: now - 3*HOUR - 30*MIN, w:'gravel' }];
    const sod0 = now - 3*HOUR - 40*MIN >= midnight();   // "לכלוב לישון" counts only an awake time that began today
    seed(long); ok('3.5 h after a night potty: no "לכלוב לישון", no "להוציא לחצץ", no take-out reminder', routine('kishmish').night && !txt().includes('· לכלוב לישון') && !txt().includes('להוציא לחצץ') && !txt().includes('זמן להוציא'));
    FAKE_HOUR = 12; render(); ok('…the same list at midday: the 3-hours note is there' + (sod0 ? ' and "לכלוב לישון"' : ''), txt().includes('להוציא לחצץ') && (!sod0 || txt().includes('לכלוב לישון')));
    FAKE_HOUR = 1; seed(night());
    // the slim night screen itself is unchanged (no wheel there)
    nightFull = false; render(); ok('the slim night screen: still no wheel, its usual cards', !$q('.cyc') && !!$q('.nightc') && $n('#main .card.item') === 3); nightFull = true;
    // 2. with a sleep entry but no crate entry
    seed(night([{ ...K0, k:'sleep', t: now - 5*MIN }])); r = routine('kishmish');
    ok('sleep marked, no crate: still the night step, asleep, "nothing to log"', r.night && !!K().sleep.start && txt().includes('ישנה') && !txt().includes('זמן משחק') && !K().crate.start);
    noDay('sleep, no crate');
    // 3. with a crate entry, no sleep entry: the ordinary crate step; no sleep entry is written
    seed(night([{ ...K0, k:'crate', t: now - 5*MIN }])); r = routine('kishmish');
    ok('back in the crate (logged): the crate step', r.i === 0 && !r.night && !logOf('kishmish', 'sleep').some(e => e.t > now - 10*MIN));
    ok('…no play text, no sleep window', !txt().includes('זמן משחק') && sleepWindow('kishmish') === null);
    // 4. crate + sleep
    seed(night([{ ...K0, k:'crate', t: now - 5*MIN }, { ...K0, k:'sleep', t: now - 3*MIN }]));
    ok('crate + sleep: the crate step, asleep', routine('kishmish').i === 0 && !!K().sleep.start && !txt().includes('זמן משחק'));
    // 5. the outing still running: the night step tells to finish and go back
    seed(night().map(e => e.k === 'gravel' ? { ...e, end: undefined } : e));
    ok('outing still running: "סיום" and back to the crate', routine('kishmish').night && txt().includes('סיום') && !txt().includes('זמן משחק'));
    // 6. a meal after the night potty: the day's reading (potty after the meal)
    seed(night([{ ...K0, k:'food', t: now - 5*MIN, m:'meal' }]));
    ok('a meal after it: back to the day reading (potty after the meal)', routine('kishmish').i === 4 && !routine('kishmish').night);
    // 7. long ago (more than one night): not the night step
    seed([{ ...K0, k:'pee', t: now - 8*HOUR, w:'gravel' }]);
    ok('a potty more than one night ago is not this night\'s', !(routine('kishmish') || {}).night);
    // 8. daytime regression: the same sequence at midday is unchanged
    FAKE_HOUR = 12; seed(night()); r = routine('kishmish');
    ok('midday: the play step, as before', r.i === 2 && !r.night && r.next === 3 && txt().includes('זמן משחק'));
    ok('midday: play and food tagged, free time on, the sleep window there', routineTap('kishmish').join() === 'play,food' && !!freeTime('kishmish') && !!sleepWindow('kishmish'));
    if(V2) ok('midday (new design): the "לשינה" bar is shown', [...document.querySelectorAll('.gauge small')].some(s => s.textContent.includes('לשינה')));
    seed(night([{ ...K0, k:'sleep', t: now - 5*MIN }]));
    ok('midday, sleep without crate: unchanged (play step)', routine('kishmish').i === 2);
    // 9. boundaries come from NIGHTS.screen (isNight): 23:00–06:00, nothing hard-coded
    ok('the hours are NIGHTS.screen', NIGHT === NIGHTS.screen && NIGHT_SPAN === ((NIGHTS.screen.to - NIGHTS.screen.from + 24) % 24) * HOUR);
    seed(night());
    const at = h => { FAKE_HOUR = h; render(); return !!(routine('kishmish') || {}).night; };
    ok('22:59 day, 23:00 night, 05:59 night, 06:00 day', !at(NIGHT.from - 0.02) && at(NIGHT.from) && at(NIGHT.to - 0.02) && !at(NIGHT.to));
    ok('at 06:00 the day routine is back (play)', routine('kishmish').i === 2);
    // the screen follows: the slim night screen at the same hours
    FAKE_HOUR = NIGHT.from; nightFull = false; render(); ok('23:00: the slim night screen', !!$q('.nightc')); nightFull = false;
    done();
  } catch(e){ crashed(e); }
})();
