// Rift Parade Set 01 (Wrong Side of Reality): the mechanical side of all 130 cards.
// Identity (id, name, rarity, card type, episode, art direction) comes untouched from the production pack
// (design/tcg3/source/RP01_production.json). Everything here is gameplay only: cost, stats, keywords, abilities, and why the card exists.
// Abilities are data (see engine.js): {t:'st'} static, {t:'rule'} player rule, {t:'tr'} trigger, {t:'tick'} countdown, {t:'act'} activated.
'use strict';
const fs=require('fs'), path=require('path');
const PACK=JSON.parse(fs.readFileSync(path.join(__dirname,'../../design/tcg3/source/RP01_production.json'),'utf8'));

const st=x=>Object.assign({t:'st'},x), rule=(rule,n,scope,x)=>Object.assign({t:'rule',rule,n,scope},x), tr=(on,ops,x)=>Object.assign({t:'tr',on,ops},x);
const tick=(on,ops,x)=>Object.assign({t:'tick',on,of:'host',ops},x), act=(cost,ops,x)=>Object.assign({t:'act',cost,ops},x);
const RES={t:'ALL_A',kw:'Resonance'};
const M={};   // number -> mechanics
const ch=(n,cost,p,h,kw,ab,why,x)=>{ M[n]=Object.assign({cost,p,h,kw:kw||[],ab:ab||[],why},x); };
const tq=(n,cost,ops,why,x)=>{ M[n]=Object.assign({cost,ops,why},x); };
const relic=(n,cost,ab,why,x)=>{ M[n]=Object.assign({cost,ab,why},x); };
const zone=(n,cost,ab,why,x)=>{ M[n]=Object.assign({cost,ab,why},x); };
const cond=(n,cost,attach,ab,why,x)=>{ M[n]=Object.assign({cost,attach,ab,why},x); };

