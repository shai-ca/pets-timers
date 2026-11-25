// Kochik v3 (Agent C): kochikExpect (= the old kochikGap rules + the drink window), kochikGap as a wrapper,
// kochikBaseline (short / long / fixed refs, logging next to behaviour), kochikBaselineText, the Kochik drink rule.
// All synthetic data, no real entries; fixed dates, so nothing depends on the real clock.
// The kochikGap of main@8e6cae3, copied verbatim: kochikExpect / the wrapper must give the same answers.
function oldKochikGap(now){
  const L = state.log.filter(e => e.p==='kochik' && e.t <= now), from = now - PLAN.days*86400000;
  const ts = L.filter(e => e.k==='pee').map(e => e.t).sort((x,y) => x-y), g = [];
  for(let i = 1; i < ts.length; i++){ const a = ts[i-1], b = ts[i], d = b - a; if(b >= from && d >= 10*PL_M && d <= PLAN.kochikLong && !planNight(a, b)) g.push(d); }
  g.sort((x,y) => x-y);
  const sick = L.filter(e => e.t >= now - 24*PL_H && ((e.k==='poop' && e.q==='dia') || e.k==='vomit')).sort((x,y) => x.t-y.t).pop() || null;
  const cap = sick ? PLAN.kochikSick : PLAN.kochikMax, q = g.length >= PLAN.kochikMinGaps ? quantile(g, PLAN.kochikQ) : 0;
  return {gap: q ? Math.min(q, cap) : cap, q, n: g.length, g, cap, sick};
}
const D = 86400000, KO0 = {p:'kochik'};
const at = (y, m, d, h, mi) => new Date(y, m, d, h, mi || 0).getTime();
// A random sparse Kochik log (pees at any hour incl. night, some drinks, diarrhoea, vomiting) over `days` days.
function sparseLog(seedN, days, t0){
  const r = rng(seedN), out = [];
  for(let i = 0; i < days * 9; i++){
    const t = t0 + Math.floor(r() * days * D), x = r();
    out.push(x < .55 ? {...KO0, k:'pee', t} : x < .7 ? {...KO0, k:'water', t} : x < .8 ? {...KO0, k:'food', t} : x < .9 ? {...KO0, k:'poop', t, q: r() < .3 ? 'dia' : 'ok'} : x < .93 ? {...KO0, k:'vomit', t} : {...KO0, k:'treat', t, q:'reg'});
  }
  return out;
}
// A regular synthetic day: pees (the first `nPee` of the list), 2 drinks, 2 meals, a poop, both medicines.
const PEE_H = [7.5, 10, 12.5, 15, 17.5, 20, 22];
function dayOf(d0, nPee, opt){
  const o = opt || {}, h = x => d0 + Math.round(x * 60) * 60000, out = [];
  PEE_H.slice(0, nPee).forEach(x => out.push({...KO0, k:'pee', t: h(x), w:'out'}));
  if(o.half) return out.concat([{...KO0, k:'food', t: h(8)}]);   // only some things logged that day
  out.push({...KO0, k:'water', t: h(9)}, {...KO0, k:'water', t: h(16)}, {...KO0, k:'food', t: h(8)}, {...KO0, k:'food', t: h(18)},
    {...KO0, k:'poop', t: h(8.5), q: o.dia ? 'dia' : 'ok', w:'out'}, {...KO0, k:'med_am', t: h(8.25)}, {...KO0, k:'med_pm', t: h(20.5)});
  return out;
}
function daysLog(startTs, n, f){ const out = []; for(let i = 0; i < n; i++){ const d = new Date(startTs); d.setDate(d.getDate() + i); out.push(...dayOf(d.getTime(), ...f(i))); } return out; }
const J = x => JSON.stringify(x);
(async function(){
  try {
    reset('shai', 'kochik');
    // ---- kochikExpect: regression against the old kochikGap
    const T0 = at(2026, 9, 1, 0);
    let same = 0, tries = 0, wrap = 0;
    for(const sN of [3, 11, 29, 41, 57]){
      seed(sparseLog(sN, 10, T0));
      for(let k = 0; k < 12; k++){
        const now = T0 + 2*D + k * 17 * HOUR + sN * MIN, o = oldKochikGap(now), e = kochikExpect(now), w = kochikGap(now);
        tries++;
        if(e.gap === o.gap && e.n === o.n && e.cap === o.cap && e.sick === !!o.sick && e.src === (o.q ? 'learned' : 'cap')) same++;
        if(J(w) === J(o)) wrap++;
      }
    }
    ok(`kochikExpect gives the old kochikGap results on seeded logs (${same}/${tries})`, same === tries);
    ok(`kochikGap (wrapper) returns exactly the old shape and values (${wrap}/${tries})`, wrap === tries);
    const E0 = kochikExpect(T0 + 5*D);
    ok('kochikExpect keeps the contract\'s keys', ['gap','from','to','cap','sick','n','src'].every(k => k in E0) && Object.keys(E0).every(k => ['gap','from','to','cap','sick','n','src','drinkFrom','drinkTo'].includes(k)));
    // ---- learned gap, window, drink window, sick cap, few data
    const day = at(2026, 9, 10, 0), hr = x => day + x * HOUR;
    seed([7.5, 9, 10.5, 12, 13.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})));
    let e = kochikExpect(hr(16));
    ok('five 1.5 h daytime gaps: learned 1.5 h, window last pee + gap … + cap', e.src === 'learned' && e.n === 5 && e.gap === 1.5*HOUR && e.from === hr(16.5) && e.to === hr(17) && e.cap === 2*HOUR && !e.sick && !('drinkFrom' in e));
    seed([7.5, 9, 10.5, 12, 13.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})).concat([{...KO0, k:'water', t: hr(15.25)}]));
    e = kochikExpect(hr(16));
    ok('a drink after her last pee: drinkFrom / drinkTo = drink + 30 … 90 min', e.drinkFrom === hr(15.25) + 30*MIN && e.drinkTo === hr(15.25) + 90*MIN && e.gap === 1.5*HOUR);
    seed([7.5, 9, 10.5, 12, 13.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})).concat([{...KO0, k:'water', t: hr(14)}]));
    ok('a drink before her last pee opens no window', !('drinkFrom' in kochikExpect(hr(16))));
    seed([7.5, 10, 12.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})).concat([7.5, 10, 12.5, 15].map(x => ({...KO0, k:'pee', t: hr(x) - D}))));
    e = kochikExpect(hr(16));
    ok('2.5 h gaps: capped at 2 h', e.gap === 2*HOUR && e.src === 'learned' && e.to === hr(17));
    seed([7.5, 10, 12.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})).concat([7.5, 10, 12.5, 15].map(x => ({...KO0, k:'pee', t: hr(x) - D})), [{...KO0, k:'poop', t: hr(11), q:'dia'}]));
    e = kochikExpect(hr(16));
    ok('diarrhoea in the last 24 h: cap 1.5 h, sick', e.sick === true && e.cap === 1.5*HOUR && e.gap === 1.5*HOUR && e.to === hr(16.5));
    seed([7.5, 10, 12.5, 15].map(x => ({...KO0, k:'pee', t: hr(x)})).concat([{...KO0, k:'vomit', t: hr(9)}]));
    ok('vomiting counts the same way', kochikExpect(hr(16)).sick && kochikExpect(hr(16)).cap === 1.5*HOUR);
    ok('…and 24 h later it no longer does', !kochikExpect(hr(9) + 25*HOUR).sick);
    seed([{...KO0, k:'pee', t: hr(8)}, {...KO0, k:'pee', t: hr(9)}]);
    e = kochikExpect(hr(10));
    ok('few gaps: the cap alone (src cap)', e.src === 'cap' && e.gap === 2*HOUR && e.n === 1 && e.from === hr(11));
    seed([]);
    e = kochikExpect(hr(10));
    ok('no pee at all: no window', e.from === null && e.to === null && e.gap === 2*HOUR && e.src === 'cap');
    seed([20, 22, 25, 32, 33, 34, 35, 36].map(x => ({...KO0, k:'pee', t: hr(x)})));
    e = kochikExpect(hr(37));
    ok('night gaps (22:00→01:00, 01:00→08:00) are never read as holding ability', e.n === 5 && e.gap === HOUR);
    // ---- Kochik drink: ends a running marked sleep only
    seed([{...KO0, k:'sleep', t: Date.now() - 30*MIN}, {...KO0, k:'crate', t: Date.now() - 40*MIN}, {p:'kishmish', k:'sleep', t: Date.now() - 20*MIN}]);
    tapPoint('kochik', 'water');
    ok('Kochik drink: her marked sleep ends, her crate stay does not, Kishmish untouched', logOf('kochik', 'sleep')[0].end != null && logOf('kochik', 'crate')[0].end == null && logOf('kishmish', 'sleep')[0].end == null);
    seed([{...KO0, k:'crate', t: Date.now() - 40*MIN}]);
    tapPoint('kochik', 'water');
    ok('…with no sleep running, nothing else changes', logOf('kochik', 'crate')[0].end == null && logOf('kochik').length === 2);
    // ---- baseline: too little data
    const S = at(2026, 0, 4, 0);   // a Sunday
    const L10 = daysLog(S, 10, () => [7]);
    let b = kochikBaseline('kochik', at(2026, 0, 14, 12), {log: L10});
    ok('under 21 days: enough:false and no text', b.enough === false && kochikBaselineText('kochik', at(2026, 0, 14, 12), {log: L10}) === '' && b.short && b.short.pee.n === 7);
    ok('no entries at all: enough:false, nothing computed', kochikBaseline('kochik', at(2026, 0, 14, 12), {log: []}).enough === false && kochikBaselineText('kochik', at(2026, 0, 14, 12), {log: []}) === '');
    // ---- baseline: 45 steady days
    const L45 = daysLog(S, 45, () => [7]), N1 = at(2026, 1, 17, 12);   // Tue 17.2, day 44
    b = kochikBaseline('kochik', N1, {log: L45});
    ok('45 days: enough, short / long / first week computed', b.enough && b.days >= 21 && b.short.days === 7 && b.long.days === 30 && b.refs[0].id === 'first' && b.refs[0].days === 7);
    ok('…per-day means: 7 pees, 2 drinks, 2 meals, 1 poop', b.short.pee.mean === 7 && b.short.drink.mean === 2 && b.short.meal.mean === 2 && b.short.poop.mean === 1 && b.long.pee.mean === 7);
    ok('…pee gaps 2.5 h, no night gap among them', b.short.gap.med === 2.5*HOUR && b.short.gap.n === 7*6);
    ok('…meds given vs due, poop kinds, logging next to it', b.short.meds.due === 14 && b.short.meds.given === 14 && b.short.poopKind.ok === 7 && b.short.poopKind.dia === 0 && b.logging.short.daysWithPee === 7 && b.logging.short.entriesPerDay === 14);
    ok('…monthly refs: January 2026 (fixed calendar month)', b.refs.some(r => r.id === '2026-01' && r.label === 'ינואר 2026'));
    ok('…steady: "דומה לשבועות הקודמים"', kochikBaselineText('kochik', N1, {log: L45}) === 'דומה לשבועות הקודמים');
    const wd = x => new Date(x).getDay();
    const N2 = N1 + D;   // Wednesday, same week
    ok('the long baseline does not change between two days of the same week', wd(N1) === 2 && J(kochikBaseline('kochik', N2, {log: L45}).long) === J(b.long) && kochikBaseline('kochik', N2, {log: L45}).short.from === kbAdd(b.short.from, 1));
    const N3 = at(2026, 1, 22, 12);   // the next Sunday: it moves
    ok('…and moves on the week boundary', kochikBaseline('kochik', N3, {log: L45}).long.from === kbAdd(b.long.from, 7));
    // fixed refs never change when later data is added
    const L80 = daysLog(S, 80, i => [i < 45 ? 7 : 4, {dia: i >= 45}]);
    const b80 = kochikBaseline('kochik', at(2026, 2, 25, 12), {log: L80});
    const pick = (bb, id) => J(bb.refs.find(r => r.id === id));
    ok('fixed refs (first week, January) never change when later data is added', pick(b80, 'first') === pick(b, 'first') && pick(b80, '2026-01') === pick(b, '2026-01') && b80.refs.some(r => r.id === '2026-02'));
    // gradual decline: 8 → 5 pees over the first 35 days, then steady at 5
    const LD = daysLog(S, 75, i => [Math.max(5, 7 - Math.floor(i / 12))]);
    const nD = at(2026, 2, 19, 12), bD = kochikBaseline('kochik', nD, {log: LD});
    ok('gradual decline: the rolling 30 days has adapted (same) …', bD.cmp.long.m.pee.v === 'same' && kochikBaselineText('kochik', nD, {log: LD}) === 'דומה לשבועות הקודמים');
    ok('…but the first fixed week still shows it (less pee)', bD.cmp.first.m.pee.v === 'less' && bD.refs[0].pee.mean === 7 && bD.short.pee.mean === 5);
    // a logging drop is not a pee drop
    const LL = daysLog(S, 45, i => [i >= 38 ? 3 : 7, {half: i >= 38}]);
    const bL = kochikBaseline('kochik', N1, {log: LL});
    ok('logging drop: logging marked as not comparable', bL.cmp.long.logging === false && bL.logging.short.entriesPerDay < bL.logging.long.entriesPerDay / 1.5);
    ok('…text says "התיעוד השתנה…", never "פחות פיפי"', kochikBaselineText('kochik', N1, {log: LL}) === 'התיעוד השתנה, אי אפשר להשוות');
    // a real drop with comparable logging
    const LR = daysLog(S, 45, i => [i >= 38 ? 4 : 7]);
    const tR = kochikBaselineText('kochik', N1, {log: LR});
    ok('a real drop with comparable logging: "שונה … (פחות פיפי)"', tR === 'שונה מהשבועות הקודמים — כדאי לשים לב (פחות פיפי)');
    ok('no text ever says volume, a score or a diagnosis', ![tR, kochikBaselineText('kochik', N1, {log: L45})].some(t => /נפח|ציון|כמות|מחלה|אבחנה/.test(t)));
    // more diarrhoea
    const LP = daysLog(S, 45, i => [7, {dia: i >= 38}]);
    ok('more diarrhoea (same logging): named', kochikBaselineText('kochik', N1, {log: LP}) === 'שונה מהשבועות הקודמים — כדאי לשים לב (יותר שלשולים)');
    // weight and a medicine break
    const LW = L45.concat([{...KO0, k:'weight', t: at(2026, 1, 12, 9), kg: 3.4}, {...KO0, k:'medoff', t: at(2026, 1, 14, 9), end: at(2026, 1, 15, 9)}]);
    const bW = kochikBaseline('kochik', N1, {log: LW});
    ok('weight from weight entries; days on a medicine break are not due', bW.short.weight.n === 1 && bW.short.weight.last === 3.4 && bW.short.meds.due === 10);
    // the default list (state.log)
    seed(L45);
    ok('reads state.log by default', J(kochikBaseline('kochik', N1).short) === J(b.short));
    ok('the page still renders Kochik', !!tile('pee'));
    done();
  } catch(e){ crashed(e); }
})();
