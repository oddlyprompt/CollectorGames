# Tidemark Version 1: card design and balance report (2026-10-19)

## What was built

- **Every card has numbers and abilities.** All 650 cards (the 220 of Tenth Tide and the 500 historical cards) have a cost, an Allegiance requirement, Power and Toughness, keywords and abilities.
  - The designs are in `tools/tidemark/v1/design_*.js`, one file per faction, following `tools/tidemark/v1/DESIGN_GUIDE.md`.
  - Each card's role comes from the checklist.
  - The 57 prototype cards keep their round 3 numbers.
  - Each design carries a note on how its role became rules.
- **Abilities are small operations** (71 kinds, `tools/tidemark/v1/ops.js`). Card text is generated from them, so text and play cannot disagree.
- **Rules 1.0** (`RULES.md`): prototype rules 0.3 plus the rising tide.
  - The engine is `tools/tidemark/v1/engine.js`, a descendant of the prototype's improved computer player.
  - On the 60-card prototype it gives deck win rates within 9 points of the old engine (half within 6), with the same game length.
- **Outputs:**
  - `cards.json`: every printing with its text, numbers and art.
  - `CARDS.md`: the readable card list.
  - `gallery/`: every card drawn by the frame renderer with SOL's art.

## How it was balanced

The format is **Tenth Tide** (the 220 cards of the anniversary set).

- **Decks:** ten archetype decks are built from faction mixes, then tuned by play (`tune.js`), the way players refine lists. A swap is kept when the deck does better against the field on the same games.
- **Card value** (`cardvalue.js`): each card in its deck is swapped for a plain unit of the same cost, and the change in the deck's win rate is measured.
- **Changes:** every change made from these measurements is in `tools/tidemark/v1/balance.js`, with its reason. There were 27 changes in 2 rounds:
  - the clearest overperformers were cut: Black Tide Leviathan, Trench Horror, Nerith Undying, Roothorn Stag, Brannoch's Last Blade, Iron Crown of Varr;
  - underperformers were raised: two Strongholds, Lantern Signal, Thorn Caltrops, Pearl Ward, Stone Carver;
  - Harbor Leagues and Iron Reach commons that sat under the curve were raised.

## Where it stands

From `node tools/tidemark/v1/sim.js 60`: 2,700 games, every deck against every other.

| Deck | Factions | Win rate |
|---|---|---|
| Crown Bastion | Crownlands + Iron Reach | 66% |
| Tideborn Tempo | Tideborn + Free Fleets | 60% |
| Thornwild Rush | Thornwild + Crownlands | 57% |
| Black Sails | Free Fleets + Abyssal Choir | 56% |
| Iron Wilds | Iron Reach + Thornwild | 50% |
| Grey Roads | Harbor Leagues + Neutral + Thornwild | 48% |
| Abyssal Depths | Abyssal Choir + Tideborn | 47% |
| Harbor Hybrid | Harbor Leagues + Crownlands + Tideborn | 44% |
| Lantern Watch | Harbor Leagues + Iron Reach | 41% |
| League Fleet | Free Fleets + Harbor Leagues | 31% |

- Before balancing, the decks ranged from 19% to 77%.
- Games last 8.7 turns on average (median 8). All of them end on Harbor damage. The first player wins 54%.
- In the last measurement no card in the outlying decks is worth more than about 4 points over a plain unit. The remaining gap is between deck plans, not single cards:
  - Crown Bastion's sturdy defenders;
  - League Fleet's reliance on Vessels, which cannot block on the Shore.
- Round 3 found that the computer player's verdicts finer than about ±7 points are not trustworthy before people play. That still applies.

## Known limits

- **Swift spells the computer player doesn't use:**
  - It uses Swift spells that remove, damage or shrink one attacker, or pump one unit in a fight.
  - It does not yet use Swift spells that boost all your units, such as Hold the Line.
  - 19 cards were never played in the self-test's games, most of them for this reason.
- **Interpreted cards:** some checklist roles had no exact rule and were interpreted. Each design note says how. Examples:
  - "can block Swift units" became a tax on Swift cards;
  - "your Enchantments work twice" became a cost cut plus a draw;
  - "copies Relic effects" became a return from the discard pile.
- **Historical cards:**
  - All 500 are designed and played in the self-test.
  - They were not balanced as a format, because no historical format is played yet.

## For the owner to decide

1. **Accept the designs as the working Version 1,** to be refined by a paper playtest, or ask for another simulated round first.
2. **League Fleet (31%) and Crown Bastion (66%).** Fix them with cards (for example a cheaper Vessel that can guard the Shore), or leave them to the living metagame, as the Wildkin field does.
3. **The first player wins 54%** with the second player's +2 Influence. Leave it, or try +1 card instead.

Commands:
- `node tools/tidemark/v1/check.js` (self-test)
- `node tools/tidemark/v1/sim.js 60` (balance)
- `node tools/tidemark/v1/cardvalue.js 24` (card values)
- `node tools/tidemark/v1/tune.js 4 8` (re-tune decks after card changes)
- `node tools/tidemark/v1/export.js` (rewrite `cards.json` and `CARDS.md`)
