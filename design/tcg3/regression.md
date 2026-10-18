# Regression run on the existing games (2026-10-18)

Rift Parade is isolated (`tools/rift-parade/`, `design/tcg3/`); nothing in `src/`, `tools/build.py` or the other games was changed (`git diff origin/main --stat` shows only those two folders). The existing tests were run anyway, with the commands found in `CLAUDE.md`, after `python3 tools/build.py` (all three games) and a static server on port 8770. Browser tests needed `pip install playwright==1.56.0` (the pre-installed Chromium is revision 1194).

| Command | Result |
|---|---|
| `python3 tools/build.py` | exit 0 |
| `python3 tools/shelltest.py sports` / `comics` / `tcg` | `ERRS []` for all three |
| `python3 tools/playtest.py sports` / `comics` | exit 0 |
| `python3 tools/wildkintest.py` | exit 0 |
| `python3 tools/duskfalltest.py` | **1 failure**: "preorders arrive on release day; Duskfall is on the market" (`RESULT FAIL 1`) |
| `python3 tools/wildkin_manifest.py --check`, `python3 tools/wildkin_dsk.py --check` | exit 0 |
| `python3 tools/test_art_pipeline.py` | exit 0 |
| `python3 tools/tidemark/checklist.py --check`, `node tools/tidemark/check.js` | exit 0 |
| `node tools/wildkin_sim.js` | exit 0 |

The Duskfall failure repeated on a second run on an idle machine. Its sources are identical to `origin/main` (no diff in `src/`, `tools/build.py` or `wildkin-production/`), so it is a pre-existing failure, not caused by this branch. It was not investigated or fixed because Wildkin is out of scope.
