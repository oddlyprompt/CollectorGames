#!/usr/bin/env python3
"""Tidemark art intake: SOL's delivery into tidemark-production/approved/.

  python3 tools/tidemark/art_intake.py DELIVERY_DIR [--by NAME] [--replace]
  python3 tools/tidemark/art_intake.py --approve all|TMI-0001,TMI-0002 --note "owner's words"

DELIVERY_DIR holds the extracted delivery zips (any folder layout): the handoff (reports/production-status.csv,
delivery-parts.json, ...) and the parts (tidemark-production/art/TMI-*.png). Nothing is trusted blindly:
  - every picture must be listed in the handoff with a matching sha256,
  - every listed picture must be one this checklist asked for, on the same sheet and cell (art_queue.json),
  - every picture must be landscape 4:3,
  - nothing already filed is replaced without --replace.
Each picture is stored as a WebP (quality 95, visually lossless; the delivered PNG's sha256 is kept) in
tidemark-production/approved/art/, recorded in approved/registry.json with its sheet, cell, card and SOL's review
state, and drawn into a labelled review sheet in tidemark-production/review/ (one JPEG per production sheet, the
pictures exactly as filed, with card titles) plus review/REVIEW.md. The handoff reports are copied to delivery/.
"Filed" is not "approved by the owner": each record says delivered-awaiting-owner-review until the owner signs off,
which --approve records (status approved, with the date and the owner's note); then rerun checklist.py."""
import os, sys, csv, json, glob, shutil, hashlib, argparse, datetime
from PIL import Image, ImageDraw, ImageFont
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TP=os.path.join(ROOT,'tidemark-production')

def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20),b''): h.update(b)
    return h.hexdigest()
def font(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p,n)
    return ImageFont.load_default()

