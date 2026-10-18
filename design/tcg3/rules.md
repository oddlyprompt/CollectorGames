# Rift Parade: how to play (rules version 0.1, Set 01: Wrong Side of Reality)

Rift Parade is a two-player card game for the supernatural anime *Rift Parade*. Each player leads a small cast of couriers, ghost hunters, mechanics, gamblers and yokai through a city whose reality keeps fracturing. You win by reducing the other player's **Resolve** to 0.

This document is the rule book for the playable engine in `tools/rift-parade/`. Every number in the *Parameters* table is read from `tools/rift-parade/rules.json`; `node tools/rift-parade/docs.js --check` fails if this table goes stale. The card reference is `CARDS.md`.

<!-- PARAMS -->
| Parameter | Value | Meaning |
|---|---|---|
| `deckSize` | 40 | Cards in a deck |
| `copies` | 3 | Copies of one card (Secret Rares: 1) |
| `resolve` | 20 | Starting Resolve |
| `openingHand` | 5 | Opening hand |
| `drawPerTurn` | 2 | Cards drawn each turn |
| `firstPlayerFirstDraw` | 1 | Cards the first player draws on their first turn |
| `secondPlayerFirstEnergy` | 1 | Extra energy for the second player, first turn |
| `secondPlayerSecondEnergy` | 1 | Extra energy for the second player, second turn |
| `secondPlayerExtraDraw` | 0 | Extra cards for the second player, first turn |
| `slipPerTurn` | 1 | Cards slipped into the Rift pool per turn |
| `energyCap` | 8 | Largest Rift pool |
| `handMax` | 7 | Hand size at end of turn |
| `stageMax` | 3 | Stage slots |
| `backMax` | 2 | Backstage slots |
| `relicMax` | 3 | Relic slots |
| `riftMax` | 6 | Rift level that fires an Anomaly |
| `riftStart` | 0 | Rift at the start |
| `riftReset` | 2 | Rift after an Anomaly |
| `riftPerRound` | 1 | Rift gained each round |
| `phaseMinRift` | 3 | Lowest Rift at which Phase works |
| `momentumCap` | 3 | Largest Momentum bonus |
| `resonanceCap` | 2 | Largest Resonance bonus |
| `absorbCap` | 5 | Most Impact on an Absorb Character |
| `turnLimit` | 60 | Turns (both players) before a draw |
| `anomalyDamage` | 1 | Gravity Fault damage |
| `anomalyBleed` | 2 | Static Bleed Resolve loss |
| `anomalyOverflow` | 2 | Overflow extra energy |
<!-- /PARAMS -->

## 1. What makes it different

* **The Rift pool is your energy, and your cards pay for themselves.** There are no land cards. Each turn you may *slip* one card from your hand, face down, into your Rift pool. Slipped cards are your energy. Which card you give up is the central decision of every turn, and several characters (Nova, Pippi, Momo) interact with the pool directly.
* **One shared gauge, the Rift, fractures reality.** It rises by one each round. When it fills, an **Anomaly** fires (gravity, bleeding Resolve, characters sliding Backstage, a free draw, extra energy, or a blank page). The next Anomaly is always visible, so both players can plan around it. Cards push the gauge up or down and some choose the Anomaly.
* **Position matters.** Characters stand on the **Stage** (they attack and block) or **Backstage** (safe, with a support role). You may Step one character a turn, and many cards move characters around.
* **The ten central abilities are mechanics, not flavour.** Kai's Momentum, Nova's Phase and Step, Mika's Imbue, Ayame's Sever, Toma's Mark, Lulu's Resonance, Pippi's Mend, Momo's Haunt, Crow's Wager, Brax's Impact, Reiya's Bargain, and Vivi's Spotlight each define a style of play (see section 11).
* **Same character, new episode.** Characters have several cards, one per moment of the story. **Next Episode** lets you play a later version on top of an earlier one for only the cost difference.

## 2. Components and zones

Each player has a 40-card deck and uses these places:

| Place | What it is |
|---|---|
| **Deck** | Face down. Running out when you must draw loses the game. |
| **Hand** | Hidden. Maximum 7 at the end of your turn. |
| **Rift pool** | Slipped cards, face down. Each card is **ready** or **exhausted**; every ready card is 1 energy. |
| **Stage** | Up to 3 Characters. They can attack and block. |
| **Backstage** | Up to 2 Characters. They cannot attack or block and cannot be hit in combat, but they use their *Backstage* abilities and static bonuses. |
| **Relics** | Up to 3 permanent objects. Playing a fourth means sacrificing one. |
| **Zone** | One card for the whole table. A new Zone replaces the old one. |
| **Conditions** | Attached to a Character or to a player. |
| **Discard pile** | Face up. |

Counters you will see: each player's **Resolve**, the shared **Rift** gauge, **Impact** counters (Brax cards), **Seal** counters (the Parcel Relics), the **Mark** on a Character.

## 3. Deck construction

