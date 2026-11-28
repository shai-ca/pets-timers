#!/usr/bin/env python3
"""Parallel, resumable test runner (replaces the body of tests/run.sh; same output lines).

Usage: tests/prun.py [name-filter]          env: WORKERS (default 2), CLOCKS ("12:00 02:00"), WINDOW ("800,600"),
       tests/prun.py --check                BUDGET (8000), PAGE_TIMEOUT (45 s), NO_RESUME=1, NO_LOCK=1
--check exits 0 only if a FULL run already passed for exactly the current index.html + tests/ (the snapshot hash).

Design (27.11 lessons):
- IMMUTABLE SNAPSHOT: index.html + the test sources are copied once into a temp dir named by their hash; editing the
  checkout during a run cannot change what is tested.
- BUILD ONCE per clock (out-<clock>), reused for the run and its retries.
- ISOLATION: every page is its own headless Chrome with its own temporary profile (no state shared between pages);
  workers only run pages in parallel. file:// pages, no ports.
- NICE: Chrome runs at nice 10 so the camera recorders keep priority; resources are sampled every 5 s.
- FAILURES: a page that times out or returns no title is an INFRA failure; a page that reports failed checks is a TEST
  failure. Every failed page is retried ONCE at the end, alone (workers=1): passing then = "flaky", reported.
- RESUME: each result is appended to ~/.cache/pets-timers-tests/<hash>/results.jsonl; a rerun of the same snapshot skips
  pages that already passed. A full pass writes PASS there (what --check / deploy.sh read).
- LOCK: fcntl.flock on one file for full runs — released by the kernel when the process dies, never by another run.
Exit: 0 all passed · 1 test failures · 2 setup error · 3 lock wait timed out · 4 infra failures only.
"""
import fcntl, glob, hashlib, json, os, re, shutil, subprocess, sys, tempfile, threading, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
CLOCKS = os.environ.get('CLOCKS', '12:00 02:00').split()
WINDOW = os.environ.get('WINDOW', '800,600'); BUDGET = os.environ.get('BUDGET', '8000')
WORKERS = max(1, int(os.environ.get('WORKERS', '2'))); PAGE_TIMEOUT = int(os.environ.get('PAGE_TIMEOUT', '45'))
CACHE = os.path.expanduser('~/.cache/pets-timers-tests')
SRC = ['index.html'] + sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(HERE, 'cases', '*.js'))) + \
      ['tests/lib.js', 'tests/build.py', 'tests/fake-sdk.js']

def snapshot_hash():
    h = hashlib.sha256()
    for rel in SRC:
        h.update(rel.encode()); h.update(open(os.path.join(ROOT, rel), 'rb').read())
    return h.hexdigest()[:16]