// ---------------------------------------------------------------- Commons (001-048)
ch('001',1,1,2,['Momentum'],[],'Cheap Kinetic body: gets bigger every Technique you play, so it is a real threat in Technique-heavy decks and a poor one elsewhere.');
ch('002',2,1,3,[],[tr('enter',[['scry',2]])],'Smoothing for any deck: a sturdy blocker that fixes the next two draws.');
ch('003',1,2,1,[],[st({who:'self',kw:['Phase'],if:['rift','>=',3]})],'Fragile one-drop that becomes hard to block once the Rift is wide; rewards decks that raise the Rift and loses its edge when it is mended.');
zone('004',2,[st({who:'ally',p:1,f:{maxCost:2}})],'Aggro zone: all your cheap Characters hit harder. Replaced or Severed when the opponent has a better reality.');
relic('005',1,[act(1,[['step','A']],{need:['A']})],'Positioning engine: a second free Step each turn, to dodge removal, set up blockers or bring a Backstage ability onto the Stage.');
tq('006',1,[['dodge','A']],'Cheap protection: pulls one Character Backstage and prevents damage to it this turn (a Kinetic leap).',{react:true,need:['A']});
ch('007',2,1,3,[],[tr('enter',[['pull',1]])],'Navigation tempo: returns one slipped card to hand, so a late Nova lets you re-use a key card instead of keeping it as energy.');
tq('008',2,[['prevent','E'],['dmg','LAST',2]],'Defensive Kinetic answer: stops one attacker\'s damage and punishes it. Keeps Technique decks alive against big attackers.',{react:true,need:['COMBAT_FOE']});
relic('009',1,[act(1,[['scry',1],['riftPM',1]])],'Rift dial: lets a deck steer the shared Rift gauge up or down by one each turn while smoothing its draws.');
zone('010',2,[st({who:'ally',p:1,f:{kw:'Phase'}}),tr('wake',[['rift',1]])],'Rift deck zone: widens the Rift every turn and rewards Phase Characters; speeds up Anomalies for everyone, so it is a commitment.');
ch('011',2,1,3,[],[tr('enter',[['search',{type:'Relic',maxCost:2}]])],'Workshop engine starter: finds the Relic the deck wants.');
ch('012',2,2,1,[],[tr('defeat',[['dmg','E',1]])],'Aggressive trader: dies for value, so blocking it or trading with it always costs something.');
tq('013',1,[['pump','A',2,0],['ifthen',['relics','>=',1],[['pump','LAST',0,1]]]],'Combat trick: Imbue a Character. Better if you control a Relic. Also feeds Momentum.',{react:true,need:['A']});
zone('014',2,[rule('relicDiscount',1,'me'),st({who:'animAlly',p:1,h:1})],'Workshop zone: cheaper Relics, stronger animated Relics.');
ch('015',2,2,2,['Sever'],[],'Cheap answer to Phase and abilities: the only common that blocks Phase attackers.');
ch('016',3,3,2,['Phase'],[],'Evasive attacker; weak to Marking, to Sever Characters and to a quiet Rift. Counterplay is built into the set.');
tq('017',1,[['severCond']],'Clean answer to any Condition (yours or theirs), for one energy.',{need:['COND_ANY']});
zone('018',2,[st({who:'ally',kw:['Haunt'],f:{maxCost:2}})],'Value zone: cheap Characters turn into energy when they die.');
cond('019',2,'ES',[st({who:'host',kw:['NoAttack']})],'Removes an attacker without killing it. The owner can pay to ransom it, so the cost is tempo, not a card.',{ransom:2});
ch('020',1,1,2,[],[tr('enter',[['strip',{maxCost:1}]])],'Scout: sees the opponent\'s hand and removes a cheap card. Information is the point.');
relic('021',1,[act(0,[['draw',2],['discard',1]],{sac:true})],'Cantrip Relic: converts itself into card selection (Reiya decks).');
zone('022',2,[tr('wake',[['loot']])],'Card filtering zone: optionally discard a card at each wake to draw one.');
cond('023',1,'foe',[rule('techCost',1,'host')],'Tempo tax against Technique decks for three of their turns.',{tick:3,ab2:[tick('wake',[])]});
ch('024',1,1,2,['Spotlight'],[],'Decoy: forces the opponent\'s targeted effects onto a cheap body. Protects your better Characters.');
tq('025',1,[['step','A'],['draw',1]],'Cutaway: cheaply reposition a Character in response to something and replace itself.',{react:true,need:['A']});
zone('026',2,[st({who:'ally',p:1,h:1,f:{kw:'Spotlight'}})],'Spotlight zone: makes the decoys real threats.');
cond('027',2,'E',[st({who:'host',kw:['NoStep']})],'Forces a Backstage Character onto the Stage and keeps it there. Counter to Backstage engines.',{onAttach:[['hostStage']]});
ch('028',2,1,4,['Absorb'],[act(0,[['release','E']],{if:['impact','>=',1],need:['E']})],'Damage sponge: stores Impact when hurt and releases it as damage. Better as a blocker than an attacker.');
ch('029',2,1,2,[],[tr('enter',[['mark','E']])],'Marks a target: it takes one extra damage and loses Phase. Opens up removal and combat for other cards.');
tq('030',1,[['pump','A',0,3],['impact','LAST',2]],'Defensive trick that also loads Impact on a Brax Character.',{react:true,need:['A']});
zone('031',2,[st({who:'ally',p:1,h:1,f:{kw:'Absorb'}}),rule('noPhase',1,'foe')],'Wall zone: strengthens Absorb Characters and shuts off the opponent\'s Phase.');
ch('032',1,1,2,['Resonance'],[],'Cheap Resonance body: team-builder for Lulu decks.');
ch('033',2,2,1,['Haunt'],[],'Cheap yokai attacker that becomes energy when it dies.');
ch('034',2,1,2,[],[tr('enter',[['silence','E']])],'Switches off one opposing Character\'s abilities for its next turn.');
zone('035',2,[rule('foeEnterExhausted',1,'me')],'Lockdown zone: the opponent\'s new Characters cannot block the turn they arrive. Punishes decks that rely on fresh blockers.');
ch('036',2,1,3,[],[tr('enter',[['heal',2]])],'Sustain body for the Mend decks.');
relic('037',1,[act(1,[['rift',-1],['heal',1]])],'Rift repair: lowers the Rift each turn and restores Resolve. Slows Anomalies.');
zone('038',2,[tr('wake',[['heal',1],['ifthen',['rift','>=',4],[['rift',-1]]]])],'Sustain zone: steady healing and a gentle Rift brake.');
relic('039',1,[act(1,[['wager','choose',[['draw',1]],[['payLife',1]]]])],'Crow\'s basic wager engine: a draw most of the time, a point of Resolve when it misses.');
cond('040',1,'me',[rule('wagerDouble',1,'host')],'Wager support: your Wagers reveal two cards and use the better one. Only useful in Wager decks, by design.');
ch('041',2,1,3,[],[tr('enter',[['dig',3,{type:'Relic'}]])],'Relic finder for Reiya decks that does not cost a card.');
relic('042',2,[tr('wake',[['counter',1]]),act(0,[['drawSeal',3]],{sac:true,if:['counters','>=',1]})],'Slow fuse: the longer you wait, the more cards you draw (up to three).');
cond('043',1,'foe',[],'One-shot Bargain: the opponent discards a card or you draw one.',{tick:1,ab2:[tick('wake',[['bargain',[['draw',1]],[['foeDiscard',1]]]])]});
zone('044',2,[tr('wake',[['draw',1]],{if:['relics','>=',2]})],'Relic payoff zone: card advantage once the Relics are out.');
cond('045',2,'E',[tr('wake',[['pump','HOST',-1,-1,'perm']],{of:'host'})],'Slow removal: the host shrinks at each of its wakes. Ransom or Sever answers it.',{ransom:2});
relic('046',1,[tr('anomaly',[['draw',2]],{of:'any'})],'Rift payoff: draws cards whenever the Rift fractures.');
tq('047',2,[['pump',RES,1,1]],'Resonance trick that scales with the number of Resonance Characters.',{react:true});
cond('048',1,'A',[st({who:'host',kw:['Haunt']}),st({who:'host',kw:['Phase'],if:['rift','>=',3]})],'Gives a Character Haunt and, while the Rift is wide, Phase.');

