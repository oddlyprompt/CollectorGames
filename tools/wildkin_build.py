"""Turns wildkin-production/manifest.json and approved/registry.json into game data for the Wildkin build.

Called by tools/build.py for the tcg game: returns the JavaScript for WK_CANON (cards) and WK_ART (approved art files),
and copies only the approved images that cards use into dist/tcg/art/. Art that is not approved is simply absent from
WK_ART, so the card renderer draws its labelled placeholder."""
import os, json, shutil, subprocess, hashlib, tempfile
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WP=os.environ.get('WILDKIN_PRODUCTION') or os.path.join(ROOT,'wildkin-production')
RAR={'common':'common','uncommon':'unc','rare':'rare','essence':'ess','ir':'ir','fa':'fa','sir':'sir','csr':'csr'}
CAT={'creature':'creature','ally':'ally','gear':'gear','biome':'biome','tactic':'tactic','essence':'essence'}

def meta_json(canons):
    """The field (decks and matchups) for a group of sets legal together, from the rules engine, run in Node. Cached by
    the cards and the engine source; without Node the game computes it itself (slower), so this is an optimisation."""
    node=os.environ.get('NODE') or shutil.which('node') or ('/opt/node22/bin/node' if os.path.exists('/opt/node22/bin/node') else None)
    if not node: print('        (node not found: the Wildkin field will be computed in the browser)'); return 'null'
    src=open(os.path.join(ROOT,'src','engine','tcg_rules.js'),'rb').read()
    cjs=[json.dumps(c,sort_keys=True,ensure_ascii=False).encode('utf-8') for c in canons]; key=hashlib.sha256(src+b'|'.join(cjs)).hexdigest()[:16]
    cache=os.path.join(ROOT,'dist','.wk_meta_'+key+'.json')
    if os.path.exists(cache): return open(cache,encoding='utf-8').read()
    tmps=[]
    try:
        for cj in cjs:
            with tempfile.NamedTemporaryFile('wb',suffix='.json',delete=False) as f: f.write(cj); tmps.append(f.name)
        out=subprocess.run([node,os.path.join(ROOT,'tools','wildkin_meta.js')]+tmps,capture_output=True,check=True,timeout=1800).stdout.decode('utf-8')
    finally:
        for t in tmps: os.unlink(t)
    os.makedirs(os.path.dirname(cache),exist_ok=True)
    open(cache,'w',encoding='utf-8').write(out); print('        Wildkin field for %d set(s) computed with the rules engine (%d decks)'%(len(canons),len(json.loads(out)['cands']))); return out

# Presentation only (not canon, not part of the manifest's art layout): the approved biome scene drawn behind each Ally's
# cutout so heroes stand somewhere instead of on a flat panel. Keepers and friends get daylight places; Veyra's side gets dusk.
ALLY_BACKDROP={'Professor Maren Vale':'scene.verdant.06','June Kestrel':'scene.verdant.01','Warden Sorrel Pike':'scene.stone.04','Toma Reed':'scene.tide.04',
 'Lita Moss':'scene.verdant.05','Nessa Flint':'scene.stone.08','Elder Oren':'scene.stone.09','Pip Rowan':'scene.wonder.03','Archivist Sera Wynn':'scene.astral.09',
 'Renn Calder':'scene.stone.01','Mira Quill':'scene.astral.03','Sel Veyra':'scene.dusk.03','Cass Rell':'scene.dusk.02','Dr. Cyl Vane':'scene.iron.04',
 'Marshal Rook':'scene.iron.01','Iris Shade':'scene.dusk.01','Dex Harrow':'scene.storm.01','Brin Hollow':'scene.astral.01'}
