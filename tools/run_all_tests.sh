#!/bin/sh
# Every test the project has, in one go (build first: python3 tools/build.py; serve dist on 8770). Prints one line per suite and exits non-zero on any failure.
cd "$(dirname "$0")/.." || exit 1
fail=0
run(){ name="$1"; shift; out=$("$@" 2>&1); code=$?; last=$(echo "$out" | grep -E "RESULT|ERRS" | tail -1); [ $code -ne 0 ] && fail=1; echo "$name: ${last:-exit $code}"; }
python3 tools/check_globals.py >/dev/null 2>&1 || { echo "check_globals: FAIL"; fail=1; }
for g in sports comics tcg; do run "shelltest $g" python3 tools/shelltest.py $g; done
run "playtest sports" python3 tools/playtest.py sports
run wildkintest python3 tools/wildkintest.py
run duskfalltest python3 tools/duskfalltest.py
run tidemarktest python3 tools/tidemarktest.py
run tidemark_ui_test python3 tools/tidemark_ui_test.py
run brokenreach_rules node tools/brokenreach/test.js
run brokenreach_play python3 tools/brokenreach_uitest.py
run test_art_pipeline python3 tools/test_art_pipeline.py
[ "$1" = "--golden" ] || [ "$2" = "--golden" ] && run golden python3 tools/golden/golden.py check
[ "$1" = "--econ2" ] || [ "$2" = "--econ2" ] && run tidemark_econ2_test python3 tools/tidemark_econ2_test.py --seeds=2   # about 20 minutes
exit $fail
