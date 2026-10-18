# Rift Parade: pilot study (aggro, control, greedy, random)

## Run 1: aggro pilots, 1440 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 40 --agent aggro --seed0 52`. 40 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 1440 games in total (92 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 8.1, median 8, middle half 6 to 9, shortest 4, longest 18.
- How games end: Resolve reduced to 0 99.5% (1433), a player could not draw 0.5% (7).
- First player wins 49.7% (715 of 1440; one standard error is 1.3%).
- Anomalies fired per game: 0.98; highest Rift reached averages 5.6.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **49%** | - | 43% | 48% | 57% | 50% | 53% | 50% | 40% |
| Impact Wall | **40%** | 57% | - | 20% | 33% | 43% | 55% | 35% | 38% |
| Resonance Chorus | **61%** | 53% | 80% | - | 55% | 53% | 65% | 63% | 57% |
| Sever and Mark | **45%** | 43% | 68% | 45% | - | 40% | 35% | 40% | 48% |
| Workshop | **53%** | 50% | 57% | 48% | 60% | - | 50% | 55% | 48% |
| Rift Walkers | **54%** | 48% | 45% | 35% | 65% | 50% | - | 60% | 73% |
| High Rollers | **48%** | 50% | 65% | 38% | 60% | 45% | 40% | - | 38% |
| Haunted Broadcast | **51%** | 60% | 63% | 43% | 53% | 53% | 28% | 63% | - |

Each cell is 40 games (one standard error about 8% points). Matchups inside 40-60%: 19 of 28; inside 45-55%: 11. Spread between best and worst average: 21% points.

Mirror matches (320 games): first player wins 52.2%; seat A wins 50.9% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| House Advantage | Condition | 1 | 53 | 70% | rollers |
| Unsealed Service Corridor | Zone | 2 | 79 | 67% | chorus |
| Lulu, Lost Again | Character | 1 | 167 | 67% | chorus |
| Under-City Vault Door | Zone | 2 | 30 | 67% | workshop |
| Secondhand Sky Yard | Zone | 2 | 91 | 66% | workshop |
| Lulu, Bloom Against the Dark | Character | 5 | 126 | 65% | chorus |
| Mika, Trouble Looks Good on Me | Character | 6 | 134 | 65% | workshop |
| The City Forgets | Condition | 2 | 37 | 65% | severmark |
| Overpass at Dawn | Zone | 2 | 110 | 65% | rift |
| Lulu, Resonance Bloom | Character | 3 | 244 | 64% | chorus |
| ... | | | | | |
| Trade Offer | Condition | 1 | 64 | 44% | rollers |
| Load Bearing | Technique | 1 | 277 | 44% | impact |
| Ayame, Ghost Hunter | Character | 2 | 283 | 42% | severmark, impact, chorus |
| Late-Shift Dispatcher | Character | 2 | 557 | 42% | severmark, spotlight, impact, chorus, rollers |
| The Forgotten Disaster | Condition | 3 | 104 | 40% | impact |
| Crow, Probability Hustler | Character | 3 | 92 | 40% | rollers |
| Brax, Debt Collector | Character | 2 | 194 | 40% | impact |
| Suture the Impossible | Technique | 4 | 67 | 39% | impact |
| Brax, Impact Loaded | Character | 4 | 221 | 38% | impact |
| First Door, Last Chance | Technique | 3 | 35 | 34% | rift |

Cards never played 30+ times by any deck (in decks that contain them): 3 - Clean Sever; Equivalent Exchange; Market of Borrowed Names.

## Run 2: control pilots, 1440 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 40 --agent control --seed0 53`. 40 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 1440 games in total (145 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 10.1, median 10, middle half 8 to 12, shortest 4, longest 18.
- How games end: Resolve reduced to 0 94.0% (1353), a player could not draw 6.0% (87).
- First player wins 50.3% (724 of 1440; one standard error is 1.3%).
- Anomalies fired per game: 1.48; highest Rift reached averages 5.9.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **41%** | - | 28% | 38% | 65% | 45% | 38% | 43% | 30% |
| Impact Wall | **52%** | 73% | - | 30% | 35% | 70% | 55% | 70% | 33% |
| Resonance Chorus | **55%** | 63% | 70% | - | 38% | 57% | 68% | 60% | 30% |
| Sever and Mark | **45%** | 35% | 65% | 63% | - | 53% | 43% | 28% | 30% |
| Workshop | **44%** | 55% | 30% | 43% | 48% | - | 40% | 65% | 30% |
| Rift Walkers | **55%** | 63% | 45% | 32% | 57% | 60% | - | 68% | 57% |
| High Rollers | **44%** | 57% | 30% | 40% | 73% | 35% | 32% | - | 38% |
| Haunted Broadcast | **65%** | 70% | 68% | 70% | 70% | 70% | 43% | 63% | - |

