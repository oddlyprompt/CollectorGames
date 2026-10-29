# First Tide expansion: design proposal for 66 new cards (59 → 125)

> **PAUSED 2026-10-22 by the owner pending the reuse-first audit (`tidemark-reuse-audit.md`): do not approve or use. The audit finds First Tide needs 0 new cards for honest products and 16 for a full booster.**

Status: **proposal only** (2026-10-22). No card has been added to `cards.json`, no collector number is used, no art is commissioned. Everything below is **designed by Claude, not canon**, and waits for the owner's review. Numbers are a first draft from the Version 1 design guide (`tools/tidemark/v1/DESIGN_GUIDE.md`); the real numbers come from the validator and simulation after approval.

## 1. What is being proposed

First Tide keeps its 59 printed cards, their collector numbers (3, 7, 11 … 248 of 250) and its identity as the foundational set. Sixty-six cards fill the gaps in the 250-number checklist, so the set is catalogued as **125 of 250** ("the original run was advertised at 250; 125 are catalogued"). Reprints in other sets and all existing prices keep working.

| | C | U | R | L | total |
|---|---|---|---|---|---|
| now | 25 | 20 | 9 | 5 | 59 |
| added | 30 | 18 | 15 | 3 | 66 |
| after | 55 | 38 | 24 | 8 | 125 |

Why these numbers: a 15-card booster needs about 40 distinct commons, 15 uncommons and 10 rares/Legendaries to avoid repeating the same cards over and over (product tier rule in `design/tidemark-historical-set-structure.md`). 55/38/24/8 clears that with room, and the Legendary count of 8 matches the founding mythology: five exist (Queen Isolde Varr, Old Hollowhorn, Admiral Kestra Vane, Ancient Leviathan, Merchant Prince Aurel). The three new ones go to the three factions that have no Legendary in the set (Iron Reach, Tideborn, Neutral). Abyssal Choir, Crownlands, Thornwild, Free Fleets and Harbor Leagues keep exactly one.

By faction (after): Crownlands 16, Thornwild 16, Iron Reach 16, Tideborn 16, Free Fleets 16, Abyssal Choir 16, Harbor Leagues 15, Neutral 14 (+ the existing counts of 8/7/8/8/8/8/6/6 and the 66 below: 8/9/8/8/8/8/9/8).

## 2. Historical fit

First Tide is the first set in the world's history: the two coasts have just met. So the new cards are the *ordinary working cards of that first year* (pikemen, skiffs, sappers, hedge healers) plus a handful of foundation figures. Rules for all 66:

- Only the 9 keywords of Rules 1.0 and ops that already exist in `ops.js`. No new keyword, no new op, no new card type.
- Nothing that outclasses the prototype's balance points. Commons are simple (a body, or one keyword, or one small effect); each faction's identity stays as in the design guide.
- No card that will later be reprinted needs to be replaced; the 70 Tenth Tide reprints draw only on cards that already exist.
- The names below are working names. Before approval they are checked against all 650 identities for clashes; names that clash are replaced, not suffixed.
- Illustration subjects are one line each, to be turned into art directions only after approval. None of this is art.

## 3. The 66 cards

`Cost/Req` = Influence cost / Allegiance requirement. Stats follow the guide (plain units: power + toughness = 2 × cost, rare +1, Legendary +2, each keyword paid for in stat points). Collector numbers are not assigned here; after approval they are the nearest free gap in the 250-slot checklist, in rarity order, so the original spacing is kept.

