#!/usr/bin/env python3
"""Cut every sheet in art-source/ into assets/ and write assets/manifest.json.

  python3 tools/build_art.py

Creatures: art-source/creatures/<name>-poses-<green|magenta>.png -> assets/creatures/<name>/<pose>.webp (transparent cutouts)
Scenes:    art-source/scenes/scenes-<biome>.png                 -> assets/scenes/<biome>/<biome>-NN.jpg
The pose order and the scene tags below are the owner-reviewed reading of each sheet (decided by looking at the images).
Add a new sheet by dropping it in art-source/ and adding its row to SCENES (creatures only need the file name)."""
import os, re, json, glob, sys
sys.path.insert(0, os.path.dirname(__file__))
import ingest
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC=os.path.join(ROOT,'art-source'); OUT=os.path.join(ROOT,'assets')
POSES=['standing','jumping','running','waving','sitting','sleeping','surprised','looking-up','back-view']   # the 3x3 pose template, row by row
# Each scene: (short description, floor, time of day, extra tags). floor = what a creature would stand on in the lower third.
# No sheet has a pure open-sky floor; 'air' is kept for future sheets. Cells are numbered row by row.
SCENES={
 'astral':[
  ('moonlit forest clearing with glowing stars','ground','night',['forest','grass','crescent-moon']),
  ('ruined stone arch over a moon-circle floor','ground','night',['ruins','stone','flowers']),
  ('lantern plaza above a fairy-tale village','ground','dusk',['village','castle','crescent-moon','stone']),
  ('night glade with waterfall and glowing flowers','ground','night',['forest','waterfall','grass']),
  ('floating islands and a moon statue on a star-circle floor','ground','night',['floating-islands','clouds','stone']),
  ('aurora over a lake, crystal meadow','ground','night',['aurora','lake','crystals','grass']),
  ('purple crystal cave with a glowing stone floor','ground','night',['cave','crystals','indoor-feel']),
  ('meadow with floating waterfall islands and a galaxy','ground','night',['floating-islands','galaxy','grass']),
  ('golden observatory plaza with an armillary sphere','ground','night',['observatory','stone','planets'])],
 'stone':[
  ('red canyon with a flat rock shelf','ground','day',['desert','canyon','cactus']),
  ('purple crystal cave mouth','ground','day',['cave','crystals']),
  ('mossy rock shelf above misty rock towers','ground','day',['cliffs','mist','tree']),
  ('overgrown stone gateway with carved symbols','ground','day',['ruins','arch','moss']),
  ('desert with giant ribcage bones','ground','day',['desert','bones','canyon']),
  ('mossy boulders and a balanced rock','ground','day',['boulders','moss','trees']),
  ('crystal pool with stepping-stone slabs and a small waterfall','water','day',['crystals','waterfall','stepping-stones']),
  ('sunlit canyon spires over a sandstone ledge','ground','day',['canyon','spires','mist']),
  ('ancient carved ruins on mossy steps','ground','day',['ruins','moss','carved-stone'])],
 'tide':[
  ('clear shallow lagoon with a rock arch','water','day',['lagoon','sand','rock-arch']),
  ('sunset tide pool with coral and starfish','water','dusk',['coral','starfish','sunset']),
  ('moonlit beach with glowing blue shoreline','ground','night',['beach','moon','glow','palm']),
  ('lily pond with cattails and waterfalls','water','day',['pond','lilies','waterfall']),
  ('coral shallows with sun rays','water','day',['coral','underwater-feel','shells']),
  ('sea cave shore opening to a sunny bay','water','day',['cave','shells','shore']),
  ('crystal waterfall pool','water','day',['crystals','waterfall','moss']),
  ('pearly shell beach','ground','day',['beach','shells','sand']),
  ('big waterfall lagoon','water','day',['waterfall','mist','lagoon'])],
 'verdant':[
  ('flower meadow under a big tree with a wooden fence','ground','day',['meadow','tree','flowers']),
  ('desert flower garden with giant flowering cacti','ground','day',['cactus','flowers','mesa']),
  ('mossy stone arch in a clover meadow','ground','day',['arch','ruins','clover']),
  ('wildflower hillside above a distant lake','ground','day',['meadow','flowers','lake']),
  ('sun-ray forest glade with mossy roots','ground','day',['forest','moss','sunbeams']),
  ('apple orchard glade','ground','day',['orchard','apples','fence']),
  ('clover meadow with a small waterfall pond behind','ground','day',['clover','waterfall','meadow']),
  ('blossom pillars and a petal-strewn lawn','ground','day',['blossoms','garden','stairs']),
  ('meadow under a branch with a lake and rock island','ground','day',['meadow','lake','tree'])],
 'wonder':[
  ('candy meadow with lollipops and a pink castle','ground','day',['candy','castle','meadow']),
  ('cosy star-and-moon nursery with a fluffy rug','ground','indoor',['bedroom','rug','stars','indoor']),
  ('fairy cottage garden with a rainbow','ground','day',['cottage','fence','rainbow']),
  ('carousel and funfair on a glossy floor','ground','day',['carousel','funfair','fairground']),
  ('rainbow crystal waterfall pool with a stone pedestal','ground','day',['crystals','waterfall','pedestal','wisteria']),
  ('mushroom and cotton-tree meadow','ground','day',['mushrooms','meadow','pink-trees']),
  ('cloud terrace with moon-and-star pillars and a floating castle','ground','day',['floating','clouds','castle','rainbow','terrace']),
  ('soap-bubble pool with star bubbles','water','day',['bubbles','iridescent','clouds']),
  ('lantern tree hollow at sunset with a petal rug','ground','dusk',['lanterns','tree','sunset','cosy'])]}
