// A stand-in for the Firebase SDK, for the lock-screen tests: sign-in, sign-out, allowed / refused.
window.__fake = { user:null, deny:false, listeners:[], snapErr:null, snapOk:null };
const FAKE = {
  app: { initializeApp: () => ({}) },
  auth: { getAuth: () => ({ get currentUser(){ return window.__fake.user; } }), GoogleAuthProvider: function(){},
          signInWithPopup: async () => { window.__fake.user = {email:'someone@example.com'}; window.__fake.listeners.forEach(f => f(window.__fake.user)); },
          signOut: async () => { window.__fake.user = null; window.__fake.listeners.forEach(f => f(null)); },
          onAuthStateChanged: (a, f) => { window.__fake.listeners.push(f); setTimeout(() => f(window.__fake.user), 25); } },
  firestore: { initializeFirestore: () => ({}), persistentLocalCache: () => ({}), persistentMultipleTabManager: () => ({}), getFirestore: () => ({}), doc: () => ({}),
          onSnapshot: (ref, opts, ok, err) => { setTimeout(() => { if(window.__fake.deny) err({code:'permission-denied'}); else ok({metadata:{fromCache:false,hasPendingWrites:false}, exists:()=>true, data:()=>({kochik:{},kishmish:{},log:[]})}); }, 0); return () => {}; },
          runTransaction: async () => { throw {code:'unavailable'}; }, getDocFromServer: async () => ({exists:()=>false}) }
};

if(location.hash==='#offline') window.__offline = true;
if(location.hash==='#known') localStorage.setItem('pets-timers-v1-authok','someone@example.com'); else localStorage.clear();
