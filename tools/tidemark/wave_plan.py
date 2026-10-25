#!/usr/bin/env python3
"""Read-only planning aid for a content wave: python3 tools/tidemark/wave_plan.py CODE...  Lists a set's catalogued cards and how many new cards of each rarity
bring it to the booster thresholds with room to spare (40 Commons, 16 Uncommons, 15 Rares and Legendaries, at least 3 Legendaries)."""
import json, os, sys, collections
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
cj=json.load(open(os.path.join(ROOT,'tidemark-production/cards.json'))); by={c['id']:c for c in cj['cards']}
for code in sys.argv[1:]:
    ps=sorted([p for p in cj['printings'] if p['set']==code],key=lambda p:p['num']); n=collections.Counter(p['r'] for p in ps); f=collections.Counter(p['f'] for p in ps)
    need={'C':max(0,40-n['C']),'U':max(0,16-n['U']),'L':max(0,3-n['L'])}; need['R']=max(0,15-n['R']-n['L']-need['L'])
    print('==',code,ps[0]['setName'],ps[0]['year'],'have',dict(n),dict(f),'| add C%d U%d R%d L%d = %d'%(need['C'],need['U'],need['R'],need['L'],sum(need.values())))
    print('  '+'; '.join('%s%s %s (%s)'%(p['r'],p['f'],p['n'],(by[p['card']].get('text') or '')[:38]) for p in ps))
