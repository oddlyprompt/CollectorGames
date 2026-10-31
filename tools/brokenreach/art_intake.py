#!/usr/bin/env python3
"""Broken Reach art intake: SOL's pictures into broken-reach-production/approved/.

  python3 tools/brokenreach/art_intake.py DELIVERY_DIR [--replace] [--root DIR]
  python3 tools/brokenreach/art_intake.py --approve all|BR01-001,BR01-002 --note "owner's words"
  python3 tools/brokenreach/art_intake.py --status

DELIVERY_DIR holds extracted delivery files in any folder layout: pictures named by id (BR01-001_base.png, BR01-IL-01.png, MASTER-kaia-venn.png; a revision adds
-v02) and optionally manifests (production-status.csv, review-manifest.csv or .json; id or variant_id or base_card_id, file or art_file, sha256, artist_name, sheet, review_status)
that are checked picture by picture. Raw sheets, labelled contact sheets and continuity-lock reference copies are ignored (a lock whose sha256 differs from the filed picture is an error);
<id>_prompt.txt files are kept as provenance in approved/prompts/. Nothing is trusted blindly:
  - every picture must be one the art queue asked for (unknown names are rejected, so is a name that maps to no id),
  - shape follows the owner's direction (2026-10-31): base cards SQUARE (1:1 within 2%), premium arts PORTRAIT (width/height 0.6 to 0.85), master design sheets landscape; the
    old 1600 px minimum is waived by the owner: the shortest side must be at least 400 px, and the picture must decode completely (a truncated file is rejected),
  - with a status csv, the sha256 must match,
  - nothing already filed is replaced without --replace (a -vNN revision counts as a replacement and keeps the older file in approved/previous/).
Each picture is stored as a WebP (quality 95) in approved/art/ (masters in approved/masters/), recorded in approved/registry.json as delivered-awaiting-owner-review,
and drawn into a labelled contact sheet in review/ (one JPEG per batch). "Filed" is not "approved": --approve records the owner's sign-off. Only approved
pictures reach the game (tools/brokenreach_collect_build.py) and the battler."""
import os, sys, re, csv, json, glob, shutil, hashlib, argparse, datetime
from PIL import Image, ImageDraw, ImageFont
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20),b''): h.update(b)
    return h.hexdigest()
def font(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p,n)
    return ImageFont.load_default()
def paths(root): return os.path.join(root,'broken-reach-production')
def load(root):
    BP=paths(root); q=json.load(open(os.path.join(BP,'art_queue.json'),encoding='utf-8')); rp=os.path.join(BP,'approved','registry.json')
    R=json.load(open(rp,encoding='utf-8')) if os.path.exists(rp) else {'version':1,'assets':{}}
    return BP,q,{i['id']:i for i in q['items']},R,rp
def save(R,rp): os.makedirs(os.path.dirname(rp),exist_ok=True); json.dump(R,open(rp,'w',encoding='utf-8'),indent=1,ensure_ascii=False); open(rp,'a').write('\n')
NAME=re.compile(r'^(?P<id>(?:BR01-\d{3}|BR01-(?:IL|SI|EC)-\d{2}|MASTER-[a-z-]+?))(?:_base)?(?:-v(?P<v>\d{2}))?\.(?:png|webp|jpe?g)$',re.I)
def parse(fn):
    m=NAME.match(os.path.basename(fn))
    if not m: return None,1
    i=m.group('id'); i=i.upper() if not i.lower().startswith('master') else 'MASTER-'+i[7:].lower(); return i,int(m.group('v') or 1)
def approve(root,ids,note):
    BP,q,Q,R,rp=load(root); ids=sorted(a for a,r in R['assets'].items()) if ids=='all' else ids.split(',')
    bad=[i for i in ids if i not in R['assets']]
    if bad: sys.exit('not filed: '+', '.join(bad))
    day=datetime.date.today().isoformat(); n=0
    for i in ids:
        r=R['assets'][i]
        if r['status']!='approved': r.update(status='approved',approved=day,approved_note=note); n+=1
    save(R,rp); print('approved %d pictures (%d asked); now rebuild the game (python3 tools/build.py tcg)'%(n,len(ids)))