// ---------------------------------------------------------------- Uncommons (049-084)
ch('049',3,2,3,[],[tr('enter',[['rift',1]]),act(1,[['step','A']],{need:['A']})],'Nova as an enabler: opens the Rift and lets you reposition twice a turn.');
ch('050',3,3,2,['Momentum','Rush'],[],'Kinetic finisher: attacks at once and grows with every Technique.');
ch('051',3,2,3,[],[act(1,[['animate',2,2]],{need:['RELIC_ME']})],'Turns a Relic into an attacker for a turn (Imbue). Gives Relic decks a clock.');
ch('052',3,3,2,['Sever'],[],'Aggressive Sever body: silences what it damages.');
ch('053',4,3,3,['Phase'],[tr('hit',[['foeDiscard',1]])],'Evasive disruptor: every hit costs the opponent a card.');
ch('054',3,2,3,[],[tr('enter',[['bargain',[['draw',1]],[['hurt',2]]]])],'Bargain engine: the opponent decides whether to give you a card or Resolve.');
ch('055',3,2,3,[],[act(0,[['sacRelic',[['draw',2]]]],{sacNeed:true})],'Sells Relics for cards: converts spare Relics into card advantage.');
ch('056',3,2,4,['Spotlight'],[],'Solid Spotlight body: protects the rest of the team from targeted effects.');
ch('057',2,1,3,[],[st({who:'ally',p:1,f:{kw:'Spotlight'},row:'back'})],'Backstage support: pumps Spotlight Characters while sitting safely behind them.');
ch('058',3,2,3,[],[tr('wake',[['mark','E']])],'Marks one enemy at every wake: constant pressure that sets up removal.');
ch('059',4,2,5,['Absorb'],[act(0,[['release','E']],{if:['impact','>=',1],need:['E']})],'Stores damage as Impact and fires it back. Strong when blocking.');
ch('060',3,2,2,['Resonance'],[tr('enter',[['pump',{t:'ALL_A',kw:'Resonance',other:true},1,1,'perm']])],'Permanently grows the team: better the more Resonance you already have.');
ch('061',3,3,2,['Haunt'],[tr('enter',[['strip',{maxCost:2}]])],'Disruptive attacker that comes back as energy.');
ch('062',2,1,4,[],[act(1,[['heal',2],['purge','A']])],'Defensive support: heals and cleans a Character each turn. Slow but sticky.');
ch('063',3,2,3,[],[act(1,[['wager','choose',[['draw',1]],[['payLife',1]]]])],'Repeatable Wager engine on a body.');
ch('064',2,2,2,[],[tr('attack',[['wager','choose',[['pump','SELF',2,0]],[['dmg','SELF',1]]]])],'Risk/reward attacker: huge when the wager hits, can die when it misses.');
ch('065',4,3,3,[],[tr('enter',[['setAnomaly']]),tr('wake',[['scry',1]])],'Navigator: chooses which Anomaly fires next, and smooths your draws.');
ch('066',4,3,3,['Momentum'],[tr('hit',[['draw',1]])],'Kai as a card engine when his hits connect.');
tq('067',3,[['reflect']],'Turns an attacker\'s damage back on its controller. Punishes alpha strikes.',{react:true,need:['COMBAT_FOE']});
tq('068',2,[['animate',3,2]],'Imbue a Relic into a 3/2 attacker for the turn.',{need:['RELIC_ME']});
tq('069',2,[['sever','any']],'Destroys any opposing Condition, Relic or Zone.',{need:['SEVERABLE']});
tq('070',1,[['sacRelic',[['draw',2],['energy',1]]]],'Converts a Relic into two cards at no net energy cost.',{need:['RELIC_ME']});
tq('071',2,[['shove','ES']],'Shoves a Stage Character Backstage, removing it from attack or defense.',{react:true,need:['ES']});
tq('072',2,[['mark','E'],['dmg','LAST',2]],'Marks and damages a Character: 3 damage in total.',{need:['E']});
tq('073',2,[['pump',RES,0,2],['heal',2]],'Defensive Resonance trick that also heals.',{react:true});
tq('074',2,[['heal',3],['purge','A'],['purgeMe'],['rift',-1]],'Big repair: Resolve, Conditions and the Rift in one card.');
tq('075',1,[['wager','choose',[['dmg','E',3]],[['payLife',2]]]],'Cheap removal gamble: 3 damage if the wager hits, 2 damage to you if not.',{need:['E']});
tq('076',2,[['bounce',{t:'E',maxCost:4}],['rift',1]],'Detour: bounces an attacker or blocker and widens the Rift.',{react:true,need:[{t:'E',maxCost:4}]});
relic('077',2,[tr('wake',[['bargain',[['draw',1]],[['hurt',2]]]])],'Repeating Bargain: the opponent chooses card or Resolve every turn.');
relic('078',2,[st({who:'ally',p:1,h:1,f:{kw:'Spotlight'}})],'Spotlight support: Spotlight Characters get bigger.');
relic('079',1,[act(0,[['pump','AS',3,0],['grantCharge','LAST']],{sac:true,need:['AS']})],'One-shot burst: +3 power and Rush for a Character.');
relic('080',1,[act(0,[['heal',4]],{sac:true,react:true})],'Emergency life: restores 4 Resolve at any time.');
zone('081',2,[tr('relicLost',[['draw',1]])],'Relic engine zone: replaces Relics that leave play.');
zone('082',3,[rule('backBlock',1,'me')],'Backstage Characters may block: defensive zone that gives Backstage cards a role.');
zone('083',2,[st({who:'ally',kw:['Phase'],f:{kw:'Resonance'}})],'Gives Resonance Characters Phase: a fast clock for wide teams.');
cond('084',1,'foe',[],'Rift Sickness: the opponent loses 2 Resolve at each wake while the Rift is wide, for four turns. Counter: lower the Rift or purge.',{tick:4,ab2:[tr('wake',[['hurt',2]],{of:'host',if:['rift','>=',3]}),tick('wake',[])]});

