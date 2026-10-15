# Tidemark prototype rules (version 0.2, for simulation)

Working design approved by the owner on 2026-10-16: the two-front Shore and Deep battlefield, universal cross-front combat with tactical (not numerical) disadvantages, commitment-based Allegiance, and a 60-card prototype simulated before any card library or art. **Everything below is provisional and exists to be tested.** The engine is `tools/tidemark/engine.js`, the 60 cards `tools/tidemark/cards.js`, the balance run `tools/tidemark/sim.js`, the latest results `prototype-report.md`. None of it is in the game build.

## The table

- Two fronts: the **Shore** (Land) and the **Deep** (Sea).
- Each player has a **Harbor** with 20 strength. Reduce the opponent's Harbor to 0 to win; a player who must draw from an empty deck loses.
- Every card has a preferred environment, its **home**: Land cards the Shore, Sea cards the Deep, Dual and Neutral cards both. Vessels belong to the Deep. Units enter on their home front (Dual: either).

## Resources

- **Influence:** at the start of each turn your capacity rises by 1 (to 10) and refills. Some cards add capacity.
- **Allegiance (commitment):** a card marked *Land 2* needs 2 Land permanents in play (units, Vessels, Strongholds, Relics, Enchantments and the Domains you played; Dual permanents count for both sides). Neutral cards need nothing. Dedicated decks reach their strongest cards sooner; hybrid decks later.
- The player who goes second gets 2 extra Influence on their first turn (tested: first player wins 48%; with 1 extra it was 57%).

## A turn

1. **Rise:** Influence capacity +1 and refill; ready your units (a Stranded unit stays exhausted this one turn instead); Rise effects happen.
2. **Draw** a card (the first player skips this on the first turn).
3. **Main:** play cards.
4. **Battle:** attack.
5. **Second main:** play more cards.
6. **End:** damage on units heals.

## Battle

- Each ready unit (not one that arrived this turn, unless it has *Charge*) may attack **either front**.
- The defender may block with any ready unit, **from either front** (Vessels only block in the Deep). One blocker per attacker.
- **Home ground:** when a unit fighting on its home front meets one that is not, the home unit strikes first; if it destroys the other, it takes no damage. Otherwise both strike at once.
- **Stranded:** a unit that attacked away from home stays exhausted through your next Rise (it cannot attack or block next round).
- **Carried:** a Vessel (and the Dockmaster) lets as many Land units as its *carry* fight in the Deep as if at home.
- **Surge:** the unit is at home when it attacks the Shore.
- Unblocked damage on the Shore hits the defender's **Strongholds** first, then the Harbor. Unblocked damage in the Deep goes to the Harbor.

## The seven card types in the prototype

| Type | Prototype behaviour |
|---|---|
| Units | Power/Toughness, home front, keywords |
| Spells | One-time effects; *Swift* spells can be used during battle (the defender too) |
| Relics | Equipment attached to a unit, or a tool with an ongoing effect |
| Vessels | Deep units that carry Land units; can attack and block in the Deep |
| Strongholds | On the Shore; durability that soaks unblocked Shore damage, plus a defensive bonus |
| Domains | One per front, shared by both players; replaced when a new one is played |
| Enchantments | Ongoing effects |

Keywords: *Charge* (attacks the turn it arrives), *Surge*, *Rampart* (+2 toughness when blocking at home), *Leader* (other units on its front +1 power), *Ambush* (can be played from hand during the opponent's battle as a blocker), *Undertow* (a unit that fights it and survives returns to its owner's hand), *Tough* (takes 1 less damage), *Trample* (excess damage carries through), *Swift*.

## Round 2 (2026-10-15): read `round2-report.md` first