# How each creature gets about, and its size next to the others (1.0 = tallest standing pose fills 46% of a scene). Used by lab/ to pick scenes and scale.
# walker -> ground scenes; swimmer and floater -> water scenes (and air scenes, if a sheet ever has one). Koi is both a walker and a swimmer.
CREATURES={'cactuft':(['walker'],1.0),'frondolin':(['walker'],0.86),'bashlet':(['walker'],0.74),'rolyte':(['walker'],0.66),'koi':(['walker','swimmer'],0.88),'flapod':(['floater'],0.7)}
def main():
    manifest={'about':'Pieces cut from art-source/ by tools/build_art.py. Do not edit by hand; edit the tags in tools/build_art.py and rebuild.','creatures':[],'scenes':[]}
    for f in sorted(glob.glob(os.path.join(SRC,'creatures','*-poses-*.png'))):
        m=re.match(r'(.+)-poses-(green|magenta)\.png',os.path.basename(f)); name,screen=m.group(1),m.group(2)
        rep=ingest.cut_sheet(f,'cutout',screen,os.path.join(OUT,'creatures',name),POSES,drop_effects=True)
        for pose,r in zip(POSES,rep):
            manifest['creatures'].append({'id':f'{name}-{pose}','name':name,'pose':pose,'screen':screen,'file':os.path.relpath(r['file'],ROOT),'size':list(r['size']),'margins_LTRB':list(r['margins_LTRB']),'touches_edge':bool(r['touches_edge']),'stray_pieces_dropped':r['stray_pieces_dropped']})
        print(name,screen,'stray pieces dropped:',sum(r['stray_pieces_dropped'] for r in rep),'edge-touching cells:',[r['cell'] for r in rep if r['touches_edge']])
    for f in sorted(glob.glob(os.path.join(SRC,'scenes','scenes-*.png'))):
        biome=re.match(r'scenes-(.+)\.png',os.path.basename(f)).group(1); tags=SCENES[biome]; names=[f'{biome}-{i+1:02d}' for i in range(9)]
        rep=ingest.cut_sheet(f,'scene',out=os.path.join(OUT,'scenes',biome),names=names)
        for nm,r,(desc,floor,tod,extra) in zip(names,rep,tags):
            manifest['scenes'].append({'id':nm,'biome':biome,'floor':floor,'time':tod,'description':desc,'tags':extra,'file':os.path.relpath(r['file'],ROOT),'size':list(r['size'])})
        print(biome,'9 scenes')
    manifest['creature_info']={n:{'move':m,'size':z} for n,(m,z) in CREATURES.items()}
    manifest['creatures'].sort(key=lambda x:(x['name'],POSES.index(x['pose'])))
    json.dump(manifest,open(os.path.join(OUT,'manifest.json'),'w'),indent=1); print('wrote assets/manifest.json:',len(manifest['creatures']),'creature pieces,',len(manifest['scenes']),'scenes')
if __name__=='__main__': main()
