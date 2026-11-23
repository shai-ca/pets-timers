// The wheel follows what is logged on the tiles; nothing about the step is stored.
(async function(){
  try {
    reset();
    const cur = () => { const e = $q('.rc b'); return e ? e.textContent : ''; }, nxt = () => $q('.rl.nxt').textContent.replace(/^\d/, '');
    const tags = () => [...document.querySelectorAll('.card.nowt')].map(c => c.querySelector('[data-k]').dataset.k).join();
    const late = Date.now() - midnight() > 200*MIN;
    ok('empty: the wheel waits; nothing on it can be tapped', routine('kishmish') === null && $n('.sg.cur') === 0 && nxt() === 'כלוב' && $n('.cyc [data-seg]') === 0);
    ok('tiles: crate, pee, poop, food, sleep, cry + "nothing" row + play card', $n('.card.item') === 6 && !!$q('.card.slim') && !!$q('.card.playc') && !!$q('[data-act=nofood]'));
    ok('start: crate tile tagged, instruction names the button', tags() === 'crate' && $q('.cyc-n').textContent.includes('נכנסה לכלוב'));
    if(late){
      tapDur('kishmish', 'crate', Date.now() - 90*MIN);
      ok('crate tile -> wheel on crate, next step outlined', cur() === 'כלוב' && nxt() === 'טיול וצרכים' && $n('.sg.cur') === 1 && $n('.sg.nxt') === 1 && $q('.cyc-h small').textContent.includes('סבב 1'));
      ok('no stored step or timer field: the running stay is an entry', !('cyc' in state) && !state.kishmish && logOf('kishmish', 'crate').length === 1 && logOf('kishmish', 'crate')[0].end == null);
      $q('[data-act=dur][data-k=crate]').click();
      ok('out of the crate -> walk + potty, reminder up, potty tiles tagged', cur() === 'טיול וצרכים' && !!$q('.duemsg') && tags() === 'pee,poop,none');
      tile('none').click();
      ok('"nothing" -> play; reminder cleared; play card and food tagged', cur() === 'משחק' && nxt() === 'אוכל' && !$q('.duemsg') && !!$q('.card.playc.nowt') && $n('.card.nowt') === 2);
      $q('[data-act=play][data-k=rope]').click();
      ok('rope is play only', cur() === 'משחק' && logOf('kishmish', 'food').length === 0);
      $q('[data-act=play][data-k=kong]').click(); $q('[data-act=play][data-k=lick]').click();
      ok('kong + lick mat: one meal, wheel moves to potty', logOf('kishmish', 'food').length === 1 && cur() === 'צרכים' && nxt() === 'כלוב');
      tile('poop').click(); sh.querySelector('[data-w=gravel]').click();
      ok('poop after the meal -> round done, crate next', cur() === 'הסבב הושלם' && $n('.sg.cur') === 0 && $n('.sg.done') === 4 && logOf('kishmish', 'poop')[0].w === 'gravel');
      openEntrySheet(state.log.findIndex(e => e.k === 'poop')); sh.querySelector('#del').click();
      ok('deleting that poop moves the wheel back by itself', cur() === 'צרכים');
      document.getElementById('undo').click(); ok('undo -> done again', cur() === 'הסבב הושלם');
      tapDur('kishmish', 'crate'); ok('crate again = round 2', cur() === 'כלוב' && $q('.cyc-h small').textContent.includes('סבב 2'));
      tapDur('kishmish', 'sleep'); ok('asleep in the crate: moon, "let her sleep", no reminder', !!$q('.rc .zzi') && !!$q('.zz') && !$q('.duemsg'));
      $q('[data-act=dur][data-k=crate]').click(); ok('out of the crate also ends the sleep', !K().sleep.start && !K().crate.start && cur() === 'טיול וצרכים');
      tile('pee').click(); sh.querySelector('#cancel').click(); $q('[data-act=nofood]').click();
      ok('"did not eat" -> potty step, no meal counted', cur() === 'צרכים' && logOf('kishmish', 'nofood').length === 1 && logOf('kishmish', 'food').length === 1);
      $q('[data-act=brk]').click(); ok('break', cur() === 'הפסקה' && !$q('[data-act=brk]'));
      tile('pee').click(); sh.querySelector('#cancel').click(); ok('any new entry resumes the routine', cur() !== 'הפסקה');
      ok('one list shows it all', $q('.uni').textContent.includes('לא אכלה') && $q('.uni').textContent.includes('משחק · קונג ממולא') && $q('.uni').textContent.includes('הפסקה בשגרה'));
      // crate too long turns red in the daytime
      seed([{ p:'kishmish', k:'crate', t: Date.now() - 130*MIN }]); const hr = new Date().getHours();
      ok('over two hours: red by day only', (!!$q('.sg.cur.over') && !!$q('.card.item.live.cry')) === (hr >= 7 && hr < 22));
    }
    $q('[data-act=help]').click(); ok('help sheet', sh.textContent.includes('מסמנים רק בכרטיסים')); close();
    pet = 'kochik'; render(); ok('kochik: no wheel, no play card, no tags', !$q('.cyc') && !$q('.playc') && $n('.card.item') === 4 && $n('.nowt') === 0);
    done();
  } catch(e){ crashed(e); }
})();
