#!/usr/bin/env python3
"""Read-only reuse audit (2026-10-22): which historical checklist positions could be filled by reprinting existing Tidemark identities and illustrations,
with only new printing metadata. Changes nothing. Usage: python3 tools/tidemark_reuse_audit.py [--json out.json]
Rules audited (proposals, not decided): a source identity must come from a set at least one calendar year earlier; never a reserve-list card;
never a Legendary; each identity is reprinted at most once in the historical sets; reprints make up at most CAP of a set's catalogue."""
import json, csv, collections, sys, os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tidemark-production')
cj=json.load(open(os.path.join(ROOT,'cards.json'))); P=cj['printings']
rows={r['printing_id']:r for r in csv.DictReader(open(os.path.join(ROOT,'checklist.csv')))}
sets=[]; info={}
for p in P:
    if p['set'] not in info: sets.append(p['set']); info[p['set']]=(p['setName'],p['year'])
H=[p for p in P if p['set']!='TT']; pid={p['pid']:p for p in P}
res={p['card']:rows[p['pid']]['reserve_list']=='yes' for p in P}
orig={s:[p for p in H if p['set']==s] for s in sets if s!='TT'}
tt=[p for p in P if p['set']=='TT' and p['kind']=='reprint']
def audit_links():
    ok=0; srcs=collections.Counter()
    for t in tt:
        o=pid.get(rows[t['pid']]['original_printing'])
        if o and o['card']==t['card'] and o['ill']==t['ill'] and o['set']!='TT': ok+=1; srcs[o['set']]+=1
    return ok, srcs
def table(cap, flagship=()):
    out=[]
    for s in sets[:-1]:
        y=info[s][1]; o=orig[s]; n=len(o)
        el=[p for t in sets[:-1] if info[t][1]<y for p in orig[t] if not res[p['card']] and p['r']!='L']
        k=min(len(el), int(n*cap/(1-cap)))
        out.append(dict(set=s,name=info[s][0],year=y,orig=n,eligible=len(el),reprints=k,reuse_total=n+k,
                        to30_new=max(0,30-n-k),to75_new=max(0,75-n-k)))
    return out
if __name__=='__main__':
    ok,srcs=audit_links(); print('Tenth Tide reprints',len(tt),'linked to an existing original with the same identity and the same illustration:',ok)
    for cap in (0.33,0.5):
        t=table(cap); print('\nCAP',cap)
        print('set name year originals eligible reprints total new_to_30 new_to_75')
        for r in t: print(r['set'],r['name'],r['year'],r['orig'],r['eligible'],r['reprints'],r['reuse_total'],r['to30_new'],r['to75_new'])
        print('sum originals',sum(r['orig'] for r in t),'reprints',sum(r['reprints'] for r in t))
    if '--json' in sys.argv: json.dump({'c33':table(.33),'c50':table(.5)},open(sys.argv[sys.argv.index('--json')+1],'w'),indent=1)
