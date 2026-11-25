// @fake-sdk
// @variants #preview #sandbox
// PREVIEW / SANDBOX ISOLATION (v3): at /preview/ nothing reaches the server or the live localStorage key, whatever is
// tapped — enforced at the persistence layer. The plain run is the live app: it still writes. The sign-in gate applies.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms + 40)), g = document.getElementById('gate'), F = window.__fake, now = Date.now();
    const mode = location.hash.slice(1) || 'live', K0 = { p:'kishmish' };
    ok('mode from start-up: ' + mode, MODE === mode);
    ok('banner: ' + mode, mode === 'live' ? !document.getElementById('modebar') : document.getElementById('modebar').textContent.includes(mode === 'sandbox' ? 'ארגז חול · לא נשמר · איפוס' : 'תצוגה מקדימה · לא נשמר'));
    await pause(50); ok('the sign-in gate still locks', !g.hidden && !!g.querySelector('#gIn'));
    F.doc = { v:2, log:[{ id:'s1', p:'kishmish', k:'pee', t: now - 3*HOUR, w:'gravel' }, { id:'s2', p:'kishmish', k:'food', t: now - 2*HOUR }] };
    g.querySelector('#gIn').click(); await pause(60);
    ok('signed in: the server list arrives', g.hidden && state.log.length === 2);
    ok(mode === 'sandbox' ? 'sandbox: the listener is detached after the first read' : 'the listener stays attached', mode === 'sandbox' ? F.unsubs === 1 : F.unsubs === 0);
    me = 'shai'; ASK_WHEN = false; DUP_MS = 0; FAKE_HOUR = 12;
    localStorage.setItem(LS_DATA, 'SENTINEL'); WRITE_CALLS = 0; BLOCKED_CALLS = 0; F.tx = 0;
    const st0 = clone(state);
    // everything that changes the list
    tapPoint('kishmish', 'pee'); close();
    tapPoint('kishmish', 'food'); tapPoint('kishmish', 'water');
    tapDur('kishmish', 'crate'); tapDur('kishmish', 'crate');
    commit('edit', () => { const x = state.log.find(e => e.k === 'food' && e.id !== 's2'); x.t -= 5*MIN; });
    commit('delete', () => { state.log = state.log.filter(e => e.id !== 's1'); });
    document.getElementById('undo').click();
    tapDur('kishmish', 'gravel'); tapDur('kishmish', 'gravel');
    commit('cset', () => state.log.push({ ...K0, k:'cset', t: Date.now(), door:'closed', cover:'covered' }));
    await pause(30); await wait(5);
    ok('the page itself changed', state.log.length > 2 && state.log.some(e => e.k === 'cset'));
    if(mode === 'live'){
      ok('live: writes reach the server writer', WRITE_CALLS > 0 && F.tx > 0);
      ok('live: the live localStorage key is written', localStorage.getItem(LS_DATA) !== 'SENTINEL');
    } else {
      ok(mode + ': no write reached the server', WRITE_CALLS === 0 && F.tx === 0 && BLOCKED_CALLS > 0);
      ok(mode + ': the live localStorage key untouched', localStorage.getItem(LS_DATA) === 'SENTINEL');
      let refused = false; await ref.merge(x => x).catch(e => { refused = e && e.code === 'preview'; });
      ok(mode + ': ref.merge itself refuses', refused && F.tx === 0 && WRITE_CALLS === 0);
      onServer({ v:2, log:[{ id:'s9', p:'kochik', k:'pee', t: now - MIN }] }); await wait();
      if(mode === 'sandbox'){
        ok('sandbox: later server data is ignored', state.log.length > 2);
        document.getElementById('sbReset').click();
        ok('sandbox: "איפוס" brings back the copy that was read', canon(state.log) === canon(st0.log));
      } else ok('preview: live server data still arrives (local changes stay on top, unsent)', state.log.some(e => e.id === 's9') && base.log.length === 1 && F.tx === 0 && WRITE_CALLS === 0 && localStorage.getItem(LS_DATA) === 'SENTINEL');
    }
    done();
  } catch(e){ crashed(e); }
})();
