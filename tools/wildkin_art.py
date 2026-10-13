#!/usr/bin/env python3
"""Wildkin art intake: validate what SOL delivers, cut it, show it, and promote approved pieces into the game.

  python3 tools/wildkin_art.py status                 queue progress (cells approved per task)
  python3 tools/wildkin_art.py check [--ci]           validate every file in wildkin-production/incoming/, cut it, write a review report
  python3 tools/wildkin_art.py approve TASK [--cells 1,2] [--replace] [--allow-warnings] [--by NAME]
                                                     promote the newest checked delivery of TASK into approved/ (never overwrites unless --replace)
  python3 tools/wildkin_art.py reject TASK --reason "..."   move the delivery to rejected/ with the reason
  python3 tools/wildkin_art.py ingest [--auto-approve] [--build]   check everything, optionally approve clean deliveries and rebuild the game
  python3 tools/wildkin_art.py legacy [--koi N]       register the owner's earlier sheets in art-source/ (already approved) under manifest asset IDs

Rules it enforces
  * The only way into the game is approved/registry.json. An approved asset is never replaced because a new file exists:
    replacing needs --replace, and the old file is kept in approved/superseded/.
  * Every approved piece keeps its provenance: source file, its sha256, cell, delivery metadata, who approved it and when.
  * Running it twice does nothing new: deliveries are recognised by sha256.
Set WILDKIN_PRODUCTION to use another folder (the tests do)."""
import os, sys, json, re, shutil, hashlib, argparse, datetime, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
import ingest
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP=os.environ.get('WILDKIN_PRODUCTION') or os.path.join(ROOT,'wildkin-production')
INC, APP, REJ, REP = (os.path.join(WP,x) for x in ('incoming','approved','rejected','reports'))
SCREEN={'green':(40,160,60),'magenta':(235,18,128)}
FNAME=re.compile(r'^(SHEET-\d{2}|SIR-\d{3})(?:--v(\d+))?\.(png|PNG)$')

def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20),b''): h.update(b)
    return h.hexdigest()
def jload(p,default):
    return json.load(open(p,encoding='utf-8')) if os.path.exists(p) else default
def jsave(p,o):
    os.makedirs(os.path.dirname(p),exist_ok=True); tmp=p+'.tmp'; json.dump(o,open(tmp,'w',encoding='utf-8'),indent=1,ensure_ascii=False); os.replace(tmp,p)
def queue(): return {t['task_id']:t for t in jload(os.path.join(WP,'art_queue.json'),{'tasks':[]})['tasks']}
def manifest(): return jload(os.path.join(WP,'manifest.json'),{})
def registry(): return jload(os.path.join(APP,'registry.json'),{'schema':'wildkin-approved/1','assets':{}})
def intake(): return jload(os.path.join(REP,'intake.json'),{'schema':'wildkin-intake/1','deliveries':{}})

# ---------------------------------------------------------------- checking one delivery
def cell_kind(task):
    return {'cutout-sheet':'cutout','scene-sheet':'scene','illustration-sheet':'illustration','premium-sheet':'premium','single-illustration':'premium'}[task['kind']]
def screen_for(task, cell):
    ch=task.get('chroma','green')
    if ch in SCREEN: return ch
    return None   # mixed sheets: decided per cell from the border colour
def detect_screen(p):
    q=np.asarray(p).astype(float); ring=np.concatenate([q[:6].reshape(-1,3),q[-6:].reshape(-1,3),q[:,:6].reshape(-1,3),q[:,-6:].reshape(-1,3)]); m=np.median(ring,axis=0)
    d={k:float(np.abs(m-np.array(v)).sum()) for k,v in SCREEN.items()}; k=min(d,key=d.get); return k, d[k], m.tolist()
