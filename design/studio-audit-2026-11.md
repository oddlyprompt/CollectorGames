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

Sections 3 and 4 are filled in as the work lands (what was built, the same robots re-run, and what the reviewers said).
