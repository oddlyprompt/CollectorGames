#!/usr/bin/env python3
"""Checks a release candidate made by tools/release.py without a browser (used by the GitHub workflow and by hand).
   python3 tools/release_verify.py release/trading-card-collector-<version> [release/trading-card-collector-<version>.zip]
Checks: index.html at the root; RELEASE.json present and true (version, file count, size, paks); the page loads the exact
game.js and style.css it ships; every file the game, page, style sheet and offline cache refer to is in the package (a Tidemark
painting may instead be inside a pak, and its bytes must lie within that pak); the host limits (1,000 files, 500 MB, 200 MB per
file); and, if a zip is given, that it holds exactly the same files with index.html at its root. Exit code 0 only if all pass."""
import os, sys, re, json, zipfile, shutil, subprocess
LIM_FILES, LIM_TOTAL, LIM_ONE = 1000, 500*10**6, 200*10**6
FAIL=[]
def check(ok, msg, x=''):
    print(('PASS ' if ok else 'FAIL ')+msg+('' if ok or x=='' else '  '+str(x)[:400]))
    if not ok: FAIL.append(msg)
def main():
    if len(sys.argv)<2: print(__doc__); return 2
    d=sys.argv[1].rstrip('/'); z=sys.argv[2] if len(sys.argv)>2 else None
    files={}
    for root,_,fs in os.walk(d):
        for f in fs: p=os.path.join(root,f); files[os.path.relpath(p,d).replace(os.sep,'/')]=os.path.getsize(p)
    check('index.html' in files, 'index.html is at the root of the package')
    check('RELEASE.json' in files, 'RELEASE.json is at the root of the package')
    meta=json.load(open(os.path.join(d,'RELEASE.json'))) if 'RELEASE.json' in files else {}
    tot=sum(files.values()); big=max(files.items(), key=lambda x:x[1])
    check(meta.get('files')==len(files), 'RELEASE.json counts the files correctly', (meta.get('files'), len(files)))
    check(abs(meta.get('bytes',0)-tot)<=10000, 'RELEASE.json gives the right size', (meta.get('bytes'), tot))
    check(bool(meta.get('version')) and os.path.basename(d).endswith(meta.get('version','?')), 'the version in RELEASE.json matches the folder name', meta.get('version'))
    check(len(files)<=LIM_FILES, f'{len(files)} files (host limit {LIM_FILES})')
    check(tot<=LIM_TOTAL, f'{tot/1e6:.1f} MB in all (host limit {LIM_TOTAL/1e6:.0f} MB)')
    check(big[1]<=LIM_ONE, f'largest file {big[0]} {big[1]/1e6:.1f} MB (host limit {LIM_ONE/1e6:.0f} MB)')
    html=open(os.path.join(d,'index.html'),encoding='utf-8').read()
    js=open(os.path.join(d,'game.js'),encoding='utf-8').read() if 'game.js' in files else ''
    css=open(os.path.join(d,'style.css'),encoding='utf-8').read() if 'style.css' in files else ''
    sw=open(os.path.join(d,'sw.js'),encoding='utf-8').read() if 'sw.js' in files else ''
    check(meta.get('version','?') in html and ('window.TCG_VERSION="%s"'%meta.get('version','?')) in js, 'the page title and the game carry the version')
    for ref in re.findall(r'(?:src|href)="([^"#:]+?)(?:\?[^"]*)?"', html):
        check(ref in files, 'index.html refers to '+ref+', which is in the package')
    # the offline cache list
    m=re.search(r"const A=\[([^\]]*)\]", sw); cached=[x.split('?')[0] for x in re.findall(r"'([^']+)'", m.group(1))] if m else []
    miss=[x for x in cached if x not in ('./',) and x not in files]
    check(bool(cached) and not miss, f'every file the offline cache pre-loads is in the package ({len(cached)})', miss)
    # paintings packed into paks
    pk=re.search(r'window\.TM_PAKS=(\{.*?\});\n', js); idx=json.loads(pk.group(1))['idx'] if pk else {}
    check(len(idx)==meta.get('tidemark_paintings_packed'), f'the pak index lists {len(idx)} paintings, as RELEASE.json says')
    bad=[i for i,(n,off,ln) in idx.items() if ('art/tm-%d.pak'%n) not in files or off+ln>files['art/tm-%d.pak'%n] or ln<100]
    check(not bad, 'every packed painting lies inside its pak file', bad[:5])
    # every art file referred to by the game, the page or the style sheet
    refs=set(re.findall(r'art/[A-Za-z0-9_.\-]+\.(?:webp|png|jpg|jpeg|svg)', js+html+css))
    missing=[]
    for r in sorted(refs):
        if r in files: continue
        mm=re.match(r'art/(TMI-[A-Za-z0-9]+)\.webp$', r)
        if mm and mm.group(1) in idx: continue
        missing.append(r)
    check(len(refs)>1000 and not missing, f'all {len(refs)} pictures the game refers to are in the package (loose or packed)', missing[:8])
    node=shutil.which('node')
    if node:
        r=subprocess.run([node,'--check',os.path.join(d,'game.js')],capture_output=True,text=True)
        check(r.returncode==0, 'game.js is valid JavaScript (node --check)', r.stderr[-400:])
    else: print('NOTE node not found: game.js syntax not checked')
    for need in ['vendor/three.min.js','manifest.webmanifest','icons/icon-192.png','broken-reach/index.html']:
        check(need in files, need+' is in the package')
    if z:
        with zipfile.ZipFile(z) as f:
            names=[i.filename for i in f.infolist() if not i.is_dir()]
            sizes={i.filename:i.file_size for i in f.infolist() if not i.is_dir()}
            check('index.html' in names, 'the zip has index.html at its root (not inside a folder)')
            check(set(names)==set(files) and all(sizes[n]==files[n] for n in names), f'the zip holds exactly the {len(files)} files of the package', sorted(set(names)^set(files))[:5])
            check(f.testzip() is None, 'every file in the zip reads back without error')
    print('RESULT', 'ALL PASS' if not FAIL else 'FAIL '+str(len(FAIL))); return 1 if FAIL else 0
if __name__=='__main__': sys.exit(main())
