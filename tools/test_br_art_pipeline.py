#!/usr/bin/env python3
"""The Broken Reach art pipeline on a scratch copy of broken-reach-production/ (the real one is never touched).   python3 tools/test_br_art_pipeline.py
Synthetic deliveries prove: a clean batch is filed as awaiting review; wrong aspect, too small, unknown names and a bad sha256 are rejected; nothing is replaced without
--replace and the old file is kept; a revision (-v02) replaces and keeps the previous one; only approved pictures reach the game; a contact sheet is written."""
import os, sys, json, shutil, subprocess, tempfile, hashlib, csv
from PIL import Image, ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0,os.path.join(ROOT,'tools'))
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
tmp=tempfile.mkdtemp(prefix='brart-'); BP=os.path.join(tmp,'broken-reach-production'); os.makedirs(BP); shutil.copy(os.path.join(ROOT,'broken-reach-production','art_queue.json'),BP)
shutil.copytree(os.path.join(ROOT,'broken-reach-production','set01'),os.path.join(BP,'set01'))
def run(*a):
    r=subprocess.run([sys.executable,os.path.join(ROOT,'tools','brokenreach','art_intake.py'),'--root',tmp]+list(a),capture_output=True,text=True); return r
def pic(path,w=1600,h=1200,col=(120,60,40)):
    im=Image.new('RGB',(w,h),col); d=ImageDraw.Draw(im); d.rectangle((w//4,h//4,3*w//4,3*h//4),fill=(col[0]+60,col[1]+40,col[2]+30)); os.makedirs(os.path.dirname(path),exist_ok=True); im.save(path)
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
reg=lambda: json.load(open(os.path.join(BP,'approved','registry.json'),encoding='utf-8'))['assets'] if os.path.exists(os.path.join(BP,'approved','registry.json')) else {}
Q=json.load(open(os.path.join(BP,'art_queue.json'),encoding='utf-8')); items=Q['items']
check(len(items)==221 and Q['batches'][0]=='M00' and sum(i['kind']=='master' for i in items)==14 and sum(i['kind']=='base' for i in items)==180 and sum(i['kind']=='alt' for i in items)==27, 'the queue: 14 master designs first, 180 base cards, 27 premium arts', len(items))
check(len({i['file'] for i in items})==221 and all(i['file'].startswith(('BR01-','MASTER-')) for i in items), 'every picture has its own file name')
check(all(len(i['refs'])>0 for i in items if i['kind']!='master' and i['name'].split(' — ')[0] in ('Kaia Venn','Tavi','Dorrak','Elias Voss','Lyssara Vale','Neru Sael','Rix Vanno','Silas Veyne')) and all(i.get('differs_from') for i in items if i['kind']=='alt'), 'cast cards point at their master designs; premium arts name the base picture they must differ from')
b1=[i for i in items if i['batch']=='B01'][:3]
d1=os.path.join(tmp,'d1')
for n,i in enumerate(b1): pic(os.path.join(d1,'img',i['file']),col=(100+n*20,60,40))
with open(os.path.join(d1,'production-status.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','file','sha256','notes']); [w.writerow([i['id'],i['file'],sha(os.path.join(d1,'img',i['file'])),'']) for i in b1]
r=run(d1); R=reg()
check(r.returncode==0 and all(R.get(i['id'],{}).get('status')=='delivered-awaiting-owner-review' for i in b1) and all(os.path.exists(os.path.join(BP,'approved','art',i['id']+'.webp')) for i in b1), 'a clean batch is filed as delivered, awaiting owner review', r.stdout+r.stderr)
check(os.path.exists(os.path.join(BP,'review','B01.jpg')), 'a labelled contact sheet is written for the batch')
# rejections
d2=os.path.join(tmp,'d2'); b2=[i for i in items if i['batch']=='B01'][3:8]
pic(os.path.join(d2,b2[0]['file']),1600,1600); pic(os.path.join(d2,b2[1]['file']),800,600); pic(os.path.join(d2,'random-name.png')); pic(os.path.join(d2,b2[2]['file'])); pic(os.path.join(d2,b2[3]['file']))
with open(os.path.join(d2,'production-status.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','file','sha256','notes']); w.writerow([b2[2]['id'],b2[2]['file'],'0'*64,'']); w.writerow([b2[0]['id'],b2[0]['file'],'',''])
r=run(d2); out=r.stdout+r.stderr
check(r.returncode!=0 and 'not landscape 4:3' in out and 'below the minimum' in out and 'not a picture the queue asked for' in out and 'sha256 does not match' in out and 'not listed in production-status.csv' in out, 'wrong aspect, too small, unknown name, bad sha256 and an unlisted picture are all rejected', out)
check(not any(i['id'] in reg() for i in b2[:4]), 'rejected pictures are not filed')
# no overwrite, revision keeps the old file
before=sha(os.path.join(BP,'approved','art',b1[0]['id']+'.webp')); d3=os.path.join(tmp,'d3'); pic(os.path.join(d3,b1[0]['file']),col=(10,200,10)); r=run(d3)
check('already filed' in r.stdout and sha(os.path.join(BP,'approved','art',b1[0]['id']+'.webp'))==before, 'a filed picture is never replaced without --replace', r.stdout)
d4=os.path.join(tmp,'d4'); pic(os.path.join(d4,b1[0]['file'].replace('_base.png','_base-v02.png')),col=(10,200,10)); r=run(d4,'--replace')
check(r.returncode==0 and reg()[b1[0]['id']]['v']==2 and os.path.exists(os.path.join(BP,'approved','previous',b1[0]['id']+'-v01.webp')) and sha(os.path.join(BP,'approved','art',b1[0]['id']+'.webp'))!=before, 'a -v02 revision replaces with --replace and the first version is kept in approved/previous', r.stdout)
# approval and the game
import brokenreach_collect_build as cb; cb.ROOT=tmp
check(cb.approved_art()=={}, 'nothing reaches the game before the owner approves it')
r=run('--approve',b1[0]['id']+','+b1[1]['id'],'--note','looks right'); a=cb.approved_art()
check(set(a)=={b1[0]['id'],b1[1]['id']} and reg()[b1[2]['id']]['status']=='delivered-awaiting-owner-review', 'approving two pictures makes exactly those two reach the game', (list(a),r.stdout))
out=os.path.join(tmp,'dist'); os.makedirs(out); js,nb,na,nart=cb.build(out)
check(nart==2 and os.path.exists(os.path.join(out,'art','br-'+b1[0]['id']+'.webp')) and ('"'+b1[0]['id']+'"') in js and ('"'+b1[2]['id']+'"') not in js.split('BR_ART_MAP')[1], 'the build copies and maps only approved art', nart)
# a master design is stored separately and never reaches cards
m=[i for i in items if i['kind']=='master'][0]; d5=os.path.join(tmp,'d5'); pic(os.path.join(d5,m['file']),1800,1200); r=run(d5)
check(r.returncode==0 and os.path.exists(os.path.join(BP,'approved','masters',m['id']+'.webp')) and m['id'] in reg(), 'a master design sheet is filed under approved/masters', r.stdout)
r=run('--status'); check('M00' in r.stdout and 'B01' in r.stdout, 'status lists every batch', r.stdout[:120])
shutil.rmtree(tmp,ignore_errors=True)
print('RESULT','ALL PASS' if not FAIL else 'FAIL %d: %s'%(len(FAIL),FAIL)); sys.exit(1 if FAIL else 0)
