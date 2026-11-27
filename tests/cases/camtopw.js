// @window 1280,900
// Release 5: at a wide screen (760 px and up, the real media query) the camera image block stays where it was — in
// the crate card, with its questions — and nothing is added to the side column. Both designs. camtop.js: the phone.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    window.KEEP_FOLDS = true; reset(); ['pets-timers-v1-cam', 'pets-timers-v1-camb', 'pets-timers-v1-camr'].forEach(k => localStorage.removeItem(k));
    FAKE_PHONE = null;
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 4*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 3*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 5*HOUR, end: now - 4.5*HOUR }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const B = { toBase64: () => IMG, toUint8Array: () => ({ length: 125 }) };
    const SNAP = { schema:'cam-snapshot/1', image: B, image_type:'image/jpeg', view:'full', w: 800, h: 450, bytes: 125, capture_ts: now - 3*MIN, published_at: now - 3*MIN, ir: false, trigger:'periodic', request_ts: 0, sha256_16:'0123456789abcdef' };
    fb = { auth:{ currentUser:{ uid:'U1' } }, camReq: () => new Promise(() => {}), camGet: async () => null, camMerge: async () => {},
      camDoc: (n, on) => { if(n === 'snapshot') setTimeout(() => on(SNAP, false), 0); if(n === 'status') setTimeout(() => on({ checked_at: Date.now() - MIN }, false), 0); return () => {}; } };
    const ra = camjActHTML; camjActHTML = () => '<div class="camjt" id="tq"><span><b>נכנסה לכלוב ב־12:00?</b></span><span class="rt-a"><button class="btn">הייתה, דלת סגורה</button></span></div>';
    pet = 'kishmish'; view = 'now'; render(); await pause(80); await wait(3);
    const el = $q('.camc'); if(el) el.scrollIntoView(); await pause(250); await wait(3); render(); await pause(120); await wait(3); window.scrollTo(0, 0);
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const inside = (a, b) => R(a).left >= R(b).left - 1 && R(a).right <= R(b).right + 1 && R(a).top >= R(b).top - 1 && R(a).bottom <= R(b).bottom + 1;
    ok('a wide screen (real media query)', !isPhone());
    const card = $q('#sec-crate .card.item'), img = $q('#sec-crate .crcam .cam-th');
    ok('no camera block in the side column', !$q('.crtop') && !$q('#side .camc'));
    ok('the image is inside the crate card, as before', !!img && R(img).height > 40 && inside(img, card) && over(R(img), R($q('#sec-potty'))) === 0);
    ok('the question is in the top card of the side column (release 6b), not under the image', !!$q('#tq') && !!$q('#tq').closest('#side .nowtop') && !$q('#sec-crate #tq'));
    ok('the row is the old markup without the live question (no part = the image + the door question)', crateCamRowHTML(pet) === crateCamRowHTML(pet, undefined) && !/crtop/.test(crateCamRowHTML(pet)) && !/id="tq"/.test(crateCamRowHTML(pet)));
    const kids = [...$q('#main').children].filter(x => getComputedStyle(x).display !== 'none' && R(x).height > 0), bad = [];
    for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push((kids[i].id || kids[i].className) + ' × ' + (kids[j].id || kids[j].className));
    ok('no two sections of the main column overlap ' + bad.join(', '), !bad.length);
    ok('nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1);
    camjActHTML = ra; window.KEEP_FOLDS = false; camsUnsub(); fb = null; CAMS.doc = null; CAMS.snap = null; CAMS.status = null; CAMS.req = { at: 0, st: '' }; FAKE_PHONE = false;
    done();
  } catch(e){ crashed(e); }
})();
