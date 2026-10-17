#!/usr/bin/env python3
"""Builds the Wildkin Set 002 (Duskfall) manifest from the owner's checklist and SOL's final art handoff.

  python3 tools/wildkin_dsk.py            write wildkin-production/manifest-dsk.json and wildkin-production/sets/dsk/RULES.md
  python3 tools/wildkin_dsk.py --check    rebuild in memory and fail if the files differ or validation fails

Inputs (never edited here):
  wildkin-production/sets/dsk/art_manifest.json   the 180-card checklist with art mapping (SOL handoff, 2026-10-17)
  wildkin-production/manifest.json                First Bond (reprints copy its cards exactly; it is never changed)
  wildkin-production/approved/registry.json       approved art (tools/wildkin_art.py set-delivery)

What is whose:
  roster       names, numbers, categories, affinities, families, stages, which cards are reprints: the owner's checklist
               (the handoff calls the roster "proposed"; it is used as delivered, nothing is added or renamed)
  designed     card rules for the 103 cards with new gameplay, written by Claude Code on 2026-10-17 from the engine's
               existing operations (tools/wildkin_design.py), so every effect is one the engine already plays
  decided      rarities, fandom weights, the release date, the biome effects: reasoned choices by Claude Code, 2026-10-17
  reprint      the 27 selective reprints and 9 Essence copy their First Bond card exactly and play as that card
None of the designed or decided facts are canon; the owner can change any of them here."""
import os, sys, json, argparse
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import wildkin_design as WD
import wildkin_art_sets as WAS
from wildkin_design import A
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP=os.environ.get('WILDKIN_PRODUCTION') or os.path.join(ROOT,'wildkin-production')
HANDOFF=os.path.join(WP,'sets','dsk')
VERSION='2.0.0'
RELEASE=('2026-12-07','decided','26 weeks after First Bond (a Monday, like every release); announced 35 days ahead with preorders')

