// Tidemark Version 1 card vocabulary: every ability is a small operation ("op"), and card text is generated from the ops,
// so text and play never disagree (as Wildkin does). Rules: tidemark-production/RULES.md (rules 1.0 = prototype rules 0.3
// plus the rising tide). Used by cards.js (validation and text) and engine.js (play).
//
// A design (design_*.js) is {c cost, q Allegiance requirement, p/t Power/Toughness (Units, Vessels), f durability
// (Strongholds), y Ferry N, k 'keyword keyword', x [ability, ...], n designer note}.
// An ability is [when, op, ...args]:
//   when  play     spells: when cast. Permanents: when it enters play
//         rise     at your Rise, while it is in play          death   when this unit is destroyed
//         attack   when this unit attacks                     block   when this unit blocks
//         hit      when this unit deals damage to the opponent's Harbor
//         static   a continuous effect while it is in play (Domains: on their front, for both players)
//         on:EVENT[:FILTER]  whenever EVENT happens while this is in play (EVENTS below)
// A filter is a string of words (FILTER below), e.g. 'enemy unit cost<=3', 'own beast', 'any shore'.
const KEYWORDS=['charge','surge','rampart','leader','swift','undertow','tough','trample','ferry'];
const KWNAME={charge:'Charge',surge:'Surge',rampart:'Rampart',leader:'Leader',swift:'Swift',undertow:'Undertow',tough:'Tough',trample:'Trample',ferry:'Ferry'};
const EVENTS={dies:'{F} is destroyed', cast:'you play {F}', returned:'one of your units returns to your hand', harbor:'you deal damage to the opponent\'s Harbor',
  hold_hit:'one of your Strongholds takes damage', opp_draw:'your opponent draws a card outside their draw step', cross:'an opponent\'s unit attacks away from home', enter:'{F} enters play'};
// filter words. Anything else is a subtype word (beast, sailor, construct, druid...), matched against the card's subtype.
const FW={own:1,enemy:1,any:1,unit:1,vessel:1,nonvessel:1,relic:1,equipment:1,enchantment:1,aura:1,domain:1,stronghold:1,spell:1,card:1,permanent:1,
  other:1,foe:1,self:1,attacker:1,blocker:1,crossing:1,shore:1,deep:1,damaged:1,token:1,nontoken:1,legend:1,home:1,homeblock:1,land:1,sea:1,dual:1,neutral:1,front:1};
const SUBTYPES=['beast','spirit','bird','construct','cultist','druid','hunter','worker','archer','cleric','keeper','knight','mercenary','noble','official','privateer',
  'sailor','soldier','trader','wanderer','mason','miner','smith','scout','guardian','mage','warrior','horror','leviathan','kraken','fish','eel','turtle','human','folk',
  'tideborn','reachfolk','drowned','boar','wolf','levy','fox','badger','singer','spawn','mercenaries','cat','hound','whale','rat'];
function parseF(f){ const w=(f||'').trim().split(/\s+/).filter(Boolean); const o={words:w, cmp:[], sub:[], flags:new Set()};
  for (const x of w){ const m=x.match(/^(cost|pow|tgh)(<=|>=)(\d+)$/); if (m){ o.cmp.push([m[1],m[2],+m[3]]); continue; }
    if (FW[x]) o.flags.add(x); else if (KEYWORDS.includes(x)) o.flags.add('kw:'+x); else if (SUBTYPES.includes(x)) o.sub.push(x); else throw new Error('unknown filter word "'+x+'" in "'+f+'"'); }
  return o; }
