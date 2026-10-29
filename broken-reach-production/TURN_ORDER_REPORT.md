# Turn-order balance experiments (2026-10-29)

**Problem (from the first report):** the second player makes the 16th and last placement into a full board and nobody can answer it. Under v0.2 the first player wins only about 31% (random play), 35% (greedy) and 32% (the Standard AI) of games, the second player 48% / 54% / 60%.

**Method.** `node tools/brokenreach/balance.js 1500 1500 240` plays random decks (20 different units each, all 8 planets and open space in rotation) with three kinds of player: **random**, **greedy** (best immediate capture) and **Standard AI** (the in-game opponent: one reply ahead against sampled hands, no hidden information). Every rule is a configuration of the resolver (`rules` in `newMatch`), off by default. Games per cell: 1,500 random, 1,500 greedy, 240 Standard (so Standard rows carry roughly ±3 points of noise). "First share of decided games" is the first player's wins divided by wins plus losses: 50% is fair. Raw output: `BALANCE_TURN_ORDER_RAW.txt`.

| Rule | Players | First wins | Second wins | Draws | First share of decided games | Captures per placement | Placements with 4+ captures | Planet spread of first-player win rate |
|---|---|---|---|---|---|---|---|---|
| v0.2 baseline | random | 30.6% | 48.0% | 21.4% | 38.9% | 0.30 | 1.2% | 33.6% to 46.9% |
| v0.2 baseline | greedy | 36.5% | 54.2% | 9.3% | 40.2% | 2.34 | 25.6% | 32.5% to 45.0% |
| v0.2 baseline | standard | 31.7% | 60.4% | 7.9% | 34.4% | 1.15 | 6.7% | 20.8% to 48.0% |
| tie to first player (komi 1) | random | 52.0% | 48.0% | 0.0% | 52.0% | 0.30 | 1.2% | 43.1% to 58.7% |
| tie to first player (komi 1) | greedy | 45.8% | 54.2% | 0.0% | 45.8% | 2.34 | 25.6% | 37.7% to 50.9% |
| tie to first player (komi 1) | standard | 39.6% | 60.4% | 0.0% | 39.6% | 1.15 | 6.7% | 29.6% to 55.6% |
| komi 2 | random | 52.0% | 31.0% | 17.0% | 62.7% | 0.30 | 1.2% | 50.7% to 73.7% |
| komi 2 | greedy | 45.8% | 46.5% | 7.7% | 49.6% | 2.34 | 25.6% | 40.1% to 54.9% |
| komi 2 | standard | 39.6% | 42.5% | 17.9% | 48.2% | 1.15 | 6.7% | 38.1% to 63.6% |
| komi 3 (1.5 squares) | random | 69.0% | 31.0% | 0.0% | 69.0% | 0.30 | 1.2% | 58.1% to 79.0% |
| komi 3 (1.5 squares) | greedy | 53.5% | 46.5% | 0.0% | 53.5% | 2.34 | 25.6% | 43.7% to 58.4% |
| komi 3 (1.5 squares) | standard | 57.5% | 42.5% | 0.0% | 57.5% | 1.15 | 6.7% | 48.1% to 70.4% |
| final placement makes no challenges | random | 41.1% | 34.6% | 24.3% | 54.3% | 0.25 | 0.9% | 46.4% to 61.6% |
| final placement makes no challenges | greedy | 53.3% | 38.5% | 8.3% | 58.1% | 2.24 | 24.7% | 50.3% to 66.3% |
| final placement makes no challenges | standard | 50.4% | 35.8% | 13.8% | 58.5% | 1.11 | 6.4% | 32.0% to 69.6% |
| final placement Attack -1 | random | 37.3% | 40.1% | 22.7% | 48.2% | 0.27 | 0.9% | 40.8% to 53.6% |
| final placement Attack -1 | greedy | 49.5% | 40.6% | 9.9% | 54.9% | 2.26 | 24.8% | 48.0% to 61.5% |
| final placement Attack -1 | standard | 45.0% | 42.9% | 12.1% | 51.2% | 1.13 | 6.4% | 32.0% to 68.2% |
| final placement Attack -2 | random | 40.0% | 36.5% | 23.5% | 52.3% | 0.26 | 0.9% | 45.7% to 59.1% |
| final placement Attack -2 | greedy | 52.5% | 39.1% | 8.4% | 57.4% | 2.25 | 24.7% | 49.3% to 65.8% |
| final placement Attack -2 | standard | 49.2% | 37.5% | 13.3% | 56.7% | 1.12 | 6.4% | 32.0% to 68.2% |
| first player +1 Guard on all units | random | 53.4% | 20.9% | 25.7% | 71.9% | 0.18 | 0.3% | 63.5% to 79.1% |
| first player +1 Guard on all units | greedy | 86.1% | 7.0% | 6.9% | 92.5% | 0.94 | 3.6% | 89.8% to 96.3% |
| first player +1 Guard on all units | standard | 82.1% | 7.9% | 10.0% | 91.2% | 0.63 | 0.8% | 82.6% to 100.0% |
| first player opens with 6 cards | random | 30.2% | 49.1% | 20.7% | 38.1% | 0.30 | 1.2% | 31.9% to 42.5% |
| first player opens with 6 cards | greedy | 39.4% | 52.0% | 8.6% | 43.1% | 2.48 | 27.3% | 36.4% to 49.7% |
| first player opens with 6 cards | standard | 31.7% | 55.8% | 12.5% | 36.2% | 1.30 | 8.8% | 17.4% to 50.0% |
| komi 1 + final Attack -1 | random | 59.9% | 40.1% | 0.0% | 59.9% | 0.27 | 0.9% | 53.9% to 65.3% |
| komi 1 + final Attack -1 | greedy | 59.4% | 40.6% | 0.0% | 59.4% | 2.26 | 24.8% | 53.9% to 64.1% |
| komi 1 + final Attack -1 | standard | 57.1% | 42.9% | 0.0% | 57.1% | 1.13 | 6.4% | 37.0% to 74.1% |

