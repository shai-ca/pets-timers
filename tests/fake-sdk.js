// A stand-in for the Firebase SDK, for the lock-screen tests: sign-in, sign-out, allowed / refused.
window.__fake = { user:null, deny:false, listeners:[], snapErr:null, snapOk:null, tx:0, unsubs:0, doc:null };
// isolation.js: the page's MODE is decided at start-up, so the variant sets it before the app runs
if(location.hash==='#preview' || location.hash==='#sandbox') window.FAKE_MODE = location.hash.slice(1);
const FAKE = {
  app: { initializeApp: () => ({}) },
  auth: { getAuth: () => ({ get currentUser(){ return window.__fake.user; } }), GoogleAuthProvider: function(){},
          signInWithPopup: async () => { window.__fake.user = {email:'someone@example.com'}; window.__fake.listeners.forEach(f => f(window.__fake.user)); },
          signOut: async () => { window.__fake.user = null; window.__fake.listeners.forEach(f => f(null)); },
          onAuthStateChanged: (a, f) => { window.__fake.listeners.push(f); setTimeout(() => f(window.__fake.user), 25); } },
  firestore: { initializeFirestore: () => ({}), persistentLocalCache: () => ({}), persistentMultipleTabManager: () => ({}), getFirestore: () => ({}), doc: () => ({}),
          onSnapshot: (ref, opts, ok, err) => { setTimeout(() => { if(window.__fake.deny) err({code:'permission-denied'}); else ok({metadata:{fromCache:false,hasPendingWrites:false}, exists:()=>true, data:()=>JSON.parse(JSON.stringify(window.__fake.doc || {kochik:{},kishmish:{},log:[]}))}); }, 0); return () => { window.__fake.unsubs++; }; },
          runTransaction: async () => { window.__fake.tx++; throw {code:'unavailable'}; }, getDocFromServer: async () => ({exists:()=>false}) }
};

if(location.hash==='#offline') window.__offline = true;
if(location.hash==='#known') localStorage.setItem('pets-timers-v1-authok','someone@example.com'); else localStorage.clear();
// loadlocal.js: a phone with a change it has not sent yet (a pee in its list that its base — the server — lacks)
if(location.hash==='#unsent'){ const pee = {id:'u1', p:'kishmish', k:'pee', t: Date.now() - 600000, by:'shai'}, crate = {id:'u0', p:'kishmish', k:'crate', t: Date.now() - 7200000, end: Date.now() - 3600000};
  localStorage.setItem('pets-timers-v1-authok','someone@example.com'); localStorage.setItem('pets-timers-v1-salvaged','1');
  localStorage.setItem('pets-timers-v2', JSON.stringify({state:{v:2, log:[crate, pee]}, base:{v:2, log:[crate]}})); }
