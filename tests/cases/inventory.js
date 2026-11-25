// THE NEW DESIGN LOSES NOTHING. For many situations, the screen is drawn in the old design and in the new one, and every
// control of the old screen (its action, kind, step jump, entry row, pet / view switch) must exist in the new screen and
// be reachable: visible, or folded behind that card's "עוד" (which is then on the screen). The same tile labels and the
// same "next pee" line must be there too. Runs once (the .v2 copy runs it too, with the same result).
(async function(){
  try {
    const now = Date.now(), late = now - midnight() > 400*MIN, K0 = {p:'kishmish'}, C0 = {p:'kochik'};
    if(!late){ ok('skipped (too close to midnight)', true); done(); return; }
    const key = b => [b.dataset.act, b.dataset.k, b.dataset.go, b.dataset.e != null ? 'e'+b.dataset.e : '', b.dataset.live, b.dataset.stay ? 'stay' : '', b.dataset.pet, b.dataset.view, b.dataset.day, b.id && b.closest('#shell') ? '#'+b.id : ''].map(x => x || '').join('|');
    const SEL = '#shell [data-act], #shell [data-go], #shell [data-e], #shell [data-live], #shell [data-stay], #shell [data-day], #shell button[id], .seg button';
    const shown = el => el.getClientRects().length > 0;
    const reach = el => shown(el) || (!!el.closest('.hint.x') && !!el.closest('.card.item') && shown(el.closest('.card.item').querySelector('[data-act=more]')));
    const snap = () => {
      const m = new Map();
      for(const el of document.querySelectorAll(SEL)){ const k = key(el); m.set(k, (m.get(k) || false) || reach(el)); }
      return { m, lbl: [...document.querySelectorAll('#shell .lbl')].map(x => x.textContent.trim()).sort().join(' / '), fc: [...document.querySelectorAll('#shell .fc')].map(x => x.textContent.trim()).join(' / ') };
    };
    const both = (name, setup) => {
      reset(); setup();
      V2 = false; render(); const a = snap();
      V2 = true; render(); const b = snap();
      const missing = [...a.m.keys()].filter(k => a.m.get(k) && !b.m.get(k));
      ok(`${name}: every control is in the new design (${a.m.size} checked)${missing.length ? ' — missing: ' + missing.join(', ') : ''}`, missing.length === 0 && a.m.size > 0);
      ok(`${name}: same tile labels and forecast lines`, a.lbl === b.lbl && a.fc === b.fc);
      V2 = false;
    };
    const day = [
      {...K0, k:'crate', t: now - 300*MIN, end: now - 200*MIN}, {...K0, k:'sleep', t: now - 290*MIN, end: now - 205*MIN},
      {...K0, k:'pee', t: now - 198*MIN, w:'gravel'}, {...K0, k:'play', t: now - 190*MIN, y:'rope'}, {...K0, k:'food', t: now - 180*MIN},
      {...K0, k:'poop', t: now - 170*MIN, w:'pad', q:'soft'}, {...K0, k:'water', t: now - 165*MIN}, {...K0, k:'none', t: now - 160*MIN},
      {...K0, k:'crate', t: now - 150*MIN, end: now - 90*MIN}, {...K0, k:'cry', t: now - 148*MIN, end: now - 140*MIN},
      {...K0, k:'pee', t: now - 89*MIN, w:'gravel'}, {...K0, k:'pee', t: now - 300*MIN - 3*HOUR, w:'gravel'}, {...K0, k:'pee', t: now - 300*MIN - 6*HOUR, w:'gravel'},
      {...K0, k:'pee', t: now - 300*MIN - 9*HOUR, w:'gravel'}, {...K0, k:'bath', t: now - 3*24*HOUR}];
    both('Kishmish, an empty day', () => seed([]));
    both('Kishmish, out after a full morning', () => seed(day));
    both('Kishmish, in the crate, awake', () => seed(day.concat([{...K0, k:'crate', t: now - 1*MIN}])));
    both('Kishmish, in the crate, estimated sleep', () => seed(day.concat([{...K0, k:'crate', t: now - 30*MIN}])));
    both('Kishmish, in the crate, marked sleep', () => seed(day.concat([{...K0, k:'crate', t: now - 30*MIN}, {...K0, k:'sleep', t: now - 20*MIN}])));
    both('Kishmish, crying in the crate', () => seed(day.concat([{...K0, k:'crate', t: now - 8*MIN}, {...K0, k:'cry', t: now - 6*MIN}])));
    both('Kishmish, "did she fall asleep?" card', () => { SLEEP2_FROM = now - 600*MIN; seed(day.concat([{...K0, k:'crate', t: now - 9*MIN, c:'mesh'}])); });
    both('Kishmish, on the gravel clock', () => seed(day.concat([{...K0, k:'gravel', t: now - 2*MIN}])));
    both('Kishmish, a retry running', () => seed(day.slice(0, 9).concat([{...K0, k:'none', t: now - 3*MIN}, {...K0, k:'crate', t: now - 3*MIN + 1}])));
    both('Kishmish, right after a meal and a bite', () => seed(day.concat([{...K0, k:'food', t: now - 20*MIN}, {...K0, k:'food', t: now - 5*MIN}])));
    both('Kishmish, overdue (food alert)', () => seed([{...K0, k:'food', t: now - 7*HOUR}, {...K0, k:'pee', t: now - 7*HOUR, w:'pad'}]));
    both('Kishmish, a break in the routine', () => seed(day.concat([{...K0, k:'brk', t: now - 5*MIN}])));
    both('Kishmish, night screen', () => { FAKE_HOUR = 23.5; seed(day.concat([{...K0, k:'crate', t: now - 30*MIN}])); });
    both('Kishmish, night screen opened in full', () => { FAKE_HOUR = 23.5; nightFull = true; seed(day.concat([{...K0, k:'crate', t: now - 30*MIN}])); });
    both('Kishmish, "עוד" opened on the pee tile', () => { seed(day); openX.add('kishmishpee'); });
    const ko = [{...C0, k:'food', t: now - 100*MIN}, {...C0, k:'pee', t: now - 90*MIN, w:'out'}, {...C0, k:'poop', t: now - 80*MIN, w:'out', q:'normal'},
      {...C0, k:'vomit', t: now - 2*24*HOUR, q:'bile'}, {...C0, k:'gel', t: now - 30*HOUR}, {...C0, k:'treat', t: now - 60*MIN, n:'עוף', fat:1}, {...C0, k:'med_am', t: now - 200*MIN}, {...C0, k:'water', t: now - 50*MIN}, {...C0, k:'bath', t: now - 12*24*HOUR}];
    both('Kochik, an ordinary day', () => { pet = 'kochik'; seed(ko); });
    both('Kochik, an empty day', () => { pet = 'kochik'; seed([]); });
    both('Kochik, medicines paused', () => { pet = 'kochik'; seed(ko.concat([{...C0, k:'medoff', t: now - 26*HOUR}])); });
    both('Kishmish, summary: day', () => { seed(day); view = 'sum'; sumMode = 'day'; sumAnchor = now; });
    both('Kishmish, summary: week', () => { seed(day); view = 'sum'; sumMode = 'week'; sumAnchor = now; });
    both('Kochik, summary: day', () => { pet = 'kochik'; seed(ko); view = 'sum'; sumMode = 'day'; sumAnchor = now; });
    // the switch itself, on both designs
    reset(); seed(day);
    V2 = false; render(); ok('the old design offers the new one at the bottom', $q('#dsw [data-act=v2]').textContent.includes('לנסות את העיצוב החדש') && !document.body.classList.contains('v2'));
    $q('#dsw [data-act=v2]').click();
    ok('one tap switches to the new design, and remembers it on this phone only', V2 && document.body.classList.contains('v2') && localStorage.getItem(LS_KEY + '-v2') === '1' && !JSON.stringify(state).includes('v2'));
    ok('the new design: the steps with arrows and a loop back; the day ribbon; a bar per round', $n('.flow .fs') === 5 && $n('.flow .ar') === 4 && !!$q('.loop') && !!$q('.ribbon .pbar') && $n('.uni .rbar') >= 2);
    $q('#dsw [data-act=v2]').click();
    ok('and back: the old design exactly (the wheel, no ribbon, no round bars)', !V2 && !document.body.classList.contains('v2') && !!$q('svg.ring') && !$q('.ribbon') && !$q('.rbar') && localStorage.getItem(LS_KEY + '-v2') === '0');
    done();
  } catch(e){ crashed(e); }
})();
