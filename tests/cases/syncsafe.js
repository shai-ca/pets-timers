// DATA INTEGRITY OF SYNC (v3, owner): the fixed start-up path (`loadLocal` reads the list and its base before deriving)
// and the merge rules, against a fake server. "Closing the app" drops everything in memory (a save in flight never
// returns); "reopening" runs the real start-up read from localStorage. Every list must keep each id once.
(async function(){
  try {
    const now = Date.now(), K0 = { p:'kishmish' };
    // A server whose saves can fail (offline), hang (the app closed mid-save) or land without the reply ("lost").
    const server = () => { const S = { doc: blank(), writes: 0, fail: false, hang: false, lost: false, read: () => clone(S.doc) };
      S.ref = () => ({ merge: async fn => { await null; if(S.fail) throw { code:'unavailable' }; if(S.hang) return new Promise(() => {});
                                             S.doc = clone(fn(S.read(), true)); S.writes++; return S.lost ? new Promise(() => {}) : S.doc; },
                       fresh: async () => { if(S.fail) throw { code:'unavailable' }; onServer(S.read()); } });
      return S; };
    const settle = () => wait(8);
    const closeApp = () => { clearTimeout(retryTimer); ref = null; writing = false; dirty = false; state = blank(); base = null; V = derive(state); };
    const reopen = async (S, online = true) => { loadLocal(); render(); ref = S.ref(); if(online){ onServer(S.read()); await settle(); } };
    const once = log => new Set(log.map(e => e.id)).size === log.length;
    const sorted = log => log.every((e, i) => !i || log[i-1].t <= e.t);
    const kinds = log => log.map(e => e.k).sort().join();
    const start = async () => { reset(); const S = server(); ref = S.ref(); onServer(S.read()); await settle(); return S; };
    const pt = (k, t) => { tapPoint('kishmish', k, t); close(); };

    // 1. closed before the save completed → still there after reopening, sent once
    let S = await start();
    S.hang = true; pt('pee'); await settle();
    ok('1: a save is in flight when the app is closed', writing === true && S.writes === 0);
    closeApp(); S.hang = false; await reopen(S);
    ok('1: after reopening the unsent pee is still on this phone', state.log.filter(e => e.k === 'pee').length === 1);
    ok('1: …and it was sent exactly once', S.writes === 1 && norm(S.read()).log.filter(e => e.k === 'pee').length === 1 && noDiff(diff(base, state)));
    onServer(S.read()); await settle(); resync(); await settle();
    ok('1: reconnecting again sends nothing more', S.writes === 1 && once(S.doc.log));
    // 1b. the server took it but the reply never came (closed right then) → no duplicate
    S = await start();
    S.lost = true; pt('pee'); pt('food'); await settle(); closeApp(); S.lost = false; await reopen(S);
    ok('1b: the server had it, the phone did not know: no duplicate after reopening', norm(S.read()).log.length === 2 && once(S.doc.log) && kinds(state.log) === 'food,pee' && noDiff(diff(base, state)));

    // 2. connection lost: saves fail, entries stay here, retried, sent once
    S = await start();
    S.fail = true; pt('pee'); pt('food'); pt('water'); await settle();
    ok('2: offline: nothing reached the server, everything is kept and saved on the phone', S.writes === 0 && state.log.length === 3 && JSON.parse(localStorage.getItem(LS_DATA)).state.log.length === 3 && diff(base, state).add.length === 3);
    resync(); await settle(); push(); await settle();
    ok('2: retries while still offline change nothing', S.writes === 0 && state.log.length === 3);
    S.fail = false; resync(); await settle();
    ok('2: back online: all three sent, once', norm(S.read()).log.length === 3 && once(S.doc.log) && S.writes === 1 && noDiff(diff(base, state)));
    push(); await settle(); resync(); await settle();
    ok('2: and never again', S.writes === 1 && S.doc.log.length === 3);

    // 3. reopened while offline, more logged, then online → all once, in time order
    S = await start();
    S.fail = true; pt('pee', now - 30*MIN); await settle(); closeApp();
    await reopen(S, false);
    ok('3: reopened offline: the earlier entry is back', state.log.length === 1 && diff(base, state).add.length === 1);
    pt('poop', now - 40*MIN); tapDur('kishmish', 'crate'); pt('food', now - 20*MIN);
    commit('edit', () => { state.log.find(e => e.k === 'pee').w = 'gravel'; });
    await settle(); closeApp(); await reopen(S, false);
    ok('3: reopened offline again: all four still here', kinds(state.log) === 'crate,food,pee,poop' && state.log.find(e => e.k === 'pee').w === 'gravel');
    S.fail = false; onServer(S.read()); await settle();
    const s3 = norm(S.read()).log;
    ok('3: online: all sent once, in time order, with the edit', s3.length === 4 && once(s3) && sorted(s3) && s3.find(e => e.k === 'pee').w === 'gravel' && !!K().crate.start);

    // 4. three caregivers on stale copies
    S = await start();
    const phones = ['shai', 'yonatan', 'liza'].map(n => ({ n, state: blank(), base: blank() }));
    const load = c => { me = c.n; use(c.state, c.base); ref = S.ref(); }, save = c => { c.state = state; c.base = base; };
    const sync = async c => { load(c); onServer(S.read()); await settle(); save(c); };
    const on = async (c, f, fresh) => { load(c); if(fresh) { onServer(S.read()); await settle(); } f(); await settle(); save(c); };
    await on(phones[0], () => { pt('pee', now - 90*MIN); pt('poop', now - 80*MIN); pt('food', now - 70*MIN); });
    for(const c of phones) await sync(c);
    const id = k => S.doc.log.find(e => e.k === k).id;
    const X = id('pee'), Y = id('poop'), Z = id('food');
    await on(phones[1], () => commit('t', () => { state.log.find(e => e.id === X).t = now - 85*MIN; }));       // B: later edit of the time
    await on(phones[2], () => commit('del', () => { state.log = state.log.filter(e => e.id !== Y); }));       // C: deletes the poop
    await on(phones[0], () => { pt('water', now - 10*MIN); commit('w', () => { state.log.find(e => e.id === X).w = 'pad'; }); });   // A, stale: adds, sets the place
    await on(phones[0], () => commit('w2', () => { const y = state.log.find(e => e.id === Y); if(y) y.w = 'gravel'; }));   // A, stale: edits the deleted one
    for(let r = 0; r < 2; r++) for(const c of phones) await sync(c);
    const sh4 = phones.map(c => canon(c.state.log)), fin = norm(S.read()).log, x = fin.find(e => e.id === X);
    ok('4: every phone ends with the server\'s list', sh4[0] === sh4[1] && sh4[1] === sh4[2] && sh4[0] === canon(fin));
    ok('4: B\'s later time edit is not undone by A\'s older copy, and A\'s place is kept too', x.t === now - 85*MIN && x.w === 'pad');
    ok('4: C\'s delete stands, even though stale A edited that entry', !fin.some(e => e.id === Y) && fin.some(e => e.id === Z) && fin.some(e => e.k === 'water'));
    ok('4: no id twice', once(fin) && phones.every(c => once(c.state.log)));

    // 5. the same entry changed on two phones
    await on(phones[2], () => tapDur('kishmish', 'crate'), true);
    for(const c of phones) await sync(c);
    await on(phones[1], () => tapDur('kishmish', 'crate'));                             // B ends it now
    await on(phones[0], () => endDurAt('kishmish', 'crate', now - 10*MIN));            // A, stale: ends it 10 min ago
    for(let r = 0; r < 2; r++) for(const c of phones) await sync(c);
    let crs = norm(S.read()).log.filter(e => e.k === 'crate');
    ok('5: two phones ended the same stay: one stay, the earlier end kept, on every phone', crs.length === 1 && crs[0].end === Math.max(now - 10*MIN, crs[0].t + 1) && phones.every(c => c.state.log.filter(e => e.k === 'crate').length === 1 && c.state.log.find(e => e.k === 'crate').end === crs[0].end));
    await on(phones[1], () => tapDur('kishmish', 'crate', now - 30*MIN), true);
    for(const c of phones) await sync(c);
    await on(phones[0], () => endDurAt('kishmish', 'crate', now - 10*MIN));
    await on(phones[2], () => endDurAt('kishmish', 'crate', now - 20*MIN));        // the earlier one, synced second
    for(let r = 0; r < 2; r++) for(const c of phones) await sync(c);
    crs = norm(S.read()).log.filter(e => e.k === 'crate' && e.t === now - 30*MIN);
    ok('5: …also when the earlier end arrives second', crs.length === 1 && phones.every(c => canon(c.state.log) === canon(norm(S.read()).log)) && crs[0].end === now - 20*MIN);
    const W = id('water');
    await on(phones[0], () => commit('t', () => { state.log.find(e => e.id === W).t = now - 15*MIN; }));
    await on(phones[1], () => commit('q', () => { state.log.find(e => e.id === W).by = 'liza'; }));
    for(let r = 0; r < 2; r++) for(const c of phones) await sync(c);
    const w5 = norm(S.read()).log.find(e => e.id === W);
    ok('5: time edited on A, another field on B: both kept', w5.t === now - 15*MIN && w5.by === 'liza' && once(S.doc.log));

    // 6. duplicates: a random run of failures, reopenings, stale phones and undo never doubles an id
    const R = rng(97), pick = a => a[Math.floor(R() * a.length)];
    S = await start(); const ph = ['shai', 'yonatan'].map(n => ({ n, state: blank(), base: blank() }));
    for(let i = 0; i < 80; i++){
      const c = pick(ph); load(c); S.fail = R() < 0.3;
      if(R() < 0.5) try { onServer(S.read()); } catch(e){}
      const r = R();
      if(r < 0.4) pt(pick(['pee', 'poop', 'food', 'water']), R() < 0.5 ? now - Math.floor(R()*200)*MIN : undefined);
      else if(r < 0.55) tapDur('kishmish', pick(['crate', 'cry']));
      else if(r < 0.7 && state.log.length){ const e = pick(state.log); commit('d', () => { state.log = state.log.filter(x => x !== e); }); }
      else if(r < 0.8) document.getElementById('undo').click();
      else if(r < 0.9){ await settle(); if(c === ph[0]){ localStorage.setItem(LS_DATA, JSON.stringify({ state, base })); closeApp(); await reopen(S, !S.fail); } }
      await settle(); save(c);
    }
    S.fail = false; for(let r = 0; r < 3; r++) for(const c of ph) await sync(c);
    const f6 = norm(S.read()).log;
    ok(`6: after 80 random steps (${f6.length} entries): no id twice anywhere, all lists equal`, once(f6) && ph.every(c => once(c.state.log) && canon(c.state.log) === canon(f6)));
    // the "same button twice within two minutes" guard, also across phones
    S = await start(); DUP_MS = 2*60000;
    pt('pee'); tile('pee').click();
    ok('6: the same button twice within two minutes asks first', sh.textContent.includes('כבר נרשם') && logOf('kishmish', 'pee').length === 1);
    sh.querySelector('#cancel').click(); ok('6: …"no" logs nothing', logOf('kishmish', 'pee').length === 1);
    await settle(); me = 'yonatan'; const other = { state: blank(), base: blank() }; use(other.state, other.base); onServer(S.read()); await settle();
    tile('pee').click();
    ok('6: …and it asks on another phone too, once the pee has synced there', sh.textContent.includes('כבר נרשם') && logOf('kishmish', 'pee').length === 1);
    sh.querySelector('#ok').click(); await settle();
    ok('6: …"yes" logs a second one, with its own id', logOf('kishmish', 'pee').length === 2 && once(state.log) && norm(S.read()).log.filter(e => e.k === 'pee').length === 2);
    DUP_MS = 0;
  } catch(e){ crashed(e); }
  done();
})();
