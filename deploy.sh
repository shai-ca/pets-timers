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
lv=$(grep -o '^const LOGIC_VERSION = [0-9]*' index.html | grep -o '[0-9]*$'); [ -n "$lv" ] || { echo "LOGIC_VERSION missing in index.html"; exit 1; }
printf '{"schema":"app-version/1","commit":"%s","logic_version":%s,"released_at":%s}\n' "$mark" "$lv" "$(($(date +%s) * 1000))" > version.json   # CAMERA-API §19
trap 'rm -f version.json' EXIT
echo "== deploy"; npx -y firebase-tools deploy --only hosting --project pets-timers --non-interactive 2>&1 | grep -E "found|Deploy complete|Error" || true
want=$(shasum -a 256 index.html | cut -c1-16)
echo "== verify"
for i in $(seq 1 15); do
  got=$(curl -s "https://pets-timers.firebaseapp.com/?x=$RANDOM$i" | shasum -a 256 | cut -c1-16)
  gh=$(curl -s "https://shai-ca.github.io/pets-timers/?x=$RANDOM$i" | shasum -a 256 | cut -c1-16)
  if [ "$got" = "$want" ] && [ "$gh" = "$want" ]; then
    vj=$(curl -s "https://pets-timers.firebaseapp.com/version.json?x=$RANDOM$i")
    case "$vj" in *"\"commit\":\"$mark\""*) echo "live on both addresses: $mark · version.json: $vj"; exit 0 ;; esac
  fi
  sleep 10
done
echo "NOT VERIFIED: firebase=$got github=$gh expected=$want"; exit 1
