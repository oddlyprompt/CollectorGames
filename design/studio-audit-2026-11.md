# Studio audit and overhaul, November 2026

Branch `claude/studio-overhaul` (alpha-readiness branch plus the shared retail world of pull request 39). Nothing here is merged to `main` or deployed.
Scope: the Trading Card Collector (`tcg` build: Wildkin, Tidemark, Broken Reach). Sports and Comics share the engine and were only regression-tested.

How this was measured. `tools/agents/` loads the built game in Node (no browser) and lets **robot players** play it through the game's own actions:
`node tools/agents/play.cjs --days 540`. Every robot starts with $2,000 and no allowance in the same world (seed 11), so its result is its own doing.
Numbers marked *measured* come from those runs or from the probes named next to them. Anything not measured says so.

## 1. Audit (state before this pass)

Severity: **S1** breaks the game's economy or a core promise, **S2** makes the game shallow or misleading, **S3** friction or polish.

| # | Sev | Finding | Evidence | Player impact | Change |
|---|---|---|---|---|---|
| A1 | S1 | **Retail arbitrage is a money machine.** Buying sealed product off shelves and relisting it online is risk-free and unlimited. | *Measured:* the `clearance` robot turned $2,000 into $10,780 in 120 days and **$35,910 in 540 days (+1,695%)**, 27 actions a day. It bought 5,851 units for $166k and sold them for $223k. Causes: (a) the sealed price model's shelf anchor reads a "selling out" figure that the new stores never update, so it is stuck at "always selling out" and a box on every shelf at $144 is "worth" $228; (b) shops reorder in proportion to what the player buys; (c) no purchase limits. | One dominant, boring strategy; every other choice is a mistake by comparison. | Anchor sealed value to real shelf availability; per-customer limits on hot product; reorders ignore bulk buyers. |
| A2 | S1 | **Big-box retail stops carrying a game about 100 days after launch.** | *Measured (day 150):* all seven big-box locations had Wildkin and Tidemark on clearance with 0 to 2 units left; print runs last 425 days. The reorder rule's long-run demand (0.16 x traffic) is below the clearance threshold for every store, whatever the set. | Seven of twelve stores are empty shelves for most of a year. | Long-run demand follows the product's actual market heat; busy stores keep an evergreen line, quiet ones clear. |
| A3 | S1 | **Clearance ignores the market.** A big-box branch marked First Bond boxes down to $108 while the same box was worth $180. | Trace of the `clearance` robot: 10 boxes bought at $108, fair value $180. | Free money; contradicts "pull back when demand wanes". | No markdown while the product still sells above retail elsewhere. |
| A4 | S2 | **Shops have names but no pricing personality.** Every single in every shop is the model value times a fixed markup, recomputed live. | *Measured (day 150):* price / value never below 1.10 (Cargo Cage), 1.23 (Tidepool, Lantern Room), exactly 1.20 (Glass Cabinet). | There is never a bargain to find and never a reason to prefer one shop or to come back. Knowledge is worthless. | Price tags written when a card is bought in, by an owner with strengths, blind spots and a review routine. |
| A5 | S2 | **No discovery, no Hunt.** The card game has no Hunt at all (Sports and Comics do); the only "find" is a mis-listed marketplace card. | *Measured:* the `sniper` robot found 95 bargains in 540 days (one every six days) for +26%. | After opening packs there is little to *do*; the day-to-day loop is thin. | Procedural leads (yard sales, collections), dollar bins, card shows, built on real copies. |
| A6 | S2 | **No community and no long-term progression.** Goals are per-game checklists; nothing changes how the world treats you. | Code: `tcGoalStats` and its forks are the only progression. | Hour 5 plays like minute 5 with more cards. | Standing with each shop (regular, friend of the shop) that earns tips, first looks, better trade terms. |
| A7 | S2 | **Shop cases are mostly junk.** | *Measured (day 150):* median single value $0.16 (Cargo Cage), $0.41 (Lantern Room), $0.58 (Tidepool); best card in those three cases $11 to $17. | "A few good ones" is not true; nothing worth a visit. | Intake follows each shop's taste; price floors by shop. |
| A8 | S2 | **Marketplace is two-thirds clutter.** NPC collectors list cards worth 25 to 60 cents at $0.99. | *Measured (day 120):* 926 of 1,388 listings were priced at 1.5x value or more. | Browsing the Market is mostly scrolling past things nobody should buy. | NPCs do not list cards under $1 as singles. |
| A9 | S3 | **Home says "Packs on the shelf" for a game with nothing in print** (old sealed in a local shop). | `home_test` fails 3 checks on this branch. | Misleading first minutes. | Home counts in-print product only. |
| A10 | S3 | **Pack opening is the best value in the game, on paper only.** | *Measured:* `ripper` +17% on paper; selling the pulls realises -17% (`ripseller`), dumping to buylists -37% (`dumper`). | Healthy: paper value is not cash. Kept. | None. |
| A11 | S3 | **Grading is out of reach of a normal budget.** | *Measured:* the `grader` robot found 3 near-mint cards worth $25+ at or under value in 540 days. | Grading is a late-game activity; fine, but there is no path to it. | Shows and the premium shop give access to gradeable cards. |
| A12 | S3 | **Golden baselines were not re-captured** after the store change (every scenario differs). | `golden.py check` on pull request 39. | No regression net. | Re-capture at the end of this pass with a logged reason. |
| A13 | S3 | Architecture: the game is one concatenated script of very long lines; three forks of the same card-game code; wrappers on wrappers. | 11,000 lines, many over 1,000 characters. | Slows every change; easy to break a sibling fork. | Not changed here (see section 5): new systems are written once against line adapters, readable, with tests. |

