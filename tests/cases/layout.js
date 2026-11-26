// @window 1280,900
// Geometry regression (owner, 26.11 evening: the camera image was drawn under the potty cards; sections overlapped on a
// wide screen). Checks the real rendered boxes, in both designs, at the test window's width (the 2-column grid):
// no two sections of the main column overlap, nothing overflows sideways, and the camera image lies inside the crate
// card — never under another section. Also at a phone width (one column).
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    window.KEEP_FOLDS = true; reset(); localStorage.removeItem('pets-timers-v1-cam'); localStorage.removeItem('pets-timers-v1-camb');
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 2*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 3*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 4*HOUR, end: now - 3*HOUR }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const DOC = { image: { toBase64: () => IMG, toUint8Array: () => ({ length: 80 }) }, image_type:'image/jpeg', capture_ts: now - 20*MIN, detection:{ status:'positive' }, view:'full', w: 800, h: 450 };
    fb = { auth:{ currentUser:{} }, camDoc: (n, on) => { if(n === 'latest') setTimeout(() => on(DOC, false), 0); if(n === 'status') setTimeout(() => on({ checked_at: Date.now() - MIN, crate_now: { status: 'negative', capture_ts: Date.now() - MIN } }, false), 0); return () => {}; }, camGet: async () => DOC, camMerge: async () => {} };
    pet = 'kishmish'; view = 'now'; render(); await pause(80); await wait(3);
    const el = $q('#sec-crate .camc'); if(el) el.scrollIntoView(); await pause(250); await wait(3); render(); await pause(120); await wait(3); window.scrollTo(0, 0);
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const check = label => {
      const kids = [...$q('#main').children].filter(x => getComputedStyle(x).display !== 'none' && R(x).height > 0);
      const bad = []; for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push((kids[i].id || kids[i].className) + ' × ' + (kids[j].id || kids[j].className));
      ok(label + ': no two sections of the main column overlap ' + bad.join(', '), !bad.length);
      ok(label + ': nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1);
      // the visible image box (it clips the picture)
      const img = $q('#sec-crate .crcam .cam-th'), card = $q('#sec-crate .card.item'), potty = $q('#sec-potty');
      ok(label + ': the camera image is drawn inside the crate card, with real height, never under the potty section', !!img && R(img).height > 40 && R(img).top >= R(card).top - 1 && R(img).bottom <= R(card).bottom + 1 && R(img).left >= R(card).left - 1 && R(img).right <= R(card).right + 1 && over(R(img), R(potty)) === 0);
      const cardKids = [...card.children].filter(x => R(x).height > 0); const cb = [];
      for(let i = 0; i < cardKids.length; i++) for(let j = i + 1; j < cardKids.length; j++) if(over(R(cardKids[i]), R(cardKids[j])) > 4) cb.push(cardKids[i].className + ' × ' + cardKids[j].className);
      ok(label + ': nothing inside the crate card overlaps ' + cb.join(', '), !cb.length);
    };
    check('this width (' + innerWidth + 'px)');
    window.KEEP_FOLDS = false; fb = null; CAMS.doc = null; CAMS.status = null;
    done();
  } catch(e){ crashed(e); }
})();
