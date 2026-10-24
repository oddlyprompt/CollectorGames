# Tidemark checklist supplements: cards added to an existing historical set after its first checklist (2026-10-23, owner: "expand the key
# historical sets through actual card content"). Read by checklist.py. They never renumber anything: each card takes a collector number from a
# free gap in its faction's block of the set's printed checklist, a new identity id (TMC-0651 and up) and a new illustration id (TMI-0651 and up),
# and its art sheets come after every older sheet, so every existing id, number and delivered sheet stays as it was.
# Entry: (title, type, subtype, rarity, flags, gameplay identity, illustration subject). Types, subtypes and flags as in checklist_land.py.
# Faction blocks of First Tide's 250 numbers (the original run's layout): the first number of each faction's block and the last.
FT_BLOCKS={'CR':(1,36),'TW':(37,65),'IR':(66,99),'TB':(100,133),'FF':(134,167),'AC':(168,201),'HL':(202,226),'NE':(227,250)}

FIRST_TIDE=[
 ('CR',[
  ('Gatehouse Pikeman','U','Human Soldier','C','','Rampart blocker for a cheap price','A pikeman braced inside a stone gateway, a long pike levelled at the road, the portcullis raised behind him'),
  ('Banner Bearer','U','Human Soldier','C','','Cheap Leader','A young soldier in a too-large tabard carries the royal standard at the head of a short column on a coast road'),
  ('Beacon Tower','H','Fortress','C','','Stronghold that looks ahead when it enters','A signal tower on a grassy headland with a dry brazier on its roof and a watchman leaning from the stair window'),
  ('Close Ranks','S','Swift','C','','Swift: your units are sturdier this turn','A line of soldiers lock their shields together as arrows arc over a muddy field'),
  ('Bastion Quartermaster','U','Human Official','U','','Fortifies a Stronghold when it enters','A harassed quartermaster with a wax tablet counts stone blocks stacked beside a half-built bastion wall'),
  ('Marching Colors','E','Player','U','','Enchantment: your Soldiers hit harder','A column of soldiers in blue tabards marches past a ruined mill under a rolling crimson-and-white banner'),
  ('Lord Marshal Dorran','U','Human Noble','R','','Big Leader of the Shore line','A veteran marshal in scarred blue plate stands over a map table on a hilltop, his officers waiting for orders'),
  ('Citadel of Aldermere','H','Fortress','R','','Stronghold that keeps strengthening your walls','A hill fortress of three concentric curtain walls over a wide estuary, masons at work on the outer gate'),
 ]),
 ('TW',[
  ('Thorn Hound','U','Beast','C','','Cheap Charge beast','A lean hound bursts out of a bramble thicket with its ears flat and its teeth showing'),
  ('Thicket Wolf','U','Beast','C','','Trample beast','A grey wolf mid-leap across a mossy stream, spray flying'),
  ('Seedtime','S','','C','','Ramp: Influence capacity grows','Forest folk press seed into dark soil between the roots of an old oak at the first thaw'),
  ('Fernhollow','D','Shore','C','','Shore Domain: beasts grow','A sunlit fern glade ringed by ancient trunks, a fawn and a boar drinking side by side'),
  ('Ridge Stalker','U','Beast','U','','Swift ambusher','A lynx on a rock ledge above a forest path, tail low, watching something below'),
  ('Heartwood Druid','U','Forest Folk Druid','U','','Grows every Rise','An old druid kneels with her palm against a great root, moss spreading up her sleeve'),
  ('Antlered Titan','U','Beast','R','','Huge Trample stag','A stag as tall as the surrounding trees steps through a river at dawn, fog around its legs, a hunter far below for scale'),
  ('Greatwood Rampage','S','Swift','R','','Swift: all your units hit much harder this turn','A stampede of boar, stag and wolf bursts out of a forest road toward a line of startled soldiers'),
  ('Spirit of the Deep Wood','U','Beast Spirit','R','','Swift spirit that returns to your hand when destroyed','A pale stag-spirit half seen between birch trunks, its antlers made of bare winter branches'),
 ]),
 ('IR',[
  ('Rivet Golem','U','Construct','C','','Plain three-cost body','A riveted iron figure stands motionless in a foundry yard, steam curling off its shoulders'),
  ('Gun Crew','U','Reachfolk Soldier','C','','Sturdy four-cost body','Gunners in leather aprons wheel a field piece up a quarry ramp, one of them shading his eyes against the dust'),
  ('Anvil Strike','S','','C','','Deals 3 damage to a unit','A smith brings a long hammer down on a glowing blank, sparks scattering across the forge floor'),
  ('Iron Brace','R','Equipment','C','','Equipment: +2 toughness','A plated vambrace lies on a workbench among files and rivets, a half-finished pauldron beside it'),
  ('Boilerplate Guard','U','Construct','U','','Tough guard','A guard in overlapping sheet-iron plates stands at a mine gate, rain beading on the metal'),
  ('Siege Engineer','U','Reachfolk Smith','U','','Damages an enemy Stronghold when it enters','An engineer with a rolled plan under one arm sights along a trench toward a distant fortress wall'),
  ('Cannon of Greywater','R','Tool','R','','Damages an enemy unit every Rise','A harbour gun on a heavy wooden carriage at the edge of a basalt quay, its muzzle trained on the open water'),
  ('The Iron Sovereign','U','Construct','L','','Legendary Tough Rampart wall; Iron Reach\'s founding figure','A seated figure of riveted plate on a throne cut into a mine wall, a lamp in its chest lighting the gallery of ore carts below'),
 ]),
 ('TB',[
  ('Wave Skipper','U','Tideborn Warrior','C','','Cheap Surge attacker','A Tideborn rider crouches on the crest of a breaking wave, one hand trailing in the foam'),
  ('Shell Diver','U','Tideborn Scout','C','','Looks at the top card when it enters','A diver with fin-like ears surfaces in a lagoon holding a spiral shell up to the light'),
  ('Ebb Current','S','Swift','C','','Swift: move one of your units to the other front','A school of silver fish and a swimming scout are swept sideways together by a bright current over a reef'),
  ('Shoal Mage','U','Tideborn Mage','C','','Looks ahead when it enters','A mage stands waist-deep in shallows reading ripples as if they were writing, gulls wheeling overhead'),
  ('Sea Mist Adept','U','Tideborn Mage','U','','Moves an enemy unit to the other front when it enters','An adept raises both hands as a bank of sea fog rolls over a harbour wall and swallows the guards'),
  ('Stormglass Mage','U','Tideborn Mage','U','','Surge attacker','A mage on a tide rock holds up a cloudy storm glass, a squall darkening the horizon behind her'),
  ('The Drowning Tide','S','Swift','R','','Swift: returns all enemy small units to hand','A great grey wave sweeps across a stone quay, lifting carts, barrels and small boats'),
  ('Oracle of the Long Ebb','U','Tideborn Mage','L','','Legendary Swift seer that draws cards and looks ahead','The first Tideborn seer sits in a tidal pool at low tide, the sea drawn back for miles around her, pearls scattered on the sand'),
 ]),
 ('FF',[
  ("Fisher's Skiff",'V','Skiff','C','','Cheapest Vessel with Ferry','A one-sail fishing skiff with nets heaped in the stern, running before a light wind'),
  ('Press-Gang Sailor','U','Human Sailor','C','','Charge sailor','A sailor with a belaying pin in his belt grins from the bow of a longboat nosing into a crowded quay'),
  ('Gunwale Volley','S','','C','','Deals 3 damage to a unit in the Deep','A merchantman fires a full broadside at dusk, the whole side of the ship wreathed in smoke'),
  ("Smuggler's Run",'S','Swift','U','','Swift: your Vessels hit harder this turn','A dark cutter slips past a harbour chain at night with its sails reefed and its crew lying flat'),
  ('Salvage Crew','U','Human Sailor','U','','Draws when one of your Vessels is destroyed','Divers and a winch crew work over a wreck in shallow water, hauling a dripping chest on deck'),
  ('Dreadnought Marauder','V','Galleon','R','','Big Vessel with Ferry 2','A black-hulled raider with three decks of gunports ploughs through a grey swell under a torn flag'),
  ("Plunderer's Charter",'E','Player','R','','Draws when you damage the Harbor','A sealed letter of marque with a black stamp lies on a captain\'s table among rum cups and charts'),
  ('Captain Sable Orwin','U','Human Privateer','R','','Charge captain','A privateer captain stands on a quarterdeck, cutlass raised toward an enemy sail on the horizon'),
 ]),
 ('AC',[
  ('Drowned Penitent','U','Drowned Cultist','C','','Returns to your hand when destroyed','A hooded cultist walks up out of the surf at night, water streaming off a rope-bound cloak'),
  ('Gloom Eel','U','Deep Eel','C','','Plain three-cost body','A long pale eel glides along the edge of a trench in lightless water, its eyes two cold points'),
  ("Undertow's Grasp",'S','','C','','Destroys a small enemy unit','Hands of kelp rise out of black water and pull a sailor from the rail of a drifting boat'),
  ('Choir of Silt','E','Player','U','','Your Drowned grow','Pale singers stand in a flooded nave with their mouths open, silt drifting down around them'),
  ('Tide-Bound Priest','U','Drowned Cleric','U','','Restores Harbor strength every Rise','A priest in a waterlogged cassock stands at a drowned altar while minnows circle the candles'),
  ('The Maw Below','U','Deep Horror','R','','Huge Surge horror','A vast mouth opens in the sea floor beneath a small ship, ringed with pale teeth like a reef'),
  ('Drowned Matriarch','U','Drowned Cleric','R','','Brings a Drowned unit back from the discard pile','An old matriarch in a shroud of pearls wades into a moonlit cove, her hand held out to the water'),
  ('Final Descent','S','','R','','Heavy damage to every unit on one front','A whirlpool the width of a bay swallows a whole fleet, masts tilting into the drain'),
 ]),
 ('HL',[
  ('Quayside Ferrywoman','U','Human Sailor','C','','Cheap unit with Ferry','A ferrywoman leans on a long oar as her flat boat crosses a harbour crowded with barges'),
  ('Harbor Warden','U','Human Soldier','C','','Sturdy unit with Ferry','A warden with a lantern pole walks a quay at dusk, keys jingling on his belt'),
  ('Wharf Clerk','U','Human Official','C','','Cheap clerk that looks ahead','A clerk with an ink-stained cuff checks a tally book against a pile of barrels on a busy wharf'),
  ('Trade Winds','S','','C','','Draws a card','Sails fill all at once along a crowded pier as a fresh breeze comes in off the water'),
  ('Quay Inspector','U','Human Official','U','','Your opponent\'s Swift spells cost more','An inspector in a tan coat opens a crate with a crowbar while the crew watches nervously'),
  ('Guild Adjudicator','U','Human Official','U','','Draws a card when it enters','An adjudicator with a ledger and a small gavel presides over a dispute in a bright guild hall'),
  ("Pilot's Guild Hall",'H','Hall','U','','Stronghold that makes Vessels cheaper','A hall of charts and brass compasses with a lantern in every window, pilots queuing on the steps'),
  ('Guildmaster Verrin','U','Human Trader','R','','Draws and grows your Influence when it enters','A guildmaster at a harbour table counts coins into leather purses while clerks bring ledgers'),
  ('Admiralty Hall','H','Hall','R','','Stronghold that shields your Harbor','A stone admiralty hall on a rise above the roads, its front windows lit and a signal mast on the roof'),
 ]),
 ('NE',[
  ('Roadside Sellsword','U','Human Mercenary','C','','Plain two-cost mercenary','A sword-for-hire sits on a milestone at a crossroads, sharpening a blade, a mule tied behind him'),
  ('Hedge Healer','U','Human Wanderer','C','','Gives a unit extra toughness when it enters','A healer with bundled herbs kneels beside a wounded soldier under a hedge, binding a cut'),
  ('Roving Tinker','U','Human Trader','C','','Looks ahead when it enters','A tinker with a pack frame hung with pans and tools stops to mend a pot at a roadside well'),
  ("Pilgrim's Rest",'D','Shore','C','','Shore Domain: units are a little sturdier','A roadside shrine with a bench and a bowl of lit candles, pilgrims asleep against the stones'),
  ("Lamplighter's Rounds",'R','Tool','U','','Looks at three cards and takes one','A lamplighter on a long ladder trims the wick of a street lamp as dusk comes down over a market town'),
  ('Border Scavenger','U','Human Wanderer','U','','Destroys an enemy Relic when it enters','A scavenger picks through the wreck of a cart on a moor road, a crowbar in one hand and a lantern in the other'),
  ('Waystone Keeper','U','Human Keeper','U','','Sturdy four-cost keeper','An old keeper in a rain cloak leans on a staff beside a waystone, rain dripping from his hood'),
  ('The Wanderer Without Name','U','Human Wanderer','L','','Legendary Swift traveller who strikes when she arrives','A hooded traveller stands on a moor ridge where three roads meet, a storm behind her and the sea beyond, belonging to no coast'),
 ]),
]
   # (set code, rows by faction, explicit faction blocks or None to derive them from the printed checklist)

