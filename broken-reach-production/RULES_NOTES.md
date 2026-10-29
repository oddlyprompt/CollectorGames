# Combat rules v0.2: decisions I had to make, and what the simulation shows

All of this is provisional. Where the handoff is silent I chose the simplest reading and wrote it down so it can be overruled (tests mark them).

## Ambiguities and the reading used (AMB)
1. **Draw order.** Hand 5, draw one per turn. The first player skips the draw on their first turn (the second player draws before theirs). A 20-card deck is never exhausted (5 + 7 draws).
2. **Rotation direction.** 90° is clockwise on the eight-way ring (N→E, E→S, NE→SE); 180° reverses all arrows.
3. **"This cascade"** = until the next placement begins. Placement buffs ("gain +1 Attack…", "ignores reciprocal bonuses", the added diagonal arrow) end there. Auras and "while controlled" effects last while the unit is on the board and use its **current controller**.
4. **"Adjacent"** includes diagonals (eight neighbours). "Adjacent Veyne Exchange units gain +1 Attack" is read as **friendly** Veyne units.
5. **"Pilot"** is not a card type in the data. Read as an adjacent friendly **Character**. Needs a real definition (only one card uses it: The Last Argument).
6. **Targets** ("rotate one adjacent unit", enemy loses Guard, add a diagonal) are chosen by the player as part of the move; with no valid target the effect is skipped. Rotating a friendly unit is mandatory when a friendly neighbour exists (it can hurt you).
7. **"+1 Guard to that unit" (first-placement planet)** is permanent while the unit stays on the board, and moves with it to the capturer.
8. **Captured-unit effects** run at the moment the unit is dequeued, before it attacks. "New controller's next attacker has -1 Attack" is read as the capturer's next **challenge** this cascade (one only, hit or miss).
9. **Planet rotation (once per match)** is each player's option, taken before the unit's own placement abilities. Which unit and which planet ability may rotate twice is not specified.
10. **Ignore negative Planet modifiers** only matters for the Vesper diagonal penalty (the only negative planet effect in Set 01).
11. **Reciprocal arrow** counts on diagonals and uses the defender's current (rotated, extra) arrows.
12. **Duplicate copies / deck rules:** not specified. The harness uses 20 different unit cards. A copy limit still has to be set.

## What the simulation says (6,000 games each; `SIM_REPORT_2026-10-29.txt`)
- **Safe:** no cascade ever exceeded 15 captures (bounded by the one-flip rule); matches always end after 16 placements; the resolver never mutates its input; same seed + same choices give the same match.
- **The second player is favoured.** The second player makes the last placement into a full board with no reply. Random play: first player wins 31.7%, second 48.2%, ties 20.1%. Greedy play: 35.2% / 56.4% / 8.4% ties. Perfect-information 2-ply play: first 39%, second 49%, ties 12% (400 games).
  Candidate fixes, measured on greedy play (first player's win rate): ties to the first player 43.6%; first player starts with a bonus of 3 (one and a half squares) 52.0%; with random play a tie bonus alone makes it 51.8%. **Owner decision needed**; I did not change the rules.
- **Chains are healthy:** random play captures 0.30 per placement (81% of placements capture nothing); greedy play 2.36, median 2, largest 15, deepest chain 10 generations. 4-arrow units capture slightly more than 2, 3 or 5-arrow units; 5-arrow units are weakest per placement (their stats are lower on purpose).
- **Planets:** first-player win rate varies from about 23% to 44% across planets with greedy play; Gallow's Rest (+1 Attack placed on an edge) and Vesper (diagonal -1) hurt the first player most. With about 650 games per planet the noise is about ±2 points, so those two are real. Margins are widest under The Grave Markets (two-arrow +1 Attack).
- **Cards:** the strongest cards in random decks (about 56–58% deck win rate: Fleet Coordination Node, Bribed Port Guards, Archivist Oruun, Elias Voss) and weakest (about 43%: Patent Warden, Transit Marines, Orren Cargo Runners, Pale Acolytes, Security Halo) are within a normal spread for unbalanced provisional stats. Nothing is broken, nothing is declared balanced (Gate G2 is open).

## Playable Alpha decisions (2026-10-29)
13. **Deck rule:** exactly 20 unit cards, at most 2 copies of each (prototype choice; the handoff leaves copy limits open). Planets are chosen per match, not part of the deck.
14. **Alpha card access:** all 172 units and 8 planets are unlocked for testing. Custom decks and settings are stored in this browser under one `localStorage` key (`br_alpha_v1`). The Alpha never reads or writes CollectorGames saves, so the future owned collection stays separate.
15. **Playable planets:** Karth (corner Guard), The Grave Markets (two-arrow Attack) and Nhelos (once-per-match rotation, which exercises the option UI), plus open space (no planet). The other five planets work in the resolver and the simulations.
16. **Opponent:** one of the preset decks other than yours, chosen at random. Three levels (see below). The first player is random; a rematch swaps who goes first.
17. **Ability options in the UI:** where a card has a choice (rotate which neighbour, which diagonal to add, planet rotation) the preview shows one button per option with its capture count.
18. **Turn-order rules** are optional trial rules chosen on the setup screen (Standard v0.2, Fair start A: first-player bonus of 2, Fair start B: last placement Attack -1). Default is Fair start A. See `TURN_ORDER_REPORT.md`. None is final.

## AI (`tools/brokenreach/ai.js`)
Sees only the board, the planet, its own hand and the *number* of cards in your hand. The game hands it a copy with your hand and deck blanked out, and a test checks that the AI never needs them. No stat bonuses. Unseen cards are sampled from the catalogue.
- **Easy:** best immediate capture, but 35% of the time plays a random legal move and adds noise to its scoring.
- **Standard:** immediate captures including whole cascades (it plays each candidate through the real resolver), then asks how the opponent's best reply would look against 3 sampled hands, for the best 6 candidates. Reciprocal arrows, planet effects and ability timing are all handled because it uses the resolver itself.
- **Hard:** same method with 12 candidates and 14 samples.
- **Measured (200 games per pair, both seats, random decks):** Standard beats Easy 119-69 (12 draws); Hard beats Easy 126-48; Hard against Standard is even (88-88; 72-65 with a much wider search). The limit is hidden information, not search depth: a 'keep strong cards for later' hand-management term was tried and made play worse, so it is not used. Hard is therefore only a little stronger than Standard; a real jump would need deeper search against a model of your deck, which was not attempted.
