#!/usr/bin/env python3
"""Builds the three games into dist/<game>/ as plain static sites.
   python3 tools/build.py            (all games)     python3 tools/build.py tcg   (one game)"""
import os, sys, shutil, hashlib, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC=os.path.join(ROOT,'src'); DIST=os.path.join(ROOT,'dist')
ENGINE='core world cards market render cm_data cm_world cm_value cm_render cm_save hunt visual visual2 cover2 ui1 ui2 ui3 cm_ui hunt_ui flow visual_ui attach attach_ui drama breaks scenario journal polish viewer3d'.split()
TCG='tcg_frames tcg_rules tcg_data tcg_world tcg_value tcg_boot tcg_render tcg_ui1 tcg_ui2 tcg_ui3 tcg_stores tcg_collect'.split()
TIDEMARK='tm/tm_rules tm/tm_data tm/tm_world tm/tm_value tm/tm_boot tm/tm_render tm/tm_ui1 tm/tm_ui2 tm/tm_ui3 tm/tm_stores tm/tm_collect'.split()
GAMES={'sports':{'name':'Sports Card Collector','theme':'#c0392b','tcg':False},'comics':{'name':'Comics Collector','theme':'#d4a017','tcg':False},'tcg':{'name':'Trading Card Collector','theme':'#8e44ad','tcg':True,'tm':True}}
def rd(p): return open(p,encoding='utf-8').read()
def icon(size, color, path):
    im=Image.new('RGBA',(size,size),(0,0,0,0)); d=ImageDraw.Draw(im); r=int(size*0.22); d.rounded_rectangle((0,0,size-1,size-1),radius=r,fill=color)
    w=int(size*0.42); h=int(size*0.58); x=(size-w)//2; y=(size-h)//2; d.rounded_rectangle((x,y,x+w,y+h),radius=int(size*0.05),fill=(255,255,255,235)); d.rounded_rectangle((x+int(size*0.04),y+int(size*0.04),x+w-int(size*0.04),y+int(h*0.62)),radius=int(size*0.03),fill=color)
    im.save(path)
def build(g):
    cfg=GAMES[g]; out=os.path.join(DIST,g); shutil.rmtree(out,ignore_errors=True); os.makedirs(out+'/vendor'); os.makedirs(out+'/icons')
    files=[os.path.join(SRC,'packs',g+'.js')]+[os.path.join(SRC,'engine',f+'.js') for f in ENGINE]
    if cfg['tcg']: files+=[os.path.join(SRC,'engine',f+'.js') for f in TCG]
    if cfg.get('tm'): files+=[os.path.join(SRC,'engine',f+'.js') for f in TIDEMARK]
    files+=[os.path.join(SRC,'engine','ui4.js'),os.path.join(SRC,'shell','saves.js'),os.path.join(SRC,'shell','launcher.js'),os.path.join(SRC,'shell','pack_apply.js')]
    pre=''
    if cfg['tcg']:                                                                 # Wildkin cards and art come from wildkin-production/ (see tools/wildkin_build.py)
        import wildkin_build; pre,na,nc=wildkin_build.canon_js(out); print(f'        Wildkin: {nc} cards from the manifest, {na} approved art files copied to {g}/art/')
    if cfg.get('tm'):                                                              # the second card game, Tidemark: cards, art and rules engine come from tidemark-production/ and tools/tidemark/v1 (see tools/tidemark_build.py)
        import tidemark_build; tpre,na,nc,npr=tidemark_build.build(out); pre+='\n'+tpre+'\n'+rd(os.path.join(ROOT,'tools','tidemark','v1','render.js'))+'\n'; print(f'        Tidemark: {nc} cards, {npr} printings, {na} approved art files copied to {g}/art/')
    js=pre+'\n'.join(rd(f) for f in files)+'\nshellBoot();\n'; open(out+'/game.js','w',encoding='utf-8').write(js)
    css=rd(os.path.join(SRC,'engine','style.css'))+'\n'+rd(os.path.join(SRC,'shell','shell.css')); open(out+'/style.css','w',encoding='utf-8').write(css)
    shutil.copy(os.path.join(ROOT,'vendor','three.min.js'),out+'/vendor/three.min.js')
    for s in (192,512): icon(s,cfg['theme'],f'{out}/icons/icon-{s}.png')
    ver=hashlib.sha1((js+css).encode()).hexdigest()[:10]
    html=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{cfg['name']}</title><meta name="theme-color" content="{cfg['theme']}"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="{cfg['name']}">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v={ver}"></head><body><div id="app"></div><script src="game.js?v={ver}"></script>
<script>if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(function(){{}});</script></body></html>'''
    open(out+'/index.html','w',encoding='utf-8').write(html)
    json.dump({'name':cfg['name'],'short_name':cfg['name'].split()[0],'start_url':'./','display':'standalone','background_color':'#0c0e12','theme_color':cfg['theme'],'icons':[{'src':'icons/icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icons/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]},open(out+'/manifest.webmanifest','w'),indent=1)
    open(out+'/sw.js','w').write(f"const C='{g}-{ver}-s2';const A=['./','index.html','game.js?v={ver}','style.css?v={ver}','vendor/three.min.js','manifest.webmanifest'];\nself.addEventListener('install',e=>{{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));}});\nself.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith('{g}-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));}});\nself.addEventListener('fetch',e=>{{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{{if(n.ok){{const c=n.clone();caches.open(C).then(x=>x.put(e.request,c));}}return n;}})));}});\n")
    sz=sum(os.path.getsize(os.path.join(dp,f)) for dp,_,fs in os.walk(out) for f in fs)
    print(f'{g:7} {cfg["name"]:22} game.js {os.path.getsize(out+"/game.js")/1e6:.2f} MB, total {sz/1e6:.2f} MB')
def publish():
    """Copy the built games into docs/ so GitHub Pages can serve them (Settings > Pages > main branch, /docs folder)."""
    d=os.path.join(ROOT,'docs'); shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
    for g in GAMES: shutil.copytree(os.path.join(DIST,g),os.path.join(d,g))
    open(os.path.join(d,'.nojekyll'),'w').write('')
    lab=os.path.join(ROOT,'lab')                                                  # the art review page: lab/ plus the cut art it reads (not the raw sheets)
    if os.path.isdir(lab):
        shutil.copytree(lab,os.path.join(d,'lab'))
        for sub in ('creatures','scenes'): shutil.copytree(os.path.join(ROOT,'assets',sub),os.path.join(d,'lab','assets',sub))
        shutil.copy(os.path.join(ROOT,'assets','manifest.json'),os.path.join(d,'lab','assets','manifest.json'))
    cards=''.join(f'<a href="{g}/"><b>{GAMES[g]["name"]}</b></a>' for g in GAMES)
    open(os.path.join(d,'index.html'),'w').write('<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collector games</title><style>body{font-family:system-ui;background:#0c0e12;color:#e9ecef;max-width:420px;margin:12vh auto;padding:0 20px}a{display:block;background:#1c2129;border:1px solid #333;border-radius:12px;padding:18px;margin:12px 0;color:#fff;text-decoration:none;font-size:20px}h1{font-size:28px}</style><h1>Collector games</h1>'+cards)
    print('published to docs/')
if __name__=='__main__':
    args=[x for x in sys.argv[1:] if not x.startswith('--')]
    for g in (args or GAMES): build(g)
    if '--publish' in sys.argv: publish()