def check_file(path, task):
    """Returns (report, pieces): report is JSON-safe, pieces maps cell number to a PIL image for the cells that have an asset."""
    rep={'task':task['task_id'],'file':os.path.relpath(path,ROOT),'sha256':sha(path),'checked':now(),'errors':[],'warnings':[],'cells':[]}; pieces={}
    try: im=Image.open(path); im.load(); im=im.convert('RGB')
    except Exception as e: rep['errors'].append('cannot read image: %s'%e); return rep,pieces
    W,H=im.size; rep['size']=[W,H]; mw,mh=task['min_px']
    if W<mw or H<mh: rep['errors'].append('too small: %dx%d, need at least %dx%d'%(W,H,mw,mh))
    want=mw/mh
    if abs(W/H-want)/want>0.03: rep['errors'].append('wrong aspect: %.3f, want %.3f (%s)'%(W/H,want,task['aspect']))
    kind=cell_kind(task)
    if task['kind']=='single-illustration': boxes=[(0,0,W,H)]
    else:
        xr,yr=ingest.cells(im,3,3); boxes=[(x0,y0,x1,y1) for (y0,y1) in yr for (x0,x1) in xr]
        g=np.asarray(im.convert('L')).astype(float); col=g.mean(axis=0); gx=ingest.gutters(col,W,3)
        if not all(abs((a+b)/2-W*(i+1)/3)<W*0.04 and (b-a)<W*0.03 for i,(a,b) in enumerate(gx)): rep['warnings'].append('gutters not detected cleanly; cells were split evenly')
    for c in task['cells']:
        i=c['cell']-1; x0,y0,x1,y1=boxes[i]; inset=0 if task['kind']=='single-illustration' else 8
        p=im.crop((x0+inset,y0+inset,x1-inset,y1-inset)); cr={'cell':c['cell'],'asset_id':c.get('asset_id'),'errors':[],'warnings':[]}
        if kind=='cutout':
            want=screen_for(task,c); got,dist,med=detect_screen(p); cr['screen']=got
            if want and got!=want: cr['errors'].append('screen colour is %s, the task asks for %s'%(got,want))
            if dist>90: cr['warnings'].append('background is not a clean flat screen (median %s)'%[round(v) for v in med])
            k=ingest.key(p,got); k,gone=ingest.drop_stray(k); al=np.asarray(k)[...,3]; cov=float((al>40).mean()); cr['coverage']=round(cov,4); cr['stray_pieces_dropped']=gone
            if not c.get('asset_id'):
                if cov>0.02: cr['warnings'].append('this cell should be empty but has something in it')
                cr['empty']=True; rep['cells'].append(cr); continue
            if cov<0.015: cr['errors'].append('cell is empty'); rep['cells'].append(cr); continue
            if cov>0.85: cr['errors'].append('no transparent background after keying (wrong screen colour?)')
            ys,xs=np.where(al>40); h,w=al.shape; m=(int(xs.min()),int(ys.min()),int(w-1-xs.max()),int(h-1-ys.max())); cr['margins_LTRB']=list(m)
            if min(m)<3: cr['errors'].append('subject touches the cell edge (clipped): '+'+'.join(s for s,v in zip(['left','top','right','bottom'],m) if v<3))
            elif min(m)<int(0.04*min(w,h)): cr['warnings'].append('margin is tight (%d px); ask for about 10%%'%min(m))
            rgb=np.asarray(k)[...,:3].astype(int); op=al>200; sc=np.array(SCREEN[got])
            left=float(((np.abs(rgb-sc).sum(axis=2)<70)&op).sum()/max(1,op.sum())); cr['screen_left']=round(left,4)
            if left>0.004: cr['warnings'].append('screen colour left on the subject (%.1f%% of it)'%(left*100))
            semi=float(((al>20)&(al<235)).sum()/max(1,(al>20).sum())); cr['semi_transparent']=round(semi,3)
            if semi>0.35: cr['warnings'].append('a lot of half-transparent pixels (%.0f%%): soft edges or a glow on the screen'%(semi*100))
            if gone: cr['warnings'].append('%d stray mark(s) removed ("!" bursts, sparkles); check the piece'%gone)
            yy,xx=np.where(al>4); k=k.crop((max(0,int(xx.min())-4),max(0,int(yy.min())-4),min(w,int(xx.max())+5),min(h,int(yy.max())+5)))
            if max(k.size)>560: k.thumbnail((560,560),Image.LANCZOS)
            pieces[c['cell']]=('webp',k)
        else:
            a=np.asarray(p.convert('L')).astype(float); sd=float(a.std()); cr['std']=round(sd,1)
            if not c.get('asset_id'):
                if sd>18: cr['warnings'].append('this cell should be empty but has an image in it')
                cr['empty']=True; rep['cells'].append(cr); continue
            if sd<8: cr['errors'].append('cell is blank')
            pw,ph=p.size; cr['cell_px']=[pw,ph]
            if kind=='premium':
                if abs(pw/ph-5/7)/(5/7)>0.05: cr['errors'].append('cell is %.2f wide per tall, want 5:7 (0.71)'%(pw/ph))
                if pw<650: cr['warnings'].append('cell is only %d px wide; card art wants 700+'%pw)
                q=p.copy(); q.thumbnail((1000,1400),Image.LANCZOS); pieces[c['cell']]=('webp',q)
            else:
                q=p.copy(); q.thumbnail((900,900),Image.LANCZOS); pieces[c['cell']]=('jpg',q)
        rep['cells'].append(cr)
    for cr in rep['cells']:
        rep['errors']+=['cell %d: %s'%(cr['cell'],e) for e in cr['errors']]; rep['warnings']+=['cell %d: %s'%(cr['cell'],w) for w in cr['warnings']]
    rep['result']='fail' if rep['errors'] else 'warn' if rep['warnings'] else 'pass'
    return rep,pieces

