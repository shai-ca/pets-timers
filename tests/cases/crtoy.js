// @window 520,1000
// The crate toy ("צעצוע תלוי", owner 27.11): a timer kind `toy` — hung / taken down — in the crate card under "קיבלה
// בכלוב". Environmental enrichment only: it must change no sleep estimate, meal, routine step, retry, reminder or play
// count. `toyAt` / `crateSetup().toy` read it for later analysis. Listed, exported, summarised and synced like the
// carrier / pen. Geometry at a phone width here; crtoyw.js at a desktop width.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const now = Date.now(), K0 = { p:'kishmish' };
    const row = () => $q('#sec-crate .crtoy'), btn = () => $q('#sec-crate .crtoy [data-act=dur][data-k=toy]');
    const crateBtn = () => $q('#sec-crate [data-act=dur][data-k=crate]');

    // ---- start / end and the state line ----
    reset(); seed([{ ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }, { ...K0, k:'crate', t: now - 20*MIN }]);
    ok('in the crate: "קיבלה בכלוב" unchanged, the toy line under it', [...$q('#sec-crate .incr').querySelectorAll('button')].map(b => b.textContent).join() === 'קונג ממולא,משטח ליקוק,ארוחה' && !!row() && btn().textContent === 'תליתי צעצוע' && !row().classList.contains('on'));
    btn().click();
    const toy = () => logOf('kishmish', 'toy');
    ok('"תליתי צעצוע": a running toy timer, and nothing else written', toy().length === 1 && toy()[0].end == null && state.log.length === 3 && !!K().toy.start && !!K().crate.start && $q('#toastMsg').textContent.includes('תליתי צעצוע'));
    ok('the line says it is hanging since when, and the button takes it down', row().classList.contains('on') && row().textContent.includes('צעצוע תלוי מ־' + clock(toy()[0].t)) && btn().textContent === 'הורדתי את הצעצוע');
    crateBtn().click();
    ok('she comes out: the stay ends, the toy is still hanging (removal is its own action)', !K().crate.start && toy()[0].end == null && !!row() && row().classList.contains('on') && !$q('#sec-crate .incr'));
    btn().click();
    ok('"הורדתי את הצעצוע": it ends, the line offers to hang it again', toy()[0].end != null && !K().toy.start && btn().textContent === 'תליתי צעצוע');
    $q('#undo').click(); ok('undo puts it back up', toy()[0].end == null && row().classList.contains('on'));
    btn().click();
    // out of the crate, door open / closed: always allowed
    reset(); seed([{ ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }, { ...K0, k:'cset', t: now - 40*MIN, door:'open' }]);
    ok('out of the crate, door open: offered', !K().crate.start && crateSetup('kishmish', now).door === 'open' && !!btn());
    btn().click(); ok('…and hung', !!K().toy.start); btn().click();
    seed([{ ...K0, k:'cset', t: now - 40*MIN, door:'closed' }, { ...K0, k:'crate', t: now - 20*MIN }]);
    btn().click(); ok('in the crate, door closed: hung as well', !!K().toy.start && crateSetup('kishmish', Date.now()).door === 'closed');
    // the usual "מתי?"
    reset(); seed([{ ...K0, k:'crate', t: now - 20*MIN }]); ASK_WHEN = true; btn().click();
    ok('with the usual "מתי?" sheet', bg.classList.contains('show') && sh.textContent.includes('תליתי צעצוע'));
    sh.querySelector('[data-m="10"]').click(); ASK_WHEN = false; close();
    ok('…a time in the past is kept', toy().length === 1 && Date.now() - toy()[0].t >= 9*MIN);

    // ---- toyAt / crateSetup().toy ----
    seed([{ ...K0, k:'toy', t: now - 60*MIN, end: now - 30*MIN }, { ...K0, k:'toy', t: now - 10*MIN }]);
    ok('toyAt: before, during, after, running', !toyAt('kishmish', now - 70*MIN) && toyAt('kishmish', now - 45*MIN) && !toyAt('kishmish', now - 20*MIN) && toyAt('kishmish', now - 5*MIN) && toyAt('kishmish', now) && !toyAt('kochik', now));
    ok('crateSetup carries it as toy: true / false', crateSetup('kishmish', now - 45*MIN).toy === true && crateSetup('kishmish', now - 20*MIN).toy === false && crateSetup('kishmish', now).toy === true);
    ok('toyAt reads a given list too', toyAt('kishmish', now - 45*MIN, [{ ...K0, k:'toy', t: now - 50*MIN }]) && !toyAt('kishmish', now - 45*MIN, []));

    // ---- no effect on anything derived ----
    const day = [
      { ...K0, k:'cset', t: now - 330*MIN, door:'closed' },
      { ...K0, k:'crate', t: now - 300*MIN, end: now - 240*MIN },
      { ...K0, k:'pee', t: now - 238*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 230*MIN }, { ...K0, k:'play', t: now - 225*MIN, y:'rope' },
      { ...K0, k:'crate', t: now - 220*MIN, end: now - 140*MIN }, { ...K0, k:'sleep', t: now - 200*MIN, end: now - 150*MIN },
      { ...K0, k:'play', t: now - 215*MIN, y:'kong' },
      { ...K0, k:'none', t: now - 135*MIN }, { ...K0, k:'crate', t: now - 134*MIN, end: now - 122*MIN },
      { ...K0, k:'pee', t: now - 121*MIN, w:'gravel' }, { ...K0, k:'food', t: now - 110*MIN }, { ...K0, k:'water', t: now - 100*MIN },
      { ...K0, k:'crate', t: now - 60*MIN }];
    const toys = [{ ...K0, k:'toy', t: now - 280*MIN, end: now - 250*MIN }, { ...K0, k:'toy', t: now - 205*MIN, end: now - 170*MIN }, { ...K0, k:'toy', t: now - 128*MIN, end: now - 125*MIN }, { ...K0, k:'toy', t: now - 45*MIN }];
    const snap = () => {
      const S = V.kishmish, o = {};
      for(const k of Object.keys(S)) if(!['toy', 'mealOf', 'retryStays', 'retryNones'].includes(k)) o[k] = S[k];
      const st = stats('kishmish', now - 12*HOUR, now + 1); delete st.toy;
      const sum = (to => [...to].map(x => x && x.t != null ? x.t : x))
      return JSON.stringify({ o, meals: [...S.mealOf.entries()].map(([e, k]) => e.t + k), rs: sum(S.retryStays || []), rn: sum(S.retryNones || []),
        routine: routine('kishmish'), retry: retry('kishmish'), due: pottyDue('kishmish'), free: freeTime('kishmish'), aw: awakeSince('kishmish'), st,
        ep: episodes('kishmish', now - 12*HOUR, now), samples: sleepSamples('kishmish', state.log, now).map(x => [x.t, x.lat, setupKey(x.setup)]),
        rounds: roundStarts('kishmish').map(r => r.t), advice: advice('kishmish'), alerts: alerts('kishmish').map(a => a.text) });
    };
    reset(); seed(day); const a = snap(); const spans = V.kishmish.spans.length;
    seed(day.concat(toys)); const b = snap();
    ok('the same derived day with or without toy entries: sleep (marked and estimated), meals, routine, retry, reminders, play counts, rounds, advice', a === b && spans > 2);
    ok('…estimated sleep is there to compare (not an empty check)', V.kishmish.spans.some(s => s.assumed));
    ok('…and the toy is not play, food or an event', stats('kishmish', now - 12*HOUR, now + 1).toy.n === 4 && logOf('kishmish', 'play').length === 2);
    // the same with the mesh-crate rules (own delay, five marked samples)
    SLEEP2_FROM = -Infinity;
    const marks = [0, 1, 2, 3, 4, 5].flatMap(i => [{ ...K0, k:'crate', t: now - (30 - i*3)*HOUR, end: now - (29 - i*3)*HOUR, c:'mesh' }, { ...K0, k:'sleep', t: now - (30 - i*3)*HOUR + 7*MIN, end: now - (29 - i*3)*HOUR - 5*MIN }]);
    const mt = [0, 2, 4].map(i => ({ ...K0, k:'toy', t: now - (30 - i*3)*HOUR + 3*MIN, end: now - (30 - i*3)*HOUR + 20*MIN }));
    seed(marks.concat(day)); const c = snap(); seed(marks.concat(day, mt, toys)); const d = snap();
    ok('…also with the mesh-crate rules (a toy hung before she fell asleep does not shorten her learned delay)', c === d);
    SLEEP2_FROM = Infinity;

    // ---- list, export, summary, norm, sync ----
    reset(); seed([{ ...K0, k:'toy', t: now - 90*MIN, end: now - 20*MIN }, { ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }]);
    const span = clock(now - 90*MIN) + '–' + clock(now - 20*MIN);
    ok('a row in the list: "צעצוע תלוי HH:MM–HH:MM"', [...document.querySelectorAll('.uni .r')].some(r => r.textContent.includes('צעצוע תלוי') && r.textContent.includes(span)));
    ok('in the text export', logText('kishmish', midnight(), midnight() + 24*HOUR).includes(span + '  צעצוע תלוי'));
    view = 'sum'; sumMode = 'day'; sumAnchor = Date.now(); render();
    ok('a summary row like the carrier / pen', !!$q('.xsum.toy') && $q('.xsum.toy').textContent.includes('צעצוע תלוי'));
    view = 'now'; render();
    ok('norm keeps it (running and ended)', norm({ v:2, log:[{ ...K0, k:'toy', t: now - HOUR }, { ...K0, k:'toy', t: now - 3*HOUR, end: now - 2*HOUR }] }).log.length === 2);
    { const S = fakeServer(norm({ v:2, log:[] })); onServer(S.read()); await wait();
      btn().click(); await wait(5);
      ok('sync: the hung toy reaches the server', S.doc.log.some(e => e.k === 'toy' && e.end == null));
      btn().click(); await wait(5);
      ok('…and so does taking it down', S.doc.log.some(e => e.k === 'toy' && e.end != null)); ref = null; }

    // ---- where it does NOT show ----
    reset(); seed([{ ...K0, k:'crate', t: now - 20*MIN }, { ...K0, k:'toy', t: now - 10*MIN }]);
    FAKE_HOUR = 2; render(); ok('not on the night screen', !!$q('.nightc') && !$q('.crtoy')); FAKE_HOUR = 12;
    SIMPLE = true; render(); ok('not on מסך יונתן', !!$q('.smp-h') && !$q('.crtoy')); SIMPLE = false;
    pet = 'kochik'; render(); ok('not for Kochik', !$q('.crtoy') && !$q('[data-k=toy]')); pet = 'kishmish'; render();

    // ---- geometry (phone) ----
    const R = e => e.getBoundingClientRect(), over = (x, y) => Math.max(0, Math.min(x.right, y.right) - Math.max(x.left, y.left)) * Math.max(0, Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top));
    const geo = label => {
      const card = $q('#sec-crate .card.item'), kids = [...card.children].filter(x => R(x).height > 0), bad = [];
      for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push(kids[i].className + ' × ' + kids[j].className);
      const r = R(row()), c = R(card), bs = [...row().querySelectorAll('button')].concat([...card.querySelectorAll('.incr button')]), bb = [];
      for(let i = 0; i < bs.length; i++) for(let j = i + 1; j < bs.length; j++) if(over(R(bs[i]), R(bs[j])) > 1) bb.push(bs[i].textContent + ' × ' + bs[j].textContent);
      ok(label + ': nothing in the crate card overlaps ' + bad.join(', ') + bb.join(', '), !bad.length && !bb.length);
      ok(label + ': the toy line lies inside the card, full width', r.left >= c.left - 1 && r.right <= c.right + 1 && r.bottom <= c.bottom + 1 && r.width > c.width * 0.7);
      ok(label + ': nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1);
    };
    window.KEEP_FOLDS = true; reset(); window.KEEP_FOLDS = false;
    seed([{ ...K0, k:'crate', t: now - 20*MIN }, { ...K0, k:'toy', t: now - 10*MIN }]); await pause(50);
    geo(innerWidth + 'px, in the crate, toy hanging');
    seed([{ ...K0, k:'pee', t: now - 20*MIN, w:'gravel' }]); await pause(50);
    geo(innerWidth + 'px, out, no toy');
    done();
  } catch(e){ crashed(e); }
})();
