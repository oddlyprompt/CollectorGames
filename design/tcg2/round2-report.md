# Tidemark prototype rules validation, round 2

> **Correction (round 3): read `round3-report.md` before using any balance number in this report.**
>
> Round 3 found a second simulator bug. Units entered play exhausted, so a unit could not block on the opponent's next turn. The written rules never said that.
>
> - **What it did:** it heavily punished defensive play. With the bug fixed, the round 2 main configuration plays about 9 to 10 turns, not 6.7, and the Land/Sea gap shrinks a lot.
> - **What no longer holds:** the conclusions about fast games, Sea dominance and Tideborn Tempo's lead.
> - **What still stands, re-measured in round 3:**
>   - which rules barely matter;
>   - that Rootcall is weak;
>   - that expensive cards win mostly by selection;
>   - the second-player compensation finding.
>
> `round2.js` and `probe.js` keep the old engine behaviour (`oldEntry`), so the numbers below can still be reproduced.

Date: 2026-10-15 (prototype rules 0.2, 60-card pool). Data: `round2-data.md` (all tables), `round2-probes.md` (cause-finding experiments), `round2-data.json` (raw numbers). Code: `tools/tidemark/` (not part of any game build).

**Read this first.** Everything here comes from two computer players playing six fixed prototype decks against each other. A simulation can show that a rule does nothing, that a card is weak against a decent opponent, or that a deck wins too often against these opponents. It cannot prove that the game is balanced or fun for people. Every claim below is marked:
- **Confirmed (sim)**: measured, larger than the noise, and checked with a with/without experiment.
- **Hypothesis**: fits the data, but not tested directly.
- **Judgment**: a design opinion.

## Summary

1. **A bug in the simulator made round 1 look better balanced than it was.** *Confirmed (sim).*
   - What happened: the shuffle used weak random numbers, so in mirror matches the player in seat A won 54–56% of the time. In every round-robin matchup the deck listed first sat in seat A. This is now fixed and covered by a self-test.
   - Effect on the original baseline (same rules, same AI):
     - Spread between the best and worst deck: 16.7 points, not 8.7.
     - Matchups between 40% and 60%: 12 of 15, not 13.
     - Tideborn Tempo: 59.6%, not 55%.
   - The round 1 documents (`prototype-report.md`, `crossing-variants.md`) keep their original numbers as a record. Use this report's numbers.
2. **The recommended crossing rules work, but their effect is small.** Phase 1 combined Vessel screening with Dual escort. *Confirmed (sim).*
   - With the original computer player:
     - Attacks into the other front rise from 16% to 20.5%.
     - The deck spread narrows from 16.7 to 14.8 points.
     - Matchups within 45–55% go from 3 to 7.
     - Game length is unchanged.
   - With the improved player, escort is used in only 1% of attacks.
3. **The improved computer player plays better, and the game gets less balanced.** *Confirmed (sim).*
   - It beats the old player 56.9% of the time over 7,200 games. It does not simply attack more: attacks per game fall from 19.9 to 17.4.
   - Its attacks are aimed better, though, so games end sooner: 6.7 turns per player instead of 8.0.
   - Under good play:
     - Sea decks average 59.5% and Land decks 37.4%.
     - Tideborn Tempo wins 71% and Crown Bastion 31%.
4. **The Land/Sea gap comes from the cards, not the two-front rules.** *Confirmed (sim).*
   - Removing the two fronts (one shared battlefield) leaves Sea at 58.7% and Land at 39.7%.
   - Tempo's edge comes from cheap Charge units. Its trick spells are weaker than a plain unit of the same cost (section 7).
5. **Expensive cards win because of who plays them, not because of what they do.** *Confirmed (sim).*
   - The high win rate is selection: players who survive long enough to cast them were usually already ahead.
   - Cutting 7+ cost cards to 80% Power/Toughness changes nothing. Swapping them for plain 5-cost 5/5 units changes deck results by 0 to 3 points.
   - With games lasting about 7 turns, the late game barely happens.
6. **Several mechanics change little.** *Confirmed (sim).*
   - The noise level is 2.6 points of matchup shift. These four sit at or below it: carry (0.0 points), home-ground strike order (0.6), escort (0.7) and the two fronts as a whole (2.7).
   - Strongholds (3.7) and Swift/Ambush tricks (4.4) clearly matter.
   - Ambush almost never happens (0.04 times a game).