def approve(ids,note):
    regp=os.path.join(TP,'approved','registry.json'); R=json.load(open(regp,encoding='utf-8'))
    ids=sorted(R['assets']) if ids=='all' else ids.split(',')
    bad=[i for i in ids if i not in R['assets']]
    if bad: sys.exit('not filed: '+', '.join(bad))
    day=datetime.date.today().isoformat(); n=0
    for i in ids:
        r=R['assets'][i]
        if r['status']!='approved': r.update(status='approved',approved=day,approved_note=note); n+=1
    json.dump(R,open(regp,'w',encoding='utf-8'),indent=1,ensure_ascii=False); open(regp,'a').write('\n')
    print('approved %d pictures (%d asked); now run python3 tools/tidemark/checklist.py'%(n,len(ids)))

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('delivery',nargs='?'); ap.add_argument('--by',default='SOL delivery, awaiting owner review'); ap.add_argument('--replace',action='store_true')
    ap.add_argument('--approve'); ap.add_argument('--note',default='approved by the owner'); a=ap.parse_args()
    if a.approve: return approve(a.approve,a.note)
    if not a.delivery: ap.error('DELIVERY_DIR or --approve is needed')
    # a delivery is one or many extracted zips: every reports/production-status.csv found is merged (a picture sent twice keeps its last row)
    stat=sorted(glob.glob(os.path.join(a.delivery,'**','reports','production-status.csv'),recursive=True))
    if not stat: sys.exit('no handoff (reports/production-status.csv) in '+a.delivery)
    rows={}
    for sf in stat:
        for r in csv.DictReader(open(sf,encoding='utf-8')): rows[r['illustration']]=r
    status=[sf for sf in glob.glob(os.path.join(a.delivery,'**','reports','delivery-parts.json'),recursive=True)]
    H=os.path.dirname(os.path.dirname(stat[0]))
    q=json.load(open(os.path.join(TP,'art_queue.json'),encoding='utf-8'))
    want={}; sheets={s['id']:s for s in q['sheets']}
    for s in q['sheets']:
        for c in s['cells']: want[c['illustration']]=(s['id'],c['cell'],c)
    files={os.path.basename(f):f for f in glob.glob(os.path.join(a.delivery,'**','tidemark-production','art','TMI-*.png'),recursive=True)}
    errs=[]
    for iid,r in rows.items():
        if iid not in want: errs.append('not in the checklist: '+iid); continue
        s,cell,c=want[iid]
        if (r['sheet'],int(r['cell']),r['card'])!=(s,cell,c['card']): errs.append('wrong place: %s is %s cell %s, expected %s cell %d'%(iid,r['sheet'],r['cell'],s,cell))
        fn=os.path.basename(r['file'])
        if fn!=os.path.basename(c['file']): errs.append('wrong filename for %s: %s'%(iid,fn))
        elif fn not in files: errs.append('missing picture '+fn)
        elif sha(files[fn])!=r['sha256']: errs.append('picture differs from the handoff: '+fn)
        else:
            w,h=Image.open(files[fn]).size
            if abs(w/h-4/3)>0.01: errs.append('%s is %dx%d, not 4:3'%(fn,w,h))
    # a delivery may be a supplement (a few waves of sheets): every cell of every sheet it carries must arrive; sheets it does not carry are not expected
    declared={r['sheet'] for r in rows.values()}
    for iid,(sh,_,_) in want.items():
        if iid not in rows and sh in declared: errs.append('not delivered: '+iid)
    if errs: print('INTAKE STOPPED (nothing filed):'); [print(' -',e) for e in errs[:40]]; sys.exit(1)
    adir=os.path.join(TP,'approved','art'); os.makedirs(adir,exist_ok=True)
    regp=os.path.join(TP,'approved','registry.json'); R=json.load(open(regp)) if os.path.exists(regp) else {'schema':'tidemark-art-registry/1','assets':{}}
    now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'); took=skipped=0
    for iid,r in sorted(rows.items()):
        if iid in R['assets'] and not a.replace: skipped+=1; continue
        s,cell,c=want[iid]; src=files[os.path.basename(r['file'])]
        out=os.path.join(adir,os.path.basename(r['file']).rsplit('.',1)[0]+'.webp')
        Image.open(src).convert('RGB').save(out,'WEBP',quality=95,method=6)
        R['assets'][iid]={'file':os.path.relpath(out,ROOT),'sha256':sha(out),'card':c['card'],'title':c['title'],'sheet':s,'cell':cell,
            'delivered_as':os.path.basename(r['file']),'delivered_sha256':r['sha256'],'size':list(Image.open(src).size),
            'sol_status':r['status'],'sol_note':r.get('review_note') or None,'correction':r.get('correction_source') or None,
            'status':'delivered-awaiting-owner-review','filed':now,'filed_by':a.by}
        took+=1
    json.dump(R,open(regp,'w',encoding='utf-8'),indent=1,ensure_ascii=False); open(regp,'a').write('\n')
    # the handoff's reports, for the record
    ddir=os.path.join(TP,'delivery'); os.makedirs(ddir,exist_ok=True)
    for sf in stat:
        part=os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(sf)))) or 'part'; pd=os.path.join(ddir,'parts',part); os.makedirs(pd,exist_ok=True)
        for f in glob.glob(os.path.join(os.path.dirname(sf),'*')):
            if os.path.isfile(f): shutil.copy2(f,os.path.join(pd,os.path.basename(f)))
    # labelled review sheets: the filed pictures, three across, titles under each
    rdir=os.path.join(TP,'review'); os.makedirs(rdir,exist_ok=True); W,Hh,cap=300,225,40; f1,f2=font(15),font(12)
    md=['# Tidemark art review','','Every delivered picture, exactly as filed, one image per production sheet (generated by `tools/tidemark/art_intake.py`). Cells left to right, top to bottom. Grey cells are deliberately empty. The status of every picture is in `../approved/registry.json`.','']
    for sid,s in sheets.items():
        if any(c['illustration'] not in R['assets'] for c in s['cells']): continue   # a sheet not delivered yet has no review image
        im=Image.new('RGB',(3*W+4*6,3*(Hh+cap)+4*6),(24,26,30)); d=ImageDraw.Draw(im)
        by={c['cell']:c for c in s['cells']}
        for k in range(9):
            x=6+(k%3)*(W+6); y=6+(k//3)*(Hh+cap+6); c=by.get(k+1)
            if c:
                p=Image.open(os.path.join(ROOT,R['assets'][c['illustration']]['file'])).convert('RGB').resize((W,Hh),Image.LANCZOS); im.paste(p,(x,y))
                d.text((x+2,y+Hh+3),'%d. %s'%(k+1,c['title'])[:38],fill=(240,236,226),font=f1); d.text((x+2,y+Hh+21),'%s  %s  %s'%(c['illustration'],c['faction'],c['type'])[:46],fill=(160,165,175),font=f2)
            else:
                d.rectangle([x,y,x+W-1,y+Hh-1],fill=(90,92,96)); d.text((x+2,y+Hh+3),'%d. empty (by design)'%(k+1),fill=(160,165,175),font=f1)
        p=os.path.join(rdir,sid+'.jpg'); im.save(p,'JPEG',quality=84,optimize=True)
        md+=['## %s: %s'%(sid,s['theme']),'','![%s](%s.jpg)'%(sid,sid),'']
    open(os.path.join(rdir,'REVIEW.md'),'w',encoding='utf-8').write('\n'.join(md)+'\n')
    print('filed %d pictures (%d already filed), %d review sheets, registry %s'%(took,skipped,len([1 for s_ in sheets.values() if all(c['illustration'] in R['assets'] for c in s_['cells'])]),os.path.relpath(regp,ROOT)))
if __name__=='__main__': main()