Not a problem (checked): price "pumping" by buying up one print's listings (the lift is capped and singles rarely have several listings); auction sniping (bounded, +26% over 18 months with daily attention).

## 2. Design direction

One sentence: **make the physical world worth walking around in.** The cards, sets, packs and online market stay as they are. The stores stop being price lists and become people with habits; things turn up in the world because of what is happening in it; and the world slowly gets to know you.

- **5 minutes:** open a pack, see a shop, notice two shops price the same card differently.
- **5 hours:** know which owner misprices what, which day each shop puts out new arrivals, be a regular somewhere, have been to a card show.
- **50 hours:** friends of several shops, first call on collections, a route through the week, a collection built from finds as well as packs.

## 3. What was built

1. **Robot players** (`tools/agents/`): the built game in Node, ten strategies, one line of results each. This is the test harness for the economy.
2. **Stores version 2** (`src/shell/tcg_retail.js`): price tags written by owners with strengths and blind spots, routine re-pricing, other customers who buy bargains, standing with independent shops, weekly per-customer limits on product that is selling above its shelf price, a sold-out index measured from real shelves that the sealed price models read, big-box ordering that follows what a pack is worth, independents that charge the going rate when a release runs hot.
3. **Out and about, the Hunt** (`src/shell/tcg_circuit.js`): yard sales, private collections, a card show every fourth Saturday, tips from owners who know you, a finds log, ten goals, two outings a day. Every card on offer is a real copy a collector owned the day before and goes back to a collector if nobody buys it.
4. **Fixes:** sealed price anchors (three games), the marketplace price-cut bug, Home's in-print check, selling spares through the shared shops, repairs for references to vanished copies.
5. **Tests:** `tools/hunt_test.cjs` (53 checks), `tools/hunt_ui_test.py` (real clicks at phone size), the older `retail_test.cjs` adjusted where it asserted the defect A2.

Deterministic: leads, shows, tags and tips come from the world seed and the week or day; the same seed gives the same town (tested). Inspectable: `G.retail` holds everything (`locations[id].singles[].p` is a tag, `.rep` standing, `hunt.leads`, `hunt.stats`); `CIRCUIT.H()`, `RETAIL.standing(s)`, `RETAIL.appraise(p,g,c)` can be called from the browser console.
Saves: a save from before the shared stores gets them on load; a version 1 store world is upgraded in place (tags added, standing zero, nothing the player owns touched; tested); the Hunt state is created empty.

## 4. Before and after (seed 11, 540 days, $2,000, no allowance)

