"""Wildkin Version 1 card design: the rules every First Bond card plays by.

Imported by tools/wildkin_manifest.py, which writes the result into wildkin-production/manifest.json (status "designed").
The engine that plays these cards is src/engine/tcg_rules.js; tools/wildkin_sim.js runs it headless for balance.

Design decisions here were made by Claude Code under the owner's instruction of 2026-10-15 ("finalise ... make reasoned
decisions for unresolved assignments", "implement a coherent internal TCG rules engine, assign card abilities"). Card
names, numbers, families, stages and the mascot affinities are canon and are not touched; everything below is the
gameplay layer on top of them.

Cost letters: V Verdant, T Tide, S Stone, I Iron, E Ember, L Storm, A Astral, D Dusk, W Wonder, C any Essence.
Every effect is a small operation (op) the engine implements; the card text is generated from the ops, so the printed
text and the simulation can never disagree."""

COST={'V':'Verdant','T':'Tide','S':'Stone','I':'Iron','E':'Ember','L':'Storm','A':'Astral','D':'Dusk','W':'Wonder','C':'any'}
RULES_VERSION=1

# ---------------------------------------------------------------- the rules of play (summary printed into the manifest)
RULES={
 'version':RULES_VERSION,
 'deck':'40 cards. At most 4 copies of a card with the same name (premium prints count as their base card). Essence cards are unlimited.',
 'setup':'Each player shuffles, draws 7 and puts a Basic Wildkin face down as their Active, plus up to 4 Basics on the Bench. No Basic in hand: reveal, shuffle back, draw 7 again; the opponent may draw 1 extra card for each redraw. Each player sets aside the top 4 cards of their deck as Prize cards.',
 'turn':'Draw a card. Then, in any order: put Basics on the Bench (5 at most), evolve, attach 1 Essence from hand, play any number of Gear, 1 Ally, 1 Tactic and 1 Biome, use abilities, retreat once. Attacking ends the turn. The player who goes first cannot attack or play an Ally on their first turn; the player who goes second draws 1 extra card on their first turn.',
 'evolve':'An Evolution card is put on the creature it evolves from. A creature cannot evolve on the turn it came into play, and nothing evolves on a player\'s first turn. Evolving keeps damage, Essence and Gear, and removes Special Conditions.',
 'attack':'Pay the cost with attached Essence: an affinity symbol needs that Essence, a C symbol takes any. A creature with two affinities may use Essence of either for its own symbols. Damage is the printed number, plus or minus effects, doubled by Weakness (the defender\'s weak affinity), then reduced by protection.',
 'knockout':'A creature with damage equal to its HP is Knocked Out and goes to the discard pile with its cards. Its opponent takes 1 Prize card. The owner moves a Benched creature up to Active.',
 'retreat':'Once per turn, discard Essence equal to the Retreat Cost to swap the Active with a Benched creature. Asleep or Paralyzed creatures cannot retreat.',
 'conditions':'Asleep: cannot attack or retreat; flip at the end of each turn, heads wakes it. Paralyzed: cannot attack or retreat; ends after its owner\'s next turn. Confused: when attacking, flip; tails means 30 damage to itself and no attack. Poisoned: 10 damage between turns. Burned: 20 damage between turns, then flip: heads removes it. Moving to the Bench or evolving removes all conditions.',
 'cards':'Allies: 1 per turn. Tactics: 1 per turn. Gear: any number; a Gear that says "Attach" stays on a creature (1 per creature). Biome: 1 per turn, stays in play for both players until another Biome replaces it.',
 'win':'Take your last Prize card, or your opponent has no creature to move up, or your opponent cannot draw at the start of their turn.',
 'premium':'Illustration Rares, Full Arts, Special Illustration Rares and Clasped Secret Rares play exactly as their base card. The Clasp is a collector treatment, not a mechanic.',
}

# weakness: each affinity is weak to exactly one other, and each is the weakness of exactly one (no affinity is left out)
WEAKNESS={'Verdant':'Ember','Ember':'Tide','Tide':'Storm','Storm':'Stone','Stone':'Verdant','Dusk':'Wonder','Astral':'Dusk','Iron':'Astral','Wonder':'Iron'}

