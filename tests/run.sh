#!/bin/bash
# Runs every test page in headless Chrome. Usage: tests/run.sh [name-filter]
# Exit code 0 only if every page reports "ALL PASS".
cd "$(dirname "$0")" || exit 2
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found; set CHROME=/path/to/chrome"; exit 2; }
# Deterministic: every page runs under a simulated clock (CLOCKS, default a day run at 12:00 and a night run at 02:00;
# a case may pin its own with "// @clock HH:MM") and an explicit window (WINDOW, default 800,600 = the old implicit
# headless size; a case may ask for its own with "// @window W,H"). The wall clock never decides what is tested.
CLOCKS="${CLOCKS:-12:00 02:00}"; WINDOW="${WINDOW:-800,600}"
# One FULL run at a time across all worktrees: a lock directory, not process polling (two sessions that each waited
# for "no tests/run.sh in the process list" saw each other's waiting shells and never started). A filtered run does not
# lock. The lock is released on exit; a lock whose owner is gone is taken over; waiting gives up after LOCK_WAIT seconds.
LOCK="${TMPDIR:-/tmp}/pets-timers-tests.lock"
if [ -z "${1:-}" ] && [ -z "${NO_LOCK:-}" ]; then
  waited=0
  until mkdir "$LOCK" 2>/dev/null; do
    owner=$(cat "$LOCK/pid" 2>/dev/null)
    if [ -n "$owner" ] && ! kill -0 "$owner" 2>/dev/null; then rm -rf "$LOCK"; continue; fi   # stale: its owner is gone
    [ $waited -ge "${LOCK_WAIT:-2400}" ] && { echo "another full test run (pid ${owner:-?}) still holds the lock after ${waited}s; not waiting any longer"; exit 3; }
    [ $waited = 0 ] && echo "waiting for another full test run (pid ${owner:-?}) to finish…"
    sleep 10; waited=$((waited + 10))
  done
  echo $$ > "$LOCK/pid"; trap 'rm -rf "$LOCK"' EXIT INT TERM
fi
fail=0; flaky=0; SK=$(mktemp); RAN=$(mktemp)
for clk in $CLOCKS; do
  echo "== clock $clk"
  rm -rf out && CLOCK=$clk python3 build.py >/dev/null || exit 2
  for f in out/*${1:-}*.html; do
    name=$(basename "$f" .html)
    win=$(grep -o '^// @window [0-9]*,[0-9]*' "cases/${name%.v2}.js" 2>/dev/null | cut -d' ' -f3)   # a page may ask for a window size (layout checks)
    for variant in $(grep -o '^// @variants .*' "cases/${name%.v2}.js" 2>/dev/null | cut -d' ' -f3-) ""; do
      page(){ "$CHROME" --headless=new --disable-gpu --window-size=${win:-$WINDOW} --virtual-time-budget=${BUDGET:-8000} --dump-dom "file://$PWD/$f$variant" 2>/dev/null | tr '\n' ' ' | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g'; }
      title=$(page)
      # one retry for a page that failed: a timing flake under load passes the second time and is REPORTED as flaky
      # (never silently); a real failure fails twice
      case "$title" in "ALL PASS"*) ;; *) first=$title; title=$(page); case "$title" in "ALL PASS"*) echo "  flaky $name$variant@$clk passed on retry; first: ${first:0:200}"; flaky=$((flaky + 1)) ;; esac ;; esac
      case "$title" in "ALL PASS"*SKIPPED*) printf '  skip  %-22s %s\n' "$name$variant@$clk" "$title"; echo "$name$variant" >> "$SK" ;;
                       "ALL PASS"*) echo "$name$variant" >> "$RAN"; printf '  ok    %-22s %s\n' "$name$variant@$clk" "$title" ;; *) printf '  FAIL  %-22s %s\n' "$name$variant@$clk" "${title:0:600}"; fail=1 ;; esac
    done
  done
done
# a case that skipped itself must have really run under another clock, or the run fails
never=$(sort -u "$SK" | comm -23 - <(sort -u "$RAN")); echo "skipped under some clock: $(sort -u "$SK" | wc -l | tr -d ' ') page(s), all of them ran under another clock: $([ -z "$never" ] && echo yes || echo NO)"
[ -n "$never" ] && { echo "NEVER RAN: $never"; fail=1; }
rm -f "$SK" "$RAN"
[ $flaky -gt 0 ] && echo "flaky (passed on retry): $flaky page(s) — see the lines above"
[ $fail = 0 ] && echo "all tests passed" || echo "SOME TESTS FAILED"
exit $fail
