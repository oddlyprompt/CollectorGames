# Tidemark prototype, round 3: rules 0.3 and pool 0.3

Date: 2026-10-15.

The owner approved the round 2 recommendations:
- home-ground strike order removed;
- carry and escort merged into **Ferry**;
- Vessels screen the Deep;
- Ambush folded into **Swift**;
- +2 Influence for the second player;
- game length reached through the cards;
- prototype card changes allowed;
- the two fronts kept on probation.

This round puts those rules into the simulator (`rules:'0.3'`) and builds a revised 60-card pool (pool 0.3) from with/without card tests. Then it measures everything again.

**Files:**
- Rules: `prototype-rules.md` (now version 0.3).
- Data: `round3-data.md` (all tables) and `round3-data.json` (raw numbers).
- Card checks: `round3-cardvalue-pool02.md`, `round3-cardvalue-pool03.md`, and the flawed first checks `*-first.md`.
- Code: `tools/tidemark/` (not part of any game build).

**Read this first.** Everything comes from two computer players playing six fixed decks. It can show:
- which rules do nothing;
- which cards are weak against a decent opponent;
- which deck wins too often against these opponents.

It cannot prove the game is balanced or fun for people. Claims are marked:
- **Confirmed (sim):** measured, larger than the noise, and tested with/without.
- **Hypothesis:** fits the data but is not directly tested.
- **Judgment:** a design opinion.

## Summary

1. **A second simulator bug, now fixed, overturns most of round 2's balance picture.** *Confirmed (sim).*
   - The bug: units entered play exhausted, so a unit you played could not block on the opponent's next turn. The written rules never said that: units only cannot *attack* the turn they arrive.
   - It crippled defensive play. In the round 2 main setup, blocks were 2.0 a game; with the fix they are 5.0.
   - Correcting only this, round 2's main configuration (rules 0.2, round 2 cards and AI) changes:

     | Measure | Round 2 as reported | With the fix |
     |---|---|---|
     | Turns per player | 6.7 | 9.3 |
     | Land / Sea | 38% / 59% | 43% / 57% |
     | Tideborn Tempo | 71% | 62% |
     | Deck spread | 41 pts | 22 pts |

   - Round 2's report now carries a correction notice. `round2.js` and `probe.js` keep the old behaviour (`oldEntry`) so its numbers stay reproducible. The self-test checks this.
2. **Rules 0.3 plus pool 0.3 is the best-balanced version so far** (main configuration: rules 0.3, pool 0.3, improved computer player, 4,500 games). *Confirmed (sim).*
   - Land 47.0%, Sea 51.9%, Hybrid 50.3%.
   - Deck spread 12.4 points, close to the noise level of about 13.
   - 14 of 15 matchups between 40% and 60%; 8 between 45% and 55%.
   - Tideborn Tempo is still the strongest deck at 57.5%.
3. **The simplifications cost nothing measurable.** *Confirmed (sim).*
   - The rules change alone (0.2 to 0.3 on the old cards) leaves the picture within noise: Land 43% to 44%, spread 22 to 20 points, game length 9.3 to 9.7 turns.
   - Simpler rules, same game.
4. **The two fronts passed their probation, though not in the way expected.** *Confirmed (sim).*
   - Removing them (one shared battlefield) makes games much longer: 13.2 turns against 10.1. Stalled games that hit the turn limit double, from 4.6% to 9.5%. Matchups shift 4.0 points, above the 2.7 noise floor.
   - The second front is what lets a stuck board break.
   - What the fronts still do *not* do is create many close tactical choices: only 26% of attack decisions are close between fronts.
5. **Games now sit at the target length, but some stall.**
   - Average 10.1 turns per player; median 8; middle half 6 to 10.
   - 4.6% of games are board stalls that reach the turn limit (turn 40).
   - An optional **rising tide** fixes this: after turn 12, each player's Harbor loses 1 at their Rise. It removes every stall, brings the average to 8.8 turns and changes balance by no more than the noise. *Confirmed (sim).* This is an owner decision.
6. **The computer player still changes the balance a lot.** *Confirmed (sim).*
   - With the older player (v1), the same cards give Crown Bastion 65.7% (instead of 48.8%) and Land 59% (instead of 47%).
   - v2 beats v1 in 59.8% of games, so v2 is the better guide. But balance claims finer than about ±7 points are not trustworthy before people play.
7. **Ready for card-set planning: partly.** *Judgment.*
   - The rules are stable enough to plan a set's *structure*: faction identities, which keywords exist, rarity and mechanic budget.
   - They are not ready for final card numbers. The next step should be a human paper playtest of the 60-card prototype (section 10).

## 1. What was built

**Rules 0.3** (engine `cfg.rules='0.3'`):