7. **Tidemark is not ready for full card-set planning.** *Judgment.*
   - It is ready for a round 3 on a simplified rules 0.3 with a corrected 60-card pool. Section 9 lists the proposed rules and section 10 the decisions needed.

## 1. Configurations tested and methodology

- **Decks:** the six archetypes from round 1, unchanged, each 50 cards from the 60-card prototype pool:
  - Crown Bastion: Land control.
  - Thornwild Rush: Land aggro.
  - Tideborn Tempo: Sea tempo.
  - Abyssal Depths: Sea late game.
  - Fleet Raiders: Sea Vessels.
  - Harbor Hybrid: Land and Sea.
- **Runs:**
  - Each configuration is a full round robin: 15 pairings, 400 games each, 6,000 games in total.
  - Who goes first is a fair coin flip.
  - Seeds are fixed, so every configuration plays the same shuffles.
  - The probes in `round2-probes.md` play 1,000 games per line.
- **Rules held fixed unless named:**
  - Harbor 20.
  - Strongholds on the Shore only.
  - The second player gets +2 Influence on their first turn.
  - Reef Domains and the Raid keyword are off. They stay card-level tools, as the owner asked.
- **Configurations:**

| Key | What it is |
|---|---|
| base_v1 | Original baseline: rules 0.2 and the original computer player (AI v1) |
| rec_v1 | Recommended rules: Vessel screening plus Dual escort, AI v1 (Phase 1) |
| base_v2 | Rules 0.2 with the improved player (AI v2) |
| rec_v2 | **Main configuration:** recommended rules with AI v2 |
| bonus_1_1, bonus_0 | Second player gets +1 Influence and +1 card, or no compensation |
| big80 | 7+ cost cards at 80% Power/Toughness |
| harbor25 | Harbor 25 |
| placebo | rec_v2 replayed with different shuffles. It measures noise |
| off_* | rec_v2 with one mechanic switched off (the ablations): home-ground, Stranded, carry, escort, Vessel screen, Stronghold screen ("walls"), Surge, Domains, tricks (Swift and Ambush), fronts (one shared battlefield) |

- **Head-to-head:** AI v2 against AI v1 on every deck pair, including mirrors (7,200 games).
- **Probes (`round2-probes.md`):**
  - Which AI helps which deck (each deck with one AI against a field using the other).
  - Swapping one card at a time in Tideborn Tempo for a plain unit.
  - Swapping out Rootcall.
  - Swapping out every 7+ cost card.
  - Swapping only the blocking logic.
  - Harbor 20, 25 and 30.
  - The "plain unit" in these swaps has the same cost and allegiance as the card it replaces, Power and Toughness equal to its cost, and no abilities. Section 7 explains why it is a fair-value yardstick.
- **Noise:** the placebo run shows how much results move with different shuffles alone.
  - A deck's average moves up to about 3.6 points.
  - The 15 matchups move 2.6 points on average.
  - Differences smaller than that are not findings.
- **Reproducing:**
  - `node tools/tidemark/round2.js 400` (about 6 minutes).
  - `node tools/tidemark/probe.js 200` (about 4 minutes).
  - `node tools/tidemark/check.js` (self-test, a few seconds).

## 2. Matrices and archetype win rates

Deck averages (full matrices in `round2-data.md`, section 3):

| Deck | Original baseline (v1) | Recommended rules (v1) | Recommended rules (v2, main) |
|---|---|---|---|
| Crown Bastion (Land control) | 43.1% | 44.6% | **30.7%** |
| Thornwild Rush (Land aggro) | 42.9% | 42.9% | 44.0% |
| Tideborn Tempo (Sea tempo) | 59.6% | 57.7% | **71.2%** |
| Abyssal Depths (Sea late game) | 55.6% | 56.2% | 55.3% |
| Fleet Raiders (Sea Vessels) | 48.4% | 47.8% | 52.0% |
| Harbor Hybrid | 50.3% | 50.8% | 46.8% |
| Land / Sea / Hybrid | 43.0 / 54.6 / 50.3 | 43.7 / 53.9 / 50.8 | **37.4 / 59.5 / 46.8** |
| Deck spread | 16.7 pts | 14.8 pts | 40.5 pts |
| Matchups 45-55% / 40-60% | 3 / 12 | 7 / 12 | 2 / 6 |

- **Phase 1 verdict:** with the original player, the recommended rules are a small improvement on the baseline. The spread is 2 points narrower and more matchups are close. They harm nothing. *Confirmed (sim), but small.*
- **The main problem:** with the stronger player, the matchup table separates into winners and losers.
  - Tempo beats every deck by 63–77%.
  - Bastion loses to every deck except Thornwild by 69–77%.

