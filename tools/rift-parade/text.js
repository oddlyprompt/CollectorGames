// Rift Parade rules text, generated from the card data (so text and play never disagree).
'use strict';
const Tn=T=>{ if(typeof T==='string') T={t:T}; let base={E:'target enemy Character',ES:'target enemy Stage Character',A:'target Character you control',AS:'target Stage Character you control',X:'target Character',XS:'target Stage Character',SELF:'this Character',LAST:'it',HOST:'the Character this is attached to',
    ALL_E:'each enemy Character',ALL_ES:'each enemy Stage Character',ALL_A:'each Character you control',ALL_AS:'each Stage Character you control',ALL_X:'each Character'}[T.t]||T.t;
  const f=[]; if(T.marked) f.push('that is Marked'); if(T.weak) f.push('that is Marked, has a Condition, Phase or Haunt, or is silenced'); if(T.maxCost!==undefined) f.push(`with cost ${T.maxCost} or less`); if(T.kw) f.push(`with ${T.kw}`); if(T.other) f.push('other than this one'); if(T.stage) f.push('on the Stage');
  if(T.t.startsWith('ALL_')&&T.kw) base=base.replace('Character','Character with '+T.kw).replace(' with '+T.kw+' with '+T.kw,' with '+T.kw); return f.length? base.replace(/ with Resonance/,'')+' '+f.join(' ').replace(/with Resonance/,'with Resonance') : base; };