# ---------------------------------------------------------------- affinities finalised on 2026-10-15
# Mascots (001-023) keep the canon affinities from design/wildkin-universe.md (set in wildkin_manifest.AFF_CANON). The rest:
AFF_DECIDED={
 24:('Storm',None),25:('Storm',None),26:('Storm',None),            # Mistip -> Cumulfin -> Nimbusail: mist, cloud, storm-sail
 27:('Ember',None),28:('Ember',None),29:('Ember',None),            # Cindikit -> Emberuff -> Pyrenox: cinder, ember, pyre
 30:('Storm',None),31:('Storm',None),32:('Storm',None),            # Breezit -> Gustrel -> Tempestral: breeze, gust, tempest
 33:('Dusk',None),34:('Dusk',None),35:('Dusk',None),               # Glimlet -> Hushwing -> Veilmora: night moth to veiled queen
 36:('Iron',None),37:('Iron',None),38:('Iron',None),               # Rivbit -> Boltusk -> Ferradon: rivet, bolt, ferrous
 39:('Stone',None),40:('Stone',None),41:('Stone',None),            # Pebblamb -> Cairnram -> Monolox: pebble, cairn, monolith
 42:('Wonder',None),43:('Wonder',None),44:('Wonder',None),         # Quibbit -> Whimhare -> Fablehorn: riddle, whimsy, fable
 45:('Verdant',None),46:('Verdant',None),                          # Mossnip -> Bramblebuck: moss, bramble
 47:('Tide',None),48:('Tide',None),                                # Reefkin -> Corallume: reef, coral
 49:('Ember',None),50:('Ember',None),                              # Sootkit -> Smolderlynx: soot, smoulder
 51:('Astral',None),52:('Astral',None),                            # Zephroo -> Cometrail: star-hopping roo, comet
 53:('Iron',None),54:('Iron',None),                                # Nibrock -> Drillbadger: rock-gnawing, drill claws (metal over stone)
 55:('Tide','Verdant'),56:('Tide','Verdant'),                      # Dewink -> Bloomble: water creature (dew) that blooms; dual like the other mascot lines
 57:('Verdant',None),58:('Verdant',None),59:('Tide',None),60:('Tide',None),61:('Stone',None),62:('Stone',None),
 63:('Iron',None),64:('Iron',None),                                # Clampup: drawn with bronze paws and metal ears, a clamp -> Iron
 65:('Ember',None),66:('Ember',None),67:('Storm',None),68:('Storm',None),69:('Astral',None),70:('Astral',None),
 71:('Dusk',None),72:('Dusk',None),73:('Wonder',None),74:('Wonder',None)}
AFF_REASON={55:'water-and-bloom creature: Tide first, Verdant second (was provisional Verdant)',56:'see Dewink',64:'its approved art is bronze and metal: Iron (was provisional Tide)'}

# ---------------------------------------------------------------- collector demand (starting weights, 0..1). Prices still move with supply, demand and play.
FANDOM={
 1:1.0,    # Cactuft: the primary mascot and a SIR chase
 10:0.95,  # Koirune: the prestige icon
 4:0.85, 2:0.8, 3:0.7,            # Aurorotl, Prismotl (flagship), Opalotl
 20:0.8, 19:0.6,                  # Astrynx (flagship), Creskit
 26:0.8, 25:0.5, 24:0.55,         # Nimbusail (SIR chase), Cumulfin, Mistip
 23:0.75,                         # Flapod (flagship)
 13:0.75, 12:0.7, 11:0.6,         # Aegisopod (Clasped), Shelladin (flagship), Rolyte
 7:0.65, 5:0.7, 6:0.5,            # Fortisaur, Bashlet (flagship), Maceback
 22:0.7, 21:0.65,                 # Pompyre (Clasped), Berribat (flagship)
 18:0.65, 17:0.65,                # Spiramel, Candicoil (flagship)
 16:0.6, 14:0.65, 15:0.45,        # Canopang, Frondolin (flagship), Pangrove
 35:0.7, 38:0.65,                 # Veilmora and Ferradon (Clasped)
 44:0.5, 46:0.5, 48:0.5, 52:0.55, 73:0.5,   # supporting Illustration Rare subjects
 29:0.5, 32:0.45}                 # Pyrenox, Tempestral: the other Stage 2 finals
FANDOM_DEFAULT_MASCOT=0.5; FANDOM_DEFAULT=0.3
CHAR_FANDOM={75:0.6, 76:0.8, 86:0.78, 90:0.55}   # Professor Maren Vale, June Kestrel (SIR), Sel Veyra (SIR), Iris Shade
CHAR_DEFAULT=0.38; TRAINER_DEFAULT=0.3

