#!/usr/bin/env python3
"""Make a versioned release candidate of the Trading Card Collector for a closed test or an HTML5 host (itch.io).
   python3 tools/build.py tcg                  build first
   python3 tools/release.py [--version 0.9.0-alpha-rc1]

Writes release/trading-card-collector-<version>/ (index.html at its root) and the same folder as a .zip. Nothing is uploaded anywhere.
The folder is the ordinary build with three differences, all made here and none in dist/:
  1. Tidemark's paintings (1,254 files) are packed into art/tm-<n>.pak files of 40 paintings, with an index in game.js (window.TM_PAKS).
     The game reads a painting out of its pak the first time it is wanted (tmArtUrl in src/engine/tm/tm_render.js). This is what
     brings the package under a host's file limit. Paintings that the page refers to directly (LOOSE) stay as files.
  2. The version is stamped into the page title, the About text and RELEASE.json.
  3. The offline cache has its own name, so a browser that has an older copy fetches this one.
Limits checked (itch.io HTML5, as reported by several secondary sources in 2026-11; the official page could not be read from the
build machine): 1,000 files, 500 MB extracted, 200 MB per file. Test locally: cd release/<name> && python3 -m http.server 8780"""
import os, sys, json, shutil, zipfile, hashlib, datetime, subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC=os.path.join(ROOT,'dist','tcg')
LIM_FILES, LIM_TOTAL, LIM_ONE = 1000, 500*10**6, 200*10**6
PER=40; LOOSE={'TMI-0040'}          # the Tidemark picture used by the launcher, Home and the Tidemark tab banner
def arg(n,d): return sys.argv[sys.argv.index(n)+1] if n in sys.argv else d
def main():
    ver=arg('--version','0.9.0-alpha-rc1'); name='trading-card-collector-'+ver
    if not os.path.isfile(os.path.join(SRC,'game.js')): print('build first: python3 tools/build.py tcg'); return 2
    out=os.path.join(ROOT,'release',name); shutil.rmtree(out,ignore_errors=True); shutil.copytree(SRC,out)
    art=os.path.join(out,'art'); ids=sorted(f[:-5] for f in os.listdir(art) if f.startswith('TMI-') and f.endswith('.webp') and f[:-5] not in LOOSE)
    idx={}; paks=0
    for k in range(0,len(ids),PER):
        n=k//PER; off=0
        with open(os.path.join(art,'tm-%d.pak'%n),'wb') as pak:
            for i in ids[k:k+PER]:
                b=open(os.path.join(art,i+'.webp'),'rb').read(); pak.write(b); idx[i]=[n,off,len(b)]; off+=len(b); os.remove(os.path.join(art,i+'.webp'))
        paks+=1
    gp=os.path.join(out,'game.js'); js=open(gp,encoding='utf-8').read()
    tail='shellBoot();'; cut=js.rstrip().rfind(tail)
    if cut<0 or js.rstrip()[cut:]!=tail: print('game.js does not end with shellBoot(); the build changed'); return 2
    about=' Closed alpha build %s.'%ver
    js='window.TCG_VERSION=%s;window.TM_PAKS=%s;\n'%(json.dumps(ver),json.dumps({'per':PER,'idx':idx},separators=(',',':')))+js.rstrip()[:cut]+'PACK.about=(PACK.about||"")+%s;\n'%json.dumps(about)+tail+'\n'
    open(gp,'w',encoding='utf-8').write(js); h=hashlib.sha256(js.encode('utf-8')).hexdigest()[:10]
    # the page and the offline cache point at this exact script
    ip=os.path.join(out,'index.html'); html=open(ip,encoding='utf-8').read(); import re
    old=re.search(r'game\.js\?v=([0-9a-f]+)',html).group(1)
    html=html.replace('game.js?v='+old,'game.js?v='+h).replace('<title>Trading Card Collector</title>','<title>Trading Card Collector (%s)</title>'%ver); open(ip,'w',encoding='utf-8').write(html)
    sp=os.path.join(out,'sw.js'); sw=open(sp,encoding='utf-8').read(); sw=sw.replace('game.js?v='+old,'game.js?v='+h); sw=re.sub(r"const C='tcg-[^']*'","const C='tcg-%s-%s'"%(ver,h),sw,1); open(sp,'w',encoding='utf-8').write(sw)
    try: commit=subprocess.run(['git','rev-parse','--short','HEAD'],cwd=ROOT,capture_output=True,text=True).stdout.strip()
    except Exception: commit=''
    files=[]
    for d,_,fs in os.walk(out):
        for f in fs: p=os.path.join(d,f); files.append((os.path.relpath(p,out).replace(os.sep,'/'),os.path.getsize(p)))
    tot=sum(s for _,s in files); big=max(files,key=lambda x:x[1]); longest=max(len(r) for r,_ in files)
    meta={'name':'Trading Card Collector','version':ver,'built':datetime.date.today().isoformat(),'commit':commit,'files':len(files)+1,'bytes':tot,'tidemark_paintings_packed':len(ids),'paks':paks,'script_sha256_10':h}
    open(os.path.join(out,'RELEASE.json'),'w').write(json.dumps(meta,indent=1)+'\n'); files.append(('RELEASE.json',os.path.getsize(os.path.join(out,'RELEASE.json'))))
    zp=out+'.zip'
    with zipfile.ZipFile(zp,'w',zipfile.ZIP_DEFLATED) as z:
        for r,_ in sorted(files): z.write(os.path.join(out,r),r)
    ok=len(files)<=LIM_FILES and tot<=LIM_TOTAL and big[1]<=LIM_ONE and os.path.isfile(os.path.join(out,'index.html'))
    print(f'{name}  (commit {commit})')
    print(f'  files     {len(files):,}  (limit {LIM_FILES:,}: {"ok" if len(files)<=LIM_FILES else "OVER"})   Tidemark paintings: {len(ids):,} packed into {paks} pak files, {len(LOOSE)} left loose')
    print(f'  extracted {tot/1e6:.1f} MB  (limit {LIM_TOTAL/1e6:.0f} MB: {"ok" if tot<=LIM_TOTAL else "OVER"})   largest file {big[1]/1e6:.2f} MB {big[0]} (limit {LIM_ONE/1e6:.0f} MB)   longest path {longest} characters')
    print(f'  zip       {zp}  ({os.path.getsize(zp)/1e6:.1f} MB)   index.html at the zip root: yes')
    print('  RESULT', 'WITHIN LIMITS' if ok else 'OVER A LIMIT')
    return 0 if ok else 1
if __name__=='__main__': sys.exit(main())