## 3. First versus second player

| Second-player compensation (rec_v2) | First player wins |
|---|---|
| None | 64.8% |
| +2 Influence on the first turn (current) | 48.1% |
| +1 Influence and +1 card | 50.9% |

- With AI v1, +2 Influence gives 50.7% (base_v1).
- Without compensation, going first is a large advantage. Both forms of compensation fix it. *Confirmed (sim).*
- The two forms differ by under 3 points, close to the noise. The extra card also helped Abyssal Depths, the slowest deck, a little (59.0% against 55.3%).
- **Recommendation (Judgment):** keep +2 Influence. It is one number to remember. The alternative is equally acceptable and is an owner preference (section 10).

## 4. Game length

| Turns per player | Original (v1) | Recommended (v1) | Recommended (v2) |
|---|---|---|---|
| Average (median, middle half) | 7.9 (7, 6-9) | 8.0 (8, 6-9) | **6.7 (6, 6-7)** |
| 8 turns or more | 39% | 41% | 18% |

- Under the stronger player, only about 1 game in 6 reaches the provisional 8–10 turn target.
- About 0.4% of games are board stalls that reach the turn limit, with neither player willing to attack.
- **Harbor size is not the fix.** *Confirmed (sim), probe F.*

| Harbor | Turns | 7+ cards played per game | Land | Sea |
|---|---|---|---|---|
| 20 | 6.8 | 0.27 | 36.8% | 60.1% |
| 25 | 7.4 | 0.37 | 35.7% | 60.7% |
| 30 | 7.8 | 0.50 | 34.6% | 61.4% |

  - A larger Harbor makes games longer but makes Land slightly weaker.
  - What makes games fast is cheap damage in the card pool. *Hypothesis, supported by probe B: Charge units carry Tempo.*

## 5. Tactical mechanics: usage and effect

All for the main configuration (rec_v2) unless stated. "Shift" is the average change across the 15 matchups when the mechanic is switched off. The noise floor is 2.6.

| Mechanic | How often it matters | Shift when switched off | Verdict |
|---|---|---|---|
| Two fronts (vs one shared battlefield) | 7.8% of attacks go into the other front. 48% of blocks come from the other front. 58% of attack decisions are close calls between fronts | 2.7 (= noise). Side balance unchanged. Games +0.4 turns | The fronts create decisions but barely change who wins **with these cards** |
| Crossing changes combat? | Home-ground strike order decides 4.5% of fights; crossing attackers are in 10.5% of those | home-ground off: 0.6 | Crossing is rare and seldom decisive. *Confirmed (sim)* |
| Stranded | 0.47 unit-turns per game | 1.8 | Small. It is the main real cost of crossing |
| Vessel screening | Absorbs 2.6% of unblocked damage. Saves the defender about 7.5 times per 100 games | 1.1 | Works as designed. Small but symmetric with Strongholds |
| Stronghold screening ("walls") | Absorbs 2.6% of unblocked damage | **3.7** | Matters, in the wrong direction: Crown Bastion goes from 30.7% to 36.6% **without** it. Cause in section 7 |
| Carry (Vessels and the Dockmaster) | 0.7% of attacks | 0.0 | Does nothing measurable. *Confirmed (sim)* |
| Escort (Dual units) | 1.0% of attacks (v2); 4.5% with v1 | 0.7 | Barely used once the player is smarter |
| Surge | Most of the crossing that does happen | 1.3 | Small. It is Sea's identity for coastal raids |
| Domains | 0.1–0.3 per game | 2.1 | Below noise overall. Abyssal Depths drops 3 points without them |
| Swift and Ambush tricks | 0.34 Swift casts per game, all useful (v2). Ambush 0.04 per game | **4.4** | Swift spells matter (Tempo −5, Depths −6, Thornwild +6 without them). Ambush practically never happens |

- **Does crossing change combat outcomes?** Rarely.
  - With AI v2, 7.7% of attack decisions choose the non-home front.
  - Those attacks seldom decide fights.
  - Switching off the main crossing rule (home-ground) shifts results by 0.6 points, which is inside the noise.
  - Under v1, crossing looked more important (16–20%). That was partly the old player crossing when it should not.
- **Shore versus Deep choices:** the decisions are real. 58% of attack decisions are close between fronts, and half of all blocks come from the other front. But these choices rarely change the winner. **This is the central weakness of the two-front design so far.** *Confirmed (sim) for this pool. Hypothesis that better cards could change it.*