Each cell is 40 games (one standard error about 8% points). Matchups inside 40-60%: 9 of 28; inside 45-55%: 3. Spread between best and worst average: 24% points.

Mirror matches (320 games): first player wins 53.8%; seat A wins 53.1% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| Mend Weave | Technique | 2 | 150 | 70% | spotlight, impact |
| Stage-Light Halo | Relic | 2 | 224 | 68% | spotlight |
| Prime-Time Switch | Technique | 2 | 246 | 68% | spotlight |
| Vivi Vesper, Special Broadcast | Character | 5 | 218 | 67% | spotlight |
| Channel Zero Studio | Zone | 2 | 220 | 66% | spotlight |
| Vivi Vesper, Your Host Tonight | Character | 4 | 302 | 64% | spotlight |
| Brax, Impact Reservoir | Character | 6 | 222 | 64% | impact |
| Backlot Reality | Zone | 3 | 291 | 63% | spotlight, impact |
| Mistaken Accomplice | Condition | 2 | 133 | 63% | severmark |
| Broadcast Stagehand | Character | 2 | 296 | 62% | spotlight |
| ... | | | | | |
| Stolen Charge Cell | Relic | 1 | 501 | 42% | kinetic, workshop |
| Hush-Moth Swarm | Character | 2 | 408 | 42% | severmark, spotlight, chorus, rift |
| Kai, Last to Know | Character | 4 | 234 | 41% | kinetic |
| Reiya, Exit Clause | Character | 3 | 92 | 41% | workshop |
| Charge Transfer | Technique | 1 | 83 | 41% | workshop |
| The City Forgets | Condition | 2 | 77 | 40% | severmark |
| Reiya, Deal Maker | Character | 3 | 251 | 40% | workshop, rollers |
| Kai, Errand Runner | Character | 1 | 261 | 39% | kinetic |
| No Refunds | Condition | 1 | 97 | 37% | severmark |
| Sealed District Gate | Zone | 2 | 108 | 35% | kinetic |

Cards never played 30+ times by any deck (in decks that contain them): 2 - Under-City Vault Door; Equivalent Exchange.

## Run 3: greedy pilots, 1440 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 40 --agent greedy --seed0 54`. 40 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 1440 games in total (4 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 9.0, median 8, middle half 7 to 10, shortest 4, longest 18.
- How games end: Resolve reduced to 0 94.9% (1367), a player could not draw 5.1% (73).
- First player wins 46.7% (673 of 1440; one standard error is 1.3%).
- Anomalies fired per game: 1.26; highest Rift reached averages 5.6.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **43%** | - | 40% | 50% | 33% | 45% | 55% | 28% | 48% |
| Impact Wall | **57%** | 60% | - | 57% | 60% | 57% | 50% | 50% | 63% |
| Resonance Chorus | **51%** | 50% | 43% | - | 55% | 38% | 50% | 48% | 73% |
| Sever and Mark | **44%** | 68% | 40% | 45% | - | 38% | 55% | 13% | 53% |
| Workshop | **52%** | 55% | 43% | 63% | 63% | - | 65% | 33% | 45% |
| Rift Walkers | **46%** | 45% | 50% | 50% | 45% | 35% | - | 43% | 55% |
| High Rollers | **65%** | 73% | 50% | 53% | 88% | 68% | 57% | - | 65% |
| Haunted Broadcast | **43%** | 53% | 38% | 28% | 48% | 55% | 45% | 35% | - |

Each cell is 40 games (one standard error about 8% points). Matchups inside 40-60%: 18 of 28; inside 45-55%: 13. Spread between best and worst average: 22% points.

Mirror matches (320 games): first player wins 49.7%; seat A wins 45.9% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| Crow, Loaded Coin | Character | 3 | 207 | 71% | rollers |
| Brax, Impact Reservoir | Character | 6 | 146 | 71% | impact |
| Crow, All Odds Mine | Character | 5 | 139 | 70% | rollers |
| The Ninth Vendor | Character | 3 | 227 | 66% | rollers |
| Wagerbound Phantom | Character | 2 | 178 | 66% | rollers |
| House Advantage | Condition | 1 | 134 | 64% | rollers |
| Pippi, Everybody Breathe | Character | 5 | 149 | 64% | impact |
| Lulu, Bloom Against the Dark | Character | 5 | 116 | 63% | chorus |
| Ayame, Holding the Line | Character | 4 | 327 | 62% | severmark, impact |
| Stitchglass Needle | Relic | 1 | 164 | 62% | impact |
| ... | | | | | |
| Broadcast Stagehand | Character | 2 | 249 | 43% | spotlight |
| Overpass at Dawn | Zone | 2 | 161 | 43% | rift |
| Ayame, The Cut Between Worlds | Character | 6 | 122 | 43% | severmark |
| Momo, Something Ancient | Character | 5 | 108 | 43% | spotlight |
| First Door, Last Chance | Technique | 3 | 227 | 42% | rift |
| Copperback Gremlin | Character | 2 | 233 | 42% | kinetic |
| Kai, Last to Know | Character | 4 | 144 | 42% | kinetic |
| Clean Sever | Technique | 1 | 82 | 41% | severmark |
| Temporary Spark | Technique | 1 | 268 | 40% | kinetic |
| Momentum Skip | Technique | 1 | 225 | 38% | kinetic |

