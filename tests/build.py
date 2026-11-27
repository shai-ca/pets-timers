#!/usr/bin/env python3
"""Builds one test page per file in tests/cases/ from ../index.html.

Each page is the real app with Firebase switched off (or replaced by a fake SDK when the case starts
with `// @fake-sdk`), followed by tests/lib.js and the case. A case reports through `document.title`:
"ALL PASS <n>" or the list of failed checks.
"""
import os, sys, glob, re
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'index.html'), encoding='utf-8').read()
out = os.path.join(here, 'out'); os.makedirs(out, exist_ok=True)
lib = open(os.path.join(here, 'lib.js'), encoding='utf-8').read()
fake = open(os.path.join(here, 'fake-sdk.js'), encoding='utf-8').read()
IMPORT = "const mods = await Promise.all(['app','auth','firestore'].map(m => import(`${FB_CDN}firebase-${m}.js`)));"
assert IMPORT in src, 'the SDK import line changed; update tests/build.py'
assert 'const FIREBASE_CONFIG = {' in src
CLOCK_ENV = os.environ.get('CLOCK', '')
def clock_shim(hhmm):
    """Date shifted so that "now" is today at hh:mm and keeps ticking: a test never depends on the wall clock."""
    if not hhmm: return ''
    h, m = (int(x) for x in hhmm.split(':'))
    return ("<script>(function(){var R=Date,d=new R();d.setHours(%d,%d,0,0);var off=d.getTime()-R.now();"
            "function D(){var a=[].slice.call(arguments);if(!(this instanceof D))return new R(R.now()+off).toString();"
            "return a.length?new (Function.prototype.bind.apply(R,[null].concat(a)))():new R(R.now()+off);}"
            "D.now=function(){return R.now()+off};D.UTC=R.UTC;D.parse=R.parse;D.prototype=R.prototype;window.Date=D;"
            "window.TEST_CLOCK='%02d:%02d';})();</script>" % (h, m, h, m))
for path in sorted(glob.glob(os.path.join(here, 'cases', '*.js'))):
    case = open(path, encoding='utf-8').read()
    own = re.search(r'^// @clock (\d{1,2}:\d{2})', case, re.M)
    pre = clock_shim(own.group(1) if own else CLOCK_ENV)
    hour = re.search(r'^// @hour (\d{1,2})', case, re.M); phone = re.search(r'^// @phone (true|false)', case, re.M)
    pre += '<script>' + ('window.TEST_HOUR=%s;' % hour.group(1) if hour else '') + ('window.TEST_PHONE=%s;' % phone.group(1) if phone else '') + '</script>'
    if case.lstrip().startswith('// @fake-sdk'):
        page = src.replace(IMPORT, "const mods = window.__offline ? await Promise.reject(1) : ['app','auth','firestore'].map(m => FAKE[m]);")
        page = page.replace('<script>\n// ---------- icons', '<script>\n' + fake + '\n// ---------- icons', 1)
    else:
        page = src.replace('const FIREBASE_CONFIG = {', 'const FIREBASE_CONFIG = null && {')
    page = page.replace('<head>', '<head>' + pre, 1)
    V2_READ = "try { V2 = localStorage.getItem(LS_KEY+'-v2') !== '0'; } catch(e){}"
    assert V2_READ in page, 'the design switch line changed; update tests/build.py'
    page = page.replace(V2_READ, 'V2 = false; /*v2read*/')   # the plain copy is the old design; the .v2 copy below forces the new one
    page = page.replace('</body>', '<script>\n' + lib + '\n</script>\n<script>\n' + case + '\n</script></body>')
    open(os.path.join(out, os.path.basename(path)[:-3] + '.html'), 'w', encoding='utf-8').write(page)
    # Every case runs again in the new design (the switch forced on), so both designs keep every action working.
    open(os.path.join(out, os.path.basename(path)[:-3] + '.v2.html'), 'w', encoding='utf-8').write(page.replace('V2 = false; /*v2read*/', 'V2 = true; /*v2read*/'))
print('built', len(glob.glob(os.path.join(out, '*.html'))), 'pages')
