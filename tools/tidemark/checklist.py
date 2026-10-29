#!/usr/bin/env python3
"""Tidemark canonical card checklist and art production manifest.

  python3 tools/tidemark/checklist.py           write tidemark-production/
  python3 tools/tidemark/checklist.py --check   rebuild in memory, fail if the files differ or a rule is broken

Inputs: the card tables in checklist_land.py, checklist_sea.py and checklist_dual.py (every card written by hand),
the set timeline and art rules below. Foundations come from design/tcg2/brief.md and proposals.md: seven card types,
seven factions plus Neutral, Common/Uncommon/Rare/Legendary, a 220-card 10th-anniversary set (150 new, 70 reprints,
10 of them with new anniversary art) and about 500 representative historical cards over ten fictional years.

Status of everything here: the card identities, sets and art plan are PROPOSED (written by Claude Code on
2026-10-18 for the owner to approve). Gameplay identities are roles, not final costs or stats; the rules are the
prototype's (design/tcg2/prototype-rules.md, version 0.3), which are themselves provisional.
Outputs (tidemark-production/): manifest.json, art_queue.json, checklist.csv, CHECKLIST.md, SHEETS.md, ART_BIBLE.md,
outstanding_assets.md. Nothing here touches the game build."""
import os, sys, json, csv, io, re, hashlib, argparse
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from checklist_land import CROWNLANDS, THORNWILD, IRON_REACH
from checklist_sea import TIDEBORN, FREE_FLEETS, ABYSSAL_CHOIR
from checklist_dual import HARBOR_LEAGUES, NEUTRAL
from checklist_supp import SUPPLEMENTS, WAVE_DESIGNS
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT=os.path.join(ROOT,'tidemark-production')
VERSION='0.1.0'

FACTIONS=[('CR','Crownlands','Land',CROWNLANDS),('TW','Thornwild','Land',THORNWILD),('IR','Iron Reach','Land',IRON_REACH),
          ('TB','Tideborn','Sea',TIDEBORN),('FF','Free Fleets','Sea',FREE_FLEETS),('AC','Abyssal Choir','Sea',ABYSSAL_CHOIR),
          ('HL','Harbor Leagues','Dual',HARBOR_LEAGUES),('NE','Neutral','Neutral',NEUTRAL)]
FORDER=[f[0] for f in FACTIONS]
TYPES={'U':'Unit','S':'Spell','R':'Relic','V':'Vessel','H':'Stronghold','D':'Domain','E':'Enchantment'}
TORDER='USRVHDE'
RARITY={'C':'Common','U':'Uncommon','R':'Rare','L':'Legendary'}
ERAS={'F':('Founding','2016-2017'),'E':('Expansion','2018-2020'),'D':('The Deep','2021-2023'),'M':('Modern','2024-2025'),'N':('Tenth Anniversary','2026')}

# ---------------------------------------------------------------- the fictional history: three main sets a year, 2016-2025
# (code, name, year, season, era, set size, focus factions, focus types). Representative cards only are named;
# the rest of each set is unnamed bulk (proposals.md section 7). Supplemental products are not represented yet.
SETS=[
 ('FT','First Tide',2016,'spring','F',250,'CR TW IR TB FF AC HL NE',''),
 ('SB','Salt and Banner',2016,'summer','F',200,'CR FF',''),
 ('LH','Lanterns of the Harbor',2016,'autumn','F',200,'HL NE',''),
 ('IC','Iron Coast',2017,'spring','F',200,'IR FF',''),
 ('RW','Reefward',2017,'summer','F',200,'TB TW',''),
 ('CW','The Crownwar',2017,'autumn','F',200,'CR IR',''),
 ('OW','Open Water',2018,'spring','E',200,'FF TB','V'),
 ('BS','Bastions of Stone',2018,'summer','E',200,'CR IR','H'),
 ('TF','Thornfall',2018,'autumn','E',200,'TW NE',''),
 ('MT','Merchant Tides',2019,'spring','E',200,'HL FF',''),
 ('BC','Broken Chains',2019,'summer','E',200,'FF NE',''),
 ('DF','Deepforge',2019,'autumn','E',200,'IR AC','R'),
 ('SL','Siege of Lanthorn',2020,'spring','E',200,'CR HL','H'),
 ('GW','Gale and Wave',2020,'summer','E',200,'TB FF',''),
 ('HM','Harbor Moon',2020,'autumn','E',200,'HL TB AC',''),
 ('FD','Fathoms Deep',2021,'spring','D',200,'AC TB',''),
 ('DH','Drowned Hymns',2021,'summer','D',200,'AC','E'),
 ('SV','Sunken Vaults',2021,'autumn','D',200,'TB NE','R'),
 ('LR','Leviathan Rising',2022,'spring','D',200,'AC FF',''),
 ('CB','Coral Bastion',2022,'summer','D',200,'TB CR','H D'),
 ('WT','The Wild Tithe',2022,'autumn','D',200,'TW HL',''),
 ('BT','Black Tide',2023,'spring','D',200,'AC FF',''),
 ('ET','Echoes of the Trench',2023,'summer','D',200,'AC IR',''),
 ('ST','Stormglass',2023,'autumn','D',200,'NE HL CR','S'),
 ('NR','New Reaches',2024,'spring','M',200,'IR TW',''),
 ('FL','Free Lanes',2024,'summer','M',200,'FF HL','V'),
 ('KH','Keepers of the Light',2024,'autumn','M',200,'HL CR',''),
 ('CS','Crown and Shoal',2025,'spring','M',200,'CR TB',''),
 ('RT','Return of the Tide',2025,'summer','M',200,'TB AC TW',''),
 ('TL','Tidelines',2025,'autumn','M',200,'CR TW IR TB FF AC HL NE',''),
]
ANNIV=('TT','Tenth Tide',2026,'spring','N',220)

