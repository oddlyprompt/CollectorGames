"""Wildkin art intake for whole-set deliveries and packaging (used by tools/wildkin_art.py: `set-delivery` and `products`).

A set delivery is SOL's final handoff for a new set (for Duskfall: the art zips plus wildkin-duskfall-final-handoff, which holds
art_manifest.json, the per-card mapping with measured source boxes). Every cell is cut from its measured content box (sheets may
have unequal rows, so nothing assumes equal thirds), cutouts are keyed from their chroma screen, scenes and paintings are kept as
pictures, and each piece is registered in approved/registry.json with its source file, sha256, cell and the handoff's review state.
The handoff itself is copied to wildkin-production/sets/<code>/ so the set manifest can be built from it.

A packaging delivery holds whole products on a chroma screen (packs and boxes); each is keyed, trimmed and registered as
product.<set>.<name>. The renderer prints every word on top (no lettering is baked in).

Rules (same as the rest of the intake): an approved asset is never replaced without --replace; running twice changes nothing."""
import os, re, json, glob, shutil, hashlib, datetime
import numpy as np
from PIL import Image
import ingest

def _sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda: f.read(1<<20), b''): h.update(b)
    return h.hexdigest()
def _now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def slug(s): return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',s.lower().replace('—','-'))).strip('-')

def _cutout(im, screen):
    """Key a cell (or a whole product) and trim it to the subject. Returns (image, margins LTRB before the trim)."""
    k=ingest.key(im, screen); al=np.asarray(k)[...,3]; ys,xs=np.where(al>40); h,w=al.shape
    m=(int(xs.min()),int(ys.min()),int(w-1-xs.max()),int(h-1-ys.max())) if len(xs) else (0,0,0,0)
    yy,xx=np.where(al>4)
    if len(xx): k=k.crop((max(0,int(xx.min())-4),max(0,int(yy.min())-4),min(w,int(xx.max())+5),min(h,int(yy.max())+5)))
    return k, m

def _files(art_dirs):
    out={}
    for d in art_dirs:
        for p in glob.glob(os.path.join(d,'**','*.png'),recursive=True): out.setdefault(os.path.basename(p),p)
    return out

def plan_set(handoff, code):
    """Asset id for every piece the set needs, from the handoff's card mapping. Returns (pieces, cards).
    pieces: {asset_id: {file, sha256, cell, box, kind, screen, task, card}}; cards: the mapping rows."""
    am=json.load(open(os.path.join(handoff,'art_manifest.json'))); q=json.load(open(os.path.join(handoff,'art_queue.json')))
    tasks={t['task_id']:t for t in q['tasks']}; cards=am['cards']; pieces={}; bykey={}
    def add(aid, file, cell, box, kind, screen, task, card):
        pieces[aid]={'file':file,'cell':cell,'box':box,'kind':kind,'screen':screen,'task':task,'card':card}; bykey[(os.path.basename(file),cell)]=aid; return aid
    for c in cards:
        if not c.get('artwork'): continue
        no=int(c['number']); nm=slug(c['name']); t=tasks.get(c['task_id'],{}); scr=t.get('chroma') or 'green'
        if c['category']=='premium':
            pc={'ir':'ir','fa':'fa','sir':'sir','csr':'csr'}[c['print_class']]; base=nm if nm.endswith('-'+pc) or nm.startswith('clasped') else nm+'-'+pc
            add('ill.%s-%03d-%s'%(code,no,base), c['artwork'], 1, c['source_box']['content_box'], 'painting', None, c['task_id'], no); continue
        if c['art_plan']=='new_scene':
            add('scene.%s-%03d-%s'%(code,no,nm), c['artwork'], c['primary_cell'], c['source_box']['content_box'], 'scene', None, c['task_id'], no); continue
        if c['art_plan']=='new_illustration':
            add('ill.%s-%03d-%s'%(code,no,nm), c['artwork'], c['primary_cell'], c['source_box']['content_box'], 'scene', None, c['task_id'], no); continue
        pre='obj' if c['category']=='gear' else 'cut'
        for p in (c.get('poses') or []):
            pose=slug(p['pose']) if c['category']=='creature' else ('portrait' if c['category']=='ally' else '')
            aid='%s.%s-%03d-%s%s'%(pre,code,no,nm,('.'+pose) if pose else '')
            if aid in pieces: aid+='-%d'%p['cell']
            add(aid, c['artwork'], p['cell'], p['source']['content_box'], 'cutout', scr, c['task_id'], no)
    return pieces, cards, tasks, bykey

