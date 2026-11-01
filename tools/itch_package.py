#!/usr/bin/env python3
"""Measure (and optionally zip) the Trading Card Collector build for an HTML5 host such as itch.io.
   python3 tools/itch_package.py            measure dist/tcg and print the report
   python3 tools/itch_package.py --zip      also write dist/itch/trading-card-collector.zip (index.html at the zip root)
Limits are the figures quoted in the 2026-11 audit (1,000 extracted files, 500 MB extracted, 200 MB per file).
They were NOT re-checked against itch's current documentation (the build sandbox cannot reach itch.io): check https://itch.io/docs/creators/html5 before uploading."""
import os, sys, zipfile, collections, hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC=os.path.join(ROOT,'dist','tcg')
LIM_FILES, LIM_TOTAL, LIM_ONE = 1000, 500*10**6, 200*10**6
def scan():
    out=[]
    for d,_,fs in os.walk(SRC):
        for f in fs:
            p=os.path.join(d,f); out.append((os.path.relpath(p,SRC),os.path.getsize(p)))
    return out
def group(rel):
    n=os.path.basename(rel)
    if rel.startswith('art/'):
        return 'Tidemark illustrations (art/TMI-*)' if n.startswith('TMI') else 'Broken Reach (art/br-*)' if n.startswith('br-') else 'Wildkin scenes (art/scene.*)' if n.startswith('scene') else 'Wildkin cards, products, objects (art/*)'
    if rel.startswith('broken-reach/'): return 'Broken Reach battler page'
    return 'game code, styles, vendor, icons'
def main():
    if not os.path.isfile(os.path.join(SRC,'index.html')): print('build first: python3 tools/build.py tcg'); return 2
    fl=scan(); tot=sum(s for _,s in fl); g=collections.defaultdict(lambda:[0,0])
    for r,s in fl: g[group(r)][0]+=1; g[group(r)][1]+=s
    dup=collections.defaultdict(list)
    for r,s in fl:
        if s>20000: dup[hashlib.md5(open(os.path.join(SRC,r),'rb').read()).hexdigest()].append(r)
    dups=[v for v in dup.values() if len(v)>1]
    print(f'extracted files : {len(fl):,}   (limit {LIM_FILES:,}: {"OVER by "+str(len(fl)-LIM_FILES) if len(fl)>LIM_FILES else "ok"})')
    print(f'extracted bytes : {tot/1e6:,.1f} MB  (limit {LIM_TOTAL/1e6:.0f} MB: {"OVER" if tot>LIM_TOTAL else "ok"})')
    big=sorted(fl,key=lambda x:-x[1])[:5]; print(f'largest file    : {big[0][1]/1e6:.2f} MB {big[0][0]}  (limit {LIM_ONE/1e6:.0f} MB: {"OVER" if big[0][1]>LIM_ONE else "ok"})')
    for r,s in big[1:]: print(f'                  {s/1e6:.2f} MB {r}')
    print('by group:'); [print(f'  {k:45s} {n:5d} files {s/1e6:7.1f} MB') for k,(n,s) in sorted(g.items(),key=lambda x:-x[1][1])]
    print(f'identical large files (duplicates): {len(dups)} groups', dups[:3])
    ga=sum(1 for r,_ in fl if r.startswith('art/')); print(f'art files: {ga:,}')
    if '--zip' in sys.argv:
        os.makedirs(os.path.join(ROOT,'dist','itch'),exist_ok=True); zp=os.path.join(ROOT,'dist','itch','trading-card-collector.zip')
        with zipfile.ZipFile(zp,'w',zipfile.ZIP_STORED if False else zipfile.ZIP_DEFLATED) as z:
            for r,_ in sorted(fl): z.write(os.path.join(SRC,r),r)
        print(f'wrote {zp} ({os.path.getsize(zp)/1e6:.1f} MB, {len(fl):,} entries)')
    return 1 if (len(fl)>LIM_FILES or tot>LIM_TOTAL or big[0][1]>LIM_ONE) else 0
if __name__=='__main__': sys.exit(main())
