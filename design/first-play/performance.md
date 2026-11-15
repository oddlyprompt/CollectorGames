# Phase 2, task 1: day-advance performance

Tool: `node tools/perf/profile.cjs --seed N --days 720 [--warm]` (the built game in Node, an idle world, every `advanceDay` timed and attributed to the game's own tick functions). Numbers are from the build machine (4 cores, Node 22); a phone is roughly three times slower. Runs marked * shared the machine with other runs, so compare shapes more than single figures.

## What was slow, and why

| | Seed 11 | Seed 99 |
|---|---|---|
| Typical day (median) | 206 ms | 211 ms |
| p95 / p99 | 1.4 s / 7.8 s | 0.7 s / 2.7 s |
| Worst day | **33.8 s** | 18.8 s |
| Monday median / p95 | 620 ms / 14.9 s | 320 ms / 6.9 s |
| Every other weekday, worst | 0.35 to 1.7 s | 0.28 to 1.5 s |

Where the time went (seed 11, 720 days, 430 s in total):

| Function | Share | What it is |
|---|---|---|
| `xtBrewWeek` | 28.5% | Tidemark, Mondays: players try new lists; after the first ban the tests are played live by the rules engine |
| `xtRebuildMeta` (from `xtApplyBans`) | 19.3% | Tidemark, the day a ban takes effect: every deck that played the card is rebuilt and replayed against the field (10 to 28 s) |
| `marketTick` | 15.6% | the shared marketplace, every day (about 90 ms a day) |
| `xtBanCheck` | 10.8% | Tidemark, the Monday the committee tests a dominant deck: four candidate bans x six opponents x two decks x six games (7 to 19 s) |
| `xtEconDay` | 5.1% | Tidemark's ten-year economy, every day |
| everything else (Wildkin, Broken Reach, the stores, the Hunt) | under 5% together | |

**Root cause: three Tidemark metagame events play hundreds of full games of the card game in one go on the main thread.** A game took 23 ms; inside a game, 87% of the time was the computer player's attack planning asking for the same unit's power, toughness and keywords thousands of times against a board that does not change while it plans. The eight slowest days of both seeds were all Mondays and all one of those three events. The 38-second day the reviewer saw is the same thing (a ban taking effect).

State does not grow: the save is 1.5 MB (uncompressed JSON) on day 1 and 2.3 to 2.5 MB from day 90 to day 720; copies, listings and sale histories are flat; the Node heap moves between 50 and 200 MB with garbage collection and does not trend upward. Weekly processing other than the three events: Wednesdays about 270 ms (Corner Pocket's and the Tidemark dealers' day), Saturdays up to 0.8 s on a card-show day.

## What was changed

All three changes give **exactly the same worlds as before**; none changes a rule, a seed or a number of games.

1. **Attack-planning cache in the Tidemark engine** (`tools/tidemark/v1/engine.js`, lines marked `PERF-ONLY`). While `planAttack` runs, a unit's power, toughness and keywords are worked out once. 1.7x faster games (23 ms to 13 ms).
2. **Matchup memory** (`TMR.matchup` in `src/engine/tm/tm_rules.js`). The same two lists, number of games and seed always give the same result, so a finished or half-finished matchup is kept (in memory, not in the save) and never replayed.
3. **Playing ahead** (`xtForecast`, `xtWarmTick` in `src/engine/tm/tm_world.js`). A ban is announced fourteen days before it takes effect, and the committee only tests a deck after ten Mondays on top, so both heavy days can be seen coming. The game lists the matchups those days will need (same decks, same seeds) and plays them one game at a time while the page is open and idle (10 ms in every 80). On the day, they are already played. If the forecast was wrong, or there was no idle time (the tests, the robot players, a player who taps Next day without pause), the day plays what is missing, as before.

The engine's source is part of the metagame library's fingerprint, and a changed fingerprint makes every save rebuild its Tidemark field. Because the cache changes no result, `library.js` leaves `PERF-ONLY` lines out of the fingerprint: the fingerprint, the library and every save's field are untouched (`library.js --check` passes).

Not done, on purpose: playing ahead for `xtBrewWeek`. Which lists are tried is decided by the world's dice on the day. Testing the likeliest ahead of time was measured: 27,000 speculative games over two years (780 s of idle processor) to bring the Monday p95 from 3.6 s to 1.9 s, with the worst day unchanged. Not worth a phone's battery. Removing it properly means giving those tests seeds that do not depend on the week, which changes results; that is a design decision, listed under remaining blockers.

## After

| | Before | After, no idle time | After, with idle time |
|---|---|---|---|
| Seed 11: median day | 206 ms | 211 ms* | 216 ms* |
| Seed 11: p95 / p99 | 1.4 s / 7.8 s | 1.1 s / 5.0 s* | 1.1 s / 3.1 s* |
| Seed 11: worst day | 33.8 s | 20.4 s (24.9 s*) | **4.6 s** |
| Seed 11: Monday p95 | 14.9 s | 8.6 s | 3.6 s |
| Seed 11: total for 720 days | 430 s | 332 s | 255 s (+111 s played in idle time) |
| Seed 99: worst day | 18.8 s | 10.9 s* | **2.4 s** |
| Seed 99: p99 | 2.7 s | 2.2 s* | 1.6 s |
| Seed 5 (no ban in two years): worst day | not measured | not measured | 1.8 s |
| World fingerprint at day 720, seed 11 | `bcb9ccfc36d0` | `bcb9ccfc36d0` | `bcb9ccfc36d0` |
| World fingerprint at day 720, seed 99 | `bc284d1a3c6b` | `bc284d1a3c6b` | `bc284d1a3c6b` |

With idle time, every ban-day and ban-test spike is gone (all were forecast correctly in the three worlds measured). What remains is `xtBrewWeek`: after the first ban, a Monday is typically 0.5 to 1.2 s and at worst 4.6 s here, so perhaps 2 to 4 s and 14 s on a phone. "With idle time" assumes the page was open long enough between days; the play-ahead for a ban needs about 30 s of processor in all, spread over the fourteen days' notice.

## Proof that nothing changed

- `node tools/perf/memo_check.cjs 600`: 600 games identical with the cache off and on; every cached answer recomputed and compared during 250 games; matchups played ahead out of order equal matchups played in one go. Added to `tools/run_all_tests.sh`.
- World fingerprints identical before and after, with and without playing ahead (table above).
- Golden suite: this machine's newer Chromium differs from the old one in the last digit of some prices, so the *unmodified* previous build failed 17 scenarios here. Baselines were re-captured from that unmodified build, then the new build was checked against them: **all pass.**
- `tidemarktest`, `shelltest tcg`, `hunt_test`, `retail_test`: pass. (The full suite is run in task 3.)

Not measured: a real phone; the browser's own rendering time after a day (the profile times the simulation only); a world with idle time shorter than the play-ahead needs.