# ---------------------------------------------------------------- creatures with new gameplay (Duskfall numbers)
# Same format as wildkin_design.CREATURES. 001-034 are new species; 051-074 are new prints of First Bond species.
# Power follows First Bond's curve for the same stage (Basic 50-70 HP, Stage 1 90-130, Stage 2 150-190), so Duskfall
# adds choices rather than replacing the format. The set leans on Dusk and Iron, as its name and art do.
CREATURES={
 1:(60,1,[A('Dim Glow','D',10,('status','asleep',1)),A('Moth Brush','DC',30)],None),                                  # Velumi
 2:(100,1,[A('Lunar Dust','DC',40,('status','poisoned',0)),A('Night Arc','DAC',80)],None),                             # Velunara
 3:(160,2,[A('Twilight Veil','DC',50,('status','confused',0)),A('Eclipse Flare','DAC',130,('discard_self',1))],('Starveil','once',[('draw',1)])),  # Velunox
 4:(60,1,[A('Spark Nibble','I',20),A('Hot Rivet','IC',30,('status','burned',1))],None),                                # Cindermite
 5:(90,1,[A('Bellows Gust','IC',40),A('Forge Dive','IEC',80,('discard_self',1))],None),                                # Forgewing
 6:(160,2,[A('Molten Dust','IC',50,('status','burned',0)),A('Crucible Wing','IIEC',170,('discard_self',2))],('Slag Plating','passive',[('reduce',10)])),  # Crucimoth
 7:(60,1,[A('Bog Splash','D',10,('status','poisoned',0)),A('Mud Tumble','DC',30)],None),                               # Murklet
 8:(90,1,[A('Marsh Light','DC',30,('status','confused',0)),A("Will-o'-Bite",'DDC',70)],None),                          # Fenwisp
 9:(150,2,[A('Drowning Mist','DC',40,('status','poisoned',0),('no_retreat_def',)),A('Mire Grasp','DDC',90,('bonus_status',60))],None),  # Mireveil
 10:(60,1,[A('Tick Tock','I',10,('draw',1)),A('Rivet Bite','IC',30)],None),                                            # Rivetick
 11:(110,2,[A('Arc Weld','IC',50,('strip',1)),A('Overclock','IIC',100,('recoil',20))],None),                           # Boltrix
 12:(60,1,[A('Shadow Pounce','D',20),A('Night Swipe','DC',30,('coin_bonus',20))],None),                                # Gloamkit
 13:(110,1,[A('Dusk Dance','DC',40,('gust',)),A('Midnight Claw','DDC',90)],None),                                      # Noctelle
 14:(70,2,[A('Tin Chew','I',20),A('Scrap Bash','IC',30,('guard',10))],None),                                           # Tinibble
 15:(120,2,[A('Gear Grind','IC',40,('strip',1)),A('Jaw Crank','IIC',100)],None),                                       # Gearjaw
 16:(60,1,[A('Chill Splash','T',20),A('Frost Fin','TC',30,('status','paralyzed',1))],None),                            # Shiverfin
 17:(110,2,[A('Ice Current','TC',50,('self_switch',)),A('Glacier Rush','TTC',90)],None),                               # Glacurrent
 18:(70,1,[A('Spore Puff','V',10,('status','asleep',1)),A('Cap Bump','VC',30)],None),                                  # Bristlecap
 19:(120,2,[A('Thorn Wall','VC',40,('guard',20)),A("Warden's Lash",'VVC',90,('heal_self',20))],None),                  # Thornwarden
 20:(60,1,[A('Glow Yip','W',20),A('Lantern Leap','WC',30,('coin_bonus',20))],None),                                    # Flickerpup
 21:(120,1,[A('Lantern Sway','WC',40,('status','confused',0)),A('Bright Charge','WWC',90)],('Guiding Light','once',[('heal_one',20)])),  # Lanternox
 22:(70,2,[A('Ash Dig','E',20),A('Cinder Burrow','EC',30,('guard',10))],None),                                         # Ashmole
 23:(130,3,[A('Furnace Slam','EC',50,('status','burned',1)),A('Firebox Charge','EIC',110,('discard_self',1))],None),   # Furnaceback
 24:(60,1,[A('Star Peck','A',20),A('Glimmer Wing','AC',20,('draw',1))],None),                                          # Starlingo
 25:(110,1,[A('Orbit Dive','AC',50,('snipe',10)),A('Constellation','AAC',90)],None),                                   # Orbitern
 26:(50,1,[A('Wisp Touch','D',10,('status','confused',0)),A('Fade','DC',30,('self_switch',))],None),                   # Hollowisp
 27:(100,1,[A('Haunt','DC',40,('opp_discard_random',1)),A('Wraith Wail','DDC',80,('status','asleep',1))],None),        # Hollowraith
 28:(70,1,[A('Copper Hop','I',20),A('Pouch Kick','IC',40)],None),                                                      # Copperoo
 29:(120,2,[A('Bronze Bound','IC',50,('coin_bonus',30)),A('Tail Hammer','IIC',100,('recoil',10))],None),               # Bronzaroo
 30:(60,1,[A('Bun Bounce','W',20),A('Moonhop','WC',20,('draw',1))],None),                                              # Moonbun
 31:(110,1,[A('Crescent Kick','WC',50),A('Lunar Leap','WWC',70,('self_switch',))],None),                               # Moonhare
 32:(60,1,[A('Rust Bite','I',10,('strip',1)),A('Latch','IC',30,('no_retreat_def',))],None),                            # Rustleech
 33:(110,2,[A('Corrode','IC',30,('strip',0)),A('Oxide Crush','IIC',90)],None),                                         # Corrodeon
 34:(90,1,[A('Twilight Leaf','V',20,('heal_self',10)),A('Gloom Bloom','VDC',70,('status','poisoned',0))],None),     # Duskleaf (first draft: 100 HP and a healing ability; too strong in the two-set field)
 # new prints of First Bond species (same species, stage and affinity; new attacks)
 51:(100,1,[A('Night Lustre','TC',40,('status','asleep',1)),A('Opal Surge','TAC',80)],None),                           # Opalotl
 52:(160,2,[A('Dusk Aurora','TC',40,('snipe',20)),A('Starlit Curtain','TTAC',150)],None),                              # Aurorotl
 53:(110,2,[A('Iron Mace','SC',50,('strip',1)),A('Spike Roll','SSC',80,('recoil',10))],None),                          # Maceback
 54:(180,3,[A('Rampart Quake','SSC',90,('spread',10)),A('Siege Stomp','SSSC',160)],None),                              # Fortisaur
 55:(100,1,[A('Night Current','TC',30,('self_switch',)),A('Rune Splash','TAC',90)],None),                              # Runakoi
 56:(170,2,[A('Starwake','TC',50,('heal_self',20)),A('Moonlit Torrent','TTAC',160,('discard_self',1))],None),     # Koirune (first draft had 60/170 and a damage-reduction ability: 34% of the field)
 57:(120,2,[A('Lance Guard','SC',40,('guard',20)),A('Paladin Charge','SIC',80)],None),                                 # Shelladin
 58:(180,3,[A('Iron Bastion','SC',50,('guard',30)),A('Aegis Crash','SSIC',150)],('Dusk Plating','passive',[('tool_reduce',20)])),  # Aegisopod
 59:(110,2,[A('Root Snare','VC',40,('no_retreat_def',)),A('Bough Swing','VVC',80)],None),                              # Pangrove
 60:(170,3,[A('Canopy Shelter','VC',30,('heal_team',10)),A('Grove Titan','VVVC',160)],None),                           # Canopang
 61:(120,1,[A('Comet Pounce','AC',40,('coin_bonus',30)),A('Night Hunter','AAC',100)],None),                            # Astrynx
 62:(100,1,[A('Hush','DC',30,('status','asleep',0)),A('Muffled Strike','DDC',80,('bonus_status',20))],None),           # Hushwing
 63:(160,2,[A('Veil Dance','DC',40,('status','confused',0)),A('Nightfall Rend','DDC',110,('bonus_status',30))],None),  # Veilmora (first draft had 170 HP, 120+40 and a Bench shield: 35% of the field)
 64:(110,2,[A('Tusk Spark','IC',40,('status','paralyzed',1)),A('Forge Charge','IIC',90,('recoil',10))],None),          # Boltusk
 65:(180,3,[A('Iron Tide','IC',50,('strip',1)),A('Ferrous Quake','IIIC',180,('cant_attack_next',))],None),             # Ferradon
 66:(110,2,[A('Cairn Guard','SC',40,('guard',20)),A('Rubble Ram','SSC',90,('recoil',10))],None),                       # Cairnram
 67:(190,4,[A('Monolith Slam','SSC',100),A('Gravestone','SSSC',160,('heal_self',30))],None),                           # Monolox
 68:(100,1,[A('Midnight Trick','WC',30,('gust',)),A('Hare Hex','WWC',60,('status','confused',0))],None),               # Whimhare
 69:(150,2,[A('Bedtime Story','WC',40,('status','asleep',0)),A("Legend's End",'WWC',0,('multi_coin',4,40))],('Moral of the Story','once',[('draw',1)])),  # Fablehorn
 70:(120,2,[A('Thicket Charge','VC',50),A('Night Bramble','VVC',70,('status','poisoned',0))],None),                    # Bramblebuck
 71:(110,1,[A('Lantern Reef','TC',30,('heal_team',10)),A('Bioluminous Jet','TTC',90)],None),                           # Corallume
 72:(120,2,[A('Tunnel Ambush','IC',40,('gust',)),A('Spiral Drill','IIC',90,('strip',1))],None),                        # Drillbadger
 73:(100,1,[A('Night Bloom','VC',30,('heal_self',30)),A('Dew Burst','TVC',80)],None),                                  # Bloomble
 74:(150,1,[A('Night Squall','LC',40,('spread',10)),A('Eye of the Storm','LLC',120,('discard_self',1))],None),         # Nimbusail
}
# ---------------------------------------------------------------- allies, gear and tactics with new gameplay: (ops, role, sub)
TRAINERS={
 78:([('look_take',6,3)],'draw',None),                              # Professor Maren Vale — Night Survey
 79:([('heal_active',40),('switch',)],'switch',None),               # Warden Sorrel Pike — Iron Patrol
 80:([('heal_all',20),('cure_all',)],'heal',None),                  # Toma Reed — Dusk Shelter
 81:([('heal_one',50),('draw',1)],'heal',None),                     # Lita Moss — Field Medic
 82:([('draw',2),('search','essence')],'draw',None),                # Pip Rowan — After Hours
 83:([('recover',2),('draw',1)],'recover',None),                    # Archivist Sera Wynn — Lost Ledger
 84:([('boost',20),('draw',2)],'boost',None),                       # Renn Calder — Rival Challenge
 85:([('search','evolution'),('search','essence')],'search',None),  # Mira Quill — Midnight Market
 86:([('gust',),('strip_active',)],'gust',None),                    # Sel Veyra — Directive Zero
 87:([('essence_from_discard',1),('switch',)],'accel',None),        # Dr. Cyl Vane — Prototype Lab
 88:([('strip_any',),('no_retreat_def',)],'disrupt',None),          # Marshal Rook — Containment Order
 89:([('search','creature'),('draw',1)],'search',None),             # Cass Rell — Smuggler Route
 90:([('recover_ess',3),('draw',2)],'recover',None),                # Dex Harrow — Salvage Crew
 91:([('look_take',3,1),('draw',2)],'draw',None),                   # Brin Hollow — Lantern Watch
 92:([('search','biome_or_essence'),('draw',2)],'draw',None),       # Edda Voss — Iron Cartographer (first draft drew 3: in almost every top deck)
 97:([('switch',)],'switch','item'),                                # Dusk Beacon
 98:([('tool_hp',20),('tool_reduce',10)],'tool','tool'),            # Ironroot Anchor
 99:([('opp_discard_random',1)],'disrupt','item'),                  # Signal Scrambler
 100:([('no_retreat_def',),('vuln',20)],'disrupt','item'),          # Moonthread Net
 101:([('essence_from_discard',1),('discard_hand',1)],'accel','item'),  # Portable Forge
 102:([('look_take',5,1)],'draw','item'),                           # Hollow Lens
 103:([('bench_basic',1)],'search','item'),                         # Keeper Flare
 104:([('tool_status_immune',),('tool_reduce',10)],'tool','tool'),  # Rustproof Kit
 105:([('tool_dmg',20)],'tool','tool'),                             # Shadow Lantern
 106:([('recover',1),('recover_ess',1)],'recover','item'),          # Echo Compass
 107:([('tool_free_retreat',),('tool_hp',10)],'tool','tool'),       # Aether Coil
 108:([('recover_ess',2)],'recover','item'),                        # Scrap Magnet
 109:([('heal_one',40)],'heal','item'),                             # Sanctuary Map
 110:([('strip_any',),('discard_hand',1)],'disrupt','item'),        # Veyra Relay
 124:([('switch',),('cure',)],'switch',None),                       # Into the Fog
 125:([('boost',30)],'boost',None),                                 # Power Surge
 126:([('recover_ess',2),('draw',1)],'recover',None),               # Salvage Run
 127:([('coin_gust',),('draw',1)],'gust',None),                     # False Signal
 128:([('cost_discard_essence',),('gust',),('vuln',10)],'gust',None),  # Moonlit Ambush
 129:([('search','basic'),('search','essence')],'search',None),     # Keeper Convoy
 130:([('opp_shuffle_draw',3)],'disrupt',None),                     # System Lockdown
 131:([('heal_all',30),('cure_all',)],'heal',None),                 # After the Siren
}
# ---------------------------------------------------------------- biomes: (affinity, effect, amount)
# First Bond gave each affinity one biome effect. Duskfall's nine places reuse those nine effects for other affinities,
# so Dusk and Iron decks (the set's focus) get a home field, and every affinity still has at most one biome per effect.
BIOMES={111:('Dusk','free_retreat',0),     # Gloamfen Crossing: fog over the shallows, easy to slip away
 112:('Iron','dmg',10),                    # Old Ironworks
 113:('Wonder','heal',10),                 # Lantern Hollow
 114:('Astral','hp',20),                   # Moonfall Terrace
 115:('Iron','draw',0),                    # Rusted Observatory
 116:('Dusk','reduce',10),                 # Blackglass Marsh
 117:('Ember','extra_attach',0),           # Furnace Tunnels
 118:('Iron','rush',0),                    # Silent Switchyard
 119:('Astral','heal',10)}                 # Starlit Refuge