## 6. AI findings (AI changes, kept separate from balance changes)

**No card or rule was rebalanced in this round.** The Harbor 25, 80% stats, compensation and ablation runs are experiments only; the rules file still describes rules 0.2. The changes to the code were:

1. **Bug fix:** the random number generator now mixes its seed (Summary, point 1).
2. **Experiment hooks:**
   - a configuration object (`cfg`) for variants, ablations, compensation, stat scaling, Harbor size, seed offset and blocking logic;
   - extra logs (fights decided by strike order, wasted tricks, the game state when each card was played);
   - `lib.js`, `round2.js`, `probe.js` and `check.js`.
   - `sim.js` and `compare.js` now use the shared library. `compare.js` reproduces the round 1 comparison with AI v1 by default.
3. **AI v2**, an opt-in second computer player (v1 kept unchanged for comparison):

| Requested | What v2 does |
|---|---|
| Reserve Influence for Swift and Ambush | Holds Influence only for a cheap reactive card (cost 3 or less), and only when that card is worth more than the play it would displace |
| Evaluate positioning | Chooses the front for Dual units by Leaders, Domains and exposure to sweepers |
| Block intelligently across fronts | Values each block by what it kills, what it loses, and the damage it stops. Chump-blocks only when the Harbor is in danger |
| Value Vessels, Strongholds, Domains, escorts | Card-specific valuations: Vessel carry and screen, Stronghold screen weighted by how much the opponent attacks the Shore, the net effect of a shared Domain on both boards |
| Evaluate crossing | Plans the whole attack at once. It tries every unit on each front or held back, predicts the defender's blocks, counts screens, Stranded and escort capacity, and weighs the counterattack it invites (less when ahead in the race) |
| Avoid wasting tricks | Swift pumps only when they turn a fight. Swift bounce is kept for the opponent's attack. Ambush is played only into a block that wins |

- **Not more aggressive:**
  - attacks per game fell from 19.9 to 17.4;
  - Swift tricks went from 81% useful to 100% useful;
  - wasted Rootcalls went from 49% to 0%.
- **Why games are shorter:** v2 aims attacks where there is no good block, so blocks fall from 4.1 to 2.0 per game. Probe E shows this is attack choice, not weak defence: giving one side v1's blocking logic changes nothing (49.7%).
- **Strength:** v2 beats v1 56.9% overall. By the deck v2 played:

| Deck | v2's win rate against v1 |
|---|---|
| Tideborn Tempo | 68% |
| Abyssal Depths | 62% |
| Thornwild Rush | 55% |
| Fleet Raiders | 54% |
| Harbor Hybrid | 52% |
| Crown Bastion | 50% |

- **Limits (Hypothesis):**
  - v2's gains are uneven. It plays fast creature decks well and control decks no better than v1.
  - Part of Crown Bastion's 31% is therefore likely the computer player, not the cards. Probe A supports this: Bastion with v2 against a v1 field gains only 2 points, while Tempo gains 13.
  - v2 looks one turn ahead. It knows the defender's blocking logic exactly. It does not plan card advantage or hold removal for the right target.
  - A human control player would likely do better than 31%. How much better, the simulation cannot say.

## 7. Balance problems and their causes (Phase 4)

The method: find the cause with a with/without test before blaming a card.

**A. The 68% win rate after 7+ cost plays is selection, not power.** *Confirmed (sim).*
- The win rate depends mostly on the state of the game when the card is cast:

  | State when cast | 7+ cards win (v2) | 1–2 cost cards win (v2) |
  |---|---|---|
  | Behind | 33% | 18% |
  | Ahead | 95% | 91% |

- Matched on the same state from turn 7, 7+ cards still win 69–73%, against 52–66% for cheaper cards. On correlation alone that would look like power.
- The causal tests say otherwise:
  - Cutting all 7+ cards to 80% Power/Toughness moves no deck by more than 0.2 points.
  - Swapping them for plain 5-cost 5/5 units leaves decks equal or slightly *better* (Abyssal Depths +3.2).
- So a player who can afford to spend a whole turn on a 7-drop is usually a player who was not under pressure. The cards themselves add little, because they arrive in under a third of games and late.
- **Expensive cards are not overpowered. In the current pool they are slightly underpowered, because games end around turn 7.**

