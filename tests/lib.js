// Shared helpers for the test cases. A case ends by calling done().
const T = { out: [] };
function ok(name, cond){ T.out.push((cond ? 'PASS ' : 'FAIL ') + name); }
function done(extra){ document.title = (T.out.filter(x => !x.startsWith('PASS')).join(' | ') || 'ALL PASS ' + T.out.length) + (extra ? ' :: ' + extra : ''); }
function crashed(e){ T.out.push('ERROR ' + String((e && e.stack) || JSON.stringify(e)).replace(/\s+/g, ' ').slice(0, 400)); done(); }
// Lets pending promise work (a save in flight, a merge) run. Microtasks only, so thousands of them are instant.
const wait = async (n = 1) => { for(let i = 0; i < n * 60; i++) await null; };
const $q = s => document.querySelector(s), $n = s => document.querySelectorAll(s).length;
const MIN = 60000, HOUR = 3600000;
// What the tiles read: the derived view (`V`), or the stored pet object in versions before it existed.
const tiles = p => (typeof V !== 'undefined' ? V[p] : state[p]);
function use(s, b){ state = s; if(b !== undefined) base = b; if(typeof setState === 'function') setState(s); }
function reset(who = 'shai', showPet = 'kishmish'){
  localStorage.clear(); try { localStorage.setItem(LS_KEY + '-salvaged', '1'); } catch(e){}
  use(blank(), blank()); me = who; pet = showPet; view = 'now'; sumFilter = null;
  if(typeof ASK_WHEN !== 'undefined') ASK_WHEN = false;   // cases tap buttons and expect the entry at once; when.js tests the prompt
  if(typeof FAKE_HOUR !== 'undefined'){ FAKE_HOUR = 12; FAKE_PHONE = false; nightFull = false; }   // night.js and routine.js test the night screen and the phone layout
  if(typeof FAKE_TODAY !== 'undefined') FAKE_TODAY = null;
  if(typeof awakeUntil !== 'undefined') awakeUntil = 0;
  if(typeof SLEEP2_FROM !== 'undefined') SLEEP2_FROM = Infinity;   // cases are written against the closed-box rules; crate2.js and sleep2.js move the cut-off
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