def biome_text(aff, eff, n):
    return {'heal':'Between turns, heal %d damage from each %s creature in play.'%(n,aff),'free_retreat':'%s creatures in play have no Retreat Cost.'%aff,
     'reduce':'%s creatures take %d less damage from attacks.'%(aff,n),'hp':'%s creatures get +%d HP.'%(aff,n),
     'dmg':'Attacks from %s creatures do %d more damage to the opponent\'s Active creature.'%(aff,n),
     'extra_attach':'Once during each player\'s turn, that player may attach a%s %s Essence from their hand to 1 of their %s creatures, in addition to the normal attachment.'%('n' if aff[0] in 'AEIOU' else '',aff,aff),
     'draw':'Once during each player\'s turn, if that player has a%s %s creature in play, they may draw a card.'%('n' if aff[0] in 'AEIOU' else '',aff),
     'poison':'Poisoned creatures take %d more damage between turns.'%n,
     'rush':'%s creatures can evolve on the turn they come into play (not on a player\'s first turn).'%aff}[eff]
# ---------------------------------------------------------------- rarities (decided): First Bond's rule by stage, applied to Duskfall
TRAINER_RARE={86,92,85,130}   # Sel Veyra — Directive Zero, Edda Voss, Mira Quill — Midnight Market (premium subjects), System Lockdown
# ---------------------------------------------------------------- collector demand (decided starting weights, 0..1)
FANDOM={3:0.92,1:0.6,2:0.5, 6:0.7,4:0.5,5:0.45, 9:0.6,7:0.55,8:0.4, 12:0.6,13:0.6, 30:0.65,31:0.5, 34:0.55, 26:0.5,27:0.45,
        10:0.45,11:0.45, 14:0.4,15:0.5, 19:0.45,18:0.35, 21:0.5,20:0.45, 23:0.45,22:0.35, 25:0.45,24:0.35}   # Velunox is the set's chase
