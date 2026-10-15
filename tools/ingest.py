#!/usr/bin/env python3
"""Cut a 3x3 (or NxM) generated art sheet into separate pieces.

  python3 tools/ingest.py sheet.png --kind scene  --out assets/scenes/meadow
  python3 tools/ingest.py sheet.png --kind cutout --key green   --out assets/mascots/crystal-fox
  python3 tools/ingest.py sheet.png --kind cutout --key magenta --out assets/mascots/leaf-sprite

scene   : each cell becomes a JPEG (backgrounds, full-art paintings, items, lands, energy)
cutout  : each cell is keyed against a flat green or magenta screen and saved as a transparent WebP
It prints a report: cells where the subject touches the edge, and any screen colour left on the edges."""
import argparse, os, json
import numpy as np
from PIL import Image, ImageFilter
def gutters(v, n, parts):
    out=[]
    for k in range(1,parts):
        c=n*k//parts; w=max(8,n//40); seg=v[max(0,c-w):c+w]; i=int(np.argmin(seg)); lo=max(0,c-w)+i; a=b=lo
        while a>0 and v[a-1]<v[lo]+14: a-=1
        while b<n-1 and v[b+1]<v[lo]+14: b+=1
        out.append((a,b))
    return out
def cells(im, cols, rows):
    a=np.asarray(im.convert('L')).astype(float); H,W=a.shape; gx=gutters(a.mean(axis=0),W,cols); gy=gutters(a.mean(axis=1),H,rows)
    # trust detected gutters only if they sit where a gutter should; otherwise split evenly
    ok=lambda g,n,p: all(abs((x0+x1)/2-n*(i+1)/p)<n*0.04 and (x1-x0)<n*0.03 for i,(x0,x1) in enumerate(g))
    xs=[0]+[v for g in gx for v in g]+[W] if ok(gx,W,cols) else [round(W*i/cols) for i in range(cols+1) for _ in (0,1)][1:-1]; ys=[0]+[v for g in gy for v in g]+[H] if ok(gy,H,rows) else [round(H*i/rows) for i in range(rows+1) for _ in (0,1)][1:-1]
    xr=[(xs[2*i],xs[2*i+1]+ (1 if 0<i else 0)) for i in range(cols)] if len(xs)==2*cols else None
    xr=[(xs[2*i] + (1 if i else 0), xs[2*i+1]) for i in range(cols)]; yr=[(ys[2*i] + (1 if i else 0), ys[2*i+1]) for i in range(rows)]
    return xr, yr
def screen_of(p, screen):
    """Median colour of the ring just inside the cell edge: that is the screen (the subject rarely covers all of it)."""
    q=np.asarray(p).astype(np.float32)/255; ring=np.concatenate([q[:6].reshape(-1,3),q[-6:].reshape(-1,3),q[:,:6].reshape(-1,3),q[:,-6:].reshape(-1,3)])
    ch=np.median(ring,axis=0); return ch
def chroma(q, screen):
    """How much 'screen' there is in each pixel, as a fraction of its own brightness (so a darker floor shadow still counts as screen)."""
    r,g,b=q[...,0],q[...,1],q[...,2]
    if screen=='green': c=g-np.maximum(r,b); d=g
    else: c=np.minimum(r,b)-g; d=np.minimum(r,b)
    return np.where(d>0.06,c/np.maximum(d,1e-3),0)
