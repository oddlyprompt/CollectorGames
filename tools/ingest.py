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
def key(p, screen, lo, hi, erode=3):
    q=np.asarray(p).astype(np.float32)/255; r,g,b=q[...,0].copy(),q[...,1].copy(),q[...,2].copy()
    if screen=='green':
        c=g-np.maximum(r,b); g=np.minimum(g,np.maximum(r,b))                     # remove the green spill
    else:
        c=np.minimum(r,b)-g; spill=np.clip(c,0,1); r=r-spill; b=b-spill            # magenta: red and blue are both high, green is low
    alpha=1-np.clip((c-lo)/(hi-lo),0,1)
    A=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.MinFilter(erode)).filter(ImageFilter.GaussianBlur(0.7))
    o=Image.fromarray((np.clip(np.dstack([r,g,b]),0,1)*255).astype(np.uint8)); o.putalpha(A); return o
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('sheet'); ap.add_argument('--kind',choices=['scene','cutout'],default='scene'); ap.add_argument('--key',choices=['green','magenta'],default='green')
    ap.add_argument('--cols',type=int,default=3); ap.add_argument('--rows',type=int,default=3); ap.add_argument('--out',required=True); ap.add_argument('--size',type=int,default=560); ap.add_argument('--inset',type=int,default=8)
    a=ap.parse_args(); im=Image.open(a.sheet).convert('RGB'); xr,yr=cells(im,a.cols,a.rows); os.makedirs(os.path.dirname(a.out) or '.',exist_ok=True); rep=[]
    n=0
    for r,(y0,y1) in enumerate(yr):
        for c,(x0,x1) in enumerate(xr):
            n+=1; p=im.crop((x0+a.inset,y0+a.inset,x1-a.inset,y1-a.inset)); name=f'{a.out}_{n:02d}'
            if a.kind=='scene':
                p.thumbnail((a.size,a.size),Image.LANCZOS); p.save(name+'.jpg','JPEG',quality=82,optimize=True); rep.append({'cell':n,'size':p.size}); continue
            k=key(p,a.key,0.02,0.11); k.thumbnail((a.size,a.size),Image.LANCZOS); al=np.asarray(k)[...,3]; ys_,xs_=np.where(al>40); k.save(name+'.webp','WEBP',quality=88,method=6)
            h,w=al.shape; m=(int(xs_.min()),int(ys_.min()),int(w-1-xs_.max()),int(h-1-ys_.max())) if len(xs_) else (0,0,0,0); touching=min(m)<3
            rep.append({'cell':n,'size':k.size,'margins_LTRB':m,'touches_edge':touching})
    json.dump(rep,open(a.out+'_report.json','w'),indent=1)
    bad=[x['cell'] for x in rep if x.get('touches_edge')]; print(f'{n} pieces written to {a.out}_NN. '+('Cells where the subject touches the edge (ask for more margin): '+str(bad) if bad else 'No subject touches a cell edge.'))
if __name__=='__main__': main()
