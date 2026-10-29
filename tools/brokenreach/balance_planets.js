'use strict';
// Planet by planet first-player share of decided games, and the preset decks' matchups, under each turn-order rule (greedy players).
const E=require('./engine.js'); const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id), planets=cards.filter(c=>c.type==='planet'), pre=require('../../broken-reach-production/set01/presets.json').decks;
const lead=(s,p)=>{ const c=E.final(s); return c[p]-c[1-p]; };
const greedy=(s,r)=>{ let best=[],bv=-99; for (const m of E.legalMoves(s)){ const v=lead(E.applyMove(s,m).state,s.cur); if(v>bv){bv=v;best=[m];} else if(v===bv) best.push(m); } return best[Math.floor(r()*best.length)]; };
const RULES=[['v0.2',{}],['komi 2',{komi:2}],['last Attack -1',{lastMinus:1}]];
const N=+process.argv[2]||300;
console.log(`first-player share of decided games by planet (greedy vs greedy, ${N} random-deck games per planet)`);
for (const [rn,rules] of RULES){ const row=[]; for (const pl of planets){ let f=0,d=0; for (let i=0;i<N;i++){ const r=E.mulberry32(i*13+3); let s=E.newMatch({deckA:E.shuffle(units,r).slice(0,20),deckB:E.shuffle(units,r).slice(0,20),planet:pl.base_card_id,seed:i,rules}); while(!s.over) s=E.applyMove(s,greedy(s,r)).state; const w=E.winner(s); if(w>=0){ d++; if(w===s.first) f++; } } row.push(`${pl.name.split(' — ')[0].replace('The ','')} ${(100*f/d).toFixed(0)}%`); } console.log(`  ${rn.padEnd(15)} ${row.join(' | ')}`); }
console.log('\npreset deck matchups (row deck win rate vs column deck, greedy, both seats, 600 games, draws count half)');
for (const [rn,rules] of RULES){ const o=[]; for (const a of pre) for (const b of pre) if (a!==b){ let w=0,n=600; for (let i=0;i<n;i++){ const r=E.mulberry32(i*7+5); let s=E.newMatch({deckA:a.cards,deckB:b.cards,planet:planets[i%8].base_card_id,seed:i,first:i%2,rules}); while(!s.over) s=E.applyMove(s,greedy(s,r)).state; const x=E.winner(s); if(x===0)w++; else if(x<0)w+=0.5; } o.push(`${a.id}>${b.id} ${(100*w/n).toFixed(0)}%`); } console.log(`  ${rn.padEnd(15)} ${o.join('  ')}`); }