| Rule | Status |
|---|---|
| Home-ground strike order | Removed. Blocked units deal damage at the same time |
| Stranded | Kept. It is now the one cost of crossing |
| Carry and Dual escort | Replaced by the **Ferry N** keyword: up to N of your attackers count as at home wherever they fight |
| Vessels | Now screen the Deep, as Strongholds screen the Shore |
| Ambush | A Swift unit: it can be played during the opponent's battle as a blocker |
| Second player | +2 Influence on their first turn |

**Engine fix.** Units now enter ready, as the written rules always said. They cannot attack the turn they arrive unless they have Charge, but they can block on the opponent's next turn. `cfg.oldEntry` restores the old behaviour, for reproducing rounds 1 and 2 only.

**Pool 0.3.**
- The same 60 slots, built from pool 0.2 by a change list in `cards.js`. Every change carries its reason; the full table is in `round3-data.md`, section 10.
- 23 cards changed, plus the automatic Ferry and Swift conversions.
- Pool 0.2 is untouched, and the self-test checks its fingerprint.

**New tools:**
- `cardvalue.js`: swaps each card in each deck for a "plain unit" and measures the deck. The plain unit has the same cost, allegiance and Allegiance requirement, Power and Toughness equal to its cost, and no abilities.
- `round3.js`: every configuration in this report.
- `check.js`: now 37 checks, including the old-engine reproduction and the pool fingerprint.

**A mistake I made and corrected.**
- My first card check gave the plain unit no Allegiance requirement. That made it look better than it should, because the requirement itself has a cost.
- Pool 0.3 was tuned partly on that first check. The corrected check (section 4) supports 12 of the 23 changes. Two more were deliberate deck-level tuning, and one only sets a Ferry number. Eight rest only on the flawed check. They are harmless buffs to weak decks, but they are candidates to revert (section 4).

## 2. Configurations and methodology

- **Decks:** the same six archetypes as rounds 1 and 2, built the same way from whichever pool is used.
- **Runs:**
  - 300 games per matchup, 4,500 games per configuration.
  - Fixed seeds; first player by a fair coin.
  - The card checks play 800 games per line, with the same seeds with and without the swap.
- **Noise:** replaying the main configuration with different shuffles moves deck averages up to about 3 points and the matrix by 2.7 points on average. Smaller differences are not findings.
- **Reproducing:**
  - `node tools/tidemark/round3.js 300` (about 30 minutes).
  - `node tools/tidemark/cardvalue.js 160 --pool 0.3` (about 25 minutes).
  - `node tools/tidemark/check.js` (seconds).

## 3. Balance

| Configuration | Land | Sea | Hybrid | Spread | Matchups 40-60% | First player | Turns (median, middle half) |
|---|---|---|---|---|---|---|---|
| Round 2 main as reported (bug) | 37.8% | 59.3% | 46.4% | 40.5 | 6 | 48.6% | 6.7 (6, 6-7) |
| Round 2 main, entry fixed | 42.6% | 56.6% | 45.0% | 21.5 | 9 | 52.8% | 9.3 (7, 6-9) |
| Rules 0.3, pool 0.2 | 44.3% | 55.5% | 44.9% | 20.4 | 8 | 53.2% | 9.7 (8, 6-9) |
| **Rules 0.3, pool 0.3 (main)** | **47.0%** | **51.9%** | **50.3%** | **12.4** | **14** | 53.6% | 10.1 (8, 6-10) |
| Main with the rising tide (turn 12) | 46.6% | 52.2% | 50.2% | 14.3 | 14 | 53.2% | 8.8 (8, 6-10) |
| Main, older computer player (v1) | 59.1% | 44.2% | 49.1% | 25.3 | 9 | 52.0% | 8.8 (8, 7-10) |

Deck averages in the main configuration:

| Deck | Win rate |
|---|---|
| Crown Bastion | 48.8% |
| Thornwild Rush | 45.1% |
| Tideborn Tempo | 57.5% |
| Abyssal Depths | 50.9% |
| Fleet Raiders | 47.4% |
| Harbor Hybrid | 50.3% |

Tempo's best matchups are 62.7% against Bastion and 58.7% against Depths. No other matchup is outside 40–60% (matrix in `round3-data.md`, section 3).

- **First versus second player:**
  - +2 Influence: the first player wins 53.6%. A replay with different shuffles gave 52.2%.
  - No compensation: 68.2%.
  - +1 Influence and +1 card: 55.5%.
  - +3 Influence (extra run): 47.9%. +2 Influence and +1 card: 46.4%.
  - **+2 Influence remains the right choice.** It leaves the first player about 3 points ahead, and +3 overshoots by about as much. *Confirmed (sim).*
