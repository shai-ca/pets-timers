// @fake-sdk
// @variants #unsent
// Start-up keeps a change this phone has not sent yet (v3 fix): the list and its base are read before anything is
// derived — deriving that early used to throw for any list with a pee, the base was then skipped, and the unsent
// pee looked as if the server already had it (it was lost at the next server read).
(async function(){
  try {
    if(location.hash !== '#unsent'){ ok('nothing stored: an empty list', state.log.length === 0); done(); return; }
    ok('the stored list is loaded', state.log.some(e => e.id === 'u1'));
    ok('…and its base too: the pee is still waiting to be sent', base.log.length === 1 && diff(base, state).add.length === 1 && diff(base, state).add[0].id === 'u1');
    done();
  } catch(e){ crashed(e); }
})();
