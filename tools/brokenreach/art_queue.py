#!/usr/bin/env python3
"""Builds the Broken Reach art queue: broken-reach-production/art_queue.json and ART_QUEUE.md.   python3 tools/brokenreach/art_queue.py [--check]
Master art designs first (gate G5), then production batches of at most 12 pictures (base cards: main cast, Legendary, Super Rare, planets, Rare, Uncommon,
Common), then the 27 premium alternate arts in batches of nine. Every picture has one stable id and file name (BR01-001_base.png, BR01-IL-01.png), its
SOL brief from the handoff, a deliberately different shot, the master designs to match and, for a premium art, the base picture it must differ from.
Everything is a proposal until the owner approves it."""
import json, os, sys, hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); BP=os.path.join(ROOT,'broken-reach-production')
D=json.load(open(os.path.join(BP,'set01','cards.json'),encoding='utf-8')); C=D['cards']; A=D['alternates']
CAST=[('kaia-venn','Kaia Venn','Kaia Venn'),('tavi','Tavi','Tavi'),('dorrak','Dorrak','Dorrak'),('elias-voss','Elias Voss','Elias Voss'),('lyssara-vale','Lyssara Vale','Lyssara Vale'),('neru-sael','Neru Sael','Neru Sael'),('rix-vanno','Rix Vanno','Rix Vanno'),('silas-veyne','Silas Veyne','Silas Veyne')]
SPECIES=[('orren','Orren','small agile tawny fur, expressive ears'),('dravak','Dravak','heavy plated four-eyed, built for high gravity'),('vaelari','Vaelari','elegant cranial structures, bioluminescent markings'),('selyth','Selyth','amphibious blue-green, external suits'),('khepri','Khepri','six-limbed chitin'),('thessari','Thessari','crystalline beings in mobility frames')]
SHOTS_UNIT=['three-quarter hero view, low camera','tight portrait, shallow focus, strong rim light','over-the-shoulder, subject facing into the scene','high overhead angle, subject small in a big space','profile silhouette against a hard light source','dutch-angle mid-action, motion in the frame','framed through a doorway or hatch','mid-shot with a large foreground object','long-lens compressed depth, crowd or machinery behind','worm\'s-eye view looking up at the subject','wide establishing shot, subject off-centre','close on hands and tools, subject partly out of frame']
SHOTS_SHIP=['three-quarter hero view, engines visible','steep top-down dive','head-on approach, strong foreshortening','rear three-quarter, thrusters glowing','docked beside a gantry, crew scale visible','mid-burn with debris and heat haze','side profile along a long hull, backlit','low pass over a surface, dust trail','emerging from a gate flare','silhouetted against a planet limb']
def species_of(c):
    t=(c['brief']+' '+c['name']).lower(); return [s for s,_,_ in SPECIES if s in t]
def masters_of(c):
    r=[f'MASTER-{k}' for k,_,p in CAST if c['name'].startswith(p)]; r+= [f'MASTER-{s}' for s in species_of(c)]; return r
def clean(b): return b.replace('; cinematic grounded sci-fi, distinct framing and action; no text/card frame','').replace('; no text/card frame','').strip()
def tier(c):
    n=c['name']
    if any(n.startswith(p) for _,_,p in CAST): return 0
    return {'L':1,'SR':2}.get(c['rar'],{'R':4,'U':5,'C':6}.get(c['rar'],6)) if c['type']!='planet' else 3
items=[]
for k,nm,p in CAST:
    c=next(x for x in C if x['name'].startswith(p)); items.append({'id':f'MASTER-{k}','file':f'MASTER-{k}.png','kind':'master','batch':'M00','name':nm,'brief':f'Master design sheet for {nm}: three-quarter full body, front, profile and back, plus three expressions. Canon: {clean(c["brief"])}. Neutral background, no text.','refs':[]})
for k,nm,desc in SPECIES:
    items.append({'id':f'MASTER-{k}','file':f'MASTER-{k}.png','kind':'master','batch':'M00','name':nm+' (species)','brief':f'Species design sheet for the {nm}: {desc}. Full body front, profile and back, two individuals of different build, two typical outfits, plus a close-up of the face. Neutral background, no text.','refs':[]})