def card_art(c, pieces, bykey, code):
    """The game's art layout for one card: new pieces by id, reused First Bond art as mapped by the handoff."""
    if c.get('art_mapping'):   # reprints and new prints of First Bond cards keep the approved art unchanged
        m=c['art_mapping']; out={'layout':m['layout']}
        for k in ('subject','background','illustration','interim'):
            if m.get(k): out[k]=m[k]
        return out
    if c['category']=='essence': return {'layout':'vector-essence'}
    no=int(c['number']); mine=[a for a,p in pieces.items() if p['card']==no]
    if c['category']=='premium': return {'layout':'full-art','illustration':mine[0]}
    if c['art_plan'] in ('new_scene','new_illustration'): return {'layout':'illustration','illustration':mine[0]}
    prim=[a for a in mine if pieces[a]['cell']==c.get('primary_cell')] or mine
    if c['category']=='creature':
        bg=c.get('recommended_background') or {}; b=None
        if bg.get('kind')=='new-duskfall-scene' or bg.get('task_id'): b=bykey.get((os.path.basename(bg['file']), bg['cell']))
        elif bg.get('asset_id'): b=bg['asset_id']
        elif bg.get('file'): b=os.path.basename(bg['file']).rsplit('.',1)[0]
        return {'layout':'cutout-on-scene','subject':prim[0],'background':b,'poses':mine}
    return {'layout':'cutout-on-panel','subject':prim[0],'background':None}

def deliver_set(handoff, art_dirs, code, wp, root, registry, by, replace=False):
    """Cut and register every piece of a set delivery. Returns (took, skipped, report)."""
    pieces,cards,tasks,bykey=plan_set(handoff, code); files=_files(art_dirs); R=registry; took=[]; skipped=[]; rep=[]
    shas={c['artwork']:c.get('sha256') for c in cards if c.get('artwork')}
    adir=os.path.join(wp,'approved','assets'); sdir=os.path.join(wp,'approved','sources',code); os.makedirs(adir,exist_ok=True); os.makedirs(sdir,exist_ok=True)
    opened={}
    for aid,p in sorted(pieces.items()):
        fn=os.path.basename(p['file']); src=files.get(fn)
        if not src: skipped.append((aid,'source %s not delivered'%fn)); continue
        if aid in R['assets'] and not replace: skipped.append((aid,'already approved')); continue
        hs=opened.get(src) or _sha(src); opened[src]=hs
        if shas.get(p['file']) and shas[p['file']]!=hs: skipped.append((aid,'source sha256 differs from the handoff')); continue
        keep=os.path.join(sdir,fn)
        if not os.path.exists(keep): shutil.copy2(src,keep)
        im=Image.open(src).convert('RGB'); x0,y0,x1,y1=p['box']; cell=im.crop((x0,y0,x1,y1)); checks={'cell_px':[x1-x0,y1-y0]}
        if p['kind']=='cutout':
            k,m=_cutout(cell,p['screen']); checks.update({'margins_LTRB':list(m),'screen':p['screen'],'touches_edge':min(m)<3})
            if max(k.size)>560: k.thumbnail((560,560),Image.LANCZOS)
            dst=os.path.join(adir,aid+'.webp'); k.save(dst,'WEBP',quality=90,alpha_quality=100,method=6)
        elif p['kind']=='scene':
            cell.thumbnail((560,560),Image.LANCZOS); dst=os.path.join(adir,aid+'.jpg'); cell.save(dst,'JPEG',quality=88,optimize=True)
        else:
            dst=os.path.join(adir,aid+'.webp'); cell.save(dst,'WEBP',quality=90,method=6); checks['size']=list(cell.size)
        t=tasks.get(p['task'],{})
        R['assets'][aid]={'file':os.path.relpath(dst,root),'sha256':_sha(dst),'task':p['task'],'cell':p['cell'],'source':os.path.relpath(keep,root),'source_sha256':hs,
            'approved':_now(),'approved_by':by,'provenance':{'delivered_as':fn,'set':code,'card_number':p['card'],'review':{k:t.get(k) for k in ('status','phase','kind','chroma') if k in t}},'checks':checks,'warnings_accepted':[]}
        took.append(aid); rep.append((aid,checks))
    dst=os.path.join(wp,'sets',code); os.makedirs(dst,exist_ok=True)
    for f in ('art_manifest.json','art_queue.json','reused_first_bond.json','reused_first_bond_assets.json','final-layout-acceptance.json','HANDOFF.md','PROGRESS.md','manifest.json'):
        s=os.path.join(handoff,f)
        if os.path.exists(s): shutil.copy2(s, os.path.join(dst, 'handoff-'+f if f=='manifest.json' else f))
    return took, skipped, rep

