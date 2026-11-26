// Shared camera card (owner, 26.11): every caregiver sees the latest cropped crate image from Firestore camera/latest,
// with no setting and no Tailscale. A fake `fb.camDoc` stands in for Firestore. Checks: only while on screen, a
// separate listener (never the journal's), the per-device daily byte cap, refused/invalid documents show nothing,
// freshness, the enlarged view, the owner's local service still wins on her device, and SHADOW (nothing written).
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    reset(); localStorage.removeItem('pets-timers-v1-cam'); localStorage.removeItem('pets-timers-v1-camb');
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 2*HOUR }, { ...K0, k:'crate', t: now - 40*MIN }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const BYTES = s => ({ toBase64: () => s, toUint8Array: () => ({ length: Math.floor(s.length * 3 / 4) }) });   // like Firestore Bytes
    const DOC = (o = {}) => ({ view:'full', w: 800, h: 450, image: BYTES(IMG), image_type:'image/jpeg', bytes: 120, capture_ts: now - 6*MIN, published_at: now - 6*MIN,
      detection:{ status:'positive', confidence: 0.9 }, model_version:'t7', validated:false, experimental:true, sha256_16:'abc', ...o });
    const subs = {}, names = []; let opened = 0, closed = 0, gets = 0;
    fb = { auth:{ currentUser:{ getIdToken: async () => 'T' } },
      camDoc: (name, onData, onErr) => { opened++; names.push(name); subs[name] = { onData, onErr }; return () => { closed++; delete subs[name]; }; },
      camGet: async name => { gets++; names.push('get:' + name); return DOC({ capture_ts: now - MIN }); } };
    const W0 = WRITE_CALLS, B0 = BLOCKED_CALLS, log0 = JSON.stringify(state.log);
    let commits = 0, pushes = 0; const rc = commit, rp = push;
    commit = function(){ commits++; return rc.apply(this, arguments); }; push = function(){ pushes++; return rp.apply(this, arguments); };
    const card = () => $q('.card.cams'), txt = () => (card() || {}).textContent || '';
    const settle = async () => { const el = $q('.camc'); if(el) el.scrollIntoView(); await pause(60); await wait(3); };   // the card lives in the crate card now: listening starts when it is on screen

    pet = 'kishmish'; render(); await settle();
    ok('no setting needed: Kishmish\'s screen watches the shared slot and listens while it is on screen', !!$q('.cams-slot') && !!subs.latest && !!subs.status);
    ok('nothing published yet: no card at all', !card());
    ok('its own listeners: only camera documents (latest, status, and the events for the journal) — never the journal\'s', names.every(n => ['latest', 'status', 'events', 'feedback'].includes(n)));

    subs.latest.onData(DOC(), false); subs.status.onData({ checked_at: now - 2*MIN, service:'ok' }, false); await wait(2);
    ok('the image, automatically: a data URL of the full frame, large, in its own 16:9 shape', !!card() && /^data:image\/jpeg;base64,/.test(card().querySelector('.cam-th img').src) && /800\s*\/\s*450/.test(card().querySelector('.cam-th').style.aspectRatio));
    ok('capture time, "לפני", experimental and unverified', txt().includes(clock(now - 6*MIN)) && txt().includes('לפני') && txt().includes('ניסיוני · לא מאומת') && txt().includes('נראתה לאחרונה בכלוב'));
    ok('freshness: the camera is looking', txt().includes('המצלמה פעילה'));
    const used = JSON.parse(localStorage.getItem('pets-timers-v1-camb'));
    ok('bytes from the server are counted per device per day', used && used.bytes >= Math.floor(IMG.length*3/4) && used.day === new Date().toDateString());

    subs.latest.onData(DOC({ capture_ts: now - 3*MIN }), true); await wait(2);
    ok('a cached copy (offline) shows but is not counted again', JSON.parse(localStorage.getItem('pets-timers-v1-camb')).bytes === used.bytes && txt().includes(clock(now - 3*MIN)));

    subs.status.onData({ checked_at: now - 50*MIN, service:'ok' }, false); await wait(2);
    ok('stale camera: says since when, the last image stays', txt().includes('אין עדכון מהמצלמה מאז') && !!card().querySelector('img'));

    subs.latest.onData(DOC({ detection:{ status:'uncertain' } }), false); await wait(2);
    ok('not a positive detection: nothing shown', !card());
    subs.latest.onData(DOC({ image: BYTES('not base64 <script>') }), false); await wait(2);
    ok('a malformed image: nothing shown', !card());
    subs.latest.onData(DOC({ image_type: 'text/html' }), false); await wait(2);
    ok('a wrong type: nothing shown', !card());
    subs.latest.onData(DOC(), false); await wait(2);

    card().click(); await wait(2);
    ok('tap: the crop enlarged, time with seconds, model version behind "איך זה מחושב"; no labeling here', bg.classList.contains('show') && !!sh.querySelector('.cam-big')
      && sh.textContent.includes('t7') && !sh.querySelector('#camLbl') && sh.textContent.includes('לא נכנס ליומן'));
    close();

    // off screen: stops listening after the idle delay (no re-download when scrolling past)
    CAMS_IDLE_MS = 30; const c0 = closed;
    pet = 'kochik'; render(); await settle();
    ok('Kochik\'s screen: no card, the listener closes', !card() && closed >= c0 + 2 && !subs.latest);
    pet = 'kishmish'; render(); await settle();
    ok('back on Kishmish: it listens again, and the last image is there at once', !!subs.latest && !!card());

    // the daily cap
    CAMS_DAY_BYTES = JSON.parse(localStorage.getItem('pets-timers-v1-camb')).bytes + IMG.length;
    subs.latest.onData(DOC({ capture_ts: now - 2*MIN }), false); await wait(2);
    ok('daily cap reached: automatic updates stop, said calmly, with a manual refresh', !subs.latest && txt().includes('עדכון אוטומטי נעצר להיום') && !!card().querySelector('[data-cams=refresh]'));
    card().querySelector('[data-cams=refresh]').click(); await pause(10); await wait(3);
    ok('manual refresh: one read, counted, card updated, no sheet opened', gets === 1 && txt().includes(clock(now - MIN)) && !bg.classList.contains('show'));
    render(); await settle();
    ok('…and it does not start listening again today', !subs.latest);
    CAMS_HARD_BYTES = 0; render(); await settle();
    ok('past the hard cap: no refresh button', !!card() && !card().querySelector('[data-cams=refresh]'));
    CAMS_DAY_BYTES = 12e6; CAMS_HARD_BYTES = 20e6; CAMS.stopped = false; localStorage.removeItem('pets-timers-v1-camb');

    // the owner's local service on this device wins (full frame + labeling stay private there)
    localStorage.setItem('pets-timers-v1-cam', 'http://127.0.0.1:8787'); CAM.st = 'down'; render(); await settle();
    ok('a private address set but not reachable (iPhone, Tailscale off): the SHARED card still shows', !!card());
    CAM.st = 'ok'; render(); await settle();
    ok('private service answering on this device: the private card instead, never both', !card() && $n('.card.camc') === 1);
    CAM.st = 'off';
    localStorage.removeItem('pets-timers-v1-cam'); render(); await settle();

    // a passing error (network): no tight retry loop; it waits a minute
    { const o0 = opened; subs.latest.onErr({ code:'unavailable' }); await wait(2); render(); await settle(); render(); await settle();
      ok('a network error: no resubscribe for a minute, the last image stays', opened === o0 && !!card());
      CAMS.retryAt = 0; render(); await settle(); ok('…then it listens again', opened > o0 && !!subs.latest); }
    // refused by the rules (not a caregiver): nothing, and no retry
    subs.latest.onErr({ code:'permission-denied' }); await wait(2); const o1 = opened; render(); await settle();
    ok('permission denied: no card, no slot, no new listener', !card() && !$q('.cams') && opened === o1);

    ok('shadow: the list unchanged, no commit, no push, no write', JSON.stringify(state.log) === log0 && commits === 0 && pushes === 0 && WRITE_CALLS === W0 && BLOCKED_CALLS === B0);
    CAMS.denied = false; fb = null;
    done();
  } catch(e){ crashed(e); }
})();
