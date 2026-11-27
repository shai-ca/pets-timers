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
