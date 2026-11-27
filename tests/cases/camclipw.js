// @window 1280,900
// §17 clip evidence at a wide screen (the two-column grid): the same scenario as camclip.js (camClipSuite in lib.js).
(async function(){
  try { FAKE_PHONE = false; await camClipSuite(); ok('a wide screen', innerWidth >= 1200); done(); } catch(e){ crashed(e); }
})();