# ---------------------------------------------------------------- art direction
LOOK={
 'CR':'Crownlands: chalk cliffs, hedged coastal farmland, pale stone castles with blue slate roofs. Palette azure, bone white, slate grey, muted gold. Wool, padded cloth, mail and plain practical steel; heraldry of a blue tower on white',
 'TW':'Thornwild: old-growth coastal forest, moss, ferns, bracken, mist, stone circles. Palette moss green, bark brown, rust bracken, pale fog grey. Hide, bark, woven plant fibre, antler and bone; animals drawn as real animals',
 'IR':'Iron Reach: basalt mountains, quarries, mines, foundries and sea-facing batteries. Palette charcoal, iron grey, ochre dust, ember orange. Leather aprons, iron scale, soot and grime; constructs are riveted iron and stone, heavy and mechanical',
 'TB':'Tideborn: underwater cities of coral and pearl, kelp forests, lagoons and tidal flats. Palette teal, turquoise, pearl white, coral pink. Tideborn are sea-dwelling people with fin-like ears and subtle gill lines, in shell, kelp and woven fibre; light falls in shafts from the surface',
 'FF':'Free Fleets: working ships, busy quays, open sea, coves and harbour taverns. Palette weathered wood, canvas, sea blue, faded reds. Sailors in practical working clothes; traders and privateers, not cartoon pirates; ships drawn with believable rigging',
 'AC':'Abyssal Choir: the deep ocean, trenches, sunken ruins and lonely night shores. Palette ink black, deep blue-violet, bone grey, with sparing cold bioluminescence (the one faction where glow is normal). Drowned cultists in sodden robes; creatures are deep-sea animals made vast and strange, unsettling rather than gory',
 'HL':'Harbor Leagues: merchant ports, lighthouses, guild halls, canals and quays. Palette warm sandstone, brass, harbour blue, lamplight amber. Officials, clerks and dockworkers in tan and blue; busy, lived-in civic spaces',
 'NE':'Neutral: roads, inns, moors, weather and ruins that belong to no faction. Palette earthy neutrals with the sky and sea doing the colour work. Travellers, mercenaries and ordinary animals; weather drawn as real weather',
}
# faction colour and icon (tidemark-production/FRAME_GUIDE.md, from the owner's card frame guide, 2026-10-18)
ICON={'CR':('royal blue','a tower'),'TW':('forest green','a tree'),'IR':('rust red','a mountain'),'TB':('teal','waves'),'FF':('gold',"a ship's wheel"),
      'AC':('purple','a kraken'),'HL':('warm brown','scales'),'NE':('stone grey','a waystone')}
FRAMING={
 'figures':'One clear subject (or a small readable group) in a believable setting; full figure or three-quarter view in the middle of the frame, with room above the head and at both sides for cropping',
 'creatures':'The creature as the clear subject in its habitat with a readable silhouette and the whole body visible; for big creatures include a small scale cue (a boat, a person, a tree)',
 'scenes':'The moment the effect happens, readable at a glance: who or what acts and what changes. Keep it physical (water, weather, people, objects); no abstract magic swirls',
 'objects':'The object as the clear subject in a real setting (on a bench, a rack, a table or in use), not floating on a plain background; it fills about half the frame',
 'ships':'The ship in three-quarter view on the water with the waterline and full rig visible; sea and sky set the weather and the scale',
 'architecture':'The structure seen whole from a distance, with small figures, carts or boats for scale and its surroundings visible',
 'landscape':'A wide establishing view of the place with no central character; it should read as somewhere a battle could be fought',
}
REGISTER={
 'C':'Ordinary register: natural light, muted colour, worn and practical details; no glow, halo or magical light unless the card itself is magic',
 'U':'Ordinary register: natural light and grounded details; magic only where the card is magic, and then shown simply',
 'R':'Elevated register: a more considered composition and light, still grounded and believable',
 'L':'Legendary register: the most dramatic composition this game allows, but restrained: one strong light source, no excessive ornament, no glowing halos',
}
LIGHT={
 'CR':['overcast morning light','flat grey noon under high cloud','warm late-afternoon sun','light rain and wet stone','clear cold early light'],
 'TW':['soft green forest light','morning mist','dappled sun through leaves','grey drizzle under the canopy','golden low evening sun'],
 'IR':['cold mountain daylight','smoky orange forge light','grey snow light','dusty light through a high window','lantern light underground'],
 'TB':['sunbeams through shallow clear water','soft turquoise lagoon light','dim blue mid-water light','bright surface ripples overhead','green light filtered through kelp'],
 'FF':['bright windy daylight','grey squall light','golden evening at sea','lantern light below decks','hazy morning in harbour'],
 'AC':['near-total darkness with a single cold glow','grey dawn over black water','moonlight on a calm sea','storm light','dim violet depth light'],
 'HL':['warm harbour morning','lamplight at dusk','bright midday on the quay','harbour fog','clear evening light over water'],
 'NE':['plain daylight','grey windy sky','evening light on the road','rain and low cloud','clear crisp morning'],
}
TIMEWORDS=re.compile(r'\b(dawn|dusk|night|sunset|sunrise|twilight|morning|evening|rain|fog|mist|moon|storm|overcast|candle|lamp|torch|lantern|snow|sunlit|sunbeam|sunlight|darkness|dark|dim|glow)',re.I)
PEOPLE=('Human','Tideborn','Forest Folk','Reachfolk','Drowned','Siren')
CELL='landscape 4:3 cell; keep the subject inside the central 80% so it survives cropping to the card art window'

def slug(s): return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',s.lower().replace("'",''))).strip('-')
def h(s): return int(hashlib.sha256(s.encode()).hexdigest()[:8],16)
def vgroup(c):
    t=c['type']
    if t=='V': return 'ships'
    if t=='H': return 'architecture'
    if t=='D': return 'landscape'
    if t=='R': return 'objects'
    if t in 'SE': return 'scenes'
    return 'figures' if c['subtype'].startswith(PEOPLE) else 'creatures'
FAMILY={'figures':'people','scenes':'people','creatures':'creatures','ships':'places and things','architecture':'places and things','landscape':'places and things','objects':'places and things'}
SIDE={'CR':'Land','TW':'Land','IR':'Land','TB':'Sea','FF':'Sea','AC':'Sea','HL':'Coast','NE':'Coast'}

def direction(c):
    reg=REGISTER[c['rar']]
    if c['fac']=='AC': reg=reg.replace('no glow, halo or magical light unless the card itself is magic','no halo or magical light; the deep sea\'s natural cold bioluminescence is allowed, sparingly')
    parts=[LOOK[c['fac']], FRAMING[vgroup(c)], reg]
    if not TIMEWORDS.search(c['subject']): L=LIGHT[c['fac']]; parts.append('Light: '+L[h(c['title'])%len(L)])
    return '. '.join(parts)+'.'

# anniversary alternate art: a new illustration of the same card, a different moment from its original art
ALT={
 'Lanthorn Keep':'Lanthorn Keep seen from the sea on a stormy night, every window lit, a small ship turning safely past its rocks',
 'Prince Edrin Varr':'Prince Edrin Varr, ten years older and grey at the temples, leading the anniversary parade over the Azure Keep causeway',
 'Mother of Wolves':'The Mother of Wolves asleep in a snowy hollow under a great pine, her wolves curled around her, one keeping watch',
 'The Iron Steward':'The Iron Steward in an empty great hall at night, polishing the long table alone by the light of its lantern head',
 "Coral City of Ys'mar":"Ys'mar from far above at the hour of the festival of tides, the city strung with glowing shells, crowds swimming in its streets",
 'Tide-Priestess Saela':'Saela standing alone on the tidal flat as the tide returns, water rising around her ankles and the standing stones',
 'Sovereign of the Lanes':'Sovereign of the Lanes at anchor in a calm dawn harbour, crew asleep on deck, the figurehead catching the first sun',
 'Black Tide Leviathan':'The Black Tide Leviathan seen from beneath, a vast dark shape crossing the moonlit surface above a tiny diver',
 'Harbor Mistress Calla Wren':'Calla Wren on the harbour office balcony at the end of the day, boots off, tea in hand, ships settling below',
 'Storm Front':'The same storm front seen from inside a fishing village: shutters slamming, nets hauled in, people running for shelter',
}
APPROVED={'Sentinel of Azure Keep':'Approved Tidemark concept "Sentinel of Azure Keep" (owner). Inherits the Crownlands defensive-wall role of the prototype\'s Keep Warden, which stays a separate Founding-era card.',
          'Roothorn Stag':'Approved concept "Roothorn Stag" (owner). Inherits the big Swift beast role of the prototype\'s Elder Antler, which stays a separate Founding-era card.',
          'Choir-Depth Leviathan':'Approved concept "Choir-Depth Leviathan" (owner). Inherits the huge Surge leviathan role of the prototype\'s Ancient Leviathan, which stays a separate Founding-era reserve-list card.'}
