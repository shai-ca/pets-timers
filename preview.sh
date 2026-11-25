#!/bin/bash
# Publish THIS BRANCH's index.html at https://pets-timers.firebaseapp.com/preview/ (and ?sandbox), next to the live app.
#   ./preview.sh        run only by the owner, by hand. Never part of deploy.sh.
# Firebase Hosting replaces the whole site on every deploy, so this deploys a full copy of what is LIVE (main's files,
# from `git archive main`) with the branch's page added under preview/. It refuses unless the live page is byte-for-byte
# main's index.html — so the live app cannot change through this script — and unless the branch's page has the
# preview isolation (it never writes from /preview/). The next deploy.sh simply drops /preview/.
set -e
cd "$(dirname "$0")"
LIVE=https://pets-timers.firebaseapp.com
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" != main ] || { echo "On main: publish with deploy.sh. preview.sh is for a branch."; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commit your changes first (git status is not clean)."; exit 1; }
grep -q "applyMode(detectMode());" index.html && grep -q "ref = guardRef({" index.html \
  || { echo "This branch's index.html has no preview isolation (applyMode / guardRef). Nothing deployed."; exit 1; }
echo "== tests"; tests/run.sh
sum() { shasum -a 256 | cut -c1-16; }
live=$(curl -fsS "$LIVE/?x=$RANDOM" | sum); main=$(git show main:index.html | sum)
[ "$live" = "$main" ] || { echo "The live app is not main's index.html (live $live, main $main). Publish main with deploy.sh first. Nothing deployed."; exit 1; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
git archive main | tar -x -C "$tmp"                                   # the live site, exactly as main has it
mkdir -p "$tmp/preview"
cp index.html icon.svg icon-192.png apple-touch-icon.png "$tmp/preview/"   # the branch's page under /preview/
python3 - "$tmp/firebase.json" <<'PY'
import json, sys
p = sys.argv[1]; c = json.load(open(p)); h = c['hosting']
h['ignore'] = [x for x in h.get('ignore', []) if not x.startswith('preview')]
h.setdefault('headers', []).extend({'source': s, 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'}]} for s in ['/preview/', '/preview/index.html'])
json.dump(c, open(p, 'w'), indent=2)
PY
echo "== deploy (live = main $(git rev-parse --short main), preview = $branch $(git rev-parse --short HEAD))"
(cd "$tmp" && npx -y firebase-tools deploy --only hosting --project pets-timers --non-interactive 2>&1 | grep -E "found|Deploy complete|Error" || true)
want=$(sum < index.html)
for i in $(seq 1 15); do
  l=$(curl -s "$LIVE/?x=$RANDOM$i" | sum); p=$(curl -s "$LIVE/preview/?x=$RANDOM$i" | sum)
  [ "$l" = "$main" ] && [ "$p" = "$want" ] && { echo "preview: $LIVE/preview/  ·  sandbox: $LIVE/preview/?sandbox  ·  live unchanged"; exit 0; }
  sleep 10
done
echo "NOT VERIFIED: live=$l (want $main) preview=$p (want $want)"; exit 1
