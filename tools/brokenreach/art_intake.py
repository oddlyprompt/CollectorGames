#!/usr/bin/env python3
"""Broken Reach art intake: SOL's pictures into broken-reach-production/approved/.

  python3 tools/brokenreach/art_intake.py DELIVERY_DIR [--replace] [--root DIR]
  python3 tools/brokenreach/art_intake.py --approve all|BR01-001,BR01-002 --note "owner's words"
  python3 tools/brokenreach/art_intake.py --status

DELIVERY_DIR holds extracted delivery files in any folder layout: pictures named by id (BR01-001_base.png, BR01-IL-01.png, MASTER-kaia-venn.png; a revision adds
-v02) and optionally a production-status.csv (columns id,file,sha256) that is checked picture by picture. Nothing is trusted blindly:
  - every picture must be one the art queue asked for (unknown names are rejected, so is a name that maps to no id),
  - the picture must be landscape 4:3 (within 2%) and at least 1600x1200 (masters: any landscape, at least 1600 wide),
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
    for sf in glob.glob(os.path.join(a.delivery,'**','production-status.csv'),recursive=True):
        for r in csv.DictReader(open(sf,encoding='utf-8')): claimed[(r.get('id') or '').strip().upper().replace('MASTER-','MASTER-')]=r
    files=[f for f in glob.glob(os.path.join(a.delivery,'**','*'),recursive=True) if os.path.isfile(f) and f.lower().endswith(('.png','.webp','.jpg','.jpeg'))]
    take={}; errs=[]; skip=[]; filed=0
    for f in sorted(files):
        i,v=parse(f)
        if i is None or i not in Q: errs.append(f'{os.path.basename(f)}: not a picture the queue asked for'); continue
        if i in take and take[i][1]>=v: continue
        take[i]=(f,v)
    for i,(f,v) in sorted(take.items()):
        it=Q[i]; im=Image.open(f); w,h=im.size; wait=4/3
        if h>w or (it['kind']!='master' and abs(w/h/wait-1)>0.02): errs.append(f'{i}: {w}x{h} is not landscape'+('' if it['kind']=='master' else ' 4:3')); continue
        if (it['kind']=='master' and w<1600) or (it['kind']!='master' and (w<1600 or h<1200)): errs.append(f'{i}: {w}x{h} is below the minimum (1600x1200)' if it['kind']!='master' else f'{i}: {w}px wide is below 1600'); continue
        c=claimed.get(i)
        if claimed and c and c.get('sha256') and c['sha256'].lower()!=sha(f): errs.append(f'{i}: sha256 does not match the status file'); continue
        if claimed and not c: errs.append(f'{i}: not listed in production-status.csv'); continue
        cur=R['assets'].get(i)
        if cur and not a.replace: skip.append(f'{i}: already filed (use --replace for a new version)'); continue
        out=os.path.join(BP,'approved','masters' if it['kind']=='master' else 'art'); os.makedirs(out,exist_ok=True); dst=os.path.join(out,i+'.webp')
        if cur and os.path.exists(dst):
            pv=os.path.join(BP,'approved','previous'); os.makedirs(pv,exist_ok=True); shutil.copy(dst,os.path.join(pv,f"{i}-v{cur.get('v',1):02d}.webp"))
        im.convert('RGB').save(dst,'WEBP',quality=95); R['assets'][i]={'status':'delivered-awaiting-owner-review','v':v,'sha256':sha(f),'size':[w,h],'batch':it['batch'],'delivered':datetime.date.today().isoformat()}; filed+=1
    save(R,rp); done=sorted({R['assets'][i]['batch'] for i in take if i in R['assets']})
    for b in done: contact(a.root,b,q,R)
    print(f'filed {filed} pictures; {len(errs)} rejected; {len(skip)} already filed')
    for e in errs+skip: print('  '+e)
    sys.exit(1 if errs else 0)
if __name__=='__main__': main()
