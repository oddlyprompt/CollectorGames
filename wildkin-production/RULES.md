# Wildkin: First Bond rules and card reference

Generated from `wildkin-production/manifest.json` by `tools/wildkin_manifest.py` (do not edit). Card rules were designed on 2026-10-15 (`tools/wildkin_design.py`); the engine that plays them is `src/engine/tcg_rules.js`.

## Rules of play

- **Deck.** 40 cards. At most 4 copies of a card with the same name (premium prints count as their base card). Essence cards are unlimited.
- **Setup.** Each player shuffles, draws 7 and puts a Basic Wildkin face down as their Active, plus up to 4 Basics on the Bench. No Basic in hand: reveal, shuffle back, draw 7 again; the opponent may draw 1 extra card for each redraw. Each player sets aside the top 4 cards of their deck as Prize cards.
- **Turn.** Draw a card. Then, in any order: put Basics on the Bench (5 at most), evolve, attach 1 Essence from hand, play any number of Gear, 1 Ally, 1 Tactic and 1 Biome, use abilities, retreat once. Attacking ends the turn. The player who goes first cannot attack or play an Ally on their first turn; the player who goes second draws 1 extra card on their first turn.
- **Evolve.** An Evolution card is put on the creature it evolves from. A creature cannot evolve on the turn it came into play, and nothing evolves on a player's first turn. Evolving keeps damage, Essence and Gear, and removes Special Conditions.
- **Attack.** Pay the cost with attached Essence: an affinity symbol needs that Essence, a C symbol takes any. A creature with two affinities may use Essence of either for its own symbols. Damage is the printed number, plus or minus effects, doubled by Weakness (the defender's weak affinity), then reduced by protection.
- **Knockout.** A creature with damage equal to its HP is Knocked Out and goes to the discard pile with its cards. Its opponent takes 1 Prize card. The owner moves a Benched creature up to Active.
- **Retreat.** Once per turn, discard Essence equal to the Retreat Cost to swap the Active with a Benched creature. Asleep or Paralyzed creatures cannot retreat.
- **Conditions.** Asleep: cannot attack or retreat; flip at the end of each turn, heads wakes it. Paralyzed: cannot attack or retreat; ends after its owner's next turn. Confused: when attacking, flip; tails means 30 damage to itself and no attack. Poisoned: 10 damage between turns. Burned: 20 damage between turns, then flip: heads removes it. Moving to the Bench or evolving removes all conditions.
- **Cards.** Allies: 1 per turn. Tactics: 1 per turn. Gear: any number; a Gear that says "Attach" stays on a creature (1 per creature). Biome: 1 per turn, stays in play for both players until another Biome replaces it.
- **Win.** Take your last Prize card, or your opponent has no creature to move up, or your opponent cannot draw at the start of their turn.
- **Premium.** Illustration Rares, Full Arts, Special Illustration Rares and Clasped Secret Rares play exactly as their base card. The Clasp is a collector treatment, not a mechanic.

## Weakness

Each affinity is weak to exactly one other (double damage). No resistance.

| Affinity | Weak to |
|---|---|
| Verdant | Ember |
| Ember | Tide |
| Tide | Storm |
| Storm | Stone |
| Stone | Verdant |
| Dusk | Wonder |
| Astral | Dusk |
| Iron | Astral |
| Wonder | Iron |

## Creatures (001-074)

**001 Cactuft** (rare, Basic), Verdant. HP 90, weak to Ember, retreat 1.
- Ability: **Sunny Bloom**. Once during your turn, you may heal 10 damage from 1 of your Verdant creatures.
- {Verdant} **Spine Spray** 20. This attack also does 10 damage to 1 of your opponent's Benched creatures.
- {Verdant} {Verdant} {any} **Blossom Charge** 70. Heal 20 damage from this creature.

**002 Prismotl** (common, Basic), Tide / Astral. HP 70, weak to Storm, retreat 1.
- {Tide} **Bubble Glint** 20
- {Tide} {any} **Prism Flicker** 30. Flip a coin. If heads, the Defending creature is now Asleep.

**003 Opalotl** (uncommon, Stage 1, evolves from Prismotl), Tide / Astral. HP 100, weak to Storm, retreat 1.
- {any} **Opal Shimmer** . Draw 2 cards.
- {Tide} {Tide} {any} **Lustre Jet** 70

**004 Aurorotl** (rare, Stage 2, evolves from Opalotl), Tide / Astral. HP 160, weak to Storm, retreat 2.
- Ability: **Aurora Veil**. Prevent all damage done to your Benched creatures by your opponent's attacks.
- {Tide} {any} **Spectrum Wave** 50+. This attack does 20 more damage for each Essence attached to this creature.

**005 Bashlet** (common, Basic), Stone. HP 70, weak to Verdant, retreat 2.
- {Stone} **Headbutt** 20
- {Stone} {any} **Tail Bump** 40

**006 Maceback** (uncommon, Stage 1, evolves from Bashlet), Stone. HP 100, weak to Verdant, retreat 2.
- {Stone} {any} **Club Swing** 50
- {Stone} {Stone} {any} **Plated Guard** 70. During your opponent's next turn, this creature takes 20 less damage from attacks.

**007 Fortisaur** (rare, Stage 2, evolves from Maceback), Stone. HP 170, weak to Verdant, retreat 3.
- {Stone} {Stone} {any} **Bastion Stomp** 100
- {Stone} {Stone} {Stone} {any} **Fortress Smash** 180. During your next turn, this creature can't attack.

**008 Koilet** (common, Basic), Tide / Astral. HP 70, weak to Storm, retreat 1.
- {Tide} **Ripple** 20
- {Tide} {any} **Splash Leap** 40

**009 Runakoi** (uncommon, Stage 1, evolves from Koilet), Tide / Astral. HP 100, weak to Storm, retreat 1.
- {Tide} {any} **Rune Current** 40. Draw a card.
- {Tide} {Tide} {any} **Tidal Rune** 90

**010 Koirune** (rare, Stage 2, evolves from Runakoi), Tide / Astral. HP 170, weak to Storm, retreat 2.
- Ability: **Runic Flow**. Once during your turn, you may attach an Essence card from your hand to 1 of your Benched creatures. This does not count as your Essence attachment for the turn.
- {Tide} {Astral} {any} **Celestial Rapids** 140

**011 Rolyte** (common, Basic), Stone / Iron. HP 70, weak to Verdant, retreat 2.
- {Stone} **Curl Up** 10. During your opponent's next turn, this creature takes 20 less damage from attacks.
- {Stone} {any} **Roll Bash** 30

**012 Shelladin** (uncommon, Stage 1, evolves from Rolyte), Stone / Iron. HP 110, weak to Verdant, retreat 2.
- Ability: **Knight's Plating**. This creature takes 10 less damage from attacks.
- {Stone} {Iron} {any} **Shield Bash** 60

**013 Aegisopod** (rare, Stage 2, evolves from Shelladin), Stone / Iron. HP 180, weak to Verdant, retreat 3.
- Ability: **Aegis Shell**. This creature takes 20 less damage from attacks.
- {Stone} {Stone} {any} **Rolling Rampart** 90+. If this creature has any damage on it, this attack does 40 more damage.

**014 Frondolin** (common, Basic), Verdant. HP 70, weak to Ember, retreat 2.
- {Verdant} **Leaf Curl** 10. Heal 20 damage from this creature.
- {Verdant} {any} **Scale Swipe** 30

**015 Pangrove** (uncommon, Stage 1, evolves from Frondolin), Verdant. HP 100, weak to Ember, retreat 2.
- {Verdant} {any} **Rooted Swipe** 50
- {Verdant} {Verdant} {any} **Grove Mend** 60. Heal 10 damage from each of your creatures.

**016 Canopang** (rare, Stage 2, evolves from Pangrove), Verdant. HP 170, weak to Ember, retreat 3.
- {Verdant} {any} **Verdant Roar** 50. Search your deck for a Verdant Essence card and attach it to 1 of your Benched creatures.
- {Verdant} {Verdant} {Verdant} {any} **Thousand Leaves** 150

**017 Candicoil** (common, Basic), Wonder. HP 60, weak to Iron, retreat 1.
- {Wonder} **Candy Twirl** 10. The Defending creature is now Confused.
- {Wonder} {any} **Sticky Coil** 30

**018 Spiramel** (uncommon, Stage 1, evolves from Candicoil), Wonder. HP 120, weak to Iron, retreat 2.
- {Wonder} {any} **Spiral Sweetness** 40. The Defending creature is now Confused.
- {Wonder} {Wonder} {any} **Sugar Rush** 30×. Flip 4 coins. This attack does 30 damage for each heads.

**019 Creskit** (common, Basic), Astral. HP 60, weak to Dusk, retreat 1.
- {Astral} **Moon Pounce** 20
- {Astral} {any} **Crescent Claw** 30+. Flip a coin. If heads, this attack does 20 more damage.

**020 Astrynx** (uncommon, Stage 1, evolves from Creskit), Astral. HP 120, weak to Dusk, retreat 1.
- Ability: **Night Vision**. Once during your turn, you may draw a card.
- {Astral} {any} **Starlit Pounce** 50
- {Astral} {Astral} {any} **Starfall Strike** 90

**021 Berribat** (common, Basic), Dusk / Verdant. HP 50, weak to Wonder, retreat 1.
- {Dusk} **Berry Bite** 10. The Defending creature is now Poisoned.
- {Dusk} {any} **Night Flutter** 30

**022 Pompyre** (uncommon, Stage 1, evolves from Berribat), Dusk / Verdant. HP 110, weak to Wonder, retreat 1.
- {Dusk} {any} **Pumpkin Hex** 30. The Defending creature is now Poisoned. The Defending creature is now Confused.
- {Dusk} {Dusk} {any} **Hollow Feast** 70. Heal 30 damage from this creature.

**023 Flapod** (rare, Basic), Tide. HP 110, weak to Storm, retreat 1.
- Ability: **Ear Glide**. Once during your turn, if this creature is on your Bench, you may switch it with your Active creature.
- {Tide} {any} **Bubble Hug** 40. Heal 20 damage from this creature.
- {Tide} {Tide} {any} **Deep Paddle** 90

**024 Mistip** (common, Basic), Storm. HP 50, weak to Stone, retreat 1.
- {Storm} **Drizzle** 10. Flip a coin. If heads, the Defending creature is now Paralyzed.
- {Storm} {any} **Static Puff** 30

**025 Cumulfin** (uncommon, Stage 1, evolves from Mistip), Storm. HP 90, weak to Stone, retreat 1.
- {Storm} {any} **Cloud Fin** 50
- {Storm} {Storm} {any} **Thunderhead** 70. This attack also does 20 damage to 1 of your opponent's Benched creatures.

**026 Nimbusail** (rare, Stage 2, evolves from Cumulfin), Storm. HP 150, weak to Stone, retreat 1.
- {Storm} {any} **Squall Line** 50. This attack also does 30 damage to 1 of your opponent's Benched creatures.
- {Storm} {Storm} {any} **Thunder Sail** 130. Discard an Essence attached to this creature.

**027 Cindikit** (common, Basic), Ember. HP 60, weak to Tide, retreat 1.
- {Ember} **Ember Nip** 20
- {Ember} {any} **Spark Pounce** 30. Flip a coin. If heads, the Defending creature is now Burned.

**028 Emberuff** (uncommon, Stage 1, evolves from Cindikit), Ember. HP 90, weak to Tide, retreat 2.
- {Ember} {any} **Flame Ruff** 50
- {Ember} {Ember} {any} **Blazing Mane** 90. Discard an Essence attached to this creature.

**029 Pyrenox** (rare, Stage 2, evolves from Emberuff), Ember. HP 160, weak to Tide, retreat 3.
- {Ember} {any} **Inferno Fang** 50. Flip a coin. If heads, the Defending creature is now Burned.
- {Ember} {Ember} {any} **Pyre Nova** 180. Discard 2 Essence attached to this creature.

**030 Breezit** (common, Basic), Storm. HP 50, weak to Stone, retreat 1.
- {Storm} **Breeze Peck** 20
- {Storm} {any} **Tailwind** 30. Switch this creature with 1 of your Benched creatures.

**031 Gustrel** (uncommon, Stage 1, evolves from Breezit), Storm. HP 80, weak to Stone, retreat 1.
- {Storm} {any} **Downdraft** 40. Before doing damage, you may switch 1 of your opponent's Benched creatures with their Active creature.
- {Storm} {Storm} {any} **Razor Wind** 80

**032 Tempestral** (rare, Stage 2, evolves from Gustrel), Storm. HP 140, weak to Stone, retreat 1.
- {Storm} {any} **Gale Burst** 30. This attack also does 20 damage to each of your opponent's Benched creatures.
- {Storm} {Storm} {any} **Tempest Dive** 110. Flip a coin. If heads, the Defending creature is now Paralyzed.

**033 Glimlet** (common, Basic), Dusk. HP 60, weak to Wonder, retreat 1.
- {Dusk} **Glimmer Hex** 10. The Defending creature is now Confused.
- {Dusk} {any} **Shade Bite** 30

**034 Hushwing** (uncommon, Stage 1, evolves from Glimlet), Dusk. HP 100, weak to Wonder, retreat 1.
- {Dusk} {any} **Silent Wing** 40. The Defending creature is now Asleep.
- {Dusk} {Dusk} {any} **Night Swoop** 80

**035 Veilmora** (rare, Stage 2, evolves from Hushwing), Dusk. HP 160, weak to Wonder, retreat 2.
- Ability: **Veil of Night**. Once during your turn, if this creature is your Active creature, you may make your opponent's Active creature Poisoned.
- {Dusk} {Dusk} {any} **Shroud Rend** 100+. If the Defending creature is affected by a Special Condition, this attack does 50 more damage.

**036 Rivbit** (common, Basic), Iron. HP 70, weak to Astral, retreat 2.
- {Iron} **Rivet Ram** 20
- {Iron} {any} **Metal Nibble** 30

**037 Boltusk** (uncommon, Stage 1, evolves from Rivbit), Iron. HP 100, weak to Astral, retreat 2.
- {Iron} {any} **Bolt Tusk** 50
- {Iron} {Iron} {any} **Steel Charge** 80. This creature also does 10 damage to itself.

**038 Ferradon** (rare, Stage 2, evolves from Boltusk), Iron. HP 170, weak to Astral, retreat 3.
- Ability: **Forged Plating**. If this creature has a Gear attached, it takes 30 less damage from attacks.
- {Iron} {any} **Ferrous Charge** 60
- {Iron} {Iron} {Iron} {any} **Anvil Crush** 170. Discard an Essence attached to this creature.

**039 Pebblamb** (common, Basic), Stone. HP 70, weak to Verdant, retreat 2.
- {Stone} **Pebble Toss** 20
- {Stone} {any} **Woolly Shove** 30

**040 Cairnram** (uncommon, Stage 1, evolves from Pebblamb), Stone. HP 110, weak to Verdant, retreat 2.
- {Stone} {any} **Cairn Charge** 50
- {Stone} {Stone} {any} **Boulder Ram** 90. This creature also does 20 damage to itself.

**041 Monolox** (rare, Stage 2, evolves from Cairnram), Stone. HP 180, weak to Verdant, retreat 4.
- {Stone} {Stone} {any} **Monolith Press** 80. During your opponent's next turn, this creature takes 30 less damage from attacks.
- {Stone} {Stone} {Stone} {any} **Standing Stone** 150

**042 Quibbit** (common, Basic), Wonder. HP 60, weak to Iron, retreat 1.
- {Wonder} **Quizzical Hop** . Draw 2 cards.
- {Wonder} {any} **Hop Kick** 30

**043 Whimhare** (uncommon, Stage 1, evolves from Quibbit), Wonder. HP 90, weak to Iron, retreat 1.
- {Wonder} {any} **Whimsy Kick** 40+. Flip a coin. If heads, this attack does 30 more damage.
- {Wonder} {Wonder} {any} **Hare Trick** 60. The Defending creature is now Asleep.

**044 Fablehorn** (rare, Stage 2, evolves from Whimhare), Wonder. HP 150, weak to Iron, retreat 2.
- Ability: **Once Upon a Time**. Once during your turn, you may flip a coin. If heads, draw 2 cards.
- {Wonder} {any} **Fairy Horn** 50. Heal 20 damage from this creature.
- {Wonder} {Wonder} {any} **Happily Ever After** 70+. Flip a coin. If heads, this attack does 80 more damage.

**045 Mossnip** (common, Basic), Verdant. HP 60, weak to Ember, retreat 1.
- {Verdant} **Moss Nip** 20
- {Verdant} {any} **Soft Graze** 20. Heal 20 damage from this creature.

**046 Bramblebuck** (uncommon, Stage 1, evolves from Mossnip), Verdant. HP 120, weak to Ember, retreat 2.
- {Verdant} {any} **Briar Snare** 40. The Defending creature can't retreat during your opponent's next turn.
- {Verdant} {Verdant} {any} **Bramble Charge** 90. This creature also does 20 damage to itself.

**047 Reefkin** (common, Basic), Tide. HP 60, weak to Storm, retreat 1.
- {Tide} **Reef Bubble** 20
- {Tide} {any} **Coral Dart** 30

**048 Corallume** (uncommon, Stage 1, evolves from Reefkin), Tide. HP 110, weak to Storm, retreat 2.
- {Tide} {any} **Glow Current** 40. Draw a card.
- {Tide} {Tide} {any} **Reef Lantern** 80. Flip a coin. If heads, discard an Essence from the Defending creature.

**049 Sootkit** (common, Basic), Ember. HP 60, weak to Tide, retreat 1.
- {Ember} **Soot Puff** 10. Flip a coin. If heads, the Defending creature is now Burned.
- {Ember} {any} **Coal Scratch** 30

**050 Smolderlynx** (uncommon, Stage 1, evolves from Sootkit), Ember. HP 110, weak to Tide, retreat 1.
- {Ember} {any} **Smoulder Claw** 50
- {Ember} {Ember} {any} **Wildfire Pounce** 110. Discard an Essence attached to this creature.

**051 Zephroo** (common, Basic), Astral. HP 60, weak to Dusk, retreat 1.
- {Astral} **Star Hop** 20
- {Astral} {any} **Pouch Bounce** 20. Draw a card.

**052 Cometrail** (uncommon, Stage 1, evolves from Zephroo), Astral. HP 110, weak to Dusk, retreat 1.
- {Astral} {any} **Tail Comet** 50. This attack also does 20 damage to 1 of your opponent's Benched creatures.
- {Astral} {Astral} {any} **Comet Dash** 100

**053 Nibrock** (common, Basic), Iron. HP 60, weak to Astral, retreat 2.
- {Iron} **Iron Nibble** 20
- {Iron} {any} **Burrow** 30. During your opponent's next turn, this creature takes 10 less damage from attacks.

**054 Drillbadger** (uncommon, Stage 1, evolves from Nibrock), Iron. HP 110, weak to Astral, retreat 2.
- {Iron} {any} **Drill Claw** 50. Flip a coin. If heads, discard an Essence from the Defending creature.
- {Iron} {Iron} {any} **Core Drill** 100

**055 Dewink** (common, Basic), Tide / Verdant. HP 50, weak to Storm, retreat 1.
- {Tide} **Dew Splash** 20
- {Tide} {any} **Morning Drop** 20. Heal 20 damage from this creature.

**056 Bloomble** (uncommon, Stage 1, evolves from Dewink), Tide / Verdant. HP 100, weak to Storm, retreat 1.
- {Tide} {any} **Bloom Bubble** 40. Heal 10 damage from each of your creatures.
- {Tide} {Tide} {any} **Petal Tide** 80

**057 Fernibble** (common, Basic), Verdant. HP 70, weak to Ember, retreat 1.
- {Verdant} **Fern Nibble** 20. Heal 10 damage from this creature.
- {Verdant} {Verdant} {any} **Frond Whip** 60

**058 Acornox** (common, Basic), Verdant. HP 90, weak to Ember, retreat 2.
- {Verdant} {any} **Acorn Toss** 30+. Flip a coin. If heads, this attack does 30 more damage.
- {Verdant} {Verdant} {any} **Oaken Charge** 70

**059 Shelloop** (common, Basic), Tide. HP 80, weak to Storm, retreat 2.
- {Tide} {any} **Shell Spin** 30. During your opponent's next turn, this creature takes 20 less damage from attacks.
- {Tide} {Tide} {any} **Loop Current** 60. Switch this creature with 1 of your Benched creatures.

**060 Driftail** (common, Basic), Tide. HP 70, weak to Storm, retreat 1.
- {Tide} **Drift** 10. Draw a card.
- {Tide} {any} **Tail Wave** 40

**061 Craggle** (common, Basic), Stone. HP 90, weak to Verdant, retreat 2.
- {Stone} {any} **Crag Toss** 40
- {Stone} {Stone} {any} **Rockslide** 60. This attack also does 20 damage to 1 of your opponent's Benched creatures.

**062 Tumbear** (common, Basic), Stone. HP 100, weak to Verdant, retreat 3.
- {Stone} {any} **Tumble** 40+. Flip a coin. If heads, this attack does 20 more damage.
- {Stone} {Stone} {any} **Bear Hug** 70. The Defending creature can't retreat during your opponent's next turn.

**063 Nutbolt** (common, Basic), Iron. HP 70, weak to Astral, retreat 1.
- {Iron} **Bolt Spin** 20
- {Iron} {Iron} {any} **Nut Cracker** 70

**064 Clampup** (common, Basic), Iron. HP 80, weak to Astral, retreat 2.
- {Iron} {any} **Clamp** 30. Flip a coin. If heads, the Defending creature is now Paralyzed.
- {Iron} {Iron} {any} **Bronze Bite** 70

**065 Ashhopper** (common, Basic), Ember. HP 60, weak to Tide, retreat 1.
- {Ember} **Ash Hop** 20
- {Ember} {any} **Cinder Leap** 50. This creature also does 10 damage to itself.

**066 Coaloo** (common, Basic), Ember. HP 80, weak to Tide, retreat 2.
- {Ember} {any} **Coal Toss** 30. Flip a coin. If heads, the Defending creature is now Burned.
- {Ember} {Ember} {any} **Kiln Hug** 90. Discard an Essence attached to this creature.

**067 Kitecoon** (common, Basic), Storm. HP 70, weak to Stone, retreat 1.
- {Storm} **Kite Dive** 20. This attack also does 10 damage to 1 of your opponent's Benched creatures.
- {Storm} {any} **String Snap** 40. Flip a coin. If heads, the Defending creature is now Paralyzed.

**068 Thundrop** (common, Basic), Storm. HP 60, weak to Stone, retreat 1.
- {Storm} **Drop Zap** 30
- {Storm} {Storm} {any} **Thunder Splash** 50. This attack also does 10 damage to each of your opponent's Benched creatures.

**069 Orbitot** (common, Basic), Astral. HP 70, weak to Dusk, retreat 1.
- {Astral} **Orbit** 10. Draw a card.
- {Astral} {any} **Gravity Pull** 30. Before doing damage, you may switch 1 of your opponent's Benched creatures with their Active creature.

**070 Lunapip** (common, Basic), Astral. HP 60, weak to Dusk, retreat 1.
- {Astral} **Lullaby** . The Defending creature is now Asleep.
- {Astral} {any} **Moon Peep** 40

**071 Mothmur** (common, Basic), Dusk. HP 60, weak to Wonder, retreat 1.
- {Dusk} **Dust Wing** 10. The Defending creature is now Poisoned.
- {Dusk} {any} **Murmur** 30. Flip a coin. If heads, the Defending creature is now Confused.

**072 Winkrow** (common, Basic), Dusk. HP 70, weak to Wonder, retreat 1.
- {Dusk} **Trinket Theft** 10. Your opponent discards a random card from their hand.
- {Dusk} {any} **Wink Peck** 40

**073 Puffluff** (common, Basic), Wonder. HP 70, weak to Iron, retreat 1.
- {Wonder} **Pillow Puff** . The Defending creature is now Asleep. Heal 20 damage from this creature.
- {Wonder} {any} **Fluff Bounce** 40+. Flip a coin. If heads, this attack does 20 more damage.

**074 Oddoodle** (common, Basic), Wonder. HP 70, weak to Iron, retreat 2.
- {Wonder} **Scribble Swap** 10. Switch this creature with 1 of your Benched creatures.
- {Wonder} {Wonder} {any} **Odd Twist** 40×. Flip 3 coins. This attack does 40 damage for each heads.

## Allies (075-092)

- **075 Professor Maren Vale** (rare): Ally. You may play only 1 Ally each turn. Discard your hand and draw 6 cards.
- **076 June Kestrel** (rare): Ally. You may play only 1 Ally each turn. Search your deck for a creature and put it into your hand. Search your deck for an Essence card and put it into your hand.
- **077 Warden Sorrel Pike** (uncommon): Ally. You may play only 1 Ally each turn. Heal 30 damage from each of your creatures.
- **078 Toma Reed** (uncommon): Ally. You may play only 1 Ally each turn. Draw 3 cards.
- **079 Lita Moss** (uncommon): Ally. You may play only 1 Ally each turn. Search your deck for an Essence card and put it into your hand. Search your deck for an Essence card and put it into your hand. Draw a card.
- **080 Nessa Flint** (uncommon): Ally. You may play only 1 Ally each turn. Attach an Essence card from your discard pile to 1 of your creatures. Draw a card.
- **081 Elder Oren** (uncommon): Ally. You may play only 1 Ally each turn. Put up to 2 creatures from your discard pile into your hand. Put up to 2 Essence cards from your discard pile into your hand.
- **082 Pip Rowan** (uncommon): Ally. You may play only 1 Ally each turn. Shuffle your hand into your deck. Draw 5 cards.
- **083 Archivist Sera Wynn** (uncommon): Ally. You may play only 1 Ally each turn. Look at the top 6 cards of your deck. Put 2 of them into your hand and shuffle the rest back.
- **084 Renn Calder** (uncommon): Ally. You may play only 1 Ally each turn. Switch your Active creature with 1 of your Benched creatures. Draw 2 cards.
- **085 Mira Quill** (uncommon): Ally. You may play only 1 Ally each turn. Search your deck for an Evolution creature and put it into your hand. Draw a card.
- **086 Sel Veyra** (rare): Ally. You may play only 1 Ally each turn. Switch 1 of your opponent's Benched creatures with their Active creature. Draw a card.
- **087 Cass Rell** (uncommon): Ally. You may play only 1 Ally each turn. Your opponent shuffles their hand into their deck and draws 3 cards. Draw 2 cards.
- **088 Dr. Cyl Vane** (uncommon): Ally. You may play only 1 Ally each turn. Discard an Essence attached to 1 of your opponent's creatures. Draw a card.
- **089 Marshal Rook** (uncommon): Ally. You may play only 1 Ally each turn. During this turn, your Active creature's attacks do 30 more damage to your opponent's Active creature.
- **090 Iris Shade** (rare): Ally. You may play only 1 Ally each turn. Look at your opponent's hand. Choose a card other than an Essence; they discard it. Draw 2 cards.
- **091 Dex Harrow** (uncommon): Ally. You may play only 1 Ally each turn. Draw cards until you have 6 cards in your hand.
- **092 Brin Hollow** (uncommon): Ally. You may play only 1 Ally each turn. Heal 60 damage from your Active creature. Remove all Special Conditions from your Active creature.

## Gear (093-110)

- **093 Bond Charm** (uncommon): Attach to a creature. It gets +30 HP. (Attached Gear stays on the creature; 1 per creature.)
- **094 Keeper Satchel** (common): Search your deck for a Basic creature and put it into your hand.
- **095 Rescue Whistle** (common): Put a creature from your discard pile into your hand.
- **096 Biome Compass** (common): Search your deck for a Biome or an Essence card and put it into your hand.
- **097 Glow Lantern** (common): Look at the top 3 cards of your deck. Put 1 of them into your hand and shuffle the rest back.
- **098 Trail Rations** (common): Heal 30 damage from 1 of your creatures.
- **099 Medic Salve** (common): Heal 20 damage from your Active creature. Remove all Special Conditions from your Active creature.
- **100 Echo Flute** (common): Search your deck for a creature that evolves from 1 of your creatures in play and put it into your hand.
- **101 Tide Lure** (common): Flip a coin. If heads, switch 1 of your opponent's Benched creatures with their Active creature.
- **102 Thermal Cloak** (common): Attach to a creature. It takes 20 less damage from attacks. (Attached Gear stays on the creature; 1 per creature.)
- **103 Climbing Line** (common): Attach to a creature. It has no Retreat Cost. (Attached Gear stays on the creature; 1 per creature.)
- **104 Field Scope** (common): Draw 2 cards. Then discard a card from your hand.
- **105 Wildseed Treat** (common): Choose 1 of your Basic creatures that was in play at the start of your turn. Put a Stage 2 card from your hand that evolves from its Stage 1 onto it, skipping Stage 1. You can't play this card on your first turn.
- **106 Sanctuary Bell** (uncommon): Remove all Special Conditions from your creatures. Heal 10 damage from each of your creatures.
- **107 Veyra Snare** (uncommon): Your opponent's Active creature can't retreat during their next turn. During this turn, that creature takes 10 more damage from attacks.
- **108 Clasp Rig** (uncommon): Attach to a creature. Its attacks do 30 more damage to the opponent's Active creature. At the end of each of your turns in which it attacked, put 10 damage on it. (Attached Gear stays on the creature; 1 per creature.)
- **109 Null Collar** (uncommon): Attach to a creature. It has no Weakness. (Attached Gear stays on the creature; 1 per creature.)
- **110 Purity Sigil** (uncommon): Attach to a creature. It can't be affected by Special Conditions. It also gets +10 HP. (Attached Gear stays on the creature; 1 per creature.)

## Biomes (111-119)

- **111 Verdant Canopy** (uncommon): Biome. Stays in play for both players. Between turns, heal 10 damage from each Verdant creature in play.
- **112 Tideglass Bay** (uncommon): Biome. Stays in play for both players. Tide creatures in play have no Retreat Cost.
- **113 Stoneback Range** (uncommon): Biome. Stays in play for both players. Stone creatures take 10 less damage from attacks.
- **114 Ironroot Basin** (uncommon): Biome. Stays in play for both players. Iron creatures get +20 HP.
- **115 Ember Crags** (uncommon): Biome. Stays in play for both players. Attacks from Ember creatures do 10 more damage to the opponent's Active creature.
- **116 Stormreach Heights** (uncommon): Biome. Stays in play for both players. Once during each player's turn, that player may attach a Storm Essence from their hand to 1 of their Storm creatures, in addition to the normal attachment.
- **117 Astral Steppe** (uncommon): Biome. Stays in play for both players. Once during each player's turn, if that player has an Astral creature in play, they may draw a card.
- **118 Duskmire** (uncommon): Biome. Stays in play for both players. Poisoned creatures take 10 more damage between turns.
- **119 Wondergrove** (uncommon): Biome. Stays in play for both players. Wonder creatures can evolve on the turn they come into play (not on a player's first turn).

## Tactics (120-131)

- **120 First Bond** (rare): Tactic. You may play only 1 Tactic each turn. Search your deck for a Basic creature and an Essence card of its affinity. Put the creature onto your Bench and attach the Essence to it.
- **121 Call of the Wild** (uncommon): Tactic. You may play only 1 Tactic each turn. Search your deck for up to 2 Basic creatures and put them onto your Bench.
- **122 Sanctuary Rescue** (uncommon): Tactic. You may play only 1 Tactic each turn. Put a Basic creature from your discard pile onto your Bench.
- **123 Keeper's Lesson** (uncommon): Tactic. You may play only 1 Tactic each turn. Draw 2 cards.
- **124 Pack Rally** (uncommon): Tactic. You may play only 1 Tactic each turn. During this turn, your Active creature's attacks do 10 more damage for each of your Benched creatures.
- **125 Quick Retreat** (uncommon): Tactic. You may play only 1 Tactic each turn. Switch your Active creature with 1 of your Benched creatures.
- **126 Shared Instinct** (uncommon): Tactic. You may play only 1 Tactic each turn. Draw a card for each of your Benched creatures.
- **127 Veyra Directive** (uncommon): Tactic. You may play only 1 Tactic each turn. Your opponent discards a random card from their hand. Draw a card.
- **128 Forced Capture** (uncommon): Tactic. You may play only 1 Tactic each turn. Discard an Essence card from your hand. If you can't, you can't play this card. Switch 1 of your opponent's Benched creatures with their Active creature.
- **129 Override Signal** (uncommon): Tactic. You may play only 1 Tactic each turn. Discard an Essence attached to your opponent's Active creature.
- **130 Break the Clasp** (rare): Tactic. You may play only 1 Tactic each turn. Heal all damage from your Active creature and remove its Special Conditions. Discard all Essence attached to it.
- **131 Stand Together** (uncommon): Tactic. You may play only 1 Tactic each turn. Heal 20 damage from each of your creatures.

## Essence (132-140)

- **132 Verdant** (essence): Provides 1 Verdant Essence.
- **133 Tide** (essence): Provides 1 Tide Essence.
- **134 Stone** (essence): Provides 1 Stone Essence.
- **135 Iron** (essence): Provides 1 Iron Essence.
- **136 Ember** (essence): Provides 1 Ember Essence.
- **137 Storm** (essence): Provides 1 Storm Essence.
- **138 Astral** (essence): Provides 1 Astral Essence.
- **139 Dusk** (essence): Provides 1 Dusk Essence.
- **140 Wonder** (essence): Provides 1 Wonder Essence.

## Premium prints (141-180)

Each plays exactly as its base card.

- 141 Cactuft IR: plays as WK-S001-001
- 142 Prismotl IR: plays as WK-S001-002
- 143 Bashlet IR: plays as WK-S001-005
- 144 Koirune IR: plays as WK-S001-010
- 145 Shelladin IR: plays as WK-S001-012
- 146 Frondolin IR: plays as WK-S001-014
- 147 Candicoil IR: plays as WK-S001-017
- 148 Astrynx IR: plays as WK-S001-020
- 149 Berribat IR: plays as WK-S001-021
- 150 Flapod IR: plays as WK-S001-023
- 151 Cactuft FA: plays as WK-S001-001
- 152 Aurorotl FA: plays as WK-S001-004
- 153 Fortisaur FA: plays as WK-S001-007
- 154 Koirune FA: plays as WK-S001-010
- 155 Aegisopod FA: plays as WK-S001-013
- 156 Canopang FA: plays as WK-S001-016
- 157 Spiramel FA: plays as WK-S001-018
- 158 Astrynx FA: plays as WK-S001-020
- 159 Pompyre FA: plays as WK-S001-022
- 160 Flapod FA: plays as WK-S001-023
- 161 Nimbusail IR: plays as WK-S001-026
- 162 Veilmora IR: plays as WK-S001-035
- 163 Ferradon IR: plays as WK-S001-038
- 164 Fablehorn IR: plays as WK-S001-044
- 165 Bramblebuck IR: plays as WK-S001-046
- 166 Corallume IR: plays as WK-S001-048
- 167 Cometrail IR: plays as WK-S001-052
- 168 Puffluff IR: plays as WK-S001-073
- 169 Professor Maren Vale FA: plays as WK-S001-075
- 170 June Kestrel FA: plays as WK-S001-076
- 171 Sel Veyra FA: plays as WK-S001-086
- 172 Iris Shade FA: plays as WK-S001-090
- 173 Cactuft SIR: plays as WK-S001-001
- 174 Nimbusail SIR: plays as WK-S001-026
- 175 June Kestrel SIR: plays as WK-S001-076
- 176 Sel Veyra SIR: plays as WK-S001-086
- 177 Clasped Aegisopod: plays as WK-S001-013
- 178 Clasped Pompyre: plays as WK-S001-022
- 179 Clasped Ferradon: plays as WK-S001-038
- 180 Clasped Veilmora: plays as WK-S001-035