// ---------------------------------------------------------------- Rares (085-114)
ch('085',4,3,3,['Rush','Momentum'],[],'Kai at full speed: attacks immediately and swings harder with Techniques.');
ch('086',4,3,3,[],[act(1,[['stepAny','X']],{need:['XS']})],'Moves any Character on the board between rows: repositioning as a weapon.');
ch('087',5,4,4,[],[tr('enter',[['animateAll',2,2]])],'Animates every Relic you control for a turn: big swing for Relic decks.');
ch('088',4,4,3,['Sever'],[tr('attack',[['silence','E']])],'Aggressive Sever: silences an enemy every time it attacks.');
ch('089',4,2,5,[],[rule('techCost',1,'foe',{if:['relics','>=',1]})],'Tax: opposing Techniques cost one more while you control a Relic.');
ch('090',5,4,4,[],[tr('enter',[['bargain',[['draw',3]],[['foeSacrifice',1]]]])],'Big Bargain: the opponent loses a Character or you draw three.');
ch('091',4,3,4,['Spotlight'],[tr('targeted',[['draw',1]])],'Rewards the opponent for targeting your team: draws a card when targeted.');
ch('092',4,3,3,[],[tr('enter',[['mark','ALL_E']])],'Marks the whole enemy team.');
ch('093',5,3,6,['Absorb'],[tr('attack',[['release','E']],{if:['impact','>=',1]})],'Walking wall that fires stored Impact when it attacks.');
ch('094',4,3,3,['Resonance','Rush'],[],'Hasty Resonance attacker.');
ch('095',4,3,3,['Haunt'],[tr('enter',[['strip',null]])],'Hand disruption on a body: look at the hand and discard any card.');
ch('096',4,2,5,[],[tr('enter',[['revive',{type:'Character',maxCost:3},'back',3]])],'Brings back a fallen Character Backstage and restores Resolve.');
ch('097',4,3,3,[],[rule('reroll',1,'me')],'Wager support: once a turn, a missed Wager may be repeated.');
ch('098',4,3,4,[],[tr('attack',[['wager','choose',[['dmg','E',2]],[['payLife',2]]]])],'Gambling attacker: damages an enemy Character if the wager hits, hurts you if not.');
ch('099',5,3,5,['Phase'],[tr('enter',[['bounce',{t:'E',maxCost:4}]])],'Tempo play: returns an enemy Character on arrival.');
ch('100',3,2,3,[],[tr('defeat',[['search',{type:'Relic',maxCost:3}]])],'Replaces itself with a Relic when it dies.');
ch('101',4,2,6,['Sever'],[st({who:'foe',p:-1,f:{attacking:true}})],'Defensive anchor: every attacker loses a point of Power.');
ch('102',3,2,4,[],[st({who:'animAlly',p:2,h:2}),act(1,[['animate',2,2]],{need:['RELIC_ME']})],'Makes animated Relics much stronger.');
ch('103',3,1,4,[],[tr('end',[['heal',2]])],'Steady Mend: restores Resolve at the end of every turn.');
ch('104',5,3,3,['Resonance'],[tr('enter',[['pump',RES,2,2],['grantCharge',RES]])],'Burst for wide Resonance teams: everything grows and can attack at once.');
tq('105',3,[['dmgPow','E']],'Kinetic removal: transfers the force of your best Character into an enemy.',{react:true,need:['E']});
tq('106',3,[['kill',{t:'E',weak:true}]],'Kills a Character that is Marked, has a Condition, Phase, Haunt, or is silenced.',{need:[{t:'E',weak:true}]});
tq('107',3,[['pump',RES,2,2]],'Large Resonance trick.',{react:true});
tq('108',4,[['revive',{type:'Character',maxCost:4},'back',0],['rift',-2]],'Returns a Character from the discard and mends the Rift.',{need:['DISCARD_CHAR']});
tq('109',2,[['wager','choose',[['steal',{maxCost:3}]],[['discard',1]]]],'Probability theft: steals a card if the wager hits, costs a card if not.',{need:['FOEHAND']});
tq('110',3,[['fireAnomaly'],['draw',2]],'Fires the next Anomaly immediately and draws: lets a Rift deck choose its moment.');
relic('111',2,[tr('wake',[['counter',1]]),act(0,[['draw',3],['heal',5]],{sac:true,if:['counters','>=',3]})],'Long fuse payoff: after three turns, three cards and five Resolve.');
zone('112',3,[rule('relicDiscount',1,'me'),tr('wake',[['draw',1]],{if:['relics','>=',1]})],'Relic deck zone: cheaper Relics and an extra card every turn you control one.');
cond('113',3,'foe',[],'Delayed sweep: after three of the opponent\'s turns every Character takes 5 damage. Plan around it; Sever answers it.',{tick:3,ab2:[tick('wake',[['dmg','ALL_X',5]])]});
cond('114',3,'foe',[],'Countdown: the opponent loses 7 Resolve after four of their turns unless they remove it. A slow finisher with several answers.',{tick:4,ab2:[tick('wake',[['hurt',7]])]});

