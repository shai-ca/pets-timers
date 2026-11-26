// @window 1280,900
// Camera snapshot (CAMERA-API §16) at a wide screen (the 2-column grid), both designs: the snapshot's label on the
// image, the IR badge and the "תמונה חדשה" line with a pending request stay inside the crate card; no two sections
// of the main column overlap, nothing overflows sideways. camsnap.js has the behaviour and the 520 px check.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    window.KEEP_FOLDS = true; reset(); ['pets-timers-v1-cam', 'pets-timers-v1-camb', 'pets-timers-v1-camr'].forEach(k => localStorage.removeItem(k));
    const now = Date.now(), K0 = { p:'kishmish' };
    seed([{ ...K0, k:'food', t: now - 2*HOUR, m:'meal' }, { ...K0, k:'pee', t: now - 50*MIN, w:'gravel' }, { ...K0, k:'poop', t: now - 3*HOUR, w:'gravel' }, { ...K0, k:'crate', t: now - 4*HOUR, end: now - 3*HOUR }]);
    const IMG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
    const B = { toBase64: () => IMG, toUint8Array: () => ({ length: 125 }) };
    const LATEST = { image: B, image_type:'image/jpeg', capture_ts: now - 40*MIN, detection:{ status:'positive' }, view:'full', w: 800, h: 450 };
    const SNAP = { schema:'cam-snapshot/1', image: B, image_type:'image/jpeg', view:'full', w: 800, h: 450, bytes: 125, capture_ts: now - 3*MIN, published_at: now - 3*MIN, ir: true, trigger:'periodic', request_ts: 0, sha256_16:'0123456789abcdef' };
    fb = { auth:{ currentUser:{ uid:'U1' } }, camReq: () => new Promise(() => {}), camGet: async () => null, camMerge: async () => {},
      camDoc: (n, on) => { if(n === 'latest') setTimeout(() => on(LATEST, false), 0); if(n === 'snapshot') setTimeout(() => on(SNAP, false), 0); if(n === 'status') setTimeout(() => on({ checked_at: Date.now() - MIN }, false), 0); return () => {}; } };
    pet = 'kishmish'; view = 'now'; render(); await pause(80); await wait(3);
    const el = $q('#sec-crate .camc'); if(el) el.scrollIntoView(); await pause(250); await wait(3); render(); await pause(120); await wait(3);
    const rq = $q('[data-act=camreq]'); if(rq) rq.click(); await wait(3); render(); await pause(60); await wait(3); window.scrollTo(0, 0);
    const R = e => e.getBoundingClientRect(), over = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const inside = (a, b) => R(a).left >= R(b).left - 1 && R(a).right <= R(b).right + 1 && R(a).top >= R(b).top - 1 && R(a).bottom <= R(b).bottom + 1;
    const ci = $q('#sec-crate .card.item'), img = $q('#sec-crate .crcam .cam-th'), o = $q('#sec-crate .crcam-ov'), l = $q('#sec-crate .camrq-l');
    ok('the snapshot is on the card, with its IR badge and a pending request', !!$q('.card.cams.cams-snap') && !!$q('#sec-crate .crcam-ov .cam-ir') && !!l && l.textContent.includes('מבקשת תמונה…'));
    ok('the label on the image stays inside the image', !!o && !!img && inside(o, img));
    ok('the request line is inside the crate card, under the image', !!l && inside(l, ci) && R(l).top >= R(img).bottom - 1 && over(R(l), R(img)) === 0);
    ok('the image is inside the crate card, never under the potty section', inside(img, ci) && over(R(img), R($q('#sec-potty'))) === 0);
    const kids = [...$q('#main').children].filter(x => getComputedStyle(x).display !== 'none' && R(x).height > 0), bad = [];
    for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++) if(over(R(kids[i]), R(kids[j])) > 4) bad.push((kids[i].id || kids[i].className) + ' × ' + (kids[j].id || kids[j].className));
    ok('no two sections of the main column overlap ' + bad.join(', '), !bad.length);
    ok('nothing overflows sideways', document.documentElement.scrollWidth <= innerWidth + 1);
    window.KEEP_FOLDS = false; camsUnsub(); fb = null; CAMS.doc = null; CAMS.snap = null; CAMS.status = null; CAMS.req = { at: 0, st: '' };
    done();
  } catch(e){ crashed(e); }
})();