PROTO_RENAMED={'Gull Cutter':'Swift Cutter','Saltwind Brigantine':'Brigantine','Galleon Resolute':'War Galleon'}
EFFECTS_BEYOND_PROTOTYPE=re.compile(r'([Tt]akes control|[Cc]opies|[Cc]opy|cost more|[Tt]axes|discards|skips|counts as Land and Sea|work twice|[Ss]teals|from the game|controls both)')

def load():
    cards=[]; titles=set(); errs=[]
    for code,name,al,rows in FACTIONS:
        for i,r in enumerate(rows):
            if len(r)!=8: errs.append('bad row %s %r'%(code,r[:1])); continue
            title,t,sub,rar,era,fl,ident,subj=r
            if title in titles: errs.append('duplicate title '+title)
            titles.add(title)
            if t not in TYPES or rar not in RARITY or era not in ERAS: errs.append('bad code in '+title)
            c=dict(title=title,type=t,subtype=sub,rar=rar,era=era,flags=fl,identity=ident,subject=subj,fac=code,faction=name,allegiance=al,order=i)
            if 'A' in fl: c['flags']+='R'
            if era=='N' and ('R' in c['flags'] or 'X' in fl): errs.append('a new card cannot be a reprint: '+title)
            if 'X' in fl and 'R' in c['flags']: errs.append('reserve-list card reprinted: '+title)
            if 'K' in fl and title not in APPROVED: errs.append('approved concept without a record: '+title)
            cards.append(c)
    return cards, errs

def assign_sets(cards):
    by={s[0]:dict(code=s[0],name=s[1],year=s[2],season=s[3],era=s[4],size=s[5],focus=s[6].split(),tfocus=s[7].split(),cards=[]) for s in SETS}
    for era in 'FEDM':
        sets=[by[s[0]] for s in SETS if s[4]==era]
        pool=[c for c in cards if c['era']==era]
        # interleave factions so the load spreads evenly
        q={f:[c for c in pool if c['fac']==f] for f in FORDER}; order=[]
        while any(q.values()):
            for f in FORDER:
                if q[f]: order.append(q[f].pop(0))
        for c in order:
            if 'P' in c['flags'] and era=='F': best=by['FT']   # the prototype's cards are the core set
            else:
                best=max(sets,key=lambda s:(3 if c['fac'] in s['focus'] else 0)+(2 if c['type'] in s['tfocus'] else 0)+(1 if s['code']=='FT' and c['rar']=='L' else 0)-0.5*len(s['cards'])+(h(c['title']+s['code'])%100)/1000)
            best['cards'].append(c); c['set']=best['code']
    for s in by.values():
        s['cards'].sort(key=lambda c:(FORDER.index(c['fac']),TORDER.index(c['type']),c['title']))
        n=len(s['cards'])
        for i,c in enumerate(s['cards']): c['no']=1+int((i+0.5)*s['size']/n)
    return by

def titles_all(cards): return {c['title'] for c in cards}