* Exactly 40 cards.
* At most 3 copies of any card (by card number). The two Secret Rares (Ayame, The Cut Between Worlds and Mika, Trouble Looks Good on Me) are limited to 1 copy: they are the strongest finishers.
* There are no factions. Any legal 40 cards may be played together. The set is built so that cards of the same character or theme work well together (section 11), but every card is playable in any deck.
* **Rarity does not change what a card does.** An alternate-art printing, a Super Rare or a Secret Rare plays exactly like the base card of that number. The hidden Episode Break printing is the Super Rare Nova (RP01-116) with different art; it is not a separate card.

## 4. Setup

1. Shuffle both decks. Decide who goes first (a coin flip, or the loser of the previous game).
2. Each player draws 5 cards. In turn order, each player may **mulligan** once: set aside any number of cards, draw that many new cards, then shuffle the set-aside cards back into the deck.
3. Both players start at Resolve 20. The Rift starts at 0. The first Anomaly is chosen at random and shown face up.
4. The first player draws only 1 card on their first turn (instead of 2). To make up for going second, the second player has **1 extra energy on each of their first two turns**.

## 5. A turn

1. **Wake.** Ready all your Rift cards and Characters. On the first player's turn from round 2 onward the Rift rises by 1 (a *round* is one turn of each player). Then "at your wake" effects happen.
2. **Draw** 2 cards.
3. **Main phase.** Do any of these, in any order, as often as you can pay for:
   * **Slip** one card from hand into your Rift pool (once per turn, up to 8 cards in the pool).
   * **Play** a card by paying its cost: exhaust that many ready Rift cards.
   * **Use** an activated ability (marked *Act*), at most once per turn per source.
   * **Step** one Character you control to the other row for free, or swap two Characters between rows (once per turn).
4. **Attack phase.** Choose any of your ready Stage Characters and attack. See section 7.
5. **Second main phase.** Same as the first, except you cannot attack again.
6. **End.** "At the end of your turn" effects happen. All damage on Characters heals and "until end of turn" effects end. Discard down to 7 cards.

You need not use all your energy. Ready Rift cards you leave alone stay ready during your opponent's turn, so you can play **Reactions**.

## 6. Card types

