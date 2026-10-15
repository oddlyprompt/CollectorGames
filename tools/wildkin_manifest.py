#!/usr/bin/env python3
"""Builds the Wildkin Set 001 (First Bond) production manifest and the art queue.

  python3 tools/wildkin_manifest.py            write wildkin-production/manifest.json, art_queue.json, ART_QUEUE.md, reports/reconciliation.md
  python3 tools/wildkin_manifest.py --check    rebuild in memory and fail if the committed files differ or validation fails

Inputs (never edited by this script):
  design/wildkin-v1-production-bible.md          the owner's production bible (source of truth)
  wildkin-production/source/appendix_a_roster.tsv the 180 names and numbers, extracted by script from Appendix A
  design/wildkin-universe.md                      the owner's earlier roster plan (mascot affinities and roles)
  assets/manifest.json                            the already-cut scene library (biome, floor, time of day)
  wildkin-production/approved/registry.json       approved art (written by tools/wildkin_art.py), only read for queue status

Every fact carries a status:
  canon        stated in the bible or the owner's design doc
  inferred     follows from canon numbering and the 43-sheet plan, but the bible says it was not recovered. Needs owner confirmation.
  designed     card rules written by Claude Code under the owner's instruction of 2026-10-15 (tools/wildkin_design.py)
  decided      a reasoned choice made under the same instruction where the bible left it open (affinities, rarities, fandom)
  provisional  an engine number still open (release date, set code, prices, odds). Not canon.
  unresolved   unknown and not used
SOL (the art model) must read this file and never edit it."""
import os, sys, json, re, hashlib, argparse
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import wildkin_design as WD
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP=os.environ.get('WILDKIN_PRODUCTION') or os.path.join(ROOT,'wildkin-production')
MANIFEST_VERSION='1.1.0'   # 1.1.0: card rules designed, affinities and fandom decided (2026-10-15)

# ---------------------------------------------------------------- canon inputs
def roster():
    rows=[]
    for line in open(os.path.join(WP,'source','appendix_a_roster.tsv'),encoding='utf-8'):
        if line.startswith('#') or not line.strip(): continue
        no,sec,name=line.rstrip('\n').split('\t'); rows.append((int(no),sec,name))
    assert len(rows)==180 and [r[0] for r in rows]==list(range(1,181)), 'roster must be exactly 001-180'
    return rows

AFFINITIES=[  # bible section 8: nine established affinities (canon). Order is the engine's type wheel (provisional mechanics).
    ('verdant','Verdant','#5fb35a','#1d4d22','#eaf7e6'), ('tide','Tide','#2fb0c8','#0d4a5a','#e0f5f9'), ('stone','Stone','#b98b55','#58391a','#f6ecdc'),
    ('iron','Iron','#8a96a6','#2c3440','#eef1f5'), ('ember','Ember','#f2742c','#6d2309','#fff0e3'), ('storm','Storm','#5a6bff','#1a2275','#e9ecff'),
    ('astral','Astral','#8f7ff0','#2a2470','#efedff'), ('dusk','Dusk','#8e4fb0','#2d1147','#f2e6f8'), ('wonder','Wonder','#f07ab8','#6d1f4a','#fde9f3')]
AFF={a[1]:a[0] for a in AFFINITIES}

