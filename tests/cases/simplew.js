// @window 1280,900
// "מסך יונתן" at a desktop width (simple.js covers the phone): one narrow centred column, nothing overlapping, nothing
// overflowing sideways, large tap targets — idle, with an outing running and with a retry countdown.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const now = Date.now(), K0 = { p:'kishmish' };
    const spl = k => $q('#main [data-act=spl][data-k=' + k + ']');
    const ageG = () => { const g = logOf('kishmish', 'gravel').find(e => e.end == null); if(g){ g.t -= MIN; use(state); render(); } };
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const geo = label => {
      const kids = [...$q('#main').children].filter(x => R(x).height > 0), bad = [];
      for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push(kids[i].className + ' × ' + kids[j].className);
      const btns = [...$q('#main').querySelectorAll('button')], bb = [];
      for(let i = 0; i < btns.length; i++) for(let j = i + 1; j < btns.length; j++) if(over(R(btns[i]), R(btns[j])) > 1) bb.push(btns[i].textContent + ' × ' + btns[j].textContent);
      const m = R($q('#main')), small = btns.filter(b => b.dataset.act === 'spl' && (R(b).height < 52 || R(b).width < 100)).map(b => b.textContent);
      const outside = btns.filter(b => R(b).left < m.left - 1 || R(b).right > m.right + 1).map(b => b.textContent);
      ok(label + ': no two parts overlap ' + bad.join(', '), !bad.length);
      ok(label + ': no two buttons overlap ' + bb.join(', '), !bb.length);
      ok(label + ': nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1 && !outside.length);
      ok(label + ': large tap targets ' + small.join(', '), !small.length);
      ok(label + ': one narrow column, centred, no side column (' + Math.round(m.width) + 'px)', m.width <= 561 && m.width > 400 && Math.abs((m.left + m.right) / 2 - innerWidth / 2) < 40 && getComputedStyle($q('#side')).display === 'none');
      ok(label + ': below the top bar', m.top >= R($q('.seg')).bottom - 1);
    };
    reset(); SIMPLE = true;
    seed([{ ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }]); await pause(50);
    geo(innerWidth + 'px, idle (with the food alert)');
    spl('gravel').click(); ageG(); spl('pee').click(); close(); await pause(50);
    geo(innerWidth + 'px, outing running');
    reset(); SIMPLE = true; seed([{ ...K0, k:'pee', t: now - 3*HOUR, w:'gravel' }]); spl('gravel').click(); ageG(); spl('none').click(); await pause(50);
    ok('the retry countdown is on the screen', !!$q('.smp-rt'));
    geo(innerWidth + 'px, retry countdown');
    done();
  } catch(e){ crashed(e); }
})();
