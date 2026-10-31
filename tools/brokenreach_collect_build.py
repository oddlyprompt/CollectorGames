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
    pkg={}
    PK=os.path.join(ROOT,'broken-reach-production','approved','packaging')
    if out and os.path.isdir(PK):                       # the owner's approved card back, booster pack and booster box (2026-10-31), trimmed and given rounded corners
        from PIL import Image, ImageDraw
        def rounded(im,r):
            m=Image.new('L',im.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,im.size[0]-1,im.size[1]-1),radius=r,fill=255); im=im.convert('RGBA'); im.putalpha(m); return im
        for key,fn,box,rad,size in (('back','BR_CARD_BACK_APPROVED_v2.png',(50,75,975,1462),34,(500,750)),('pack','BR_SEALED_PACK_SET01_v3.png',(92,8,938,1528),10,(560,1010)),('box','BR_SEALED_BOX_SET01_v3.png',(28,60,1505,968),10,(900,560))):
            src=os.path.join(PK,fn)
            if not os.path.exists(src): continue
            im=rounded(Image.open(src).convert('RGB').crop(box),rad); im.thumbnail(size); im.save(os.path.join(out,'art','br-'+key+'.webp'),'WEBP',quality=88); pkg[key]={'u':'art/br-'+key+'.webp','w':im.size[0],'h':im.size[1]}
    js='const BR_SETS='+json.dumps(sets,separators=(',',':'))+';\nconst BR_CARDS='+json.dumps(cards,separators=(',',':'),ensure_ascii=False)+';\nconst BR_ALTS='+json.dumps(alts,separators=(',',':'))+';\nconst BR_ART_MAP='+json.dumps(art,separators=(',',':'))+';\nconst BR_PKG='+json.dumps(pkg,separators=(',',':'))+';\n'
    return js,len(cards),len(alts),len(art)
if __name__=='__main__': print(build()[1:])
