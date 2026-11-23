#!/bin/bash
# Test, publish, verify. The app is served from Firebase Hosting (https://pets-timers.firebaseapp.com);
# GitHub keeps the source, and its Pages copy only forwards to the Firebase address.
#   ./deploy.sh            run the tests, push, deploy, check the live site
# Needs: Google Chrome (tests), and `npx firebase-tools login` done once on this machine.
set -e
cd "$(dirname "$0")"
if [ -n "$(git status --porcelain)" ]; then echo "Commit your changes first (git status is not clean)."; exit 1; fi
echo "== tests"; tests/run.sh
mark=$(git rev-parse --short HEAD)
echo "== push ($mark)"; git push -q origin main
echo "== deploy"; npx -y firebase-tools deploy --only hosting --project pets-timers --non-interactive 2>&1 | grep -E "found|Deploy complete|Error" || true
want=$(shasum -a 256 index.html | cut -c1-16)
echo "== verify"
for i in $(seq 1 15); do
  got=$(curl -s "https://pets-timers.firebaseapp.com/?x=$RANDOM$i" | shasum -a 256 | cut -c1-16)
  gh=$(curl -s "https://shai-ca.github.io/pets-timers/?x=$RANDOM$i" | shasum -a 256 | cut -c1-16)
  [ "$got" = "$want" ] && [ "$gh" = "$want" ] && { echo "live on both addresses: $mark"; exit 0; }
  sleep 10
done
echo "NOT VERIFIED: firebase=$got github=$gh expected=$want"; exit 1
