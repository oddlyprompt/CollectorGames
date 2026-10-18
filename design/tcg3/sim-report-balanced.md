# Rift Parade: full simulation report (balanced pilots, 5,400 games)

## Run 1: balanced pilots, 5400 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 150 --seed0 51`. 150 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 5400 games in total (503 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 9.1, median 9, middle half 7 to 11, shortest 4, longest 18.
- How games end: Resolve reduced to 0 97.8% (5279), a player could not draw 2.2% (121).
- First player wins 49.8% (2687 of 5400; one standard error is 0.7%).
- Anomalies fired per game: 1.26; highest Rift reached averages 5.8.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **46%** | - | 42% | 49% | 43% | 40% | 50% | 45% | 50% |
| Impact Wall | **51%** | 58% | - | 33% | 43% | 55% | 54% | 65% | 52% |
| Resonance Chorus | **57%** | 51% | 67% | - | 43% | 58% | 65% | 61% | 51% |
| Sever and Mark | **43%** | 57% | 57% | 57% | - | 25% | 45% | 29% | 35% |
| Workshop | **51%** | 60% | 45% | 42% | 75% | - | 47% | 49% | 40% |
| Rift Walkers | **51%** | 50% | 46% | 35% | 55% | 53% | - | 60% | 57% |
| High Rollers | **48%** | 55% | 35% | 39% | 71% | 51% | 40% | - | 42% |
| Haunted Broadcast | **53%** | 50% | 48% | 49% | 65% | 60% | 43% | 58% | - |

Each cell is 150 games (one standard error about 4% points). Matchups inside 40-60%: 21 of 28; inside 45-55%: 9. Spread between best and worst average: 13% points.

Mirror matches (1200 games): first player wins 52.0%; seat A wins 48.3% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| Brax, Impact Reservoir | Character | 6 | 797 | 66% | impact |
| Prime-Time Switch | Technique | 2 | 782 | 64% | spotlight |
| Resonance Shelter | Technique | 2 | 891 | 63% | impact, chorus |
| Mend Weave | Technique | 2 | 446 | 63% | spotlight, impact |
| Lulu, Bloom Against the Dark | Character | 5 | 543 | 63% | chorus |
| Pulse Echo | Technique | 2 | 653 | 61% | chorus |
| Secondhand Sky Yard | Zone | 2 | 391 | 61% | workshop |
| Lulu, Lost Again | Character | 1 | 688 | 60% | chorus |
| Charge Transfer | Technique | 1 | 366 | 60% | kinetic, workshop |
| Vault Beneath Kurohama | Zone | 3 | 454 | 60% | workshop |
| ... | | | | | |
| Kai, Kinetic Daredevil | Character | 4 | 1493 | 45% | kinetic, rift |
| Copperback Gremlin | Character | 2 | 666 | 44% | kinetic |
| Kai, Errand Runner | Character | 1 | 923 | 44% | kinetic |
| Reiya's Lookout | Character | 1 | 1418 | 43% | kinetic, spotlight, rollers |
| Kai, Last to Know | Character | 4 | 795 | 43% | kinetic |
| Toma, Found the Flaw | Character | 4 | 1100 | 43% | severmark |
| No Refunds | Condition | 1 | 337 | 43% | severmark |
| Late-Shift Dispatcher | Character | 2 | 2299 | 41% | severmark, spotlight, impact, chorus, rollers |
| Kurohama Backstreets | Zone | 2 | 465 | 40% | kinetic |
| Hush-Moth Swarm | Character | 2 | 1268 | 39% | severmark, spotlight, chorus, rift |

Cards never played 30+ times by any deck (in decks that contain them): 1 - Equivalent Exchange.

### Per-deck detail

| Deck | Wins vs field | Style |
|---|---|---|
| Kinetic Rush | 45.6% of 1050 games | Aggro / Techniques |
| Impact Wall | 51.3% of 1050 games | Defensive control |
| Resonance Chorus | 56.6% of 1050 games | Character synergy / go wide |
| Sever and Mark | 43.4% of 1050 games | Tactical control |
| Workshop | 51.0% of 1050 games | Relic combinations |
| Rift Walkers | 51.0% of 1050 games | Dimensional manipulation / tempo |
| High Rollers | 47.7% of 1050 games | Risk / reward disruption |
| Haunted Broadcast | 53.2% of 1050 games | Midrange / positioning control |