FANDOM_DEFAULT=0.3
CHAR_FANDOM={86:0.78, 92:0.7, 85:0.5, 78:0.6, 75:0.8}   # Sel Veyra (SIR), Edda Voss (SIR), Mira Quill (FA), Maren Vale, June Kestrel (FA)
ALLY_BACKDROP={78:'scene.dsk-115-rusted-observatory',79:'scene.dsk-112-old-ironworks',80:'scene.dsk-119-starlit-refuge',81:'scene.dsk-113-lantern-hollow',
 82:'scene.dsk-114-moonfall-terrace',83:'scene.dsk-115-rusted-observatory',84:'scene.dsk-118-silent-switchyard',85:'scene.dsk-113-lantern-hollow',
 86:'scene.dsk-116-blackglass-marsh',87:'scene.dsk-117-furnace-tunnels',88:'scene.dsk-118-silent-switchyard',89:'scene.dsk-111-gloamfen-crossing',
 90:'scene.dsk-112-old-ironworks',91:'scene.dsk-113-lantern-hollow',92:'scene.dsk-115-rusted-observatory'}   # presentation only, like First Bond's

STAGE={'Basic':1,'Stage 1':2,'Stage 2':3}
def build(fb, registry):
    am=json.load(open(os.path.join(HANDOFF,'art_manifest.json'),encoding='utf-8')); rows=am['cards']
    pieces,_,_,bykey=WAS.plan_set(HANDOFF,'dsk')
    fbc={c['name']:c for c in fb['cards'] if c['category']!='premium'}; fbsp={s['id']:s for s in fb['species']}; fbspn={s['name']:s for s in fb['species']}
    D=lambda st,note: {'status':st,'note':note} if note else {'status':st}
    # new species and families from the checklist
    fams={}; species=[]
    for r in rows:
        if r['print_class']=='new_species': fams.setdefault(r['family'],[]).append(r)
    spid={}
    for fname,mem in fams.items():
        fid='FAM-1%02d'%int(fname.split()[-1])
        for i,r in enumerate(mem): spid[r['name']]='SP-1%02d'%int(r['number'])
        for i,r in enumerate(mem):
            no=int(r['number']); a=r['affinity'].split('/'); prev=mem[i-1]['name'] if i else None; nxt=mem[i+1]['name'] if i+1<len(mem) else None
            species.append({'id':spid[r['name']],'name':r['name'],'slug':WAS.slug(r['name']),'card':r['card_id'],'family':fid,'family_status':'roster','stage':i+1,'stages_in_family':len(mem),
              'stage_label':r['stage'],'evolves_from':spid[prev] if prev else None,'evolves_to':spid[nxt] if nxt else None,
              'affinity':{'primary':a[0],'secondary':a[1] if len(a)>1 else None,'status':'roster','note':''},'mascot':False,
              'fandom':{'value':FANDOM.get(no,FANDOM_DEFAULT),'status':'decided','note':'starting collector demand; prices still move with supply, demand and play'}})
    sp={s['id']:s for s in species}; families=[{'id':'FAM-1%02d'%int(f.split()[-1]),'members':[spid[r['name']] for r in m],'kind':'line' if len(m)>1 else 'standalone','status':'roster'} for f,m in fams.items()]
    cards=[]; byname={}
    for r in rows:
        no=int(r['number']); cat=r['category']; pc=r['print_class']; nm=r['name']
        c={'id':r['card_id'],'number':no,'category':cat,'roster_name':nm,'name':nm,'print_class':pc,'art':WAS.card_art(r,pieces,bykey,'dsk')}
        c['art'].pop('poses',None)
        if pc in ('exact_reprint','evergreen'):
            src=fbc[r['source_set_card'].split(': ',1)[1]]
            c['reprint_of']=src['id']; c['identity_note']='Reprint of %s: the same card in play (same rules, counts as the same card for the 4-copy rule).'%src['id']
            for k in ('species','gameplay','fandom','character','biome_affinity','essence_affinity'):
                if k in src: c[k]=json.loads(json.dumps(src[k]))
            c['rarity']={'value':src['rarity']['value'],'status':'reprint','note':'same rarity as in First Bond'}
            c['name']=src['name']
        elif cat=='creature':
            if pc=='new_species': s=sp[spid[nm]]; c['species']=s['id']
            else: s=fbspn[nm]; c['species']=s['id']; c['species_note']='First Bond species: same stage, evolution and affinity; new attacks'
            stage=s['stage_label']; n=s['stages_in_family']
            rar='rare' if (stage=='Stage 2' or n==1) else 'uncommon' if stage=='Stage 1' else 'common'
            c['rarity']={'value':rar,'status':'decided','note':'First Bond rule by stage: Basic common, Stage 1 uncommon, Stage 2 and standalone rare'}
            c['gameplay']=WD.creature_gameplay_from(CREATURES[no],s['affinity']['primary'])
        elif cat in ('ally','gear','tactic'):
            ops,role,sub=TRAINERS[no]; c['gameplay']=WD.trainer_gameplay_from(cat,ops,role,sub)
            base=nm.split(' — ')[0]
            rar='rare' if no in TRAINER_RARE else ('common' if cat=='gear' and sub=='item' else 'uncommon')
            c['rarity']={'value':rar,'status':'decided'}
            if cat=='ally':
                fbch=fbc.get(base); c['character']={'id':fbch['character']['id'] if fbch else 'CH-2%02d'%no,'identity':{'status':'established' if fbch else 'roster','text':('Same character as First Bond %s; new card.'%fbch['id']) if fbch else 'New character in Duskfall; the approved Duskfall portrait is the reference.'}}
                fv=CHAR_FANDOM.get(no, fbch['fandom']['value'] if fbch and fbch.get('fandom') else WD.CHAR_DEFAULT)
                c['fandom']={'value':fv,'status':'decided','note':'starting collector demand for the character'}
            else: c['fandom']={'value':WD.TRAINER_DEFAULT,'status':'decided'}
        elif cat=='biome':
            aff,eff,n=BIOMES[no]; c['biome_affinity']={'value':aff,'status':'decided','note':'the affinity its effect helps'}
            c['gameplay']={'status':'designed','rules':'Biome. Stays in play for both players. '+biome_text(aff,eff,n),'ops':[['biome',aff,eff,n]],'role':'biome','subtype':None}
            c['rarity']={'value':'uncommon','status':'decided'}; c['fandom']={'value':WD.TRAINER_DEFAULT,'status':'decided'}
        elif cat=='premium':
            base=r['source_set_card'].split(': ',1)[1]; b=byname[base]
            c['premium_kind']=r['print_class'].upper(); c['rarity']={'value':r['print_class'],'status':'roster'}; c['identity_of']=b['id']; c['name']=b['name']
            c['identity_note']='Plays as the same card as %s (premium prints play as their base card).'%b['id']
        if cat=='ally' and no in ALLY_BACKDROP: c['art']['backdrop']=ALLY_BACKDROP[no]
        cards.append(c)
        if cat!='premium': byname[nm]=c
    return species, families, cards