def key(p, screen, lo=None, hi=None):
    """Soft matte, no erosion: alpha comes from how screen-like each pixel is, then the screen colour is
    un-mixed from the semi-transparent edge pixels. Hairlines (whiskers) keep their partial alpha and pale
    bodies lose the green/magenta tint instead of being clamped."""
    q=np.asarray(p).astype(np.float32)/255; B=screen_of(p,screen); t0=float(np.median(chroma(B[None,None,:],screen)))
    if t0<0.2: t0=0.6
    t=chroma(q,screen)/t0
    if lo is None: lo,hi=(0.04,0.96) if screen=='green' else (0.08,0.6)          # magenta fringes need a harder matte
    alpha=np.clip((hi-t)/(hi-lo),0,1)
    a=alpha[...,None]; F=np.where(a>0.02,(q-(1-a)*B)/np.maximum(a,0.02),q)
    F=np.clip(F,0,1); r,g,b=F[...,0].copy(),F[...,1].copy(),F[...,2].copy()
    if screen=='green': g=np.minimum(g,np.maximum(r,b)+0.01)                       # last bit of green spill
    else: sp=np.clip(np.minimum(r,b)-g,0,1)*(alpha<0.98); r=r-sp; b=np.where(alpha<0.98,np.minimum(b-sp,g+0.03),b)   # last bit of magenta spill, edge pixels only
    F=np.dstack([r,g,b])
    if screen!='green':                                                             # magenta bleeds into hairs and spines; take the colour of the nearest solid pixels instead
        w=(alpha>0.999).astype(np.float32); num=np.stack([np.asarray(Image.fromarray((F[...,i]*w*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),np.float32) for i in range(3)],-1); den=np.asarray(Image.fromarray((w*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)),np.float32)[...,None]
        C=num/np.maximum(den,1); edge=(alpha<0.999)[...,None]&(den>2); F=np.where(edge,0.85*C+0.15*F,F)
        e2=(alpha<0.999)                                                            # thin yellow spines carry a salmon cast all the way across (they are 1-3 px wide): pull pink pixels near the outline to spine yellow, using the colour of the solid interior to tell spines from pink flowers
        deep=(np.asarray(Image.fromarray(((alpha>0.999)*255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)))>0).astype(np.float32)
        nd=np.stack([np.asarray(Image.fromarray((F[...,i]*deep*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)),np.float32) for i in range(3)],-1); dd=np.asarray(Image.fromarray((deep*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)),np.float32)[...,None]
        Cd=nd/np.maximum(dd,1); fat=np.asarray(Image.fromarray((deep*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)))>0; near=(~fat)&(alpha>0.01)&(dd[...,0]>3)   # thin = outside every solid part, grown back out
        pink=near&(F[...,0]-F[...,1]>0.17)&(F[...,2]>F[...,1]*0.45)&((Cd[...,0]-Cd[...,1])<0.2)
        yel=np.array([0.93,0.82,0.5],np.float32); F=np.where(pink[...,None],0.5*Cd+0.5*yel,F)
        F[...,2]=np.where(e2,np.minimum(F[...,2],F[...,1]),F[...,2])
    F=bleed(F,alpha)                                                               # colour under the transparent pixels, so lossy WebP does not smear black or screen colour into the edge
    o=Image.fromarray((np.clip(F,0,1)*255).astype(np.uint8)); o.putalpha(Image.fromarray((alpha*255).astype(np.uint8))); return o
def bleed(F, alpha, radii=(3,8,20)):
    """Fill the RGB of transparent pixels with the colour of the nearest solid ones."""
    out=F.copy(); solid=(alpha>0.5).astype(np.float32); have=solid>0
    for rad in radii:
        num=np.stack([np.asarray(Image.fromarray((out[...,i]*have*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad)),np.float32) for i in range(3)],-1); den=np.asarray(Image.fromarray((have*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad)),np.float32)[...,None]
        fill=(num/np.maximum(den,1)); new=(~have)[...,None]&(den>1); out=np.where(new,fill,out); have=have|new[...,0]
    out[~have]=0; return out
def drop_stray(img, join=2, keep_frac=0.06):
    """Remove stray pieces (the '!' bursts, sparkles, speed lines). Pieces are grouped after growing them by `join` px
    (so whiskers and thin tails stay joined to the body, but effect marks that float a few pixels off it do not); everything smaller than keep_frac of the biggest group goes.
    Returns (image, number of pieces dropped)."""
    al=np.asarray(img)[...,3]; m=al>12; grown=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2*join+1)))>0
    H,W=m.shape; lab=np.zeros((H,W),np.int32); n=0; sizes=[0]
    for y,x in zip(*np.where(grown)):
        if lab[y,x]: continue
        n+=1; lab[y,x]=n; st=[(y,x)]; cnt=0
        while st:
            cy,cx=st.pop(); cnt+=1
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny,nx=cy+dy,cx+dx
                if 0<=ny<H and 0<=nx<W and grown[ny,nx] and not lab[ny,nx]: lab[ny,nx]=n; st.append((ny,nx))
        sizes.append(cnt)
    if n<=1: return img,0
    big=max(sizes[1:]); keep={i for i in range(1,n+1) if sizes[i]>=big*keep_frac}
    mask=np.isin(lab,list(keep)); arr=np.asarray(img).copy(); gone=n-len(keep); arr[~mask]=0
    return Image.fromarray(arr),gone
