// Deck builders for the "player persona" experiment (personas.js). They search the 130-card pool the way three kinds of player would.
//   synergy: finds themed packages and improves them by testing swaps against the field (a pro deck builder)
//   rich:    owns the best (rarest) cards and builds piles of them, with no curve discipline; piloted by the weak "greedy" player
//   budget:  can only afford Commons and Uncommons, so searches that smaller pool for efficient combos
// "Value" is the collector rarity (C < UC < R < SR < SEC). Rarity gives no gameplay strength; this is exactly what is being tested.
'use strict';
const {CARDS,ORDER}=require('./cards.js'); const {DECKS}=require('./decks.js');
const RANK={C:1,UC:2,R:3,SR:4,SEC:5};
// themes: what a card is about, read from its data
function themesOf(d){ const t=new Set(); const txt=JSON.stringify([d.kw,d.ab,d.ops,d.onAttach]);
  const has=s=>txt.includes(s);
  if(d.char) t.add('char:'+d.char); if((d.kw||[]).includes('Momentum')||d.char==='Kai') t.add('kinetic');
  if(has('Resonance')) t.add('resonance'); if(has('"Absorb"')||has('impact')||has('release')) t.add('impact'); if(has('Haunt')) t.add('haunt'); if(has('Spotlight')) t.add('spotlight');
  if(has('"Sever"')||has('sever')) t.add('sever'); if(has('mark')||has('"marked"')) t.add('mark'); if(has('wager')||has('Wager')) t.add('wager'); if(has('bargain')) t.add('bargain');
  if(has('animate')||d.type==='Relic'||has('sacRelic')||has('RELIC')) t.add('relic'); if(has('"Phase"')||has('rift')||has('setAnomaly')||has('Anomaly')) t.add('rift'); if(has('heal')||has('revive')||has('purge')) t.add('mend');
  if(has('"strip"')||has('peek')||has('steal')) t.add('disrupt'); return t; }
const THEMES=['kinetic','resonance','impact','haunt','spotlight','sever','mark','wager','bargain','relic','rift','mend','disrupt'];
for(const id of ORDER) CARDS[id].themes=themesOf(CARDS[id]);
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const counts=list=>{ const n={}; for(const id of list) n[id]=(n[id]||0)+1; return n; };
const legalAdd=(n,id)=>(n[id]||0)<CARDS[id].max;
// fill to 40 from a ranked candidate list, 2-3 copies each, never beyond the limit
function fill(list,cands,r,copies){ const n=counts(list); let guard=0; while(list.length<40&&guard++<5000){ const id=cands[Math.min(cands.length-1,Math.floor(Math.pow(r(),1.6)*cands.length))]; if(!legalAdd(n,id)) continue; const k=Math.min(CARDS[id].max-(n[id]||0),Math.max(1,Math.floor(r()*copies)+1),40-list.length); for(let i=0;i<k;i++){ list.push(id); n[id]=(n[id]||0)+1; } } return list; }
// overlap with the closest representative deck (1 = same list, 0 = no card in common)
function overlap(list){ const a=counts(list); let best=0,who=''; for(const d of DECKS){ const b=counts(d.list); let s=0; for(const id in a) s+=Math.min(a[id],b[id]||0); if(s/40>best){ best=s/40; who=d.id; } } return {overlap:best,closest:who}; }
const avgCost=list=>list.reduce((s,id)=>s+CARDS[id].cost,0)/list.length;
const value=list=>list.reduce((s,id)=>s+RANK[CARDS[id].rarity],0)/list.length;

// ---- synergy: a package built around two or three themes, curve-aware
function synergySeed(r,pool){ const themes=[]; while(themes.length<2+(r()<0.4?1:0)){ const t=pick(r,THEMES); if(!themes.includes(t)) themes.push(t); }
  const score=id=>{ const d=CARDS[id]; let s=0; for(const t of themes) if(d.themes.has(t)) s+=2; return s+r()*1.2; };
  const ranked=pool.slice().sort((a,b)=>score(b)-score(a)); const core=ranked.slice(0,34);
  const list=[]; const n={};
  // lower the curve: guarantee 10 cards at cost 1-2 before topping up with the best themed cards
  for(const id of core.filter(i=>CARDS[i].cost<=2)){ if(list.length>=14) break; const k=Math.min(CARDS[id].max,2+(r()<0.5?1:0)); for(let i=0;i<k&&list.length<14;i++){ if(legalAdd(n,id)){ list.push(id); n[id]=(n[id]||0)+1; } } }
  fill(list,core,r,3); return {list:list.slice(0,40),themes}; }
// one random modification of 1-3 cards that keeps the deck legal
function mutate(list,r,pool){ const out=list.slice(); const k=1+Math.floor(r()*3); for(let m=0;m<k;m++){ const i=Math.floor(r()*out.length); const n=counts(out); const old=out[i]; n[old]--; let tries=0,id; do{ id=pick(r,pool); tries++; }while((!legalAdd(n,id)||id===old)&&tries<60); if(tries<60) out[i]=id; } return out; }

// ---- rich: the rarest cards, no discipline
function richDeck(r){ const SEC=ORDER.filter(i=>CARDS[i].rarity==='SEC'), SR=ORDER.filter(i=>CARDS[i].rarity==='SR'), R=ORDER.filter(i=>CARDS[i].rarity==='R');
  const list=[]; const n={}; const add=(id,k)=>{ for(let i=0;i<k&&list.length<40;i++) if(legalAdd(n,id)){ list.push(id); n[id]=(n[id]||0)+1; } };
  // he plays every Secret Rare he owns, then Super Rares in pairs or triples chosen at random, then Rares
  for(const id of SEC) add(id,1);
  const srs=SR.slice().sort(()=>r()-0.5); for(const id of srs){ if(list.length>=30) break; add(id,r()<0.5?3:2); }
  const rs=R.slice().sort(()=>r()-0.5); for(const id of rs){ if(list.length>=40) break; add(id,r()<0.5?3:2); }
  return list.slice(0,40); }

module.exports={CARDS,ORDER,RANK,THEMES,themesOf,mulberry,pick,counts,legalAdd,fill,overlap,avgCost,value,synergySeed,mutate,richDeck};