// ---- noun phrases for filters
const PLK={unit:'units',vessel:'Vessels',relic:'Relics',equipment:'Equipment',enchantment:'Enchantments',aura:'Auras',domain:'Domains',stronghold:'Strongholds',spell:'spells',card:'cards',permanent:'permanents'};
const SGK={unit:'unit',vessel:'Vessel',relic:'Relic',equipment:'Equipment',enchantment:'Enchantment',aura:'Aura',domain:'Domain',stronghold:'Stronghold',spell:'spell',card:'card',permanent:'permanent'};
const SUBN={folk:['Forest Folk','Forest Folk'],tideborn:['Tideborn','Tideborn'],reachfolk:['Reachfolk','Reachfolk'],drowned:['Drowned','Drowned'],levy:['Levy','Levy'],
  mercenaries:['Mercenary','Mercenaries'],mercenary:['Mercenary','Mercenaries'],wolf:['Wolf','Wolves'],fish:['Fish','Fish'],fox:['Fox','Foxes'],spawn:['Spawn','Spawn'],kraken:['Kraken','Krakens']};
const subN=(s,pl)=> SUBN[s]? SUBN[s][pl?1:0] : s[0].toUpperCase()+s.slice(1)+(pl?'s':'');
const art=s=> (/^[aeioAEIO]/.test(s) || /^Undertow/.test(s))? 'an '+s : 'a '+s;
// noun(f, {side, plural}): "an enemy unit that costs 3 or less", "one of your Beasts", "your other units", "enemy Vessels"
function noun(f, opt){ opt=opt||{}; const o=parseF(f); const F=o.flags; const pl=!!opt.plural;
  const kind=['vessel','relic','equipment','enchantment','aura','domain','stronghold','spell','card','permanent'].find(k=>F.has(k))||'unit';
  const adj=[]; if (F.has('damaged')) adj.push('damaged'); if (F.has('legend')) adj.push('Legendary'); if (F.has('token')) adj.push('token');
  for (const k of KEYWORDS) if (F.has('kw:'+k)) adj.push(KWNAME[k]);
  for (const a of ['land','sea','dual','neutral']) if (F.has(a)) adj.push(a[0].toUpperCase()+a.slice(1));
  if (F.has('attacker')) adj.push('attacking'); if (F.has('blocker')) adj.push('blocking');
  let head= o.sub.length && (kind==='unit'||kind==='card')? o.sub.map((x,i)=>subN(x, pl && i===o.sub.length-1)).join(' ') : pl? PLK[kind] : SGK[kind];
  if (F.has('nonvessel')) head=pl? 'units that are not Vessels' : 'unit that is not a Vessel';
  const tail=[]; if (F.has('crossing')) tail.push('attacking away from home'); if (F.has('shore')) tail.push('on the Shore'); if (F.has('deep')) tail.push('in the Deep');
  if (F.has('home')) tail.push('on '+(pl?'their':'its')+' home front');
  for (const [k,c,n] of o.cmp){ if (k==='cost') tail.push((pl?'that cost ':'that costs ')+n+(c==='<='?' or less':' or more')); else tail.push('with '+n+(c==='<='?' or less ':' or more ')+(k==='pow'?'Power':'Toughness')); }
  if (F.has('homeblock')) tail.push('while blocking at home');
  if (F.has('foe')) return pl? 'the units fighting this' : 'the unit fighting this';
  if (F.has('self')) return 'this';
  const side=F.has('own')?'own':F.has('enemy')?'enemy':F.has('any')?'any':(opt.side||'any'); const other=F.has('other');
  const core=(adj.length? adj.join(' ')+' ' : '')+head;
  const t=tail.length? ' '+tail.join(' ') : '';
  if (pl){ if (side==='own') return (other?'your other ':'your ')+core+t; if (side==='enemy') return 'enemy '+core+t; return (other?'other ':'')+core+t; }
  if (side==='own'){ const pc=(adj.length? adj.join(' ')+' ' : '')+(o.sub.length&&kind==='unit'? o.sub.map((x,i)=>subN(x,i===o.sub.length-1)).join(' ') : PLK[kind]); return (other?'another of your ':'one of your ')+pc+t; }
  if (side==='enemy') return art('enemy '+core)+t;
  return (other? 'another '+core : art(core))+t;
}
const cap=s=>s[0].toUpperCase()+s.slice(1);
const ownN=f=>noun(f,{side:'own'}), enemyN=f=>noun(f,{side:'enemy'}), anyN=f=>noun(f,{side:'any'});
const sign=n=>(n>=0?'+':'')+n;
const pt=(p,t)=>sign(p)+'/'+sign(t);
const NUMW=['no','a','two','three','four','five','six'];
const card=n=>n===1?'a card':(NUMW[n]||n)+' cards';
// ---- the ops: a args, w allowed whens ('*' any non-static, 's' static only), text(args, ctx) -> sentence without the trigger prefix
// arg kinds: n number, F filter, s string, k keyword list (space separated)
const OPS={
 draw:{a:'n', t:([n])=>'Draw '+card(n)+'.'},
 scry:{a:'n', t:([n])=>'Look at the top '+(n===1?'card':n+' cards')+' of your deck. Put any of them on the bottom.'},
 dig:{a:'n F', t:([n,f])=>'Look at the top '+n+' cards of your deck. Put '+(f? noun(f,{side:'any'}) : 'one of them')+(f?' from among them':'')+' into your hand and the rest on the bottom.'},
 tutor:{a:'F n?', t:([f,n])=>'Search your deck for '+(n>1? 'up to '+n+' '+noun(f,{plural:true,side:'any'}).replace(/^your /,'') : noun(f,{side:'any'}))+', put '+(n>1?'them':'it')+' into your hand, then shuffle.'},
 regrow:{a:'F', t:([f])=>'Return '+noun(f,{side:'any'})+' from your discard pile to your hand.'},
 reanimate:{a:'F', t:([f])=>'Return '+noun(f,{side:'any'})+' from your discard pile to play.'},
 harbor:{a:'n', t:([n])=>'Restore '+n+' strength to your Harbor.'},
 lose:{a:'n', t:([n])=>'Your Harbor loses '+n+' strength.'},
 inf:{a:'n', t:([n])=>'Gain '+n+' Influence this turn.'},
 ramp:{a:'n', t:([n])=>'Your Influence capacity grows by '+n+'.'},
 dmg:{a:'n F', t:([n,f])=>'Deal '+n+' damage to '+noun(f,{side:'enemy'})+'.'},
 dmg_multi:{a:'n n F', t:([n,k,f])=>'Deal '+n+' damage to each of up to '+k+' '+noun(f,{side:'enemy',plural:true})+'.'},
 sweep:{a:'n F', t:([n,f])=>{ const o=parseF(f); const fr=o.flags.has('shore')?'':o.flags.has('deep')?'':' on one front'; return 'Deal '+n+' damage to each '+noun(f,{side:'any'}).replace(/^an? /,'')+fr+'.'; }},
 dmg_harbor:{a:'n', t:([n])=>'Deal '+n+' damage to your opponent\'s Harbor.'},
 dmg_hold:{a:'n', t:([n])=>'Deal '+n+' damage to one of your opponent\'s Strongholds.'},
 dmg_attackers:{a:'n', t:([n])=>'Deal '+n+' damage to each attacking unit.'},
 destroy:{a:'F', t:([f])=>'Destroy '+noun(f,{side:'enemy'})+'.'},
 exile:{a:'F', t:([f])=>'Remove '+noun(f,{side:'enemy'})+' from the game.'},
 bounce:{a:'F', t:([f])=>'Return '+noun(f,{side:'enemy'})+' to its owner\'s hand.'},
 bounce_all:{a:'F', t:([f])=>{ const o=parseF(f); return 'Return every '+noun(f,{side:'any'}).replace(/^an? /,'')+(o.flags.has('front')?' on one front':'')+' to its owner\'s hand.'; }},
 tokens:{a:'n n n s k?', t:([n,p,t,nm,k])=>'Create '+(NUMW[n]||n)+' '+p+'/'+t+' '+nm+' token'+(n===1?'':'s')+(k? ' with '+k.split(' ').map(x=>KWNAME[x]).join(' and ') : '')+'.'},
 pump:{a:'n n F', t:([p,t,f])=>cap(noun(f||'own unit',{side:'own'}))+' gets '+pt(p,t)+' this turn.'},
 pump_all:{a:'n n F', t:([p,t,f])=>(noun(f||'own unit',{side:'own',plural:true}).replace(/^./,c=>c.toUpperCase()))+' get '+pt(p,t)+' this turn.'},
 grant:{a:'k F', t:([k,f])=>(noun(f||'own unit',{side:'own',plural:true}).replace(/^./,c=>c.toUpperCase()))+' gain '+k.split(' ').map(x=>KWNAME[x]).join(' and ')+' this turn.'},
 weaken:{a:'n n F', t:([p,t,f])=>(noun(f,{side:'enemy'}).replace(/^./,c=>c.toUpperCase()))+' gets -'+p+'/-'+t+' this turn.'},
 stun:{a:'F', t:([f])=>(noun(f,{side:'enemy'}).replace(/^./,c=>c.toUpperCase()))+' cannot attack during its controller\'s next turn.'},
 noblock:{a:'F', t:([f])=>(noun(f,{side:'enemy'}).replace(/^./,c=>c.toUpperCase()))+' cannot block this turn.'},
 unblockable:{a:'F', t:([f])=>(noun(f||'own unit',{side:'own'}).replace(/^./,c=>c.toUpperCase()))+' cannot be blocked this turn.'},
 shift:{a:'F', t:([f])=>'Move '+noun(f,{side:'enemy'})+' to the other front. It becomes exhausted.'},
 move:{a:'F', t:([f])=>'Move '+noun(f||'own unit',{side:'own'})+' to the other front.'},
 ready:{a:'F', t:([f])=>'Ready '+noun(f||'own unit',{side:'own'})+'.'},
 ready_all:{a:'F', t:([f])=>'Ready '+noun(f||'own unit',{side:'own',plural:true})+'.'},
 fortify:{a:'n', t:([n])=>'One of your Strongholds gains '+n+' durability.'},
 fortify_all:{a:'n', t:([n])=>'Each of your Strongholds gains '+n+' durability.'},
 control:{a:'F', t:([f])=>'Gain control of '+noun(f,{side:'enemy'})+'.'},
 discard:{a:'n', t:([n])=>'Your opponent discards '+card(n)+' at random.'},
 fight:{a:'F', t:([f])=>'Choose one of your units and '+noun(f||'enemy unit',{side:'enemy'})+'. They deal damage equal to their Power to each other.'},
 skip_rise:{a:'', t:()=>'Your opponent\'s Influence capacity does not grow at their next Rise, and their units do not ready.'},
 opp_draw:{a:'n', t:([n])=>'Your opponent draws '+card(n)+'.'},
 loot:{a:'n n', t:([a,b])=>'Discard '+card(a)+', then draw '+card(b)+'.'},
 mend:{a:'n F', t:([n,f])=>cap(noun(f||'own unit other',{side:'own'}))+' gets +0/+'+n+' until your next turn.'},
 copy:{a:'F', t:([f])=>'Create a token that is a copy of '+noun(f||'own unit',{side:'own'})+'.'},
 recur:{a:'', t:()=>'Return this card to your hand.'},
 grow:{a:'n n', t:([p,t])=>'This gets '+pt(p,t)+' permanently.'},
 tax_next:{a:'n', t:([n])=>'The next spell your opponent plays costs '+n+' more.'},
 calm:{a:'', t:()=>'Choose a front. Neither player can attack into it until your next turn.'},
 // ---- statics
 lord:{a:'n n F', w:'s', t:([p,t,f],c)=>(c&&c.domain? (cap(noun(f||'any unit',{side:'any',plural:true})).replace(/( while blocking at home)?$/,m=>' on this front'+m)) : (noun(f||'own unit',{side:'own',plural:true}).replace(/^./,x=>x.toUpperCase())))+' get '+pt(p,t)+'.'},
 cost:{a:'n F', w:'s', t:([n,f],c)=>(c&&c.domain? (noun(f,{plural:true,side:'any'}).replace(/^./,x=>x.toUpperCase()))+' cost '+n+' less to play.' : 'Your '+noun(f,{plural:true,side:'any'})+' cost '+n+' less to play.')},
 tax:{a:'n F', w:'s', t:([n,f])=>'Your opponent\'s '+noun(f,{plural:true,side:'any'})+' cost '+n+' more to play.'},
 nostrand:{a:'F', w:'s', t:([f],c)=>f==='self'? 'This is never Stranded.' : (c&&c.domain? (noun(f||'any unit',{plural:true,side:'any'}).replace(/^./,x=>x.toUpperCase()))+' that attack into this front are never Stranded.' : (noun(f||'own unit',{side:'own',plural:true}).replace(/^./,x=>x.toUpperCase()))+' are never Stranded.')},
 athome:{a:'F', w:'s', t:([f],c)=>f==='self'? 'This counts as at home on both fronts.' : (c&&c.domain? (noun(f||'any unit',{plural:true,side:'any'}).replace(/^./,x=>x.toUpperCase()))+' count as at home on this front.' : (noun(f||'own unit',{side:'own',plural:true}).replace(/^./,x=>x.toUpperCase()))+' count as at home on both fronts.')},
 strand_front:{a:'', w:'s', t:()=>'Units that attack into this front are Stranded, even at home.'},
 strand2:{a:'', w:'s', t:()=>'Stranded units stay exhausted for one more turn.'},
 bounce_cross:{a:'', w:'s', t:()=>'After battle, units that attacked into this front away from home return to their owners\' hands.'},
 ward:{a:'n', w:'s', t:([n])=>'Your Harbor takes '+n+' less damage from each unblocked attacker.'},
 hold_ward:{a:'n', w:'s', t:([n])=>'Your Strongholds take '+n+' less damage from each unblocked attacker.'},
 screen_both:{a:'', w:'s', t:()=>'This Stronghold also screens the Deep.'},
 both_allegiance:{a:'', w:'s', t:()=>'This card counts as both Land and Sea for Allegiance.'},
 twice:{a:'', w:'s', t:()=>'This can block two attackers.'},
 survive:{a:'', w:'s', t:()=>'The first time this would be destroyed, remove all damage from it instead.'},
 spellproof:{a:'', w:'s', t:()=>'This cannot be destroyed or returned to hand by spells.'},
 nobounce:{a:'', w:'s', t:()=>'This cannot be returned to hand.'},
 guard_both:{a:'', w:'s', t:()=>'This blocks at home on both fronts.'},
 home:{a:'n n', w:'s', t:([p,t])=>'This gets '+pt(p,t)+' while on its home front.'},
 max_attack:{a:'n', w:'s', t:([n])=>'No more than '+n+' units can attack into this front each turn.'},
 thorns:{a:'n F?', w:'s', t:([n,f])=>'Each unit that attacks into '+(f&&parseF(f).flags.has('shore')?'the Shore':f&&parseF(f).flags.has('deep')?'the Deep':'this front')+' takes '+n+' damage.'},
 echo:{a:'', w:'s', t:()=>'The first Swift spell you play each turn happens twice.'},
 pacify:{a:'F', w:'s', t:([f])=>(noun(f,{plural:true,side:'any'}).replace(/^./,x=>x.toUpperCase()))+' cannot attack.'},
 equip:{a:'n n k?', w:'s', t:([p,t,k])=>'The equipped unit gets '+pt(p,t)+(k? ' and '+k.split(' ').map(x=>KWNAME[x]).join(' and ') : '')+'.'},
 aura:{a:'n n k?', w:'s', t:([p,t,k])=>'The enchanted unit gets '+pt(p,t)+(k? ' and '+k.split(' ').map(x=>KWNAME[x]).join(' and ') : '')+'.'},
 grant_static:{a:'k F', w:'s', t:([k,f],c)=>(c&&c.domain? (noun(f||'any unit',{plural:true,side:'any'}).replace(/^./,x=>x.toUpperCase()))+' on this front have ' : (noun(f||'own unit',{side:'own',plural:true}).replace(/^./,x=>x.toUpperCase()))+' have ')+k.split(' ').map(x=>KWNAME[x]).join(' and ')+'.'},
 scale:{a:'n n F', w:'s', t:([p,t,f])=>'This gets '+pt(p,t)+' for each '+noun(f,{side:'own'}).replace(/^one of your /,'').replace(/s$/,'')+' you control.'},
};
const WHEN={play:'',rise:'At your Rise, ',death:'When this is destroyed, ',attack:'When this attacks, ',block:'When this blocks, ',hit:'When this deals damage to your opponent\'s Harbor, ',static:''};
function whenText(w, c){ if (w==='play') return c.spell? '' : 'When this enters play, ';
  if (w.startsWith('on:')){ const [,ev,f]=w.split(':'); let s=EVENTS[ev]; if (!s) throw new Error('unknown event '+ev); if (s.includes('{F}')) s=s.replace('{F}', noun(f? f.replace(/_/g,' ') : (ev==='cast'?'card':'unit'),{side:'any'})); return 'Whenever '+s+', '; }
  if (!(w in WHEN)) throw new Error('unknown trigger '+w); return WHEN[w]; }