### Crownlands (8): steady defence, Strongholds, soldiers, Levy
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Gatehouse Pikeman | C | Unit | 3/1 | 2/3 | Rampart | a pikeman braced in a stone gateway |
| Banner Bearer | C | Unit | 2/0 | 1/2 | Leader | a young soldier with the royal standard |
| Beacon Tower | C | Stronghold | 2/0 | durability 5 | When it enters play, look at the top 2 cards (scry 2) | a signal tower on a headland |
| Hold the Line | C | Spell (Swift) | 1/0 | | Your units get +0/+2 this turn | a shield wall under arrows |
| Bastion Quartermaster | U | Unit | 3/1 | 2/2 | When it enters play, one of your Strongholds gains 2 durability | a clerk counting stone blocks |
| Marching Colors | U | Enchantment | 3/1 | | Your Soldiers get +1/+0 | a column under crimson banners |
| Lord Marshal Dorran | R | Unit | 5/2 | 4/5 | Leader | a veteran marshal in plate |
| Citadel of Aldermere | R | Stronghold | 5/2 | durability 9 | At your Rise, one of your Strongholds gains 2 durability | a hill fortress with three curtain walls |

### Thornwild (9): aggressive beasts and growth
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Thorn Hound | C | Unit | 2/0 | 2/2 | Charge | a lean hound bursting from brambles |
| Thicket Wolf | C | Unit | 3/1 | 3/2 | Trample | a grey wolf mid-leap |
| Seedtime | C | Spell | 2/0 | | Your Influence capacity grows by 1 | spring planting among old roots |
| Fernhollow | C | Domain (Shore) | 2/0 | | Beasts on this front get +1/+1 (both players) | a sunlit fern glade |
| Ridge Stalker | U | Unit | 4/1 | 3/4 | Swift | a lynx on a rock ledge |
| Heartwood Druid | U | Unit | 2/1 | 1/2 | At your Rise, it gets +1/+0 permanently | a druid kneeling at a root |
| Antlered Titan | R | Unit | 6/2 | 6/6 | Trample | a stag as tall as the trees |
| Greatwood Rampage | R | Spell (Swift) | 4/2 | | Your units get +3/+0 this turn | a stampede through a forest road |
| Spirit of the Deep Wood | R | Unit | 4/1 | 3/3 | Swift. When it is destroyed, return it to your hand | a pale stag-spirit between trunks |

### Iron Reach (8): constructs, Tough, Relics, siege
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Rivet Golem | C | Unit | 3/1 | 3/3 | none | a riveted iron figure |
| Cannon Crew | C | Unit | 4/1 | 3/4 | none | gunners around a field piece |
| Anvil Strike | C | Spell | 2/1 | | Deal 3 damage to an enemy unit | a hammer blow on glowing metal |
| Iron Brace | C | Relic | 1/0 | | The equipped unit gets +0/+2 | a plated vambrace |
| Boilerplate Guard | U | Unit | 4/1 | 3/3 | Tough | a guard in sheet-iron armour |
| Siege Engineer | U | Unit | 3/1 | 2/2 | When it enters play, deal 2 damage to an enemy Stronghold | an engineer with a rolled plan |
| Cannon of Greywater | R | Relic | 4/2 | | At your Rise, deal 2 damage to an enemy unit | a harbour gun on a wooden carriage |
| The Iron Sovereign | **L** | Unit | 7/3 | 7/7 | Tough, Rampart | a seated figure of riveted plate on a mine-throne |

### Tideborn (8): tempo, bounce, moving fronts
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Wave Skipper | C | Unit | 2/0 | 2/2 | Surge | a tideborn rider on a breaker |
| Pearl Diver | C | Unit | 2/0 | 1/3 | When it enters play, look at the top card (scry 1) | a diver surfacing with a shell |
| Ebb Current | C | Spell (Swift) | 1/0 | | Return one of your units to your hand | a unit pulled back by a current |
| Shoal Mage | C | Unit | 3/1 | 2/3 | When it enters play, look at the top 2 cards (scry 2) | a mage standing in shallows |
| Sea Mist Adept | U | Unit | 3/1 | 2/3 | When it enters play, move an enemy unit to the other front; it becomes exhausted | an adept in rising fog |
| Stormglass Mage | U | Unit | 4/2 | 3/3 | Surge | a mage reading a storm glass |
| The Drowning Tide | R | Spell (Swift) | 5/2 | | Return every enemy unit that costs 3 or less to its owner's hand | a wave sweeping a quay |
| Oracle of the Long Ebb | **L** | Unit | 6/3 | 4/6 | Swift. When it enters play, draw two cards. At your Rise, look at the top 2 cards | the first tideborn seer at a tidal pool |

