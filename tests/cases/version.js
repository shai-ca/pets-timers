// A page older than the data must not save over it.
(async function(){
  try {
    reset();
    try { sessionStorage.setItem(LS_KEY + '-reloaded', String(Date.now())); } catch(e){}   // keep the page from reloading in the test
    const now = Date.now(), S = fakeServer(norm({ v: 2, log: [{ p:'kishmish', k:'pee', t: now - HOUR }] }));
    onServer(S.read()); await wait();
    ok('normal: in sync', !stale && K().pee === now - HOUR);
    S.doc.v = SCHEMA + 1; S.doc.somethingNew = { a: 1 };
    onServer(S.read());
    ok('newer data on the server: this page stops saving', stale === true);
    const w = S.writes; tapPoint('kishmish', 'pee'); close(); await wait(3);
    ok('nothing is written by the outdated page', S.writes === w && S.doc.somethingNew.a === 1);
    stale = false; S.doc.v = SCHEMA; tapPoint('kishmish', 'poop'); close();
    S.doc.v = SCHEMA + 1; await wait(3);
    ok('a save that meets newer data mid-flight backs off too', stale === true && !S.doc.log.some(e => e.k === 'poop'));
    done();
  } catch(e){ crashed(e); }
})();
