#!/usr/bin/env python3
"""Writes the Broken Reach catalogue (BR_SETS, BR_CARDS, BR_ALTS) in front of the card-game code in the tcg build.
The catalogue is broken-reach-production/set01/cards.json (the owner's handoff, proposed, not canon). Called by build.py."""
import os, json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def build():
    d=json.load(open(os.path.join(ROOT,'broken-reach-production','set01','cards.json'),encoding='utf-8'))
    cards=[{'i':c['base_card_id'],'n':c['name'],'t':c['typeName'],'a':c['aff'],'r':c['rar'],'m':c['mask'],'A':c['atk'],'G':c['grd'],'x':c['text'],'ro':c['role'],'e':c['era'],'p':1 if c['type']=='planet' else 0} for c in d['cards']]
    alts=[{'i':a['printing_id'],'b':a['base_card_id'],'tr':a['treatment']} for a in d['alternates']]
    sets=[{'code':'BR01','name':d['name'],'rel':'2026-08-14','year':2026,'era':'Book 1','tot':len(cards),'size':len(cards)+len(alts)}]
    js='const BR_SETS='+json.dumps(sets,separators=(',',':'))+';\nconst BR_CARDS='+json.dumps(cards,separators=(',',':'),ensure_ascii=False)+';\nconst BR_ALTS='+json.dumps(alts,separators=(',',':'))+';\n'
    return js,len(cards),len(alts)
if __name__=='__main__': print(build()[1:])
