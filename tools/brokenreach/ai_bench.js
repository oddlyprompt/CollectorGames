// AI strength check: node tools/brokenreach/ai_bench.js [games]  (each pair plays both seats; random decks; W/L/T from the first-named level's view)
const E=require('./engine.js'),A=require('./ai.js');
const cards=require('../../broken-reach-production/set01/cards.json').cards;E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id),planets=cards.filter(c=>c.type==='planet').map(c=>c.base_card_id);
function game(l0,l1,seed,rules){const r=E.mulberry32(seed);const s0=E.newMatch({deckA:E.shuffle(units,r).slice(0,20),deckB:E.shuffle(units,r).slice(0,20),planet:planets[seed%8],seed,rules});let s=s0;const lv=[l0,l1];const t=Date.now();while(!s.over){const m=A.chooseMove(s,lv[s.cur],r,units);s=E.applyMove(s,m).state}return E.winner(s)}
const N=+process.argv[2]||60;
for(const [a,b] of [['standard','easy'],['hard','standard'],['hard','easy']]){let w=0,l=0,t=0;const t0=Date.now();for(let i=0;i<N;i++){const sw=i%2; const r=sw? game(b,a,i+1) : game(a,b,i+1); const mine=sw?1:0; if(r<0)t++; else if(r===mine)w++; else l++;}console.log(a,'vs',b,'W',w,'L',l,'T',t,((Date.now()-t0)/N).toFixed(0)+'ms/game')}
