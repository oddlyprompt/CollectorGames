#!/usr/bin/env python3
"""End-to-end test of the Wildkin art intake, run on a scratch copy of wildkin-production/ (the real one is never touched).

  python3 tools/test_art_pipeline.py

Builds synthetic SOL deliveries from the owner's existing sheets (stand-ins: the pipeline checks format, not identity) and proves:
a clean sheet passes; clipping, wrong screen colour, wrong size, blank cells and unknown names are caught; approval never overwrites
approved art; --replace keeps the old piece; rejection files the delivery with its reason; reruns are idempotent; approved pieces
reach the game's art map; a contact sheet and report are written for every delivery."""
import os, sys, json, shutil, subprocess, tempfile
from PIL import Image, ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
def run(*a, ok=True):
    r=subprocess.run([sys.executable,os.path.join(ROOT,'tools','wildkin_art.py')]+list(a),capture_output=True,text=True,env=ENV)
    if ok and r.returncode!=0: print(r.stdout,r.stderr)
    return r
def grid(cells, W, H, gut=6, bg=(10,10,12)):
    im=Image.new('RGB',(W,H),bg); cw=(W-2*gut)//3; ch=(H-2*gut)//3
    for i,c in enumerate(cells):
        if c is None: continue
        x=(i%3)*(cw+gut); y=(i//3)*(ch+gut); im.paste(c.resize((cw,ch),Image.LANCZOS),(x,y))
    return im
def sheet_cells(path):
    im=Image.open(path).convert('RGB'); sys.path.insert(0,os.path.join(ROOT,'tools')); import ingest
    xr,yr=ingest.cells(im,3,3); return [im.crop((x0,y0,x1,y1)) for (y0,y1) in yr for (x0,x1) in xr]
tmp=tempfile.mkdtemp(prefix='wkart-'); WP=os.path.join(tmp,'wildkin-production'); shutil.copytree(os.path.join(ROOT,'wildkin-production'),WP)
# start from a clean baseline whatever has been delivered for real: only the owner's earlier (legacy) art approved, nothing delivered, nothing checked
for f in os.listdir(os.path.join(WP,'incoming')):
    q=os.path.join(WP,'incoming',f)
    if f!='README.md': shutil.rmtree(q) if os.path.isdir(q) else os.remove(q)
_rp=os.path.join(WP,'approved','registry.json'); _R=json.load(open(_rp)); _R['assets']={k:v for k,v in _R['assets'].items() if v.get('task')=='legacy'}; _R.pop('history',None); json.dump(_R,open(_rp,'w'))
for f in os.listdir(os.path.join(WP,'reports')):
    if f.startswith(('SHEET-','SIR-')): shutil.rmtree(os.path.join(WP,'reports',f))
if os.path.exists(os.path.join(WP,'reports','intake.json')): os.remove(os.path.join(WP,'reports','intake.json'))
subprocess.run([sys.executable,os.path.join(ROOT,'tools','wildkin_manifest.py')],env=dict(os.environ,WILDKIN_PRODUCTION=WP),capture_output=True)
ENV=dict(os.environ, WILDKIN_PRODUCTION=WP); INC=os.path.join(WP,'incoming')
reg0=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
cact=os.path.join(ROOT,'art-source','creatures','cactuft-poses-magenta.png'); bash=os.path.join(ROOT,'art-source','creatures','bashlet-poses-green.png'); koi=os.path.join(ROOT,'art-source','creatures','koi-poses-green.png')
# deliveries
flap=os.path.join(ROOT,'art-source','creatures','flapod-poses-green.png'); shutil.copy(flap,os.path.join(INC,'SHEET-10.png'))   # clean, but every cell already approved
shutil.copy(bash,os.path.join(INC,'SHEET-03.png'))                                            # clean stand-in for the Bashlet family
json.dump({'task_id':'SHEET-03','manifest_version':'1.0.0','made_by':'test','prompt':'stand-in'},open(os.path.join(INC,'SHEET-03.json'),'w'))
shutil.copy(koi,os.path.join(INC,'SHEET-11.png'))                                             # three cells touch the edge
shutil.copy(cact,os.path.join(INC,'SHEET-02.png'))                                            # magenta screen, task wants green
Image.open(bash).resize((800,800)).save(os.path.join(INC,'SHEET-05.png'))                     # too small
shutil.copy(bash,os.path.join(INC,'sheet3.png'))                                               # not a task name
ce=Image.open(os.path.join(ROOT,'art-source','chase-examples','cactuft-fullart-examples.png')).convert('RGB'); w=ce.width//3
paint=[ce.crop((i*w+(w-int(w*5/7))//2,0,i*w+(w-int(w*5/7))//2+int(w*5/7),ce.height)) for i in range(3)]
grid(paint+[None]*6,2112,2952).save(os.path.join(INC,'SHEET-39.png'))                          # premium: cells 1-3 painted, 4-9 blank
paint[0].resize((1500,2100),Image.LANCZOS).save(os.path.join(INC,'SIR-173.png'))              # a single SIR
# ---- check
r=run('check'); out=r.stdout; print(out)
I=json.load(open(os.path.join(WP,'reports','intake.json')))['deliveries']; by={v['file']:v for v in I.values()}
check(by['SHEET-10.png']['result']=='pass', 'clean cutout sheet passes', by['SHEET-10.png']['result'])
check(by['SHEET-03.png']['result'] in ('pass','warn'), 'Bashlet stand-in sheet passes', by['SHEET-03.png']['result'])
rep11=json.load(open(os.path.join(WP,by['SHEET-11.png']['report'],'report.json')))
clipped=[c['cell'] for c in rep11['cells'] if any('touches the cell edge' in e for e in c['errors'])]
check(by['SHEET-11.png']['result']=='fail' and len(clipped)>=2, 'clipped subjects are caught', clipped)
rep02=json.load(open(os.path.join(WP,by['SHEET-02.png']['report'],'report.json')))
check(any('screen colour is magenta' in e for e in rep02['errors']), 'wrong screen colour is caught')
rep05=json.load(open(os.path.join(WP,by['SHEET-05.png']['report'],'report.json')))
check(any('too small' in e for e in rep05['errors']), 'undersized sheet is caught')
check('sheet3.png: not a known task file name' in out, 'unknown file names are reported and left alone')
rep39=json.load(open(os.path.join(WP,by['SHEET-39.png']['report'],'report.json')))
blank=[c['cell'] for c in rep39['cells'] if any('blank' in e for e in c['errors'])]; okc=[c['cell'] for c in rep39['cells'] if not c['errors']]
check(blank==[4,5,6,7,8,9] and okc==[1,2,3], 'premium sheet: painted cells pass, blank cells fail', (okc,blank))
check(by['SIR-173.png']['result']=='pass', 'single SIR illustration passes', by['SIR-173.png']['result'])
check(all(os.path.exists(os.path.join(WP,v['report'],'contact.png')) and os.path.exists(os.path.join(WP,v['report'],'report.md')) for v in I.values()), 'every delivery has a contact sheet and a report')
r2=run('check'); check(r2.stdout.count('already checked')==len(I), 'rerunning check is idempotent', r2.stdout.count('already checked'))
# ---- approve
r=run('approve','SHEET-10'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
same=all(R[k]['sha256']==reg0[k]['sha256'] for k in reg0)
check('approved 0 piece' in r.stdout and same, 'approving a sheet never overwrites approved art', r.stdout.strip()[:120])
I10=[v for v in json.load(open(os.path.join(WP,'reports','intake.json')))['deliveries'].values() if v['file']=='SHEET-10.png'][0]
check(not os.path.exists(os.path.join(WP,'approved','sources','SHEET-10')) and I10['state']=='superseded', 'a sheet with nothing new to approve leaves no source copy and is not retried', I10['state'])
r=run('approve','SHEET-03','--allow-warnings'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
new=[k for k in R if k not in reg0]
check(any('maceback' in k for k in new) and any('fortisaur' in k for k in new) and R['cut.005-bashlet.standing']['sha256']==reg0['cut.005-bashlet.standing']['sha256'], 'new cells approved, the approved Bashlet poses kept', new)
check(R[new[0]]['provenance']['metadata'].get('made_by')=='test' and len(R[new[0]]['source_sha256'])==64 and R[new[0]]['task']=='SHEET-03' and R[new[0]]['approved_by'], 'provenance recorded (metadata, source sheet hash, who and when)')
src_keep=[f for f in os.listdir(os.path.join(WP,'approved','sources','SHEET-03'))]
check(any(f.endswith('.png') and not f.startswith('delivered') for f in src_keep), 'the original sheet is kept with the approved pieces', src_keep)
r=run('approve','SHEET-11','--allow-warnings'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
took=[k for k in R if k.startswith('cut.024') or k.startswith('cut.025') or k.startswith('cut.026')]
check(len(took)==9-len(clipped) and 'has errors' in r.stdout, 'clipped cells are refused, clean cells of the same sheet can be approved', (len(took),len(clipped)))
r=run('approve','SHEET-39','--cells','1,2,3'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
check(all(k in R for k in ('ill.141-cactuft-ir','ill.142-prismotl-ir','ill.143-bashlet-ir')), 'premium cells approved one by one', r.stdout.strip())
r=run('approve','SIR-173'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
check('ill.173-cactuft-sir' in R, 'single illustration approved')
# ---- replace and reject
Image.eval(Image.open(bash).convert('RGB'),lambda v:int(v*0.97)).save(os.path.join(INC,'SHEET-03--v2.png')); run('check')   # a new attempt, different pixels
old=R['cut.006-maceback.standing']['sha256']; r=run('approve','SHEET-03','--cells','4','--allow-warnings'); R=json.load(open(os.path.join(WP,'approved','registry.json')))['assets']
check(R['cut.006-maceback.standing']['sha256']==old and 'already approved' in r.stdout, 'a second delivery does not replace approved art by itself')
r=run('approve','SHEET-03','--cells','4','--replace','--allow-warnings'); RR=json.load(open(os.path.join(WP,'approved','registry.json')))
sup=os.path.join(WP,'approved','superseded','cut.006-maceback.standing')
check(os.path.isdir(sup) and os.listdir(sup) and RR.get('history'), '--replace swaps it and keeps the old piece and its record', os.listdir(sup) if os.path.isdir(sup) else None)
r=run('reject','SHEET-02','--reason','wrong screen colour'); rj=os.listdir(os.path.join(WP,'rejected','SHEET-02'))
check(any(f.endswith('SHEET-02.png') for f in rj) and any(f.endswith('reason.txt') for f in rj) and not os.path.exists(os.path.join(INC,'SHEET-02.png')), 'rejection moves the file and records the reason', rj)
# ---- queue and game see it
q=json.load(open(os.path.join(WP,'art_queue.json')))['tasks']; t3=[t for t in q if t['task_id']=='SHEET-03'][0]
check(t3['production']['status']=='complete', 'the queue status updates after approval', t3['production'])
sys.path.insert(0,os.path.join(ROOT,'tools')); os.environ['WILDKIN_PRODUCTION']=WP
import importlib, wildkin_build; importlib.reload(wildkin_build)
js,na,nc=wildkin_build.canon_js(os.path.join(tmp,'dist'))
art=json.loads(js.split('const WK_ART=')[1].split(';\n')[0])
check('ill.173-cactuft-sir' in art and 'cut.006-maceback.standing' in art and os.path.exists(os.path.join(tmp,'dist','art','ill.173-cactuft-sir.webp')), 'approved pieces reach the game build (art map and files)', na)
r=run('ingest','--auto-approve'); check(r.returncode==0, 'ingest --auto-approve runs cleanly on a rerun', r.stdout.strip()[-120:])
mf=subprocess.run([sys.executable,os.path.join(ROOT,'tools','wildkin_manifest.py'),'--check'],capture_output=True,text=True,env=ENV)
check(mf.returncode==0, 'manifest still validates after intake', mf.stdout.strip())
shutil.rmtree(tmp)
print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