const filt=f=>{ if(!f) return 'card'; const p=[]; if(f.type) p.push(f.type); else p.push('card'); const x=[]; if(f.maxCost!==undefined) x.push(`cost ${f.maxCost} or less`); if(f.char) x.push('named '+f.char); return (x.length? p.join(' ')+' with '+x.join(', ') : p.join(' ')).replace(/^card with/,'card with'); };
const num=n=>n;
const OP={
  dmg:o=>`Deal ${o[2]} damage to ${Tn(o[1])}${o[3]&&o[3].ifMarked? ` (${o[3].ifMarked} if it is Marked)`:''}`,
  dmgPow:o=>`Deal damage equal to the highest Power among your Stage Characters to ${Tn(o[1])}`,
  hurt:o=>`The opponent loses ${o[1]} Resolve`, payLife:o=>`You lose ${o[1]} Resolve`, heal:o=>`Restore ${o[1]} Resolve`,
  draw:o=>`Draw ${o[1]===1?'a card':o[1]+' cards'}`, foeDraw:o=>`The opponent draws ${o[1]} card(s)`,
  discard:o=>`Discard ${o[1]===1?'a card':o[1]+' cards'}`, foeDiscard:o=>`The opponent discards ${o[1]===1?'a card':o[1]+' cards'} of their choice`,
  foeSacrifice:o=>`The opponent sacrifices a Character of their choice`, foeSacrificeBest:()=>`The opponent sacrifices their strongest Stage Character`,
  pump:o=>`${Tn(o[1])[0].toUpperCase()+Tn(o[1]).slice(1)} gets ${o[2]>=0?'+':''}${o[2]}/${o[3]>=0?'+':''}${o[3]}${o[4]==='perm'?' permanently':' until end of turn'}`,
  rift:o=>`${o[1]>0?'Raise':'Lower'} the Rift by ${Math.abs(o[1])}`, riftPM:o=>`Raise or lower the Rift by ${o[1]}`, setAnomaly:()=>`Choose the next Anomaly`, fireAnomaly:()=>`Fire the next Anomaly now`,
  energy:o=>`Gain ${o[1]} energy this turn`, pull:o=>`Return ${o[1]} card(s) from your Rift pool to your hand`, slip:o=>`Slip ${o[1]} more card(s)`,
  mark:o=>`Mark ${Tn(o[1])}`, bounce:o=>`Return ${Tn(o[1])} to its owner's hand`, kill:o=>`Defeat ${Tn(o[1])}`, shove:o=>`Move ${Tn(o[1])} Backstage`,
  step:o=>`Step ${Tn(o[1])}`, stepAny:o=>`Move ${Tn(o[1])} to the other row`, tap:o=>`Exhaust ${Tn(o[1])}`, ready:o=>`Ready ${Tn(o[1])}`,
  silence:o=>`Silence ${Tn(o[1])} until the end of its controller's next turn`, purge:o=>`Remove all Conditions and Marks from ${Tn(o[1])}`, purgeMe:()=>`Remove every Condition attached to you`,
  sever:o=>`Sever: destroy ${{cond:'an opposing Condition',relic:'an opposing Relic',zone:'the Zone',any:'an opposing Condition, Relic or Zone',cz:'a Condition or the Zone'}[o[1]]}`, severCond:()=>`Sever: destroy a Condition`,
  animate:o=>`Imbue one of your Relics: it becomes a ${o[1]}/${o[2]} Character that can attack, until end of turn`, animateAll:o=>`Imbue every Relic you control: each becomes a ${o[1]}/${o[2]} Character that can attack, until end of turn`,
  sacRelic:o=>`Sacrifice another Relic you control. If you do: ${text(o[1])}`, dmgByRelic:o=>`Sacrifice another Relic you control. If you do, deal damage equal to its cost +${o[2]} to ${Tn(o[1])}`,
  wager:o=>`Wager${o[1]==='choose'?' (call High or Low)':''}: reveal the top card of your deck. High wins on cost 3+, Low on cost 2 or less. If you win: ${text(o[2])}. If you lose: ${text(o[3])}`,
  search:o=>`Search your deck for a ${filt(o[1])} and put it into your hand`, dig:o=>`Look at the top ${o[1]} cards of your deck. You may take a ${filt(o[2])}; the rest go to the bottom`,
  recur:o=>`Return ${(o[2]||1)>1? o[2]+' cards':'a '+filt(o[1])} from your discard pile to your hand`, revive:o=>`Return a ${filt(o[1])} from your discard pile to your Backstage${o[3]?` and restore ${o[3]} Resolve`:''}`,
  scry:o=>`Look at the top ${o[1]} card${o[1]>1?'s':''} of your deck; put any on the bottom`, strip:o=>`Look at the opponent's hand. They discard ${o[1]? 'a '+filt(o[1])+' of your choice':'a card of your choice'}`,
  steal:o=>`Look at the opponent's hand and take a ${filt(o[1])} from it`, peek:()=>`Look at the opponent's hand`,
  bargain:o=>`Bargain: the opponent chooses one: (a) ${text(o[1])}; or (b) ${text(o[2])}`, tax:o=>`The opponent's next card costs ${o[1]} more`, discount:o=>`Your next card costs ${o[1]} less`,
  impact:o=>`Put ${o[2]} Impact on ${Tn(o[1])}`, release:o=>`Release: remove all Impact from this Character and deal that much damage to ${o[1]==='foe'?'the opponent\'s Resolve':Tn(o[1])}`,
  prevent:()=>`Prevent all combat damage dealt by one attacking enemy Character`, reflect:()=>`One attacking enemy Character deals its combat damage to its own controller instead`,
  dodge:o=>`${Tn(o[1])[0].toUpperCase()+Tn(o[1]).slice(1)} moves Backstage and all damage to it is prevented this turn`, shield:o=>`Prevent all damage to ${Tn(o[1])} this turn`,
  counter:o=>`Put a Seal counter on this`, sacSelf:()=>`Sacrifice this`, ifthen:o=>`If ${cnd(o[1])}: ${text(o[2])}`, drawSeal:o=>`Draw a card for each Seal counter on this (up to ${o[1]})`,
  grantCharge:o=>`${Tn(o[1])[0].toUpperCase()+Tn(o[1]).slice(1)} can attack this turn even if it just arrived`, pullStage:()=>`Each opposing Backstage Character moves onto the Stage if there is room`,
  loot:()=>`You may discard a card. If you do, draw a card`, hostStage:()=>`The host moves onto the Stage if it is Backstage`,
};
function cnd(k){ const [w,op,v]=k; const W={rift:'the Rift',stage:'you control Stage Characters',relics:'you control Relics',techs:'Techniques played this turn',resolve:'your Resolve',impact:'Impact on this'}[w]||w; const O={'>=':'is '+v+' or more','<=':'is '+v+' or less'}[op]||op+v; if(w==='relics') return `you control ${v} or more Relic${v>1?'s':''}`; if(w==='counters') return `this has ${v} or more Seal counters`; return `${W} ${O}`; }
const lc=s=>/^[A-Z][a-z]+:/.test(s)||/^(The |Mark |Step |Sever)/.test(s)? s : s[0].toLowerCase()+s.slice(1);
function text(ops){ return (ops||[]).map((o,i)=>{ const f=OP[o[0]]; if(!f) throw new Error('no text for op '+o[0]); const s=f(o); return i? lc(s) : s; }).join(', then '); }
const RULE={techCost:(n,sc)=>sc==='host'?`Your Techniques cost ${n} more`:`Opposing Techniques cost ${n} more`,relicDiscount:n=>`Your Relics cost ${n} less`,backBlock:()=>`Your Backstage Characters can block`,foeEnterExhausted:()=>`Opposing Characters enter exhausted`,noPhase:()=>`Opposing Characters lose Phase`,wagerDouble:()=>`Your Wagers reveal two cards; either can win`,reroll:()=>`Once a turn, when you lose a Wager, you may Wager again`,healBonus:n=>`Your healing is increased by ${n}`};
const WHO={self:'This Character',host:'The host',ally:'Characters you control',allyOther:'Other Characters you control',allyStage:'Stage Characters you control',allyBack:'Backstage Characters you control',foe:'Opposing Characters',foeStage:'Opposing Stage Characters',all:'Each Character',animAlly:'Your imbued Relics'};
function fdesc(f){ if(!f) return ''; const x=[]; if(f.kw) x.push('with '+f.kw); if(f.maxCost!==undefined) x.push(`with cost ${f.maxCost} or less`); if(f.attacking) x.push('while attacking'); return x.join(' '); }
const EV={enter:'When this enters',attack:'When this attacks',block:'When this blocks',defeat:'When this is defeated',damaged:'When this takes damage',hit:'When this deals combat damage to the opponent',wake:'At your wake',end:'At the end of your turn',tech:'When you play a Technique',slip:'When you slip a card',anomaly:'Whenever an Anomaly fires',wagerWin:'Whenever you win a Wager',wagerLose:'Whenever you lose a Wager',relicLost:'Whenever one of your Relics leaves play',targeted:'When this is targeted by an opposing effect'};
function abText(d,a){ const row=a.row==='back'?'Backstage: ':a.row==='stage'?'On the Stage: ':'';
  if(a.t==='st'){ const bits=[]; if(a.p||a.h) bits.push(`get ${a.p>=0?'+':''}${a.p||0}/${a.h>=0?'+':''}${a.h||0}`); if(a.kw) bits.push('have '+a.kw.join(', ')); const who=WHO[a.who]; const fd=fdesc(a.f);
    let sub=who; if(fd) sub=who.replace(/Characters/,'Characters '+fd).replace('This Character','This Character'); const verb=a.who==='self'||a.who==='host'?bits.join(' and ').replace(/\bget\b/,'gets').replace(/\bhave\b/,'has'):bits.join(' and ');
    return `${row}${sub} ${verb}${a.if?' while '+cnd(a.if):''}.`; }
  if(a.t==='rule'){ const f=RULE[a.rule]; return `${row}${f(a.n,a.scope)}${a.if?' while '+cnd(a.if):''}.`; }
  if(a.t==='tr'){ const ev=a.of==='ally'&&a.on==='defeat'?'Whenever another Character you control is defeated':a.of==='host'&&a.on==='wake'?"At the host's wake":(EV[a.on]||a.on); return `${row}${ev}${a.if?', if '+cnd(a.if):''}: ${text(a.ops)}.`; }
  if(a.t==='tick'){ return a.ops.length? `After ${d.tick} of the host's wakes, this is removed and: ${text(a.ops)}.` : `Lasts ${d.tick} of the host's wakes.`; }
  if(a.t==='act'){ const cost=[a.cost? `${a.cost} energy`:'free']; if(a.sac) cost.push('sacrifice this'); return `${row}Act (${cost.join(', ')}${a.once===false?'':', once per turn'}): ${text(a.ops)}.${a.react?' (Reaction)':''}`; }
  return ''; }
