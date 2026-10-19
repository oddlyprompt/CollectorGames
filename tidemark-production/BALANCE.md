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
- **Changes:** every change made from these measurements is in `tools/tidemark/v1/balance.js`, with its reason. There were 29 changes in 3 rounds:
  - the clearest overperformers were cut: Black Tide Leviathan, Trench Horror, Nerith Undying, Roothorn Stag, Brannoch's Last Blade, Iron Crown of Varr;
  - underperformers were raised: two Strongholds, Lantern Signal, Thorn Caltrops, Pearl Ward, Stone Carver;
  - Harbor Leagues and Iron Reach commons that sat under the curve were raised;
  - round 3: two cheap Crownlands Leaders (Crown Sergeant, Captain of the Causeway) lost a point of toughness. Crown Bastion stacked them, and it opened the living metagame at 40% of the field.

## Where it stands

From `node tools/tidemark/v1/sim.js 60`: 2,700 games, every deck against every other.

| Deck | Factions | Win rate |
|---|---|---|
| Crown Bastion | Crownlands + Iron Reach | 64% |
| Tideborn Tempo | Tideborn + Free Fleets | 60% |
| Black Sails | Free Fleets + Abyssal Choir | 57% |
| Thornwild Rush | Thornwild + Crownlands | 55% |
| Iron Wilds | Iron Reach + Thornwild | 50% |
| Grey Roads | Harbor Leagues + Neutral + Thornwild | 48% |
| Abyssal Depths | Abyssal Choir + Tideborn | 47% |
| Harbor Hybrid | Harbor Leagues + Crownlands + Tideborn | 46% |
| Lantern Watch | Harbor Leagues + Iron Reach | 42% |
| League Fleet | Free Fleets + Harbor Leagues | 31% |

- Before balancing, the decks ranged from 19% to 77%.
- Games last 8.7 turns on average (median 8). All of them end on Harbor damage. The first player wins 54%.
- In the last measurement no card in the outlying decks is worth more than about 4 points over a plain unit. The remaining gap is between deck plans, not single cards:
  - Crown Bastion's sturdy defenders;
  - League Fleet's reliance on Vessels, which cannot block on the Shore.
- Round 3 found that the computer player's verdicts finer than about ±7 points are not trustworthy before people play. That still applies.

## The living metagame

The fixed round robin above is the lab check. In play, Tidemark gets the same living tournament scene as Wildkin (`tools/tidemark/v1/meta.js`):
- **Weekly shares:** players drift toward decks that beat what everyone else plays, and away from what the field is ready for. A weekly event (Swiss rounds and a top 8) nudges shares toward what wins.
- **Brewing:** most weeks there is a chance (higher early, when one deck has led for six weeks, and late) that players try four new lists:
  - a known list nobody plays;
  - an established deck re-tuned with a package (Removal, Tempo, Card Draw, Go Wide, Fortress, Ramp, Aggro, Big Threats, Fleet);
  - a **build-around**: a deck built around one card (a Legendary, or a card that rewards Beasts, Enchantments, Equipment, Vessels and so on) together with the cards it works with.
- **Testing:** each brew is refined by testing card swaps against the decks it expects to face, then tested against the six most played decks. The best one is brought if it holds up.
- **New and dead decks:** a new list plays up to 5 points worse for six weeks. A deck under 0.8% for six weeks leaves, and is not rediscovered for a year.
- **Bans:** the committee bans the card whose loss hurts a deck most, after that deck holds over 24% for 10 weeks. It then rebuilds every deck that played the card.

Three years (156 weeks, `node tools/tidemark/v1/meta.js 156 --seed 1`):
- the field held 12 to 21 decks;
- **7 different decks led** the field;
- **15 decks reached the top 5**;
- the longest run at #1 was 49 weeks;
- the top deck held 14% to 37% of the field.

New decks that caught on: 4 known lists, 15 re-tunes and **7 build-arounds**. Examples are an Antlerbearer Shaman Beast deck, a Master Gunsmith Ilka Ferrow Equipment deck, and two Hymn of the Tenth Tide Enchantment decks. 25 decks left the field. 3 cards were banned, all by week 53: Port of Lanthorn, Sellsword Queen Hesta and Captain 'Red' Moira Flint.


Compared with Wildkin (`wildkin_econ.py 36`: 10 leading decks, 27 in the top 5, longest run eight months, top deck 13% to 21%), Tidemark's field is more concentrated in its first year. It loosens once build-arounds arrive: by the third year the top deck holds 15% to 19%.

## Known limits

- **Swift spells the computer player doesn't use:**
  - It uses Swift spells that remove, damage or shrink one attacker, or pump one unit in a fight.
  - It does not yet use Swift spells that boost all your units, such as Hold the Line.
  - 19 cards were never played in the self-test's games, most of them for this reason.
- **Interpreted cards:** some checklist roles had no exact rule and were interpreted. Each design note says how. Examples:
  - "can block Swift units" became a tax on Swift cards;
  - "your Enchantments work twice" became a cost cut plus a draw;
  - "copies Relic effects" became a return from the discard pile.
- **Speed:** a three-year metagame run takes about 30 minutes headless, because every brew is tested by real games. When Tidemark joins the game, the starting field has to be precomputed at build time, as Wildkin's is (`tools/wildkin_meta.js`).
- **Historical cards:**
  - All 500 are designed and played in the self-test.
  - They were not balanced as a format, because no historical format is played yet.

## For the owner to decide

1. **Accept the designs as the working Version 1,** to be refined by a paper playtest, or ask for another simulated round first.
2. **League Fleet (31% in the lab).** It drops out of the living field within months. Leave it as a weak archetype, as real formats have, or give the Vessel decks a card that guards the Shore.
3. **The first player wins 54%** with the second player's +2 Influence. Leave it, or try +1 card instead.

Commands:
- `node tools/tidemark/v1/check.js` (self-test)
- `node tools/tidemark/v1/sim.js 60` (balance)
- `node tools/tidemark/v1/cardvalue.js 24` (card values)
- `node tools/tidemark/v1/tune.js 4 8` (re-tune decks after card changes)
- `node tools/tidemark/v1/meta.js 156 --seed 1` (three years of living metagame)
- `node tools/tidemark/v1/export.js` (rewrite `cards.json` and `CARDS.md`)