Rules tried: komi N = the first player's final count gets +N; "final placement makes no challenges"; "final placement Attack −N"; "first player +1 Guard on all units"; "first player opens with 6 cards". (Komi 1 only gives ties to the first player; counts are always even in difference, so komi 2 is "the second player must win by 4 cards (10–6) to win outright".)

## What the numbers say
- **Komi 2 is the best fit for real play**: first share 49.6% (greedy) and 48.2% (Standard AI). Random play, which does not matter for humans, comes out 62.7% for the first player. Draws rise to 8–18% because 9–7 counts as a draw.
- **Final placement Attack −1** is close without any bonus points: 54.9% (greedy), 51.2% (Standard). It is the simplest to explain and leaves the scoreboard honest, but the planets that reward edge placement and two-arrow units (Gallow's Rest, The Grave Markets) swing it toward the first player.
- **Komi 1 (tie to the first player) is not enough** (45.8% greedy, 39.6% Standard). **Komi 3 overshoots** against random players (69%) and slightly for the Standard AI (57.5%).
- **Final placement makes no challenges** overshoots (54–58% first share). **Attack −2** overshoots on greedy (57%).
- **First player +1 Guard** is far too strong (86–92% first wins). **Six-card opening hand** does almost nothing (36–43%) and adds a card-choice advantage.
- **Cascades and captures are unchanged** by komi (same play); last-placement rules lower captures per placement by about 0.03 (greedy 2.34 → 2.26) and leave the 4+ capture share at about 25%.
- **No new dominant strategy appeared**: preset-deck matchups are the same within a point under komi 2 and within 3 points under Attack −1 (below). Planet balance (greedy, first-player share by planet):

```
first-player share of decided games by planet (greedy vs greedy, 250 random-deck games per planet)
  v0.2            Karth 39% | Vesper 43% | Drael 42% | Gallow's Rest 36% | Nhelos 37% | Velvet Mile 42% | Grave Markets 33% | Lost Aperture 40%
  komi 2          Karth 47% | Vesper 54% | Drael 56% | Gallow's Rest 44% | Nhelos 44% | Velvet Mile 50% | Grave Markets 38% | Lost Aperture 46%
  last Attack -1  Karth 50% | Vesper 50% | Drael 50% | Gallow's Rest 58% | Nhelos 53% | Velvet Mile 54% | Grave Markets 57% | Lost Aperture 52%

preset deck matchups (row deck win rate vs column deck, greedy, both seats, 600 games, draws count half)
  v0.2            dockside>openlanes 50%  dockside>bulwark 48%  openlanes>dockside 51%  openlanes>bulwark 55%  bulwark>dockside 52%  bulwark>openlanes 46%
  komi 2          dockside>openlanes 50%  dockside>bulwark 48%  openlanes>dockside 52%  openlanes>bulwark 55%  bulwark>dockside 52%  bulwark>openlanes 46%
  last Attack -1  dockside>openlanes 53%  dockside>bulwark 49%  openlanes>dockside 55%  openlanes>bulwark 55%  bulwark>dockside 52%  bulwark>openlanes 44%

```
  Komi 2 moves every planet toward 50% (38% to 56%, down from 33%–43%). Attack −1 spreads them the other way (50% to 58%).

## Recommendation
Use **komi 2 (Fair start A)** as the default while testing: it is one sentence, needs no new card or turn logic, and brings greedy and Standard play to about 49%. Keep **Attack −1 (Fair start B)** as the alternative to try if you dislike bonus points on the scoreboard. Both are selectable in the setup screen next to the unchanged Standard rules. Neither is final: human play against the Standard AI will tell us more than these simulations, and the 180-card balance pass has not happened.
