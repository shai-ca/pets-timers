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
for path in sorted(glob.glob(os.path.join(here, 'cases', '*.js'))):
    case = open(path, encoding='utf-8').read()
    if case.lstrip().startswith('// @fake-sdk'):
        page = src.replace(IMPORT, "const mods = window.__offline ? await Promise.reject(1) : ['app','auth','firestore'].map(m => FAKE[m]);")
        page = page.replace('<script>\n// ---------- icons', '<script>\n' + fake + '\n// ---------- icons', 1)
    else:
        page = src.replace('const FIREBASE_CONFIG = {', 'const FIREBASE_CONFIG = null && {')
    V2_READ = "try { V2 = localStorage.getItem(LS_KEY+'-v2') !== '0'; } catch(e){}"
    assert V2_READ in page, 'the design switch line changed; update tests/build.py'
    page = page.replace(V2_READ, 'V2 = false; /*v2read*/')   # the plain copy is the old design; the .v2 copy below forces the new one
    page = page.replace('</body>', '<script>\n' + lib + '\n</script>\n<script>\n' + case + '\n</script></body>')
    open(os.path.join(out, os.path.basename(path)[:-3] + '.html'), 'w', encoding='utf-8').write(page)
    # Every case runs again in the new design (the switch forced on), so both designs keep every action working.
    open(os.path.join(out, os.path.basename(path)[:-3] + '.v2.html'), 'w', encoding='utf-8').write(page.replace('V2 = false; /*v2read*/', 'V2 = true; /*v2read*/'))
print('built', len(glob.glob(os.path.join(out, '*.html'))), 'pages')