def contact_sheet(task, rep, pieces, out):
    S=260; im=Image.new('RGB',(S*3,S*3+30),(128,128,128)); d=ImageDraw.Draw(im)
    for cr in rep['cells']:
        i=cr['cell']-1; x=(i%3)*S; y=(i//3)*S
        if task['kind']=='single-illustration': x=y=0
        p=pieces.get(cr['cell'])
        if p:
            q=p[1].convert('RGBA'); q.thumbnail((S-16,S-34)); im.paste(q,(x+(S-q.width)//2,y+22+(S-34-q.height)//2),q)
        col=(220,40,40) if cr['errors'] else (240,150,30) if cr['warnings'] else (60,180,90)
        if cr.get('empty'): col=(90,90,90)
        d.rectangle((x+2,y+2,x+S-3,y+S-3),outline=col,width=4)
        d.text((x+8,y+6),('%d %s'%(cr['cell'],cr.get('asset_id') or '(empty)'))[:40],fill=(0,0,0))
    d.text((6,S*3+8),'%s  %s  %s'%(task['task_id'],rep['result'].upper(),os.path.basename(rep['file'])),fill=(0,0,0))
    im.save(out)

def write_report_md(task, rep, path):
    L=['# %s: %s'%(task['task_id'],task['title']),'','- File: `%s`'%rep['file'],'- sha256: `%s`'%rep['sha256'],'- Checked: %s'%rep['checked'],'- Result: **%s**'%rep['result'],'','![contact sheet](contact.png)','']
    if rep['errors']: L+=['## Errors (block approval)','']+['- '+e for e in rep['errors']]+['']
    if rep['warnings']: L+=['## Warnings (need a human look)','']+['- '+w for w in rep['warnings']]+['']
    L+=['| Cell | Asset | Result |','|---|---|---|']+['| %d | %s | %s |'%(c['cell'],c.get('asset_id') or '(empty)','; '.join(c['errors']+c['warnings']) or ('empty as asked' if c.get('empty') else 'ok')) for c in rep['cells']]
    open(path,'w').write('\n'.join(L)+'\n')

def cmd_check(args, auto=False):
    Q=queue(); I=intake(); os.makedirs(INC,exist_ok=True); files=sorted(f for f in os.listdir(INC) if not f.startswith('.') and not f.endswith('.json') and f!='README.md'); bad=0; done=[]
    for f in files:
        m=FNAME.match(f); path=os.path.join(INC,f)
        if not m or m.group(1) not in Q:
            print('  ?  %s: not a known task file name (expected SHEET-NN.png or SIR-NNN.png, optional --vN)'%f); bad+=1; continue
        task=Q[m.group(1)]; h=sha(path)
        if h in I['deliveries'] and not args.force:
            r=I['deliveries'][h]; print('  =  %s: already checked (%s)'%(f,r['result'])); done.append(h); continue
        rep,pieces=check_file(path,task); meta=jload(os.path.join(INC,f.rsplit('.',1)[0]+'.json'),None)
        if meta is not None:
            rep['metadata']=meta
            if meta.get('task_id') not in (None,task['task_id']): rep['errors'].append('metadata task_id %s does not match the file name'%meta.get('task_id')); rep['result']='fail'
            if meta.get('manifest_version') and meta['manifest_version']!=manifest().get('manifest_version'): rep['warnings'].append('made against manifest %s, current is %s'%(meta['manifest_version'],manifest().get('manifest_version')))
        rd=os.path.join(REP,task['task_id'],h[:12]); os.makedirs(os.path.join(rd,'cells'),exist_ok=True)
        for cell,(ext,img) in pieces.items():
            img.save(os.path.join(rd,'cells','%d.%s'%(cell,ext)), 'WEBP' if ext=='webp' else 'JPEG', **({'quality':90,'alpha_quality':100,'method':6} if ext=='webp' else {'quality':86,'optimize':True}))
        contact_sheet(task,rep,pieces,os.path.join(rd,'contact.png')); jsave(os.path.join(rd,'report.json'),rep); write_report_md(task,rep,os.path.join(rd,'report.md'))
        I['deliveries'][h]={'task':task['task_id'],'file':f,'result':rep['result'],'checked':rep['checked'],'report':os.path.relpath(rd,WP),'errors':len(rep['errors']),'warnings':len(rep['warnings']),'state':'checked'}
        print('  %s  %s: %s, %d errors, %d warnings -> %s'%({'pass':'ok','warn':'!','fail':'X'}[rep['result']],f,rep['result'],len(rep['errors']),len(rep['warnings']),os.path.relpath(rd,ROOT)))
        if rep['result']=='fail': bad+=1
        done.append(h)
    jsave(os.path.join(REP,'intake.json'),I)
    if not files: print('  incoming/ is empty')
    if getattr(args,'ci',False) and bad: sys.exit(1)
    return done

# ---------------------------------------------------------------- promotion
def latest_for(task_id):
    I=intake(); c=[(h,r) for h,r in I['deliveries'].items() if r['task']==task_id and r['state']=='checked' and os.path.exists(os.path.join(INC,r['file']))]
    return sorted(c,key=lambda x:x[1]['checked'])[-1] if c else (None,None)
def approve(task_id, cells=None, replace=False, allow_warnings=False, by='owner'):
    Q=queue(); task=Q.get(task_id)
    if not task: sys.exit('unknown task '+task_id)
    h,rec=latest_for(task_id)
    if not h: sys.exit('no checked delivery for %s in incoming/ (run check first)'%task_id)
    rd=os.path.join(WP,rec['report']); rep=json.load(open(os.path.join(rd,'report.json'))); R=registry(); I=intake(); src=os.path.join(INC,rec['file'])
    keep=os.path.join(APP,'sources',task_id,'%s.png'%h[:12]); os.makedirs(os.path.dirname(keep),exist_ok=True)
    if not os.path.exists(keep): shutil.copy2(src,keep)
    meta=rep.get('metadata') or {}; took=[]; skipped=[]
    for cr in rep['cells']:
        aid=cr.get('asset_id')
        if not aid or cr.get('empty'): continue
        if cells and cr['cell'] not in cells: continue
        if cr['errors']: skipped.append((cr['cell'],'has errors')); continue
        if cr['warnings'] and not allow_warnings: skipped.append((cr['cell'],'has warnings (use --allow-warnings after looking)')); continue
        piece=[f for f in os.listdir(os.path.join(rd,'cells')) if f.split('.')[0]==str(cr['cell'])]
        if not piece: skipped.append((cr['cell'],'no cut piece')); continue
        ext=piece[0].split('.')[1]; dst=os.path.join(APP,'assets',aid+'.'+ext)
        if aid in R['assets'] and not replace: skipped.append((cr['cell'],'%s is already approved (use --replace to swap it)'%aid)); continue
        if aid in R['assets']:
            old=os.path.join(ROOT,R['assets'][aid]['file']); sup=os.path.join(APP,'superseded',aid,os.path.basename(old)+'.'+R['assets'][aid].get('sha256','')[:8])
            os.makedirs(os.path.dirname(sup),exist_ok=True)
            if os.path.exists(old): shutil.move(old,sup)
            prev=R['assets'][aid]; prev['superseded_by']=h[:12]; R.setdefault('history',[]).append(dict(asset_id=aid,**prev))
        os.makedirs(os.path.dirname(dst),exist_ok=True); shutil.copy2(os.path.join(rd,'cells',piece[0]),dst)
        R['assets'][aid]={'file':os.path.relpath(dst,ROOT),'sha256':sha(dst),'task':task_id,'cell':cr['cell'],'source':os.path.relpath(keep,ROOT),'source_sha256':h,
                          'approved':now(),'approved_by':by,'provenance':{'delivered_as':rec['file'],'metadata':meta},'checks':{k:cr[k] for k in ('margins_LTRB','coverage','screen','screen_left','stray_pieces_dropped','cell_px') if k in cr},'warnings_accepted':cr['warnings']}
        took.append(aid)
    jsave(os.path.join(APP,'registry.json'),R)
    if took:
        I['deliveries'][h]['state']='approved' if not skipped else 'partly-approved'; I['deliveries'][h]['approved_cells']=took
        done=os.path.join(APP,'sources',task_id,'delivered-'+rec['file'])
        if not skipped and os.path.exists(src): os.replace(src,done); mj=src.rsplit('.',1)[0]+'.json'; os.path.exists(mj) and os.replace(mj,done.rsplit('.',1)[0]+'.json')
    jsave(os.path.join(REP,'intake.json'),I)
    print('%s: approved %d piece(s)%s'%(task_id,len(took),'' if not skipped else ', skipped: '+'; '.join('cell %d %s'%s for s in skipped)))
    return took
def cmd_reject(args):
    h,rec=latest_for(args.task)
    if not h: sys.exit('nothing to reject for '+args.task)
    I=intake(); d=os.path.join(REJ,args.task); os.makedirs(d,exist_ok=True); src=os.path.join(INC,rec['file'])
    os.replace(src,os.path.join(d,h[:12]+'-'+rec['file'])); open(os.path.join(d,h[:12]+'-reason.txt'),'w').write(args.reason+'\n')
    I['deliveries'][h]['state']='rejected'; I['deliveries'][h]['reason']=args.reason; jsave(os.path.join(REP,'intake.json'),I); print('rejected',rec['file'])

def regenerate(build=False):
    subprocess.check_call([sys.executable,os.path.join(ROOT,'tools','wildkin_manifest.py')])
    if build: subprocess.check_call([sys.executable,os.path.join(ROOT,'tools','build.py'),'tcg'])
def cmd_ingest(args):
    hs=cmd_check(args); I=intake(); took=[]
    if args.auto_approve:
        for h in hs:
            r=I['deliveries'].get(h)
            if r and r['state']=='checked' and r['result']=='pass': took+=approve(r['task'],by='auto (merged to main)')
    if took or args.build: regenerate(args.build)

# ---------------------------------------------------------------- the owner's earlier sheets
LEGACY={'cactuft':1,'bashlet':5,'rolyte':11,'frondolin':14,'flapod':23}
def cmd_legacy(args):
    M=manifest(); sp={int(s['card'][-3:]):s for s in M['species']}; R=registry(); lm=json.load(open(os.path.join(ROOT,'assets','manifest.json'))); n=0
    leg=dict(LEGACY)
    if args.koi:
        if args.koi not in (8,9,10): sys.exit('--koi must be 8 (Koilet), 9 (Runakoi) or 10 (Koirune)')
        leg['koi']=args.koi
    for c in lm['creatures']:
        if c['name'] not in leg: continue
        s=sp[leg[c['name']]]; aid='cut.%03d-%s.%s'%(leg[c['name']],s['slug'],c['pose']); src=os.path.join(ROOT,c['file'])
        if aid in R['assets']: continue
        dst=os.path.join(APP,'assets',aid+'.webp'); os.makedirs(os.path.dirname(dst),exist_ok=True); shutil.copy2(src,dst)
        sheet='art-source/creatures/%s-poses-%s.png'%(c['name'],c['screen'])
        R['assets'][aid]={'file':os.path.relpath(dst,ROOT),'sha256':sha(dst),'task':'legacy','cell':['standing','jumping','running','waving','sitting','sleeping','surprised','looking-up','back-view'].index(c['pose'])+1,
            'source':sheet,'source_sha256':sha(os.path.join(ROOT,sheet)),'approved':now(),'approved_by':'owner (sheet supplied and reviewed before the V1 manifest; cut with tools/build_art.py)',
            'provenance':{'delivered_as':sheet,'cut_with':'tools/ingest.py via tools/build_art.py'},'checks':{'margins_LTRB':c['margins_LTRB'],'touches_edge':c['touches_edge'],'stray_pieces_dropped':c['stray_pieces_dropped']},'warnings_accepted':(['subject touches the cell edge on the source sheet'] if c['touches_edge'] else [])}
        n+=1
    for s in lm['scenes']:
        aid='scene.%s.%s'%(s['biome'],s['id'].split('-')[1])
        if aid in R['assets']: continue
        dst=os.path.join(APP,'assets',aid+'.jpg'); os.makedirs(os.path.dirname(dst),exist_ok=True); shutil.copy2(os.path.join(ROOT,s['file']),dst); sheet='art-source/scenes/scenes-%s.png'%s['biome']
        R['assets'][aid]={'file':os.path.relpath(dst,ROOT),'sha256':sha(dst),'task':'legacy','cell':int(s['id'].split('-')[1]),'source':sheet,'source_sha256':sha(os.path.join(ROOT,sheet)),'approved':now(),
            'approved_by':'owner (sheet supplied before the V1 manifest)','provenance':{'delivered_as':sheet,'cut_with':'tools/build_art.py'},'tags':{'floor':s['floor'],'time':s['time'],'description':s['description']},'warnings_accepted':[]}
        n+=1
    jsave(os.path.join(APP,'registry.json'),R); print('registered %d earlier pieces'%n); regenerate(False)

def cmd_status(args):
    Q=queue(); tot=ok=0
    for t in Q.values():
        p=t['production']; tot+=p['required_cells']; ok+=p['approved_cells']; print('%-9s %-9s %d/%d  %s'%(t['task_id'],p['status'],p['approved_cells'],p['required_cells'],t['title'][:70]))
    print('cells approved: %d of %d'%(ok,tot))

def main():
    ap=argparse.ArgumentParser(); sub=ap.add_subparsers(dest='cmd',required=True)
    sub.add_parser('status')
    c=sub.add_parser('check'); c.add_argument('--ci',action='store_true'); c.add_argument('--force',action='store_true')
    a=sub.add_parser('approve'); a.add_argument('task'); a.add_argument('--cells'); a.add_argument('--replace',action='store_true'); a.add_argument('--allow-warnings',action='store_true'); a.add_argument('--by',default='owner'); a.add_argument('--build',action='store_true')
    r=sub.add_parser('reject'); r.add_argument('task'); r.add_argument('--reason',required=True)
    i=sub.add_parser('ingest'); i.add_argument('--auto-approve',action='store_true'); i.add_argument('--build',action='store_true'); i.add_argument('--force',action='store_true'); i.add_argument('--ci',action='store_true')
    l=sub.add_parser('legacy'); l.add_argument('--koi',type=int)
    x=ap.parse_args()
    if x.cmd=='status': cmd_status(x)
    elif x.cmd=='check': cmd_check(x)
    elif x.cmd=='approve':
        took=approve(x.task,[int(v) for v in x.cells.split(',')] if x.cells else None,x.replace,x.allow_warnings,x.by)
        if took: regenerate(x.build)
    elif x.cmd=='reject': cmd_reject(x)
    elif x.cmd=='ingest': cmd_ingest(x)
    elif x.cmd=='legacy': cmd_legacy(x)
if __name__=='__main__': main()
