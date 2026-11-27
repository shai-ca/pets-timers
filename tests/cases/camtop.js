// @window 520,1000
// Release 5 (owner, 27.11): on a phone (under 760 px, the real media query — FAKE_PHONE = null) Kishmish's camera image
// block (image, the line on it, "תמונה חדשה") is the FIRST thing on her full "מעקב" screen, above the alert cards,
// scores and wheel; the camera's questions stay in the crate card. Nothing overlaps, nothing overflows sideways, both
// designs. Kochik's screen, the night screen and מסך יונתן are unchanged. camtopw.js: the wide screen keeps the old place.
// Headless Chrome never fires the IntersectionObserver: fake `fb.camDoc` as camshared.js / camsnap.js do.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    window.KEEP_FOLDS = true; reset(); ['pets-timers-v1-cam', 'pets-timers-v1-camb', 'pets-timers-v1-camr'].forEach(k => localStorage.removeItem(k));
    FAKE_PHONE = null;   // the real media query at this window width
    const now = Date.now(), K0 = { p:'kishmish' };
    // 4 h without a meal: the red food card is on, so "above the alert cards" is really checked
    seed([{ ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 3*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 5*HOUR, end: now - 4.5*HOUR }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const B = { toBase64: () => IMG, toUint8Array: () => ({ length: 125 }) };
    const LATEST = { image: B, image_type:'image/jpeg', capture_ts: now - 40*MIN, detection:{ status:'positive' }, view:'full', w: 800, h: 450 };
    const SNAP = { schema:'cam-snapshot/1', image: B, image_type:'image/jpeg', view:'full', w: 800, h: 450, bytes: 125, capture_ts: now - 3*MIN, published_at: now - 3*MIN, ir: true, trigger:'periodic', request_ts: 0, sha256_16:'0123456789abcdef' };
    fb = { auth:{ currentUser:{ uid:'U1' } }, camReq: () => new Promise(() => {}), camGet: async () => null, camMerge: async () => {},
      camDoc: (n, on) => { if(n === 'latest') setTimeout(() => on(LATEST, false), 0); if(n === 'snapshot') setTimeout(() => on(SNAP, false), 0); if(n === 'status') setTimeout(() => on({ checked_at: Date.now() - MIN }, false), 0); return () => {}; } };
    const ra = camjActHTML; camjActHTML = () => '<div class="camjt" id="tq"><span><b>נכנסה לכלוב ב־12:00?</b><small>זיהוי מהמצלמה</small></span><span class="rt-a"><button class="btn">הייתה, דלת סגורה</button><button class="btn">לא הייתה בכלוב</button></span></div>';   // a camera question
    pet = 'kishmish'; view = 'now'; render(); await pause(80); await wait(3);
    const el = $q('.camc'); if(el) el.scrollIntoView(); await pause(250); await wait(3); render(); await pause(120); await wait(3);
    const rq = $q('[data-act=camreq]'); if(rq) rq.click(); await wait(3); await pause(60); await wait(3); window.scrollTo(0, 0);
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const inside = (a, b) => R(a).left >= R(b).left - 1 && R(a).right <= R(b).right + 1 && R(a).top >= R(b).top - 1 && R(a).bottom <= R(b).bottom + 1;
    const vis = x => getComputedStyle(x).display !== 'none' && R(x).height > 0;
    ok('a phone width (real media query)', isPhone() && innerWidth < 760);
    const top = $q('#side > .crcam.crtop'), img = top && top.querySelector('.cam-th'), o = top && top.querySelector('.crcam-ov'), l = top && top.querySelector('.camrq-l');
    const sk = [...$q('#side').children].filter(vis);
    // release 6b: the alert cards and the three answers (`.nowtop`) come first; then the image block, above everything else
    const nt = $q('#side > .nowtop');
    ok('the image block comes right after the alert cards and the top card', !!top && !!nt && sk.indexOf(top) === sk.indexOf(nt) + 1 && sk.slice(0, sk.indexOf(nt)).every(x => x.classList.contains('alertc')));
    ok('it is below the alert card and the top card, above the wheel and the tiles', !!top && !!$q('#side .card.alertc') && R(top).top >= R($q('#side .card.alertc')).bottom - 1 && R(top).top >= R(nt).bottom - 1 && R(top).bottom <= R($q('#side .card.cyc')).top + 1 && R(top).bottom <= R($q('#main')).top + 1);
    ok('nothing above it on the page but the header, the alerts and the top card', !!top && [...document.querySelectorAll('#side .card, #main .card')].every(c => c.closest('.crtop') || c.closest('.nowtop') || c.classList.contains('alertc') || R(c).top >= R(top).bottom - 1));
    ok('the image has real height, the full width of its block', !!img && R(img).height > 100 && R(img).width >= R(top).width - 24);
    ok('the line on the image (snapshot + IR) stays inside the image', !!o && inside(o, img) && o.textContent.includes('תמונה עדכנית מהמצלמה') && !!o.querySelector('.cam-ir'));
    ok('"תמונה חדשה" (pending) is in the block, under the image', !!l && inside(l, top) && R(l).top >= R(img).bottom - 1 && l.textContent.includes('מבקשת תמונה…'));
    ok('one camera card on the page (none left in the crate card)', document.querySelectorAll('.camc').length === 1 && !$q('#sec-crate .cam-th') && !$q('#sec-crate .crcam-img'));
    const q = $q('#tq');
    ok('the camera question is in the top card (release 6b), not in the image block or the crate card', !!q && !!q.closest('.nowtop') && !q.closest('.crtop') && !q.closest('#sec-crate'));
    const bad = []; for(let i = 0; i < sk.length; i++) for(let j = i + 1; j < sk.length; j++) if(over(R(sk[i]), R(sk[j])) > 4) bad.push((sk[i].id || sk[i].className) + ' × ' + (sk[j].id || sk[j].className));
    ok('no two cards of the side column overlap ' + bad.join(', '), !bad.length);
    const mk = [...$q('#main').children].filter(vis), bm = [];
    for(let i = 0; i < mk.length; i++) for(let j = i + 1; j < mk.length; j++) if(over(R(mk[i]), R(mk[j])) > 4) bm.push((mk[i].id || mk[i].className) + ' × ' + (mk[j].id || mk[j].className));
    ok('no two sections of the main column overlap ' + bm.join(', '), !bm.length && over(R($q('#side')), R($q('#main'))) === 0);
    const ck = [...$q('#sec-crate .card.item').children].filter(vis), bc = [];
    for(let i = 0; i < ck.length; i++) for(let j = i + 1; j < ck.length; j++) if(over(R(ck[i]), R(ck[j])) > 4) bc.push(ck[i].className + ' × ' + ck[j].className);
    ok('nothing inside the crate card overlaps ' + bc.join(', '), !bc.length);
    ok('nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1 && [...top.querySelectorAll('*')].every(x => R(x).right <= innerWidth + 1 && R(x).left >= -1));
    // a repaint of the card (new frame / request answered) keeps it at the top, patched in place
    CAMS.req = { at: Date.now(), st: 'late' }; camsPaint(); await wait(2);
    ok('a repaint patches the block at the top in place', $q('#side > .crcam.crtop') === top && document.querySelectorAll('.camc').length === 1 && top.querySelector('.camrq-l').textContent.includes('המצלמה לא ענתה'));
    // nothing published yet: only the watched slot, no empty box and no gap at the top
    { const s0 = CAMS.snap, d0 = CAMS.doc; CAMS.snap = null; CAMS.doc = null; render(); await wait(2);
      const sl = $q('#side > .crcam.crtop.slot'), first = [...$q('#side').children].filter(vis).find(x => !x.classList.contains('crtop'));
      ok('no image yet: only the 1 px watched slot (as in the crate card), no box and no gap above the alert card', !!sl && !!sl.querySelector('.camc') && R(sl).height <= 1 && !!first && first.classList.contains('alertc') && R(first).top - R($q('#side')).top <= 2);
      CAMS.snap = s0; CAMS.doc = d0; render(); await wait(2); }
    // Kochik's screen: no camera block
    pet = 'kochik'; render(); await wait(2);
    ok("Kochik's screen: no camera block", !$q('.crtop') && !$q('.camc'));
    pet = 'kishmish';
    // the night screen: no image, exactly as before (the crate tile never had one there)
    FAKE_HOUR = 2; render(); await wait(2);
    ok('the night screen: no camera block, no image', !$q('.crtop') && !$q('.cam-th'));
    FAKE_HOUR = 12;
    // מסך יונתן: its output does not depend on the phone layout, and it has no camera
    SIMPLE = true; render(); await wait(2); const sp = $q('#main').innerHTML, ss = $q('#side').innerHTML;
    FAKE_PHONE = false; render(); await wait(2);
    ok('מסך יונתן: identical on a phone and wide, no camera block', $q('#main').innerHTML === sp && $q('#side').innerHTML === ss && !$q('.crtop') && !$q('.cam-th'));
    SIMPLE = false; FAKE_PHONE = null;
    camjActHTML = ra; window.KEEP_FOLDS = false; camsUnsub(); fb = null; CAMS.doc = null; CAMS.snap = null; CAMS.status = null; CAMS.req = { at: 0, st: '' }; FAKE_PHONE = false; render();
    done();
  } catch(e){ crashed(e); }
})();
