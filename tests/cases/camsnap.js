// @window 520,1000
// Camera snapshots (CAMERA-API §16 + its agreed amendments): camera/snapshot is a fresh full frame, NEVER behavioural
// evidence. The shared card shows the newer of camera/latest (evidence, its own labels) and camera/snapshot (its own
// label, IR badge, calm "not current" after 20 min). "תמונה חדשה" writes camera/snapshot_request {requested_at, by}
// through fb.camReq, once a minute per device, never outside live mode. Fakes `fb.camDoc` / `fb.camGet` / `fb.camReq`
// as camshared.js does. SHADOW: nothing derived from a snapshot. Layout at this width (520); camsnapw.js at 1280.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    reset(); ['pets-timers-v1-cam', 'pets-timers-v1-camb', 'pets-timers-v1-camr'].forEach(k => localStorage.removeItem(k));
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 2*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 4*HOUR, end: now - 3*HOUR }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const NB = 125;   // its decoded size
    const BYTES = (s, n) => ({ toBase64: () => s, toUint8Array: () => ({ length: n == null ? Math.floor(s.length * 3 / 4) : n }) });   // like Firestore Bytes
    const LATEST = (o = {}) => ({ view:'full', w: 800, h: 450, image: BYTES(IMG, NB), image_type:'image/jpeg', bytes: NB, capture_ts: now - 30*MIN, published_at: now - 30*MIN,
      detection:{ status:'positive', confidence: 0.9 }, model_version:'t7', validated:false, experimental:true, sha256_16:'abcdabcdabcdabcd', ...o });
    const SNAP = (o = {}) => ({ schema:'cam-snapshot/1', image: BYTES(IMG, NB), image_type:'image/jpeg', view:'full', w: 800, h: 450, bytes: NB,
      capture_ts: Date.now() - 2*MIN, published_at: Date.now() - 2*MIN + 1000, ir: false, trigger:'periodic', request_ts: 0, sha256_16:'0123456789abcdef', ...o });
    const subs = {}, names = [], reqs = []; let opened = 0, gets = 0, reqRes = () => Promise.resolve();
    fb = { auth:{ currentUser:{ uid:'U1', getIdToken: async () => 'T' } },
      camDoc: (name, onData, onErr) => { opened++; names.push(name); subs[name] = { onData, onErr }; return () => { if(subs[name] && subs[name].onData === onData) delete subs[name]; }; },
      camGet: async name => { gets++; names.push('get:' + name); return name === 'snapshot' ? SNAP({ capture_ts: Date.now() - MIN }) : LATEST(); },
      camReq: data => { reqs.push(JSON.parse(JSON.stringify(data))); return reqRes(); } };
    const W0 = WRITE_CALLS, B0 = BLOCKED_CALLS, log0 = JSON.stringify(state.log);
    let commits = 0, pushes = 0, cjp = 0, renders = 0; const rc = commit, rp = push, rj = camjPaint, rr = render;
    commit = function(){ commits++; return rc.apply(this, arguments); }; push = function(){ pushes++; return rp.apply(this, arguments); };
    camjPaint = function(){ cjp++; return rj.apply(this, arguments); }; render = function(){ renders++; return rr.apply(this, arguments); };
    const card = () => $q('.card.cams'), txt = () => (card() || {}).textContent || '';
    const row = () => $q('#sec-crate .crcam'), ov = () => ($q('#sec-crate .crcam-ov') || {}).textContent || '';
    const rq = () => $q('[data-act=camreq]'), rqt = () => ($q('.camrq-l') || {}).textContent || '';
    const settle = async () => { const el = $q('.camc'); if(el) el.scrollIntoView(); await pause(60); await wait(3); };
    const used = () => (JSON.parse(localStorage.getItem('pets-timers-v1-camb') || 'null') || { bytes: 0 }).bytes;
    const give = async (d, cache = false) => { subs.snapshot.onData(d, cache); await wait(2); };

    pet = 'kishmish'; view = 'now'; render(); await settle();
    ok('listens to camera/snapshot beside latest and status, through the same fb.camDoc', !!subs.snapshot && !!subs.latest && !!subs.status);
    subs.latest.onData(LATEST(), false); subs.status.onData({ checked_at: now - MIN, service:'ok' }, false); await wait(2); render(); await settle();
    ok('before any snapshot: the evidence image with its own words, no request button', txt().includes('נראתה לאחרונה בכלוב') && ov().includes('נראתה') && !rq());

    // a valid snapshot, newer than latest: it is shown, with its own label
    const u0 = used(); const c0 = cjp, r0 = renders;
    await give(SNAP());
    ok('a snapshot does not repaint anything else (no camjPaint, no render)', cjp === c0 && renders === r0);
    render(); await settle();
    const s1 = Date.now() - 2*MIN;
    ok('newer snapshot shown: its label, time and a live "לפני"', !!card() && card().classList.contains('cams-snap') && txt().includes('תמונה עדכנית מהמצלמה') && txt().includes(clock(s1)) && txt().includes('לפני') && !!card().querySelector('[data-words]'));
    ok('on the image: "תמונה עדכנית מהמצלמה · HH:MM · לפני N"', /תמונה עדכנית מהמצלמה · \d\d:\d\d · לפני /.test(ov()));
    ok('a snapshot never says בכלוב, נראתה or anything about detection', !/בכלוב|נראתה|זוהתה|זיהוי|מאומת/.test(txt() + ov()) && !/בכלוב/.test(card().querySelector('img').alt));
    ok('no IR badge in daylight', !$q('#sec-crate .cam-ir'));
    ok('its bytes are counted in the same per-device daily total', used() === u0 + NB + 600);
    await give(SNAP({ capture_ts: Date.now() - MIN }), true);
    ok('a cached snapshot is shown but not counted again', used() === u0 + NB + 600 && txt().includes(clock(Date.now() - MIN)));

    // newer-of-two both ways
    subs.latest.onData(LATEST({ capture_ts: Date.now() - 10*1000 }), false); await wait(2); render(); await settle();
    ok('latest newer than the snapshot: the evidence image and its unchanged labels', !card().classList.contains('cams-snap') && txt().includes('נראתה לאחרונה בכלוב') && ov().includes('נראתה') && !ov().includes('תמונה עדכנית'));
    await give(SNAP({ capture_ts: Date.now() - 2000 })); render(); await settle();
    ok('the snapshot newer again: the snapshot', card().classList.contains('cams-snap') && ov().includes('תמונה עדכנית מהמצלמה'));
    const tie = Date.now() - 5000; subs.latest.onData(LATEST({ capture_ts: tie }), false); await give(SNAP({ capture_ts: tie })); render(); await settle();
    ok('the same capture time: the evidence image', !card().classList.contains('cams-snap'));
    subs.latest.onData(LATEST({ capture_ts: now - 60*MIN }), false); await wait(2);

    // IR badge
    await give(SNAP({ ir: true })); render(); await settle();
    ok('IR: a "ראיית לילה" badge, on the image and in the card', !!$q('#sec-crate .crcam-ov .cam-ir') && ov().includes('ראיית לילה') && txt().includes('ראיית לילה'));
    // stale at 20 minutes
    await give(SNAP({ capture_ts: Date.now() - 19*MIN })); render(); await settle();
    ok('19 minutes: still current', ov().includes('תמונה עדכנית מהמצלמה') && !ov().includes('לא עדכנית'));
    await give(SNAP({ capture_ts: Date.now() - 21*MIN })); render(); await settle();
    ok('21 minutes: calmly "התמונה לא עדכנית (לפני N)", never red', ov().includes('התמונה לא עדכנית (לפני 21 דקות)') && !ov().includes('תמונה עדכנית מהמצלמה') && !$q('#sec-crate .crcam-ov .cam-err') && !txt().includes('בכלוב'));
    await give(SNAP()); render(); await settle();

    // strict validation: anything else is ignored (the evidence image stays)
    const BAD = {
      'an extra field (detection)': SNAP({ detection:{ status:'positive' } }), 'a missing field': (() => { const d = SNAP(); delete d.sha256_16; return d; })(),
      'another schema': SNAP({ schema:'cam-snapshot/2' }), 'not image/jpeg': SNAP({ image_type:'image/png' }), 'a crop, not full': SNAP({ view:'crop' }),
      'a PNG inside': SNAP({ image: BYTES('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 70), bytes: 70 }),
      'malformed base64': SNAP({ image: BYTES('/9j/<img onerror=x>==', 20), bytes: 20 }), 'a plain string image': SNAP({ image: IMG }),
      'bytes ≠ the image': SNAP({ bytes: NB + 1 }), 'over 61440 bytes': SNAP({ image: BYTES(IMG, 61441), bytes: 61441 }),
      'w over 1920': SNAP({ w: 1921 }), 'h not an int': SNAP({ h: 450.5 }), 'ir not a bool': SNAP({ ir: 'yes' }), 'an unknown trigger': SNAP({ trigger:'motion' }),
      'request_ts after published_at': SNAP({ request_ts: Date.now() + HOUR }), 'sha256_16 too short': SNAP({ sha256_16:'abc' }),
      'capture_ts a string': SNAP({ capture_ts: String(Date.now()) }), 'capture_ts far in the future': SNAP({ capture_ts: Date.now() + HOUR, published_at: Date.now() + HOUR }),
      'null (no document)': null };
    const badOk = [];
    for(const [k, d] of Object.entries(BAD)){ await give(d); render(); await settle(); if(!(CAMS.snap === null && !!card() && !card().classList.contains('cams-snap') && txt().includes('נראתה לאחרונה בכלוב'))) badOk.push(k); }
    ok('invalid snapshots are ignored, the evidence image stays: ' + badOk.join(', '), !badOk.length);
    await give(SNAP({ trigger:'on_demand', request_ts: Date.now() - 2*MIN - 5000 }));
    ok('an on-demand snapshot is valid too', !!CAMS.snap && CAMS.snap.trigger === 'on_demand');
    render(); await settle();

    // tap: the sheet in the snapshot's own words
    card().click(); await wait(2);
    ok('tap: the frame large, "תמונה עדכנית מהמצלמה", time with seconds, never בכלוב', bg.classList.contains('show') && !!sh.querySelector('.cam-big') && sh.textContent.includes('תמונה עדכנית מהמצלמה') && !/בכלוב|נראתה/.test(sh.textContent) && sh.textContent.includes('לא נכנס ליומן'));
    close();

    // the request button
    ok('"תמונה חדשה" on the card (the ↻ style), enabled; the plain re-read icon gives way to it', !!rq() && rq().textContent.includes('↻') && rq().textContent.includes('תמונה חדשה') && !rq().disabled && !$q('#sec-crate .crcam-ov [data-act=camrefresh]'));
    const t1 = Date.now(); rq().click(); await wait(3);
    ok('one tap: exactly one write {requested_at, by} with the signed-in uid', reqs.length === 1 && JSON.stringify(Object.keys(reqs[0]).sort()) === '["by","requested_at"]' && reqs[0].by === 'U1' && Number.isInteger(reqs[0].requested_at) && reqs[0].requested_at >= t1 && reqs[0].requested_at <= Date.now());
    const at1 = reqs[0].requested_at;
    ok('pending: "מבקשת תמונה…", the button disabled', rqt().includes('מבקשת תמונה…') && rq().disabled);
    rq().disabled = false; rq().click(); await wait(2); render(); await settle();
    ok('debounced: a second tap within the minute writes nothing', reqs.length === 1 && rq().disabled);
    await give(SNAP({ trigger:'periodic', request_ts: 0 })); render(); await settle();
    ok('a periodic snapshot meanwhile is shown, the request still pending', rqt().includes('מבקשת תמונה…') && CAMS.snap.trigger === 'periodic');
    await give(SNAP({ trigger:'on_demand', request_ts: at1 - 1, published_at: Date.now() }));
    ok('an answer to an older request: still pending', rqt().includes('מבקשת תמונה…'));
    await give(SNAP({ trigger:'on_demand', request_ts: at1, capture_ts: Date.now() - 3000, published_at: Date.now() }));
    ok('answered (request_ts ≥ requested_at): the new frame, normal display, no line (painted without a full render)', !rqt().includes('מבקשת') && !rqt().includes('לא ענתה') && ov().includes(clock(Date.now() - 3000)));
    render(); await settle();
    ok('…still within the minute: the button stays disabled', rq().disabled && reqs.length === 1);
    localStorage.setItem('pets-timers-v1-camr', String(Date.now() - 61000)); render(); await settle();
    ok('after a minute the button is enabled again', !rq().disabled);

    // the timeout (the 60 s wait shortened)
    CAMS_REQ_MS = 150; rq().click(); await wait(2);
    ok('a second request a minute later is written', reqs.length === 2 && reqs[1].requested_at > at1);
    await pause(260); await wait(2);
    ok('no answer in time: "המצלמה לא ענתה, אפשר לנסות שוב", the button enabled again', rqt().includes('המצלמה לא ענתה, אפשר לנסות שוב') && !rq().disabled);
    await give(SNAP({ trigger:'on_demand', request_ts: reqs[1].requested_at, capture_ts: Date.now() - 1000, published_at: Date.now() }));
    ok('a late answer still clears the line', !rqt().includes('לא ענתה'));
    // permission-denied on the write
    reqRes = () => Promise.reject({ code:'permission-denied' }); rq().click(); await wait(4);
    ok('a refused write: quietly "אין הרשאה לבקש תמונה"', reqs.length === 3 && rqt().includes('אין הרשאה לבקש תמונה') && !rqt().includes('מבקשת'));
    await pause(200); await wait(2);
    reqRes = () => Promise.reject({ code:'unavailable' }); rq().click(); await wait(4);
    ok('a failed write: "לא נשלחה", may try again at once', reqs.length === 4 && rqt().includes('הבקשה לא נשלחה') && !rq().disabled);
    reqRes = () => Promise.resolve();
    // preview / sandbox: never written
    for(const m of ['preview', 'sandbox']){
      MODE = m; localStorage.removeItem('pets-timers-v1-camr'); CAMS.req = { at: 0, st: '' }; render(); await settle();
      const n0 = reqs.length; rq().click(); await wait(3);
      ok(m + ': no request written, "בתצוגה מקדימה לא נשלחת בקשה"', reqs.length === n0 && rqt().includes('בתצוגה מקדימה לא נשלחת בקשה') && !localStorage.getItem('pets-timers-v1-camr'));
    }
    MODE = 'live'; CAMS_REQ_MS = 60000; CAMS.req = { at: 0, st: '' }; localStorage.removeItem('pets-timers-v1-camr'); render(); await settle();

    // layout at this width: the crate card's camera row with an IR snapshot and a pending line
    await give(SNAP({ ir: true })); reqRes = () => new Promise(() => {}); rq().click(); await wait(3); render(); await settle(); reqRes = () => Promise.resolve();
    {
      const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const ci = $q('#sec-crate .card.item'), img = $q('#sec-crate .crcam .cam-th'), o = $q('#sec-crate .crcam-ov'), l = $q('#sec-crate .camrq-l');
      const inside = (a, b) => R(a).left >= R(b).left - 1 && R(a).right <= R(b).right + 1 && R(a).top >= R(b).top - 1 && R(a).bottom <= R(b).bottom + 1;
      ok('520: the label on the image stays inside the image', !!o && !!img && inside(o, img) && R(o).height > 0);
      ok('520: the request line is inside the crate card, under the image, not over it', !!l && inside(l, ci) && R(l).top >= R(img).bottom - 1 && over(R(l), R(img)) === 0 && rqt().includes('מבקשת תמונה…'));
      ok('520: nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1 && row().scrollWidth <= row().clientWidth + 1);
      const kids = [...$q('#main').children].filter(x => getComputedStyle(x).display !== 'none' && R(x).height > 0), bad = [];
      for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push((kids[i].id || kids[i].className) + ' × ' + (kids[j].id || kids[j].className));
      ok('520: no two sections overlap ' + bad.join(', '), !bad.length);
    }
    CAMS.req = { at: 0, st: '' }; localStorage.removeItem('pets-timers-v1-camr');

    // SHADOW: nothing is derived from a snapshot (the same moment, with and without it)
    {
      const snapOf = () => JSON.stringify({ log: state.log, V, r: routine('kishmish'), a: advice('kishmish'), al: alertsHTML('kishmish') });
      render(); const withS = snapOf(); const keep = CAMS.snap; CAMS.snap = null; render(); const without = snapOf(); CAMS.snap = keep; render();
      ok('shadow: state.log, V, routine, advice and alerts byte-identical with and without a snapshot', withS === without);
      ok('shadow: no commit, no push, no journal write from snapshot code', JSON.stringify(state.log) === log0 && commits === 0 && pushes === 0 && WRITE_CALLS === W0 && BLOCKED_CALLS === B0);
      ok('the snapshot never reaches the camera journal (camj code does not read it)', !/CAMS\.snap/.test(String(camjPlan) + String(camjApply) + String(camjCamOk) + String(camjOccNow) + String(derive)));
    }

    // the manual refresh after the daily cap reads both, counted; the cap is shared
    CAMS_DAY_BYTES = used() + 10; await give(SNAP({ capture_ts: Date.now() - 30000 })); render(); await settle();
    ok('a snapshot download reaching the shared daily cap stops ALL automatic updates', CAMS.stopped && !subs.latest && !subs.snapshot && !subs.status && txt().includes('עדכון אוטומטי נעצר להיום'));
    ok('…and the request button is hidden (no listener to receive an answer); the cap refresh stays', !rq() && !!$q('#sec-crate [data-act=camrefresh]'));
    const g0 = gets; $q('#sec-crate [data-act=camrefresh]').click(); await pause(10); await wait(4);
    ok('manual refresh: latest and snapshot read once each, counted, never re-listening', gets === g0 + 2 && names.slice(-2).join() === 'get:latest,get:snapshot' && !subs.snapshot);
    CAMS_DAY_BYTES = 12e6; CAMS.stopped = false; localStorage.removeItem('pets-timers-v1-camb'); render(); await settle();
    ok('under the cap again: listening resumes', !!subs.snapshot && !!subs.latest);

    // permission-denied on read (the rule is not live yet): silently no snapshot, the evidence card stays
    subs.snapshot.onErr({ code:'permission-denied' }); await wait(2); render(); await settle();
    const o1 = opened; render(); await settle();
    ok('snapshot read refused: no snapshot, no request button, latest still listened, no retry', CAMS.snapDenied && !subs.snapshot && !!subs.latest && !!card() && !card().classList.contains('cams-snap') && !rq() && opened === o1 && !/אין הרשאה|שגיאה/.test(txt()));
    CAMS.snapDenied = false; render(); await settle();
    // a passing error: retried after a minute, the latest listener untouched
    subs.snapshot.onErr({ code:'unavailable' }); await wait(2); render(); await settle();
    ok('a network error on the snapshot: waits a minute, latest untouched', !subs.snapshot && !!subs.latest);
    CAMS.snapRetry = 0; render(); await settle(); ok('…then listens again', !!subs.snapshot);
    await give(SNAP()); render(); await settle();

    // the owner's private service wins on her device
    localStorage.setItem('pets-timers-v1-cam', 'http://127.0.0.1:8787'); CAM.st = 'ok'; render(); await settle();
    ok('private service answering: the private card, no shared card, no request button', !card() && $n('.card.camc') === 1 && !rq());
    CAMS_IDLE_MS = 20; pet = 'kochik'; render(); await settle(); await pause(60); await wait(2);
    pet = 'kishmish'; render(); await settle();
    ok('…and no snapshot listener is opened there (no wasted bytes)', !subs.snapshot && !!subs.latest);
    CAM.st = 'off'; localStorage.removeItem('pets-timers-v1-cam'); render(); await settle(); await settle();
    ok('private address gone: the snapshot listener again', !!subs.snapshot);
    await give(SNAP()); render(); await settle();

    // where it shows
    pet = 'kochik'; render(); ok('not for Kochik', !$q('.camc') && !rq()); pet = 'kishmish';
    FAKE_HOUR = 2; render(); ok('not on the slim night screen', !!$q('.nightc') && !$q('.camc') && !rq());
    nightFull = true; render(); ok('night with "להציג הכול": the snapshot card', !!card() && card().classList.contains('cams-snap') && !!rq()); nightFull = false; FAKE_HOUR = 12;
    SIMPLE = true; render(); ok('not on מסך יונתן', !!$q('.smp-h') && !$q('.camc') && !rq()); SIMPLE = false; render();

    ok('shadow at the end: the list unchanged, no commit / push / journal write', JSON.stringify(state.log) === log0 && commits === 0 && pushes === 0 && WRITE_CALLS === W0 && BLOCKED_CALLS === B0);
    commit = rc; push = rp; camjPaint = rj; render = rr; CAMS_IDLE_MS = 60000;
    CAMS.snap = null; CAMS.doc = null; CAMS.status = null; CAMS.denied = false; CAMS.snapDenied = false; camsUnsub(); fb = null;
    done();
  } catch(e){ crashed(e); }
})();
