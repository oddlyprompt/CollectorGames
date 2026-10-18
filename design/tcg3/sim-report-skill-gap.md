# Rift Parade: balanced pilot against greedy pilot

## Run 1: balanced vs greedy pilots, 1920 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 30 --agentB greedy --seed0 55`. 30 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 1920 games in total (82 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 8.5, median 8, middle half 7 to 10, shortest 3, longest 18.
- How games end: Resolve reduced to 0 96.9% (1860), a player could not draw 3.1% (60).
- First player wins 50.1% (961 of 1920; one standard error is 1.1%).
- Anomalies fired per game: 1.11; highest Rift reached averages 5.6.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **84%** | 87% | 60% | 80% | 93% | 87% | 97% | 80% | 87% |
| Impact Wall | **84%** | 93% | 77% | 70% | 93% | 87% | 80% | 90% | 83% |
| Resonance Chorus | **93%** | 97% | 90% | 83% | 100% | 100% | 93% | 97% | 87% |
| Sever and Mark | **85%** | 90% | 83% | 97% | 93% | 73% | 77% | 77% | 90% |
| Workshop | **88%** | 97% | 70% | 90% | 93% | 87% | 83% | 80% | 100% |
| Rift Walkers | **88%** | 80% | 80% | 83% | 97% | 93% | 100% | 80% | 93% |
| High Rollers | **84%** | 83% | 57% | 80% | 90% | 90% | 87% | 93% | 90% |
| Haunted Broadcast | **89%** | 93% | 80% | 87% | 90% | 97% | 87% | 83% | 93% |

Each cell is 30 games (one standard error about 9% points). Matchups inside 40-60%: 1 of 28; inside 45-55%: 0. Spread between best and worst average: 10% points.

Mirror matches (240 games): first player wins 48.3%; seat A wins 89.2% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| Hard Stop | Technique | 2 | 134 | 81% | kinetic, impact |
| Brax, Impact Reservoir | Character | 6 | 238 | 77% | impact |
| Lulu, Bloom Against the Dark | Character | 5 | 168 | 71% | chorus |
| Kai, No One Left Behind | Character | 5 | 168 | 67% | kinetic |
| Pippi, Everybody Breathe | Character | 5 | 196 | 65% | impact |
| Lulu, All Together Now | Character | 5 | 285 | 65% | chorus |
| Pippi, You Will Survive | Character | 4 | 345 | 64% | impact |
| Nova, The Space Between Us | Character | 5 | 205 | 64% | rift |
| Nova, What She Didn't Say | Character | 5 | 305 | 63% | rift |
| Lulu, Wrong Way Hero | Character | 4 | 336 | 63% | chorus |
| ... | | | | | |
| Clean Sever | Technique | 1 | 59 | 32% | severmark |
| Momo, Alley Yokai | Character | 2 | 499 | 31% | chorus, rift, spotlight |
| Unscheduled Cutaway | Technique | 1 | 335 | 31% | kinetic, spotlight |
| Hush-Moth Swarm | Character | 2 | 570 | 31% | chorus, severmark, rift, spotlight |
| The City Forgets | Condition | 2 | 95 | 31% | severmark |
| Momentum Skip | Technique | 1 | 211 | 30% | kinetic |
| Crow, Probability Hustler | Character | 3 | 202 | 30% | rollers |
| Mistaken Accomplice | Condition | 2 | 173 | 29% | severmark |
| Reiya, Exit Clause | Character | 3 | 169 | 25% | workshop |
| Equivalent Exchange | Technique | 1 | 43 | 23% | workshop |

Cards never played 30+ times by any deck (in decks that contain them): 1 - Redirected Blow.

### Per-deck detail

| Deck | Wins vs field | Style |
|---|---|---|
| Kinetic Rush | NaN% of 0 games | Aggro / Techniques |
| Impact Wall | NaN% of 0 games | Defensive control |
| Resonance Chorus | NaN% of 0 games | Character synergy / go wide |
| Sever and Mark | NaN% of 0 games | Tactical control |
| Workshop | NaN% of 0 games | Relic combinations |
| Rift Walkers | NaN% of 0 games | Dimensional manipulation / tempo |
| High Rollers | NaN% of 0 games | Risk / reward disruption |
| Haunted Broadcast | NaN% of 0 games | Midrange / positioning control |

