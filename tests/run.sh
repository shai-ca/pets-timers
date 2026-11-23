#!/bin/bash
# Runs every test page in headless Chrome. Usage: tests/run.sh [name-filter]
# Exit code 0 only if every page reports "ALL PASS".
cd "$(dirname "$0")" || exit 2
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found; set CHROME=/path/to/chrome"; exit 2; }
rm -rf out && python3 build.py >/dev/null || exit 2
fail=0
for f in out/*${1:-}*.html; do
  name=$(basename "$f" .html)
  for variant in $(grep -o '^// @variants .*' "cases/$name.js" 2>/dev/null | cut -d' ' -f3-) ""; do
    title=$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=${BUDGET:-8000} --dump-dom "file://$PWD/$f$variant" 2>/dev/null | tr '\n' ' ' | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
    case "$title" in "ALL PASS"*) printf '  ok    %-22s %s\n' "$name$variant" "$title" ;; *) printf '  FAIL  %-22s %s\n' "$name$variant" "${title:0:600}"; fail=1 ;; esac
  done
done
[ $fail = 0 ] && echo "all tests passed" || echo "SOME TESTS FAILED"
exit $fail
