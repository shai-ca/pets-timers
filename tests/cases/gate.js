// @fake-sdk
// @variants #offline #known
// The lock screen: nobody gets in without an allowed Google account; failures are explained.
(async function(){
  try {
    const pause = ms => new Promise(r => setTimeout(r, ms + 40)), g = document.getElementById('gate'), F = window.__fake;
    if(location.hash === '#offline'){ await pause(50); ok('offline and never signed in: locked, says so', !g.hidden && g.textContent.includes('אין חיבור')); }
    else if(location.hash === '#known'){
      ok('a phone that was allowed before opens at once', g.hidden);
      await pause(50); ok('…but it is signed out now, so it locks again', !g.hidden && !!g.querySelector('#gIn') && !localStorage.getItem('pets-timers-v1-authok'));
    } else {
      ok('locked while checking', !g.hidden);
      await pause(50); ok('signed out: sign-in screen', !g.hidden && !!g.querySelector('#gIn'));
      const keep = fb.signIn;
      fb.signIn = async () => { throw { code: 'auth/popup-closed-by-user' }; }; g.querySelector('#gIn').click(); await pause(20);
      ok('a sign-in that did not complete is explained', !g.querySelector('#gErr').hidden && g.querySelector('#gErr').textContent.includes('חלון ההתחברות נסגר'));
      fb.signIn = async () => { throw { code: 'auth/popup-blocked' }; }; g.querySelector('#gIn').click(); await pause(20);
      ok('blocked pop-up is explained', g.querySelector('#gErr').textContent.includes('חלונות קופצים'));
      fb.signIn = keep;
      F.deny = true; g.querySelector('#gIn').click(); await pause(50);
      ok('account not on the list: refused, with the email shown', !g.hidden && g.textContent.includes('someone@example.com') && !!g.querySelector('#gOut'));
      g.querySelector('#gOut').click(); await pause(50); ok('switch account goes back to sign-in', !!g.querySelector('#gIn'));
      F.deny = false; g.querySelector('#gIn').click(); await pause(50);
      ok('allowed account: unlocked and remembered', g.hidden && localStorage.getItem('pets-timers-v1-authok') === 'someone@example.com');
      fb.signOut(); await pause(50); ok('signing out locks', !g.hidden && !localStorage.getItem('pets-timers-v1-authok'));
    }
    done();
  } catch(e){ crashed(e); }
})();