def build():
    cards,errs=load()
    if errs: return None,errs
    hist=[c for c in cards if c['era']!='N']; new=[c for c in cards if c['era']=='N']
    sets=assign_sets(cards)
    # identities: historical by set order, then the anniversary's new cards
    ids=sorted(hist,key=lambda c:([s[0] for s in SETS].index(c['set']),c['no']))
    for i,c in enumerate(ids+sorted(new,key=lambda c:(FORDER.index(c['fac']),TORDER.index(c['type']),c['title']))): c['cid']='TMC-%04d'%(i+1)
    # anniversary set: new cards plus reprints, numbered by faction, type and title
    rep=[c for c in hist if 'R' in c['flags']]
    tt=sorted(new+rep,key=lambda c:(FORDER.index(c['fac']),TORDER.index(c['type']),c['title']))
    printings=[]; ills=[]
    byill={}
    def ill(c, alt=False):
        iid=('TMI-A%02d'%(len([x for x in ills if x['alt']])+1)) if alt else 'TMI-%04d'%(len([x for x in ills if not x['alt']])+1)
        rec=dict(id=iid,alt=alt,card=c['cid'],title=c['title'],faction=c['faction'],fac=c['fac'],type=TYPES[c['type']],rar=c['rar'],group=vgroup(c),
                 subject=ALT[c['title']] if alt else c['subject'],
                 direction=(direction(c)+' Anniversary alternate art: a new illustration of the same card, a different moment and composition from its original art, in the same painterly style; ordinary card size and window, no special frame.') if alt else direction(c),
                 file='tidemark-production/art/%s-%s.png'%(iid,slug(c['title'])+('-anniversary' if alt else '')),
                 status='approved-concept-file-missing' if 'K' in c['flags'] and not alt else 'not-started',
                 pool='alternate' if alt else ('anniversary' if c['era']=='N' else 'historical'),era=c['era'],set=c.get('set','TT'))
        if 'K' in c['flags'] and not alt: rec['approved_note']=APPROVED[c['title']]
        ills.append(rec); return rec
    for c in ids:
        r=ill(c); byill[c['cid']]=r
        printings.append(dict(id='TM-%s-%03d'%(c['set'],c['no']),card=c,set=c['set'],no=c['no'],kind='original',ill=r['id'],reuse=False,alt=False))
    for c in [x for x in tt if x['era']=='N']:
        r=ill(c); byill[c['cid']]=r
    for n,c in enumerate(tt,1):
        if c['era']=='N': printings.append(dict(id='TM-TT-%03d'%n,card=c,set='TT',no=n,kind='new',ill=byill[c['cid']]['id'],reuse=False,alt=False))
        else: printings.append(dict(id='TM-TT-%03d'%n,card=c,set='TT',no=n,kind='reprint',ill=byill[c['cid']]['id'],reuse=True,alt=False,orig='TM-%s-%03d'%(c['set'],c['no'])))
    altc=sorted([c for c in rep if 'A' in c['flags']],key=lambda c:(FORDER.index(c['fac']),TORDER.index(c['type']),c['title']))
    for k,c in enumerate(altc):
        r=ill(c,alt=True); printings.append(dict(id='TM-TT-%03d'%(221+k),card=c,set='TT',no=221+k,kind='anniversary-alternate-art',ill=r['id'],reuse=False,alt=True,orig='TM-%s-%03d'%(c['set'],c['no'])))
    # supplements (checklist_supp.py): extra cards in an existing set, numbered into free gaps; ids and sheets come after every older one
    nxt=len(cards)+1
    for scode,sfac,sblocks in SUPPLEMENTS:
        sdef=dict((x[0],x) for x in SETS)[scode]; size=sdef[5]
        rng={}
        for c in sets[scode]['cards']: lo,hi=rng.get(c['fac'],(999,0)); rng[c['fac']]=(min(lo,c['no']),max(hi,c['no']))
        for fac,rows in sfac:
            if sblocks: lo,hi=sblocks[fac]
            else:   # the faction's block of the printed checklist: from the middle of the gap before it to the middle of the gap after it
                if fac not in rng or len(rng)<2: lo,hi=1,size   # a set with one faction (or a new one) takes any free number
                else:
                    prev=[rng[f] for f in FORDER[:FORDER.index(fac)] if f in rng]; nxtf=[rng[f] for f in FORDER[FORDER.index(fac)+1:] if f in rng]
                    lo=(prev[-1][1]+rng[fac][0])//2+1 if prev else 1; hi=(rng[fac][1]+nxtf[0][0])//2 if nxtf else size
            used={c['no'] for c in sets[scode]['cards']}; free=[n for n in range(lo,hi+1) if n not in used]
            add=[]
            for r in rows:
                title,t,sub,rar,fl,ident,subj=r
                if title in titles_all(cards) or title in titles_all(add): return None,['duplicate title '+title]
                add.append(dict(title=title,type=t,subtype=sub,rar=rar,era=sdef[4],flags=fl,identity=ident,subject=subj,fac=fac,faction=dict((f[0],f[1]) for f in FACTIONS)[fac],
                                allegiance=dict((f[0],f[2]) for f in FACTIONS)[fac],order=0,set=scode))
            add.sort(key=lambda c:(TORDER.index(c['type']),c['title']))
            if len(free)<len(add): free=[n for n in range(1,size+1) if n not in used]   # the faction's block is too small: any free number
            if len(free)<len(add): return None,['not enough free numbers for %s in %s'%(fac,scode)]
            picks=[free[int((i+0.5)*len(free)/len(add))] for i in range(len(add))]
            for c,no in zip(add,picks):
                c['no']=no; c['cid']='TMC-%04d'%nxt; nxt+=1
                r=ill(c); r['pool']='supplement'; byill[c['cid']]=r
                cards.append(c); hist.append(c); sets[scode]['cards'].append(c)
                printings.append(dict(id='TM-%s-%03d'%(scode,no),card=c,set=scode,no=no,kind='original',ill=r['id'],reuse=False,alt=False))
        sets[scode]['cards'].sort(key=lambda c:c['no'])
    return dict(cards=cards,hist=hist,new=new,rep=rep,tt=tt,altc=altc,sets=sets,printings=printings,ills=ills),[]

# ---------------------------------------------------------------- 3x3 sheets
def sheets(D):
    out=[]; n=[0]
    def emit(pool, cells, theme):
        n[0]+=1; sid='TM-S%03d'%n[0]
        rec=dict(id=sid,pool=pool,theme=theme,file='tidemark-production/sheets/%s.png'%sid,cells=[],unused=[])
        for i in range(9):
            if i<len(cells):
                x=cells[i]; x['sheet']=sid; x['cell']=i+1
                rec['cells'].append(dict(cell=i+1,illustration=x['id'],card=x['card'],title=x['title'],faction=x['faction'],type=x['type'],subject=x['subject'],direction=x['direction'],file=x['file']))
            else: rec['unused'].append(i+1)
        out.append(rec)
    def era_key(x): return ('FEDMN'.index(x['era']),[s[0] for s in SETS].index(x['set']) if x['set']!='TT' else 99,x['title'])
    # supplements get their own sheets, one set after another, so adding a wave never changes the sheets of an earlier one
    for pool,only in [('anniversary',None),('alternate',None),('historical',None)]+[('supplement',sc[0]) for sc in SUPPLEMENTS]:
        todo=[x for x in D['ills'] if x['pool']==pool and x['status']=='not-started' and (only is None or x['set']==only)]
        if pool=='alternate':
            fam={}; [fam.setdefault('people' if FAMILY[x['group']]=='people' else 'creatures, places and things',[]).append(x) for x in todo]
            for k,v in fam.items(): emit(pool,v,'Anniversary alternate art: '+k)
            continue
        left={}
        groups={}
        for x in todo: groups.setdefault((x['fac'],FAMILY[x['group']]),[]).append(x)
        for (fac,fam) in sorted(groups,key=lambda k:(FORDER.index(k[0]),k[1])):
            v=sorted(groups[(fac,fam)],key=lambda x:(x['group'],era_key(x)))
            name=dict((f[0],f[1]) for f in FACTIONS)[fac]
            while len(v)>=9: emit(pool,v[:9],'%s: %s'%(name,fam)); v=v[9:]
            left.setdefault((SIDE[fac],fam),[]).extend(v)
        rest={}
        for (side,fam) in sorted(left):
            v=sorted(left[(side,fam)],key=lambda x:(FORDER.index(x['fac']),x['group'],era_key(x)))
            label={'Land':'Land factions','Sea':'Sea factions','Coast':'Harbor Leagues and Neutral'}[side]
            while len(v)>=9: emit(pool,v[:9],'%s: %s'%(label,fam)); v=v[9:]
            rest.setdefault(fam,[]).extend(v)
        if pool=='supplement' and rest:   # a wave is small: mix the leftovers of every kind so no sheet is nearly empty
            v=[x for fam in sorted(rest) for x in rest[fam]]
            while v: emit(pool,v[:9],'Mixed factions and subjects'); v=v[9:]
        else:
         for fam in sorted(rest):   # last: the same kind of subject from any faction, then a partial sheet
            v=rest[fam]
            while v: emit(pool,v[:9],'Mixed factions: %s'%fam); v=v[9:]
    return out

