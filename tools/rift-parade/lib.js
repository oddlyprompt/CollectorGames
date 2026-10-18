// Rift Parade simulation library: plays one game between two decks with named agents and returns a summary.
'use strict';
const E=require('./engine.js'); const A=require('./ai.js'); const {DECKS}=require('./decks.js');
function agentFor(name,seed){ if(name==='random') return A.AGENTS.random(seed); if(!A.AGENTS[name]) throw new Error('unknown agent '+name); return A.AGENTS[name](); }
// deckA / deckB: arrays of card ids. agents: [nameA,nameB]. first: 0 or 1 (which seat goes first). opts: engine options (rules overrides, nolog)
function game(deckA,deckB,seed,agents,first,opts){ opts=Object.assign({nolog:true,first},opts||{}); const ag=[agentFor(agents[0],seed*2+1),agentFor(agents[1],seed*2+2)];
  const g=E.play(deckA,deckB,seed,ag,opts); return g; }
function summary(g){ return {winner:g.winner,why:g.why,turn:g.turn,first:g.first,rounds:g.round,res:[g.P[0].resolve,g.P[1].resolve],anomalies:g.anomalies,maxRift:g.st.maxRift,played:g.st.played,slipped:g.st.slipped,used:g.st.used,trig:g.st.trig,deck:[g.P[0].deck.length,g.P[1].deck.length],wagers:[g.P[0].wagers.length,g.P[1].wagers.length],hand:[g.P[0].hand.length,g.P[1].hand.length]}; }
module.exports={game,summary,agentFor,DECKS,E,A};