# ---- Reefward (RW, summer 2017): the reef and the greenwood meet. 15 catalogued cards become 75 (Thornwild and Tideborn only, as the set's focus says).
REEFWARD=[
 ('TW',[
  ('Marsh Heron','U','Beast Bird','C','','Tall wader that looks ahead when it enters','A grey heron stands motionless in a reedy tidal marsh at dawn, one foot raised above the mud'),
  ('Driftwood Otter','U','Beast','C','','Cheap two-power beast','An otter hauls itself over a stranded log at the high-tide line, a fish in its jaws'),
  ('Tidepool Crab','U','Beast','C','','Tough little beast','A rock crab with a barnacled shell raises both claws in a tidepool ringed with anemones'),
  ('Reed Cutter','U','Forest Folk Worker','C','','Shields a friend when it enters','A forest-folk worker in a reed hat cuts bundles with a hooked blade at the edge of a brackish lagoon'),
  ('Salt Hare','U','Beast','C','','Swift one-drop','A hare crouches at the edge of a salt meadow with its ears flat, about to bolt'),
  ('Mudflat Boar','U','Beast Boar','C','','Trample three-drop','A heavy boar ploughs through shin-deep mud at low tide, gulls scattering ahead of it'),
  ('Briar Sprite','U','Beast Spirit','C','','Swift two-drop','A small thorn-limbed spirit flits between bramble stems on a coastal path in the early morning'),
  ('Long Walk Wolf','U','Beast Wolf','C','','Plain four-drop','A lean grey wolf lopes along a stretch of empty beach at dusk, tracks trailing behind it'),
  ('Shorewood Stag','U','Beast','C','','Plain five-drop','A stag stands at the edge of a coastal wood looking out over a grey bay, mist on its antlers'),
  ('Hide in the Reeds','S','Swift','C','','Swift: a unit gets +0/+3 this turn','A hunter and her hound crouch motionless in tall reeds as a patrol passes on the dike'),
  ('Bramble Snare','S','','C','','Stops one unit from attacking','A thicket of brambles grows over a path overnight, a soldier tangled in its thorns'),
  ('Mangrove Shallows','D','Deep','C','','Deep Domain: beasts are sturdier','A mangrove swamp with arching roots in warm shallow water, herons and crabs among the stilts'),
  ('Bone Charm','R','Equipment','C','','Equipment: +1 power','A necklace of gull bones and sea glass hangs from a driftwood peg in a forest-folk hut'),
  ("Hunter's Oath",'E','Unit','C','','Aura: +1/+1','A young hunter kneels at a stone circle with a bow across her knees, swearing on a shed antler'),
  ('Grove Warden','U','Forest Folk Guardian','C','','Rampart guard','A warden in bark armour stands between two great trees guarding a woodland gate, spear grounded'),
  ('Tide Fox','U','Beast Fox','U','','Charge fox','A russet fox races along a spit of sand with the spray flying off its tail'),
  ('Reefwood Matron','U','Forest Folk Druid','U','','Two fawns come with her','A matron druid leads two spotted fawns out of a coastal wood, a net of shells at her belt'),
  ('Ebb Hunter','U','Forest Folk Hunter','U','','Pings a crossing attacker','A hunter wades the shallows at low tide with a short bow, watching the sea-line for movement'),
  ('Cormorant Diver','U','Beast Bird','U','','Strikes when it enters','A cormorant plunges from a cliff into a fish-bright cove, wings folded back'),
  ('Rootbound Guardian','U','Beast Spirit','U','','Tough Rampart wall','A figure of living roots and driftwood stands waist-deep in a lagoon, barnacles on its shoulders'),
  ('Windfall Harvest','S','','U','','Draws two cards','Forest folk carry baskets of nuts and apples from an orchard after a storm has shaken the trees'),
  ('Stampede Path','S','Swift','U','','Swift: your units gain Charge this turn','Boar, stag and wolf burst out of a coastal wood in a line, soldiers scattering on the road ahead'),
  ('Packmaster Veyra','U','Forest Folk Hunter','U','','Your beasts hit harder','A hunter in a wolfskin cloak whistles for her pack on a ridge above a beach, three wolves at her heels'),
  ('Great Heron of the Shallows','U','Beast Bird','R','','Large swift heron','A heron the height of a man stands in a drowned meadow, its shadow long across silvered water'),
  ('Driftwood Titan','U','Beast Spirit','R','','Huge tough trampler','A titan of lashed driftwood and kelp rises out of a bay at dusk, barnacled and dripping'),
  ('Wild Tide Surge','S','Swift','R','','Swift: all your beasts get +2/+2 this turn','Beasts of every kind plunge together through a rising tide across a flooded meadow'),
  ('Antler Council','E','Player','R','','Your beasts are bigger','A ring of stags stands in a moonlit forest clearing, their antlers touching like a ring of branches'),
  ('Reedbed Ambusher','U','Beast Cat','R','','Swift ambusher','A marsh cat flattens itself in a reedbed above a tidal channel, tail twitching'),
  ('Old Brineroot','U','Beast Spirit','L','','Legendary Rampart trampler; the great tree of the shore','A vast ancient mangrove-oak at the meeting of forest and sea, roots in the water and a heron colony in its crown'),
  ('Orrin of the Reedlands','U','Forest Folk Noble','L','','Legendary hunt-lord who arrives with a hound','A forest-folk lord in a reed-woven cloak stands on a dike at dawn with a great hound at his side, a hunting horn raised'),
 ]),
 ('TB',[
  ('Reef Darter','U','Fish','C','','Cheap Surge fish','A small striped fish darts out of a coral crack with the sun on its fins'),
  ('Coral Hatchling','U','Fish','C','','Looks ahead when it enters','A tiny fish hatches from a pearly egg in a coral nursery, a Tideborn child watching from behind a fan of coral'),
  ('Pearl Netter','U','Tideborn Worker','C','','Draws when it enters','A Tideborn worker draws a net of glinting pearls up out of a lagoon, a basket at her hip'),
  ('Tidal Scout','U','Tideborn Scout','C','','Surge scout','A Tideborn scout swims along the underside of a reef ledge, fin-like ears raised to listen'),
  ('Moon Jelly','U','Fish','C','','Tough jelly','A pale moon jelly drifts over a shelf of reef in clear bright water, tentacles trailing'),
  ('Brine Archer','U','Tideborn Archer','C','','Pings a crossing attacker','A Tideborn archer on a coral parapet draws a bow made of bone and sinew over a lagoon entrance'),
  ('Reef Sentry','U','Tideborn Warrior','C','','Plain three-drop','A Tideborn sentry in a shell breastplate stands at a coral gate with a trident grounded'),
  ('Anemone Guard','U','Fish','C','','Rampart four-drop','A great anemone with a guard of small striped fish blocks the mouth of a reef cave'),
  ('Wave Caller','U','Tideborn Mage','C','','Moves a unit to the other front when it enters','A Tideborn mage stands on a reef flat with both arms raised as a long swell rolls toward the shore'),
  ('Slipstream','S','Swift','C','','Swift: returns a small enemy unit to hand','A small boat is lifted off a sandbar by a sudden current and carried back toward its harbour'),
  ('Lagoon Mist','S','Swift','C','','Swift: an enemy unit cannot block','A white sea-mist rolls over a lagoon, hiding a causeway and the guards on it'),
  ('Tidal Flats','D','Shore','C','','Shore Domain: attackers are stranded even at home','Miles of rippled wet sand with a thin sheet of water over it, a line of footprints disappearing into the shine'),
  ('Pearl Diadem','R','Equipment','C','','Equipment: +0/+1 and Surge','A circlet of pearls and silver wire rests on a cushion of kelp in a coral chamber'),
  ('Foam Cloak','E','Unit','C','','Aura: Surge and +0/+1','A Tideborn warrior wrapped in a cloak of sea foam wades onto a beach at first light'),
  ('Kelp Warden','U','Tideborn Guardian','C','','Can block twice','A Tideborn guardian stands tangled in kelp at a reef passage, two spears levelled at once'),
  ('Sandbar Skimmer','U','Fish','C','','Plain five-drop','A long flat ray glides above a pale sandbar in shallow turquoise water'),
  ('Tide Warden Lysa','U','Tideborn Noble','U','','Gains Influence when your units return to your hand','A Tideborn warden in a coral coat watches the tide table on a wall of pearl'),
  ('Riptide Rider','U','Tideborn Warrior','U','','Surge rider','A rider on a sea-horse tears across a breaking wave, trident lowered'),
  ('Siren of the Reef','U','Siren','U','','Moves an enemy unit to the other front','A siren sings from a rock at the reef edge, a longboat turning slowly toward her'),
  ('Mirrorpool Mage','U','Tideborn Mage','U','','Copies one of your units when it enters','A mage kneels at a still tide-pool where her own reflection looks up at her with a different face'),
  ('Flood Surge','S','','U','','Returns all small enemy units to hand','A tidal bore pours up a river mouth and washes small boats and barrels back up the quay'),
  ('Pearl Tithe','S','','U','','Draw a card, lose 1 Harbor','A Tideborn council pays a tithe of pearls into a stone font beneath a lantern'),
  ('Lagoon Court','D','Deep','U','','Deep Domain: Tideborn hit harder','A circular lagoon with ranked seats of coral where Tideborn nobles sit in silence'),
  ('Reefsong','E','Player','U','','Draws when your units return to your hand','A choir of Tideborn sings from the rim of a reef while the water rises and falls in time'),
  ('Admiral of the Reef Court','U','Tideborn Noble','R','','Surge admiral who spurs other Surge units','A Tideborn admiral in pearl armour leads a column of riders out of a coral gate at the turn of the tide'),
  ('Great Moon Jelly','U','Fish','R','','Huge tough jelly','A moon jelly the size of a house lights a deep blue cavern from within'),
  ('Pearl Tempest','S','Swift','R','','Swift: returns every enemy unit on one front to hand','A storm of pearl-white spray tears across a bay, tossing small ships back toward harbour'),
  ('Tidal Archive','D','Deep','R','','Deep Domain: spells cost 1 less','Shelves of carved shell cut into a reef wall, scrolls of kelp-paper tied with ribbon'),
  ('Coral Seer of Ys','U','Tideborn Mage','R','','Looks at three cards and keeps one when it enters','A seer sits among coral pillars with a bowl of sea-water in which stars show though it is daylight'),
  ('Sealord Corvane','U','Tideborn Noble','L','','Legendary Surge lord who sweeps small units away','The Sealord of the Reef Court rises from the water on a spiral staircase of living coral, a pearl-crowned trident in hand'),
 ]),
]