- **Expensive cards:** 7+ cost cards are now played 0.76 times a game (0.27 in round 2). Their win rate is still mostly selection: cutting them to 80% Power/Toughness moves no deck by more than 3 points. *Confirmed (sim).* They are viable but not dominant.

## 4. The cards

The corrected card check on the **old pool** under rules 0.3 (`round3-cardvalue-pool02.md`) found the real problems.

**Cards that carried a deck:**

| Card | Deck | Swap costs |
|---|---|---|
| Drowned Acolyte | Abyssal Depths, then the top deck at 63% | 10.0 |
| Privateer Captain | Tempo | 7.3 |
| Tidecaller | Tempo | 5.6 |
| Deckhand Brawler | Tempo | 5.1 |

**Cards clearly worth less than a plain unit (3 to 5.5 points):**
- Rootcall
- Tidal Shift
- The Narrows
- Siege Mortar
- the three Strongholds
- Brigantine
- Keep Warden
- Coral Spire
- Hymn of the Drowned
- Fair Winds

**How the 23 changes in pool 0.3 stand against the corrected check:**

| Basis | Changes |
|---|---|
| Supported by the corrected check (12) | Drowned Acolyte to 3 cost. Privateer Captain loses Charge. Rootcall to 1. Siege Mortar to 3. Old King's Bastion, Deepmine Hold and Tidewall Harbor 1 cheaper. Brigantine to 3. Keep Warden 4/6. Fair Winds to 1. The Narrows and Coral Spire get new home-front effects |
| Deck-level tuning (2) | Thicket Fox 2/2 and Forge Construct 4/5, for the two lowest decks (both Land) after the other changes |
| Ferry numbers (design, 3) | Brigantine Ferry 1, War Galleon Ferry 2, Harbor Sentinel Ferry 1. Ferry works for every attacker, so smaller numbers than carry |
| Only the flawed first check (8) | Grove Tender 2/3, Boarding Party 2, Twin Tides 3, Tidebreaker Ballista 2, Rally the Levy tokens 1/2, Runesmith 2/4, Dockmaster 3/3, War Galleon cost 5 |

- Four changes made early in round 3 were based on round 2's bug-era causes and were **reverted** before the final pool: Deckhand Brawler and Swift Cutter keep Charge; Shieldwall Recruit and Crown Sergeant keep their stats.
- **Pool 0.3, corrected check** (`round3-cardvalue-pool03.md`):
  - No card carries a deck by more than 6 points. The largest are Crown Sergeant for Thornwild and Deckhand Brawler for Tempo, both 5.9.
  - Still below a plain unit:
    - Coral Spire (8.0 in Depths);
    - Hymn of the Drowned (7.2);
    - The Narrows (7.2);
    - Tidal Shift (6.8);
    - Rootcall (4.8);
    - Undertow Mage (4.5);
    - Fair Winds (4.1).
- **The two new home-front Domains did not work.** The Narrows and Coral Spire were meant to give each front a defensive identity, and the computer player gets little from them. *Confirmed (sim) for this player. Hypothesis that people would value them more.*

## 5. Tactical mechanics: usage and effect

Main configuration. "Shift" is the average change across the 15 matchups when the mechanic is switched off. The noise floor is 2.7.

| Mechanic | Usage | Shift when off | Verdict |
|---|---|---|---|
| Two fronts (against one battlefield) | 11.1% of attacks go into the other front. 50% of blocks come from the other front. 26% of attack decisions are close | **4.0.** Without them, games are 13.2 turns and 9.5% stall | **Earns its place:** the second front breaks stalls. *Confirmed (sim)* |
| Swift spells | 0.61 a game, all useful | **5.6.** Tempo −6, Depths −8, Thornwild +7 without them | Matters most of all. *Confirmed (sim)* |
| Domains | Shared, one per front | **4.6.** Depths −7.5 without them (The Choir Beneath) | Matters, mainly one card |
| Stronghold screens | Absorb 5.9% of unblocked damage | **4.0.** Bastion +5 and Harbor Hybrid −4.5 without them | Matters. Strongholds still cost Bastion more than they give it |
| Surge | Most crossing to the Shore | 2.3 | Below noise. Keep as Sea identity (Judgment) |
| Stranded | 0.72 unit-turns a game | 2.1 | Below noise. It is the only reason "home" matters, so keep (Judgment) |
| Vessel screens | Absorb 2.1% of unblocked damage | 1.5 | Below noise. One short rule; keep for symmetry or drop (decision 3) |
| Ferry | 3.3% of attacks | 1.2 | Below noise. It is a card keyword, not a rule, so it costs nothing to keep |
| Swift units (old Ambush) | 0.06 a game | – | Still practically unused by the computer player |

