#!/usr/bin/env python3
"""Builds the Broken Reach Play Alpha into dist/tcg/broken-reach/ (called by build.py after the tcg game).
It is a separate page inside the Trading Card Collector site: no CollectorGames save, market or Wildkin/Tidemark code is loaded."""
import os, json, shutil, hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(*p): return open(os.path.join(ROOT,*p),encoding='utf-8').read()
def build(dist_tcg):
    out=os.path.join(dist_tcg,'broken-reach'); shutil.rmtree(out,ignore_errors=True); os.makedirs(out)
    cards=json.loads(rd('broken-reach-production','set01','cards.json'))['cards']
    keep=('base_card_id','name','type','typeName','aff','rar','mask','atk','grd','text','ops','role','era')
    data={'cards':[{k:c[k] for k in keep} for c in cards],'presets':json.loads(rd('broken-reach-production','set01','presets.json'))['decks'],'rulesets':json.loads(rd('broken-reach-production','set01','rulesets.json'))['rulesets']}
    for d in data['presets']: d.pop('stats',None)
    wrap=lambda src,name:f"const {name}=(()=>{{const module={{exports:{{}}}};{src}\n;return module.exports;}})();window.{name}={name};\n"
    eng=rd('tools','brokenreach','engine.js'); ai=rd('tools','brokenreach','ai.js').replace("const E=(typeof require!=='undefined')?require('./engine.js'):window.BR_E;","const E=window.BR_E;")
    js="window.BR_DATA="+json.dumps(data,separators=(',',':'))+";\n"+wrap(eng,'BR_E')+wrap(ai,'BR_AI')+rd('src','br','br.js')
    css=rd('src','br','br.css'); ver=hashlib.sha1((js+css).encode()).hexdigest()[:7]
    js=js.replace('__BR_BUILD__',ver)
    open(out+'/br.js','w',encoding='utf-8').write(js); open(out+'/br.css','w',encoding='utf-8').write(css)
    open(out+'/index.html','w',encoding='utf-8').write(f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>The Broken Reach: Play Alpha</title><meta name="theme-color" content="#0d1014">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="br.css?v={ver}"></head><body><div id="br"></div><script src="br.js?v={ver}"></script></body></html>''')
    print(f'        Broken Reach Play Alpha: {len(data["cards"])} cards, {os.path.getsize(out+"/br.js")/1e3:.0f} KB script -> tcg/broken-reach/')
if __name__=='__main__': build(os.path.join(ROOT,'dist','tcg'))
