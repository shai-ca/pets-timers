// Summary, charts, filter, forecast, today's counts, text export — all computed from the list.
(async function(){
  try {
    reset();
    const now = Date.now(), m0 = midnight(), R = rng(7), W = ['gravel','gravel','pad','floor','crate','gravel', undefined], L = [], P = 'kishmish';
    for(let d = 6; d >= 0; d--){
      const a = m0 - d*24*HOUR;
      L.push({ p:P, k:'crate', t: a - HOUR, end: a + 6.5*HOUR }, { p:P, k:'sleep', t: a - 0.5*HOUR, end: a + 6.3*HOUR });
      for(const fh of [7, 12.5, 18]){ L.push({ p:P, k:'food', t: a + fh*HOUR }); L.push({ p:P, k:'poop', t: a + fh*HOUR + (15 + R()*20)*MIN, w: W[Math.floor(R()*7)] }); }
      for(let hh = 6.7; hh < 22; hh += 0.9 + R()*0.6) L.push({ p:P, k:'pee', t: Math.round(a + hh*HOUR), w: W[Math.floor(R()*(d > 3 ? 7 : 3))] });
      L.push({ p:P, k:'crate', t: a + 9*HOUR, end: a + 10.5*HOUR }, { p:P, k:'cry', t: a + 9*HOUR, end: a + 9*HOUR + 4*MIN });
    }
    seed(L.filter(e => e.t < now && (e.end || 0) < now));
    const hints = [...document.querySelectorAll('.sub.hint')].map(e => e.textContent).join(' | ');
    ok('usual gap between pees and meal-to-poop time are shown', /בדרך כלל (כל|מחזיקה)/.test(hints) && hints.includes('אחרי אוכל'));
    ok('today\'s count by place on the tiles (when there is something today)', !logOf(P, 'pee').some(e => e.t >= m0) || hints.includes('היום: '));
    const f = peeForecast(P); ok('forecast window: last pee + the middle half of her gaps', f && f.from > K().pee && f.to >= f.from && !!$q('.sub.fc'));
    view = 'sum'; sumMode = 'week'; sumAnchor = now - 24*HOUR; render();
    const dots = $n('.tl-t .d');
    ok('week: timeline with dots, bands and meal ticks; where chart', dots > 10 && $n('.tl-t .b.crate') > 0 && $n('.tl-t .f') > 0 && $n('.wb-c') >= 1 && !!$q('.tl-t .d.pee.out'));
    $q('.tl-t .d').click(); ok('tapping a dot opens that entry', bg.classList.contains('show') && sh.querySelectorAll('[data-w]').length === 4); close();
    $q('.tile[data-k=pee]').click();
    ok('filter on pee: only pee everywhere', !!$q('.tile.on[data-k=pee]') && $n('.tl-t .d.poop') === 0 && $n('.tl-t .b') === 0 && $n('.tbl th') === 2 && [...document.querySelectorAll('.card.log .r')].every(r => r.textContent.includes('פיפי')));
    $q('.tile[data-k=crate]').click();
    ok('filter on crate: bands only, no where chart', $n('.tl-t .b.crate') > 0 && $n('.tl-t .d') === 0 && !$q('.wb'));
    $q('.tile[data-k=crate]').click(); ok('tap again clears the filter', !$q('.tile.on') && $n('.tl-t .d') === dots);
    sumMode = 'month'; render(); ok('month: where chart only', !$q('.tl-t') && $n('.wb-c') >= 1);
    sumMode = 'day'; sumAnchor = m0 - 24*HOUR + HOUR; render();
    ok('day: one timeline row and the entries grouped by round', $n('.tl-t') === 1 && !!$q('.card.log.uni') && $q('.uni').textContent.includes('סבב 1'));
    // a running timer counts in the totals and in the text
    const day = m0 - 24*HOUR, text = logText(P, day, day + 24*HOUR), lines = text.split('\n');
    ok('text export: heading, day, entries in order with times, total line', lines[0] === 'קישמיש — יומן' && lines[2].startsWith('יום ') && /\n09:00–10:30  בכלוב · שעה ו־30 דק׳/.test(text) && text.includes('09:00–09:04  בכתה · מחאה · 4 דקות') && text.includes('07:00  אכלה') && lines.slice(3, -1).every((l, i, a) => !i || l.slice(0, 5) >= a[i-1].slice(0, 5)) && /סה״כ: .*כלוב .*פיפי \d+/.test(text));
    let got = ''; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { got = t; } }, configurable: true });
    $q('[data-act=copylog]').click(); await new Promise(r => setTimeout(r, 30));
    ok('copy puts exactly that text on the clipboard', got === text && document.getElementById('toastMsg').textContent.includes('הועתק'));
    view = 'now'; tapDur(P, 'sleep', now - 20*MIN);
    const st = stats(P, m0, m0 + 24*HOUR);
    const inSeededStay = now > m0 + 9*HOUR && now - 20*MIN < m0 + 10.5*HOUR;   // the day's seeded crate stay is 09:00–10:30: a sleep begun in it ends with it
    ok('a running timer is counted up to now', (now - m0 > 30*MIN && !inSeededStay) ? (st.sleep.ms >= 19*MIN && logText(P, m0, m0 + 24*HOUR).includes('–עכשיו  ישנה')) : true);
    pet = 'kochik'; view = 'sum'; sumMode = 'week'; sumFilter = 'crate'; render(); ok('a filter the pet does not have is ignored', !$q('.tile.on')); sumFilter = null;
    done(hints);
  } catch(e){ crashed(e); }
})();