### Free Fleets (8): Vessels, Ferry, raiding
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Harbor Skiff | C | Vessel | 1/0 | 1/2 | Ferry 1 | a one-sail skiff |
| Press-Gang Sailor | C | Unit | 3/1 | 3/2 | Charge | a sailor with a belaying pin |
| Cannonade | C | Spell | 2/1 | | Deal 3 damage to an enemy unit in the Deep | a broadside at dusk |
| Smuggler's Run | U | Spell (Swift) | 2/1 | | Your Vessels get +2/+0 this turn | a night run past a harbour chain |
| Salvage Crew | U | Unit | 3/1 | 2/3 | Whenever one of your Vessels is destroyed, draw a card | divers over a wreck |
| Dreadnought Marauder | R | Vessel | 6/2 | 6/6 | Ferry 2 | a black-hulled raider |
| Plunderer's Charter | R | Enchantment | 3/1 | | Whenever you deal damage to the opponent's Harbor, draw a card | a sealed letter with a skull stamp |
| Captain Sable Orwin | R | Unit | 4/2 | 4/4 | Charge | a captain on a quarterdeck |

### Abyssal Choir (8): late game, leviathans, drowned
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Drowned Penitent | C | Unit | 2/0 | 1/2 | When it is destroyed, return it to your hand | a hooded cultist emerging from the sea |
| Gloom Eel | C | Unit | 3/1 | 3/3 | none | an eel in lightless water |
| Undertow's Grasp | C | Spell | 3/2 | | Destroy an enemy unit that costs 3 or less | hands of kelp dragging a sailor |
| Choir of Silt | U | Enchantment | 3/2 | | Your Drowned get +1/+1 | pale singers under a tide pool |
| Tide-Bound Priest | U | Unit | 4/2 | 3/3 | At your Rise, restore 1 strength to your Harbor | a priest standing in a flooded nave |
| The Maw Below | R | Unit | 8/3 | 8/7 | Surge | a mouth opening under a ship |
| Drowned Matriarch | R | Unit | 5/2 | 4/4 | When it enters play, return a Drowned unit from your discard pile to play | an old matriarch in a pearl shroud |
| Final Descent | R | Spell | 6/3 | | Destroy every unit that costs 4 or less on one front | a whirlpool taking a whole fleet |

### Harbor Leagues (9): glue, Ferry, draw, Influence
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Quayside Ferrywoman | C | Unit | 2/0 | 1/3 | Ferry 1 | a ferrywoman with a long oar |
| Harbor Warden | C | Unit | 3/1 | 2/4 | Ferry 1 | a warden with a lantern pole |
| Wharf Clerk | C | Unit | 1/0 | 1/2 | When it enters play, look at the top card (scry 1) | a clerk with a tally book |
| Trade Winds | C | Spell | 2/0 | | Draw a card | sails filling at a crowded pier |
| Customs Inspector | U | Unit | 3/1 | 2/3 | Your opponent's Swift cards cost 1 more | an inspector opening a crate |
| Guild Arbiter | U | Unit | 4/2 | 3/4 | When it enters play, draw a card | an arbiter with a ledger and a gavel |
| Pilot's Guild Hall | U | Stronghold | 3/1 | durability 6 | At your Rise, your Influence capacity grows by 1 if you control no Vessel (rule text to be fixed in validation) | a hall of charts and compasses |
| Guildmaster Verrin | R | Unit | 5/2 | 4/5 | When it enters play, draw a card and your Influence capacity grows by 1 | a guildmaster at a harbour table |
| Admiralty Hall | R | Stronghold | 4/2 | durability 8 | At your Rise, draw a card if your Harbor has taken damage | a stone hall over the roads |