def main():
    args = sys.argv[1:]; check = '--check' in args; args = [a for a in args if a != '--check']
    filt = args[0] if args else ''; full = not filt
    if not os.access(CHROME, os.X_OK): print('Chrome not found; set CHROME=/path/to/chrome'); return 2
    hsh = snapshot_hash(); cdir = os.path.join(CACHE, hsh); os.makedirs(cdir, exist_ok=True)
    if check:
        ok = os.path.exists(os.path.join(cdir, 'PASS')); print(('PASS on record for ' if ok else 'no full pass for ') + hsh); return 0 if ok else 1
    lockf = None
    if full and not os.environ.get('NO_LOCK'):
        lockf = open(os.path.join(CACHE, 'run.lock'), 'w'); t0 = time.time(); said = False
        while True:
            try: fcntl.flock(lockf, fcntl.LOCK_EX | fcntl.LOCK_NB); break
            except BlockingIOError:
                if not said: print('waiting for another full test run to finish…'); said = True
                if time.time() - t0 > int(os.environ.get('LOCK_WAIT', '2400')): print('another full test run still holds the lock; not waiting any longer'); return 3
                time.sleep(5)
        lockf.write(str(os.getpid())); lockf.flush()
    # immutable snapshot
    snap = os.path.join(tempfile.gettempdir(), 'ptt-' + hsh)
    if not os.path.isdir(snap):
        tmp = snap + '.tmp%d' % os.getpid(); shutil.rmtree(tmp, ignore_errors=True)
        for rel in SRC:
            dst = os.path.join(tmp, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), dst)
        try: os.rename(tmp, snap)
        except OSError: shutil.rmtree(tmp, ignore_errors=True)   # another run made it first: identical content
    if snapshot_hash_dir(snap) != hsh: print('snapshot mismatch'); return 2
    # build once per clock
    for clk in CLOCKS:
        out = os.path.join(snap, 'tests', 'out-' + clk.replace(':', ''))
        if not os.path.isdir(out):
            b = os.path.join(snap, 'tests', 'out'); shutil.rmtree(b, ignore_errors=True)
            r = subprocess.run([sys.executable, os.path.join(snap, 'tests', 'build.py')], env={**os.environ, 'CLOCK': clk}, capture_output=True, text=True)
            if r.returncode: print(r.stdout + r.stderr); return 2
            os.rename(b, out)
    # jobs
    jobs = []
    for clk in CLOCKS:
        out = os.path.join(snap, 'tests', 'out-' + clk.replace(':', ''))
        for f in sorted(glob.glob(os.path.join(out, '*%s*.html' % filt))):
            name = os.path.basename(f)[:-5]; case = open(os.path.join(snap, 'tests', 'cases', name.replace('.v2', '') + '.js'), encoding='utf-8').read()
            w = re.search(r'^// @window (\d+,\d+)', case, re.M); var = re.search(r'^// @variants (.*)$', case, re.M)
            for v in (var.group(1).split() if var else []) + ['']:
                jobs.append({'key': f'{name}{v}@{clk}', 'name': name + v, 'clk': clk, 'url': 'file://' + f + v, 'win': w.group(1) if w else WINDOW})
    resf = os.path.join(cdir, 'results.jsonl'); done = {}
    if full and not os.environ.get('NO_RESUME') and os.path.exists(resf):
        for line in open(resf):
            try: r = json.loads(line)
            except ValueError: continue
            if r['st'] in ('ok', 'skip'): done[r['key']] = r
    todo = [j for j in jobs if j['key'] not in done]
    if done: print(f'resuming {hsh}: {len(done)} of {len(jobs)} pages already passed for this exact snapshot')
    stop = threading.Event(); samples = []; threading.Thread(target=sample, args=(stop, samples), daemon=True).start()
    lk = threading.Lock(); t0 = time.time(); results = dict(done)
    def run(j):
        r = page(j); line = fmt(r)
        with lk:
            print(line, flush=True); results[j['key']] = r
            if full:
                with open(resf, 'a') as fh: fh.write(json.dumps(r) + '\n')
        return r
    with ThreadPoolExecutor(WORKERS) as ex: list(ex.map(run, todo))
    # one retry, alone
    failed = [j for j in jobs if results[j['key']]['st'] in ('fail', 'infra')]; flaky = 0
    for j in failed:
        first = results[j['key']]; r = page(j)
        if r['st'] in ('ok', 'skip'):
            flaky += 1; r['flaky'] = first['title'][:200] or first['st']
            print(f"  flaky {j['name']}@{j['clk']} passed on retry; first ({first['st']}): {first['title'][:200]}", flush=True)
        else: print(fmt(r), flush=True)
        results[j['key']] = r
        if full:
            with open(resf, 'a') as fh: fh.write(json.dumps(r) + '\n')
    stop.set(); wall = time.time() - t0
    st = [results[j['key']]['st'] for j in jobs]
    sk = {j['name'] for j in jobs if results[j['key']]['st'] == 'skip'}; ran = {j['name'] for j in jobs if results[j['key']]['st'] == 'ok'}
    never = sorted(sk - ran)
    print(f"skipped under some clock: {len(sk)} page(s), all of them ran under another clock: {'yes' if not never else 'NO'}")
    if never: print('NEVER RAN: ' + ' '.join(never))
    nf, ni = st.count('fail'), st.count('infra')
    summ = {'hash': hsh, 'workers': WORKERS, 'pages': len(jobs), 'ok': st.count('ok'), 'skip': st.count('skip'), 'fail': nf, 'infra': ni,
            'flaky': flaky, 'resumed': len(done), 'wall_s': round(wall, 1), 'resources': summarize(samples)}
    print('summary ' + json.dumps(summ))
    with open(os.path.join(cdir, 'last-summary.json'), 'w') as fh: json.dump(summ, fh)
    if nf or never: print('SOME TESTS FAILED'); return 1
    if ni: print('INFRA FAILURES (pages that never reported)'); return 4
    if full:
        with open(os.path.join(cdir, 'PASS'), 'w') as fh: fh.write(json.dumps(summ))
    print('all tests passed'); return 0