**B. Rootcall's 16% is two causes, both confirmed (sim).**
1. *The computer player.* v1 cast Rootcall whenever its unit was losing a fight, even when +2/+2 could not save it. 49% of casts were wasted. With v2 there are no wasted casts, and the win rate when played rises to 37%.
2. *The card.* Rootcall is still weak. Replacing it with a plain 2-cost 2/2 raises Thornwild Rush from 46.6% to 53.8% (v2) and from 41.6% to 54.8% (v1). A one-turn +2/+2 for 2 Influence is worth less than a permanent 2/2.
- The remaining low win rate when played is selection: you only pump in a fight you are losing.

**C. Tideborn Tempo under the improved AI is about Charge, not tricks.** *Confirmed (sim).*
- Tempo is the best deck under both players (59.6% with v1, 71% with v2), and v2 lifts it most.
- Probe B swapped each Tempo card for a plain unit of the same cost:
  - **Removing every Charge unit costs 6.7 points.** Deckhand Brawler (1 cost, 2/1, Charge) alone costs 5.6 points.
  - Replacing Fair Winds, Coral Spire, Tidal Shift, Riptide, Boarding Party or Undertow Mage with a plain unit makes Tempo *stronger*, by 2 to 7 points.
- So the "tempo" spells are below the value of a plain body. The deck wins because it puts cheap Charge damage on the table and v2 races well with it.
- **Hypothesis:** the general Sea lead comes from the same source: more efficient cheap bodies (Charge, Surge) and better removal, against Land defenders whose bonuses (Rampart, Strongholds) only work when the opponent attacks into them. A smart attacker avoids those.

**D. Crown Bastion and Strongholds.** *Confirmed (sim) for the effect. Hypothesis for the cause.*
- Bastion improves from 30.7% to 36.6% when Strongholds stop absorbing damage. The Strongholds' passive bonuses stay in that test.
- **Hypothesis:** a Stronghold costs 4–5 Influence for durability that soaks only 2.6% of damage, because attackers simply go into the Deep. v2 values Strongholds by how much the opponent attacks the Shore, so it keeps paying for them.
- Either Strongholds are poor value for their cost or the AI overvalues them. The two cannot be separated without changing the card, which this round did not do.

**E. Second-player compensation.** See section 3. +2 Influence and +1 Influence +1 card are both within 2 points of 50%. *Confirmed (sim).*

## 8. Complexity audit (Phase 5)

The question for each rule: how much a new player must learn, against how much it changes play. Impact is from section 5.

| Concept | Learning cost | Measured impact | Proposal |
|---|---|---|---|
| Influence | Low (familiar) | Core | **Keep** |
| Allegiance (commitment) | Medium | Shapes deckbuilding; not ablated | **Keep.** It is the Land/Sea identity at deckbuilding |
| Shore and Deep | Medium | Close decisions in 58% of attacks; outcome effect at noise level | **Keep for round 3, on probation** (section 10, decision 1) |
| Home ground (strike first) | High: needs per-fight checks | 0.6 (noise) | **Drop.** Crossing keeps one cost: Stranded |
| Stranded | Low | 1.8 | **Keep** as the single cost of fighting away from home |
| Carry | Medium | 0.0 | **Merge** (below) |
| Escort | Medium | 0.7 | **Merge** (below) |
| Vessel screening | Low once Strongholds are known | 1.1 | **Keep**, stated together with Strongholds as one rule |
| Stronghold protection | Low | 3.7, but hurts its own deck | **Keep the rule, fix the cards:** cheaper, or more durable for the cost |
| Surge | Low | 1.3 | **Keep** as a Sea keyword |
| Domains | Medium (shared, replaceable) | 2.1 | **Keep**, as card-level variety |
| Swift | Low | Large (with tricks, 4.4) | **Keep** |
| Ambush | Medium | About 0 (0.04 per game) | **Merge into Swift**: a Swift unit can be played during the opponent's battle as a blocker |

The simplifications in one place:
1. **One crossing rule.**
   - A unit can attack into either front.
   - If that front is not its home, it is *Stranded*: it stays exhausted through your next Rise.
   - Home-ground strike order is removed.
   - Rampart stays, because it is printed on cards.
2. **One "ferry" keyword instead of carry plus escort.**
   - *Ferry N*: when you attack, up to N of your attackers count as at home wherever they fight.
   - It goes on Vessels and Harbor Leagues cards.
   - It replaces both the Vessel carry rule and the universal Dual escort rule. Escort as a rule is dropped: at 1% use it does not earn a line in the rulebook.