def cut_sheet(sheet, kind, screen='green', out='out', names=None, cols=3, rows=3, size=560, inset=8, drop_effects=False, crop=True):
    """Cut one sheet. Pieces go to `<out>_NN.ext`, or `<out>/<name>.ext` when names are given. Returns a report list."""
    im=Image.open(sheet).convert('RGB'); xr,yr=cells(im,cols,rows); rep=[]; n=0
    if names: os.makedirs(out,exist_ok=True)
    else: os.makedirs(os.path.dirname(out) or '.',exist_ok=True)
    for r,(y0,y1) in enumerate(yr):
        for c,(x0,x1) in enumerate(xr):
            n+=1; p=im.crop((x0+inset,y0+inset,x1-inset,y1-inset)); base=os.path.join(out,names[n-1]) if names else f'{out}_{n:02d}'
            if kind=='scene':
                p.thumbnail((size,size),Image.LANCZOS); p.save(base+'.jpg','JPEG',quality=88,optimize=True); rep.append({'cell':n,'file':base+'.jpg','size':p.size}); continue
            k=key(p,screen); gone=0
            if drop_effects: k,gone=drop_stray(k)
            al=np.asarray(k)[...,3]; ys_,xs_=np.where(al>40); h,w=al.shape
            m=(int(xs_.min()),int(ys_.min()),int(w-1-xs_.max()),int(h-1-ys_.max())) if len(xs_) else (0,0,0,0)
            if crop and len(xs_):
                yy,xx=np.where(al>4); k=k.crop((max(0,int(xx.min())-4),max(0,int(yy.min())-4),min(w,int(xx.max())+5),min(h,int(yy.max())+5)))
            if max(k.size)>size: k.thumbnail((size,size),Image.LANCZOS)
            k.save(base+'.webp','WEBP',quality=90,alpha_quality=100,method=6)
            rep.append({'cell':n,'file':base+'.webp','size':k.size,'margins_LTRB':m,'touches_edge':min(m)<3,'stray_pieces_dropped':gone})
    return rep
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('sheet'); ap.add_argument('--kind',choices=['scene','cutout'],default='scene'); ap.add_argument('--key',choices=['green','magenta'],default='green')
    ap.add_argument('--cols',type=int,default=3); ap.add_argument('--rows',type=int,default=3); ap.add_argument('--out',required=True); ap.add_argument('--size',type=int,default=560); ap.add_argument('--inset',type=int,default=8)
    ap.add_argument('--drop-effects',action='store_true',help='remove stray pieces ("!" bursts, sparkles, speed lines) that are not joined to the main subject')
    ap.add_argument('--names',help='comma-separated piece names (row by row); files go to <out>/<name> instead of <out>_NN')
    ap.add_argument('--no-crop',action='store_true',help='keep the whole cell instead of trimming cutouts to the subject')
    a=ap.parse_args(); rep=cut_sheet(a.sheet,a.kind,a.key,a.out,a.names.split(',') if a.names else None,a.cols,a.rows,a.size,a.inset,a.drop_effects,not a.no_crop)
    json.dump(rep,open(a.out.rstrip('/')+'_report.json','w'),indent=1)
    bad=[x['cell'] for x in rep if x.get('touches_edge')]; print(f'{len(rep)} pieces written to {a.out}. '+('Cells where the subject touches the edge (ask for more margin): '+str(bad) if bad else 'No subject touches a cell edge.'))
if __name__=='__main__': main()