def status(root):
    BP,q,Q,R,rp=load(root); by={}
    for i in q['items']:
        r=R['assets'].get(i['id']); st=r['status'] if r else 'not delivered'; by.setdefault(i['batch'],{}).setdefault(st,0); by[i['batch']][st]+=1
    for b in q['batches']: print(b, by.get(b,{}))
def contact(root,batch,q,R):
    BP=paths(root); its=[i for i in q['items'] if i['batch']==batch and i['id'] in R['assets']]
    if not its: return
    cw,ch=400,300; cols=3; rows=(len(its)+cols-1)//cols; sheet=Image.new('RGB',(cols*cw,rows*(ch+34)),(18,20,24)); d=ImageDraw.Draw(sheet); f=font(15)
    for n,i in enumerate(its):
        r=R['assets'][i['id']]; p=os.path.join(BP,'approved','masters' if i['kind']=='master' else 'art',i['id']+'.webp'); x=(n%cols)*cw; y=(n//cols)*(ch+34)
        im=Image.open(p).convert('RGB'); im.thumbnail((cw,ch)); sheet.paste(im,(x,y)); d.text((x+4,y+ch+4),f"{i['id']}  {i['name'][:38]}",fill=(230,230,230),font=f); d.text((x+4,y+ch+20),r['status'],fill=(226,164,58),font=f)
    os.makedirs(os.path.join(BP,'review'),exist_ok=True); sheet.save(os.path.join(BP,'review',batch+'.jpg'),quality=88)
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('delivery',nargs='?'); ap.add_argument('--replace',action='store_true'); ap.add_argument('--root',default=ROOT)
    ap.add_argument('--approve'); ap.add_argument('--note',default='approved by the owner'); ap.add_argument('--status',action='store_true'); a=ap.parse_args()
    if a.status: return status(a.root)
    if a.approve: return approve(a.root,a.approve,a.note)
    if not a.delivery: ap.error('DELIVERY_DIR, --approve or --status is needed')
    BP,q,Q,R,rp=load(a.root)
    claimed={}
    def claim(r):
        i=(r.get('id') or r.get('variant_id') or r.get('base_card_id') or '').strip()
        if not i: return
        i=i.upper() if not i.lower().startswith('master') else 'MASTER-'+i[7:].lower()
        claimed[i]=dict(claimed.get(i,{}),**{k:v for k,v in {'sha256':r.get('sha256'),'artist':r.get('artist_name'),'sheet':r.get('sheet'),'review':r.get('review_status')}.items() if v})
    for sf in glob.glob(os.path.join(a.delivery,'**','*.csv'),recursive=True):
        try:
            for r in csv.DictReader(open(sf,encoding='utf-8')): claim(r)
        except Exception: pass
    for sf in glob.glob(os.path.join(a.delivery,'**','review-manifest.json'),recursive=True):
        try:
            for r in json.load(open(sf,encoding='utf-8')): claim(r if isinstance(r,dict) else {})
        except Exception: pass
    prompts={}
    for pf in glob.glob(os.path.join(a.delivery,'**','*_prompt.txt'),recursive=True):
        i,_=parse(os.path.basename(pf).replace('_prompt.txt','_base.png') if os.path.basename(pf).startswith('BR01-') else os.path.basename(pf).replace('_prompt.txt','.png'))
        if i: prompts[i]=pf
    files=[f for f in glob.glob(os.path.join(a.delivery,'**','*'),recursive=True) if os.path.isfile(f) and f.lower().endswith(('.png','.webp','.jpg','.jpeg'))]
    take={}; errs=[]; skip=[]; filed=0; support=0; locks=[]
    SUPPORT=re.compile(r'(raw|labelled|contact|preview)',re.I)
    for f in sorted(files):
        if SUPPORT.search(os.path.basename(f)) and not NAME.match(os.path.basename(f)): support+=1; continue
        i,v=parse(f)
        if i is None or i not in Q: errs.append(f'{os.path.basename(f)}: not a picture the queue asked for'); continue
        if 'continuity-lock' in f.replace('\\','/'): locks.append((i,f)); continue
        if i in take:
            if sha(take[i][0])==sha(f): continue                       # the same picture delivered twice
            if take[i][1]>=v and take[i][1]!=v: continue
            if take[i][1]==v: errs.append(f'{i}: two different pictures with the same name and version'); continue
        take[i]=(f,v)
    for i,f in locks:                                                  # a continuity-lock copy must be the filed picture
        cur=R['assets'].get(i); mine=sha(take[i][0]) if i in take else (cur or {}).get('sha256')
        if mine and sha(f)!=mine: errs.append(f'{i}: continuity-lock copy differs from the delivered picture')
    for i,(f,v) in sorted(take.items()):
        it=Q[i]
        try: im=Image.open(f); im.load()
        except Exception as e: errs.append(f'{i}: the picture is damaged or truncated ({str(e)[:60]})'); continue
        w,h=im.size
        if it['kind']=='master':
            if h>w: errs.append(f'{i}: a master design sheet must be landscape ({w}x{h})'); continue
        elif it['kind']=='base':
            if abs(w/h-1)>0.02: errs.append(f'{i}: base art must be square ({w}x{h})'); continue
        elif not (0.6<=w/h<=0.85): errs.append(f'{i}: premium art must be portrait, width/height 0.6 to 0.85 ({w}x{h})'); continue
        if min(w,h)<400: errs.append(f'{i}: {w}x{h} is below the minimum (400 px on the shortest side)'); continue
        c=claimed.get(i)
        if claimed and c and c.get('sha256') and c['sha256'].lower()!=sha(f): errs.append(f'{i}: sha256 does not match the status file'); continue
        if claimed and not c: errs.append(f'{i}: not listed in the delivery manifests'); continue
        cur=R['assets'].get(i)
        if cur and not a.replace: skip.append(f'{i}: already filed (use --replace for a new version)'); continue
        out=os.path.join(BP,'approved','masters' if it['kind']=='master' else 'art'); os.makedirs(out,exist_ok=True); dst=os.path.join(out,i+'.webp')
        if cur and os.path.exists(dst):
            pv=os.path.join(BP,'approved','previous'); os.makedirs(pv,exist_ok=True); shutil.copy(dst,os.path.join(pv,f"{i}-v{cur.get('v',1):02d}.webp"))
        im.convert('RGB').save(dst,'WEBP',quality=95); R['assets'][i]={'status':'delivered-awaiting-owner-review','v':v,'sha256':sha(f),'size':[w,h],'batch':it['batch'],'delivered':datetime.date.today().isoformat()}; filed+=1
        if c:
            for k in ('artist','sheet'):
                if c.get(k): R['assets'][i][k]=c[k]
            if c.get('review'): R['assets'][i]['sol_review']=c['review']
        if i in prompts:
            pd=os.path.join(BP,'approved','prompts'); os.makedirs(pd,exist_ok=True); shutil.copy(prompts[i],os.path.join(pd,i+'.txt'))
    save(R,rp); done=sorted({R['assets'][i]['batch'] for i in take if i in R['assets']})
    for b in done: contact(a.root,b,q,R)
    print(f'filed {filed} pictures; {len(errs)} rejected; {len(skip)} already filed; {support} support files (sheets, contact previews) ignored; {len(locks)} continuity-lock copies checked')
    for e in errs+skip: print('  '+e)
    sys.exit(1 if errs else 0)
if __name__=='__main__': main()