// ---------------------------------------------------------------- Super Rares (115-128)
ch('115',5,4,4,['Momentum'],[tr('enter',[['revive',{type:'Character',maxCost:3},'back',0]])],'Recovers an ally on arrival: the comeback finisher of the Kinetic deck.');
ch('116',5,4,4,['Phase'],[tr('enter',[['setAnomaly'],['rift',2]])],'Takes control of the Rift: picks the next Anomaly and pushes the gauge.');
ch('117',5,3,5,[],[act(1,[['animate',4,4]],{need:['RELIC_ME']})],'Animates a Relic as a 4/4 every turn: the Relic deck\'s engine.');
ch('118',5,4,3,['Sever','Rush'],[tr('enter',[['sever','any']])],'Cuts a Condition, Relic or Zone on arrival and attacks at once.');
ch('119',5,3,4,[],[act(3,[['kill',{t:'E',marked:true}]],{need:[{t:'E',marked:true}]})],'Kills a Marked Character for three energy each turn: expensive, but strong control.');
ch('120',5,3,5,['Resonance'],[st({who:'allyOther',p:1,f:{kw:'Resonance'}}),tr('defeat',[['draw',1]],{of:'ally'})],'Resonance lord: a bigger team and card flow when allies fall.');
ch('121',5,2,6,[],[tr('wake',[['heal',2],['rift',-1]])],'Mend anchor: heals and mends the Rift every turn.');
ch('122',5,4,4,['Haunt'],[tr('enter',[['strip',null]]),st({who:'allyOther',kw:['Haunt']})],'Gives your team Haunt and strips a card: a grindy value engine.');
ch('123',5,3,4,[],[tr('wagerWin',[['hurt',2]]),tr('wagerLose',[['draw',1]])],'Wager payoff: every Wager now gives something.');
ch('124',5,3,5,[],[act(0,[['dmgByRelic','E',2]],{sacNeed:true,need:['E']})],'Converts Relics into damage: the Relic deck\'s removal.');
ch('125',6,4,7,['Absorb','Reservoir'],[act(0,[['release','foe']],{if:['impact','>=',1]}),act(0,[['release','E']],{if:['impact','>=',1],need:['E']})],'Stores Impact from the whole team and releases it as damage to a Character or the opponent. The Impact deck\'s finisher.');
ch('126',6,5,5,[],[tr('enter',[['bargain',[['hurt',6]],[['foeSacrificeBest']]]])],'Brutal Bargain: six Resolve or their best Stage Character.');
ch('127',5,3,5,['Spotlight'],[tr('enter',[['pullStage'],['draw',1]])],'Drags the opponent\'s Backstage Characters onto the Stage and draws a card.');
ch('128',6,5,4,['Phase'],[tr('enter',[['recur',null,2]])],'Memory: returns two cards from the discard. A late-game engine for every grind deck.');

