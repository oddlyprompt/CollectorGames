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
def pic(path,w=1024,h=1024,col=(120,60,40)):
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
pic(os.path.join(d2,b2[0]['file']),1600,1200); pic(os.path.join(d2,b2[1]['file']),300,300); pic(os.path.join(d2,'random-name.png')); pic(os.path.join(d2,b2[2]['file'])); pic(os.path.join(d2,b2[3]['file']))
with open(os.path.join(d2,'production-status.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','file','sha256','notes']); w.writerow([b2[2]['id'],b2[2]['file'],'0'*64,'']); w.writerow([b2[0]['id'],b2[0]['file'],'',''])
r=run(d2); out=r.stdout+r.stderr
check(r.returncode!=0 and 'must be square' in out and 'below the minimum' in out and 'not a picture the queue asked for' in out and 'sha256 does not match' in out and 'not listed in the delivery manifests' in out, 'wrong aspect, too small, unknown name, bad sha256 and an unlisted picture are all rejected', out)
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
m=[i for i in items if i['kind']=='master'][0]; d5=os.path.join(tmp,'d5'); pic(os.path.join(d5,m['file']),1800,1200); pic(os.path.join(d5,'M00_labelled_contact.jpg'),600,800); pic(os.path.join(d5,'BR-QUEUE-S001_raw.png'),1254,1254); r=run(d5)
check(r.returncode==0 and os.path.exists(os.path.join(BP,'approved','masters',m['id']+'.webp')) and m['id'] in reg() and '2 support files' in r.stdout, 'a master design sheet is filed under approved/masters; raw sheets and contact previews are ignored', r.stdout)
# premium art is portrait; a truncated file is rejected; a continuity-lock copy must match; prompts and artist notes are kept
alt=[i for i in items if i['kind']=='alt'][0]; d6=os.path.join(tmp,'d6'); pic(os.path.join(d6,alt['file']),900,1200); wrong=[i for i in items if i['kind']=='alt'][1]; pic(os.path.join(d6,wrong['file']),1200,900)
open(os.path.join(d6,'BR01-070_prompt.txt'),'w').write('x')
r=run(d6); check('premium art must be portrait' in (r.stdout+r.stderr) and alt['id'] in reg() and wrong['id'] not in reg(), 'premium arts must be portrait', r.stdout)
b3=[i for i in items if i['batch']=='B01'][8]; d7=os.path.join(tmp,'d7'); pic(os.path.join(d7,b3['file'])); good=open(os.path.join(d7,b3['file']),'rb').read(); open(os.path.join(d7,b3['file']),'wb').write(good[:len(good)//2])
r=run(d7); check('damaged or truncated' in (r.stdout+r.stderr) and b3['id'] not in reg(), 'a truncated picture is rejected', r.stdout)
b4=[i for i in items if i['batch']=='B01'][9]; d8=os.path.join(tmp,'d8'); pic(os.path.join(d8,b4['file'])); os.makedirs(os.path.join(d8,'continuity-locks')); shutil.copy(os.path.join(d8,b4['file']),os.path.join(d8,'continuity-locks',b4['file'])); open(os.path.join(d8,b4['id']+'_prompt.txt'),'w').write('the prompt')
with open(os.path.join(d8,'review-manifest.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['sheet','base_card_id','variant_id','art_file','artist_name','review_status','sha256']); w.writerow(['SHEET-X',b4['id'],'',b4['file'],'Mara Veylan','pending owner approval',sha(os.path.join(d8,b4['file']))])
r=run(d8); R=reg(); check(r.returncode==0 and R[b4['id']].get('artist')=='Mara Veylan' and R[b4['id']].get('sheet')=='SHEET-X' and os.path.exists(os.path.join(BP,'approved','prompts',b4['id']+'.txt')) and '1 continuity-lock' in r.stdout, 'artist, sheet and prompt are recorded; a continuity-lock copy of the same picture is accepted', r.stdout)
pic(os.path.join(d8,'continuity-locks',b4['file']),col=(1,2,3)); r=run(d8); check('continuity-lock copy differs' in (r.stdout+r.stderr), 'a continuity-lock copy that differs from the filed picture is an error', r.stdout)
r=run('--status'); check('M00' in r.stdout and 'B01' in r.stdout, 'status lists every batch', r.stdout[:120])
shutil.rmtree(tmp,ignore_errors=True)
print('RESULT','ALL PASS' if not FAIL else 'FAIL %d: %s'%(len(FAIL),FAIL)); sys.exit(1 if FAIL else 0)