def validate(m, fb, registry):
    errs=[]; R=registry['assets']; ids=set(); sp={s['id']:s for s in fb['species']+m['species']}; fbid={c['id']:c for c in fb['cards']}
    if len(m['cards'])!=180: errs.append('expected 180 cards, got %d'%len(m['cards']))
    for i,c in enumerate(m['cards']):
        if c['number']!=i+1: errs.append('numbering breaks at %s'%c['id'])
        if c['id'] in ids: errs.append('duplicate id '+c['id'])
        ids.add(c['id'])
        if 'reprint_of' in c and c['reprint_of'] not in fbid: errs.append(c['id']+' reprints a missing card')
        if c['category']=='creature' and c['species'] not in sp: errs.append(c['id']+' has no species')
        if c['category']=='premium' and not any(x['id']==c['identity_of'] for x in m['cards'][:140]): errs.append(c['id']+' has no base card')
        if c['category']!='premium' and 'gameplay' not in c: errs.append(c['id']+' has no gameplay')
        a=c['art']
        for k in ('subject','background','illustration','backdrop'):
            if a.get(k) and a[k] not in R: errs.append('%s art %s=%s is not approved'%(c['id'],k,a[k]))
        if c['category'] not in ('essence',) and a['layout']=='vector-essence': errs.append(c['id']+' drawn as Essence')
    for c in m['cards']:
        g=c.get('gameplay') or {}
        for t in g.get('attacks',[]):
            for o in t['ops']: WD.op_text(o)   # every op has text (raises if unknown)
    return errs