// ---------------------------------------------------------------- Secret Rares (129-130)
ch('129',6,5,4,['Sever','Rush'],[tr('enter',[['sever','any'],['silence','ALL_E']])],'Cuts an opposing Condition, Relic or Zone and silences every opposing Character. A finisher with a high price.',{max:1});
ch('130',6,5,5,[],[tr('enter',[['animateAll',4,4]]),tr('end',[['draw',1]])],'Relic-deck finisher: animates every Relic at 4/4 and draws at end of turn.',{max:1});

// ---------------------------------------------------------------- merge with the canonical checklist
const CARDS={}, ORDER=[], NUM={};
for(const b of PACK.base_checklist){
  const num=b.number.slice(5), m=M[num]; if(!m) throw new Error('no mechanics for '+b.number);
  const name=b.name, comma=name.indexOf(','), charName= b.card_type==='Character'&&comma>0? name.slice(0,comma) : null;
  const d={id:b.number,num,name,rarity:b.rarity,type:b.card_type,ep:b.episode,art:b.art_direction,meta:b.meta_detail,char:charName,
    cost:m.cost,p:m.p,h:m.h,kw:m.kw||[],ab:(m.ab||[]).concat(m.ab2||[]),ops:m.ops,react:!!m.react,need:m.need,attach:m.attach,tick:m.tick,ransom:m.ransom,onAttach:m.onAttach,max:m.max||3,why:m.why};
  d.hasSt=d.ab.some(a=>a.t==='st'||a.t==='rule');
  if(d.type==='Character'){ delete d.ops; } else { delete d.p; delete d.h; }
  CARDS[d.id]=d; ORDER.push(d.id); NUM[num]=d;
}
if(ORDER.length!==130) throw new Error('expected 130 cards, got '+ORDER.length);
for(const k in M) if(!NUM[k]) throw new Error('mechanics for unknown card '+k);
const PACK_META={set:PACK.set,variants:PACK.alternate_printings,locked:PACK.locked_rules};
module.exports={CARDS,ORDER,NUM,PACK_META};