const KW={Rush:'Rush (can attack the turn it enters)',Phase:'Phase (can be blocked only by Phase or Sever Characters; no effect at Rift 0-2 or while Marked)',Momentum:'Momentum (+1 Power for each Technique you played this turn, up to +3)',Sever:'Sever (can block Phase; Characters it damages are silenced)',Resonance:'Resonance (+1 Power for each other Resonance Character you control, up to +2)',Absorb:'Absorb (whenever damaged, gains that much Impact, up to 5)',Haunt:'Haunt (when defeated, goes to your Rift pool instead of the discard pile)',Spotlight:'Spotlight (while on the Stage, opposing effects that target a Character must target a Spotlight Character if able)',Reservoir:'Reservoir (collects Impact whenever any Character you control is damaged, up to 10)'};
function cardText(d){ const lines=[]; if(d.type==='Character'){ for(const k of d.kw) lines.push(KW[k]||k); }
  if(d.type==='Technique'){ lines.push(text(d.ops)+'.'+(d.react?' (Reaction)':'')); }
  for(const a of d.ab||[]) lines.push(abText(d,a));
  if(d.type==='Condition') lines.unshift(`Attach to ${{foe:'the opponent',me:'yourself',E:'an enemy Character',ES:'an enemy Stage Character',A:'a Character you control'}[d.attach]}.`+(d.ransom!==undefined? ` The host's controller may pay ${d.ransom} energy to remove it.`:''));
  if(d.type==='Character'&&d.char) lines.push(`Next Episode: may be played on a Character you control named ${d.char} that costs less, paying the difference.`);
  return lines.filter(Boolean); }
module.exports={cardText,text,KW,abText,Tn};
