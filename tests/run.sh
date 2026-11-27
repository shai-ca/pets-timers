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
fail=0; SK=$(mktemp); RAN=$(mktemp)
for clk in $CLOCKS; do
  echo "== clock $clk"
  rm -rf out && CLOCK=$clk python3 build.py >/dev/null || exit 2
  for f in out/*${1:-}*.html; do
    name=$(basename "$f" .html)
    win=$(grep -o '^// @window [0-9]*,[0-9]*' "cases/${name%.v2}.js" 2>/dev/null | cut -d' ' -f3)   # a page may ask for a window size (layout checks)
    for variant in $(grep -o '^// @variants .*' "cases/${name%.v2}.js" 2>/dev/null | cut -d' ' -f3-) ""; do
      title=$("$CHROME" --headless=new --disable-gpu --window-size=${win:-$WINDOW} --virtual-time-budget=${BUDGET:-8000} --dump-dom "file://$PWD/$f$variant" 2>/dev/null | tr '\n' ' ' | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
      case "$title" in "ALL PASS"*SKIPPED*) printf '  skip  %-22s %s\n' "$name$variant@$clk" "$title"; echo "$name$variant" >> "$SK" ;;
                       "ALL PASS"*) echo "$name$variant" >> "$RAN"; printf '  ok    %-22s %s\n' "$name$variant@$clk" "$title" ;; *) printf '  FAIL  %-22s %s\n' "$name$variant@$clk" "${title:0:600}"; fail=1 ;; esac
    done
  done
done
# a case that skipped itself must have really run under another clock, or the run fails
never=$(sort -u "$SK" | comm -23 - <(sort -u "$RAN")); echo "skipped under some clock: $(sort -u "$SK" | wc -l | tr -d ' ') page(s), all of them ran under another clock: $([ -z "$never" ] && echo yes || echo NO)"
[ -n "$never" ] && { echo "NEVER RAN: $never"; fail=1; }
rm -f "$SK" "$RAN"
[ $fail = 0 ] && echo "all tests passed" || echo "SOME TESTS FAILED"
exit $fail