Round 2 found a shuffle bug that gave the deck in seat A a 54-56% edge, so the round 1 balance numbers below were too optimistic (corrected baseline: deck spread 16.7 points, 12 of 15 matchups within 40-60%). With a stronger computer player, Sea decks win 59.5% and Land 37.4%, games last about 7 turns, and expensive cards win by selection, not power. Round 2 proposes rules 0.3 (Stranded as the only crossing cost, a Ferry keyword replacing carry and escort, Vessels screening the Deep, Ambush folded into Swift) and lists the owner decisions. This file still describes rules 0.2 until those decisions are made.

## What the round 1 simulation found (3,000 games, `prototype-report.md`; numbers affected by the seat bias)

1. **Balance is close to the target.** Deck averages 46% to 55%; 13 of 15 matchups inside 40-60%, 7 inside 45-55%. Land, Sea and hybrid decks all compete.
2. **Game length:** about 8 turns per player (middle half 6 to 9). Inside the provisional 8-10 target, at its low end.
3. **Expensive cards stay viable:** 7+ cost cards arrive around turn 8 and the side that plays one wins about two thirds of the time.
4. **The first rule set failed and was changed.** In version 0.1 defenders could only block on the front they stood on, so Land and Sea armies ran past each other in a damage race (first player won 67%, Strongholds absorbed 3% of damage). Letting defenders block from either front, with Home ground deciding who strikes first, fixed that: 43% of blocks are now made away from home, so where units stand matters in most fights.
5. **Crossing attacks (corrected 2026-10-16).** The first report said 2% of attacks crossed fronts. That figure only counted attacks *away from home*; it left out Sea units with Surge raiding the Shore, which are crossings too. Measured properly, **15.6% of attacks go into the other front** in rules 0.2, almost all of them Surge raids. What is rare (about 2%) is a unit fighting at a real disadvantage, which is as intended.
6. **Strongholds on the Shore only absorb 5% of unblocked damage;** a variant where they guard both fronts (except against Vessels) absorbed 14% and made Land control stronger (Crown Bastion 46% to 53%). Kept on the Shore for now.
7. **Ambush and Swift tricks are underused** (Ambush about once in 50 games). Partly the simulated player (it rarely holds Influence back), partly the cards. Real players would use them more; the simulator understates them.

## Four ways to make crossing worthwhile (compared, `crossing-variants.md`)

Each variant was run for 3,000 games on the same 60 cards:

| Variant | Attacks into the other front | Matchups 40-60% | Deck spread | Notes |
|---|---|---|---|---|
| Baseline (rules 0.2) | 15.6% | 13 of 15 | 8.7 pts | Surge raids are most of the crossing |
| 1. Vessels screen the Deep (as Strongholds screen the Shore) | 15.4% | **14 of 15** | 7.8 pts | Vessels gain a defensive job (4.8% of damage); best balance |
| 2. A Domain that rewards crossing (Coral Spire reef) | 16.0% | 12 of 15 | 9.7 pts | Works, but only when that one card is in play (0.2 times a game) |
| 3. Raid keyword on eight fast raiders | 16.3% | 12 of 15 | 9.0 pts | Works on the cards that have it (0.1 hits a game); a card tool, not a rule |
| 4. Dual units escort one crossing attacker | **20.1%** | 12 of 15 | 8.0 pts | The biggest change; gives the Harbor Leagues a clear role |
| All four together | 21.1% | 12 of 15 | 7.6 pts | Balance holds; game length unchanged (8 turns) |

**Recommendation:** make 1 (Vessels screen the Deep) and 4 (Dual escorts) part of the rules: they are symmetric, cheap to explain, and the two strongest effects. Keep 2 (reef-style Domains) and 3 (Raid) as card-level tools to use in sets, not as rules. None of the variants harms balance or game length.

## Open questions for the next round (owner decisions)

1. Adopt the recommended combination (1 + 4), with reef Domains and Raid as card tools?
2. **Strongholds:** Shore only (current) or both fronts except against Vessels.
3. **Going second:** 2 extra Influence on the first turn (current) or 1 extra Influence plus an extra card.
4. **Longer games** if the owner wants the middle of the 8-10 range: a 25-point Harbor added about half a turn in testing.