# ---------------------------------------------------------------- creatures
# no: (hp, retreat, [attacks], ability or None)
# attack: (name, cost, damage, [ops]); ability: (name, 'once'|'passive', [ops])
def A(name, cost, dmg, *ops): return (name, cost, dmg, list(ops))
CREATURES={
 1:(90,1,[A('Spine Spray','V',20,('snipe',10)),A('Blossom Charge','VVC',70,('heal_self',20))],('Sunny Bloom','once',[('heal_one',10,'Verdant')])),
 2:(70,1,[A('Bubble Glint','T',20),A('Prism Flicker','TC',30,('status','asleep',1))],None),
 3:(100,1,[A('Opal Shimmer','C',0,('draw',2)),A('Lustre Jet','TTC',70)],None),
 4:(160,2,[A('Spectrum Wave','TC',50,('per_essence',20))],('Aurora Veil','passive',[('bench_shield',)])),
 5:(70,2,[A('Headbutt','S',20),A('Tail Bump','SC',40)],None),
 6:(100,2,[A('Club Swing','SC',50),A('Plated Guard','SSC',70,('guard',20))],None),
 7:(170,3,[A('Bastion Stomp','SSC',100),A('Fortress Smash','SSSC',180,('cant_attack_next',))],None),
 8:(70,1,[A('Ripple','T',20),A('Splash Leap','TC',40)],None),
 9:(100,1,[A('Rune Current','TC',40,('draw',1)),A('Tidal Rune','TTC',90)],None),
 10:(170,2,[A('Celestial Rapids','TAC',140)],('Runic Flow','once',[('attach_hand',)])),
 11:(70,2,[A('Curl Up','S',10,('guard',20)),A('Roll Bash','SC',30)],None),
 12:(110,2,[A('Shield Bash','SIC',60)],('Knight\'s Plating','passive',[('reduce',10)])),
 13:(180,3,[A('Rolling Rampart','SSC',90,('bonus_self_damaged',40))],('Aegis Shell','passive',[('reduce',20)])),
 14:(70,2,[A('Leaf Curl','V',10,('heal_self',20)),A('Scale Swipe','VC',30)],None),
 15:(100,2,[A('Rooted Swipe','VC',50),A('Grove Mend','VVC',60,('heal_team',10))],None),
 16:(170,3,[A('Verdant Roar','VC',50,('accel','Verdant',1)),A('Thousand Leaves','VVVC',150)],None),
 17:(60,1,[A('Candy Twirl','W',10,('status','confused',0)),A('Sticky Coil','WC',30)],None),
 18:(120,2,[A('Spiral Sweetness','WC',40,('status','confused',0)),A('Sugar Rush','WWC',0,('multi_coin',4,30))],None),
 19:(60,1,[A('Moon Pounce','A',20),A('Crescent Claw','AC',30,('coin_bonus',20))],None),
 20:(120,1,[A('Starlit Pounce','AC',50),A('Starfall Strike','AAC',90)],('Night Vision','once',[('draw',1)])),
 21:(50,1,[A('Berry Bite','D',10,('status','poisoned',0)),A('Night Flutter','DC',30)],None),
 22:(110,1,[A('Pumpkin Hex','DC',30,('status','poisoned',0),('status','confused',0)),A('Hollow Feast','DDC',70,('heal_self',30))],None),
 23:(110,1,[A('Bubble Hug','TC',40,('heal_self',20)),A('Deep Paddle','TTC',90)],('Ear Glide','once',[('switch_in',)])),
 24:(50,1,[A('Drizzle','L',10,('status','paralyzed',1)),A('Static Puff','LC',30)],None),
 25:(90,1,[A('Cloud Fin','LC',50),A('Thunderhead','LLC',70,('snipe',20))],None),
 26:(150,1,[A('Squall Line','LC',50,('snipe',30)),A('Thunder Sail','LLC',130,('discard_self',1))],None),
 27:(60,1,[A('Ember Nip','E',20),A('Spark Pounce','EC',30,('status','burned',1))],None),
 28:(90,2,[A('Flame Ruff','EC',50),A('Blazing Mane','EEC',90,('discard_self',1))],None),
 29:(160,3,[A('Inferno Fang','EC',50,('status','burned',1)),A('Pyre Nova','EEC',180,('discard_self',2))],None),
 30:(50,1,[A('Breeze Peck','L',20),A('Tailwind','LC',30,('self_switch',))],None),
 31:(80,1,[A('Downdraft','LC',40,('gust',)),A('Razor Wind','LLC',80)],None),
 32:(140,1,[A('Gale Burst','LC',30,('spread',20)),A('Tempest Dive','LLC',110,('status','paralyzed',1))],None),
 33:(60,1,[A('Glimmer Hex','D',10,('status','confused',0)),A('Shade Bite','DC',30)],None),
 34:(100,1,[A('Silent Wing','DC',40,('status','asleep',0)),A('Night Swoop','DDC',80)],None),
 35:(160,2,[A('Shroud Rend','DDC',100,('bonus_status',50))],('Veil of Night','once',[('status_def','poisoned')])),
 36:(70,2,[A('Rivet Ram','I',20),A('Metal Nibble','IC',30)],None),
 37:(100,2,[A('Bolt Tusk','IC',50),A('Steel Charge','IIC',80,('recoil',10))],None),
 38:(170,3,[A('Ferrous Charge','IC',60),A('Anvil Crush','IIIC',170,('discard_self',1))],('Forged Plating','passive',[('tool_reduce',30)])),
 39:(70,2,[A('Pebble Toss','S',20),A('Woolly Shove','SC',30)],None),
 40:(110,2,[A('Cairn Charge','SC',50),A('Boulder Ram','SSC',90,('recoil',20))],None),
 41:(180,4,[A('Monolith Press','SSC',80,('guard',30)),A('Standing Stone','SSSC',150)],None),
 42:(60,1,[A('Quizzical Hop','W',0,('draw',2)),A('Hop Kick','WC',30)],None),
 43:(90,1,[A('Whimsy Kick','WC',40,('coin_bonus',30)),A('Hare Trick','WWC',60,('status','asleep',0))],None),
 44:(150,2,[A('Fairy Horn','WC',50,('heal_self',20)),A('Happily Ever After','WWC',70,('coin_bonus',80))],('Once Upon a Time','once',[('coin_draw',2)])),
 45:(60,1,[A('Moss Nip','V',20),A('Soft Graze','VC',20,('heal_self',20))],None),
 46:(120,2,[A('Briar Snare','VC',40,('no_retreat_def',)),A('Bramble Charge','VVC',90,('recoil',20))],None),
 47:(60,1,[A('Reef Bubble','T',20),A('Coral Dart','TC',30)],None),
 48:(110,2,[A('Glow Current','TC',40,('draw',1)),A('Reef Lantern','TTC',80,('strip',1))],None),
 49:(60,1,[A('Soot Puff','E',10,('status','burned',1)),A('Coal Scratch','EC',30)],None),
 50:(110,1,[A('Smoulder Claw','EC',50),A('Wildfire Pounce','EEC',110,('discard_self',1))],None),
 51:(60,1,[A('Star Hop','A',20),A('Pouch Bounce','AC',20,('draw',1))],None),
 52:(110,1,[A('Tail Comet','AC',50,('snipe',20)),A('Comet Dash','AAC',100)],None),
 53:(60,2,[A('Iron Nibble','I',20),A('Burrow','IC',30,('guard',10))],None),
 54:(110,2,[A('Drill Claw','IC',50,('strip',1)),A('Core Drill','IIC',100)],None),
 55:(50,1,[A('Dew Splash','T',20),A('Morning Drop','TC',20,('heal_self',20))],None),
 56:(100,1,[A('Bloom Bubble','TC',40,('heal_team',10)),A('Petal Tide','TTC',80)],None),
 57:(70,1,[A('Fern Nibble','V',20,('heal_self',10)),A('Frond Whip','VVC',60)],None),
 58:(90,2,[A('Acorn Toss','VC',30,('coin_bonus',30)),A('Oaken Charge','VVC',70)],None),
 59:(80,2,[A('Shell Spin','TC',30,('guard',20)),A('Loop Current','TTC',60,('self_switch',))],None),
 60:(70,1,[A('Drift','T',10,('draw',1)),A('Tail Wave','TC',40)],None),
 61:(90,2,[A('Crag Toss','SC',40),A('Rockslide','SSC',60,('snipe',20))],None),
 62:(100,3,[A('Tumble','SC',40,('coin_bonus',20)),A('Bear Hug','SSC',70,('no_retreat_def',))],None),
 63:(70,1,[A('Bolt Spin','I',20),A('Nut Cracker','IIC',70)],None),
 64:(80,2,[A('Clamp','IC',30,('status','paralyzed',1)),A('Bronze Bite','IIC',70)],None),
 65:(60,1,[A('Ash Hop','E',20),A('Cinder Leap','EC',50,('recoil',10))],None),
 66:(80,2,[A('Coal Toss','EC',30,('status','burned',1)),A('Kiln Hug','EEC',90,('discard_self',1))],None),
 67:(70,1,[A('Kite Dive','L',20,('snipe',10)),A('String Snap','LC',40,('status','paralyzed',1))],None),
 68:(60,1,[A('Drop Zap','L',30),A('Thunder Splash','LLC',50,('spread',10))],None),
 69:(70,1,[A('Orbit','A',10,('draw',1)),A('Gravity Pull','AC',30,('gust',))],None),
 70:(60,1,[A('Lullaby','A',0,('status','asleep',0)),A('Moon Peep','AC',40)],None),
 71:(60,1,[A('Dust Wing','D',10,('status','poisoned',0)),A('Murmur','DC',30,('status','confused',1))],None),
 72:(70,1,[A('Trinket Theft','D',10,('opp_discard_random',1)),A('Wink Peck','DC',40)],None),
 73:(70,1,[A('Pillow Puff','W',0,('status','asleep',0),('heal_self',20)),A('Fluff Bounce','WC',40,('coin_bonus',20))],None),
 74:(70,2,[A('Scribble Swap','W',10,('self_switch',)),A('Odd Twist','WWC',0,('multi_coin',3,40))],None),
}