base=sorted(C,key=lambda c:(tier(c),c['base_card_id'])); ship_i=unit_i=0
for i,c in enumerate(base):
    ship=c['type']=='ship'; shot=(SHOTS_SHIP[ship_i%len(SHOTS_SHIP)] if ship else SHOTS_UNIT[unit_i%len(SHOTS_UNIT)]); ship_i+=ship; unit_i+=(not ship)
    items.append({'id':c['base_card_id'],'file':c['base_card_id']+'_base.png','kind':'base','batch':'B%02d'%(i//12+1),'card':c['base_card_id'],'name':c['name'],'type':c['typeName'],'aff':c['aff'],'rar':c['rar'],
      'brief':clean(c['brief']),'shot':shot,'refs':masters_of(c),'prompt':clean(c['brief'])+'. Shot: '+shot+'.'})
order={'EC':0,'SR':1,'IR':2}; alts=sorted(A,key=lambda a:(order[a['treatment']],a['printing_id']))
for i,a in enumerate(alts):
    c=next(x for x in C if x['base_card_id']==a['base_card_id']); shot=SHOTS_UNIT[(i*5+3)%len(SHOTS_UNIT)]
    items.append({'id':a['printing_id'],'file':a['printing_id']+'.png','kind':'alt','batch':'A%02d'%(i//9+1),'card':a['base_card_id'],'name':c['name']+' ('+{'IR':'Illustration Rare','SR':'Signature Rare','EC':'Eclipse Rare'}[a['treatment']]+')','type':c['typeName'],'aff':c['aff'],'rar':{'IR':'IR','SR':'SIG','EC':'ECL'}[a['treatment']],
      'brief':clean(c['brief']),'shot':shot,'refs':masters_of(c),'differs_from':a['base_card_id'],'prompt':a['art_direction']+'. Subject: '+clean(c['brief'])+'. Shot: '+shot+'. Must be a different moment, composition and setting from '+a['base_card_id']+'_base.'})
Q={'franchise':'broken-reach','set':'BR01','status':'proposed (handoff v0.1); nothing approved','spec':{'format':'PNG (WebP or JPEG accepted)','aspect':'landscape 4:3','min_size':[1600,1200],'text':'none: no text, borders, rarity icons or arrows in the picture','safe_area':'the main action stays inside the central 70% (cards crop the edges)','naming':'BR01-001_base.png, BR01-IL-01.png, revisions -v02 (never overwrite)'},
   'batches':sorted({i['batch'] for i in items},key=lambda b:('MBA'.index(b[0]),b)),'items':items}
txt=json.dumps(Q,indent=1,ensure_ascii=False)+'\n'
md=['# Broken Reach art queue','',f'{len(items)} pictures: {sum(i["kind"]=="master" for i in items)} master design sheets (gate G5: owner approval before any card art), {sum(i["kind"]=="base" for i in items)} base cards, {sum(i["kind"]=="alt" for i in items)} premium alternate arts. Generated by `tools/brokenreach/art_queue.py`; status of each picture lives in `approved/registry.json`.','']
for b in Q['batches']:
    its=[i for i in items if i['batch']==b]; md+=[f'## {b}: {len(its)} pictures','','| File | What | Shot | Match |','|---|---|---|---|']
    for i in its: md.append(f"| {i['file']} | {i['name']}{(' · '+i['rar']) if i.get('rar') else ''} | {i.get('shot','sheet')} | {', '.join(i['refs']) or ''} |")
    md.append('')
mdt='\n'.join(md)+'\n'
if '--check' in sys.argv:
    ok=os.path.exists(os.path.join(BP,'art_queue.json')) and open(os.path.join(BP,'art_queue.json'),encoding='utf-8').read()==txt and open(os.path.join(BP,'ART_QUEUE.md'),encoding='utf-8').read()==mdt
    print('OK: %d pictures'%len(items) if ok else 'art queue is stale'); sys.exit(0 if ok else 1)
open(os.path.join(BP,'art_queue.json'),'w',encoding='utf-8').write(txt); open(os.path.join(BP,'ART_QUEUE.md'),'w',encoding='utf-8').write(mdt); print('wrote',len(items),'pictures in',len(Q['batches']),'batches')
