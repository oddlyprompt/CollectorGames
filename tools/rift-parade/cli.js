#!/usr/bin/env node
// Rift Parade interactive command-line game.
//   node tools/rift-parade/cli.js [--deck kinetic] [--opp rift] [--ai balanced|aggro|control|greedy] [--seed 1] [--first 0|1] [--watch] [--script file] [--log file]
// You are player 0. --watch lets two computer players play and prints the whole log. --script reads your answers from a file
// (one per line) instead of the keyboard; --log writes the full action log to a file when the game ends.
// At any prompt: a number picks an option, `?` N shows the rules text of option N, `l` shows the last log lines, `q` quits.
'use strict';
const fs=require('fs');
const E=require('./engine.js'); const A=require('./ai.js'); const T=require('./text.js'); const {DECKS}=require('./decks.js');
const arg=(k,d)=>{ const i=process.argv.indexOf(k); return i>0? process.argv[i+1] : d; };
const has=k=>process.argv.includes(k);
const deckOf=id=>{ const d=DECKS.find(x=>x.id===id); if(!d) throw new Error('unknown deck '+id+' (decks: '+DECKS.map(x=>x.id).join(', ')+')'); return d; };

// ------------------------------------------------------------ input (synchronous, from the keyboard or a script)
let SCRIPT=null; if(arg('--script',null)) SCRIPT=fs.readFileSync(arg('--script'),'utf8').split(/\r?\n/);
let buf='';
function readLine(){ if(SCRIPT){ if(!SCRIPT.length) { console.log('(script ended)'); finish(); } const l=SCRIPT.shift(); console.log('> '+l); return l.trim(); }
  const b=Buffer.alloc(1); while(true){ const n=fs.readSync(0,b,0,1,null); if(n===0){ if(buf.length){ const l=buf; buf=''; return l.trim(); } console.log('(input closed)'); finish(); } const ch=b.toString(); if(ch==='\n'){ const l=buf; buf=''; return l.trim(); } buf+=ch; } }
let G=null, shown=0; const watchMode=process.argv.includes('--watch');
function flush(){ if(!G) return; while(shown<G.log.length){ const l=G.log[shown++]; if(watchMode||!/\] P0 (slips|plays|puts|uses|attacks|steps|swaps)/.test(l)||true) console.log(l); } }
function finish(){ if(G&&arg('--log',null)) fs.writeFileSync(arg('--log'),G.log.join('\n')+'\n'); process.exit(0); }

// ------------------------------------------------------------ display
const nm=c=>E.def(c).name;
function cstr(g,c,full){ const d=E.def(c); const ks=[...E.kwSet(g,c)]; const bits=[E.def(c).type==='Character'||c.anim? `${nm(c)} ${E.pow(g,c)}/${E.hp(g,c)-c.dmg}${c.dmg?` (dmg ${c.dmg})`:''}` : nm(c)]; if(c.exh) bits.push('exhausted'); if(c.mark) bits.push('MARKED'); if(c.sil>=g.turn) bits.push('silenced'); if(c.ctr.imp) bits.push(`Impact ${c.ctr.imp}`); if(c.ctr.seal) bits.push(`seal ${c.ctr.seal}`);
  if(ks.length&&full!==false) bits.push('['+ks.filter(k=>!['NoAttack','NoStep','NoBlock'].includes(k)&&(k!=='Phase'||E.hasKw(g,c,'Phase'))).join(',')+']'); for(const a of c.atch) bits.push('<'+nm(a)+'>'); if(c.anim) bits.push('IMBUED'); return bits.join(' '); }
function show(g,me){ flush(); const o=1-me, P=g.P[me], Q=g.P[o]; const line='-'.repeat(72);
  console.log('\n'+line); console.log(`Turn ${g.turn} (round ${g.round}) | Rift ${g.rift}/${g.R.riftMax}  next Anomaly: ${E.ANOMALIES[g.anom].name} - ${E.ANOMALIES[g.anom].text}`);
  if(g.zone) console.log(`Zone: ${nm(g.zone)} (${g.zone.ctl===me?'yours':'theirs'})`);
  const side=(pl,i,label)=>{ console.log(`${label}: Resolve ${pl.resolve} | hand ${pl.hand.length} | deck ${pl.deck.length} | Rift pool ${pl.rift.length} (${pl.rift.filter(r=>r.ready).length} ready)`);
    console.log('  Stage: '+(pl.stage.map(c=>cstr(g,c)).join(' | ')||'-')); console.log('  Back : '+(pl.back.map(c=>cstr(g,c)).join(' | ')||'-'));
    if(pl.relics.length) console.log('  Relics: '+pl.relics.map(r=>cstr(g,r)).join(' | ')); const cs=pl.conds; if(cs.length) console.log('  Conditions on player: '+cs.map(nm).join(', ')); };
  side(Q,o,'OPPONENT'); console.log(); side(P,me,'YOU'); console.log(line);
  console.log('Your hand:'); P.hand.forEach((c,i)=>{ const d=E.def(c); console.log(`  [${i}] ${d.name} (${d.type}, cost ${E.cost(g,me,c)}${d.p!==undefined?`, ${d.p}/${d.h}`:''})`); }); console.log(`Energy ready: ${E.energy(g,me)}`); }