# ---------------------------------------------------------------- outputs
def counts(D):
    from collections import Counter, defaultdict
    tt=D['tt']; C={}
    C['anniversary_total']=len(tt); C['anniversary_new']=len(D['new']); C['anniversary_reprints']=len(D['rep']); C['anniversary_alternate_art']=len(D['altc'])
    C['historical_cards']=len(D['hist']); C['historical_sets']=len(SETS)
    def tab(cs):
        t=defaultdict(Counter)
        for c in cs: t[c['faction']][TYPES[c['type']]]+=1; t[c['faction']]['_'+RARITY[c['rar']]]+=1
        return {f:dict(v) for f,v in t.items()}
    C['anniversary_by_faction']=tab(tt); C['historical_by_faction']=tab(D['hist'])
    C['anniversary_by_type']=dict(Counter(TYPES[c['type']] for c in tt)); C['anniversary_by_rarity']=dict(Counter(RARITY[c['rar']] for c in tt))
    C['historical_by_type']=dict(Counter(TYPES[c['type']] for c in D['hist'])); C['historical_by_rarity']=dict(Counter(RARITY[c['rar']] for c in D['hist']))
    C['historical_by_era']=dict(Counter(ERAS[c['era']][0] for c in D['hist']))
    il=D['ills']; C['illustrations']={'unique_original':len([x for x in il if not x['alt']]),'new_for_anniversary':len([x for x in il if x['pool']=='anniversary']),
        'historical':len([x for x in il if x['pool']=='historical']),'supplement':len([x for x in il if x['pool']=='supplement']),'alternate_art':len([x for x in il if x['alt']]),
        'reused_by_reprints':len(D['rep']),'approved_concepts_awaiting_file':len([x for x in il if x['status']=='approved-concept-file-missing']),
        'to_generate':len([x for x in il if x['status']=='not-started']),
        'delivered_awaiting_owner_review':len([x for x in il if x['status']=='delivered-awaiting-owner-review']),'approved_by_owner':len([x for x in il if x['status']=='approved'])}
    return C

def row(p):
    c=p['card']; s=p['set']
    era=ERAS[c['era']][0]; oset='%s (%s)'%(c['set'],dict((x[0],x[1]) for x in SETS)[c['set']]) if c['era']!='N' else 'TT (Tenth Tide)'
    return {'printing_id':p['id'],'card_id':c['cid'],'set':s,'collector_number':p['no'],'title':c['title'],'card_type':TYPES[c['type']],'subtype':c['subtype'],
            'faction':c['faction'],'allegiance':c['allegiance'],'rarity':RARITY[c['rar']],'era':era,'original_set':oset,
            'printing_kind':p['kind'],'original_printing':p.get('orig',''),'illustration_id':p['ill'],'illustration':'reuse original' if p['reuse'] else ('anniversary alternate art' if p['alt'] else 'new'),
            'alternate_art':'yes' if p['alt'] else ('has anniversary alternate' if ('A' in c['flags'] and s=='TT') else 'no'),
            'gameplay_identity':c['identity'],'subject':ALT[c['title']] if p['alt'] else c['subject'],'reserve_list':'yes' if 'X' in c['flags'] else 'no',
            'prototype_source':(PROTO_RENAMED.get(c['title'],c['title']) if 'P' in c['flags'] else '')}

def render(D, S):
    C=counts(D); il=D['ills']; ilby={x['id']:x for x in il}
    pr=D['printings']
    rows=[row(p) for p in pr]
    for r in rows:
        x=ilby[r['illustration_id']]; r['art_direction']=x['direction']; r['illustration_file']=x['file']
        r['art_status']='reuse (%s, %s)'%(x['id'],x['status']) if r['illustration']=='reuse original' else x['status']
        r['sheet']=('%s cell %d'%(x['sheet'],x['cell'])) if x.get('sheet') else ('approved concept, not queued' if x['status'].startswith('approved') else '')
    cols=list(rows[0].keys())
    buf=io.StringIO(); w=csv.DictWriter(buf,fieldnames=cols,lineterminator='\n'); w.writeheader(); [w.writerow(r) for r in rows]
    status={'identities':'proposed','gameplay':'role only; no costs or stats (rules 0.3 are provisional)','sets':'proposed','art_plan':'proposed','by':'Claude Code, 2026-10-18, for owner approval'}
    m={'schema':'tidemark-manifest/1','version':VERSION,'generated_by':'tools/tidemark/checklist.py','status':status,
       'sources':['design/tcg2/brief.md','design/tcg2/proposals.md','design/tcg2/prototype-rules.md','design/tcg2/round3-report.md','tools/tidemark/cards.js'],
       'card_types':[TYPES[t] for t in TORDER],'factions':[{'code':f[0],'name':f[1],'allegiance':f[2],'colour':ICON[f[0]][0],'icon':ICON[f[0]][1],'look':LOOK[f[0]]} for f in FACTIONS],
       'frame':'tidemark-production/FRAME_GUIDE.md (visual reference: tidemark-production/reference/card-frame-guide-v1.png)',
       'rarities':list(RARITY.values()),'eras':[{'code':k,'name':v[0],'years':v[1]} for k,v in ERAS.items()],
       'sets':[{'code':s[0],'name':s[1],'year':s[2],'season':s[3],'era':ERAS[s[4]][0],'size':s[5],'named_cards':len(D['sets'][s[0]]['cards'])} for s in SETS]+[{'code':ANNIV[0],'name':ANNIV[1],'year':ANNIV[2],'season':ANNIV[3],'era':'Tenth Anniversary','size':ANNIV[5],'named_cards':len(D['tt']),'alternate_art_numbers':'221-230'}],
       'cards':[{'card_id':c['cid'],'title':c['title'],'type':TYPES[c['type']],'subtype':c['subtype'],'faction':c['faction'],'allegiance':c['allegiance'],'rarity':RARITY[c['rar']],
                 'era':ERAS[c['era']][0],'first_printing':('TM-%s-%03d'%(c['set'],c['no'])) if c['era']!='N' else next(p['id'] for p in pr if p['card'] is c and p['kind']=='new'),
                 'reprinted_in_anniversary':'R' in c['flags'],'anniversary_alternate_art':'A' in c['flags'],'reserve_list':'X' in c['flags'],
                 'prototype_source':PROTO_RENAMED.get(c['title'],c['title']) if 'P' in c['flags'] else None,'gameplay_identity':c['identity']} for c in sorted(D['cards'],key=lambda c:c['cid'])],
       'printings':[{k:r[k] for k in ('printing_id','card_id','set','collector_number','printing_kind','original_printing','illustration_id','alternate_art')} for r in rows],
       'illustrations':[{k:x.get(k) for k in ('id','card','title','faction','type','pool','subject','direction','file','stored','status','sheet','cell','approved_note')} for x in il],
       'counts':C}
    q={'schema':'tidemark-art-queue/1','version':VERSION,'generated_by':'tools/tidemark/checklist.py','handoff':'tidemark-production/ART_BIBLE.md',
       'rules':{'grid':'3x3 contact sheet, nine different card illustrations, one per cell, left to right then top to bottom','cell':CELL,
                'forbidden':'card frames, portrait card mockups, borders, typography, rules text, labels, numbers, watermarks, logos, UI',
                'one_record_per_illustration':True,'reprints':'reuse the original illustration; never requested again'},
       'priority':['anniversary','alternate','historical','supplement'],
       'sheets':S,
       'approved_concepts':[{'illustration':x['id'],'card':x['card'],'title':x['title'],'file':x['file'],'status':x['status'],'note':x['approved_note']} for x in il if x['status']=='approved-concept-file-missing'],
       'reprint_reuse':[{'printing':p['id'],'title':p['card']['title'],'reuses':p['ill'],'original_printing':p['orig']} for p in pr if p['reuse']],
       'unused_positions':[{'sheet':s['id'],'cells':s['unused']} for s in S if s['unused']],
       'summary':{'sheets':len(S),'by_pool':{k:len([s for s in S if s['pool']==k]) for k in ('anniversary','alternate','historical','supplement')},
                  'cells_used':sum(len(s['cells']) for s in S),'cells_unused':sum(len(s['unused']) for s in S)}}
    return {'manifest.json':json.dumps(m,indent=1,ensure_ascii=False)+'\n','art_queue.json':json.dumps(q,indent=1,ensure_ascii=False)+'\n','checklist.csv':buf.getvalue(),
            'CHECKLIST.md':checklist_md(D,rows,C),'SHEETS.md':sheets_md(S,q),'ART_BIBLE.md':bible_md(D),'outstanding_assets.md':outstanding_md(D,S,C,q)}