# ---------------------------------------------------------------- allies, gear, biomes, tactics
# no: (ops, role, sub) ; role steers the deck builder; sub for gear: item or tool
TRAINERS={
 75:([('discard_draw',6)],'draw',None),                         # Professor Maren Vale
 76:([('search','creature'),('search','essence')],'search',None),  # June Kestrel
 77:([('heal_all',30)],'heal',None),                            # Warden Sorrel Pike
 78:([('draw',3)],'draw',None),                                 # Toma Reed
 79:([('search','essence'),('search','essence'),('draw',1)],'search',None),  # Lita Moss
 80:([('essence_from_discard',1),('draw',1)],'accel',None),     # Nessa Flint
 81:([('recover',2),('recover_ess',2)],'recover',None),         # Elder Oren
 82:([('shuffle_draw',5)],'draw',None),                         # Pip Rowan
 83:([('look_take',6,2)],'draw',None),                          # Archivist Sera Wynn
 84:([('switch',),('draw',2)],'switch',None),                   # Renn Calder
 85:([('search','evolution'),('draw',1)],'search',None),        # Mira Quill
 86:([('gust',),('draw',1)],'gust',None),                       # Sel Veyra
 87:([('opp_shuffle_draw',3),('draw',2)],'disrupt',None),       # Cass Rell
 88:([('strip_any',),('draw',1)],'disrupt',None),               # Dr. Cyl Vane
 89:([('boost',30)],'boost',None),                              # Marshal Rook
 90:([('opp_discard_choice',),('draw',2)],'disrupt',None),      # Iris Shade
 91:([('draw_to',6)],'draw',None),                              # Dex Harrow
 92:([('heal_active',60),('cure',)],'heal',None),               # Brin Hollow
 93:([('tool_hp',30)],'tool','tool'),                           # Bond Charm
 94:([('search','basic')],'search','item'),                     # Keeper Satchel
 95:([('recover',1)],'recover','item'),                         # Rescue Whistle
 96:([('search','biome_or_essence')],'search','item'),          # Biome Compass
 97:([('look_take',3,1)],'draw','item'),                        # Glow Lantern
 98:([('heal_one',30)],'heal','item'),                          # Trail Rations
 99:([('heal_active',20),('cure',)],'heal','item'),             # Medic Salve
 100:([('search','evolves_in_play')],'search','item'),          # Echo Flute
 101:([('coin_gust',)],'gust','item'),                          # Tide Lure
 102:([('tool_reduce',20)],'tool','tool'),                      # Thermal Cloak
 103:([('tool_free_retreat',)],'tool','tool'),                  # Climbing Line
 104:([('draw',2),('discard_hand',1)],'draw','item'),           # Field Scope
 105:([('skip_evolve',)],'search','item'),                      # Wildseed Treat
 106:([('cure_all',),('heal_all',10)],'heal','item'),           # Sanctuary Bell
 107:([('no_retreat_def',),('vuln',10)],'disrupt','item'),      # Veyra Snare
 108:([('tool_dmg',30),('tool_recoil',10)],'tool','tool'),      # Clasp Rig
 109:([('tool_no_weak',)],'tool','tool'),                       # Null Collar
 110:([('tool_status_immune',),('tool_hp',10)],'tool','tool'),  # Purity Sigil
 120:([('first_bond',)],'search',None),                         # First Bond
 121:([('bench_basic',2)],'search',None),                       # Call of the Wild
 122:([('revive_basic',)],'recover',None),                      # Sanctuary Rescue
 123:([('draw',2)],'draw',None),                                # Keeper's Lesson
 124:([('rally',)],'boost',None),                               # Pack Rally
 125:([('switch',)],'switch',None),                             # Quick Retreat
 126:([('draw_per_bench',)],'draw',None),                       # Shared Instinct
 127:([('opp_discard_random',1),('draw',1)],'disrupt',None),    # Veyra Directive
 128:([('cost_discard_essence',),('gust',)],'gust',None),       # Forced Capture
 129:([('strip_active',)],'disrupt',None),                      # Override Signal
 130:([('heal_full_discard',)],'heal',None),                    # Break the Clasp
 131:([('heal_all',20)],'heal',None),                           # Stand Together
}
BIOMES={'Verdant':'Between turns, heal 10 damage from each Verdant creature in play.',
 'Tide':'Tide creatures in play have no Retreat Cost.',
 'Stone':'Stone creatures take 10 less damage from attacks.',
 'Iron':'Iron creatures get +20 HP.',
 'Ember':'Attacks from Ember creatures do 10 more damage to the opponent\'s Active creature.',
 'Storm':'Once during each player\'s turn, that player may attach a Storm Essence from their hand to 1 of their Storm creatures, in addition to the normal attachment.',
 'Astral':'Once during each player\'s turn, if that player has an Astral creature in play, they may draw a card.',
 'Dusk':'Poisoned creatures take 10 more damage between turns.',
 'Wonder':'Wonder creatures can evolve on the turn they come into play (not on a player\'s first turn).'}

