#!/bin/bash
# Runs the test pages: tests/run.sh [name-filter]. The work is done by tests/prun.py (parallel, resumable, snapshot of
# the exact sources; see its header). WORKERS sets the parallelism; tests/run-seq.sh is the old sequential runner.
exec python3 "$(dirname "$0")/prun.py" "$@"
