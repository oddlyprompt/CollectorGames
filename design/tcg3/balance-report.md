# Rift Parade Set 01: balance report

All numbers are from `tools/rift-parade/sim.js`, reproducible from seeds; raw results are in `data/`. The generated full reports are `sim-report-balanced.md` (5,400 games), `sim-report-pilots.md` and `sim-report-skill-gap.md`. The change history is `balance-log.md`.

## What was simulated

* Eight representative 40-card decks (`decks.js`): Kinetic Rush, Impact Wall, Resonance Chorus, Sever and Mark, Workshop, Rift Walkers, High Rollers, Haunted Broadcast. They use all 130 cards between them.
* **Main result: 5,400 games** (150 games for each of the 36 pairings including mirrors; half with each seat going first), both seats played by the "balanced" look-ahead pilot. Seeds are derived from the pairing and game number.
* **Pilot study:** 1,440 games each with aggro pilots, control pilots, greedy pilots (no look-ahead) and random players; 1,920 games of the balanced pilot against the greedy pilot.
* **Ablations:** 1,080 games each with Anomalies switched off, Next Episode off, Reactions off and free Steps off.
* The tuning rounds used roughly 30,000 further games in runs of 1,000 to 2,900 games; they are described in `balance-log.md`. Final numbers use fresh seeds not used for tuning.

## Results (balanced pilots, 5,400 games)

| Deck | Average win rate against the other seven |
|---|---|
| Resonance Chorus | 57% |
| Haunted Broadcast | 53% |
| Impact Wall | 51% |
| Workshop | 51% |
| Rift Walkers | 51% |
| High Rollers | 48% |
| Kinetic Rush | 46% |
| Sever and Mark | 43% |

One standard error on a deck average is about 1.5 points; a single matchup cell (150 games) about 4 points. Spread between best and worst: 14 points. 21 of 28 matchups lie between 40% and 60%; extremes: Workshop beats Sever and Mark 75/25, High Rollers beats it 71/29, Chorus beats Impact 67/33. These are the designed counters (Sever and Mark is slow against Relic and wager decks; Impact Wall cannot keep up with a wide Resonance team).

* **Match length:** 9.1 rounds on average (median 9, middle half 7 to 11, range 4 to 18). Resolve reaches 0 in 97.8% of games; 2.2% end by a player being unable to draw; none ends at the turn limit.
* **First-player advantage:** 49.8% over 5,400 games (one standard error 0.7). Mirror matches: first player 52.0% over 1,200 (seat A wins 48.3%, within noise of 50%).
* **Anomalies:** 1.26 per game. **Strain:** triggers in 0.71 player-wakes per game, so mostly in the longest games.
* **Combat activity per game:** 17 attacks, 6.6 of them blocked; Next Episode 1.7 times; Steps 4.8; reaction windows with a playable Reaction 1.5, reactions actually played 0.28; wagers 1.1, bargains 1.1.

## Pilot dependence (do not confuse the deck with the pilot)

| Deck | balanced | aggro | control | greedy | random |
|---|---|---|---|---|---|
| Kinetic Rush | 46 | 49 | 41 | 43 | 44 |
| Impact Wall | 51 | 40 | 52 | 57 | 80 |
| Resonance Chorus | 57 | 61 | 55 | 51 | 78 |
| Sever and Mark | 43 | 45 | 45 | 44 | 62 |
| Workshop | 51 | 53 | 44 | 52 | 15 |
| Rift Walkers | 51 | 54 | 55 | 46 | 40 |
| High Rollers | 48 | 48 | 44 | 65 | 39 |
| Haunted Broadcast | 53 | 51 | 65 | 43 | 42 |

* The ranking moves with the pilot. Spotlight is 65% under control pilots and 43% under greedy ones; High Rollers is 65% for greedy play and 44% for control play; Impact Wall is 40% when both sides race (aggro) and 52-57% otherwise. Chorus is at or above 51% under every sensible pilot; Kinetic Rush and Sever and Mark are never above 49%. Random play is not informative about decks (the pilots cannot slip or block sensibly), but it never crashed an engine rule.
* **Pilot skill matters far more than deck choice:** the balanced pilot beats the greedy pilot 89% to 100% (average per deck 89-100%, even with the weakest deck and the strongest opposing deck, 57% as the worst single matchup). That is a healthy sign of depth: the game rewards good decisions.
* Consequently the balance conclusions are about the decks as piloted by the balanced search player. A human who plays aggressively or defensively will move the numbers by up to ten points.

## Do the signature mechanics do work? (ablations, 1,080 games each)

| Switched off | Rounds | First player | Biggest changes in a deck's average |
|---|---|---|---|
| nothing (5,400 games) | 9.1 | 49.8% | - |
| Anomalies | 9.3 | 52.0% | Chorus +2, Kinetic -3, Workshop +3: small |
| Next Episode | 9.4 | 53.1% | Rift -10, Spotlight +7, Sever and Mark -5, Rollers +5 |
| Reactions | 9.1 | 51.5% | Kinetic -10, Sever and Mark +5, Workshop +6 |
| Free Steps | 9.6 | 51.8% | Kinetic -5, Impact +6, Spotlight -4 |

Next Episode, Reactions and Steps clearly change who wins; Anomalies barely do. **The Rift gauge matters mainly through Phase, Rift-sensitive cards and the Anomaly forecast, not through the Anomalies themselves.** That is the weakest signature element and the first thing to revisit with human feedback (for example, make the Anomalies bite harder or give more cards Anomaly synergy).

## Problems found and what was done (details in `balance-log.md`)

| Problem | Finding | Fix |
|---|---|---|
| Engine bugs | Player Conditions never counted down; reaction cards could be played without an attack; duplicate cards offered twice | Fixed; regression tests added |
| First-player advantage | 57.6% with no compensation; a free energy card swung it to 26-37% | Second player gets +1 energy on each of their first two turns (49.8%) |
| Dominant deck | Resonance Chorus 80% (a one-drop became a 3/4); Impact Wall 66-74% | Resonance is +1 Power only, pump cards reduced, Absorb cap 5, Brax toughness reduced |
| Unplayable deck | High Rollers 22-31% (Bargain and Wager cards gave less than ordinary cards) | Bodies and payoffs raised; deck pruned |
| Dead and ignored cards | Eight cards in no deck; Clean Sever, Equivalent Exchange, Charge Transfer, A Name From Beyond almost never cast | Redesigned or buffed; all 130 cards now in a tested deck |
| Stalls | Impact mirror ended by deck-out 68% of the time | Strain from round 12; deck-outs 8% to 2% |
| Pilot blind spots | The pilot could not see the point of Imbue/Rush or the crack-back | Added pressure and exposure terms |

## Remaining concerns

* **Sever and Mark (43%) and Kinetic Rush (46%) are the weakest, Resonance Chorus (57%) the strongest.** All are in a band a human could exploit by piloting skill, but Chorus should be watched.
* **Anomalies have little effect** (see ablations).
* **Equivalent Exchange** is played in fewer than 30 games of 5,400; the pilot treats it as a slip. It is a Relic-deck trick that the pilot undervalues, not a broken card, but its real value is unknown.
* Some cards are intentionally situational and the pilot slips them often (Reaction Techniques, Clean Sever, Bondbreaker Stroke); see `card-audit.md`.
* The pilots are not human. Reaction play is low (0.28 per game), which may be real or a pilot weakness.
* Only two manual games (by an AI) exist; no human playtest. See `playtest-report.md`.
* Balance of the eight decks is not balance of the card pool: other 40-card lists from the 130 cards have not been searched.
