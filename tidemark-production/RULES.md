# Tidemark rules 1.0

The rules the Tidemark cards (`CARDS.md`, `cards.json`) are designed and simulated for. The engine is `tools/tidemark/v1/engine.js`. Rules 1.0 is the prototype's rules 0.3 (`design/tcg2/prototype-rules.md`), which the owner approved, plus the round 3 recommendations, decided 2026-10-19 when the owner asked for the cards to be built:

- the rising tide is adopted (round 3, decision 1a);
- Vessel screens are kept (decision 3a);
- the prototype's eight disputed card changes are kept (decision 4a).

The human paper playtest recommended in round 3 has **not** happened yet. Treat every number as provisional until people have played.

## The table

- Two fronts: the **Shore** (Land) and the **Deep** (Sea).
- Each player has a **Harbor** with 20 strength. Reduce your opponent's to 0 to win. A player who must draw from an empty deck loses.
- A card's **home**:
  - Land cards: the Shore.
  - Sea cards: the Deep.
  - Dual (Harbor Leagues) and Neutral cards: both fronts.
  - Vessels: always the Deep.
- Units enter on their home front. A Dual or Neutral unit chooses which front.

## Decks

- 50 cards.
- Up to 3 copies of a card, and 1 of each Legendary.
- The format for the anniversary is **Tenth Tide**: the 220 cards of the set (its 150 new cards and 70 reprints).

## Resources

- **Influence:**
  - At your Rise your capacity grows by 1, to a maximum of 10, and refills.
  - Some cards add capacity, and some give Influence for one turn only.
  - The player who goes second gets 2 extra Influence on their first turn.
- **Allegiance:** a card marked *Land 2* needs 2 Land permanents in play.
  - Permanents are units, Vessels, Strongholds, Relics (Equipment too), Enchantments (Auras too) and the Domains you played. Tokens do not count.
  - Dual permanents count for both sides. A Dual card marked 2 needs 2 of either side.
  - Neutral cards need nothing.
- **Costs:**
  - Effects that make cards cost more or less change the Influence cost.
  - A card that costs anything still costs at least 1.

## A turn

1. **Rise:**
   - Capacity grows by 1 and refills.
   - Ready your units. A Stranded unit stays exhausted instead.
   - Protection that lasted "until your next turn" ends.
   - **Rising tide:** after your 12th turn, your Harbor loses 1 at every Rise. This ends board stalls.
   - "At your Rise" effects happen.
2. **Draw** a card. The first player skips this on the first turn.
3. **Main:** play cards. A unit enters ready: it can block on your opponent's next turn, but it cannot attack this turn unless it has Charge.
4. **Battle.**
5. **Second main:** play more cards.
6. **End:** damage on units heals, and "this turn" effects end.

## Battle

- **Attacking:**
  - Each ready unit may attack **either front**. Attacking exhausts it.
  - A unit attacking a front that is not its home is **away from home**.
- **Blocking:**
  - The defender may block with any ready unit, **from either front**.
  - Vessels only block in the Deep.
  - Each blocker stops one attacker (a few cards can block two).
  - Blocked units deal damage to each other at the same time.
- **Stranded:**
  - A unit that attacked away from home and survived stays exhausted through your next Rise.
  - It can neither attack nor block in the next round.
- **Screens:** unblocked damage hits these before the Harbor:
  - the defender's **Strongholds**, on the Shore (some also screen the Deep);
  - the defender's **Vessels**, in the Deep.
- **Swift:**
  - A Swift spell can be played during any battle, by either player.
  - A Swift unit can be played during your opponent's battle, and it can block at once.
- **Domains:**
  - There is one Domain per front, shared by both players. A new one replaces the old one.
  - A Domain affects the units on its front, and its cost changes, for both players.
  - Its "at your Rise" effects happen for each player at their own Rise.
  - Its "whenever" effects happen for the player they concern.

## Keywords

| Keyword | Effect |
|---|---|
| Charge | Can attack the turn it arrives |
| Surge | At home when it attacks the Shore |
| Rampart | +0/+2 while blocking at home |
| Leader | Your other units on its front get +1 Power. Leaders add up |
| Swift | See Battle |
| Undertow | A unit that fights it and survives returns to its owner's hand |
| Tough | Takes 1 less damage from each source |
| Trample | Combat damage beyond what kills its blocker carries on to the screens and Harbor |
| Ferry N | When you attack, up to N of your attackers count as at home wherever they fight |

## Card types

| Type | What it does |
|---|---|
| Unit | Power/Toughness, a home front, keywords and abilities |
| Vessel | A unit of the Deep that screens the Deep and usually has Ferry |
| Spell | A one-time effect; Swift spells can be played in battle |
| Relic | **Equipment** attaches to one of your units and moves to the discard pile when that unit leaves play. A **Tool** stays in play on its own |
| Stronghold | Durability that screens unblocked Shore damage, plus an effect. It is destroyed at 0 durability |
| Domain | Changes one front for both players (see Battle) |
| Enchantment | **Auras** attach to a unit. **Front** and **Player** Enchantments stay in play with an ongoing effect |

## Interpretations agreed in the card design

- "Heals a unit" means protection, because damage heals every turn anyway: the unit gets +0/+N until your next turn.
- "Can block Swift units" means watchfulness: your opponent's Swift cards cost more.
- Swift on a unit already in play does nothing, so Equipment and Auras that "give Swift" give Charge, Undertow or toughness instead.
- Tokens count their name as a subtype: a Mercenary token is a Mercenary.

Each card's design note (`n` in `tools/tidemark/v1/design_*.js`, shown in the gallery) explains how its checklist role became rules.
