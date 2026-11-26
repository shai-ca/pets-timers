// Camera card (experimental, shadow mode): a fake camera service (window.fetch stubbed for the base URL only). Off by
// default; the card's place / time / status lines; null detector, stale frames, failures, timeouts, 401 / 403; the
// Authorization header and no token in any URL; blind labels; and SHADOW: polling and labeling leave the list, the
// advice, the routine and the plan exactly as they were, with nothing pushed. Never the real service.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const BASE = 'http://127.0.0.1:8787', TOK = 'TOK-SECRET-123', K0 = { p:'kishmish' };
    reset();
    const now = Date.now();
    const L0 = [{ ...K0, k:'food', t: now - 2*HOUR }, { ...K0, k:'pee', t: now - 90*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }];
    seed(L0);
    // ----- the fake service -----
    const calls = []; let mode = 'ok';
    const SEEN = now - 7*MIN;
    let LS = { schema:'cam-api/1', last_seen: { image_id:'c:1', capture_ts: SEEN, capture_uncertainty_s: 2, img:'/img?id=c%3A1', where:'crate', basis:'model',
                 confidence: 0.93, model:'occ-test', model_version:'t1', ir:false, age_s: 420 },
               detector: { available:true, model_version:'t1', validated:false, crate_now:{ status:'uncertain', confidence:0.5, capture_ts: now - 30000 } },
               latest: { capture_ts: now - 30000, age_s: 30 }, frame_dog_unverified: { capture_ts: now - 3*MIN, identity:'unverified' }, future_field: 1 };
    const SAMPLES = [0, 1, 2].map(i => ({ image_id:'s:' + i, capture_ts: now - (5 + 10*i)*MIN, img:'/img?id=s%3A' + i, group:{ n: 3 - i },
                 app:{ state:{ note:'APPSTATE_LEAK' } }, prediction:{ label:'PRED_LEAK', confidence:0.9 }, label: i === 1 ? { label_id:'Lold' } : null }));
    let evN = 0, DOOR = null;
    const res = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:{ 'content-type':'application/json' } });
    const realFetch = window.fetch;
    window.fetch = (url, o = {}) => {
      url = String(url);
      if(!url.startsWith(BASE)) return realFetch(url, o);
      calls.push({ url, method: o.method || 'GET', headers: o.headers || {}, body: o.body ? JSON.parse(o.body) : null });
      if(mode === 'fail') return Promise.reject(new TypeError('Failed to fetch'));
      if(mode === 'hang') return new Promise((_, no) => o.signal.addEventListener('abort', () => no(new DOMException('aborted', 'AbortError'))));
      if(mode === '401') return Promise.resolve(res({ schema:'cam-api/1', error:'auth' }, 401));
      if(mode === '403') return Promise.resolve(res({ schema:'cam-api/1', error:'forbidden' }, 403));
      const u = new URL(url);
      if(u.pathname === '/api/last_seen') return Promise.resolve(res({ ...LS, door_now: DOOR }));
      if(u.pathname === '/img' || u.pathname === '/api/v1/image') return Promise.resolve(new Response(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="#b85"/></svg>'], { type:'image/svg+xml' })));
      if(u.pathname === '/api/v1/samples') return Promise.resolve(res(SAMPLES));
      if(u.pathname === '/api/labels') return Promise.resolve(res({ schema:'cam-api/1', saved: 3, label_ids:['L1', 'L2', 'L3'] }));
      if(u.pathname === '/api/retract') return Promise.resolve(res({ schema:'cam-api/1', retracted: 3 }));
      if(u.pathname === '/api/events'){ evN++; return Promise.resolve(res({ schema:'cam-api/1', event_id: 'E' + evN })); }
      if(u.pathname === '/api/events/retract') return Promise.resolve(res({ schema:'cam-api/1', retracted: 1 }));
      return Promise.resolve(res({ error:'not found' }, 404));
    };
    const card = () => $q('#side .card.camc'), txt = () => (card() || {}).textContent || '';
    const poll = async () => { await camPoll(); await wait(3); };
    // ----- shadow: what must not move -----
    let commits = 0, pushes = 0;
    const realCommit = commit, realPush = push;
    commit = function(){ commits++; return realCommit.apply(this, arguments); };
    push = function(){ pushes++; return realPush.apply(this, arguments); };
    const T0 = Date.now(), realNow = Date.now;   // everything derived is computed at one pinned moment, so only the inputs can differ
    const snap = () => { const keep = V; Date.now = () => T0; try { V = derive(state); return JSON.stringify({ log: state.log, V: V.kishmish, adv: advice('kishmish'), rt: routine('kishmish'), plan: planBuild(0), ls: localStorage.getItem(LS_DATA) }); } finally { Date.now = realNow; V = keep; } };
    const before = snap(), W0 = WRITE_CALLS, B0 = BLOCKED_CALLS;

    // off by default
    ok('off by default: no setting, no card', !camBase() && !card());
    await camPoll(); ok('off: no request at all', calls.length === 0);
    ok('the quiet switch at the bottom, beside the design switch', !!$q('#dsw [data-cam=set]') && $q('#dsw [data-cam=set]').textContent.includes('מצלמה (ניסיוני) · במכשיר הזה'));
    // switching on from the sheet
    $q('#dsw [data-cam=set]').click();
    ok('the switch sheet suggests the Mac address', bg.classList.contains('show') && sh.querySelector('#camIn').value === BASE);
    fb = null; sh.querySelector('#camOn').click(); await wait(3);
    ok('on: stored per device only', localStorage.getItem('pets-timers-v1-cam') === BASE && !state.log.some(e => /cam/.test(e.k)));
    await poll();
    ok('without a signed-in account: "לא מחובר לחשבון" and no request', !!card() && txt().includes('לא מחובר לחשבון') && calls.length === 0);
    fb = { auth:{ currentUser:{ getIdToken: async () => TOK } } };
    await poll();
    ok('on: the thumbnail as a blob URL', /^blob:/.test((card().querySelector('img') || {}).src || ''));
    ok('on: place, exact time, "לפני", status', txt().includes('נראתה לאחרונה') && txt().includes('בכלוב') && txt().includes(clock(SEEN)) && txt().includes('לפני 7 דקות') && txt().includes('מחובר'));
    ok('on: provisional, the model\'s "now" in words, no numbers', txt().includes('ניסיוני · לא מאומת') && txt().includes('עכשיו לפי המודל: לא בטוח') && !/%|0\.9/.test(txt()));
    ok('the frame-wide dog is never shown as her on the card', !txt().includes('כלב'));
    ok('the "לפני" is live (data-words, ticked)', !!card().querySelector('[data-words="' + SEEN + '"]'));
    ok('in the side column, right after alerts / advice', card().parentElement.id === 'side');
    ok('every request carries the Bearer token', calls.length >= 2 && calls.every(c => c.headers.Authorization === 'Bearer ' + TOK));
    ok('no token in any URL', calls.every(c => !c.url.includes(TOK)));
    const blob1 = card().querySelector('img').src, n1 = calls.length;
    await poll(); ok('same image: not fetched again', calls.length === n1 + 1 && card().querySelector('img').src === blob1);
    LS = { ...LS, last_seen: { ...LS.last_seen, image_id:'c:2', img:'/img?id=c%3A2', basis:'label', model:null } };
    await poll(); ok('a newer frame: new blob, "תויג ידנית"', card().querySelector('img').src !== blob1 && txt().includes('תויג ידנית'));
    // null detector
    const LS1 = LS;
    LS = { schema:'cam-api/1', last_seen:null, detector:null, latest:{ capture_ts: now - 40000, age_s: 40 } };
    await poll(); ok('no detector: "זיהוי עוד לא זמין" with the newest frame\'s age, no thumbnail', txt().includes('זיהוי עוד לא זמין') && txt().includes('התמונה האחרונה לפני') && !card().querySelector('img') && txt().includes('מחובר'));
    // stale
    LS = { ...LS1, latest:{ capture_ts: now - 20*MIN, age_s: 1200 } };
    await poll(); ok('stale frames: "התמונות לא מתעדכנות (20 דק׳)"', txt().includes('התמונות לא מתעדכנות (20 דק׳)'));
    LS = LS1;
    // failures
    mode = 'fail'; CAM_NOT_CHROME = false; await poll();
    ok('unreachable: "המצלמה לא זמינה", no stale image', txt().includes('המצלמה לא זמינה') && !card().querySelector('img'));
    CAM_NOT_CHROME = true; await poll(); ok('blocked outside Chrome: the Chrome-on-Mac hint', txt().includes('רק ב־Chrome במק'));
    mode = 'hang'; CAM_TIMEOUT_MS = 60; CAM_NOT_CHROME = false; await camPoll(); await wait(2);
    ok('a timeout: "לא זמינה", no hint', txt().includes('המצלמה לא זמינה') && !txt().includes('Chrome'));
    CAM_TIMEOUT_MS = 4000;
    mode = '403'; await poll();
    const setTxt = () => ($q('#dsw [data-cam=set]') || {}).textContent || '';
    ok('403 (not on the camera\'s list): no card on the main screen', !card() && !document.getElementById('main').textContent.includes('מצלמה') && !$q('#side').textContent.includes('מצלמה'));
    ok('403: "החשבון הזה לא מורשה למצלמה" only beside the per-device setting', setTxt().includes('החשבון הזה לא מורשה למצלמה'));
    render(); ok('403: still no card after a full redraw', !card() && setTxt().includes('לא מורשה'));
    $q('#dsw [data-cam=set]').click(); ok('403: the setting sheet says why', sh.textContent.includes('החשבון הזה לא מורשה למצלמה')); close();
    mode = '401'; await poll(); ok('401: "צריך להתחבר"', txt().includes('צריך להתחבר'));
    mode = 'ok'; await poll(); ok('back: connected again, the card returns without a redraw', !!card() && txt().includes('מחובר') && !!card().querySelector('img') && setTxt().includes('פועלת'));
    // the sheet
    card().click();
    ok('tap the card: the image large, time with seconds, place', bg.classList.contains('show') && /^blob:/.test(sh.querySelector('.cam-big').src) && sh.textContent.includes('בכלוב'));
    ok('…the model behind "איך זה מחושב", the unidentified dog only as a neutral line', !!sh.querySelector('details.cam-how') && sh.textContent.includes('לפי תיוג ידני') && sh.textContent.includes('כלב בתמונה (לא מזוהה)'));
    // labeling
    sh.querySelector('#camLbl').click(); await pause(20); await wait(5);
    const sc = calls.filter(c => c.url.includes('/api/v1/samples'));
    ok('labeling: samples of the last hour, grouped, blind on the server', sc.length === 1 && /grouped=1/.test(sc[0].url) && /blind=1/.test(sc[0].url));
    ok('labeling: one card per frame with every chip group', sh.querySelectorAll('.cam-f').length === 3 && ['occupancy','visibility','state','certainty'].every(g => !!sh.querySelector('.cam-f [data-g=' + g + ']')));
    ok('blind: neither the app\'s state nor the prediction is shown', !sh.textContent.includes('APPSTATE_LEAK') && !sh.textContent.includes('PRED_LEAK') && !sh.innerHTML.includes('LEAK'));
    await pause(10); await wait(3);
    ok('frame images as blob URLs', [...sh.querySelectorAll('.cam-fi img')].every(i => /^blob:/.test(i.src)) && sh.querySelectorAll('.cam-fi img').length === 3);
    const f = sh.querySelectorAll('.cam-f')[1], chip = (g, v) => f.querySelector(`[data-g=${g}] [data-v=${v}]`);
    ok('save waits for the occupancy', f.querySelector('.cam-save').disabled);
    chip('occupancy', 'occupied').click(); chip('state', 'asleep').click(); chip('certainty', 'probable').click();
    f.querySelector('.cam-save').click(); await pause(5); await wait(5);
    const post = calls.filter(c => c.url.endsWith('/api/labels'));
    const B = post[0] && post[0].body;
    ok('labels: POST with the custom header and the token', post.length === 1 && post[0].method === 'POST' && post[0].headers['x-pets-camera'] === '1' && post[0].headers.Authorization === 'Bearer ' + TOK);
    ok('labels: the blind payload', B && B.image_id === 's:1' && (B.method === 'camera' || B.method === 'retrospective') && B.shown.app_state === false && B.shown.prediction === false && B.labeler === me && /^pets-timers\//.test(B.client) && B.client.length <= 40);
    ok('labels: the chosen values, a correction supersedes the old label', B && B.occupancy === 'occupied' && B.state === 'asleep' && !('posture' in B && B.posture) && B.certainty === 'probable' && !('door' in B) && B.supersedes === 'Lold');
    ok('labels: no app-state field is sent', B && !('app' in B) && !('prediction' in B) && !JSON.stringify(B).includes('LEAK'));
    ok('saved, with an undo', f.textContent.includes('נשמר במאגר המחקר') && !!f.querySelector('.cam-undo'));
    f.querySelector('.cam-undo').click(); await pause(5); await wait(5);
    const rt = calls.filter(c => c.url.endsWith('/api/retract'));
    ok('undo → /api/retract with the saved ids', rt.length === 1 && JSON.stringify(rt[0].body.label_ids) === '["L1","L2","L3"]' && rt[0].headers['x-pets-camera'] === '1' && f.textContent.includes('בוטל'));
    ok('still no token in any URL', calls.every(c => !c.url.includes(TOK)));
    sh.querySelector('#camX').click();
    // SHADOW
    await poll();
    { const a = JSON.parse(before), b = JSON.parse(snap()); ok('shadow: the list, advice, routine, plan and the derived view are byte-identical ' + Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).join(','), snap() === before); }
    ok('shadow: no commit, no push, no write reached the server', commits === 0 && pushes === 0 && WRITE_CALLS === W0 && BLOCKED_CALLS === B0);
    let leak = false; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i), v = localStorage.getItem(k) || ''; if(/blob:|TOK-|c:1|s:1|last_seen/.test(v) || (k !== 'pets-timers-v1-cam' && /cam/.test(k))) leak = true; }
    ok('shadow: no image, response or token in localStorage', !leak);
    // night: no card on the slim screen; on with "להציג הכול"
    FAKE_HOUR = 2; render(); ok('night slim screen: no card', !!$q('.nightc') && !card());
    nightFull = true; render(); ok('night, full screen: the card', !!card()); nightFull = false; FAKE_HOUR = 12;
    pet = 'kochik'; render(); ok('Kochik: no card', !card()); pet = 'kishmish';
    view = 'sum'; render(); ok('summary: no card', !card()); view = 'now'; render();
    // tap counts (ASK_WHEN on): the same with the camera on and off
    const showing = () => bg.classList.contains('show');
    function taps(first){
      let n = 0; const click = el => { n++; el.click(); };
      const b = $q(first); if(!b) return -1; click(b);
      for(let guard = 0; showing() && guard < 8; guard++){
        const nx = sh.querySelector('[data-m="0"]') || sh.querySelector('[data-w=gravel]') || sh.querySelector('[data-w]') || sh.querySelector('[data-q]') || sh.querySelector('#ok');
        if(!nx) break; click(nx);
      }
      return n;
    }
    commit = realCommit; push = realPush;
    const counts = () => { ASK_WHEN = true; const c = {};
      seed(L0.slice(0, 2)); c.pee = taps('#main .card [data-act=pt][data-k=pee]');
      seed(L0.slice(0, 2)); c.crateIn = taps('[data-act=dur][data-k=crate]');
      seed(L0); c.asleep = taps('[data-act=dur][data-k=sleep]');
      ASK_WHEN = false; return JSON.stringify(c); };
    const on = counts(), onLog = logOf('kishmish', 'sleep').length;
    localStorage.removeItem('pets-timers-v1-cam'); const off = counts();
    ok('tap counts for pee / crate / sleep unchanged: ' + on, on === off && !on.includes('-1') && onLog === 1);
    // the app works with the camera unreachable
    localStorage.setItem('pets-timers-v1-cam', BASE); mode = 'fail'; seed(L0.slice(0, 2)); await poll();
    tile('pee').click(); if(showing()) sh.querySelector('[data-w=gravel]').click();
    ok('camera unreachable: logging still works, the card only says so', logOf('kishmish', 'pee').length === 2 && txt().includes('המצלמה לא זמינה'));
    // phones through Tailscale Serve: the https ts.net address is accepted; a network error names Tailscale; 403 stays the allowlist line
    const TS = 'https://mac.tail0test.ts.net', tsCalls = [], prevFetch = window.fetch; let tsMode = 'fail';
    window.fetch = (url, o = {}) => { url = String(url); if(!url.startsWith(TS)) return prevFetch(url, o);
      tsCalls.push({ url, headers: o.headers || {} });
      return tsMode === 'fail' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(res({ schema:'cam-api/1', error:'forbidden' }, 403)); };
    $q('#dsw [data-cam=set]').click(); sh.querySelector('#camIn').value = TS + '/'; sh.querySelector('#camOn').click(); await wait(3);
    ok('a ts.net https address is accepted as the base URL', localStorage.getItem('pets-timers-v1-cam') === TS);
    await poll(); ok('ts.net network error: "המצלמה לא זמינה (Tailscale כבוי?)"', txt().includes('המצלמה לא זמינה (Tailscale כבוי?)') && !txt().includes('Chrome'));
    tsMode = '403'; await poll(); ok('ts.net 403: no card, "החשבון הזה לא מורשה למצלמה" beside the setting', !card() && ($q('#dsw [data-cam=set]').textContent.includes('החשבון הזה לא מורשה למצלמה')));
    ok('ts.net: the Bearer token on every request, never in a URL', tsCalls.length >= 2 && tsCalls.every(c => c.headers.Authorization === 'Bearer ' + TOK && !c.url.includes(TOK)));
    window.fetch = prevFetch;
    // switching off from the sheet
    $q('#dsw [data-cam=set]').click(); sh.querySelector('#camOff').click();
    ok('switched off: no card, key removed', !card() && !localStorage.getItem('pets-timers-v1-cam'));
    mode = 'ok'; CAM_TIMEOUT_MS = 4000; localStorage.setItem('pets-timers-v1-cam', BASE); pet = 'kishmish'; render(); await poll(); render();
    { const log0 = canon(state.log); camLabelView(); await pause(20); await wait(5);
      const evb = sh.querySelectorAll('.cam-ev [data-ev]');
      ok('events: a separate section with the research buttons (crate and door), saying it is not the journal', evb.length === 4 && evb[0].textContent === 'כניסה לכלוב' && evb[1].textContent === 'יציאה מהכלוב' && evb[2].textContent === 'הדלת נסגרה' && evb[3].textContent === 'הדלת נפתחה' && sh.querySelector('.cam-ev').textContent.includes('לא נרשם ביומן'));
      const t0 = Date.now(); evb[0].click(); await pause(10); await wait(3);
      const ev = calls.filter(c => c.url.endsWith('/api/events')).pop();
      ok('one tap: an entry event at the click time, blind, with an idempotency id and the custom header', !!ev && ev.body.kind === 'crate_entry' && Math.abs(ev.body.event_ts - t0) < 2000 && ev.body.time_source === 'click' && ev.body.method === 'camera' && ev.body.blind === true && ev.body.shown.app_state === false && !!ev.body.client_id && ev.headers['x-pets-camera'] === '1' && /^Bearer /.test(ev.headers.Authorization));
      ok('…and the result line offers time correction and undo', sh.querySelector('.cam-evres').textContent.includes('נרשם') && !!sh.querySelector('.cam-evfix') && !!sh.querySelector('.cam-evundo'));
      sh.querySelector('.cam-evfix').click(); const ti = sh.querySelector('.cam-evt'); const d = new Date(t0 - 2*MIN); ti.value = d.toTimeString().slice(0, 8); sh.querySelector('.cam-evok').click(); await pause(10); await wait(3);
      const fx = calls.filter(c => c.url.endsWith('/api/events')).pop();
      ok('time correction: a new record that supersedes the first, time_source manual', fx !== ev && fx.body.supersedes === 'E' + (evN - 1) && fx.body.time_source === 'manual' && Math.abs(fx.body.event_ts - (t0 - 2*MIN)) < 1500);
      sh.querySelector('.cam-evundo').click(); await pause(10); await wait(3);
      const rt = calls.filter(c => c.url.endsWith('/api/events/retract')).pop();
      ok('undo: retract the corrected event', !!rt && JSON.stringify(rt.body.event_ids) === JSON.stringify(['E' + evN]) && sh.querySelector('.cam-evres').textContent.includes('בוטל'));
      sh.querySelector('.cam-seen [data-seen=direct]').click(); sh.querySelectorAll('.cam-ev [data-ev]')[2].click(); await pause(10); await wait(3);
      const dv = calls.filter(c => c.url.endsWith('/api/events')).pop();
      ok('door change: a door_closed event, and "saw it with my eyes" sends method direct', dv.body.kind === 'door_closed' && dv.body.method === 'direct' && dv.body.time_source === 'click');
      sh.querySelector('.cam-seen [data-seen=camera]').click();
      const fr = sh.querySelectorAll('.cam-f')[2]; fr.querySelector('[data-fev=crate_exit]').click(); await pause(10); await wait(3);
      const fe = calls.filter(c => c.url.endsWith('/api/events')).pop();
      ok('on a frame: the frame\'s time with a 30 s window, time_source frame, anchored to the image', fe.body.kind === 'crate_exit' && fe.body.event_ts === SAMPLES[2].capture_ts && fe.body.time_source === 'frame' && fe.body.event_window.from === SAMPLES[2].capture_ts - 30000 && fe.body.anchor_image_id === SAMPLES[2].image_id);
      ok('shadow: research events change nothing in the app\'s list', canon(state.log) === log0);
      close(); }
    // ----- the door, from the service's door timeline -----
    { close(); DOOR = null; await poll(); render(); ok('door: "לא סומן" when no door change is known', txt().includes('דלת: לא סומן'));
      DOOR = { value: 'closed', source: 'change', since: now - 20*MIN }; await poll(); render();
      ok('door: closed since the change, marked by hand (not a camera detection)', txt().includes('דלת סגורה') && txt().includes('מאז') && txt().includes(clock(now - 20*MIN)) && txt().includes('סומן ידנית')); }
    // ----- an image that cannot be shown says so on the card -----
    { const rf = window.fetch; window.fetch = (url, o) => String(url).includes('/img') ? Promise.resolve(new Response(new Blob(['not an image'], { type: 'image/jpeg' }))) : rf(url, o);
      LS.last_seen = { ...LS.last_seen, image_id: 'broken', img: '/img?id=broken' }; CAM.thumb = null; CAM.thumbId = null; await poll(); render();
      ok('a broken image: a short reason on the card instead of a silent blank', txt().includes('התמונה לא נטענה') && !card().querySelector('.cam-th img'));
      window.fetch = rf; }
    window.fetch = realFetch; fb = null;
    // ----- research events: crate entry / exit (owner, 26.11) — never the journal -----
    done();
  } catch(e){ crashed(e); }
})();