function describe(g,p,a){ const P=g.P[p];
  switch(a.k){ case 'slip': return `Slip ${nm(P.hand[a.i])} into the Rift pool (becomes energy)`;
    case 'play':{ const c=P.hand[a.i], d=E.def(c); return `Play ${d.name} [${E.cost(g,p,c)}${a.upgrade?` less ${E.def(a.upgrade).cost}, Next Episode on ${nm(a.upgrade)}`:''}]${a.row?` -> ${a.row==='stage'?'Stage':'Backstage'}`:''}`; }
    case 'act': return `Use ${nm(a.s)}: ${T.abText(E.def(a.s),E.def(a.s).ab[a.a])}`;
    case 'step': return `Step ${nm(a.c)} to ${E.rowOf(g,a.c)==='stage'?'Backstage':'the Stage'} (free, once per turn)`;
    case 'swap': return `Swap ${nm(a.a)} and ${nm(a.b)} (free, once per turn)`;
    case 'ransom': return `Pay ${E.def(a.s).ransom} to remove ${nm(a.s)}`; case 'pass': return 'Pass / end this phase'; } return a.k; }
function help(g,p,a){ if(a.k==='slip'||a.k==='play') return cardHelp(g.P[p].hand[a.i]); if(a.s) return cardHelp(a.s); if(a.c) return cardHelp(a.c); return ''; }
function cardHelp(c){ const d=E.def(c); return `${d.name} - ${d.type}, cost ${d.cost}${d.p!==undefined?`, ${d.p}/${d.h}`:''} [${d.rarity}, episode ${d.ep}]\n   ${T.cardText(d).join('\n   ')}\n   (${d.why})`; }
function ask(g,p,prompt,items,render,opts){ opts=opts||{}; while(true){ console.log(prompt); items.forEach((it,i)=>console.log(`  ${opts.base===undefined?i:i+opts.base}) ${render(it,i)}`)); const l=readLine();
    if(l==='q') finish(); if(l==='l'){ console.log(g.log.slice(-14).join('\n')); continue; }
    const hm=l.match(/^\?\s*(\d+)$/); if(hm){ const it=items[+hm[1]-(opts.base||0)]; console.log(it&&opts.help? opts.help(it) : '(no help)'); continue; }
    if(opts.allowEmpty&&l===''||(opts.none&&(l==='n'||l===''))) return null; if(/^\d+$/.test(l)){ const i=+l-(opts.base||0); if(i>=0&&i<items.length) return i; } console.log('?? type a number, ? N for help, l for the log, q to quit'); } }

