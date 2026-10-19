"""Turns tidemark-production/ (cards.json, manifest.json, approved art, meta_library.json) and tools/tidemark/v1 (the rules engine) into
game data for the Tidemark build.

Called by tools/build.py for the tidemark game: returns the JavaScript that goes in front of the game code (TM_SETS, TM_CARDS, TM_PR,
TM_ART, TM_LIB and the rules engine wrapped as browser modules) and copies the approved art the cards use into dist/tidemark/art/.
Nothing here invents a card or a number: names, sets, numbers and art are the checklist's, rules are Version 1 (designed, not canon)."""
import os, json, shutil, subprocess, io, hashlib
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TP=os.path.join(ROOT,'tidemark-production'); V1=os.path.join(ROOT,'tools','tidemark','v1')
NODE=os.environ.get('NODE') or shutil.which('node') or ('/opt/node22/bin/node' if os.path.exists('/opt/node22/bin/node') else None)
SEASON_MONTH={'spring':4,'summer':7,'autumn':10}
RELEASE_TT='2026-06-26'   # decided 2026-10-19, not canon: a few weeks into a new game (the game starts 1 June 2026), a Friday

def third_friday(y,m):
    import datetime
    d=datetime.date(y,m,1); first=(4-d.weekday())%7+1   # Monday=0 -> Friday=4
    return datetime.date(y,m,first+14).isoformat()

def engine_cards():
    """The engine-shaped cards (tools/tidemark/v1/cards.js), straight from Node, so the browser plays exactly what the simulator plays."""
    if not NODE: raise SystemExit('Tidemark needs Node to read the card designs (tools/tidemark/v1/cards.js)')
    out=subprocess.run([NODE,'-e',"const {CARDS,ERRS}=require(%s); if (ERRS.length){ console.error(ERRS.slice(0,5)); process.exit(1);} process.stdout.write(JSON.stringify(CARDS));"%json.dumps(os.path.join(V1,'cards.js'))],capture_output=True,check=True).stdout.decode('utf-8')
    return json.loads(out)

def wrap(name, src):
    return "TM_MODS[%s]=function(module,exports,require,__dirname){\n%s\n};\n"%(json.dumps(name),src)

def engine_js():
    parts=["const TM_MODS={}, TM_LOADED={};\nfunction tmRequire(n){ n=n.replace(/^.*\\//,''); if (TM_LOADED[n]) return TM_LOADED[n].exports; const f=TM_MODS[n]; if (!f) throw new Error('no module '+n); const m={exports:{}}; TM_LOADED[n]=m; f(m,m.exports,tmRequire,''); return m.exports; }\n"]
    for f in ('ops.js','engine.js','decks.js'):
        parts.append(wrap(f, open(os.path.join(V1,f),encoding='utf-8').read()))
    parts.append(wrap('cards.js',"module.exports={CARDS:TM_CARDS};"))
    parts.append("TM_MODS['fs']=function(m){ m.exports={readFileSync:function(){ return JSON.stringify(TM_TUNED); }}; };\nTM_MODS['path']=function(m){ m.exports={join:function(){ return ''; }}; };\n")
    return ''.join(parts)

def build(out_dir):
    cj=json.load(open(os.path.join(TP,'cards.json'),encoding='utf-8')); man=json.load(open(os.path.join(TP,'manifest.json'),encoding='utf-8'))
    reg=json.load(open(os.path.join(TP,'approved','registry.json'),encoding='utf-8'))['assets']
    lib_path=os.path.join(TP,'meta_library.json')
    if not os.path.exists(lib_path): raise SystemExit('missing tidemark-production/meta_library.json (node tools/tidemark/v1/library.js)')
    lib=json.load(open(lib_path,encoding='utf-8'))
    eng=engine_cards(); by={c['id']:c for c in eng}
    mcards={c['card_id']:c for c in man['cards']}
    # sets, oldest first: the number of a set in the game is its position here (FT = 1 ... TT = 31)
    sets=[]
    for s in man['sets']:
        if s['code']=='TT': rel=RELEASE_TT; tot={'C':103,'U':63,'R':39,'L':15}
        else:
            rel=third_friday(s['year'],SEASON_MONTH[s['season']]); size=s['size']
            tot={'C':round(size*0.5),'U':round(size*0.3),'R':round(size*0.15)}; tot['L']=size-sum(tot.values())
        sets.append({'n':len(sets)+1,'code':s['code'],'name':s['name'],'year':s['year'],'season':s['season'],'era':s['era'],'size':s['size'],'named':s['named_cards'],'rel':rel,'tot':tot})
    codes={s['code']:s['n'] for s in sets}
    # cards: engine data plus the printed text and what the checklist says about each
    pr_by_card={}
    for p in cj['printings']: pr_by_card.setdefault(p['card'],p)
    cards=[]
    for c in eng:
        x=dict(c); p=pr_by_card[c['id']]; x['kwline']=p['kwline']; x['rules']=p['rules']; m=mcards[c['id']]; x['res']=1 if m['reserve_list'] else 0
        x['first']=m['first_printing']; x.pop('src',None); x.pop('note',None)
        cards.append(x)
    prs=[]; used=set()
    for p in cj['printings']:
        alt=p['alt']; prs.append({'s':codes[p['set']],'n':p['num'],'c':p['card'],'i':p['ill'],'k':'alt' if alt else {'original':'o','new':'n','reprint':'r'}[p['kind']]}); used.add(p['ill'])
    prs.sort(key=lambda q:(q['s'],q['n']))
    # art: re-encoded smaller (q80) for the game, cached by the approved file's hash
    art={}; os.makedirs(os.path.join(out_dir,'art'),exist_ok=True); cache=os.path.join(ROOT,'dist','.tm_art'); os.makedirs(cache,exist_ok=True)
    for i in sorted(used):
        r=reg.get(i)
        if not r: continue
        src=os.path.join(ROOT,r['file']); h=r['sha256'][:8]; dst=os.path.join(out_dir,'art',i+'.webp'); cf=os.path.join(cache,i+'-'+h+'.webp')
        if not os.path.exists(cf):
            im=Image.open(src).convert('RGB'); im.save(cf,'WEBP',quality=80,method=4)
        shutil.copy2(cf,dst); w,hh=Image.open(cf).size; art[i]={'u':'art/'+i+'.webp?h='+h,'w':w,'h':hh}
    tuned=json.load(open(os.path.join(V1,'decks_tuned.json'),encoding='utf-8'))
    js=("// generated by tools/tidemark_build.py from tidemark-production/ and tools/tidemark/v1 (do not edit)\n"
        "const TM_SETS="+json.dumps(sets,separators=(',',':'))+";\nconst TM_CARDS="+json.dumps(cards,separators=(',',':'),ensure_ascii=False)+";\nconst TM_PR="+json.dumps(prs,separators=(',',':'))+";\nconst TM_ART="+json.dumps(art,separators=(',',':'))+";\n"
        "const TM_LIB="+json.dumps(lib,separators=(',',':'))+";\nconst TM_TUNED="+json.dumps(tuned,separators=(',',':'))+";\n"
        "const TM_STATUS="+json.dumps(cj['status'])+";\n"+engine_js())
    return js, len(art), len(cards), len(prs)
