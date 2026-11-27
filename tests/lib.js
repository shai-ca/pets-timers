// Shared helpers for the test cases. A case ends by calling done().
const T = { out: [] };
function ok(name, cond){ T.out.push((cond ? 'PASS ' : 'FAIL ') + name); }
function done(extra){ const sk = T.out.some(x => x.startsWith('PASS skipped (')); document.title = (T.out.filter(x => !x.startsWith('PASS')).join(' | ') || 'ALL PASS ' + T.out.length + (sk ? ' SKIPPED' : '')) + (extra ? ' :: ' + extra : ''); }   // a skip is reported, never a silent pass
function crashed(e){ T.out.push('ERROR ' + String((e && e.stack) || JSON.stringify(e)).replace(/\s+/g, ' ').slice(0, 400)); done(); }
// Lets pending promise work (a save in flight, a merge) run. Microtasks only, so thousands of them are instant.
const wait = async (n = 1) => { for(let i = 0; i < n * 60; i++) await null; };
const $q = s => document.querySelector(s), $n = s => document.querySelectorAll(s).length;
const MIN = 60000, HOUR = 3600000;
// What the tiles read: the derived view (`V`), or the stored pet object in versions before it existed.
const tiles = p => (typeof V !== 'undefined' ? V[p] : state[p]);
function use(s, b){ state = s; if(b !== undefined) base = b; if(typeof setState === 'function') setState(s); }
function reset(who = 'shai', showPet = 'kishmish'){
  if(typeof FOLD !== 'undefined'){ FOLD.clear(); if(!window.KEEP_FOLDS) ['crate','potty','play','food','rest','bath','notes','hist','cycle','pottyd'].forEach(f => FOLD.add(f)); }   // behaviour tests see every section open; tests/cases/hierarchy.js checks the real closed default
  localStorage.clear(); try { localStorage.setItem(LS_KEY + '-salvaged', '1'); } catch(e){}
  use(blank(), blank()); me = who; pet = showPet; view = 'now'; sumFilter = null;
  if(typeof ASK_WHEN !== 'undefined') ASK_WHEN = false;   // cases tap buttons and expect the entry at once; when.js tests the prompt
  if(typeof FAKE_HOUR !== 'undefined'){ FAKE_HOUR = window.TEST_HOUR ?? 12; FAKE_PHONE = window.TEST_PHONE ?? false; nightFull = false; }   // a case's own "// @hour" / "// @phone" win over the defaults; never overridden silently   // night.js and routine.js test the night screen and the phone layout
  if(typeof FAKE_TODAY !== 'undefined') FAKE_TODAY = null;
  if(typeof awakeUntil !== 'undefined') awakeUntil = 0;
  if(typeof stillUntil !== 'undefined') stillUntil = 0;
  if(typeof RETRY2_FROM !== 'undefined') RETRY2_FROM = -Infinity;   // the two-hour rule everywhere; retry.js also checks entries from before it
  if(typeof RETRY3_FROM !== 'undefined') RETRY3_FROM = Infinity;   // …not yet her own rhythm (25.11); rhythm.js moves it
  if(typeof CRATE_TREAT_FROM !== 'undefined') CRATE_TREAT_FROM = Infinity;   // no treat delay in the crate (25.11); sleepcrate.js moves it
  if(typeof SLEEP2_FROM !== 'undefined') SLEEP2_FROM = Infinity;   // cases are written against the closed-box rules; crate2.js and sleep2.js move the cut-off
  if(typeof SIMPLE !== 'undefined') SIMPLE = false;   // the full screen; simple.js switches "מסך יונתן" on
  if(typeof DUP_MS !== 'undefined') DUP_MS = 0;   // most cases tap the same button repeatedly on purpose; extras.js tests the guard
  close(); renderMe(); document.getElementById('toast').classList.remove('show'); render();
}
// A fake server shared by simulated phones. Keys come back in a different order, like Firestore.
function fakeServer(doc){
  const shuffle = o => Array.isArray(o) ? o.map(shuffle) : (o && typeof o === 'object') ? Object.keys(o).sort().reverse().reduce((a, k) => (a[k] = shuffle(o[k]), a), {}) : o;
  const S = { doc, writes: 0, fail: false, read: () => shuffle(clone(S.doc)) };
  ref = { merge: async fn => { await null; if(S.fail) throw { code: 'unavailable' }; S.doc = clone(fn(S.read(), true)); S.writes++; return S.doc; },
          fresh: async () => { onServer(S.read()); } };
  return S;
}
function rng(seed){ let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
// Put a list of entries in place as if it had been loaded and synced.
function seed(list){ const s = norm({ v: 2, log: list }); use(s, clone(s)); render(); return s; }
const K = () => tiles('kishmish'), KO = () => tiles('kochik');
const logOf = (p, k) => state.log.filter(e => e.p === p && (!k || e.k === k));
const tile = k => $q('.card [data-act=pt][data-k=' + k + ']');
const midnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

// A times-only replica of Kishmish's real list from 26.11 06:05 to 27.11 06:30 (owner's data, 27.11: no names, no `by`,
// no notes, no camera ids; camera-timed sleeps kept as plain sleeps; the app's estimate in the 18:18–01:07 stay given as
// an "התעוררה on an estimate" entry, 22:22–01:07). [kind, minutes from 06:30 today, end or null, extra fields].
// The night: out of the crate 01:07, pee 01:07 / poop 01:11, pee 04:44, gravel 06:19, "לא עשתה" 06:21, crate 06:21 —
// nothing else. Tests pin "// @clock 06:30".
function morning2711(){
  const N = midnight() + 390*MIN, R = [
  ['gravel', -1455, -1451, 0],
  ['poop', -1454, null, {'w': 'gravel', 'q': 'ok'}],
  ['pee', -1451, null, {'w': 'gravel'}],
  ['play', -1449, null, {'y': 'rope'}],
  ['food', -1431, null, 0],
  ['water', -1431, null, 0],
  ['gravel', -1429, -1426, 0],
  ['none', -1426, null, 0],
  ['crate', -1420, -1311, {'c': 'mesh'}],
  ['sleep', -1420, -1311, 0],
  ['gravel', -1311, -1307, 0],
  ['pee', -1310, null, {'w': 'gravel'}],
  ['food', -1299, null, 0],
  ['water', -1298, null, 0],
  ['gravel', -1295, -1290, 0],
  ['none', -1290, null, 0],
  ['carrier', -1285, -1245, 0],
  ['water', -1237, null, 0],
  ['gravel', -1237, -1226, 0],
  ['pee', -1235, null, {'w': 'gravel'}],
  ['crate', -1225, -1106, {'c': 'mesh'}],
  ['sleep', -1220, -1109, {'a': 1}],
  ['gravel', -1106, -1103, 0],
  ['none', -1103, null, 0],
  ['crate', -1103, -1090, {'c': 'mesh'}],
  ['gravel', -1090, -1085, 0],
  ['crate', -1085, -1065, {'c': 'mesh'}],
  ['gravel', -1065, -1057, 0],
  ['food', -1065, null, 0],
  ['water', -1065, null, 0],
  ['pee', -1063, null, {'w': 'gravel'}],
  ['water', -1057, null, 0],
  ['gravel', -1037, -1024, 0],
  ['pee', -1031, null, {'w': 'gravel'}],
  ['crate', -1030, -959, {'c': 'mesh'}],
  ['sleep', -1029, -1005, 0],
  ['sleep', -998, -991, 0],
  ['sleep', -988, -959, 0],
  ['gravel', -958, -957, 0],
  ['none', -957, null, 0],
  ['food', -927, null, 0],
  ['gravel', -926, -919, 0],
  ['pee', -926, null, {'w': 'gravel'}],
  ['gravel', -906, -900, 0],
  ['sleep', -888, -872, 0],
  ['gravel', -854, -853, 0],
  ['pee', -854, null, 0],
  ['sleep', -843, -801, 0],
  ['gravel', -796, -793, 0],
  ['none', -793, null, 0],
  ['gravel', -758, -752, 0],
  ['pee', -756, null, {'w': 'gravel'}],
  ['poop', -754, null, {'w': 'gravel', 'q': 'ok'}],
  ['play', -750, null, {'y': 'rope'}],
  ['food', -745, null, 0],
  ['play', -740, null, {'y': 'rope'}],
  ['crate', -731, -711, {'c': 'mesh'}],
  ['crate', -731, -323, {'c': 'mesh'}],
  ['gravel', -711, -709, 0],
  ['pee', -710, null, {'w': 'gravel'}],
  ['crate', -703, -641, {'c': 'mesh'}],
  ['sleep', -692, -641, 0],
  ['cset', -682, null, {'door': 'open'}],
  ['cset', -682, null, {'cover': 'uncovered'}],
  ['gravel', -641, -640, 0],
  ['pee', -640, null, {'w': 'gravel'}],
  ['water', -623, null, 0],
  ['gravel', -621, -615, 0],
  ['pee', -620, null, {'w': 'gravel'}],
  ['food', -609, null, 0],
  ['water', -609, null, 0],
  ['food', -605, null, 0],
  ['crate', -600, -515, {'c': 'mesh'}],
  ['sleep', -597, -515, 0],
  ['cset', -594, null, {'door': 'closed'}],
  ['gravel', -515, -513, 0],
  ['none', -513, null, {'x': 1}],
  ['gravel', -323, -318, 0],
  ['pee', -322, null, {'w': 'gravel'}],
  ['poop', -319, null, {'w': 'gravel', 'q': 'soft'}],
  ['gravel', -106, -105, 0],
  ['pee', -105, null, {'w': 'gravel'}],
  ['gravel', -10, -8, 0],
  ['none', -8, null, {'x': 1}],
  ['crate', -8, null, {'c': 'mesh'}],
  ['sleep', -488, -323, {'a': 1}]];
  return R.map(([k, t, end, x], i) => ({ id: 'm27-' + i, p: 'kishmish', k, t: N + t*MIN, ...(end != null ? { end: N + end*MIN } : {}), ...(x || {}) }));
}

// §17 clip evidence (camclip.js at 520, camclipw.js at 1280): one shared scenario with a fake private service.
const CLIP_MP4_B64 = 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAM4bW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAmN0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAEAAAAAkAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPoAAAAAAABAAAAAAHbbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAKABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABhm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAUZzdGJsAAAAunN0c2QAAAAAAAAAAQAAAKphdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAEAAJABIAAAASAAAAAAAAAABFExhdmM2My4xLjEwMiBsaWJ4MjY0AAAAAAAAAAAAAAAAGP//AAAAMGF2Y0MBQsAK/+EAGGdCwArZBH+fARAAAAMAEAAAAwCg8SJkgAEABWjLg8sgAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAFegAAAAAAAAAGHN0dHMAAAAAAAAAAQAAAAUAAAgAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAUAAAABAAAAKHN0c3oAAAAAAAAAAAAAAAUAAAKVAAAACgAAAAoAAAAKAAAACgAAABRzdGNvAAAAAAAAAAEAAANoAAAAYXVkdGEAAABZbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAsaWxzdAAAACSpdG9vAAAAHGRhdGEAAAABAAAAAExhdmY2My4xLjEwMgAAAAhmcmVlAAACxW1kYXQAAAJwBgX//2zcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTY1IHIzMjIyIGIzNTYwNWEgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDI1IC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MCByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgxOjB4MTExIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj01IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAHWWIhAR8RigACDxHAAEZmOAAIs0nJyddddddddeAAAAABkGaOAj42AAAAAZBmlQCPjYAAAAGQZpgEPGwAAAABkGagD/GwA==';   // a 1 s, 64x36 H.264 baseline MP4 (+faststart), made with ffmpeg from a solid colour
async function camClipSuite(){
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const BASE = 'http://127.0.0.1:8787', TOK = 'TOK-CLIP-SECRET-9', K0 = { p:'kishmish' }, subs = {}, merged = [];
  window.KEEP_FOLDS = true; reset(); ['pets-timers-v1-cam', 'pets-timers-v1-camb', 'pets-timers-v1-camr'].forEach(k => localStorage.removeItem(k));
  const FEAT0 = CAM_FEATURES; CAM_FEATURES = { sleepSuggest: true, eatSuggest: true, drinkSuggest: true, irContext: true, liveSleepEstimate: true, foodWaterEvents: true };
  const mp4 = Uint8Array.from(atob(CLIP_MP4_B64), c => c.charCodeAt(0));
  const T = Date.now();
  // ----- the fake private service: last_seen, images, and /api/clip with a mode per request -----
  const calls = []; let clipMode = 'ok', gate = null;
  const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
  const realFetch = window.fetch;
  window.fetch = (url, o = {}) => {
    url = String(url); if(!url.startsWith(BASE)) return realFetch(url, o);
    const u = new URL(url); calls.push({ url, path: u.pathname, q: u.searchParams, headers: o.headers || {} });
    if(u.pathname === '/api/last_seen') return Promise.resolve(json({ schema: 'cam-api/1', last_seen: null, detector: { available: true }, latest: { capture_ts: Date.now() - 20000 } }));
    if(u.pathname === '/img') return Promise.resolve(new Response(new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#b85"/></svg>'], { type: 'image/svg+xml' })));
    if(u.pathname !== '/api/clip') return Promise.resolve(json({ error: 'not found' }, 404));
    const t = +u.searchParams.get('t');
    const go = () => {
      if(clipMode === 'net') return Promise.reject(new TypeError('Failed to fetch'));
      if(clipMode === 'garbage') return Promise.resolve(new Response(new Blob([new Uint8Array(4096).fill(7)], { type: 'video/mp4' }), { headers: { 'content-type': 'video/mp4', 'x-clip-start': String(t - 3000), 'x-clip-end': String(t + 9000) } }));
      const st = { no_footage: 404, expired: 410, forbidden: 403, busy: 503, auth: 401 }[clipMode];
      if(st) return Promise.resolve(json({ schema: 'cam-api/1', error: clipMode }, st));
      return Promise.resolve(new Response(new Blob([mp4], { type: 'video/mp4' }), { headers: { 'content-type': 'video/mp4', 'content-length': String(mp4.length), 'x-clip-start': String(t - 3000), 'x-clip-end': String(t + 9000) } }));   // ACTUAL footage: 3 s before, 9 s after (not the requested 8 / 12)
    };
    const abortable = pr => o.signal ? new Promise((res, no) => { if(o.signal.aborted) return no(new DOMException('aborted', 'AbortError')); o.signal.addEventListener('abort', () => no(new DOMException('aborted', 'AbortError'))); pr.then(res, no); }) : pr;
    if(gate){ const g = gate; return abortable(new Promise(r => g.push(() => r(go())))); }
    return abortable(go());
  };
  const clipCalls = () => calls.filter(c => c.path === '/api/clip');
  const revoked = [], realRevoke = URL.revokeObjectURL; URL.revokeObjectURL = u => { revoked.push(u); return realRevoke.call(URL, u); };
  let commits = 0, pushes = 0; const rc = commit, rp = push;
  commit = function(){ commits++; return rc.apply(this, arguments); }; push = function(){ pushes++; return rp.apply(this, arguments); };
  // ----- the camera's events: a pending crate entry (with an image), a food detection (image), a drink (no image), a sleep suggestion, an 8-day-old exit -----
  const E = (id, kind, ts, o = {}) => ({ event_id: id, kind, ts, lo: ts - 30000, hi: ts + 30000, source: 'live_model', confidence: .8, status: 'active', created_at: T, model_version: 't', ...o });
  const tE = T - 20*MIN, tF = T - 12*MIN, tW = T - 9*MIN, tS = T - 90*MIN;
  const EVS = [E('ce_e1', 'crate_entry', tE, { image_id: 'fe', image_ts: tE }), E('ce_f1', 'food_seen', tF, { image_id: 'ff', image_ts: tF }), E('ce_w1', 'water_seen', tW),
    E('ce_s1', 'sleep_onset', tS, { sug: true })];
  seed([{ ...K0, k:'pee', t: T - 2*HOUR, w:'gravel' }, { ...K0, k:'food', t: T - 5*HOUR, m:'meal' }]); serverSeen = true; pet = 'kishmish'; view = 'now';
  localStorage.setItem('pets-timers-v1-cam', BASE);
  fb = { auth: { currentUser: { uid: 'U1', getIdToken: async () => TOK } }, camDoc: (n, on) => { subs[n] = on; return () => { delete subs[n]; }; }, camGet: async () => null, camMerge: async (n, d) => { merged.push([n, d]); } };
  CAMJ.fbLocal = {}; CAMJ.imgs = {}; render(); await wait(2);
  await camPoll(); await wait(3);
  const card = () => $q('#sec-crate .camjt'), food = () => $q('.camjf[data-feed=food]'), water = () => $q('.camjf[data-feed=water]');
  const send = async () => { if(subs.events) subs.events({ schema: 'cam-events/1', events: EVS, coverage: [{ from: T - 30*HOUR, to: Date.now() }], door_spans: [], published_at: T, updated_at: T }, false); await wait(3); render(); await wait(3); };
  await send(); for(let i = 0; i < 20 && !(card() && card().querySelector('img.camj-img') && food() && food().querySelector('img.camj-img')); i++){ await pause(50); await wait(3); render(); await wait(3); }
  const D = window.CLIP_DESIGN = V2 ? 'v2' : 'v1';
  ok(D + ': the private service answers on this device', camPriv() && !!clipSource() && clipSource().id === 'private');
  const snapS = () => JSON.stringify({ log: state.log, dec: CAMJ.fbLocal, m: merged.length, w: WRITE_CALLS, b: BLOCKED_CALLS, c: commits, p: pushes, ls: localStorage.getItem(LS_DATA) });
  const S0 = snapS();
  // 1. the affordance, only where a clip can exist; nothing fetched before a tap
  ok('the crate entry card: the image as thumbnail with a play button (cam1, at the camera time)', !!card() && !!card().querySelector('.cjv img.camj-img') && !!card().querySelector(`.cjv [data-clip="cam1:${tE}"]`));
  ok('the food card: a play button on its image (cam2)', !!food() && !!food().querySelector(`.cjv [data-clip="cam2:${tF}"]`));
  ok('the drink (no image): a plain "סרטון מהמצלמה" button (cam2)', !!water() && !!water().querySelector(`[data-clip="cam2:${tW}"]`) && water().textContent.includes('סרטון מהמצלמה') && !water().querySelector('.cjv'));
  ok('the sleep suggestion: no clip affordance (not a listed event type)', !!$q('.camjs') && !$q('.camjs [data-clip]'));
  ok('event kinds: crate entry / exit -> cam1, food / water -> cam2, nothing else; older than 7 days -> none', clipFor(EVS[0]).cam === 'cam1' && clipFor(E('x', 'crate_exit', T - MIN)).cam === 'cam1' && clipFor(EVS[1]).cam === 'cam2' && clipFor(EVS[2]).cam === 'cam2'
    && !clipFor(EVS[3]) && !clipFor(E('x', 'sleep_wake', T)) && !clipFor(E('x', 'crate_exit', T - 8*24*HOUR)) && !/data-clip/.test(camjClipHTML(E('x', 'crate_entry', T - 8*24*HOUR))));
  { const ask = camjDoorAsk; camjDoorAsk = () => EVS[0]; const h = camjDoorAskHTML('kishmish'); camjDoorAsk = ask;
    ok('the door question ("הדלת?") carries the same cam1 clip', h.includes(`data-clip="cam1:${tE}"`)); }
  ok('no clip request, no <video> before a tap (images only, as before)', clipCalls().length === 0 && !$q('video') && calls.some(c => c.path === '/img'));
  render(); await pause(80); await wait(3); render(); await wait(3);
  ok('…and none after repaints either (no prefetch)', clipCalls().length === 0 && !$q('video'));
  // 2. tap: loading, then the player with the ACTUAL footage times
  gate = [];
  card().querySelector('[data-clip]').click(); await wait(4);
  ok('tap: "טוען סרטון…" over the thumbnail, the answers still there', !!card() && card().textContent.includes('טוען סרטון…') && card().querySelectorAll('[data-camans]').length === 4);
  ok('one request: /api/clip?cam=cam1&t=<camera time>&before=8&after=12', clipCalls().length === 1 && clipCalls()[0].q.get('cam') === 'cam1' && +clipCalls()[0].q.get('t') === tE && clipCalls()[0].q.get('before') === '8' && clipCalls()[0].q.get('after') === '12');
  ok('the Bearer token in the header, no token in any URL', clipCalls().every(c => c.headers.Authorization === 'Bearer ' + TOK) && calls.every(c => !c.url.includes(TOK) && !/token=/i.test(c.url)));
  const g0 = gate; gate = null; g0.forEach(f => f()); await pause(30); await wait(6);
  const v = () => $q('video');
  ok('the player: one <video>, a blob URL, controls, playsinline, preload none, no autoplay', document.querySelectorAll('video').length === 1 && /^blob:/.test(v().src) && v().controls && v().playsInline && v().hasAttribute('playsinline') && v().preload === 'none' && !v().autoplay && !v().hasAttribute('autoplay'));
  ok('…inside the crate card\'s own question', !!v().closest('#sec-crate .camjt') && v().closest('.camjt') === card());
  const when = card().querySelector('.cjv-when').textContent;
  ok('the ACTUAL footage times with seconds (start / end the service returned), not the requested window: ' + when, when.includes(clipClock(tE - 3000) + '–' + clipClock(tE + 9000)) && !when.includes(clipClock(tE - 8000)) && /שוב/.test(when) && /מסך מלא/.test(when) && /סגירה/.test(when));
  // (real decoding is checked outside the virtual clock: tests/../ real-playback smoke, see the report)
  // 3. layout: the answers stay visible beside / under the player, nothing overlaps, nothing overflows
  { const R = e => e.getBoundingClientRect(), box = card().querySelector('.cjv-box'), btns = [...card().querySelectorAll('.rt-a button')];
    const over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    ok(`layout ${innerWidth}px: the player has real size`, R(box).width > 150 && R(v()).height > 60);
    ok('…all four answers visible, none under the player', btns.length === 4 && btns.every(b => R(b).width > 20 && R(b).height > 20 && getComputedStyle(b).visibility !== 'hidden' && over(R(b), R(box)) === 0));
    ok('…the answers are inside the screen width, nothing overflows sideways', btns.every(b => R(b).left >= -1 && R(b).right <= innerWidth + 1) && document.documentElement.scrollWidth <= innerWidth + 1 && R(box).right <= innerWidth + 1);
    ok('…the player stays inside its card (no overflow past the question\'s edge)', R(box).left >= R(card()).left - 1 && R(box).right <= R(card()).right + 1 && R(v()).left >= R(card()).left - 1);
    const kids = [...$q('#sec-crate .card.item').children].filter(x => R(x).height > 0), bad = [];
    for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push(kids[i].className + ' × ' + kids[j].className);
    ok('…nothing inside the crate card overlaps ' + bad.join(', '), !bad.length); }
  // 4. a repaint keeps the same player (it does not restart); a second clip replaces it, revoking the first blob
  const el1 = v(), url1 = el1.src; render(); await wait(3); render(); await wait(3);
  ok('repaints: the same <video> element, still in its card, same blob', v() === el1 && v().src === url1 && !!v().closest('#sec-crate .camjt') && clipCalls().length === 1);
  food().querySelector('[data-clip]').click(); await pause(30); await wait(6);
  ok('another clip: one player on the page, the first blob revoked', document.querySelectorAll('video').length === 1 && revoked.includes(url1) && v() !== el1 && !!v().closest('.camjf[data-feed=food]') && clipCalls().length === 2 && clipCalls()[1].q.get('cam') === 'cam2');
  ok('…the crate card is back to its thumbnail and play button', !!card().querySelector(`.cjv [data-clip="cam1:${tE}"]`));
  const url2 = v().src; food().querySelector('[data-clipact=close]').click(); await wait(4);
  ok('"סגירה": no player left, its blob revoked, back to the thumbnail', !$q('video') && revoked.includes(url2) && !!food().querySelector('.cjv [data-clip]') && CLIP.key === null && CLIP.url === null);
  // 5. unavailable states: explicit, calm, never retried by themselves
  const tryState = async (mode, el, sel) => { clipMode = mode; const n = clipCalls().length; el().querySelector(sel || '[data-clip]').click(); await pause(20); await wait(6); const t = (el() || {}).textContent || ''; await pause(60); await wait(3); render(); await wait(3); return { t, n: clipCalls().length - n, t2: (el() || {}).textContent || '' }; };
  { const r = await tryState('no_footage', card);
    ok('no footage (with an image): "יש רק תמונה (אין סרטון זמין) · אין צילום מהרגע הזה", the image stays', r.t.includes('יש רק תמונה (אין סרטון זמין)') && r.t.includes('אין צילום מהרגע הזה') && !!card().querySelector('img.camj-img') && !$q('video'));
    ok('…one request, no retry by itself, still said after a repaint, no "לנסות שוב"', r.n === 1 && r.t2.includes('אין צילום מהרגע הזה') && !card().querySelector('.cjv-msg [data-clip]')); }
  { const r = await tryState('no_footage', water);
    ok('no footage, no image: "אין סרטון זמין · אין צילום מהרגע הזה"', r.t.includes('אין סרטון זמין · אין צילום מהרגע הזה') && !r.t.includes('יש רק תמונה')); }
  { const r = await tryState('expired', food); ok('expired (410): "הסרטון כבר לא נשמר"', r.t.includes('יש רק תמונה (אין סרטון זמין)') && r.t.includes('הסרטון כבר לא נשמר') && r.n === 1); }
  delete CLIP.fail['cam1:' + tE];
  { clipMode = 'forbidden'; const n = clipCalls().length; clipOpen('cam1:' + tE, false, null); await pause(20); await wait(6);
    ok('denied (403): "החשבון הזה לא מורשה לסרטונים", no retry link', card().textContent.includes('החשבון הזה לא מורשה לסרטונים') && clipCalls().length - n === 1 && !card().querySelector('.cjv-msg [data-clip]')); }
  { clipMode = 'busy'; const n = clipCalls().length; clipOpen('cam2:' + tF, false, null); await pause(20); await wait(6); await pause(80); await wait(3);
    const t = food().textContent; ok('busy (503): "המצלמה עסוקה כרגע" + a manual "לנסות שוב", nothing retried by itself', t.includes('המצלמה עסוקה כרגע') && !!food().querySelector('.cjv-msg [data-clip]') && clipCalls().length - n === 1);
    clipMode = 'ok'; food().querySelector('.cjv-msg [data-clip]').click(); await pause(30); await wait(6);
    ok('…"לנסות שוב" (her tap) plays it', !!v() && !!v().closest('.camjf[data-feed=food]')); clipClose(true); await wait(3); }
  { clipMode = 'net'; const n = clipCalls().length; clipOpen('cam2:' + tW, false, null); await pause(20); await wait(6);
    ok('no connection: "אין חיבור למצלמה כרגע"', water().textContent.includes('אין חיבור למצלמה כרגע') && clipCalls().length - n === 1); }
  { const t0 = CAM_CLIP_TIMEOUT_MS; CAM_CLIP_TIMEOUT_MS = 30; gate = []; delete CLIP.fail['cam2:' + tW]; const n = clipCalls().length; clipOpen('cam2:' + tW, false, null); await pause(120); await wait(6);
    const pend = gate; gate = null; CAM_CLIP_TIMEOUT_MS = t0; pend.forEach(f => f());
    ok('too slow: "לקח יותר מדי זמן", one request', water().textContent.includes('לקח יותר מדי זמן') && clipCalls().length - n === 1); }
  { const h0 = CLIP_HEVC; CLIP_HEVC = true; clipMode = 'garbage'; delete CLIP.fail['cam2:' + tF]; const n = clipCalls().length; clipOpen('cam2:' + tF, false, null); await pause(1200); await wait(6);
    const cc = clipCalls().slice(n);
    ok('an undecodable clip: ONE more try as H.264 (h264=1), then "הסרטון לא מתנגן במכשיר הזה" — no loop', cc.length === 2 && !cc[0].q.get('h264') && cc[1].q.get('h264') === '1' && food().textContent.includes('הסרטון לא מתנגן במכשיר הזה') && !$q('video') && !CLIP.url);
    CLIP_HEVC = h0; clipMode = 'ok'; }
  ok('a browser without HEVC asks the service for H.264', (() => { const h0 = CLIP_HEVC; CLIP_HEVC = false; const r = clipHevcOk() === false; CLIP_HEVC = h0; return r; })());
  // 6. the review sheet: the same affordance in its rows; a clip there stops when the sheet closes
  CLIP.fail = {}; render(); await wait(3);
  camjReview(); await wait(3);
  ok('review rows: the pending entry (cam1) and the food / drink rows (cam2) have play buttons', !!sh.querySelector(`.cjrv [data-clip="cam1:${tE}"]`) && !!sh.querySelector(`.cjrv [data-clip="cam2:${tF}"]`) && !!sh.querySelector(`.cjrv [data-clip="cam2:${tW}"]`));
  sh.querySelector(`[data-clip="cam1:${tE}"]`).click(); await pause(30); await wait(6);
  ok('…tap in the review: the player in that row, answers beside it, the card keeps its own thumbnail', !!sh.querySelector('.cjr video') && sh.querySelector('.cjr video').closest('.cjr').querySelectorAll('[data-camans]').length === 4 && document.querySelectorAll('video').length === 1);
  const url3 = v().src; render(); await wait(3);
  ok('…a repaint of the main screen keeps it playing in the sheet', !!sh.querySelector('.cjr video') && v().src === url3);
  close(); await wait(3);
  ok('…closing the sheet stops it and revokes the blob', !$q('video') && revoked.includes(url3) && !CLIP.url);
  // 7. a device without the private service (other caregivers; the Mac's service off): the still image, said plainly
  localStorage.removeItem('pets-timers-v1-cam'); CAM.st = 'off'; render(); await wait(3);
  ok('no private service: no play button, nothing fetched, said plainly ("…וסרטון · רק בבדיקה במק" with the image line; "סרטון זמין רק בבדיקה במק" without one)', !document.querySelector('#side [data-clip], #main [data-clip]') && !$q('video')
    && card().textContent.includes('וסרטון · רק בבדיקה במק') && !card().textContent.includes('רק במכשיר עם גישה') && water().textContent.includes('סרטון זמין רק בבדיקה במק'));
  // 8. SHADOW: everything above changed nothing
  ok('shadow: journal, decisions, feedback, writes, commits, pushes, saved data — all unchanged', snapS() === S0);
  ok('…only GETs were sent (no POST anywhere)', calls.every(c => !c.method || c.method === 'GET'));
  URL.revokeObjectURL = realRevoke; window.fetch = realFetch; commit = rc; push = rp; CAM_FEATURES = FEAT0; fb = null; CAM.st = 'off'; CLIP.fail = {}; window.KEEP_FOLDS = false; FAKE_PHONE = false; render();
}
// §18c layout (pvlayout.js at 520, pvlayoutw.js at 1280): the gravel visit question and the provisional live timer fit
// their cards on Kishmish's and Kochik's screens, both designs; nothing overflows sideways. The case leaves the screen as
// it is (a screenshot of the page shows it).
async function pvLayoutSuite(W){
  const pause = ms => new Promise(r => setTimeout(r, ms)), subs = {};
  window.KEEP_FOLDS = true; reset(); FAKE_PHONE = null;
  const T = Date.now(), K0 = { p: 'kishmish' }, t0 = T - 25*MIN, t1 = t0 + 95000;
  seed([{ ...K0, k: 'pee', t: T - 3*HOUR, w: 'gravel' }, { ...K0, k: 'food', t: T - 90*MIN, m: 'meal' }, { p: 'kochik', k: 'pee', t: T - 3*HOUR, w: 'out' }]); serverSeen = true;
  fb = { auth: { currentUser: { uid: 'U1' } }, camDoc: (n, on) => { subs[n] = on; return () => {}; }, camGet: async () => null, camMerge: async () => {} };
  CAMJ.fbLocal = {}; CAMJ.pv = []; glStop(); GL.visits = []; GL.denied = false;
  pet = 'kishmish'; view = 'now'; render(); await wait(3);
  const it = (dog, ts, te) => ({ id: `pv_cam3_${ts}_${dog || 'unknown'}`, kind: 'potty_visit', status: 'active', source: 'camera_visit', camera: 'cam3', visit_id: 'v3_' + ts, dog, identity_confidence: dog ? 'reliable' : 'ask',
    ts, lo: ts, hi: te, t_start: ts, t_end: te, duration_s: (te - ts) / 1000, clip: { cam: 'cam3', t: ts, before: 15, after: 105 }, ir: false, uncertain: false, lighting: 'day' });
  if(subs[camjSugDoc()]) subs[camjSugDoc()]({ suggestions: [it('kishmish', t0, t1), it(null, t0 - HOUR, t0 - HOUR + 60000)], published_at: T, enabled: true }, false);
  if(subs[glDoc()]) subs[glDoc()]({ schema: 'cam-gravel-live/1', camera: 'cam3', published_at: T, coverage: { recorder_ok: true, status_age_s: 1 }, visits: [{ visit_id: 'v3_live', kind: 'gravel_live', status: 'open', t_start: T - 70000, last_seen: T - 3000, t_end: null, dog: 'kishmish', identity_confidence: 'reliable', ir: false, uncertain: false }] }, false);
  await wait(3); render(); await pause(60); await wait(3);
  const R = e => e.getBoundingClientRect(), inside = (a, b) => R(a).left >= R(b).left - 1 && R(a).right <= R(b).right + 1;
  const D = (V2 ? 'v2 ' : 'v1 ') + W + ': ';
  ok(D + 'width as asked', Math.abs(innerWidth - W) < 30 && isPhone() === (W < 760));
  const q = $q('.pvq'), g = $q('.gravel.glive');
  ok(D + 'Kishmish: the question and the live timer are on screen', !!q && !!g && R(q).height > 0 && R(g).height > 0);
  ok(D + '…the live card comes right before the question', !!g && g.nextElementSibling === q);
  ok(D + '…every answer button inside the question card, none clipped', !!q && [...q.querySelectorAll('[data-pv]')].every(b => inside(b, q) && R(b).width > 20));
  ok(D + '…the live card\'s buttons inside it', !!g && [...g.querySelectorAll('button')].every(b => inside(b, g)));
  ok(D + '…no sideways scroll', document.documentElement.scrollWidth <= innerWidth + 1);
  pet = 'kochik'; render(); await pause(40); await wait(3);
  const kq = $q('.pvq');
  ok(D + 'Kochik: her question (unknown identity) in "פיפי וקקי", inside its group', !!kq && !!kq.closest('.grp') && [...kq.querySelectorAll('[data-pv]')].every(b => inside(b, kq)) && document.documentElement.scrollWidth <= innerWidth + 1);
  pet = 'kishmish'; render(); await wait(3); window.scrollTo(0, ($q('#sec-potty') || q).getBoundingClientRect().top + scrollY - 10);
  fb = null; window.KEEP_FOLDS = false;
}