# ---- compact waves: one line per card holds the checklist row and the design. Entry:
#   (faction, title, type, subtype, rarity, identity, illustration subject, cost, allegiance, power|durability, toughness, keywords, abilities[, ferry])
# Designs go to tools/tidemark/v1/design_waves.json (written by checklist.py; cards.js reads it).
WAVE_DESIGNS={}
def wave(entries):
    by={}
    for e in entries:
        fac,title,t,sub,rar,ident,subj,c,q,p,tt,k,x=e[:13]; y=e[13] if len(e)>13 else 0
        by.setdefault(fac,[]).append((title,t,sub,rar,'',ident,subj))
        d={'c':c,'q':q}
        if t in 'UV': d['p']=p; d['t']=tt
        if t=='H': d['f']=p
        if k: d['k']=k
        if y: d['y']=y
        if x: d['x']=x
        d['n']='Wave card, designed 2026-10-23.'
        if title in WAVE_DESIGNS: raise ValueError('designed twice: '+title)
        WAVE_DESIGNS[title]=d
    return [(f,by[f]) for f in ['CR','TW','IR','TB','FF','AC','HL','NE'] if f in by]

from wave_tf import ENTRIES as _TF
THORNFALL=wave(_TF)
from wave_df import ENTRIES as _DF
DEEPFORGE=wave(_DF)
from wave_sl import ENTRIES as _SL
SIEGE=wave(_SL)
from wave_dh import ENTRIES as _DH
HYMNS=wave(_DH)
from wave_cb import ENTRIES as _CB
CORAL=wave(_CB)
from wave_bt import ENTRIES as _BT
BLACKTIDE=wave(_BT)
from wave_kh import ENTRIES as _KH
KEEPERS=wave(_KH)
from wave_rt import ENTRIES as _RT
RETURN=wave(_RT)

SUPPLEMENTS=[('FT',FIRST_TIDE,FT_BLOCKS),('RW',REEFWARD,None),('TF',THORNFALL,None),('DF',DEEPFORGE,None),('SL',SIEGE,None),('DH',HYMNS,None),('CB',CORAL,None),('BT',BLACKTIDE,None),('KH',KEEPERS,None),('RT',RETURN,None)]