def md_table(head, rows): return '\n'.join(['| '+' | '.join(head)+' |','|'+'---|'*len(head)]+['| '+' | '.join(str(x) for x in r)+' |' for r in rows])

def comp_tables(by, total_label):
    tcols=[TYPES[t] for t in TORDER]; rcols=list(RARITY.values())
    rows=[]; tot={k:0 for k in tcols+rcols}
    for f in FACTIONS:
        v=by.get(f[1],{}); rows.append([f[1]]+[v.get(k,0) for k in tcols]+[sum(v.get(k,0) for k in tcols)]+[v.get('_'+k,0) for k in rcols])
        for k in tcols: tot[k]+=v.get(k,0)
        for k in rcols: tot[k]+=v.get('_'+k,0)
    rows.append(['**'+total_label+'**']+[tot[k] for k in tcols]+[sum(tot[k] for k in tcols)]+[tot[k] for k in rcols])
    return md_table(['Faction']+tcols+['Total']+rcols,rows)

def checklist_md(D,rows,C):
    L=['# Tidemark: canonical card checklist','','Generated by `tools/tidemark/checklist.py` (do not edit). **Proposed** by Claude Code on 2026-10-18 for the owner to approve: names, sets and art plan are proposals; gameplay identities are roles, not final numbers. Full data with every field: `checklist.csv` and `manifest.json`.','',
       '## Tenth Tide (TT): the 10th-anniversary set','','220 cards: %d new, %d reprints. Alternate-art reprints are numbered 221-230 after the 220. Columns: number, title, type, faction, rarity, new or reprint, identity.'%(C['anniversary_new'],C['anniversary_reprints']),'',
       '### Composition','',comp_tables(C['anniversary_by_faction'],'Tenth Tide'),'']
    tt=[r for r in rows if r['set']=='TT']
    L+=['### Checklist','',md_table(['No.','Title','Type','Faction','Rarity','Printing','Gameplay identity'],[[r['collector_number'],r['title']+(' (alternate art)' if r['printing_kind']=='anniversary-alternate-art' else ''),r['card_type']+(' — '+r['subtype'] if r['subtype'] else ''),r['faction'],r['rarity'],
        'new' if r['printing_kind']=='new' else ('reprint of '+r['original_printing'] if r['printing_kind']=='reprint' else 'anniversary art for '+r['original_printing']),r['gameplay_identity']] for r in tt]),'']
    L+=['## The historical library','','%d named cards from %d sets (2016-2025). Each historical set has 200 or 250 cards; only its representative cards are named here, numbered where they fall in the full set. The rest is unnamed bulk for pack contents and prices.'%(C['historical_cards'],C['historical_sets']),'',
        '### Composition','',comp_tables(C['historical_by_faction'],'Historical'),'','By era: '+', '.join('%s %d'%(k,v) for k,v in C['historical_by_era'].items())+'.','']
    for s in SETS:
        cs=[r for r in rows if r['set']==s[0]]
        L+=['### %s (%s), %s %d, %s era, %d cards (%d named)'%(s[1],s[0],s[3],s[2],ERAS[s[4]][0],s[5],len(cs)),'',md_table(['No.','Title','Type','Faction','Rarity','Gameplay identity','Notes'],[[r['collector_number'],r['title'],r['card_type']+(' — '+r['subtype'] if r['subtype'] else ''),r['faction'],r['rarity'],r['gameplay_identity'],
            ', '.join(x for x in (('reserve list' if r['reserve_list']=='yes' else ''),('reprinted in Tenth Tide' if any(t['card_id']==r['card_id'] for t in tt) else ''),('prototype: '+r['prototype_source'] if r['prototype_source'] else '')) if x)] for r in cs]),'']
    return '\n'.join(L)+'\n'

def sheets_md(S,q):
    L=['# Tidemark: numbered 3x3 production sheets','','Generated by `tools/tidemark/checklist.py` from the card checklist (do not edit). One cell is one card illustration; cells run left to right, top to bottom. Read `ART_BIBLE.md` first. Order of work: anniversary sheets, then alternate art, then the historical library.','',
       'Summary: %d sheets (%s), %d cells used, %d cells deliberately left empty (listed under each sheet; never fill them with invented cards).'%(q['summary']['sheets'],', '.join('%s %d'%(k,v) for k,v in q['summary']['by_pool'].items()),q['summary']['cells_used'],q['summary']['cells_unused']),'']
    for s in S:
        L+=['## %s: %s (%s)'%(s['id'],s['theme'],s['pool']),'','File: `%s`'%s['file'],'']
        for c in s['cells']: L.append('%d. **%s** (%s, %s, %s) `%s`  \n   Subject: %s.  \n   Direction: %s'%(c['cell'],c['title'],c['card'],c['faction'],c['type'],c['illustration'],c['subject'],c['direction']))
        if s['unused']: L.append('\nUnused cells: %s (leave empty: plain neutral grey).'%', '.join(str(x) for x in s['unused']))
        L.append('')
    return '\n'.join(L)+'\n'