* **Character** (Power/Health). Enters the Stage or Backstage (your choice). A Character that enters cannot attack that turn unless it has **Rush**, but it can block at once (unless an effect says it enters exhausted).
* **Technique.** A one-shot effect. Techniques marked *Reaction* may also be played during combat (see section 7); every Technique may be played in your main phase.
* **Relic.** A permanent object with static or activated abilities. Some can be **Imbued** to become a Character for a turn.
* **Zone.** A permanent shared location. Its effects are written from its owner's point of view.
* **Condition.** Attaches to a Character or a player (the card says which). Conditions can end in several ways: they may have a countdown ("lasts N wakes"), a **ransom** (the host's controller may pay to remove it), or be removed by **Sever** or **Purge** effects.

## 7. Combat

1. **Declare.** Exhaust each attacking Character. "When this attacks" triggers happen. Attackers cannot block on your opponent's next turn (they are exhausted until your next wake), so every attack is a decision about defence too.
2. **Block.** The defender assigns blockers: each ready Stage Character may block one attacker, and each attacker is blocked by at most one Character. Blocking does not exhaust. **Phase** attackers can be blocked only by Phase or Sever Characters.
3. **Reaction window.** Starting with the defender and alternating, each player may play a Reaction (a Reaction Technique or an activated ability marked as a Reaction), paying energy as usual, until both pass in a row. There is no stack: each Reaction resolves completely before the next player decides.
4. **Damage.** All combat damage is dealt at once. A blocked attacker and its blocker damage each other. An unblocked attacker reduces the defender's Resolve by its Power. A blocked attacker whose blocker has left deals no damage. Characters whose damage equals or exceeds their Health are defeated.

Characters attack the player, not other Characters; the only way to remove a Character is a block, a Technique or an effect. Damage on Characters disappears at the end of every turn.

## 8. The Rift and Anomalies

The Rift gauge runs from 0 to 6 and is shared. It rises by 1 each round and many cards raise or lower it. When it reaches 6:

1. The visible **Anomaly** fires.
2. The gauge drops to 2.
3. A new Anomaly is chosen at random and shown.

| Anomaly | Effect |
|---|---|
| **Gravity Fault** | Each Character takes 1 damage. |
| **Static Bleed** | Each player loses 2 Resolve. |
| **Row Slip** | Each player moves their highest-Power Stage Character Backstage, if there is room. |
| **Overflow** | Each player has 2 extra energy on their next turn. |
| **Echo Hour** | Each player draws a card. |
| **Blank Page** | The Zone and every Condition are destroyed. |

Other things the Rift does: **Phase** has no effect at Rift 0, 1 or 2, and several cards check the Rift level ("while the Rift is 3 or more"). Mending cards (Pippi) lower it and navigation cards (Nova) raise it or choose the next Anomaly.

## 9. Winning

* Reduce the opponent's Resolve to 0 or less. If both players reach 0 at the same time the game is a draw.
* A player who must draw from an empty deck loses.
* After 30 rounds with no winner the game is a draw (stalled games are measured in testing and should be very rare).

## 10. Rules details

* **Targets.** Effects that target choose when they resolve. If a Stage Character with **Spotlight** is on the other side, an effect that targets must target a Spotlight Stage Character if able. Mass effects ("each") do not target.
* **Silence.** A silenced Character loses all its abilities and keywords (not its stats) until the end of its controller's next turn.
* **Mark.** A Marked Character takes 1 extra damage from every source and loses Phase. The Mark stays until the Character leaves play.
* **Sever** (the effect) destroys one Condition, Relic or Zone. **Purge** removes all Conditions and the Mark from a Character.
* **Temporary effects** end at the end of the turn. "Permanent" counters stay on the card.
* **Imbue.** An Imbued Relic becomes a Character of the stated Power/Health until the end of the turn. It can attack that turn. If it takes lethal damage it is destroyed. It cannot block.
* **Wager.** Call High or Low, then reveal the top card of your deck. High wins if its cost is 3 or more, Low if it is 2 or less. The revealed card goes to the bottom. A player knows their own decklist, so the call is a decision.
* **Bargain.** Your opponent chooses one of two options. Their choice is made with full information.
* **Step.** Moving one of your Characters to the other row. Characters with *can't Step* effects are stuck.
* **Next Episode.** A Character card with the same character name as a cheaper Character you control can be played on top of it. Pay the cost difference. The new card replaces the old one in the same row, keeping damage, counters, Marks, Conditions and its exhausted status. The old card goes to the discard pile.
* **Haunt.** A defeated Haunt Character goes to its owner's Rift pool, exhausted, instead of the discard pile (if the pool is not full).
* **Ties in the order of effects.** The active player's effects happen first.

## 11. The keywords and the ten central abilities

| Keyword | Meaning |
|---|---|
| **Rush** | Can attack the turn it enters. |
| **Phase** | Can be blocked only by Phase or Sever Characters. No effect while the Rift is 0, 1 or 2, or while Marked. |
| **Momentum** | +1 Power for each Technique you played this turn (up to +3). Kai. |
| **Sever** | Can block Phase. Characters it damages are silenced. Ayame. |
| **Resonance** | +1 Power for each other Resonance Character you control (up to +2). Lulu. |
| **Absorb** | Whenever damaged, gains that much Impact (up to 5). Release (an activated ability) turns Impact into damage. Brax. |
| **Haunt** | See section 10. Momo and the yokai. |
| **Spotlight** | See section 10. Vivi. |
| **Reservoir** | Collects Impact whenever any Character you control is damaged (up to 10). Brax, Impact Reservoir. |

| Character | Style | Mechanic |
|---|---|---|
| **Kai** | Aggressive Techniques | Momentum, Rush, Hard Stop and Kinetic Reversal. |
| **Nova** | Dimensional tempo | Phase, Step, Pull, moving the Rift and choosing Anomalies, bounce. |
| **Mika** | Relic engines | Imbue: Relics become attackers for a turn. |
| **Ayame** | Control | Sever: silence, destroy Conditions, Relics and Zones. |
| **Toma** | Tactical control | Mark: weak points, extra damage, targeted kills. |
| **Lulu** | Go-wide teams | Resonance: the team grows with each member. |
| **Pippi** | Sustain | Mend: heal, lower the Rift, revive. |
| **Momo** | Value and disruption | Haunt: yokai return as energy; looks at and strips the opponent's hand. |
| **Crow** | Risk and reward | Wager: win cards, damage or tempo, or pay for losing. |
| **Brax** | Defence | Absorb and Release: stores damage, fires it back. |
| **Reiya** | Relic trading | Bargain, selling Relics for cards, taxing the opponent. |
| **Vivi** | Positioning | Spotlight: protect your team, drag the other team onto the Stage. |

## 12. Representative decks (`decks.js`)

Eight illustrative 40-card decks, not factions: **Kinetic Rush** (aggro), **Impact Wall** (defensive control), **Resonance Chorus** (go wide), **Sever and Mark** (tactical control), **Workshop** (Relic combinations), **Rift Walkers** (dimensional tempo), **High Rollers** (risk and reward), **Haunted Broadcast** (midrange positioning).

## 13. A short example turn

You have 2 ready Rift cards and Kai, Bad Idea Specialist (3/2 Momentum, Rush) on the Stage. You slip Redirected Blow (energy: 3). You play Temporary Spark on Kai (1 energy): +2/+0 and, because you control a Relic, +0/+1. It is the first Technique you played this turn, so Kai gets Momentum +1: he is 6/3. You attack. The opponent has one ready blocker, a 2/2, and blocks. They have a Reaction in hand but only 1 energy ready. Kai kills the blocker and takes 2. At end of turn all damage heals. The Rift rises at your next wake.
