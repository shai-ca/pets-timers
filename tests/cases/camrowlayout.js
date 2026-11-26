// @window 520,900
// The review rows on a phone (owner's check of release 4, 26.11 night): a row's title and its times stay on one line
// ("נכנסה לכלוב 18:27", "(בין 14:31 ל־14:33)" — they were stacked one piece per line), the note sits under it, and
// no answer button is cut ("הייתה, דלת סגורה" was clipped).
(async function(){
  try {
    reset();
    const row = document.createElement('div'); row.className = 'sheet show'; row.style.width = '480px';
    row.innerHTML = `<div class="cjr"><span>נכנסה לכלוב <bdi dir="ltr">18:27</bdi>${camjWin(Date.now() - 2*MIN, Date.now())}<small>זיהוי מצלמה · לא נרשם עד שמאשרים</small></span>
      <div class="rt-a"><button class="go">הייתה, דלת סגורה</button><button class="btn">הייתה, דלת פתוחה</button><button class="btn">לא הייתה בכלוב</button><button class="btn">לא זוכרת</button></div></div>`;
    document.body.appendChild(row);
    const sp = row.querySelector('.cjr > span'), bd = [...sp.querySelectorAll('bdi')], sm = sp.querySelector('small');
    const top = el => Math.round(el.getBoundingClientRect().top);
    ok('the title and every time in it are on one line', bd.every(b => Math.abs(top(b) - top(bd[0])) <= 2));
    ok('the note is under the title', top(sm) > top(bd[0]) + 4);
    const cut = [...row.querySelectorAll('button')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent);
    ok('no answer button is cut ' + cut.join(', '), !cut.length);
    row.remove(); done();
  } catch(e){ crashed(e); }
})();