def bible_md(D):
    L=['# Tidemark art bible','','For SOL and anyone producing Tidemark illustrations. Generated by `tools/tidemark/checklist.py` (do not edit; change the script). The checklist decides what is drawn: never invent a card, a card type, a subject or an extra illustration.','',
     '## The look','','Traditional painterly high fantasy with a nautical identity: illustrative, detailed and readable at card size, varied in subject, composition, light and atmosphere, consistent as one world without looking uniform.','',
     '- **Ordinary cards look ordinary.** A fisherman, soldier, dockworker, clerk or fox is drawn as an ordinary person or animal in an ordinary moment. Commons and Uncommons use natural light and plain, worn, practical clothing and gear.',
     '- **No default epic.** No glowing eyes or auras, halos, dramatic rim lighting, monumental scale or ornate armour unless the card calls for it. Legendary cards may be more dramatic, but restrained: one strong light source, no excess ornament.',
     '- **Magic is shown physically.** Water moves, weather turns, roots grow, a bell rings. Avoid abstract swirls and particle effects. The Abyssal Choir is the one faction where cold bioluminescence is normal, used sparingly.',
     '- **Clear subjects and silhouettes.** One readable subject or a small readable group; the card\'s subject must be obvious at a glance.','',
     '## The art window and the grid','',
     '- Every cell is a complete landscape scene for the art window of a traditional Magic-style card: '+CELL+'.',
     '- SOL generates 3x3 contact sheets with thin dark gutters. Each sheet holds **nine different card illustrations** (never nine poses of one subject), in the order listed in `SHEETS.md` (left to right, top to bottom).',
     '- **Forbidden in the art:** card frames, portrait card mockups, borders, typography, titles, rules text, labels, numbers, watermarks, logos, UI. The game draws the frame, the rarity symbol and every word.',
     '- Rarity never needs its own illustration or frame. Reprints reuse their original illustration and are never requested again. The ten anniversary alternate arts are separate, listed requests.',
     '- Empty cells listed for a sheet stay empty (plain neutral grey). Never fill them with invented cards.','',
     '## Factions','']
    for f in FACTIONS: L.append('- **%s** (%s; frame colour %s, icon %s): %s.'%(f[1],f[2],ICON[f[0]][0],ICON[f[0]][1],LOOK[f[0]].split(': ',1)[1]))
    L+=['','When an illustration shows faction heraldry (banners, shields, sails), use these icons and colours, never invented emblems.','',
        '## The card frame','','The game draws every frame; SOL never paints one. The look follows the owner\'s card frame guide (`FRAME_GUIDE.md`, image in `reference/`): the illustration fills a 4:3 landscape window under the name bar, so compose for that window. The guide\'s placeholder rules text and symbols are not Tidemark\'s; `FRAME_GUIDE.md` lists the corrections.']
    L+=['','## Composition by card type','',md_table(['Type','Visual group','How to frame it'],[['Units (people)','figures',FRAMING['figures']],['Units (animals, constructs, monsters)','creatures',FRAMING['creatures']],['Spells and Enchantments','scenes',FRAMING['scenes']],['Relics','objects',FRAMING['objects']],['Vessels','ships',FRAMING['ships']],['Strongholds','architecture',FRAMING['architecture']],['Domains','landscape',FRAMING['landscape']]]),'',
        '## Register by rarity','',md_table(['Rarity','Register'],[[RARITY[k],v] for k,v in REGISTER.items()]),'',
        '## Eras','','Ten fictional years of art share one painterly style. Era shows in the content, not the brushwork: Founding-era cards (2016-2017) have the simplest gear, ships and buildings; later eras add bigger ships, deeper ruins and more elaborate fortifications.','',
        '## Approved concepts','','The owner approved three Tidemark illustrations and concept sheets. They set the visual direction above. **Their image files are not in the repository**, so they are recorded and not queued; the owner supplies them (status `approved-concept-file-missing`).','']
    for t,n in APPROVED.items(): L.append('- **%s**: %s'%(t,n))
    L+=['','## How each cell is described','','Every cell in `SHEETS.md` and `art_queue.json` names the card ID, the illustration ID, the exact subject and the direction: the faction look, the framing for its type, the register for its rarity and, when the subject does not already set it, the light. The asset filename is fixed per illustration (`tidemark-production/art/TMI-####-title.png`).','']
    return '\n'.join(L)+'\n'