| Robot | What it does | Before | After |
|---|---|---|---|
| idle | nothing | 0% | 0% |
| ripper | 10 packs a week, keeps everything | +17% (on paper) | 0% (on paper) |
| ripseller | lists pulls worth $2+, buylists the rest | -17% | -13% |
| dumper | sells every pull to buylists | -37% | -59% |
| sniper | marketplace listings at 70% of value or less | +26% | +8% |
| **clearance** | **buys sealed off shelves, relists online** | **+1,695%** (27 actions a day) | **+119%** (1.8 actions a day) |
| investor | six boxes of each release, holds | +56% (on paper) | +71% (on paper) |
| grader | near-mint $25+ cards, grades, sells | +21% (3 cards) | -2% (1 card) |
| picker | independent shops daily, tags at 70% or less | did not exist (no bargains) | +12%, 63 finds |
| hunter | shops, yard sales, collections, shows | did not exist | +38%, 45 lots, 83 finds |

Reading it. The money machine is gone: what the `clearance` robot still earns comes from the weeks around a launch, when a product really is selling out, under per-customer limits (a second reviewer strategy that buys every limit at all twelve stores measured about +177% over 200 days on other seeds before the last tightening; see section 5). That is the largest remaining edge and it is deliberate that launch weeks matter, but it is still the best active strategy by a wide margin and should be watched. Opening packs is no longer a paper profit (a pack on a stocked shelf is worth its price). Holding sealed product past the end of its print run is the patient route (+71% on paper after 18 months; First Bond leaves print in month 14). The sniper earns less because cheap marketplace listings no longer drift up to $0.99 and back. The hunt pays a diligent, knowledgeable player about +38% in 18 months with one or two decisions a day.
Other measurements after: big-box branches carrying an old in-print game at day 300: 2 to 4 of 7 (was 0); singles tagged at 75% of value or less across town on a given day: a handful (was 0 by construction); yard sale lots worth 0.4x to 3.5x the ask, median about 1x; collections 0.75x to 1.7x the ask.

## 5. Independent reviews

Three reviewers with no part in the work (separate sessions, read-only): design and economy, code and saves, screens. Their findings and what was done:

| Reviewer finding | Action |
|---|---|
| Sealed flipping still pays (+122% to +209% in 200 days on seeds 7 and 23): a stocked $150 box was "worth" $172 | **Fixed:** in-print anchor is list x (1.02 + 0.6 x sold-out), so a stocked shelf is worth list. Re-measured on seed 11: +119% over 540 days. Not re-run on the reviewer's seeds or with the reviewer's own strategy. |
| Standing is a spend meter that a box-flipper maxes first; an allowance player never reaches Regular | **Changed:** sealed counts a point per $25 (two a day), cards traded count most, first tier at 8 points. Not re-measured with an allowance player. |
| Shop bargains barely exist after day one | **Changed:** wider blind spots, three days before other customers find a new arrival, opening stock pre-picked so day one is not a windfall. Picker: 63 finds in 540 days. Still modest. |
| Collections are never a bad buy | **Changed:** ask is 60 to 130% of worth. |
| Haggling is a free click | **Changed:** a refused offer raises the price a tenth; at a show it makes the price firm. |
| Looking through more of a box showed ten random cards | **Changed:** it shows the whole box. |
| Card shows are a slightly dear shop | **Partly:** larger out-of-town table with a wilder eye, larger vintage table. End-of-day markdowns and show-only stock not built. |
| Two outings a day rarely bind; money piles up on an allowance | **Open.** |
| Tidemark vintage rebuild deletes store-held and lead-held copies; the lead still sold for full price | **Fixed** (`repair`, withdrawn lots) with regression checks. |
| "Sell duplicates" bypassed the shops and paid more than any shop would | **Fixed** (`sellBest`). |
| Offer state keyed by copy id only (three games share ids); a sort using the random stream; wasted work for the sealed-only shop; returned copies graded more often | **Fixed.** |
| Card-show "Offer" bought instantly; a yard sale silently locked you out of the show; disabled buttons without reasons; standing unexplained; 29 px chips; 10 px labels; a 4,000 px directory | **Fixed** (confirm step, warning, reasons, explanation, 40 px targets, 12 px labels, shelf contents instead of the repeated paragraph on chain cards). Checked by the browser test, not re-reviewed. |
| No value hint next to a seller's price: a tap per card | **Design decision:** you see your own estimate for cards you own a copy of; anything else is a tap. Knowledge grows with the collection. |
| Day-advance cost: stores 44 ms and hunt 23 ms a day on average, show Saturdays 400 to 676 ms; Mondays average 3.5 s from older code (one of 38 s) | New code is cheap. **The Monday spikes are older code and were not investigated.** |