// ------------------------------------------------------------ the human player
function human(){ return {name:'you',
  mulligan(g,p){ show(g,p); console.log('Opening hand. Mulligan: type the card numbers to replace (e.g. "0 3"), or press Enter to keep.'); const l=readLine(); if(l==='q') finish(); return l.split(/[\s,]+/).filter(x=>/^\d+$/.test(x)).map(Number).filter(i=>i<g.P[p].hand.length); },
  main(g,p,acts,second){ if(second&&acts.every(a=>a.k==='step'||a.k==='swap')) return {k:'pass'}; show(g,p); const list=acts.concat([{k:'pass'}]); const i=ask(g,p,second?'Second main phase - choose an action (? N for card text):':'Main phase - choose an action (? N for card text):',list,a=>describe(g,p,a),{help:a=>help(g,p,a)}); return list[i]; },
  attack(g,p,av){ show(g,p); console.log('Attack! Ready Characters:'); av.forEach((c,i)=>console.log(`  ${i}) ${cstr(g,c)}`)); console.log('Type the numbers of the attackers (e.g. "0 2"), "all", or Enter for no attack:'); while(true){ const l=readLine(); if(l==='q') finish(); if(l==='l'){ console.log(g.log.slice(-14).join('\n')); continue; } if(l===''||l==='n') return []; if(l==='all') return av; const ix=l.split(/[\s,]+/).filter(x=>/^\d+$/.test(x)).map(Number); if(ix.every(i=>i<av.length)) return ix.map(i=>av[i]); console.log('??'); } },
  block(g,p,atk,bl){ show(g,p); console.log('The opponent attacks! Attackers:'); atk.forEach(c=>console.log(`  - ${cstr(g,c)}`)); const asg={}; const used=new Set();
    for(const a of atk){ const opts=bl.filter(b=>!used.has(b.u)&&E.canBlock(g,b,a)); if(!opts.length){ console.log(`  ${nm(a)} cannot be blocked by anything you have.`); continue; }
      const i=ask(g,p,`Block ${nm(a)} (${E.pow(g,a)}/${E.hp(g,a)}) with:`,opts,b=>cstr(g,b),{none:true,base:1}); if(i!==null){ asg[a.u]=opts[i].u; used.add(opts[i].u); } console.log('  (Enter or n = no block)'); } return asg; },
  react(g,p,acts){ flush(); const board=g.combat.atk.map(e=>`${nm(e.c)} ${E.pow(g,e.c)}${e.blk?` blocked by ${nm(e.blk)}`:' unblocked'}`).join('; '); console.log('\nREACTION WINDOW. Combat: '+board+'. Energy ready: '+E.energy(g,p)); const list=acts.concat([{k:'pass'}]); const i=ask(g,p,'Play a reaction or pass:',list,a=>describe(g,p,a),{help:a=>help(g,p,a)}); return list[i].k==='pass'? null : list[i]; },
  choose(g,p,kind,opts,ctx){ const label={target:`Choose a target for ${ctx.op||'the effect'}`,discard:'Choose a card to discard',sacrifice:'Choose a Character to sacrifice',relic:'Choose a Relic',search:'Choose a card',recur:'Choose a card from the discard pile',strip:'Choose a card from their hand',pull:'Pull a card from your Rift pool back to hand? (0 = no)',slip:'Choose a card to slip',call:'Call the Wager (High = revealed cost 3+, Low = cost 2 or less)',riftdir:'Raise (first) or lower (second) the Rift',anomaly:'Choose the next Anomaly',bargain:'BARGAIN - choose for yourself',scry:`Top or bottom for ${ctx.card?nm(ctx.card):'the card'}?`,loot:'Discard a card to draw one? (0 = no)',sever:'Choose what to Sever'}[kind]||('Choose '+kind);
    const rend=o=>{ if(o===null) return 'no'; if(typeof o==='string'){ if(kind==='bargain'){ const ops=ctx[o]; return T.text(ops).replace(/The opponent/g,'You'); } if(kind==='anomaly') return E.ANOMALIES[o].name+' - '+E.ANOMALIES[o].text; return o; } if(typeof o==='number') return (o>0?'raise':'lower')+' by '+Math.abs(o);
      if(o.card&&o.ready!==undefined) return nm(o.card)+(o.ready?' (ready)':' (exhausted)'); if(E.def(o).type==='Character'&&E.rowOf(g,o)) return cstr(g,o); return nm(o); };
    return ask(g,p,label+':',opts,rend,{base:0}); } }; }

// ------------------------------------------------------------ main
const seed=+arg('--seed',Date.now()%100000), first=+arg('--first',-1);
const dA=deckOf(arg('--deck','kinetic')), dB=deckOf(arg('--opp','rift'));
const aiName=arg('--ai','balanced');
const watch=has('--watch'); const a0=watch? A.AGENTS[arg('--ai0',aiName)]() : human(), a1=A.AGENTS[aiName]();
console.log(`Rift Parade - ${watch?'watching':'you play'} ${dA.name} vs ${dB.name} (${aiName} computer player), seed ${seed}`);
const g=E.newGame(dA.list,dB.list,seed,{first:first<0?undefined:first}); G=g; E.setAgents(g,a0,a1); E.start(g);
let p=g.first; console.log(`Player ${g.first} goes first.`);
while(!g.over&&g.turn<g.R.turnLimit){ const lastShown=shown; if(p===1) { console.log('\n=== OPPONENT\'S TURN ==='); } E.takeTurn(g,p); flush(); p=1-p; }
console.log('\n=== GAME OVER === '+(g.winner===-1?'draw ('+g.why+')':`Player ${g.winner} wins (${g.why})`)+` after ${g.round} rounds. Final Resolve: you ${g.P[0].resolve}, opponent ${g.P[1].resolve}`);
finish();