def outstanding_md(D,S,C,q):
    il=D['ills']; I=C['illustrations']
    beyond=[c['title'] for c in D['cards'] if EFFECTS_BEYOND_PROTOTYPE.search(c['identity'])]
    L=['# Tidemark: outstanding assets and decisions','','Generated by `tools/tidemark/checklist.py` (do not edit). Date 2026-10-18.','',
       '## Illustrations','',md_table(['What','Count'],[['Unique original illustrations (one per card identity)',I['unique_original']],['  of which new for the anniversary set',I['new_for_anniversary']],['  of which historical',I['historical']],['Anniversary alternate art (separate requests)',I['alternate_art']],
           ['Reprints reusing original art (no request)',I['reused_by_reprints']],['Approved concepts, file to be supplied by the owner',I['approved_concepts_awaiting_file']],['**To generate**',I['to_generate']],['Delivered by SOL, awaiting owner review',I['delivered_awaiting_owner_review']],['Approved by the owner',I['approved_by_owner']]]),'',
       'Delivered pictures are filed in `approved/art/` by `tools/tidemark/art_intake.py` and listed in `approved/registry.json`; review them in `review/REVIEW.md`. Status before delivery was `not-started`, apart from the three approved concepts. Sheets: %d (%s); %d cells used, %d left empty.'%(q['summary']['sheets'],', '.join('%s %d'%(k,v) for k,v in q['summary']['by_pool'].items()),q['summary']['cells_used'],q['summary']['cells_unused']),'',
       '## Approved concept files to supply','']
    for x in il:
        if x['status']=='approved-concept-file-missing': L.append('- `%s` %s (%s): %s'%(x['file'],x['title'],x['card'],x['approved_note']))
    L+=['','The approved Tidemark concept sheets are not in the repository either. Please add them (and the three files above) so the direction in `ART_BIBLE.md` can be checked against them.','',
        '## Sheets with empty cells','','Groups smaller than nine are not padded with invented cards. A leftover group first merges with the same kind of subject from its side of the map (Land, Sea, or Harbor Leagues with Neutral); what still remains is a partial sheet.','',
        md_table(['Sheet','Theme','Empty cells'],[[s['id'],s['theme'],', '.join(str(x) for x in s['unused'])] for s in S if s['unused']]),'',
        '## Decisions for the owner (and departures from earlier proposals)','',
        '1. **Anniversary rarity split: %s.** The standard-set ratio is 50/30/15/5 (proposals.md). The anniversary carries more Rares and Legendaries because 7 of its 70 reprints are famous Legendaries (one per faction) and each faction also gets one new Legendary. Proposed, not yet agreed.'%(', '.join('%s %d'%(k,v) for k,v in C['anniversary_by_rarity'].items())),
        '2. **Composition per faction: 28 cards (19 new + 9 reprints), Neutral 24 (17 + 7).** Type mix follows the faction identities: Strongholds in the Crownlands, Iron Reach and Harbor Leagues; Vessels mostly in the Free Fleets and Harbor Leagues; Enchantments heaviest in the Abyssal Choir. The Thornwild and Tideborn have no Strongholds.',
        '3. **"Ten years on" cycle:** six new Legendaries revisit Founding legends ten years later (Dowager Queen Isolde, Nerith Undying, Admiral Kestra Vane Retired, Aurel the Elder, The Grey Wanderer Returns, Hollowhorn\'s Heir), and Brannoch\'s Last Blade honours a seventh. The originals stay on the reserve list. Easy to drop if unwanted.',
        '4. **The prototype:** 57 of its 60 names are kept as historical identities (most in First Tide, the core set) because they were designed as the game\'s plain founding cards. Their numbers stay provisional. Three were renamed: Swift Cutter to Gull Cutter (Swift is a keyword), Brigantine to Saltwind Brigantine and War Galleon to Galleon Resolute (generic ship words are subtypes). None is final canon until the owner approves.',
        '5. **The three approved concepts are new anniversary cards**, not renames: Sentinel of Azure Keep, Roothorn Stag and Choir-Depth Leviathan take the roles of Keep Warden, Elder Antler and Ancient Leviathan, which remain historical cards. Alternative: rename the prototype cards instead.',
        '6. **Reserve list:** %d Founding-era cards are never reprinted (the old market\'s grails; proposals.md suggested about 20).'%len([c for c in D['cards'] if 'X' in c['flags']]),
        '7. **History:** 30 main sets (three a year, 2016-2025). First Tide, the core set, has %d named cards because most of the prototype lives there; the others have %d to %d. Supplemental products are not represented yet. Collector numbers place each named card inside its full 200- or 250-card set.'%(len(D['sets']['FT']['cards']),min(len(v['cards']) for k,v in D['sets'].items() if k!='FT'),max(len(v['cards']) for k,v in D['sets'].items() if k!='FT')),
        '8. **Alternate art** is numbered TT 221-230, after the 220 (like secret rares). Proposed.',
        '9. **Gameplay:** the checklist holds each card\'s identity only. Numbers and abilities were designed on 2026-10-19, when the owner asked for the cards to be built: they are in `tools/tidemark/v1/` (rules 1.0, `RULES.md`), the exported `cards.json` and `CARDS.md`, and the balance report `BALANCE.md`. They are designed, not canon, until the owner approves them and people have played.',
        '10. **Effects beyond the prototype engine.** %d identities use effects the simulator does not have yet (taking control, copying, cost taxes, discard, extra Allegiance): %s. They need engine work, or a rewrite, before they can be simulated.'%(len(beyond),', '.join(beyond)),
        '11. **A Land Vessel:** Ironclad Barge (Iron Reach, Land) is a Vessel with Land allegiance. Vessels live in the Deep, so its allegiance is unusual; it counts as a Land permanent. Flagged for a ruling.',
        '12. **Practicality:** 220 cards is about 3.7 times the prototype. The nine approved keywords plus the prototype\'s effects cover most identities, which keeps the set simulatable. The 500-card historical library needs no rules beyond these. About %d sheets of nine is in line with the earlier estimate of about 73.'%q['summary']['sheets'],'']
    return '\n'.join(L)+'\n'

def validate(D,S):
    errs=[]; C=counts(D)
    if C['anniversary_total']!=220: errs.append('anniversary has %d cards'%C['anniversary_total'])
    if C['anniversary_new']!=150 or C['anniversary_reprints']!=70 or C['anniversary_alternate_art']!=10: errs.append('anniversary split %d/%d/%d'%(C['anniversary_new'],C['anniversary_reprints'],C['anniversary_alternate_art']))
    if not 480<=C['historical_cards']<=3000: errs.append('historical library has %d cards'%C['historical_cards'])
    seen={}
    for s in S:
        for c in s['cells']:
            if c['illustration'] in seen: errs.append('illustration twice in the queue: '+c['illustration'])
            seen[c['illustration']]=s['id']
    need=[x['id'] for x in D['ills'] if x['status']=='not-started']
    miss=[i for i in need if i not in seen]
    if miss: errs.append('illustrations without a sheet: %s'%miss[:5])
    if len(seen)!=len(need): errs.append('queue size mismatch')
    for p in D['printings']:
        if p['reuse'] and any(c['illustration']==p['ill'] and False for c in []): pass
    nums=[p['no'] for p in D['printings'] if p['set']=='TT']
    if sorted(nums)!=list(range(1,231)): errs.append('anniversary numbering is not 1-230')
    for s in D['sets'].values():
        if len({c['no'] for c in s['cards']})!=len(s['cards']): errs.append('duplicate collector number in '+s['code'])
    return errs

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); a=ap.parse_args()
    D,errs=build()
    if errs: print('INVALID'); [print(' -',e) for e in errs]; sys.exit(1)
    S=sheets(D); errs=validate(D,S)
    # pictures filed by tools/tidemark/art_intake.py (approved/registry.json): delivered, awaiting the owner's review
    regp=os.path.join(OUT,'approved','registry.json')
    if os.path.exists(regp):
        reg=json.load(open(regp,encoding='utf-8'))['assets']
        for x in D['ills']:
            r=reg.get(x['id'])
            if r: x['status']=r['status']; x['stored']=r['file']
    if errs: print('INVALID'); [print(' -',e) for e in errs]; sys.exit(1)
    outs=render(D,S)
    outs['@design_waves.json']=json.dumps(WAVE_DESIGNS,indent=1,ensure_ascii=False,sort_keys=True)+'\n'
    if a.check:
        pth=lambda k: os.path.join(ROOT,'tools','tidemark','v1','design_waves.json') if k[0]=='@' else os.path.join(OUT,k)
        bad=[k for k,v in outs.items() if not os.path.exists(pth(k)) or open(pth(k),encoding='utf-8').read()!=v]
        if bad: print('OUT OF DATE (run tools/tidemark/checklist.py):',*bad); sys.exit(1)
        print('Tidemark checklist OK: files up to date, rules pass'); return
    os.makedirs(OUT,exist_ok=True)
    for k,v in outs.items(): open(os.path.join(ROOT,'tools','tidemark','v1','design_waves.json') if k[0]=='@' else os.path.join(OUT,k),'w',encoding='utf-8').write(v)
    C=counts(D); q=json.loads(outs['art_queue.json'])['summary']
    print('wrote tidemark-production/: anniversary %d (%d new, %d reprints, %d alternate art), historical %d in %d sets'%(C['anniversary_total'],C['anniversary_new'],C['anniversary_reprints'],C['anniversary_alternate_art'],C['historical_cards'],C['historical_sets']))
    print('illustrations:',C['illustrations']); print('sheets:',q)
    print('anniversary by type:',C['anniversary_by_type']); print('anniversary by rarity:',C['anniversary_by_rarity'])
    print('historical by type:',C['historical_by_type']); print('historical by rarity:',C['historical_by_rarity'])
if __name__=='__main__': main()