PRODUCT_NAMES={'PRODUCT-PACK-01':'pack-1','PRODUCT-PACK-02':'pack-2','PRODUCT-PACK-03':'pack-3','PRODUCT-PACK-04':'pack-4','PRODUCT-BOX-01':'box-closed','PRODUCT-BOX-02':'box-open'}
def deliver_products(pkg, code, wp, root, registry, by, replace=False):
    """Key, trim and register a packaging delivery (incoming/ only; revisions are never imported)."""
    m=json.load(open(os.path.join(pkg,'manifest.json'))); R=registry; took=[]; skipped=[]
    adir=os.path.join(wp,'approved','assets'); sdir=os.path.join(wp,'approved','sources','products'); os.makedirs(sdir,exist_ok=True)
    for t in m['tasks']:
        nm=PRODUCT_NAMES.get(t['task_id']); aid='product.%s.%s'%(code,nm)
        if not nm: skipped.append((t['task_id'],'unknown product task')); continue
        if t.get('status')!='Packaged' or t.get('qa_status')!='Approved': skipped.append((aid,'not approved in the delivery')); continue
        if aid in R['assets'] and not replace: skipped.append((aid,'already approved')); continue
        src=os.path.join(pkg,t['file']); hs=_sha(src)
        if t.get('sha256') and t['sha256']!=hs: skipped.append((aid,'sha256 differs from the delivery manifest')); continue
        keep=os.path.join(sdir,os.path.basename(src)); shutil.copy2(src,keep)
        k,mg=_cutout(Image.open(src).convert('RGB'), 'green' if t.get('background','').startswith('chroma-green') else 'green')
        if max(k.size)>900: k.thumbnail((900,900),Image.LANCZOS)
        dst=os.path.join(adir,aid+'.webp'); k.save(dst,'WEBP',quality=90,alpha_quality=100,method=6)
        meta=os.path.join(pkg,'metadata',t['task_id']+'.json')
        R['assets'][aid]={'file':os.path.relpath(dst,root),'sha256':_sha(dst),'task':t['task_id'],'cell':1,'source':os.path.relpath(keep,root),'source_sha256':hs,'approved':_now(),'approved_by':by,
            'provenance':{'delivered_as':t['file'],'subject':t.get('subject'),'kind':t.get('kind'),'metadata':json.load(open(meta)) if os.path.exists(meta) else None},
            'checks':{'size':list(k.size),'margins_LTRB':list(mg)},'warnings_accepted':[]}
        took.append(aid)
    return took, skipped