# ---------------------------------------------------------------- text from ops
COND={'asleep':'Asleep','paralyzed':'Paralyzed','confused':'Confused','poisoned':'Poisoned','burned':'Burned'}
def op_text(op):
    k=op[0]; a=op[1:]
    T={
     'heal_self':lambda:'Heal %d damage from this creature.'%a[0],
     'heal_team':lambda:'Heal %d damage from each of your creatures.'%a[0],
     'draw':lambda:'Draw %s.'%('a card' if a[0]==1 else '%d cards'%a[0]),
     'accel':lambda:'Search your deck for a %s Essence card and attach it to 1 of your Benched creatures.'%a[0],
     'status':lambda:('Flip a coin. If heads, the Defending creature is now %s.' if a[1] else 'The Defending creature is now %s.')%COND[a[0]],
     'snipe':lambda:'This attack also does %d damage to 1 of your opponent\'s Benched creatures.'%a[0],
     'spread':lambda:'This attack also does %d damage to each of your opponent\'s Benched creatures.'%a[0],
     'strip':lambda:('Flip a coin. If heads, discard an Essence from the Defending creature.' if a[0] else 'Discard an Essence from the Defending creature.'),
     'discard_self':lambda:'Discard %s attached to this creature.'%('an Essence' if a[0]==1 else '%d Essence'%a[0]),
     'recoil':lambda:'This creature also does %d damage to itself.'%a[0],
     'guard':lambda:'During your opponent\'s next turn, this creature takes %d less damage from attacks.'%a[0],
     'bonus_self_damaged':lambda:'If this creature has any damage on it, this attack does %d more damage.'%a[0],
     'bonus_status':lambda:'If the Defending creature is affected by a Special Condition, this attack does %d more damage.'%a[0],
     'per_essence':lambda:'This attack does %d more damage for each Essence attached to this creature.'%a[0],
     'coin_bonus':lambda:'Flip a coin. If heads, this attack does %d more damage.'%a[0],
     'multi_coin':lambda:'Flip %d coins. This attack does %d damage for each heads.'%(a[0],a[1]),
     'gust':lambda:'Before doing damage, you may switch 1 of your opponent\'s Benched creatures with their Active creature.',
     'self_switch':lambda:'Switch this creature with 1 of your Benched creatures.',
     'cant_attack_next':lambda:'During your next turn, this creature can\'t attack.',
     'no_retreat_def':lambda:'The Defending creature can\'t retreat during your opponent\'s next turn.',
     'opp_discard_random':lambda:'Your opponent discards a random card from their hand.',
     # abilities
     'heal_one':lambda:'Once during your turn, you may heal %d damage from 1 of your %s creatures.'%(a[0],a[1]) if len(a)>1 else 'Heal %d damage from 1 of your creatures.'%a[0],
     'attach_hand':lambda:'Once during your turn, you may attach an Essence card from your hand to 1 of your Benched creatures. This does not count as your Essence attachment for the turn.',
     'switch_in':lambda:'Once during your turn, if this creature is on your Bench, you may switch it with your Active creature.',
     'coin_draw':lambda:'Once during your turn, you may flip a coin. If heads, draw %d cards.'%a[0],
     'status_def':lambda:'Once during your turn, if this creature is your Active creature, you may make your opponent\'s Active creature %s.'%COND[a[0]],
     'bench_shield':lambda:'Prevent all damage done to your Benched creatures by your opponent\'s attacks.',
     'reduce':lambda:'This creature takes %d less damage from attacks.'%a[0],
     'tool_reduce':lambda:'If this creature has a Gear attached, it takes %d less damage from attacks.'%a[0],
     # trainers
     'discard_draw':lambda:'Discard your hand and draw %d cards.'%a[0],
     'search':lambda:{'creature':'Search your deck for a creature and put it into your hand.','essence':'Search your deck for an Essence card and put it into your hand.',
        'evolution':'Search your deck for an Evolution creature and put it into your hand.','basic':'Search your deck for a Basic creature and put it into your hand.',
        'biome_or_essence':'Search your deck for a Biome or an Essence card and put it into your hand.','evolves_in_play':'Search your deck for a creature that evolves from 1 of your creatures in play and put it into your hand.'}[a[0]],
     'heal_all':lambda:'Heal %d damage from each of your creatures.'%a[0],
     'heal_active':lambda:'Heal %d damage from your Active creature.'%a[0],
     'cure':lambda:'Remove all Special Conditions from your Active creature.',
     'cure_all':lambda:'Remove all Special Conditions from your creatures.',
     'essence_from_discard':lambda:'Attach an Essence card from your discard pile to 1 of your creatures.',
     'recover':lambda:'Put %s from your discard pile into your hand.'%('a creature' if a[0]==1 else 'up to %d creatures'%a[0]),
     'recover_ess':lambda:'Put up to %d Essence cards from your discard pile into your hand.'%a[0],
     'shuffle_draw':lambda:'Shuffle your hand into your deck. Draw %d cards.'%a[0],
     'look_take':lambda:'Look at the top %d cards of your deck. Put %s into your hand and shuffle the rest back.'%(a[0],'1 of them' if a[1]==1 else '%d of them'%a[1]),
     'switch':lambda:'Switch your Active creature with 1 of your Benched creatures.',
     'opp_shuffle_draw':lambda:'Your opponent shuffles their hand into their deck and draws %d cards.'%a[0],
     'strip_any':lambda:'Discard an Essence attached to 1 of your opponent\'s creatures.',
     'strip_active':lambda:'Discard an Essence attached to your opponent\'s Active creature.',
     'boost':lambda:'During this turn, your Active creature\'s attacks do %d more damage to your opponent\'s Active creature.'%a[0],
     'opp_discard_choice':lambda:'Look at your opponent\'s hand. Choose a card other than an Essence; they discard it.',
     'draw_to':lambda:'Draw cards until you have %d cards in your hand.'%a[0],
     'tool_hp':lambda:'Attach to a creature. It gets +%d HP.'%a[0],
     'coin_gust':lambda:'Flip a coin. If heads, switch 1 of your opponent\'s Benched creatures with their Active creature.',
     'tool_free_retreat':lambda:'Attach to a creature. It has no Retreat Cost.',
     'discard_hand':lambda:'Then discard a card from your hand.',
     'skip_evolve':lambda:'Choose 1 of your Basic creatures that was in play at the start of your turn. Put a Stage 2 card from your hand that evolves from its Stage 1 onto it, skipping Stage 1. You can\'t play this card on your first turn.',
     'rush_evolve':lambda:'Choose 1 of your Basic creatures. This turn it can evolve even if it came into play this turn.',
     'vuln':lambda:'During this turn, that creature takes %d more damage from attacks.'%a[0],
     'tool_dmg':lambda:'Attach to a creature. Its attacks do %d more damage to the opponent\'s Active creature.'%a[0],
     'tool_recoil':lambda:'At the end of each of your turns in which it attacked, put %d damage on it.'%a[0],
     'tool_no_weak':lambda:'Attach to a creature. It has no Weakness.',
     'tool_status_immune':lambda:'Attach to a creature. It can\'t be affected by Special Conditions.',
     'first_bond':lambda:'Search your deck for a Basic creature and an Essence card of its affinity. Put the creature onto your Bench and attach the Essence to it.',
     'bench_basic':lambda:'Search your deck for up to %d Basic creatures and put them onto your Bench.'%a[0],
     'revive_basic':lambda:'Put a Basic creature from your discard pile onto your Bench.',
     'rally':lambda:'During this turn, your Active creature\'s attacks do 10 more damage for each of your Benched creatures.',
     'draw_per_bench':lambda:'Draw a card for each of your Benched creatures.',
     'cost_discard_essence':lambda:'Discard an Essence card from your hand. If you can\'t, you can\'t play this card.',
     'heal_full_discard':lambda:'Heal all damage from your Active creature and remove its Special Conditions. Discard all Essence attached to it.',
    }
    return T[k]()
