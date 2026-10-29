#!/usr/bin/env python3
"""Writes the Broken Reach catalogue (BR_SETS, BR_CARDS, BR_ALTS) in front of the card-game code in the tcg build.
The catalogue is broken-reach-production/set01/cards.json (the owner's handoff, proposed, not canon). Called by build.py."""
import os, json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def approved_art():
    """ids of pictures the owner approved (broken-reach-production/approved/registry.json) and their files"""
    rp=os.path.join(ROOT,'broken-reach-production','approved','registry.json')
    if not os.path.exists(rp): return {}
    R=json.load(open(rp,encoding='utf-8'))['assets']; return {i:r for i,r in R.items() if r.get('status')=='approved' and not i.startswith('MASTER-')}
def build(out=None):
    d=json.load(open(os.path.join(ROOT,'broken-reach-production','set01','cards.json'),encoding='utf-8'))
    cards=[{'i':c['base_card_id'],'n':c['name'],'t':c['typeName'],'a':c['aff'],'r':c['rar'],'m':c['mask'],'A':c['atk'],'G':c['grd'],'x':c['text'],'ro':c['role'],'e':c['era'],'p':1 if c['type']=='planet' else 0} for c in d['cards']]
    alts=[{'i':a['printing_id'],'b':a['base_card_id'],'tr':a['treatment']} for a in d['alternates']]
    sets=[{'code':'BR01','name':d['name'],'rel':'2026-08-14','year':2026,'era':'Book 1','tot':len(cards),'size':len(cards)+len(alts)}]
    art={}
    if out:
        from PIL import Image
        ad=os.path.join(out,'art'); os.makedirs(ad,exist_ok=True)
        for i in approved_art():
            src=os.path.join(ROOT,'broken-reach-production','approved','art',i+'.webp')
            if not os.path.exists(src): continue
            im=Image.open(src).convert('RGB'); im.thumbnail((800,600)); im.save(os.path.join(ad,'br-'+i+'.webp'),'WEBP',quality=80); art[i]={'u':'art/br-'+i+'.webp'}
    js='const BR_SETS='+json.dumps(sets,separators=(',',':'))+';\nconst BR_CARDS='+json.dumps(cards,separators=(',',':'),ensure_ascii=False)+';\nconst BR_ALTS='+json.dumps(alts,separators=(',',':'))+';\nconst BR_ART_MAP='+json.dumps(art,separators=(',',':'))+';\n'
    return js,len(cards),len(alts),len(art)
if __name__=='__main__': print(build()[1:])
