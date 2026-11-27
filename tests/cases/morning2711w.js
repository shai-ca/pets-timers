// @clock 06:30
// @window 1280,900
// The desktop layout of the day's ribbon with its "לא תועד" part, on the replica of her 27.11 morning (morning2711.js
// has the phone one and the requirements). New design only draws the ribbon; the old design checks the sleep line.
(async function(){
  try {
    reset(); FAKE_HOUR = null; FAKE_PHONE = null; SLEEP2_FROM = Date.UTC(2026, 10, 24, 10, 8);
    const p = 'kishmish', log0 = JSON.stringify(seed(morning2711()).log);
    ok('desktop: not the phone layout (' + innerWidth + ' px)', !isPhone());
    if(V2){
      const rb = $q('.ribbon'), boxes = [...rb.querySelectorAll('.rtot > div')], top = boxes.map(b => b.getBoundingClientRect().top), u = rb.querySelector('.pt.unk'), r = u.getBoundingClientRect();
      ok('four totals in a row, nothing sticks out, no horizontal scroll', boxes.length === 4 && top.every(x => Math.abs(x - top[0]) < 2) && boxes.every(b => b.scrollWidth <= b.clientWidth + 1) && document.documentElement.scrollWidth <= innerWidth + 1);
      ok('the unknown part is visible on the bar (' + Math.round(r.width) + ' px) and the legend is on screen', r.width > 100 && r.height > 8 && rb.querySelector('.rlg2').getBoundingClientRect().width > 0);
      u.dispatchEvent(new MouseEvent('pointerover', {bubbles:true}));
      ok('hovering it writes "לא תועד" and its times', rb.querySelector('.pbar .ptip').textContent.startsWith('לא תועד'));
    } else ok('old design: the sleep tile names the undocumented hours', $q('#sec-rest .card.item').textContent.includes('שעות ללא תיעוד'));
    ok('nothing written', JSON.stringify(state.log) === log0);
    done();
  } catch(e){ crashed(e); }
})();