SETS=['manifest.json','manifest-dsk.json']   # set 1 First Bond, set 2 Duskfall (tools/wildkin_dsk.py); a missing file ends the list
def canon_of(m, sp, reg, used):
    byid={c['id']:c for c in m['cards']}; cards=[]
    for c in m['cards']:
        base=byid[c['identity_of']] if c['category']=='premium' else c
        g=base.get('gameplay',{}); a=c['art']
        x={'no':c['number'],'id':c['id'],'kind':CAT.get(base['category'],'creature') if c['category']=='premium' else CAT[c['category']],'rar':RAR[c['rarity']['value']],'name':c['name'],
           'rs':c['rarity']['status']}
        if c['category']=='premium': x['same']=base['number']; x['pk']=c['premium_kind']
        if c.get('reprint_of'): s_,n_=c['reprint_of'].split('-')[1:]; x['ident']=int(s_[1:])*1000+int(n_)   # WK-S001-002 -> 1002: plays as that card
        if base['category']=='creature':
            s=sp[base['species']]
            x.update({'sp':s['id'],'el':s['affinity']['primary'],'el2':s['affinity']['secondary'],'els':s['affinity']['status'],'stage':s['stage_label'],'fam':s['family'],'fams':s['family_status'],
                      'from':sp[s['evolves_from']]['name'] if s['evolves_from'] else None,'to':sp[s['evolves_to']]['name'] if s['evolves_to'] else None,'mascot':s['mascot'],'fan':s['fandom']['value'],
                      'hp':g['hp'],'atk':[[t['name'],t['cost'],t['damage'],t['text'],t['ops'],t['damage_label']] for t in g['attacks']],'weak':g['weakness'],'ret':g['retreat'],'pz':g['prizes']})
            if g.get('ability'): x['ab']=[g['ability']['name'],g['ability']['kind'],g['ability']['text'],g['ability']['ops']]
        else:
            x['rules']=g.get('rules',''); x['fx']=g.get('ops',[]); x['role']=g.get('role'); x['sub']=g.get('subtype'); x['fan']=base['fandom']['value'] if base.get('fandom') else 0.3
            if base['category']=='biome': x['el']=base['biome_affinity']['value']
            if base['category']=='essence': x['el']=base['essence_affinity']['value']
        art={'l':a['layout']}
        for k,s_ in (('subject','s'),('background','b'),('illustration','i'),('interim','x')):
            if a.get(k): art[s_]=a[k]; used.add(a[k])
        if base['category']=='ally':
            bd=base['art'].get('backdrop') or ALLY_BACKDROP.get(base['name'].split(' — ')[0])
            if bd: art['bd']=bd; used.add(bd)
        x['art']=art; cards.append(x)
    S=m['set']; head={'id':S['id'],'n':S['number'],'name':S['name'],'code':S['code'],'rel':S['release_date']['value'],'base':S['base'],'total':S['total'],'odds':S['rare_slot_odds'],'mv':m['manifest_version'],'rv':m['rules']['version'] if 'rules' in m else 1}
    return {'set':head,'cards':cards}
def canon_js(out_dir):
    ms=[]
    for f in SETS:
        p=os.path.join(WP,f)
        if not os.path.exists(p): break
        ms.append(json.load(open(p,encoding='utf-8')))
    m=ms[0]; reg=json.load(open(os.path.join(WP,'approved','registry.json'),encoding='utf-8'))['assets']
    sp={s['id']:s for x in ms for s in x['species']}; used=set()
    canons=[canon_of(x,sp,reg,used) for x in ms]
    canons[0]['set'].update({'weak':m['weakness'],'aff':[{'n':a['name'],'c':a['colour'],'d':a['dark'],'l':a['light']} for a in m['affinities']]})
    used.add('cut.001-cactuft.standing')   # booster wrapper art
    used.update(k for k in reg if k.startswith('product.'))   # approved packaging renders (packs, boxes)
    os.makedirs(os.path.join(out_dir,'art'),exist_ok=True); arts={}
    for aid in sorted(used):
        r=reg.get(aid)
        if not r: continue
        src=os.path.join(ROOT,r['file']); ext=src.rsplit('.',1)[1]; fn=aid+'.'+ext; shutil.copy2(src,os.path.join(out_dir,'art',fn))
        im=Image.open(src); w,h=im.size; e={'u':'art/'+fn+'?h='+r['sha256'][:8],'w':w,'h':h}
        if 'A' in im.getbands():   # cutouts: the subject's box inside its transparent margin, so the card can size the subject itself
            bb=im.getchannel('A').point(lambda v:255 if v>24 else 0).getbbox()
            if bb and bb!=(0,0,w,h): e['bb']=list(bb)
        if r.get('tags'): e['t']=r['tags'].get('time'); e['f']=r['tags'].get('floor')
        arts[aid]=e
    # the field for each group of sets that is Standard at some point (the newest three)
    metas={}
    for i in range(len(canons)):
        grp=list(range(max(0,i-2),i+1)); metas[','.join(str(j+1) for j in grp)]='%s'%meta_json([canons[j] for j in grp])
    js='// generated by tools/wildkin_build.py from wildkin-production/manifest*.json (do not edit)\nconst WK_SETS=['+','.join(json.dumps(c,ensure_ascii=False,separators=(',',':')) for c in canons)+'];\nconst WK_CANON=WK_SETS[0];\nconst WK_ART='+json.dumps(arts,separators=(',',':'))+';\nconst WK_METAS={'+','.join('"%s":%s'%(k,v) for k,v in metas.items())+'};\nconst WK_META=WK_METAS["1"];\n'
    return js, len(arts), sum(len(c['cards']) for c in canons)
