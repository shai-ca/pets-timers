// @window 520,1000
// §17 clip evidence on a phone width (real media query): the approval cards and review rows keep their image as the
// thumbnail with a play button; nothing loads before a tap; one clip at a time, blob revoked; the actual footage times;
// every unavailable state said plainly; the answers stay visible; SHADOW. The scenario is camClipSuite in lib.js.
(async function(){
  try { FAKE_PHONE = null; await camClipSuite(); ok('a phone width (real media query)', innerWidth < 760); done(); } catch(e){ crashed(e); }
})();