3. **One screening rule.** "Unblocked damage on the Shore hits your Strongholds first; unblocked damage in the Deep hits your Vessels first."
4. **One flash keyword.** Ambush becomes "Swift" on a unit.

- The Land/Sea identity survives intact: two fronts, home fronts on every card, Allegiance, Surge raids, Vessels guarding the Deep and Strongholds guarding the Shore. *Judgment.*
- In the simulation, each removed rule is below the noise floor, so the 0.3 rules should play like 0.2. *Hypothesis: not yet run as a combined configuration.*

## 9. Recommended final prototype rules (proposal: rules 0.3)

| Area | Rules 0.2 | Proposed 0.3 | Status |
|---|---|---|---|
| Battlefield | Shore and Deep | Unchanged | Owner approved; on probation (decision 1) |
| Resources | Influence +1 per turn to 10; commitment Allegiance | Unchanged | Keep |
| Going second | +2 Influence | +2 Influence | Recommended (decision 4) |
| Harbor | 20 | 20 | Length is a card-pool question (decision 5) |
| Blocking | Any ready unit, from either front; Vessels only in the Deep | Unchanged | Keep |
| Crossing | Home-ground strike order + Stranded | **Stranded only** | Recommended (decision 2) |
| Carry and escort | Vessel carry; Dual escort variant | **Ferry N keyword** on Vessels and Harbor Leagues cards | Recommended (decision 3) |
| Screens | Strongholds on the Shore | **Strongholds screen the Shore, Vessels screen the Deep** | Adopt (variant 1) |
| Tricks | Swift spells; Ambush units | **Swift** on spells and units | Recommended |
| Reef Domains, Raid | Variants | Card-level tools, not rules | As the owner asked |

**Card-pool work for round 3, needed before any card-set planning.** These are proposals from confirmed causes, not correlations:
- Raise Rootcall to at least plain-unit value; for example +2/+2 *and* Swift ready, or 1 Influence.
- Bring the Tempo support spells (Fair Winds, Coral Spire, Tidal Shift, Riptide, Boarding Party) up to the value of a plain unit.
- Slow the cheapest Charge damage (Deckhand Brawler).
- Give Land defenders value that does not depend on being attacked.
- Retest Strongholds at a lower cost.
- Do not change the 7+ cards until game length is settled.

## 10. Outstanding owner decisions

1. **Keep the two-front battlefield?**
   - The evidence so far:
     - it creates real decisions (close calls in 58% of attacks, half of all blocks come from the other front);
     - it does not yet change who wins (removing it is a noise-level change).
   - The options:
     - **(a) Keep it on probation for round 3 (recommended).** Give the fronts teeth through cards: front-specific Domains, Ferry, screens and Surge. Drop it if it still does not matter.
     - (b) Collapse to one battlefield now. Keep Land and Sea as card identity: Allegiance, Surge, Vessels and Strongholds as card types. This is simpler, but the "Land versus Sea battle" becomes flavour.
     - (c) Make the fronts matter by rule, for example a separate Harbor per front. This is a bigger redesign and would need a new round.
2. **Home-ground strike order.**
   - (a) Drop it (recommended): it decides 4.5% of fights and has no measurable effect.
   - (b) Keep it.
3. **Carry and escort.**
   - (a) Merge them into a Ferry keyword (recommended).
   - (b) Keep the Dual escort rule as approved for testing.
   - (c) Drop both.
4. **Going-second compensation.**
   - (a) +2 Influence (recommended, simpler).
   - (b) +1 Influence and +1 card. This is equally fair and helps slow decks slightly.
5. **Match length.**
   - Under the stronger player, games run about 7 turns.
   - (a) Accept about 7 turns as the target.
   - (b) Keep 8–10 and reach it through the card pool: less cheap Charge damage and stronger defenders. Recommended if expensive cards are meant to matter.
   - (c) A bigger Harbor. Not recommended: it lengthens games but widens the Land/Sea gap.
6. **Permission to change prototype card numbers in round 3**, using the causes listed in section 9. This round changed no cards, as instructed.
7. **Ambush.**
   - (a) Fold it into Swift (recommended).
   - (b) Keep it as its own keyword and make Ambush units cheaper.

**Is the simulation proof?** No. It shows:
- which rules almost never matter;
- which cards are below the value of a plain unit;
- that the stronger computer player favours fast Sea decks.

Human playtesting is still needed for:
- how complex the rules feel;
- whether control decks are as weak as the simulation says, since the computer player is known to be weakest there;
- whether the front decisions are fun even when they rarely change the winner.
