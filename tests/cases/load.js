// The page must start cleanly with real data already saved on the phone (everything `derive` needs has to
// exist by the time the saved list is read while the page loads).
(async function(){
  try {
    if(!sessionStorage.getItem('load-test')){
      const now = Date.now(), log = [
        { id:'a', p:'kishmish', k:'none', t: now - 50*MIN }, { id:'b', p:'kishmish', k:'crate', t: now - 45*MIN, end: now - 30*MIN },
        { id:'c', p:'kishmish', k:'pee', t: now - 28*MIN, w:'gravel' }, { id:'d', p:'kishmish', k:'crate', t: now - 20*MIN },
        { id:'e', p:'kishmish', k:'cry', t: now - 20*MIN, end: now - 17*MIN }, { id:'f', p:'kochik', k:'med_am', t: now - 60*MIN }, { id:'g', p:'kochik', k:'poop', t: now - 90*MIN, q:'dia' } ];
      localStorage.clear();
      localStorage.setItem('pets-timers-v2', JSON.stringify({ state: { v:2, log }, base: { v:2, log } }));
      localStorage.setItem('pets-timers-v1-user', 'shai'); localStorage.setItem('pets-timers-v1-tab', 'kishmish'); localStorage.setItem('pets-timers-v1-salvaged', '1');
      sessionStorage.setItem('load-test', '1');
      location.reload(); return;
    }
    sessionStorage.removeItem('load-test'); FAKE_HOUR = 12; FAKE_PHONE = false; SLEEP2_FROM = Infinity; render();   // the checks below describe the day screen
    ok('the saved list was read while loading', state.log.length === 7 && me === 'shai');
    ok('the page rendered from it', $n('.card.item') === 11 && !!$q('.cyc') && $q('.rc b').textContent === 'כלוב');
    ok('derived values are there straight away: assumed sleep, a retry stay, the checklist', !!K().sleep.start && K().sleep.assumed === true && isRetryStay(state.log.find(e => e.id === 'b')) && !!medsOf('kochik').am);
    done();
  } catch(e){ crashed(e); }
})();