### Neutral (8): mercenaries, travellers, plain answers (always q 0)
| Name | R | Type | Cost/Req | Body | Mechanic | Picture |
|---|---|---|---|---|---|---|
| Roadside Sellsword | C | Unit | 2/0 | 2/2 | none | a sword-for-hire at a crossroads |
| Hedge Healer | C | Unit | 2/0 | 1/3 | When it enters play, one of your units gets +0/+3 until your next turn | a healer with bundled herbs |
| Travelling Tinker | C | Unit | 2/0 | 1/2 | When it enters play, look at the top 2 cards (scry 2) | a tinker with a pack frame |
| Pilgrim's Rest | C | Domain (Shore) | 2/0 | | Units on this front get +0/+1 | a roadside shrine |
| Lamplighter's Rounds | U | Relic | 2/0 | | When it enters play, look at the top 3 cards and draw one (dig 3) | a lamplighter at dusk |
| Border Scavenger | U | Unit | 3/0 | 2/3 | When it enters play, destroy an enemy Relic | a scavenger on a wrecked cart |
| Waystone Keeper | U | Unit | 4/0 | 3/4 | none | a keeper by a milestone |
| The Wanderer Without Name | **L** | Unit | 6/0 | 6/6 | Swift. When it enters play, deal 3 damage to an enemy unit | a hooded traveller who belongs to no coast |

(One Harbor Leagues Stronghold has a rules text still to be fixed: if the existing ops cannot express it cleanly it is replaced by a plain Stronghold with the same slot, not a new op.)

## 4. Balance considerations

1. **Commons stay simple.** Most of the 30 commons are plain or single-keyword bodies; the rest are small scry/draw/ramp effects or one-line tricks, each priced by the guide. That gives First Tide's boosters more "floor" cards and keeps the rare slot special.
2. **Power creep guard.** No new Common or Uncommon costs less than the guide for its effect. The Rares are on-curve with the guide's rare +1; they are strong in limited play but not Standard-defining because First Tide is not planned to be in Standard (section 6).
3. **Legendary tiers.** Three new Legendaries are costed 6 to 7 with Allegiance 3 (Neutral q 0 and priced 1 point low), so they are build-around finishers, not auto-includes. The Iron Sovereign is the strongest in raw stats, deliberately slow.
4. **Gameplay is a check, not a promise.** After approval the validator runs `cards.js` (text and rules), `check.js`, a `cardvalue.js` run for each new card, and `sim.js` with the First Tide cards in the pool. Cards that win more than the guide's band (about 52 to 58%) in limited-style pairings are reduced; cards that never get played are raised or replaced, and every change is recorded in `balance.js` with its reason, as Version 1 does.
5. **Tenth Tide interplay.** A new First Tide card is only a *printing* of a new identity (`cid`); it does not appear in Tenth Tide unless the owner decides to reprint it. The 70 existing reprints are unchanged.

## 5. Economy effect (estimate, to be measured)

Today a First Tide pack holds on average about 3.5 tracked cards (59 of 250 slots, 15 cards). With 125 named cards it rises to about 7.5 per pack, and the remaining slots are still "unnamed" — which the product-integrity plan removes (bulk is no longer an invisible product; unnamed slots are not sold). Expected: a First Tide booster's contents fall in value (more cards share the value), while the *set's* sealed collector value stays high because of age. This is exactly the "contents vs sealed collector value" split in the integrity plan; it is measured with `tools/tidemark_product_audit.py` before and after.

## 6. First Tide and Standard legality

Not proposed: First Tide as a permanent core set. See `design/tidemark-historical-set-structure.md`, section "Formats with and without a permanent core" for the study. First Tide stays a collectible foundational release regardless.

## 7. Decisions needed

1. Approve, reject or edit the list (edit by name or slot).
2. Are the three new Legendaries (Iron Sovereign, Oracle of the Long Ebb, The Wanderer Without Name) right, or should a different faction hold the missing Legendary slots?
3. Should any of the 66 be reprinted in Tenth Tide or later sets? (Default: no.)
4. After approval, the next steps are, in order: add as data (no art), validate and balance, produce the art queue (about 8 sheets) for the owner and SOL.
