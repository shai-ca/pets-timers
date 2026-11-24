// Three simulated phones do random things and sync in random order, some of them from stale copies.
// At the end every phone must hold the identical list, and everything a tile shows (last times, running
// timers, medication checklist) must equal what you get by recomputing it from that list.
(async function(){
  try {
    const KP = ['food','pee','poop','none'], KD = ['crate','sleep','cry'], SEEDS = [11, 23, 37, 58, 71, 94], OPS = 140;
    const expected = (log, p) => {   // an independent recomputation from the list
      const x = { point:{}, lastEnd:{}, start:{}, meds:{} }, today = dayKey(Date.now());
      for(const e of log){ if(e.p !== p) continue;
        if(e.k.startsWith('med_')){ if(dayKey(e.t) === today && !(x.meds[e.k.slice(4)] >= e.t)) x.meds[e.k.slice(4)] = e.t; }
        else if(ITEMS[e.k].dur){ if(e.end == null){ if(!(x.start[e.k] <= e.t)) x.start[e.k] = e.t; } else if(!(x.lastEnd[e.k] >= e.end)) x.lastEnd[e.k] = e.end; }
        else if(!(x.point[e.k] >= e.t)) x.point[e.k] = e.t; }
      return x;
    };
    const mismatch = (who) => {
      for(const p of Object.keys(PETS)){
        const x = expected(state.log, p), a = tiles(p);
        for(const k of ['food','pee','poop','gel','none']) if((a[k] || 0) !== (x.point[k] || 0)) return `${who}: ${p}.${k} tile ${a[k]} vs list ${x.point[k]}`;
        if(typeof derive === 'function' && canon(derive(state)[p].sleep) !== canon(a.sleep)) return `${who}: ${p}.sleep view is not what the list gives`;
        for(const k of KD){
          if(k === 'sleep' && typeof sleepSpans === 'function') continue;   // sleep = logged + assumed; checked just above
          if(((a[k] || {}).lastEnd || 0) !== (x.lastEnd[k] || 0)) return `${who}: ${p}.${k} last stay ${(a[k]||{}).lastEnd} vs list ${x.lastEnd[k]}`;
          if(typeof V !== 'undefined' && ((a[k] || {}).start || 0) !== (x.start[k] || 0)) return `${who}: ${p}.${k} running ${(a[k]||{}).start} vs list ${x.start[k]}`;
        }
        const m = medsOf(p); for(const sl of ['am','pm']) if((m[sl] || 0) !== (x.meds[sl] || 0)) return `${who}: ${p} medicine ${sl} checklist ${m[sl]} vs list ${x.meds[sl]}`;
      }
      return '';
    };
    const shape = log => canon(log.map(e => { const c = Object.assign({}, e); delete c.id; return c; }).sort((x, y) => x.t - y.t || (canon(x) < canon(y) ? -1 : 1)));
    for(const seed of SEEDS){
      reset(); const R = rng(seed), pick = a => a[Math.floor(R() * a.length)], now = Date.now();
      const S = fakeServer(blank());
      const phones = ['shai','yonatan','liza'].map(n => ({ n, state: blank(), base: blank() }));
      const settle = () => wait(6);
      const load = c => { me = c.n; use(c.state, c.base); }, save = c => { c.state = state; c.base = base; };
      const past = () => now - Math.floor(R() * 300) * MIN - 1000;
      for(let i = 0; i < OPS; i++){
        const c = pick(phones); load(c);
        if(R() < 0.5){ onServer(S.read()); await settle(); }           // otherwise this phone acts on a stale copy
        const r = R();
        if(r < 0.30){ tapPoint(pick(['kishmish','kochik']), pick(KP.slice(0, 3)), R() < 0.5 ? past() : undefined); close(); }
        else if(r < 0.36){ tapPoint('kishmish', 'none'); }
        else if(r < 0.52){ tapDur('kishmish', pick(KD)); }
        else if(r < 0.62){ setMed('kochik', pick(['am','pm']), R() < 0.7 ? past() : null); }
        else if(state.log.length){
          const cand = state.log.map((e, j) => j).filter(j => !(ITEMS[state.log[j].k].dur && state.log[j].end == null));
          if(cand.length){
            openEntrySheet(pick(cand));
            const del = sh.querySelector('#del'), w = sh.querySelectorAll('[data-w]'), tin = sh.querySelector('#tIn'), ro = sh.querySelector('#reopen');
            if(r < 0.74 && del) del.click();
            else if(r < 0.80 && ro) ro.click();
            else if(r < 0.90 && w.length){ pick([...w]).click(); sh.querySelector('#ok').click(); }
            else if(tin){ const d = new Date(now - Math.floor(R() * 200) * MIN); tin.value = clock(d.getTime()); sh.querySelector('#ok').click(); }
            close();
          }
        }
        if(R() < 0.08) document.getElementById('undo').click();
        await settle(); save(c);
      }
      for(let round = 0; round < 3; round++) for(const c of phones){ load(c); onServer(S.read()); await settle(); save(c); }
      const shapes = phones.map(c => shape(c.state.log));
      ok(`seed ${seed}: all three phones and the server hold the same list (${phones[0].state.log.length} entries)`,
        shapes[0] === shapes[1] && shapes[1] === shapes[2] && shapes[0] === shape(norm(S.read()).log));
      let bad = ''; for(const c of phones){ load(c); render(); bad = bad || mismatch(c.n); }
      ok(`seed ${seed}: every tile agrees with the list${bad ? ' — ' + bad : ''}`, !bad);
    }
    done();
  } catch(e){ crashed(e); }
})();