def ops_text(ops):
    out=[]
    for i,op in enumerate(ops):
        t=op_text(op)
        if op[0]=='tool_recoil' or (op[0]=='tool_hp' and i>0): t=t.replace('Attach to a creature. It gets','It also gets')
        out.append(t)
    return ' '.join(x for x in out if x)
def dmg_label(dmg, ops):
    ks=[o[0] for o in ops]
    if 'multi_coin' in ks: return '%d×'%[o for o in ops if o[0]=='multi_coin'][0][2]
    if any(k in ks for k in ('per_essence','coin_bonus','bonus_self_damaged','bonus_status')): return '%d+'%dmg
    return str(dmg) if dmg else ''

def prize_value(stage, nstages): return 1

def creature_gameplay(no, stage, nstages, aff):
    hp,ret,atks,ab=CREATURES[no]
    out={'status':'designed','hp':hp,'retreat':ret,'weakness':WEAKNESS[aff],'prizes':prize_value(stage,nstages),
         'attacks':[{'name':n,'cost':c,'damage':d,'damage_label':dmg_label(d,ops),'text':ops_text(ops),'ops':[list(o) for o in ops]} for n,c,d,ops in atks]}
    if ab:
        t=ops_text(ab[2])
        if ab[1]=='once' and not t.startswith('Once'): t='Once during your turn, you may '+t[0].lower()+t[1:]
        out['ability']={'name':ab[0],'kind':ab[1],'text':t,'ops':[list(o) for o in ab[2]]}
    return out
def trainer_gameplay(no, cat, biome_aff=None):
    if cat=='biome':
        return {'status':'designed','rules':'Biome. Stays in play for both players. '+BIOMES[biome_aff],'ops':[['biome',biome_aff]],'role':'biome','subtype':None}
    ops,role,sub=TRAINERS[no]
    pre={'ally':'Ally. You may play only 1 Ally each turn. ','tactic':'Tactic. You may play only 1 Tactic each turn. ','gear':''}[cat]
    txt=ops_text(ops).replace('Before doing damage, you may switch','Switch').replace('The Defending creature can\'t retreat during your opponent\'s next turn.','Your opponent\'s Active creature can\'t retreat during their next turn.')
    if cat=='gear' and sub=='tool': txt=txt+' (Attached Gear stays on the creature; 1 per creature.)'
    return {'status':'designed','rules':(pre+txt).strip(),'ops':[list(o) for o in ops],'role':role,'subtype':sub}
