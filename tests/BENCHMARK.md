# Test runner benchmark (28.11.2026, overnight, camera services running)

Same snapshot (hash 75ad0c503cf8f0a5): 98 cases × 2 designs × 2 simulated clocks + variants = 412 pages.
Every arm: 362 ok · 50 skip (night clock; all ran under the day clock) · 0 fail.

| Runner | Wall time | Flaky / infra | Load avg (1 min) | Headless Chrome CPU / RAM max | Camera CPU avg / max | Free memory min |
|---|---|---|---|---|---|---|
| Old `run.sh` (27.11 logs, sequential) | 19–25 min | 1–2 flaky per run (camclip) | — | — | — | — |
| `prun.py` WORKERS=1 | 12.3 min (741 s) | 0 | 34.7 / max 50.7 | 52 % / 294 MB | 19.9 % / 234 %* | 8 % |
| `prun.py` WORKERS=2 (default) | 10.9 min (655 s) | 0 | 60.2 / max 81.1 | 53 % / 583 MB | 14.3 % / 31.6 % | 8 % |
| `prun.py` WORKERS=4 | 9.1 min (548 s) | 1 infra (blank page, passed on retry) | 84.1 / max 104.3 | 84 % / 1.1 GB | 13.2 % / 32.7 % | 9 % |
| Idle (no tests) | — | — | 20.0 | — | 16.4 % | 10 % |

\* one camera spike during the W=1 arm (camera-side work, not reproduced in the other arms).

CPU time is the same in every arm (≈ 640 s user + 400 s sys): the work does not shrink, parallelism only overlaps it,
and the machine is already loaded (idle load 20). The camera processes kept their CPU share in every arm (Chrome runs
at nice 10); memory pressure was already high at idle (free 10 %) and stayed within 1–2 points of it.

**Default: WORKERS=2.** It gives most of the safe gain with no flakes. 4 workers saves another 1.8 min but doubles Chrome
memory and produced one infrastructure flake under a load of ~84. Use `WORKERS=4` only when the camera is idle.

## What changed (tests/prun.py; run.sh now delegates to it)
- Immutable snapshot of index.html + tests (by content hash); editing the checkout mid-run cannot change what is tested.
- Build once per clock; isolated temporary Chrome profile per page; Chrome at nice 10.
- Infrastructure failures (timeout, blank page) are separate from test failures; every failed page is retried once,
  alone, and reported as flaky if it then passes. Page timeout 45 s.
- Results recorded per snapshot (`~/.cache/pets-timers-tests/<hash>/`); an interrupted full run resumes; a full pass
  writes `PASS`. `prun.py --check` → deploy.sh / preview.sh reuse it only for exactly the same sources.
- Kernel lock (flock): released automatically when a run dies, never removed by another run.
- camclip: waits for the media decoder's outcome (≤ 6 s) instead of a fixed 1.2 s. 10 consecutive runs: 80/80 pages ok.

## Per release (estimate)
Before: preview + deploy each ran the full suite (2 × ~20 min), plus reruns after mid-run edits or flakes
(27.11: 6 full runs ≈ 2 h). Now: one full run ≈ 11 min; preview and deploy reuse it by hash; a mid-run edit cannot
corrupt it. Saving ≈ 30 min per release in the normal case, more when reruns were needed.

## Remaining bottleneck
Starting a fresh Chrome per page (~1 s system time each). Reusing one browser with a fresh context per page (via the
DevTools protocol) would save most of it, but needs a CDP client and careful isolation; not done.
