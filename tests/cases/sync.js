// Two phones and a server: a phone must never erase what another phone wrote.
(async function(){
  try {
    reset('yonatan', 'kochik');
    const now = Date.now(), day = dayKey(now);
    const S = fakeServer(norm({ v: 2, log: [{ p:'kochik', k:'food', t: now - 100*MIN, by:'shai' }] }));
    onServer(S.read());
    ok('loaded from the server, nothing to send', KO().food === now - 100*MIN && noDiff(diff(base, state)) && S.writes === 0);

    // Shai gives the morning medicine on her phone; this phone has not heard yet and logs a pee.
    S.doc.log.push({ id:'x1', p:'kochik', k:'med_am', t: now - 5*MIN, by:'shai' });
    tapPoint('kochik', 'pee', now - MIN); close(); await wait();
    ok('a stale phone does not erase the medicine', S.doc.log.some(e => e.k === 'med_am') && S.doc.log.some(e => e.k === 'pee'));
    ok('and it now shows the medicine itself', !!medsOf('kochik').am && !!$q('.med.done'));

    const w0 = S.writes; await push(); onServer(S.read()); await wait();
    ok('different key order from the server causes no phantom writes', S.writes === w0 && noDiff(diff(base, state)));

    tapPoint('kochik', 'poop', now); close(); await wait();
    S.doc.log.push({ id:'x2', p:'kochik', k:'med_pm', t: now, by:'liza' });
    onServer(S.read());
    document.getElementById('undo').click(); await wait();
    ok('undo removes only my own change', !S.doc.log.some(e => e.k === 'poop') && S.doc.log.some(e => e.k === 'med_pm'));

    S.doc.log.push({ id:'x3', p:'kishmish', k:'pee', t: now - 2*MIN, by:'liza' });
    openEntrySheet(state.log.findIndex(e => e.p === 'kochik' && e.k === 'pee')); sh.querySelector('#del').click(); await wait();
    ok('delete here + add there: both hold', !S.doc.log.some(e => e.p === 'kochik' && e.k === 'pee') && S.doc.log.some(e => e.id === 'x3'));

    // both phones change the same entry: one moves its time, the other marks the place -> one entry, not two
    onServer(S.read()); await wait();
    const other = { state: clone(state), base: clone(base) };
    const target = state.log.find(e => e.id === 'x3');
    openEntrySheet(state.log.indexOf(target)); sh.querySelector('[data-w=pad]').click(); sh.querySelector('#ok').click(); await wait();
    const mineS = state, mineB = base;
    use(other.state, other.base);
    openEntrySheet(state.log.findIndex(e => e.id === 'x3')); sh.querySelector('#tIn').value = clock(now - 30*MIN); sh.querySelector('#ok').click(); await wait();
    ok('two phones editing one entry leave one entry', S.doc.log.filter(e => e.p === 'kishmish' && e.k === 'pee').length === 1);
    use(mineS, mineB); onServer(S.read()); await wait();

    S.fail = true; tapPoint('kochik', 'food', now); await wait();
    ok('offline: kept on the phone, not on the server', KO().food === now && !S.doc.log.some(e => e.k === 'food' && e.t === now) && !noDiff(diff(base, state)));
    S.doc.log.push({ id:'x4', p:'kishmish', k:'poop', t: now - 3*MIN, by:'liza' });
    const saved = JSON.parse(localStorage.getItem(LS_DATA));
    ok('state and base are saved together in one key', !!saved.state && !!saved.base && saved.state.log.length === state.log.length);
    use(norm(saved.state), norm(saved.base)); S.fail = false; clearTimeout(retryTimer);   // "closed and reopened the app"
    resync(); await wait(3);
    ok('back online: my entry is sent, theirs kept', S.doc.log.some(e => e.k === 'food' && e.t === now) && S.doc.log.some(e => e.id === 'x4') && noDiff(diff(base, state)));

    pet = 'kishmish'; tapDur('kishmish', 'crate'); await wait();
    S.doc.log.push({ id:'x5', p:'kochik', k:'pee', t: now, by:'yonatan' });
    tapDur('kishmish', 'crate'); await wait();
    ok('a timer and another pet\'s entry merge', S.doc.log.some(e => e.k === 'crate' && e.end) && !K().crate.start && S.doc.log.some(e => e.id === 'x5'));
    ok('the server document carries the version', S.doc.v === SCHEMA);
    done();
  } catch(e){ crashed(e); }
})();
