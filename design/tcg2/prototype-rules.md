# Tidemark prototype rules (version 0.3, for simulation)

**Working design.** The owner approved:
- the two-front Shore and Deep battlefield;
- universal cross-front combat with tactical (not numerical) disadvantages;
- commitment-based Allegiance;
- a 60-card prototype simulated before any card library or art.

After round 2, the owner approved its recommendations, which make up version 0.3:
- home-ground strike order removed;
- carry and escort merged into the Ferry keyword;
- Vessels screen the Deep;
- Ambush folded into Swift;
- +2 Influence for the second player;
- game length reached through the cards;
- prototype card changes allowed.

The two fronts are on probation: kept for now, to be dropped if they still do not change outcomes.

**Everything below is provisional and exists to be tested.**
- Engine: `tools/tidemark/engine.js` (`rules:'0.3'`).
- Cards: `tools/tidemark/cards.js` (pool 0.3).
- Latest results: `round3-report.md`.

None of it is in the game build.

## The table

- Two fronts: the **Shore** (Land) and the **Deep** (Sea).
- Each player has a **Harbor** with 20 strength. Reduce the opponent's Harbor to 0 to win. A player who must draw from an empty deck loses.
- Every card has a preferred environment, its **home**:
  - Land cards: the Shore.
  - Sea cards: the Deep.
  - Dual and Neutral cards: both.
  - Vessels: the Deep.
- Units enter on their home front (Dual: either).

## Resources

- **Influence:** at the start of each turn your capacity rises by 1 (to 10) and refills. Some cards add capacity.
- **Allegiance (commitment):** a card marked *Land 2* needs 2 Land permanents in play.
  - What counts: units, Vessels, Strongholds, Relics, Enchantments and the Domains you played.
  - Dual permanents count for both sides. Neutral cards need nothing.
  - Dedicated decks reach their strongest cards sooner; hybrid decks later.
- The player who goes second gets 2 extra Influence on their first turn.

## A turn

1. **Rise:** Influence capacity +1 and refill. Ready your units; a Stranded unit stays exhausted this one turn instead. Rise effects happen.
2. **Draw** a card. The first player skips this on the first turn.
3. **Main:** play cards. A unit enters ready: it can block on the opponent's next turn, but it cannot attack this turn unless it has *Charge*.
4. **Battle:** attack.
5. **Second main:** play more cards.
6. **End:** damage on units heals.

## Battle

- Each ready unit may attack **either front**. Attacking exhausts it until your next Rise.
- The defender may block with any ready unit, **from either front**. Vessels only block in the Deep. One blocker per attacker.
- Blocked units deal damage to each other at the same time.
- **Stranded**, the one cost of crossing: a unit that attacked away from home stays exhausted through your next Rise. It can neither attack nor block next round.
- **Surge:** the unit is at home when it attacks the Shore.
- **Ferry N** (keyword on Vessels and Harbor Leagues units): when you attack, up to N of your attackers count as at home wherever they fight.
- **Screens:** unblocked damage hits these before the Harbor:
  - on the Shore, the defender's **Strongholds**;
  - in the Deep, the defender's **Vessels**.

## The seven card types in the prototype

| Type | Prototype behaviour |
|---|---|
| Units | Power/Toughness, home front, keywords |
| Spells | One-time effects. *Swift* spells can be used during battle, by the defender too |
| Relics | Equipment attached to a unit, or a tool with an ongoing effect |
| Vessels | Deep units that can attack and block in the Deep, screen the Deep and usually have Ferry |
| Strongholds | On the Shore: durability that screens unblocked Shore damage, plus a defensive bonus |
| Domains | One per front, shared by both players; replaced when a new one is played |
| Enchantments | Ongoing effects |

**Keywords:**

| Keyword | Effect |
|---|---|
| Charge | Attacks the turn it arrives |
| Surge | At home when it attacks the Shore |
| Rampart | +2 toughness when blocking at home |
| Leader | Other units on its front get +1 power |
| Swift | A Swift spell can be cast during battle. A Swift unit can be played from hand during the opponent's battle, as a blocker |
| Undertow | A unit that fights it and survives returns to its owner's hand |
| Tough | Takes 1 less damage |
| Trample | Excess damage carries through |
| Ferry N | Up to N of your attackers count as at home wherever they fight |

## Option under test, not adopted

**Rising tide:** after turn 12, each player's Harbor loses 1 at their Rise. It ends board stalls (section 7 of `round3-report.md`). This is an owner decision.

## History

| Round | What happened |
|---|---|
| Round 1 (`prototype-report.md`, `crossing-variants.md`) | Rules 0.1 failed: blocking only on your own front turned games into races. Rules 0.2 fixed it. Four crossing variants were compared |
| Round 2 (`round2-report.md`) | A stronger computer player and with/without tests showed which rules mattered. Proposed rules 0.3 |
| Round 3 (`round3-report.md`) | Rules 0.3 and pool 0.3. Fixed a simulator bug (units entered exhausted), which changed several round 2 conclusions |

Rounds 1 and 2 also ran with a shuffle bug, so their balance numbers are not reliable. Use round 3's.