def rules_md(m, fb):
    sp={s['id']:s for s in fb['species']+m['species']}; cost=lambda c: ' '.join('{%s}'%('any' if x=='C' else WD.COST[x]) for x in c)
    L=['# Wildkin: Duskfall card reference','','Generated from `wildkin-production/manifest-dsk.json` by `tools/wildkin_dsk.py` (do not edit). The roster is the owner\'s checklist; card rules for new cards were designed by Claude Code on 2026-10-17 and rarities decided then (not canon). Reprints play exactly as their First Bond card. Rules of play: `wildkin-production/RULES.md`.','',
       'Release: %s (%s).'%(m['set']['release_date']['value'],m['set']['release_date']['status']),'']
    sec=None
    for c in m['cards']:
        cat=c['category']
        if cat!=sec: sec=cat; L+=['','## '+{'creature':'Creatures','ally':'Allies','gear':'Gear','biome':'Biomes','tactic':'Tactics','essence':'Essence','premium':'Premium prints'}[cat],'']
        rp=' — reprint of %s'%c['reprint_of'] if c.get('reprint_of') else ''
        if cat=='creature':
            s=sp[c['species']]; g=c['gameplay']; a=s['affinity']
            L.append('**%03d %s** (%s, %s%s), %s%s. HP %d, weak to %s, retreat %d%s.'%(c['number'],c['name'],c['rarity']['value'],s['stage_label'],', evolves from '+sp[s['evolves_from']]['name'] if s['evolves_from'] else '',a['primary'],' / '+a['secondary'] if a['secondary'] else '',g['hp'],g['weakness'],g['retreat'],rp))
            if g.get('ability'): L.append('- Ability: **%s**. %s'%(g['ability']['name'],g['ability']['text']))
            for t in g['attacks']: L.append('- %s **%s** %s%s'%(cost(t['cost']),t['name'],t['damage_label'],('. '+t['text']) if t['text'] else ''))
            L.append('')
        elif cat=='premium': L.append('- %03d %s: plays as %s'%(c['number'],c['roster_name'],c['identity_of']))
        else: L.append('- **%03d %s** (%s%s): %s'%(c['number'],c['name'],c['rarity']['value'],rp,c['gameplay']['rules']))
    return '\n'.join(L)+'\n'

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); a=ap.parse_args()
    fb=json.load(open(os.path.join(WP,'manifest.json'),encoding='utf-8')); registry=json.load(open(os.path.join(WP,'approved','registry.json'),encoding='utf-8'))
    species,families,cards=build(fb,registry)
    m={'schema':'wildkin-manifest/1','manifest_version':VERSION,'generated_by':'tools/wildkin_dsk.py',
       'sources':{'checklist':'wildkin-production/sets/dsk/art_manifest.json','first_bond':'wildkin-production/manifest.json','handoff':'wildkin-production/sets/dsk/HANDOFF.md'},
       'status_legend':{'roster':'the owner checklist (the handoff calls it proposed; used as delivered)','reprint':'copied from the First Bond card it reprints','designed':'card rules designed by Claude Code on 2026-10-17','decided':'reasoned choice by Claude Code on 2026-10-17, not canon'},
       'set':{'id':'WK-S002','number':2,'name':'Duskfall','name_status':'roster','code':'DSK','code_status':'roster','total':180,'base':140,'premium':40,
              'release_date':{'value':RELEASE[0],'status':RELEASE[1],'note':RELEASE[2]},
              'pack':fb['set']['pack'],'rare_slot_odds':dict(fb['set']['rare_slot_odds'],note='same pull rates as First Bond (decided)'),'box':fb['set']['box'],'msrp':fb['set']['msrp']},
       'families':families,'species':species,'cards':cards}
    errs=validate(m,fb,registry)
    if errs: print('VALIDATION FAILED'); [print(' -',e) for e in errs]; sys.exit(1)
    outs={os.path.join(WP,'manifest-dsk.json'):json.dumps(m,indent=1,ensure_ascii=False)+'\n',os.path.join(HANDOFF,'RULES.md'):rules_md(m,fb)}
    if a.check:
        bad=[p for p,t in outs.items() if not os.path.exists(p) or open(p,encoding='utf-8').read()!=t]
        if bad: print('OUT OF DATE (run tools/wildkin_dsk.py):',*[os.path.relpath(p,ROOT) for p in bad]); sys.exit(1)
        print('Duskfall manifest OK: 180 cards, validation passed, files up to date'); return
    for p,t in outs.items(): open(p,'w',encoding='utf-8').write(t)
    from collections import Counter
    print('wrote Duskfall manifest: %d cards, %d new species'%(len(cards),len(species)))
    print('rarities:',dict(Counter(c['rarity']['value'] for c in cards)))
    print('kinds:',dict(Counter(c['print_class'] for c in cards)))
if __name__=='__main__': main()
