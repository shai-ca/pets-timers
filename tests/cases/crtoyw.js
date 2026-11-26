// @window 1280,900
// The crate toy line at a desktop width (crtoy.js covers the phone): inside the crate card, nothing overlapping, no
// sideways overflow, the main column's sections still apart — in the crate with the toy hanging, and out with none.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const now = Date.now(), K0 = { p:'kishmish' };
    const R = e => e.getBoundingClientRect(), over = (x, y) => Math.max(0, Math.min(x.right, y.right) - Math.max(x.left, y.left)) * Math.max(0, Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top));
    const geo = label => {
      const card = $q('#sec-crate .card.item'), row = $q('#sec-crate .crtoy'), kids = [...card.children].filter(x => R(x).height > 0), bad = [];
      for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push(kids[i].className + ' × ' + kids[j].className);
      const bs = [...card.querySelectorAll('.crtoy button, .incr button')], bb = [];
      for(let i = 0; i < bs.length; i++) for(let j = i + 1; j < bs.length; j++) if(over(R(bs[i]), R(bs[j])) > 1) bb.push(bs[i].textContent + ' × ' + bs[j].textContent);
      const secs = [...$q('#main').children].filter(x => getComputedStyle(x).display !== 'none' && R(x).height > 0), sb = [];
      for(let i = 0; i < secs.length; i++) for(let j = i + 1; j < secs.length; j++) if(over(R(secs[i]), R(secs[j])) > 4) sb.push((secs[i].id || secs[i].className) + ' × ' + (secs[j].id || secs[j].className));
      ok(label + ': the toy line is there, inside the crate card', !!row && R(row).left >= R(card).left - 1 && R(row).right <= R(card).right + 1 && R(row).bottom <= R(card).bottom + 1 && R(row).height > 20);
      ok(label + ': nothing in the crate card overlaps ' + bad.join(', ') + bb.join(', '), !bad.length && !bb.length);
      ok(label + ': no two sections overlap ' + sb.join(', '), !sb.length);
      ok(label + ': nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1);
    };
    reset(); seed([{ ...K0, k:'crate', t: now - 20*MIN }, { ...K0, k:'toy', t: now - 10*MIN }, { ...K0, k:'pee', t: now - 30*MIN, w:'gravel' }]); await pause(50);
    geo(innerWidth + 'px, in the crate, toy hanging');
    seed([{ ...K0, k:'pee', t: now - 20*MIN, w:'gravel' }]); await pause(50);
    geo(innerWidth + 'px, out, no toy');
    done();
  } catch(e){ crashed(e); }
})();