- **Why decisions are rarely close now:** in round 2, 58% of attack decisions looked close between fronts. That was mostly the bug, because with few possible blockers almost any attack looked good. Now that defenders can block, the better front is usually clear. *Hypothesis.*

## 6. AI findings

- **No change to the computer players this round, apart from the bug fix.**
  - v2 now values Ferry on Vessels and units.
  - Swift units use the reactive-play logic Ambush used.
  - It values the two new Domain effects.
- **v2 against v1:** v2 wins 59.8% of 3,600 games. By deck:

  | Deck | v2's win rate against v1 |
  |---|---|
  | Crown Bastion | 70.5% |
  | Abyssal Depths | 63.0% |
  | Tideborn Tempo | 60.5% |
  | Harbor Hybrid | 56.2% |
  | Thornwild Rush | 54.2% |
  | Fleet Raiders | 54.3% |

  Unlike round 2, v2's gain is now largest for the control deck.
- **v1's poor attacking flatters defence.** Under v1, Bastion wins 65.7%, because v1 attacks into blockers it should avoid. *Hypothesis, consistent with the head-to-head.*
- **The limits from round 2 still apply:**
  - v2 looks one turn ahead;
  - it knows the defender's blocking logic exactly;
  - it rarely holds Influence for Swift units;
  - it gets little from cards whose value is positional (the home-front Domains).
- Human play is likely to value Swift and positional cards more than the simulation does. *Hypothesis.*

## 7. Problems that remain

1. **Board stalls:** 4.6% of games reach the turn limit with neither side able to attack profitably.
   - The rising tide removes them without changing balance. *Confirmed (sim).*
   - Without the tide, human players would face the same stalls. A deck-out would eventually end them at around turn 44.
2. **Tideborn Tempo at 57.5%.** It is carried by cheap bodies (Deckhand Brawler, Privateer Captain, Tidecaller).
   - Further nerfs mostly hurt Fleet Raiders and Harbor Hybrid, which share those cards.
   - **Hypothesis:** this is better judged by people. Bounce and tempo are notoriously different in human hands.
3. **Thornwild Rush at 45.1%** is the lowest deck. Its Rootcall and The Narrows still rate below a plain unit.
4. **Seven cards still below a plain unit** (section 4), including both new home-front Domains.
5. **Swift units are unused** by the computer player (0.06 a game). Whether people would use them is unknown.
6. **The first player is about 3 points ahead.** Acceptable for a prototype. *Judgment.*

## 8. Recommended rules (0.3, adopted) and what to keep watching

| Mechanic | Recommendation |
|---|---|
| Two fronts, Stranded, Surge, Ferry, Swift, screens, Domains, +2 Influence | Keep everything adopted in rules 0.3 (`prototype-rules.md`) |
| Rising tide | Adopt. It is the cheapest fix for stalls and changes balance by no more than the noise (decision 1) |
| Vessel screens | Can go if the owner wants one rule fewer. Its effect is below the noise (decision 3) |
| Card changes | No more until people have played the 60-card prototype. The computer player's verdict on Tempo, the home-front Domains and Swift units is the part least likely to match people |

## 9. Is Tidemark ready for card-set planning?

**Ready:**
- The rule set: two fronts, Allegiance, Influence, nine keywords and the seven card types.
- The faction roles: Land control, Land aggro, Sea tempo, Sea late game, Vessels, Hybrid.
- A 60-card pool where every deck is within 45–58% under the better computer player.

These are enough to plan the *structure* of the first set: which factions and keywords appear, how many cards of each type and rarity, and how much of each mechanic.

**Not ready:**
- Final card numbers.
- The stall rule (decision 1).
- Anything that depends on how people value tempo, positional and Swift cards.

## 10. Owner decisions

1. **Board stalls:**
   - (a) Adopt the rising tide from turn 12 (recommended).
   - (b) Solve it with cards: more evasion, Trample and removal. Slower, and less certain.
   - (c) Accept stalls and let deck-out end them.
2. **Next step:**
   - (a) A human paper playtest of the 60-card prototype (recommended). I can produce printable cards and a one-page rules sheet; it needs no art.
   - (b) Another simulated round on the remaining weak cards first.
3. **Vessel screens:**
   - (a) Keep, for symmetry with Strongholds (recommended for now).
   - (b) Drop, for one rule fewer. Its effect is below the noise.
4. **The eight card changes that only the flawed first check supported:**
   - (a) Keep them; the final pool is measured as balanced with them (recommended).
   - (b) Revert them and re-measure.
5. **Start set-structure planning** (factions, keywords, rarity and mechanic budget, no card numbers) alongside the playtest:
   - yes (recommended);
   - or wait.
