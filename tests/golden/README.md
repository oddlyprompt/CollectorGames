# Golden tests (refactor safety net)

Bit-identical snapshots of both card games in the `tcg` build, taken from the baseline commit `d73b84c` (checkpoint branch
`claude/checkpoint-tidemark-integrated`). They freeze **economy v1**, the behaviour at that commit, so the shared-architecture refactor
(`design/shared-tcg-architecture.md`) can be proven to change nothing. They are **not** an approval of that behaviour: the Tidemark economy is rebuilt
later as v2 and its baselines are then replaced on purpose (see Rebaselining).

    python3 tools/build.py tcg && (cd dist && python3 -m http.server 8770 &)
    python3 tools/golden/golden.py check            # everything (about 4 minutes)
    python3 tools/golden/golden.py check day0 flows # some scenarios
    python3 tools/golden/golden.py list
    python3 tools/check_globals.py                  # no top-level name declared twice (also run by the golden suite's author before each commit)

Every comparison is exact: no tolerances, no rounding. Snapshots hold the RNG state (`core.rs`), so one extra or missing random draw anywhere shows up.

## Scenarios
| Name | World | What it freezes |
|---|---|---|
| `day0` | new game, seed 20261019 | every price (raw, GCS 9, GCS 10) of every printing and sealed product in both games (Wildkin sets 1-2; Tidemark sets 1, 2, 5, 10, 15, 20, 25, 28, 30, 31), pack EVs, 2,500 pack rolls per set, all copies, listings, NPCs, stores (retail, local shop case, online stock), metagame, news, sales, and the hash of 40 rendered screens |
| `release` | +26 days | the same after both releases (First Bond, Tenth Tide): fields formed, shelves stocked, preorders paid, market glut |
| `year1` | +365 days | the same a year in (Duskfall released, brewing, events, rotation news) |
| `series` | 160 weeks | every week: day, RNG state, field size, top 3 decks and shares, bans, events, news and listing counts, for both games; then a full snapshot. Covers brewing, pruning, bans and rebuilt fields |
| `flows` | release days | the player buys, opens a pack and a box, grades, lists, sells to the local shop, buys online, waits for grades and sales, in both games |
| `save:*` | fixtures in `tests/golden/saves/` | a saved game opened by the current code, snapshotted, then 30 days later. `legacy-wk-*` are REAL saves made by the pre-Tidemark commit `f856534` (they get the Tidemark world on load); `day1`, `released`, `busy` (owns cards, slabs, listings, something at the grader, a pending preorder) and `ban` (a Tidemark ban in force) come from `d73b84c` |

Screens are hashed after removing image data and counters. A deliberate HTML change (not only a behaviour change) therefore also needs a reviewed rebaseline.

## The probe's adapter
`tools/golden/probe.js` is injected into the page. Its `LINES` table at the top is the **only** code that knows function names. When the refactor renames or moves a
function, update that table to call the new name; the snapshots it produces must remain identical. Never change what is measured in the same commit as a refactor step.

## When a check fails
1. Read the printed paths: they say which price, pack, week or screen differs.
2. Find the cause in the change. A difference means behaviour changed (or an extra random draw happened) and is a bug until proven otherwise.
3. Fix the code. Do **not** capture a new baseline to make the test pass.

## Rebaselining (only for deliberate behaviour changes)
`python3 tools/golden/golden.py capture NAME --rebaseline "why"` replaces one baseline and appends the reason and the first differences to `REBASELINES.md`.
It refuses unless the scenario is deterministic (run twice in fresh pages, identical). Allowed only for an intentional economy or design change that touches one
line's economy module (for example Tidemark economy v2); say so in the commit.

## Fixtures
`python3 tools/golden/golden.py fixtures` (from the current build) and `python3 tools/golden/make_legacy_saves.py` (from the old commit) never overwrite existing files.
Do not regenerate them from refactored code: a fixture made by new code proves nothing about old saves.
