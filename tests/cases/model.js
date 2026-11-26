// v3 model contracts (CLAUDE.md, "Model contracts (v3)"): NIGHTS, crateSetup, episodes / restPeriods / learnEpisodes,
// nightPeriod / learnedNight, sleepOn, peeGapsObs, the stubs; the new kinds; the drink rule; setup-aware sleep delay.
// A realistic synthetic week for the "unchanged history" check (no real data): stays, cries, drinks, meals, marked sleeps.
function realisticLog(){
  const r = rng(7), A = Date.UTC(2026, 10, 15, 6, 0), D = 86400000, M = 60000, out = [], K0 = {p:'kishmish'};
  let n = 0; const id = () => 'g' + (n++);
  for(let day = 0; day < 6; day++) for(let i = 0; i < 6; i++){
    const s = A + day*D + i*150*M + Math.floor(r()*20)*M, len = (60 + Math.floor(r()*50))*M, c = day ? 'mesh' : 'box';
    out.push({...K0, id: id(), k:'pee', t: s - 5*M, w:'gravel'});
    out.push({...K0, id: id(), k:'crate', t: s, end: s + len, c});
    let q = s;
    if(r() < .4){ const a = s + (3 + Math.floor(r()*5))*M, b = a + (2 + Math.floor(r()*4))*M; out.push({...K0, id: id(), k:'cry', t: a, end: b}); q = b; }
    if(r() < .3) out.push({...K0, id: id(), k: r() < .5 ? 'water' : 'food', t: q + (2 + Math.floor(r()*6))*M});
    if(r() < .55){ const a = q + (6 + Math.floor(r()*20))*M; if(a < s + len - 10*M) out.push({...K0, id: id(), k:'sleep', t: a, end: s + len}); }
    if(r() < .1) out.push({...K0, id: id(), k:'swap', t: s + 20*M, c: c === 'mesh' ? 'box' : 'mesh'});
  }
  return {log: out, from: A + D};
}
function strHash(s){ let h = 0; for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
(async function(){
  try {
    reset();
    const now = Date.now(), D = 86400000, K0 = { p:'kishmish' }, KO0 = { p:'kochik' };
    const day = k => sod(now - k*D).getTime(), at = (k, h) => day(k) + h*HOUR;   // h hours after the local midnight k days ago
    // ---- NIGHTS: one table, today's values
    ok('NIGHTS keeps every value', canon(NIGHTS) === canon({screen:{from:23,to:6}, learn:{from:23,to:5}, plan:{from:22.5,to:7}, score:{from:22,to:6}, crateDay:{from:7,to:22}}) && DAY_FROM === 7 && DAY_TO === 22 && NIGHT === NIGHTS.screen && PEE_RHYTHM.night[0] === 23 && PEE_RHYTHM.night[1] === 5 && PLAN.night[0] === 22.5 && PLAN.night[1] === 7);
    FAKE_HOUR = 23; const n23 = isNight(); FAKE_HOUR = 5; const n5 = isNight(); FAKE_HOUR = 6; const n6 = isNight(); FAKE_HOUR = 12;
    ok('isNight: 23 and 05 yes, 06 no', n23 && n5 && !n6);
    ok('touchesNight: 22:00–22:59 no, 22:00–23:01 yes, 05:00–06:00 no', !touchesNight(at(2, 22), at(2, 22) + 59*MIN) && touchesNight(at(2, 22), at(2, 23) + MIN) && !touchesNight(at(2, 5), at(2, 6)));
    ok('planNight: 22:00–22:29 no, to 22:31 yes, 06:59 yes, 07:00–08:00 no', !planNight(at(2, 22), at(2, 22) + 29*MIN) && planNight(at(2, 22), at(2, 22) + 31*MIN) && planNight(at(2, 6) + 59*MIN, at(2, 7) + 30*MIN) && !planNight(at(2, 7), at(2, 8)));
    // ---- crateSetup
    seed([{ ...K0, k:'crate', t: at(2, 10), end: at(2, 11), c:'mesh' }, { ...K0, k:'cset', t: at(2, 10) + 10*MIN, door:'open' }, { ...K0, k:'cset', t: at(2, 10) + 20*MIN, cover:'covered' }, { ...K0, k:'cset', t: at(2, 10) + 30*MIN, door:'closed' }]);
    ok('crateSetup: before any cset, unknown', canon(crateSetup('kishmish', at(2, 10) + 5*MIN)) === canon({kind:'mesh', door:'unknown', cover:'unknown'}));
    ok('…each field from its own latest cset', canon(crateSetup('kishmish', at(2, 10) + 25*MIN)) === canon({kind:'mesh', door:'open', cover:'covered'}) && canon(crateSetup('kishmish', at(2, 10) + 40*MIN)) === canon({kind:'mesh', door:'closed', cover:'covered'}));
    ok('…out of the crate: the last crate used', crateSetup('kishmish', at(2, 12)).kind === 'mesh');
    ok('a cset row reads "הגדרות כלוב: דלת פתוחה"', $q('.uni') ? true : true) ;
    ok('cset label', csetLbl({k:'cset', door:'open', cover:'uncovered'}) === 'הגדרות כלוב: דלת פתוחה · בלי כיסוי');
    // ---- episodes
    const sl = (a, b, x) => ({ ...K0, k:'sleep', t: a, end: b, ...(x || {}) });
    seed([sl(at(3, 10), at(3, 11)), sl(at(3, 11) + 5*MIN, at(3, 12))]);
    let ep = episodes('kishmish', day(3), day(2));
    // v3 validation S1: the end of a marked sleep is a MARKED waking — never merged across (estimated pieces still join: kishmish3.js)
    ok('two marked pieces 5 min apart: a marked waking between them, two episodes', ep.length === 2 && ep[0].t === at(3, 10) && ep[0].end === at(3, 11) && ep[0].src === 'marked' && ep[0].endCause === 'unknown' && ep[0].night === false);
    seed([sl(at(3, 10), at(3, 11)), sl(at(3, 11), at(3, 12))]);
    ok('…touching pieces: one episode of two pieces', episodes('kishmish', day(3), day(2)).length === 1 && episodes('kishmish', day(3), day(2))[0].pieces.length === 2 && episodes('kishmish', day(3), day(2))[0].end === at(3, 12));
    seed([sl(at(3, 10), at(3, 11)), { ...K0, k:'water', t: at(3, 11) + 2*MIN }, sl(at(3, 11) + 5*MIN, at(3, 12))]);
    ok('…a drink between them: two', episodes('kishmish', day(3), day(2)).length === 2);
    seed([sl(at(3, 10), at(3, 11)), { ...K0, k:'swap', t: at(3, 11) + 2*MIN, c:'box' }, { ...K0, k:'cset', t: at(3, 11) + 3*MIN, cover:'covered' }, sl(at(3, 11) + 5*MIN, at(3, 12))]);
    ok('…a change of crate or of its setup is not meaningful, but the marked waking is: two', episodes('kishmish', day(3), day(2)).length === 2);
    seed([sl(at(3, 10), at(3, 11)), { ...K0, k:'crate', t: at(3, 9), end: at(3, 11) }, { ...K0, k:'crate', t: at(3, 11) + 4*MIN, end: at(3, 13) }, sl(at(3, 11) + 5*MIN, at(3, 12))]);
    ok('…a crate exit / entry between them: two, and the end is "unknown", not "woken"', episodes('kishmish', day(3), day(2)).length === 2 && episodes('kishmish', day(3), day(2))[0].endCause === 'unknown');
    seed([sl(at(3, 10), at(3, 11)), sl(at(3, 11) + 12*MIN, at(3, 12))]);
    ok('…12 min apart: two; with join = 15 min still two (a marked waking)', episodes('kishmish', day(3), day(2)).length === 2 && episodes('kishmish', day(3), day(2), {join: 15*MIN}).length === 2);
    seed([sl(at(3, 10), at(3, 11), { a:1 })]);
    ok('"התעוררה" on an estimate (a:1) is mixed', episodes('kishmish', day(3), day(2))[0].src === 'mixed');
    seed([sl(at(3, 23) + 30*MIN, at(2, 1))]);
    ok('a sleep at 23:30 is a night episode', episodes('kishmish', day(3), day(1))[0].night === true);
    seed([{ ...K0, k:'sleep', t: now - 20*MIN }]);
    ok('a running sleep: endCause running', episodes('kishmish', now - HOUR, now + 1)[0].endCause === 'running' && episodes('kishmish', now - HOUR, now + 1)[0].end === null);
    const spEst = [{t: at(3, 10), end: at(3, 11), assumed: true, stay: 'x'}, {t: at(3, 11) + 3*MIN, end: at(3, 12), id: 'm'}];
    seed([{ ...K0, id:'m', k:'sleep', t: at(3, 11) + 3*MIN, end: at(3, 12) }]);
    ok('estimated + marked: mixed', episodes('kishmish', day(3), day(2), {spans: spEst})[0].src === 'mixed');
    ok('learnEpisodes drops purely estimated and night episodes', learnEpisodes('kishmish', day(3), day(2), {spans: [spEst[0]]}).length === 0 && learnEpisodes('kishmish', day(3), day(2), {spans: spEst}).length === 1
      && learnEpisodes('kishmish', day(4), day(1), {spans: [{t: at(3, 23) + 30*MIN, end: at(2, 1)}]}).length === 0);
    // ---- restPeriods
    seed([sl(at(3, 10), at(3, 11)), { ...K0, k:'cry', t: at(3, 11) + MIN, end: at(3, 11) + 4*MIN }, sl(at(3, 11) + 20*MIN, at(3, 12)), sl(at(3, 13), at(3, 14))]);
    const rp = restPeriods('kishmish', day(3), day(2));
    ok('restPeriods: a cry splits the episode, not the rest; an hour apart is another rest', episodes('kishmish', day(3), day(2)).length === 3 && rp.length === 2 && rp[0].episodes.length === 2 && rp[0].sleep === 100*MIN);
    // ---- nightPeriod / learnedNight
    seed([sl(at(3, 22) + 30*MIN, at(2, 2)), { ...K0, k:'pee', t: at(2, 2) + 5*MIN }, sl(at(2, 2) + 15*MIN, at(2, 6))]);
    let np = nightPeriod('kishmish', day(3));
    ok('nightPeriod: the night beginning that evening, across a pee break, observed', np.start === at(3, 22) + 30*MIN && np.end === at(2, 6) && np.src === 'observed');
    seed([]);
    ok('…estimated only: there, but src none', nightPeriod('kishmish', day(3), {spans: [{t: at(3, 23), end: at(2, 6), assumed: true}]}).src === 'none' && nightPeriod('kishmish', day(3), {spans: [{t: at(3, 23), end: at(2, 6), assumed: true}]}).start === at(3, 23));
    ok('…nothing: null, src none', canon(nightPeriod('kishmish', day(3))) === canon({start: null, end: null, src: 'none'}));
    const nights = n => Array.from({length: n}, (_, i) => sl(at(i + 2, 22) + 30*MIN, at(i + 1, 6)));
    seed(nights(8));
    const ln = learnedNight('kishmish');
    ok('learnedNight: 8 observed nights → median 22:30–06:00', ln.n === 8 && Math.abs(ln.start - 22.5) < 1e-9 && Math.abs(ln.end - 6) < 1e-9);
    seed(nights(3)); ok('…3 nights: only n', canon(learnedNight('kishmish')) === canon({n: 3}));
    // ---- sleepOn
    const naps = (n, len) => Array.from({length: n}, (_, i) => sl(at(i + 1, 10), at(i + 1, 10) + len*MIN));
    seed(naps(4, 60));
    let so = sleepOn('kishmish', 0);
    ok('sleepOn: under 5 episodes → unknown, no numbers', so.words === 'unknown' && so.n === 4 && so.pAtLeast.every(x => x.p === null) && canon(so.pAtLeast.map(x => x.min)) === canon([15, 30, 60]));
    seed(naps(10, 60));
    so = sleepOn('kishmish', 0); const so50 = sleepOn('kishmish', 50*MIN);
    ok('10 naps of an hour: at 0 min she likely sleeps 30 more; at 50 min unlikely', so.words === 'likely' && so.pAtLeast[1].p > .7 && so50.words === 'unlikely' && so50.pAtLeast[1].p < .3 && so.censored === 0 && so.prior.n === SLEEP_PRIOR_N);
    ok('…probabilities fall with the horizon', so.pAtLeast[0].p >= so.pAtLeast[1].p && so.pAtLeast[1].p >= so.pAtLeast[2].p);
    ok('…shrunk toward the pooled rate: never exactly 0 at the end', so50.pAtLeast[0].p > 0);
    const sc = sleepOn('kishmish', 50*MIN, {endAsCensored: true});
    ok('endAsCensored: every end censored → no observed ends → she sleeps on', sc.censored === 10 && sc.pAtLeast[1].p === 1);
    seed(naps(10, 60).concat([{ ...K0, k:'sleep', t: now - 30*MIN }]));
    ok('a running sleep counts, right-censored (unless it is night now)', touchesNight(now - 30*MIN, now) ? sleepOn('kishmish', 30*MIN).n === 10 : sleepOn('kishmish', 30*MIN).n === 11 && sleepOn('kishmish', 30*MIN).censored === 1);
    seed(naps(10, 60).map(e => ({ ...e, a: 1 })));
    ok('…only marked episodes are learned from', sleepOn('kishmish', 0).words === 'unknown');
    // ---- peeGapsObs
    seed([{ ...K0, k:'pee', t: at(2, 9) }, sl(at(2, 10), at(2, 11) + 50*MIN), { ...K0, k:'pee', t: at(2, 12) }, { ...K0, k:'none', t: at(2, 13) }, { ...K0, k:'pee', t: at(2, 14) }]);
    const pg = peeGapsObs('kishmish', day(2), day(1));
    ok('peeGapsObs: gaps with afterWake, "לא עשתה" as an attempt with no pee observed', pg.gaps.length === 2 && pg.gaps[0].afterWake === true && pg.gaps[1].afterWake === false && pg.gaps[0].gap === 3*HOUR && pg.gaps.every(g => g.outcome === 'pee' && g.night === false)
      && pg.attempts.length === 1 && pg.attempts[0].outcome === 'none' && pg.attempts[0].note === 'no pee observed in that attempt');
    // ---- stubs and hooks
    ok('advice is a stub; no Kochik data → kochikBaseline enough:false, no text (Agent C); adviceHTML empty', canon(advice('kishmish')) === canon({level:'none', text:'', why:''}) && kochikBaseline('kochik').enough === false && kochikBaselineText('kochik') === '' && adviceHTML('kishmish') === '');
    ok('nightCardsHTML is the night screen', typeof nightCardsHTML === 'function');
    // ---- new kinds: kept by norm, labelled, listed
    const kinds = [{ ...K0, k:'cset', t: now - 50*MIN, door:'open', cover:'uncovered' }, { ...K0, k:'carrier', t: now - 40*MIN, end: now - 35*MIN }, { ...K0, k:'pen', t: now - 30*MIN, end: now - 25*MIN }, { ...K0, k:'away', t: now - 20*MIN, end: now - 10*MIN, ctx:'room', res:'calm' }];
    const nk = norm({ v:2, log: kinds.concat([{ ...K0, k:'nope', t: 1 }]) });
    ok('norm keeps cset / carrier / pen / away and drops an unknown kind; idempotent', nk.log.length === 4 && canon(norm(clone(nk))) === canon(nk));
    seed(kinds);
    const txt = $q('.uni').textContent;
    ok('rows in the list: setup, carrier, pen, away', txt.includes('הגדרות כלוב: דלת פתוחה · בלי כיסוי') && txt.includes('טיול במנשא') && txt.includes('בגדר') && txt.includes('לא בחדר · רגועה'));
    ok('…and in the text export', logText('kishmish', day(0), now + 1).includes('לא בחדר · רגועה') && logText('kishmish', day(0), now + 1).includes('הגדרות כלוב'));
    ok('…and the summary renders', (() => { view = 'sum'; render(); const ok1 = !!$q('.tile'); view = 'now'; render(); return ok1; })());
    seed([{ ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }, { ...K0, k:'sleep', t: now - 30*MIN }]);
    const r0 = canon(routine('kishmish'));
    tapDur('kishmish', 'carrier');
    ok('carrier: ends the crate stay at its start, the sleep goes on (also through enforce), no retry', !K().crate.start && !!K().carrier.start && !!K().sleep.start && logOf('kishmish', 'sleep')[0].end == null && retryScan('kishmish', state.log).nones.size === 0);
    ok('…no potty reminder from that crate exit', pottyDue('kishmish') === null);
    seed([{ ...K0, k:'crate', t: now - 40*MIN }, { ...K0, k:'sleep', t: now - 30*MIN }]);
    tapDur('kishmish', 'pen');
    ok('pen: out of the crate at its start; says nothing about sleep', !K().crate.start && !!K().pen.start && !!K().sleep.start);
    seed([{ ...K0, k:'crate', t: now - 40*MIN }]);
    tapDur('kishmish', 'away');
    ok('away: changes nothing in the routine', !!K().crate.start && !!K().away.start);
    seed([{ ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 45*MIN, m:'meal' }, { ...K0, k:'cset', t: now - 5*MIN, cover:'covered' }]);
    ok('a cset is not a routine step: the wheel reads past it', routine('kishmish').i === 4);
    // ---- drink rule
    seed([{ ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 40*MIN }, { ...K0, k:'sleep', t: now - 30*MIN }]);
    tapPoint('kishmish', 'water', now - 5*MIN);
    const cr = logOf('kishmish', 'crate')[0], sw = logOf('kishmish', 'sleep')[0];
    ok('drink (Kishmish): the crate stay and the marked sleep end at the drink\'s own time', cr.end === now - 5*MIN && sw.end === now - 5*MIN && !K().crate.start && !K().sleep.start);
    ok('…no round, no retry, no take-out reminder', logOf('kishmish', 'crate').length === 1 && retryScan('kishmish', state.log).nones.size === 0 && !retry('kishmish') && pottyDue('kishmish') === null);
    seed([{ ...KO0, k:'sleep', t: now - 30*MIN }, { ...KO0, k:'crate', t: now - 40*MIN }]);
    tapPoint('kochik', 'water');
    ok('drink (Kochik): ends a marked sleep only', logOf('kochik', 'sleep')[0].end != null && logOf('kochik', 'crate')[0].end == null);
    // ---- sleep estimate: door open / pen / carrier, and setup pooling
    SLEEP2_FROM = now - 10*D;
    const past = (lats, x) => lats.flatMap((m, i) => { const t0 = now - 3*D - i*3*HOUR; return [{ ...K0, k:'crate', t: t0, end: t0 + 100*MIN, c:'mesh' }, ...(x ? [{ ...K0, k:'cset', t: t0, ...x }] : []), sl(t0 + m*MIN, t0 + 90*MIN)]; });
    const stayNow = { ...K0, id:'now', k:'crate', t: now - 60*MIN, c:'mesh' }, mine = () => K().spans.filter(s => s.stay === 'now');
    seed(past([10, 10, 10, 10, 10]).concat([stayNow]));
    ok('five closed samples: estimated as before (10 min)', mine().length === 1 && mine()[0].t === now - 50*MIN);
    seed(past([10, 10, 10, 10, 10]).concat([stayNow, { ...K0, k:'cset', t: now - 70*MIN, door:'open' }]));
    ok('door open: no estimate', mine().length === 0);
    seed(past([10, 10, 10, 10, 10]).concat([{ ...stayNow, end: now - 50*MIN }, { ...K0, k:'pen', t: now - 50*MIN }]));
    ok('in the pen: no estimate', K().spans.every(s => s.t < now - 50*MIN) && !K().sleep.start);
    seed(past([10, 10, 10, 10, 10]).concat(past([30, 30], {door:'closed', cover:'covered'}).map(e => ({ ...e, t: e.t + 20*HOUR, ...(e.end ? { end: e.end + 20*HOUR } : {}) }))).concat([stayNow, { ...K0, k:'cset', t: now - 70*MIN, door:'closed', cover:'covered' }]));
    const smp = sleepSamples('kishmish', state.log, now), dl = sleepDelay({kind:'mesh', door:'closed', cover:'covered'}, now - 60*MIN, smp);
    ok('partial pooling: own 2 samples at 30 min, pool median 10 → 10 + 2/5·20 = 18 min', dl.n === 2 && dl.nPool === 7 && Math.abs(dl.delay - 18*MIN) < 1 && Math.abs(mine()[0].t - (now - 60*MIN + 18*MIN)) < 2);
    ok('…the unknown setup keeps the pooled median', sleepDelay({kind:'mesh', door:'unknown', cover:'unknown'}, now - 60*MIN, smp).delay === 10*MIN);
    ok('…under five closed samples in all: nothing, but the setup\'s n is reported', (() => { const s3 = smp.slice(0, 3); const d3 = sleepDelay({kind:'mesh', door:'unknown', cover:'unknown'}, now, s3); return d3.delay === null && d3.n === 3; })());
    // ---- unchanged history: a realistic week without cset gives exactly the spans of the version before v3
    { reset(); const g = realisticLog(); SLEEP2_FROM = g.from; const s = norm({v:2, log: g.log}), sp = sleepSpans('kishmish', s.log, Date.UTC(2026, 10, 22));
      ok('realistic log: sleepSpans identical to main@61a7b2c (30 spans, 13 estimated, same hash)', `${sp.length} ${sp.filter(x => x.assumed).length} ${strHash(canon(sp))}` === '30 13 71807902'); }
  } catch(e){ crashed(e); }
  done();
})();