def snapshot_hash_dir(snap):
    h = hashlib.sha256()
    for rel in SRC: h.update(rel.encode()); h.update(open(os.path.join(snap, rel), 'rb').read())
    return h.hexdigest()[:16]

def page(j):
    prof = tempfile.mkdtemp(prefix='ptt-prof-'); t = time.time()
    cmd = ['nice', '-n', '10', CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
           '--user-data-dir=' + prof, '--window-size=' + j['win'], '--virtual-time-budget=' + BUDGET, '--dump-dom', j['url']]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=PAGE_TIMEOUT); dom = p.stdout
    except subprocess.TimeoutExpired: dom = None
    finally: shutil.rmtree(prof, ignore_errors=True)
    m = re.search(r'<title>([^<]*)</title>', (dom or '').replace('\n', ' '))
    title = re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''
    st = 'infra' if dom is None or not title or title in ('קוצ׳יק וקישמיש',) else 'skip' if title.startswith('ALL PASS') and 'SKIPPED' in title else 'ok' if title.startswith('ALL PASS') else 'fail'
    return {'key': j['key'], 'name': j['name'], 'clk': j['clk'], 'st': st, 'title': title[:600] if dom is not None else 'TIMEOUT', 's': round(time.time() - t, 2)}

def fmt(r):
    tag = {'ok': 'ok  ', 'skip': 'skip', 'fail': 'FAIL', 'infra': 'FAIL'}[r['st']]
    return f"  {tag}  {(r['name'] + '@' + r['clk']):<22} {('INFRA: ' if r['st'] == 'infra' else '') + r['title']}"

CAM = re.compile(r'pets-camera|go2rtc|ffmpeg')
def sample(stop, out):
    while not stop.is_set():
        try:
            ps = subprocess.run(['ps', '-axo', 'pcpu,rss,command'], capture_output=True, text=True).stdout.splitlines()[1:]
            cam = sum(float(l.split(None, 2)[0]) for l in ps if CAM.search(l)); chrome = sum(float(l.split(None, 2)[0]) for l in ps if 'Google Chrome' in l and '--headless' in l)
            chrome_mb = sum(int(l.split(None, 2)[1]) for l in ps if 'Google Chrome' in l and '--headless' in l) / 1024
            vm = subprocess.run(['memory_pressure', '-Q'], capture_output=True, text=True).stdout
            free = re.search(r'free percentage:\s*(\d+)%', vm)
            out.append({'load1': os.getloadavg()[0], 'cam_cpu': cam, 'chrome_cpu': chrome, 'chrome_mb': chrome_mb, 'free_pct': int(free.group(1)) if free else None})
        except Exception: pass
        stop.wait(5)

def summarize(s):
    if not s: return {}
    k = lambda f: [x[f] for x in s if x.get(f) is not None]
    return {'n': len(s), 'load1_max': round(max(k('load1')), 1), 'load1_avg': round(sum(k('load1')) / len(s), 1),
            'chrome_cpu_avg': round(sum(k('chrome_cpu')) / len(s)), 'chrome_mb_max': round(max(k('chrome_mb'))),
            'cam_cpu_avg': round(sum(k('cam_cpu')) / len(s), 1), 'cam_cpu_max': round(max(k('cam_cpu')), 1),
            'free_pct_min': min(k('free_pct')) if k('free_pct') else None}

if __name__ == '__main__':
    sys.exit(main())