Found sound by the code reviewer: save and load mid-lead and mid-show; the collector id caches never contain a held copy; 360 days of the Tidemark ten-year economy with no copy in two places; no negative cash over 780 days.

## 6. Roadmap, in priority order

1. **Human play.** Nothing here has been played by a person. A timed session on a real phone decides more than any further simulation.
2. **Launch weeks.** Still the best active money (+119%). Options: a shared weekly limit per chain, NPC buyers who will not pay over the cheapest stocked shelf, or accept it as the game's "launch day" loop. Re-run the reviewer's scalper on several seeds.
3. **Monday day-advance spikes** (seconds, once 38 s in the reviewer's run): profile the weekly ticks in the older code.
4. **The hunt at hour 50.** More kinds of lead (a shop closing down, a storage unit, a trade night), dealers who buy at shows, end-of-day show markdowns, follow-ups from sellers, and something that makes two outings a real constraint.
5. **Standing that does more:** a held card, first look at new arrivals a day early, a pull list for release day.
6. **Marketplace depth:** NPC demand that knows what shops charge; fewer near-worthless listings (not re-measured after the $0.99 fix).
7. **Architecture:** the three card-game forks and the one-script build are unchanged. New systems were written once against line adapters; the same should be done to the forks before a fourth game.
8. Packaging for an HTML5 host (file count), from the earlier pass, still open.

## 7. Public-alpha readiness

**Not ready for a public alpha; ready for a small closed test.**
- For: every automated suite passes (section 8); the economy has no known unlimited exploit; saves upgrade; there is now something to do each day besides open packs.
- Against: no human has played the new systems; nothing has run on a real phone, in Safari or inside an itch page; day-advance can stall for seconds on some Mondays; the launch-week edge is large; the hunt's long-term depth is unproven (the design reviewer called hour 5 "thin" before the last round of changes, and that was not re-reviewed); the economy scripts (`wildkin_econ.py`, `tidemark_econ.py`, `tidemark_econ2_test.py`) were not re-run, and several numbers in `CLAUDE.md` about pack and box values while in print are now out of date (a stocked pack is worth about list, not $5.20 to $5.90).

## 8. Verification
Run on the final build of this branch (headless Chromium at phone size, and Node), 2026-11-10 and 11.

| Suite | Result |
|---|---|
| Baseline before any change (alpha branch plus pull request 39) | all pass except `home_test` (3 failures: finding A9) |
| `check_globals.py` | pass, no duplicate globals (tcg 1,806) |
| `shelltest` sports, comics, tcg; `playtest sports` | `ERRS []` |
| `wildkintest`, `duskfalltest`, `tidemarktest`, `tidemark_ui_test` | pass |
| `brokenreachcollecttest`, `brokenreach/test.js`, `brokenreach_uitest` | pass |
| `purchase_routes`, `opening`, `market_safety`, `home`, `browse`, `br_layout`, `phone_layout`, `soak` (420 days) | pass |
| `retail_test.cjs`, `retail_ui_test.py` | pass (two assertions in `retail_test.cjs` changed: one asserted defect A2, one assumed card values never move) |
| `hunt_test.cjs` (new), `hunt_ui_test.py` (new) | pass |
| `test_art_pipeline`, `test_br_art_pipeline` | pass |
| `golden.py` | re-captured with a logged reason (every scenario changes: the stores change the world's random sequence), then `check` passes. **The differences were not inspected one by one.** |

Order of events to be clear about: the full suite ran on the build with the reviewers' fixes; `hunt_ui_test` then failed three checks on wording and the haggle rule that had been changed on purpose, the test was updated and passes; nothing in the game changed after that run.

Not run: `wildkin_econ.py`, `tidemark_econ.py`, `tidemark_econ2_test.py`, `wildkin_sim.js` (card rules untouched); the reviewers' own strategies after the final tightening; an allowance-budget robot after the standing change; any physical phone, Safari, itch page or human session. The robot results are one seed (11) unless stated.
