# Phase 2 "First Play": readiness for a closed playtest

Branch `claude/first-play` (from `claude/studio-overhaul`). Nothing merged, nothing published, `docs/` untouched.
Release candidate: **0.9.0-alpha-rc1**, built by `tools/release.py` from commit `7c59e2c` (later commits change documents only). 591 files, 108.5 MB.

## Decision
**Technically ready for a small, supervised human playtest.** Not a statement about public release.
The reasons it is ready, and the things a session leader should know going in, are below.

## Task results

| Task | Result | Record |
|---|---|---|
| 1. Performance | Worst day 33.8 s to 4.6 s when the page has had idle time (20 s if it has had none); typical day 0.2 s unchanged; worlds identical | `performance.md` |
| 2. Economy | 57 runs over five seeds, no crash, no unlimited exploit; launch-week flipping bounded at about +110% over 18 months | `economy.md`, `economy-runs.jsonl` |
| 3. Regression and release | Every suite passes; one timing check failed once under load (below); packaged within host limits | this file, `DEPLOYMENT.md` |
| 4. Playtest material | Guide for player and session leader, 38-question feedback form | `PLAYTEST_GUIDE.md`, `FEEDBACK_FORM.md` |

## Regression (run 2026-11-16 on the final code, headless Chromium at phone size and Node)

| Suite | Result |
|---|---|
| `check_globals.py` | pass (tcg 1,811 declarations, no duplicates) |
| `shelltest` sports, comics, tcg; `playtest sports` | `ERRS []` (new game, every tab, save slots, reload and continue, backup export and import) |
| `wildkintest`, `duskfalltest`, `tidemarktest`, `tidemark_ui_test` | pass |
| `brokenreachcollecttest`, `brokenreach/test.js`, `brokenreach_uitest` | pass |
| `purchase_routes`, `opening`, `market_safety`, `home`, `browse` | pass (buying, selling, offers, grading routes in all three games) |
| `retail_test.cjs`, `retail_ui_test.py` | pass (stores, ownership of every copy, version 1 migration, 420 days) |
| `hunt_test.cjs`, `hunt_ui_test.py` | pass (Hunt state, standing, saves, repairs, 400 days, phone layouts 320 to 1280 px) |
| `memo_check.cjs` (new) | pass (the engine cache changes no game) |
| `br_layout`, `phone_layout`, `soak` (420 days, backup round trip) | pass |
| `test_art_pipeline`, `test_br_art_pipeline` | pass |
| `golden.py check` | pass, against baselines re-captured from the *unmodified* previous build (see exception 1) |
| `release_test.py` (new) on the packaged candidate | pass |
| `wildkin_econ.py 18` | `ERRS []`; 9 leading decks, 17 decks in the top 5 |
| `tidemark_econ.py 18` | `ERRS []`; 6 leading decks, 11 decks in the top 5 |
| `tidemark_econ2_test.py --seeds=2` | 58 pass, 1 fail (exception 2) |

### Documented exceptions
1. **Golden baselines re-captured for an environment change.** This machine's Chromium is newer than the one the baselines were made with and differs in the last decimal digit of some prices, so the *untouched* previous build failed 17 scenarios here. Baselines were re-captured from that untouched build; the new build passes against them. Not a change in the game.
2. **One timing check.** `tidemark_econ2_test`: "replaying ten years takes under 400 ms per world" measured 431 ms at the end of a 90-minute run. Run on its own three times afterwards: 268, 302, 314 ms, pass. A machine-load reading; the limit was not changed.
3. **Not run:** `wildkin_sim.js` (card rules and the Wildkin engine were not touched); the Tidemark library regeneration (the fingerprint is unchanged, `library.js --check` passes).

### What the economy scripts showed that is worth knowing
- While a set is in print, a pack is now worth about its list price ($4.64 to $4.81 for First Bond against $4.50; $5.15 for Tenth Tide against $4.99) and a box about list ($155, $149). Older figures in `CLAUDE.md` ($5.20 to $5.90 a pack, $173 to $200 a box) describe the game before the studio overhaul.
- **Oddity, not fixed:** after a set leaves print, its *boxes* stay priced at list for as long as one box sits on any shelf in town, while loose packs already rise (Tenth Tide, three months after print end: pack $7.45, box $149). A box should not be worth less than its packs. Low impact on a first session (print ends in month 14); listed below.

## Remaining blockers and known issues

**For a small supervised playtest: none that stop it.** Things the session leader should expect:
1. **A wait of a few seconds on some Mondays** once Tidemark has had its first ban (roughly month 5 onward): typically 0.5 to 1.2 s here, at worst 4.6 s, so perhaps up to 15 s on a phone. If the tester races through days without pause, a ban day can still take 20 s here (longer on a phone), because the play-ahead needs idle time. The guide tells the player to wait.
2. **Never run on a real phone, in Safari or on itch.io.** The first session is also the first device test. Have a laptop ready as a fallback.
3. **itch.io's limits are from secondary sources**; its own documentation could not be read from the build machine. The package has wide margins (591 of 1,000 files).

**Before a wider or unsupervised test:**
4. The Monday wait from weekly deck-brewing (item 1). Removing it means giving those test games seeds that do not change week to week, which alters results: a design decision.
5. Launch-week flipping returns about +110% in 18 months against +28% for the full hunt. Bounded and capital-limited, but the owner should decide whether that is the game they want.
6. Boxes priced below their packs after print end (above).
7. Money is not tight on the default allowance after the first weeks (the allowance robot ended with $1,400 to $2,100 unspent). Whether that is true for a person is a playtest question.
8. Everything in `design/studio-audit-2026-11.md` section 6 that was out of scope here (hunt depth at hour 50, card-show stock, what standing unlocks).

**Not blockers, but unverified:** storage inside an embedded page on Safari; how the play-ahead behaves on a slow phone (it uses 10 ms in every 80 while the page is visible); a save made on the public site's older build opened in this candidate (migration from the previous branch's saves is tested; the public build is older still and was tested only through the legacy scenarios in the golden suite).