Cards never played 30+ times by any deck (in decks that contain them): 2 - Hard Stop; Redirected Blow.

## Run 4: random pilots, 1440 games

Generated 2026-10-18 by `node tools/rift-parade/sim.js 40 --agent random --seed0 56`. 40 games per pairing (half with each seat first), 8 decks, 36 pairings including mirrors, 1440 games in total (3 s on 4 cores).

### Game shape

- Rounds per game (a round is one turn each): average 11.6, median 11, middle half 10 to 13, shortest 5, longest 18.
- How games end: Resolve reduced to 0 73.8% (1062), a player could not draw 26.3% (378).
- First player wins 50.6% (728 of 1440; one standard error is 1.3%).
- Anomalies fired per game: 1.87; highest Rift reached averages 5.8.

### Matchups (row deck's win rate against column deck)

| Deck | Avg | kinetic | impact | chorus | severmark | workshop | rift | rollers | spotlight |
|---|---|---|---|---|---|---|---|---|---|
| Kinetic Rush | **44%** | - | 8% | 8% | 33% | 78% | 83% | 45% | 57% |
| Impact Wall | **80%** | 93% | - | 57% | 70% | 95% | 90% | 73% | 80% |
| Resonance Chorus | **78%** | 93% | 43% | - | 60% | 95% | 85% | 78% | 90% |
| Sever and Mark | **62%** | 68% | 30% | 40% | - | 93% | 63% | 70% | 70% |
| Workshop | **15%** | 22% | 5% | 5% | 7% | - | 20% | 35% | 13% |
| Rift Walkers | **40%** | 18% | 10% | 15% | 38% | 80% | - | 60% | 63% |
| High Rollers | **39%** | 55% | 28% | 22% | 30% | 65% | 40% | - | 33% |
| Haunted Broadcast | **42%** | 43% | 20% | 10% | 30% | 88% | 38% | 68% | - |

Each cell is 40 games (one standard error about 8% points). Matchups inside 40-60%: 5 of 28; inside 45-55%: 1. Spread between best and worst average: 64% points.

Mirror matches (320 games): first player wins 48.1%; seat A wins 54.4% (should be near 50%).

### Card play and win rate (all decks, cards the deck played at least 30 times)

Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).

| Card | Type | Cost | Games played in | Win rate | Decks |
|---|---|---|---|---|---|
| Pippi, Everybody Breathe | Character | 5 | 169 | 79% | impact |
| Brax, Impact Reservoir | Character | 6 | 183 | 78% | impact |
| Stitchglass Needle | Relic | 1 | 212 | 75% | impact |
| Lulu, Bloom Against the Dark | Character | 5 | 143 | 74% | chorus |
| Pippi, No Time to Panic | Character | 2 | 398 | 74% | impact, chorus |
| Freight Tunnel Seven | Zone | 2 | 289 | 74% | impact |
| Brax, Walking Avalanche | Character | 5 | 250 | 74% | impact |
| Pippi, Hands Don't Shake | Character | 3 | 481 | 73% | impact, chorus |
| The Forgotten Disaster | Condition | 3 | 181 | 73% | impact |
| Emergency Stitch Kit | Relic | 1 | 239 | 73% | impact |
| ... | | | | | |
| Reiya, Artifact Broker | Character | 2 | 301 | 22% | workshop |
| Mika, Makeshift Beacon | Character | 3 | 244 | 21% | workshop |
| Reiya, Exit Clause | Character | 3 | 264 | 21% | workshop |
| Mika, Trouble Looks Good on Me | Character | 6 | 166 | 20% | workshop |
| Equivalent Exchange | Technique | 1 | 149 | 20% | workshop |
| Memory Token | Relic | 1 | 315 | 20% | workshop |
| The Sealed Parcel | Relic | 2 | 276 | 20% | workshop |
| The Parcel's Heart | Relic | 2 | 191 | 19% | workshop |
| Market of Borrowed Names | Zone | 2 | 158 | 18% | workshop |
| Vault Beneath Kurohama | Zone | 3 | 152 | 16% | workshop |

Cards never played 30+ times by any deck (in decks that contain them): 0.