# Families. canon = bible section 3, design/wildkin-universe.md, and the owner's confirmation on 2026-10-13 of the families below that were first
# inferred from Appendix A numbering read against the 43-sheet plan
# (sheets 12-17: six 3-stage families, 18-23: six 2-stage families, 24-29: 18 standalones in groups of three). The counts match exactly
# (6x3 + 6x2 + 18 = 48 = cards 027-074), and every supporting Illustration Rare / Clasped subject (Veilmora, Ferradon, Fablehorn,
# Bramblebuck, Corallume, Cometrail) lands on the last member of an inferred line. Still: the bible says these links were not recovered.
FAMILIES=[
 # id, members (card numbers), kind, status, sheet, role (canon role text from design/wildkin-universe.md where it exists)
 ('FAM-01',[1],'mascot-standalone','canon','SHEET-01','Primary lovable mascot; weird, cheerful, instantly recognisable'),
 ('FAM-02',[2,3,4],'mascot-3stage','canon','SHEET-02','Wonder mascot; beautiful, magical, collector-friendly'),
 ('FAM-03',[5,6,7],'mascot-3stage','canon','SHEET-03','Classic starter-style hero; toughness and progression'),
 ('FAM-04',[8,9,10],'mascot-3stage','canon','SHEET-04','Prestige icon; ancient, elegant, high-end chase-card creature'),
 ('FAM-05',[11,12,13],'mascot-3stage','canon','SHEET-05','Defender mascot; noble but slightly ridiculous'),
 ('FAM-06',[14,15,16],'mascot-3stage','canon','SHEET-06','Forest guardian; calm, sturdy, ancient'),
 ('FAM-07',[17,18],'mascot-2stage','canon','SHEET-07','Oddball fan favourite; playful and visually strange'),
 ('FAM-08',[19,20],'mascot-2stage','canon','SHEET-08','Cool mascot; mysterious night creature'),
 ('FAM-09',[21,22],'mascot-2stage','canon','SHEET-09','Mischief mascot; spooky-cute, seasonal potential'),
 ('FAM-10',[23],'mascot-standalone','canon','SHEET-10','Weird beloved standalone; comic personality'),
 ('FAM-11',[24,25,26],'3stage','canon','SHEET-11',''),
 ('FAM-12',[27,28,29],'3stage','canon','SHEET-12',''), ('FAM-13',[30,31,32],'3stage','canon','SHEET-13',''),
 ('FAM-14',[33,34,35],'3stage','canon','SHEET-14',''), ('FAM-15',[36,37,38],'3stage','canon','SHEET-15',''),
 ('FAM-16',[39,40,41],'3stage','canon','SHEET-16',''), ('FAM-17',[42,43,44],'3stage','canon','SHEET-17',''),
 ('FAM-18',[45,46],'2stage','canon','SHEET-18',''), ('FAM-19',[47,48],'2stage','canon','SHEET-19',''),
 ('FAM-20',[49,50],'2stage','canon','SHEET-20',''), ('FAM-21',[51,52],'2stage','canon','SHEET-21',''),
 ('FAM-22',[53,54],'2stage','canon','SHEET-22',''), ('FAM-23',[55,56],'2stage','canon','SHEET-23',''),
]+[('FAM-%02d'%(24+i),[57+i],'standalone','canon','SHEET-%02d'%(24+i//3),'') for i in range(18)]

# Affinity: mascots from design/wildkin-universe.md (canon, first listed = primary). Everything else is provisional, read from the name.
AFF_CANON={1:('Verdant',None),2:('Tide','Astral'),3:('Tide','Astral'),4:('Tide','Astral'),5:('Stone',None),6:('Stone',None),7:('Stone',None),
 8:('Tide','Astral'),9:('Tide','Astral'),10:('Tide','Astral'),11:('Stone','Iron'),12:('Stone','Iron'),13:('Stone','Iron'),14:('Verdant',None),15:('Verdant',None),16:('Verdant',None),
 17:('Wonder',None),18:('Wonder',None),19:('Astral',None),20:('Astral',None),21:('Dusk','Verdant'),22:('Dusk','Verdant'),23:('Tide',None)}
# Non-mascot affinities live in tools/wildkin_design.py (AFF_DECIDED, decided 2026-10-15).
# How a creature gets about decides which scene floors it can stand on. Known for the six creatures with approved art; walker elsewhere (provisional).
MOVE_KNOWN={1:'walker',5:'walker',11:'walker',14:'walker',23:'floater'}
# Collector fandom (starting demand weights) lives in tools/wildkin_design.py (FANDOM, CHAR_FANDOM).
POSES9=['standing','jumping','running','waving','sitting','sleeping','surprised','looking-up','back-view']
POSES3=['standing','jumping','sitting']
POSES_EXTRA=['waving','running','looking-up']
DESIGN_KNOWN={  # visual identity established by owner-approved sheets already in art-source/ (do not change)
 1:'Green cactus-alpaca: fluffy rounded cactus-pad body with short yellow spines, cream face and ears, pink-coral flower on the head, dark hooves. Magenta screen.',
 5:'Small blue ankylosaur: blue armoured back with cream spikes, cream belly and face, spiked tail club, big brown eyes. Green screen.',
 11:'Armoured roly-poly (pill bug): navy and steel segmented shell, silver knight-helmet visor with slits, pale face, rosy cheeks, two antennae, six dark legs. Green screen.',
 14:'Leaf pangolin: overlapping green leaf scales over a tan furry body, cream belly, curled leafy tail, green eyes. Magenta screen.',
 23:'Dumbo octopus: peach-coral round body, two large ear fins, curled tentacles with pale suckers, freckles, brown eyes. Green screen.'}
CHARACTER_CANON={75:'Professor Maren Vale. Important character (bible).',76:'June Kestrel: a young entry-point Keeper (bible). Preserve the established youthful silhouette and reference images.',
 86:'Sel Veyra: CEO of Veyra Industries, the antagonistic organisation (bible).'}
SCENE_BIOMES_PLANNED={'ember':5,'iron':4,'storm':5,'dusk':4}   # Biomes B and C cells (see sheet plan)

def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower().replace("'",'')).strip('-')
def rng(seed):
    h=int(hashlib.sha256(seed.encode()).hexdigest()[:16],16)
    def r():
        nonlocal h; h=(h*6364136223846793005+1442695040888963407)&((1<<64)-1); return (h>>11)/float(1<<53)
    return r

# Card rules (HP, attacks, abilities, trainer effects) live in tools/wildkin_design.py.

# ---------------------------------------------------------------- build
def build(registry):
    rows=roster(); name={n:nm for n,s,nm in rows}; sec={n:s for n,s,nm in rows}
    scenes=json.load(open(os.path.join(ROOT,'assets','manifest.json')))['scenes']
    fam_of={}; stage_of={}; nst={}
    for fid,mem,kind,st,sheet,role in FAMILIES:
        for i,m in enumerate(mem): fam_of[m]=fid; stage_of[m]=i+1; nst[m]=len(mem)
    assert sorted(fam_of)==list(range(1,75)), 'every creature 001-074 in exactly one family'
    fam_status={f[0]:f[3] for f in FAMILIES}
    # creature rarity: rule from design/wildkin-universe.md ("Basics sit in commons, Stage 1 in uncommons, Stage 2 in rares, standalone mascots in rares")
    def crar(n):
        k=[f for f in FAMILIES if f[0]==fam_of[n]][0][2]; s=stage_of[n]
        if k=='mascot-standalone': return 'rare'
        if k=='standalone': return 'common'
        return {1:'common',2:'uncommon',3:'rare'}[s]
    species=[]; cards=[]; assets={}
    def add_asset(aid, **kw):
        a=assets.setdefault(aid, dict(asset_id=aid, linked_cards=[], **kw)); return a
    scene_ids={b:[s for s in scenes if s['biome']==b] for b in {s['biome'] for s in scenes}}
    for b,k in SCENE_BIOMES_PLANNED.items():
        for i in range(k): add_asset('scene.%s.%02d'%(b,i+1), kind='scene', subject='%s biome background %d'%(AFFINITIES[[a[0] for a in AFFINITIES].index(b)][1],i+1), biome=b, floor='ground', format='jpg', aspect='1:1')
    for s in scenes:
        add_asset('scene.%s.%s'%(s['biome'],s['id'].split('-')[1]), kind='scene', subject=s['description'], biome=s['biome'], floor=s['floor'], time=s['time'], format='jpg', aspect='1:1')
    def background(n, aff, move):
        b=AFF[aff]; floors={'walker':{'ground'},'floater':{'water','air'},'swimmer':{'water'}}[move]
        if b in scene_ids:
            pool=[s for s in scene_ids[b] if s['floor'] in floors] or [s for s in scenes if s['floor'] in floors]
            s=pool[(n*7)%len(pool)]; return 'scene.%s.%s'%(s['biome'],s['id'].split('-')[1])
        k=SCENE_BIOMES_PLANNED[b]; return 'scene.%s.%02d'%(b,(n*7)%k+1)
    # creatures
    for n in range(1,75):
        nm=name[n]; fid=fam_of[n]; s=stage_of[n]; ns=nst[n]; fst=fam_status[fid]
        if n in AFF_CANON: a1,a2=AFF_CANON[n]; aff={'primary':a1,'secondary':a2,'status':'canon','note':'design/wildkin-universe.md lists dual affinities; the engine uses the first as the card\'s type' if a2 else ''}
        else:
            a1,a2=WD.AFF_DECIDED[n]; aff={'primary':a1,'secondary':a2,'status':'decided','note':WD.AFF_REASON.get(n,'decided from the name, design and family (2026-10-15)')}
        mascot=fid in [f[0] for f in FAMILIES[:10]]
        move=MOVE_KNOWN.get(n,'walker'); rar=crar(n)
        sl='%03d-%s'%(n,slug(nm)); poses=POSES9 if ns==1 and mascot else (POSES3+(POSES_EXTRA if (ns==2 and s==2 and fid in ('FAM-07','FAM-08','FAM-09')) else []))
        for p in poses: add_asset('cut.%s.%s'%(sl,p), kind='cutout', subject=nm, pose=p, species='SP-%03d'%n, format='webp', aspect='free (cut from sheet)')
        sp={'id':'SP-%03d'%n,'name':nm,'slug':slug(nm),'card':'WK-S001-%03d'%n,'family':fid,'family_status':fst,'stage':s,'stages_in_family':ns,
            'stage_label':'Basic' if s==1 else 'Stage %d'%(s-1),'evolves_from':('SP-%03d'%(n-1)) if s>1 else None,'evolves_to':('SP-%03d'%(n+1)) if s<ns else None,
            'affinity':aff,'mascot':mascot,'movement':{'value':move,'status':'canon' if n in MOVE_KNOWN else 'provisional'},
            'fandom':{'value':WD.FANDOM.get(n,WD.FANDOM_DEFAULT_MASCOT if mascot else WD.FANDOM_DEFAULT),'status':'decided','note':'starting collector demand; prices still move with supply, demand and play'},
            'visual_identity':{'status':'established' if n in DESIGN_KNOWN else 'sol_designs','text':DESIGN_KNOWN.get(n,'Not drawn yet. SOL designs it from the art already generated for Wildkin, in the established style. Its first approved sheet then becomes the reference every later picture must match.')},
            'poses':poses}
        species.append(sp)
        bg=background(n,aff['primary'],move)
        cards.append({'id':'WK-S001-%03d'%n,'number':n,'category':'creature','roster_name':nm,'name':nm,'rarity':{'value':rar,'status':'canon-rule'},
            'species':sp['id'],'variant':'base','gameplay':WD.creature_gameplay(n,s,ns,aff['primary']),
            'art':{'layout':'cutout-on-scene','subject':'cut.%s.standing'%sl,'background':bg}})
        assets['cut.%s.standing'%sl]['linked_cards'].append('WK-S001-%03d'%n); assets[bg]['linked_cards'].append('WK-S001-%03d'%n)
    # allies, gear, biomes, tactics, essence
    ally_rare={75,76,86,90}; gear_unc={93,106,107,108,109,110}; tactic_rare={120,130}
    for n in range(75,141):
        nm=name[n]; cat=sec[n]; sl='%03d-%s'%(n,slug(nm)); c={'id':'WK-S001-%03d'%n,'number':n,'category':cat,'roster_name':nm,'name':nm,'variant':'base'}
        if cat=='ally':
            rar='rare' if n in ally_rare else 'uncommon'; aid='cut.%s.portrait'%sl
            add_asset(aid,kind='cutout',subject=nm,pose='portrait',character='CH-%03d'%n,format='webp',aspect='free (cut from sheet)')
            c['fandom']={'value':WD.CHAR_FANDOM.get(n,WD.CHAR_DEFAULT),'status':'decided','note':'starting collector demand for the character'}
            c['character']={'id':'CH-%03d'%n,'identity':{'status':'established' if n in CHARACTER_CANON else 'sol_designs','text':CHARACTER_CANON.get(n,'Named in Appendix A. Not drawn in this repository yet. SOL designs the character from its earlier Wildkin art and character references; the first approved sheet becomes the reference.')}}
            c['art']={'layout':'cutout-on-panel','subject':aid,'background':None}
        elif cat=='gear':
            rar='uncommon' if n in gear_unc else 'common'; aid='obj.%s'%sl; add_asset(aid,kind='object',subject=nm,format='webp',aspect='free (cut from sheet)')
            c['art']={'layout':'cutout-on-panel','subject':aid,'background':None}
        elif cat=='biome':
            rar='uncommon'; aid='ill.%s'%sl; b=AFF[nm.split()[0]] if nm.split()[0] in AFF else {'Ironroot':'iron','Stoneback':'stone','Tideglass':'tide','Stormreach':'storm','Duskmire':'dusk','Wondergrove':'wonder'}.get(nm.split()[0])
            add_asset(aid,kind='illustration',subject=nm+' (biome card)',biome=b,format='jpg',aspect='1:1')
            interim=[x for x in scene_ids.get(b,[]) if x['floor']=='ground'][:1]
            c['biome_affinity']={'value':AFFINITIES[[a[0] for a in AFFINITIES].index(b)][1],'status':'canon','note':'named after the affinity'}
            c['art']={'layout':'illustration','illustration':aid,'interim':('scene.%s.%s'%(b,interim[0]['id'].split('-')[1]) if interim else None),'interim_note':'existing approved scene of the same biome, shown until the Biomes A illustration is approved' if interim else ''}
        elif cat=='tactic':
            rar='rare' if n in tactic_rare else 'uncommon'; aid='ill.%s'%sl; add_asset(aid,kind='illustration',subject=nm+' (tactic: action/effect illustration)',format='jpg',aspect='4:3')
            c['art']={'layout':'illustration','illustration':aid}
        else:
            rar='essence'; c['essence_affinity']={'value':nm,'status':'canon'}; c['art']={'layout':'vector-essence','note':'No Essence sheet exists in the 43-sheet plan; the card is drawn as a vector design. See reconciliation.'}
        c['rarity']={'value':rar,'status':'canon-rule' if cat=='essence' else 'decided'}
        if cat in ('ally','gear','biome','tactic'): c['gameplay']=WD.trainer_gameplay(n,cat,c['biome_affinity']['value'] if cat=='biome' else None)
        else: c['gameplay']={'status':'designed','rules':'Provides 1 %s Essence.'%nm,'ops':[['essence',nm]]}
        for k in ('subject','illustration'):
            if c['art'].get(k): assets[c['art'][k]]['linked_cards'].append(c['id'])
        cards.append(c)
    # premium 141-180
    by_name={}
    for c in cards: by_name.setdefault(c['name'],c)
    for n in range(141,181):
        nm=name[n]; m=re.match(r'^(.*?) (IR|FA|SIR)$',nm)
        if m: base,kind=m.group(1),m.group(2)
        else: m2=re.match(r'^Clasped (.*)$',nm); base,kind=m2.group(1),'CSR'
        b=by_name[base]; rar={'IR':'ir','FA':'fa','SIR':'sir','CSR':'csr'}[kind]
        sl='%03d-%s'%(n,slug(nm)); aid='ill.%s'%sl; aspect='5:7'
        add_asset(aid,kind='illustration',subject=('Clasped '+base if kind=='CSR' else base)+{'IR':' (Illustration Rare)','FA':' (Full Art)','SIR':' (Special Illustration Rare)','CSR':' (Clasped Secret Rare: Clasp Program art)'}[kind],
                  format='png',aspect=aspect,premium=True)
        assets[aid]['linked_cards'].append('WK-S001-%03d'%n)
        cards.append({'id':'WK-S001-%03d'%n,'number':n,'category':'premium','roster_name':nm,'name':('Clasped '+base) if kind=='CSR' else base,'premium_kind':kind,
            'rarity':{'value':rar,'status':'canon'},'identity_of':b['id'],'identity_note':'Plays as the same card as %s (rules: premium prints play as their base card; the Clasp is a collector treatment, not a mechanic).'%b['id'],
            'variant':kind.lower(),'art':{'layout':'full-art','illustration':aid,'must_differ_from':[b['art'].get('subject') or b['art'].get('illustration')],'note':'Premium art must be a real alternate illustration, never a recoloured or resized base cutout (bible section 7).'}})
    return species, cards, assets

def sheets(species, cards, assets):
    sp={s['id']:s for s in species}; S=[]
    def cut(n,p):
        s=sp['SP-%03d'%n]; return 'cut.%03d-%s.%s'%(n,s['slug'],p)
    def task(tid, title, kind, cells, **kw):
        t={'task_id':tid,'title':title,'kind':kind,'expected_file':tid+'.png','cells':cells}; t.update(kw); S.append(t); return t
    CUT=dict(layout='3x3 grid, thin dark gutters, about 10% empty margin around each subject, nothing touching a cell edge, no text, no frames, no floor shadow, no effect marks ("!" bursts, sparkles, speed lines)',
             style='Soft, toy-like dimensional 3D render, soft even studio light, consistent scale and quality with art-source/creatures/', min_px=[1254,1254], aspect='1:1')
    def key_for(n): return 'magenta' if sp['SP-%03d'%n]['affinity']['primary']=='Verdant' else 'green'
    fams=[]
    for fid,mem,kind,st,sheet,role in FAMILIES: fams.append((fid,mem,kind,st,sheet,role))
    done=set()
    for fid,mem,kind,st,sheet,role in fams:
        if sheet in done: continue
        grp=[f for f in fams if f[4]==sheet]
        cells=[]
        if kind=='mascot-standalone':
            cells=[{'cell':i+1,'asset_id':cut(mem[0],p),'subject':sp['SP-%03d'%mem[0]]['name'],'pose':p} for i,p in enumerate(POSES9)]
        elif kind in ('mascot-3stage','3stage'):
            for r,n in enumerate(mem):
                for c,p in enumerate(POSES3): cells.append({'cell':r*3+c+1,'asset_id':cut(n,p),'subject':sp['SP-%03d'%n]['name'],'pose':p,'stage':sp['SP-%03d'%n]['stage_label']})
        elif kind in ('mascot-2stage','2stage'):
            for r,n in enumerate(mem):
                for c,p in enumerate(POSES3): cells.append({'cell':r*3+c+1,'asset_id':cut(n,p),'subject':sp['SP-%03d'%n]['name'],'pose':p,'stage':sp['SP-%03d'%n]['stage_label']})
            if kind=='mascot-2stage':
                for c,p in enumerate(POSES_EXTRA): cells.append({'cell':7+c,'asset_id':cut(mem[1],p),'subject':sp['SP-%03d'%mem[1]]['name'],'pose':p,'stage':'Stage 1'})
            else:
                for c in range(3): cells.append({'cell':7+c,'asset_id':None,'subject':'(leave empty: flat screen colour)','pose':None})
        elif kind=='standalone':
            for r,(_,m2,_,_,_,_) in enumerate(grp):
                n=m2[0]
                for c,p in enumerate(POSES3): cells.append({'cell':r*3+c+1,'asset_id':cut(n,p),'subject':sp['SP-%03d'%n]['name'],'pose':p})
        subj=[sp['SP-%03d'%n] for f in grp for n in f[1]]
        keys=sorted({key_for(n) for f in grp for n in f[1]})
        title={'mascot-standalone':'Mascot pose sheet','mascot-3stage':'Mascot family (3 stages x 3 poses)','mascot-2stage':'Mascot family (2 stages, 9 cells)','3stage':'Evolution family (3 stages x 3 poses)','2stage':'Evolution family (2 stages x 3 poses, 3 cells empty)','standalone':'Standalone creatures (3 creatures x 3 poses)'}[kind]
        task(sheet, title+': '+', '.join(s['name'] for s in subj), 'cutout-sheet', cells, chroma=keys[0] if len(keys)==1 else 'per subject: '+', '.join(keys),
             identity=[{'species':s['id'],'name':s['name'],'stage':s['stage_label'],'evolves_from':s['evolves_from'],'affinity':s['affinity']['primary']+(' / '+s['affinity']['secondary'] if s['affinity']['secondary'] else '')+' ('+s['affinity']['status']+')','role':role,'visual_identity':s['visual_identity']} for s in subj],
             identity_status=('canon' if all(f[3]=='canon' for f in grp) else 'inferred: family links follow Appendix A numbering; confirm with the owner before generating'),
             **CUT)
        done.add(sheet)
    allies=[c for c in cards if c['category']=='ally']
    for i,tid in enumerate(['SHEET-30','SHEET-31']):
        grp=allies[i*9:i*9+9]
        task(tid,'Allies sheet %s: %s'%('AB'[i],', '.join(c['name'] for c in grp)),'cutout-sheet',[{'cell':k+1,'asset_id':c['art']['subject'],'subject':c['name'],'pose':'portrait (full body, three-quarter view, standing)'} for k,c in enumerate(grp)],
             chroma='green (magenta if the character wears mostly green)',identity=[{'card':c['id'],'name':c['name'],'identity':c['character']['identity']} for c in grp],identity_status='names canon; SOL designs the looks from its earlier character art',**dict(CUT,style='Same dimensional 3D render as the creatures, human characters with youthful stylised proportions, soft studio light'))
    gear=[c for c in cards if c['category']=='gear']
    for i,tid in enumerate(['SHEET-32','SHEET-33']):
        grp=gear[i*9:i*9+9]
        task(tid,'Gear sheet %s: %s'%('AB'[i],', '.join(c['name'] for c in grp)),'cutout-sheet',[{'cell':k+1,'asset_id':c['art']['subject'],'subject':c['name'],'pose':'object, three-quarter view'} for k,c in enumerate(grp)],chroma='green (magenta for green objects)',identity_status='names canon; SOL designs the objects',**dict(CUT,style='Same dimensional 3D render, a single object per cell, soft studio light'))
    bio=[c for c in cards if c['category']=='biome']
    task('SHEET-34','Biomes A: one illustration per biome card','illustration-sheet',[{'cell':k+1,'asset_id':c['art']['illustration'],'subject':c['name']} for k,c in enumerate(bio)],
         layout='3x3 grid, thin dark gutters, full-bleed environment per cell, no text',style='3D miniature-diorama environments matching art-source/scenes/, soft even light',min_px=[1254,1254],aspect='1:1',identity_status='names canon')
    cellsB=[{'cell':k+1,'asset_id':'scene.ember.%02d'%(k+1),'subject':'Ember biome background %d'%(k+1)} for k in range(5)]+[{'cell':6+k,'asset_id':'scene.iron.%02d'%(k+1),'subject':'Iron biome background %d'%(k+1)} for k in range(4)]
    cellsC=[{'cell':k+1,'asset_id':'scene.storm.%02d'%(k+1),'subject':'Storm biome background %d'%(k+1)} for k in range(5)]+[{'cell':6+k,'asset_id':'scene.dusk.%02d'%(k+1),'subject':'Dusk biome background %d'%(k+1)} for k in range(4)]
    for tid,ttl,cells in (('SHEET-35','Biomes B: Ember and Iron backgrounds for creature cards',cellsB),('SHEET-36','Biomes C: Storm and Dusk backgrounds for creature cards',cellsC)):
        task(tid,ttl,'scene-sheet',cells,layout='3x3 grid, thin dark gutters, open floor in the lower third for a creature to stand on, no creatures, no text',style='3D miniature-diorama backgrounds matching art-source/scenes/, soft even lighting (no dramatic coloured light)',min_px=[1254,1254],aspect='1:1',identity_status='planned library (see reconciliation)')
    tac=[c for c in cards if c['category']=='tactic']
    task('SHEET-37','Tactics A','illustration-sheet',[{'cell':k+1,'asset_id':c['art']['illustration'],'subject':c['name']} for k,c in enumerate(tac[:9])],layout='3x3 grid, thin dark gutters, one action/effect illustration per cell, no text',style='Dimensional 3D render consistent with the creatures',min_px=[1254,1254],aspect='1:1 sheet; the card crops each cell to about 4:3',identity_status='names canon; scenes need design')
    task('SHEET-38','Tactics B','illustration-sheet',[{'cell':k+1,'asset_id':c['art']['illustration'],'subject':c['name']} for k,c in enumerate(tac[9:])]+[{'cell':4+k,'asset_id':None,'subject':'(leave empty: flat dark)'} for k in range(6)],layout='3x3 grid; cells 4-9 left empty',style='Dimensional 3D render consistent with the creatures',min_px=[1254,1254],aspect='1:1',identity_status='names canon; scenes need design')
    prem={c['number']:c for c in cards if c['category']=='premium'}
    PREM=dict(layout='3x3 grid of portrait 5:7 cells, thin dark gutters, each cell a complete painting with the subject clear of the top and bottom quarters (card text sits there), no text, no frames',style='Full painting, richer lighting allowed (chase art), the creature must match its approved cutout design exactly',min_px=[2100,2940],aspect='5:7')
    def pcells(nums, empties=0):
        out=[{'cell':k+1,'asset_id':prem[n]['art']['illustration'],'subject':prem[n]['roster_name'],'card':prem[n]['id']} for k,n in enumerate(nums)]
        return out+[{'cell':len(nums)+k+1,'asset_id':None,'subject':'(leave empty: flat dark)'} for k in range(empties)]
    task('SHEET-39','Illustration Rares A',"premium-sheet",pcells(range(141,150)),identity_status='canon subjects',**PREM)
    task('SHEET-40','Illustration Rares B',"premium-sheet",pcells([150]+list(range(161,169))),identity_status='canon subjects',**PREM)
    task('SHEET-41','Full Arts A',"premium-sheet",pcells(range(151,160)),identity_status='canon subjects',**PREM)
    task('SHEET-42','Full Arts B',"premium-sheet",pcells([160]+list(range(169,173)),4),identity_status='canon subjects; 4 cells empty',**PREM)
    task('SHEET-43','Clasp Program: Clasped Secret Rares',"premium-sheet",pcells(range(177,181),5),identity_status='canon subjects; 5 cells empty. SOL designs the look of a Clasp (a Veyra Industries device)',**PREM)
    for n in range(173,177):
        c=prem[n]; task('SIR-%03d'%n,'Special Illustration Rare: '+c['roster_name'],'single-illustration',[{'cell':1,'asset_id':c['art']['illustration'],'subject':c['roster_name'],'card':c['id']}],
                        layout='one painting, portrait 5:7, subject clear of the top and bottom quarters, no text, no frame',style='Showpiece painting, the highest-effort art in the set; creature/character must match the approved design',min_px=[1500,2100],aspect='5:7',identity_status='canon subject')
    for t in S:
        for c in t['cells']:
            if c.get('asset_id'): assets[c['asset_id']].setdefault('sheets',[]).append({'task':t['task_id'],'cell':c['cell']})
    return S

def queue_status(S, assets, registry):
    appr=registry.get('assets',{})
    for t in S:
        need=[c['asset_id'] for c in t['cells'] if c.get('asset_id')]; have=[a for a in need if a in appr]
        t['production']={'status':'complete' if need and len(have)==len(need) else 'partial' if have else 'todo','approved_cells':len(have),'required_cells':len(need)}
        t['qa']={'status':'approved' if need and len(have)==len(need) else 'pending'}
    for aid,a in assets.items(): a['status']='approved' if aid in appr else 'missing'
    return S

def reconcile(species, cards, assets, S, registry):
    L=[]; add=L.append
    add('# Reconciliation: the 43-sheet plan against the 180-card manifest\n')
    add('Generated by `tools/wildkin_manifest.py`. Every item below is a discrepancy, a duplicate, an inference or a gap that the owner should confirm. Nothing here was silently resolved.\n')
    add('## Confirmed by the owner\n')
    add('- **Evolution families for cards 027-056** (first inferred from the numbering and the sheet plan) were confirmed by the owner on 2026-10-13. Cards 057-074 are therefore the 18 standalones of sheets 24-29.')
    for fid,mem,kind,st,sheet,role in FAMILIES:
        if fid>='FAM-12' and fid<='FAM-23': add('  - %s: %s'%(fid,' -> '.join('%03d %s'%(m,[s['name'] for s in species if s['card'].endswith('%03d'%m)][0]) for m in mem)))
    add('\n## Decided on 2026-10-15 (owner instruction: finalise rules, affinities, ordering and mascot desirability)\n')
    add('- **Card ordering** is final as in Appendix A: 141-150 mascot Illustration Rares, 151-160 mascot Full Arts, 161-168 supporting Illustration Rares, 169-172 ally Full Arts, 173-176 Special Illustration Rares, 177-180 Clasped Secret Rares; allies 075-092 keep their recovered numbers. Nothing was renumbered.')
    add('- **Affinities of the 51 non-mascot creatures** are decided (`tools/wildkin_design.py`, status "decided"). Mascot affinities stay canon. Two changes from the earlier provisional reading: Clampup (064) is Iron (its approved art is bronze and metal), and Dewink and Bloomble (055-056) are Tide with Verdant as second affinity. Dual-affinity creatures may pay their own symbols with Essence of either affinity.')
    add('- **Card rules** are designed for all 180 cards (status "designed"): HP, attacks with costs and effects, abilities, weakness, retreat, prize value, and the effects of every Ally, Gear, Biome and Tactic. The rules of play are in `manifest.json` (`rules`). The engine is `src/engine/tcg_rules.js`; `tools/wildkin_sim.js` checks balance.')
    add('- **Premium prints play as their base card.** The Clasp is a collector treatment (Clasp Program art), not a mechanic.')
    add('- **Rarities of allies, gear, biomes and tactics** are decided (unchanged values). Creature rarities follow the owner\'s rule.')
    add('- **Collector demand (fandom)** has starting weights for every species and character: flagship mascots and the chase subjects (Cactuft, Nimbusail, June Kestrel, Sel Veyra, the four Clasped creatures) rank highest. These are starting preferences; prices still move with supply, demand and play.')
    add('\n## Sheet plan versus card needs\n')
    add('| Sheet | Queue title | Cells needed by the manifest | Note |'); add('|---|---|---|---|')
    for t in S:
        need=len([c for c in t['cells'] if c.get('asset_id')]); emp=len([c for c in t['cells'] if not c.get('asset_id')])
        note=''
        if t['task_id'] in ('SHEET-07','SHEET-08','SHEET-09'): note='2 stages x 3 poses = 6 cells; the 3 spare cells hold extra poses of the final form (mascot)'
        elif t['task_id'] in ['SHEET-%02d'%i for i in range(18,24)]: note='2 stages x 3 poses = 6 cells; 3 cells left empty. The older design doc planned 2 families per sheet (2 stages x 2 poses each); the bible gives one sheet per family'
        elif emp: note='%d cells left empty'%emp
        if t['task_id'] in ('SHEET-35','SHEET-36'): note='Plan: "alternate environment images". Used for the 4 biomes with no background library yet (Ember, Iron, Storm, Dusk): 4-5 backgrounds each'
        add('| %s | %s | %d | %s |'%(t['task_id'],t['title'].split(':')[0],need,note))
    add('\n## Gaps and duplicates\n')
    add('- **Essence (132-140) has no sheet** in the 43-sheet plan. The cards are drawn as vector designs by the card renderer. If painted Essence art is wanted, add a sheet (9 cells).')
    add('- **Five scene sheets already exist outside the numbering** (`art-source/scenes/`: Astral, Stone, Tide, Verdant, Wonder; 45 backgrounds). They are registered as the background library for creature cards of those affinities. The bible flags Dusk and Iron backgrounds as missing; Ember and Storm are missing too, so Biomes B and C are assigned to those four.')
    add('- **Biome cards 111-119** need Biomes A. Until it is approved, the five biomes that have a background library show one of those scenes, labelled interim; the other four show a placeholder.')
    add('- **Already delivered creature sheets** (`art-source/creatures/`, approved earlier): Cactuft (all 9 poses, sheet 01 complete), Flapod (all 9, sheet 10 complete), Bashlet, Rolyte and Frondolin (9 poses of the Basic only; their family sheets 03, 05, 06 still need Stage 1 and Stage 2). Those sheets are queued in full so the stages match; approved cells are never overwritten (`tools/wildkin_art.py`).')
    add('- **The koi sheet** (`art-source/creatures/koi-poses-green.png`) shows one koi-dragon form of the Koilet -> Runakoi -> Koirune line. Which stage it is was never recorded, so it is **not** mapped to a card. Once the owner says which stage, approve it with `python3 tools/wildkin_art.py legacy --koi <stage card number>`.')
    add('- **Cactuft chase examples** (`art-source/chase-examples/cactuft-fullart-examples.png`, three paintings) are examples, not assigned to 141, 151 or 173. They can be submitted through `incoming/` if the owner wants them used.')
    add('- **Design explorations** (dolphin-cloud, pastel axolotl, fluffy llama) are not assigned to any card (bible section 3).')
    add('- **No 3-stage family sheet for the Mistip line is delivered**; Nimbusail needs it before its IR (161) and SIR (174).')
    add('- **Art direction belongs to SOL.** Only 5 creatures (Cactuft, Bashlet, Rolyte, Frondolin, Flapod) are drawn in this repository. SOL designs every other creature, character, object and the Clasp from its earlier Wildkin art. No concept approval step: the first approved sheet of a subject becomes its reference, and later pictures (other poses, premium art) must match it.')
    add('- **Premium resolution.** A 1254 px 3x3 sheet gives 418 px cells, too small for full-art cards. Premium sheets must be at least 2100 x 2940 px (700 x 980 per cell).')
    add('\n## Counts\n')
    from collections import Counter
    cc=Counter(c['category'] for c in cards); rc=Counter(c['rarity']['value'] for c in cards)
    add('- Cards: %d (%s)'%(len(cards),', '.join('%s %d'%(k,v) for k,v in cc.items())))
    add('- Rarities: '+', '.join('%s %d'%(k,v) for k,v in rc.items()))
    add('- Species: %d in %d families (%d canon, %d inferred)'%(len(species),len(FAMILIES),sum(1 for f in FAMILIES if f[3]=='canon'),sum(1 for f in FAMILIES if f[3]=='inferred')))
    add('- Art assets required: %d (%d approved)'%(len(assets),sum(1 for a in assets.values() if a.get('status')=='approved')))
    return '\n'.join(L)+'\n'

def rules_md(m):
    """A readable rules reference: the rules of play and every card's text, generated from the manifest."""
    L=['# Wildkin: First Bond rules and card reference','','Generated from `wildkin-production/manifest.json` by `tools/wildkin_manifest.py` (do not edit). Card rules were designed on 2026-10-15 (`tools/wildkin_design.py`); the engine that plays them is `src/engine/tcg_rules.js`.','','## Rules of play','']
    for k,v in m['rules'].items():
        if k!='version': L.append('- **%s.** %s'%(k.capitalize(),v))
    L+=['','## Weakness','','Each affinity is weak to exactly one other (double damage). No resistance.','','| Affinity | Weak to |','|---|---|']+['| %s | %s |'%(k,v) for k,v in m['weakness'].items()]
    sp={s['id']:s for s in m['species']}; cost=lambda c: ' '.join('{%s}'%('any' if x=='C' else {'V':'Verdant','T':'Tide','S':'Stone','I':'Iron','E':'Ember','L':'Storm','A':'Astral','D':'Dusk','W':'Wonder'}[x]) for x in c)
    L+=['','## Creatures (001-074)','']
    for c in m['cards']:
        if c['category']!='creature': continue
        s=sp[c['species']]; g=c['gameplay']; a=s['affinity']
        L.append('**%03d %s** (%s, %s%s), %s%s. HP %d, weak to %s, retreat %d.'%(c['number'],c['name'],c['rarity']['value'],s['stage_label'],', evolves from '+sp[s['evolves_from']]['name'] if s['evolves_from'] else '',a['primary'],' / '+a['secondary'] if a['secondary'] else '',g['hp'],g['weakness'],g['retreat']))
        if g.get('ability'): L.append('- Ability: **%s**. %s'%(g['ability']['name'],g['ability']['text']))
        for t in g['attacks']: L.append('- %s **%s** %s%s'%(cost(t['cost']),t['name'],t['damage_label'],('. '+t['text']) if t['text'] else ''))
        L.append('')
    for cat,title in (('ally','Allies (075-092)'),('gear','Gear (093-110)'),('biome','Biomes (111-119)'),('tactic','Tactics (120-131)'),('essence','Essence (132-140)')):
        L+=['## '+title,'']
        for c in m['cards']:
            if c['category']==cat: L.append('- **%03d %s** (%s): %s'%(c['number'],c['name'],c['rarity']['value'],c['gameplay']['rules']))
        L.append('')
    L+=['## Premium prints (141-180)','','Each plays exactly as its base card.','']+['- %03d %s: plays as %s'%(c['number'],c['roster_name'],c['identity_of']) for c in m['cards'] if c['category']=='premium']
    return '\n'.join(L)+'\n'

def validate(m):
    errs=[]; cards=m['cards']; ids=[c['id'] for c in cards]
    if len(cards)!=180: errs.append('expected 180 cards, got %d'%len(cards))
    if len(set(ids))!=len(ids): errs.append('duplicate card ids')
    if [c['number'] for c in cards]!=list(range(1,181)): errs.append('numbers are not 1..180 in order')
    want={'creature':74,'ally':18,'gear':18,'biome':9,'tactic':12,'essence':9,'premium':40}
    from collections import Counter
    got=Counter(c['category'] for c in cards)
    for k,v in want.items():
        if got[k]!=v: errs.append('%s: %d, want %d'%(k,got[k],v))
    ranges={'creature':(1,74),'ally':(75,92),'gear':(93,110),'biome':(111,119),'tactic':(120,131),'essence':(132,140),'premium':(141,180)}
    for c in cards:
        lo,hi=ranges[c['category']]
        if not lo<=c['number']<=hi: errs.append('%s outside its category range'%c['id'])
    prem=Counter(c['premium_kind'] for c in cards if c['category']=='premium')
    if dict(prem)!={'IR':18,'FA':14,'SIR':4,'CSR':4}: errs.append('premium mix wrong: %s'%dict(prem))
    sp={s['id']:s for s in m['species']}
    for s in m['species']:
        if s['evolves_from'] and sp[s['evolves_from']]['evolves_to']!=s['id']: errs.append('evolution link broken at '+s['id'])
        if s['evolves_from'] and sp[s['evolves_from']]['family']!=s['family']: errs.append('evolution crosses families at '+s['id'])
    canon_lines=[('Prismotl','Opalotl','Aurorotl'),('Bashlet','Maceback','Fortisaur'),('Koilet','Runakoi','Koirune'),('Rolyte','Shelladin','Aegisopod'),('Frondolin','Pangrove','Canopang'),('Candicoil','Spiramel'),('Creskit','Astrynx'),('Berribat','Pompyre'),('Mistip','Cumulfin','Nimbusail')]
    byn={s['name']:s for s in m['species']}
    for line in canon_lines:
        for a,b in zip(line,line[1:]):
            if byn[b]['evolves_from']!=byn[a]['id']: errs.append('canon line broken: %s -> %s'%(a,b))
        if byn[line[-1]]['evolves_to']: errs.append(line[-1]+' should be final')
    for nm in ('Cactuft','Flapod'):
        if byn[nm]['stages_in_family']!=1: errs.append(nm+' must be standalone')
    assets=m['art_assets']; cid=set(ids)
    for c in cards:
        a=c['art']
        for k in ('subject','background','illustration','interim'):
            if a.get(k) and a[k] not in assets: errs.append('%s: art %s=%s not in art_assets'%(c['id'],k,a[k]))
        if c['category']=='premium':
            base=next(x for x in cards if x['id']==c['identity_of'])
            if a['illustration'] in (base['art'].get('subject'),base['art'].get('illustration')): errs.append(c['id']+' premium art reuses its base art')
    used=Counter(c['art'].get('illustration') for c in cards if c['category']=='premium')
    if any(v>1 for v in used.values()): errs.append('two premium cards share one illustration')
    for aid,a in assets.items():
        for l in a['linked_cards']:
            if l not in cid: errs.append('asset %s links unknown card %s'%(aid,l))
    for t in m['_sheets']:
        if len(t['cells'])!=(1 if t['kind']=='single-illustration' else 9): errs.append(t['task_id']+' does not have 9 cells')
    for s in m['species']:
        if not any(a.get('species')==s['id'] for a in assets.values()): errs.append('no art planned for '+s['id'])
    sheets_with=[t['task_id'] for t in m['_sheets'] if t['task_id'].startswith('SHEET-')]
    if len(sheets_with)!=43: errs.append('expected the 43 numbered sheets, got %d'%len(sheets_with))
    if len([t for t in m['_sheets'] if t['task_id'].startswith('SIR-')])!=4: errs.append('expected 4 SIR singles')
    planned=set(a for t in m['_sheets'] for c in t['cells'] for a in [c.get('asset_id')] if a)
    for aid in assets:
        if aid not in planned and not aid.startswith('scene.'): errs.append('asset %s is not on any sheet'%aid)
    return errs

def render_queue_md(S, assets):
    L=['# Wildkin Set 001 art queue','','Generated from `wildkin-production/manifest.json` by `tools/wildkin_manifest.py`. **Do not edit by hand.** SOL: read `SOL_HANDOFF.md` first. Machine-readable version: `art_queue.json`.','',
       'Status: **complete** = every cell approved, **partial** = some cells approved (they will not be overwritten), **todo** = nothing yet.','']
    tot=sum(t['production']['required_cells'] for t in S); ok=sum(t['production']['approved_cells'] for t in S)
    L.append('Overall: %d of %d required cells approved.'%(ok,tot)); L.append('')
    L.append('| Task | What | Kind | Status | Cells | Expected file |'); L.append('|---|---|---|---|---|---|')
    for t in S: L.append('| %s | %s | %s | %s | %d/%d | `incoming/%s` |'%(t['task_id'],t['title'],t['kind'],t['production']['status'],t['production']['approved_cells'],t['production']['required_cells'],t['expected_file']))
    for t in S:
        L+=['','## %s: %s'%(t['task_id'],t['title']),'',
            '- Expected file: `wildkin-production/incoming/%s` (plus optional `%s.json` with provenance)'%(t['expected_file'],t['task_id']),
            '- Layout: %s'%t.get('layout',''),'- Style: %s'%t.get('style',''),'- Minimum size: %d x %d px, aspect %s'%(t['min_px'][0],t['min_px'][1],t['aspect'])]
        if t.get('chroma'): L.append('- Screen colour: %s'%t['chroma'])
        L.append('- Identity status: %s'%t.get('identity_status',''))
        L.append('- Production: %s (%d/%d cells approved)'%(t['production']['status'],t['production']['approved_cells'],t['production']['required_cells']))
        if t.get('identity'):
            L.append('- Subjects:')
            for i in t['identity']:
                if 'species' in i: L.append('  - %s **%s** (%s%s), affinity %s. %s Look: %s'%(i['species'],i['name'],i['stage'],', evolves from '+i['evolves_from'] if i['evolves_from'] else '',i['affinity'],('Role: '+i['role']+'.') if i.get('role') else '',i['visual_identity']['text'] if i['visual_identity']['status']=='established' else '_SOL designs it (first approved sheet becomes the reference)_'))
                else: L.append('  - %s **%s**: %s'%(i['card'],i['name'],i['identity']['text']))
        L.append(''); L.append('| Cell | Asset ID | Subject | Pose | Status |'); L.append('|---|---|---|---|---|')
        for c in t['cells']:
            st=assets[c['asset_id']]['status'] if c.get('asset_id') else 'leave empty'
            L.append('| %d | %s | %s | %s | %s |'%(c['cell'],'`%s`'%c['asset_id'] if c.get('asset_id') else '-',c['subject'],c.get('pose') or '',st))
    return '\n'.join(L)+'\n'

def outstanding(m, S):
    A=m['art_assets']; cards=m['cards']; ok=lambda a: a and A.get(a,{}).get('status')=='approved'
    def need(c):
        a=c['art']; return [x for x in (a.get('subject'),a.get('background'),a.get('illustration')) if x]
    done=[c for c in cards if c['art']['layout']!='vector-essence' and all(ok(x) for x in need(c))]
    interim=[c for c in cards if c['art'].get('interim') and ok(c['art']['interim']) and not ok(c['art'].get('illustration'))]
    vec=[c for c in cards if c['art']['layout']=='vector-essence']
    L=['# Outstanding art for First Bond','','Generated by `tools/wildkin_manifest.py` from the approved registry. Rerun it (or approve art with `tools/wildkin_art.py`) to refresh.','',
       '| | Cards |','|---|---|','| Finished art (every piece approved) | %d |'%len(done),'| Interim art (biome card showing an approved scene of its biome) | %d |'%len(interim),
       '| Vector design, no painting needed (Essence) | %d |'%len(vec),'| Waiting for art (labelled placeholder in the game) | %d |'%(len(cards)-len(done)-len(interim)-len(vec)),'']
    cats={}
    for c in cards: cats.setdefault(c['category'],[0,0]); cats[c['category']][1]+=1; cats[c['category']][0]+=(c in done)
    L+=['| Category | Finished | Total |','|---|---|---|']+['| %s | %d | %d |'%(k,v[0],v[1]) for k,v in cats.items()]+['']
    L+=['## Cards with finished art','',', '.join('%03d %s'%(c['number'],c['roster_name']) for c in done) or 'None yet.','']
    L+=['## By production task','','| Task | Status | Missing cells | Blocked by |','|---|---|---|---|']
    for t in S:
        miss=[str(c['cell']) for c in t['cells'] if c.get('asset_id') and A[c['asset_id']]['status']!='approved']
        blk=[]
        if 'inferred' in str(t.get('identity_status','')): blk.append('owner must confirm the inferred family links')
        L.append('| %s | %s | %s | %s |'%(t['task_id'],t['production']['status'],', '.join(miss) or '-','; '.join(blk) or '-'))
    L+=['','## Pieces approved but not used by any card','','Extra poses from the owner\'s earlier sheets are kept in `approved/` for later variants (for example a second pose for a premium print or a pose library).','']
    return '\n'.join(L)+'\n'

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); a=ap.parse_args()
    regp=os.path.join(WP,'approved','registry.json'); registry=json.load(open(regp)) if os.path.exists(regp) else {'assets':{}}
    species,cards,assets=build(registry); S=sheets(species,cards,assets); queue_status(S,assets,registry)
    m={'schema':'wildkin-manifest/1','manifest_version':MANIFEST_VERSION,'generated_by':'tools/wildkin_manifest.py',
       'sources':{'bible':'design/wildkin-v1-production-bible.md','roster':'wildkin-production/source/appendix_a_roster.tsv','universe':'design/wildkin-universe.md','scene_library':'assets/manifest.json'},
       'status_legend':{'canon':'stated in the bible or the owner design doc','canon-rule':'follows the owner rule for rarity by stage','inferred':'follows from canon numbering and the sheet plan, needs owner confirmation','designed':'card rules designed by Claude Code under the owner instruction of 2026-10-15','decided':'reasoned choice under the owner instruction of 2026-10-15 where the bible left it open','provisional':'an engine number still open (release date, code, prices, odds), not canon','unresolved':'unknown'},
       'rules':WD.RULES,'weakness':WD.WEAKNESS,
       'set':{'id':'WK-S001','number':1,'name':'First Bond','name_status':'canon','code':'FBD','code_status':'decided','total':180,'base':140,'premium':40,
              'release_date':{'value':'2026-06-08','status':'decided','note':'engine calendar: a new game starts on 2026-06-01, so First Bond launches one week in (owner, 2026-10-15). Announced with preorders on day one'},
              'pack':{'cards':10,'slots':[{'slot':'common','count':6,'note':'one of the six can be a reverse holo of any common, uncommon or rare (provisional: 1 in 2 packs)'},{'slot':'uncommon','count':2},{'slot':'rare-or-better','count':1},{'slot':'essence','count':1}],'status':'canon (6/2/1/1)'},
              'rare_slot_odds':{'status':'decided','note':'per pack; tuned with the headless economy check','rare':0.6215,'rare_holo':0.25,'ir':0.0835,'fa':0.0334,'sir':0.0083,'csr':0.0033},
              'box':{'packs':36,'status':'decided'},'msrp':{'pack':4.5,'box':150,'status':'decided'}},
       'affinities':[{'id':a[0],'name':a[1],'order':i,'colour':a[2],'dark':a[3],'light':a[4],'status':'canon','colour_status':'provisional'} for i,a in enumerate(AFFINITIES)],
       'legacy_prototype_types':{'note':'The prototype used Flame, Tide, Grove, Radiant, Void, Frost, Storm, Stone, Lunar. Prototype cards are NOT migrated: their creatures are not canon. Prototype saves are kept unchanged and marked legacy (see CLAUDE.md).'},
       'rarities':{'common':{'name':'Common','symbol':'●'},'uncommon':{'name':'Uncommon','symbol':'◆'},'rare':{'name':'Rare','symbol':'★'},'essence':{'name':'Essence','symbol':''},'ir':{'name':'Illustration Rare','symbol':'★ IR'},'fa':{'name':'Full Art','symbol':'★ FA'},'sir':{'name':'Special Illustration Rare','symbol':'★★ SIR'},'csr':{'name':'Clasped Secret Rare','symbol':'✦ CSR'}},
       'families':[{'id':f[0],'members':['SP-%03d'%n for n in f[1]],'kind':f[2],'status':f[3],'sheet':f[4],'role':f[5]} for f in FAMILIES],
       'species':species,'cards':cards,'art_assets':assets}
    m['_sheets']=S; errs=validate(m); del m['_sheets']
    if errs:
        print('VALIDATION FAILED'); [print(' -',e) for e in errs]; sys.exit(1)
    q={'schema':'wildkin-art-queue/1','manifest_version':MANIFEST_VERSION,'generated_by':'tools/wildkin_manifest.py','handoff':'wildkin-production/SOL_HANDOFF.md','tasks':S}
    outs={os.path.join(WP,'manifest.json'):json.dumps(m,indent=1,ensure_ascii=False)+'\n',os.path.join(WP,'art_queue.json'):json.dumps(q,indent=1,ensure_ascii=False)+'\n',
          os.path.join(WP,'ART_QUEUE.md'):render_queue_md(S,assets),os.path.join(WP,'reports','reconciliation.md'):reconcile(species,cards,assets,S,registry),os.path.join(WP,'reports','outstanding_assets.md'):outstanding(m,S),os.path.join(WP,'RULES.md'):rules_md(m)}
    if a.check:
        bad=[p for p,t in outs.items() if not os.path.exists(p) or open(p,encoding='utf-8').read()!=t]
        if bad: print('OUT OF DATE (run tools/wildkin_manifest.py):',*[os.path.relpath(p,ROOT) for p in bad]); sys.exit(1)
        print('manifest OK: 180 cards, validation passed, files up to date'); return
    for p,t in outs.items():
        os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'w',encoding='utf-8').write(t)
    from collections import Counter
    print('wrote manifest: %d cards, %d species, %d art assets (%d approved), %d art tasks'%(len(cards),len(species),len(assets),sum(1 for x in assets.values() if x['status']=='approved'),len(S)))
    print('rarities:',dict(Counter(c['rarity']['value'] for c in cards)))
if __name__=='__main__': main()