const LCW=new Set(['One','Another','A','An','Your','Each','Deal','Draw','Look','Search','Return','Restore','Gain','Destroy','Remove','Create','Move','Ready','Choose','Discard','Units','The','This','Neither','Enemy','Other','Attacking','Damaged','Blocking','No','Its']);
function lc(s){ const w=s.split(' ')[0]; return LCW.has(w)? s[0].toLowerCase()+s.slice(1) : s; }
// check one ability's shape; returns an error string or ''
function checkAbility(ab){ if (!Array.isArray(ab) || ab.length<2) return 'ability must be [when, op, ...args]'; const [w,op,...args]=ab; const d=OPS[op]; if (!d) return 'unknown op '+op;
  try { whenText(w,{}); } catch(e){ return e.message; }
  if (d.w==='s' && w!=='static') return op+' is a static (when must be "static")'; if (d.w!=='s' && w==='static') return op+' is not a static';
  const spec=d.a? d.a.split(' ') : []; const need=spec.filter(x=>!x.endsWith('?')).length; if (args.length<need || args.length>spec.length) return op+' takes '+d.a+', got '+JSON.stringify(args);
  for (let i=0;i<args.length;i++){ const k=spec[i].replace('?',''), v=args[i];
    if (k==='n' && typeof v!=='number') return op+': argument '+(i+1)+' must be a number';
    if (k==='F'){ if (typeof v!=='string') return op+': argument '+(i+1)+' must be a filter string'; try { parseF(v); } catch(e){ return e.message; } }
    if (k==='k'){ if (typeof v!=='string' || v.split(' ').some(x=>!KEYWORDS.includes(x))) return op+': keywords must be from '+KEYWORDS.join(', '); }
    if (k==='s' && typeof v!=='string') return op+': argument '+(i+1)+' must be a name'; }
  if (w.startsWith('on:')){ const f=w.split(':')[2]; if (f) try { parseF(f.replace(/_/g,' ')); } catch(e){ return e.message; } }
  return ''; }
function abilityText(ab, ctx){ const [w,op,...args]=ab; const body=OPS[op].t(args, ctx); const pre=whenText(w, ctx); return pre? pre+lc(body) : body; }
module.exports={KEYWORDS, KWNAME, OPS, EVENTS, parseF, noun, checkAbility, abilityText, SUBTYPES};
