// Owner, 28.11: missing camera coverage must be clearly distinct from observed inactivity. Unknown state + a camera that
// cannot read now → the line says why (stale / cannot decide); a fresh definite "not in the crate" is an observation; no
// camera at all → nothing about the camera. Nothing is written.
(async function(){
  try {
    reset(); const p = 'kishmish', T = Date.now(); seed([{ p, k:'pee', t: T - 3*HOUR, w:'gravel' }]); const log0 = JSON.stringify(state.log);
    const line = () => actualText(currentState(p)).replace(/<[^>]+>/g, '');
    CAMS.status = null; render();
    ok('no camera: unknown, nothing said about a camera', currentState(p).state === 'unknown' && !line().includes('מצלמה'));
    CAMS.status = { checked_at: T - 40*MIN, crate_now: { status: 'negative', capture_ts: T - 40*MIN } }; render();
    ok('stale camera: "המצלמה לא מעדכנת מאז …" — not read as "not in the crate"', currentState(p).state === 'unknown' && line().includes('המצלמה לא מעדכנת מאז') && !line().includes('לא בכלוב'));
    CAMS.status = { checked_at: T - 30000, crate_now: { status: 'uncertain', capture_ts: T - 30000 } }; render();
    ok('fresh but uncertain (e.g. night): "המצלמה לא יכולה לקבוע עכשיו"', currentState(p).state === 'unknown' && line().includes('המצלמה לא יכולה לקבוע עכשיו'));
    CAMS.status = { checked_at: T - 30000, crate_now: { status: 'negative', capture_ts: T - 30000 } }; render();
    ok('fresh definite reading: an observation ("לא בכלוב · לפי המצלמה"), no gap note', currentState(p).state === 'out' && line().includes('לפי המצלמה') && !line().includes('לא מעדכנת') && !line().includes('לא יכולה לקבוע'));
    ok('nothing written', JSON.stringify(state.log) === log0);
    CAMS.status = null; done();
  } catch(e){ crashed(e); }
})();
