// ===================== TCG: THE WILDKIN UNIVERSE =====================
// A creature-collecting card game with nine energy types. Cards are generated from the world seed, so nothing here is stored in saves
// except what changes: copies, prices, the metagame, bans.
const TC_EL=TCF.ENERGY;                                   // Flame Tide Grove Radiant Void Frost Storm Stone Lunar
const TC_ROW=['Frost','Storm','Void','Lunar','Radiant','Stone','Flame','Tide','Grove'];   // one habitat per row of the commons art
const TC_HAB=['Crystal cave','Open sky','Swamp','Moonlit night','Meadow','Rocky desert','Volcanic ridge','Shallow water','Forest'];
const TC_NAMES=['Prismouse','Gemnewt','Amethysnail','Quartzmole','Shardbeetle','Amethare','Crystabat','Teallizard','Rubywhelp','Zephchick','Cloudhare','Glidewyrm','Griffling','Wispferret','Gustowl','Plumestrider','Windpup','Skyimp','Mosstoad','Lilyshell','Muskotter','Reedbat','Fernadder','Bognewt','Peatsnail','Frondling','Shroomtoad','Moonhare','Duskfox','Mothlet','Hushowl','Glimmernewt','Astrotoad','Lanternmouse','Nightling','Umbrakit','Cloverfox','Petalhare','Puffchick','Bloomlamb','Orchidmantis','Pollenbat','Fawnbud','Daisyshell','Leafhopper','Boulderback','Pebblestoat','Hornmole','Geodesnail','Cobblepup','Rusttoad','Slatearmadillo','Shalehare','Cairnling','Embercub','Lavashell','Blazechick','Cindernewt','Magmaram','Pyremole','Lavagrub','Ashfox','Flaretail','Bubblefrog','Pebblecrab','Reedling','Shellseal','Finwyrm','Kelpsnail','Ripplemouse','Coralnewt','Tidotter','Leafgecko','Acornmouse','Mossbun','Twigfawn','Sproutling','Sproutshell','Vinegecko','Leafbeetle','Barkfox'];
const TC_FULL=[['Lumistag','Frost'],['Florawyrm','Radiant'],['Cinderback','Flame'],['Lunamoth','Lunar'],['Briarelk','Grove'],['Cumulofox','Storm'],['Mossback Colossus','Grove'],['Nebulid','Void'],['Glassdrake','Frost']];
const TC_ATK={Frost:[['Shard Volley',20,'Does 10 damage to 1 Benched creature.'],['Prism Guard',30,'Prevent damage from Basic creatures next turn.'],['Facet Slash',40,'']],Storm:[['Gust',20,''],['Wing Buffet',30,'Switch the Defending creature with 1 Benched creature.'],['Tailwind',0,'Draw 2 cards.']],Void:[['Mire Snap',20,'The Defending creature is now Poisoned.'],['Sludge Wave',40,''],['Bog Hide',0,'Heal 30 damage from this creature.']],Lunar:[['Moonbeam',20,''],['Dusk Veil',0,'The Defending creature is now Asleep.'],['Crescent Strike',50,'']],Radiant:[['Petal Dance',20,''],['Pollen Burst',30,'Flip a coin. If heads, the Defending creature is Paralyzed.'],['Sun Bloom',0,'Heal 20 damage from each of your creatures.']],Stone:[['Rock Toss',30,''],['Tremor',40,'Does 10 damage to each Benched creature.'],['Harden',0,'Take 30 less damage during your opponent\'s next turn.']],Flame:[['Ember',20,''],['Flare Dash',40,'Discard an Energy from this creature.'],['Lava Crawl',30,'The Defending creature is now Burned.']],Tide:[['Splash',20,''],['Bubble Beam',30,'Flip a coin. If heads, prevent all damage done to this creature next turn.'],['Riptide',50,'']],Grove:[['Leaf Cut',20,''],['Vine Snare',30,'The Defending creature can\'t retreat next turn.'],['Photosynth',0,'Attach a Grass Energy from your discard pile.']]};
const TC_TRN={ item:{names:['Prism Cluster','Star Compass','Moonlight Elixir','Astral Tome','Sealed Decree','Star Key','Starlit Lantern','Treasure Chest','Crescent Amulet'],rules:['Search your deck for an Energy card and attach it to 1 of your creatures.','Look at the top 4 cards of your deck. Put 1 in your hand.','Heal 60 damage from 1 of your creatures.','Draw 3 cards.','Your opponent reveals their hand. Discard 1 card from it.','Switch 1 of your Benched creatures with your Active creature.','Attach this to a creature. It has no Retreat Cost.','Flip 2 coins. For each heads, draw a card.','Attach to a creature. It takes 20 less damage from attacks.'],rar:['unc','unc','common','unc','unc','common','unc','rare','rare'],pw:[.62,.7,.42,.8,.5,.52,.46,.6,.55],st:['combo','combo','stall','combo','control','mid','mid','combo','stall'],art:'it'},
 supply:{names:['Berry Bundle','Forest Mushrooms','Hearth Loaf','Mountain Cheese','Fresh Milk','Garden Carrots','Glimmer Ore','Split Logs','Seed Sack'],rules:['Heal 30 damage from 1 of your creatures.','Heal 20 damage from each of your creatures.','Heal all damage from 1 of your creatures. Discard its Energy.','Draw 2 cards.','Remove all Special Conditions from 1 of your creatures.','Draw a card for each of your Benched creatures.','Search your deck for a Stone creature and put it in your hand.','Attach a Basic Energy from your discard pile to 1 of your creatures.','Search your deck for 2 Basic creatures and put them onto your Bench.'],rar:['common','common','common','common','common','common','unc','common','common'],pw:[.4,.46,.38,.78,.36,.64,.66,.6,.72],st:['stall','stall','stall','combo','stall','combo','combo','combo','combo'],art:'su'},
 stadium:{names:['Waygate','Crystal Chapel','Skyforge Altar','Mirrorfall Spring','Overgrown Arch','Sigil Plaza','Banner Watch','Rune Monolith','Hoard Vault'],rules:['Once during each player\'s turn, that player may switch their Active creature with a Benched one.','Creatures in play take 10 less damage from attacks.','Once per turn, each player may attach an Energy from their hand to a creature.','Whenever a creature is healed, heal 10 more.','Each player\'s Basic creatures have no Retreat Cost.','Energy attached to creatures provides 1 additional Energy of its type.','Each player draws an extra card at the start of their turn.','Creatures cannot be Paralyzed or put Asleep.','Each player\'s hand size limit is 10.'],rar:['rare','rare','rare','unc','unc','rare','unc','unc','rare'],pw:[.62,.55,.7,.4,.45,.74,.78,.42,.5],st:['mid','stall','combo','stall','mid','combo','combo','control','mid'],art:'st'} };
const TC_LATER=['Tidecall','Stoneheart','Glowmere','Stormwake','Mistmarsh','Sunmeadow','Crownfall','Verdant Rise','Ashen Crown','Moonlit Vale','Frostveil','Wildwood'];
const TC_PRE=['Dawn','Dusk','Wild','Gleam','Ember','Frost','Thorn','Storm','Moss','Star','Ash','Tide'];
const TC_SETDEFS=[{name:'Hearthwild',code:'HRW',rel:[2025,2,7]},{name:'Skyreach',code:'SKY',rel:[2025,8,8]},{name:'Duskmere',code:'DSK',rel:[2026,2,6]},{name:'Anthology',code:'ANT',rel:[2026,8,7],reprint:1}];
const TC_RAROR={common:0,unc:1,rare:2,ultra:3,secret:4}, TC_RARN={common:'Common',unc:'Uncommon',rare:'Rare',ultra:'Ultra rare',secret:'Secret rare'};
const TC_VARN={N:'Regular',R:'Reverse holo',H:'Holo',U:'Full art',S:'Secret art',P:'Booster pack',B:'Booster box'};
function tcSetDef(n){
  if (n<=4){ const d=TC_SETDEFS[n-1]; return {n, name:d.name, code:d.code, rel:dateToDay(d.rel[0],d.rel[1],d.rel[2]), reprint:!!d.reprint}; }
  const i=n-5; const y=2027+Math.floor(i/2), m=i%2?8:2; const nm=TC_LATER[i%TC_LATER.length]+(i>=TC_LATER.length?' II':'');
  return {n, name:nm, code:nm.replace(/[^A-Z]/gi,'').slice(0,3).toUpperCase(), rel:dateToDay(y,m,5+(i%3)), reprint:false, remix:true};
}
const TC_STYLES=['aggro','mid','control','combo','stall'], TC_STYN={aggro:'Aggro',mid:'Midrange',control:'Control',combo:'Combo',stall:'Stall'};
function tcWeak(el){ const i=TC_EL.indexOf(el); return TC_EL[(i+8)%9]; }
const TC_CACHE=new Map(), TCD=new Map();
// ---------- the catalog ----------
function tcEffTags(t){ const s=t||''; return { ctl:/Asleep|Paralyzed|Switch|retreat|Burned|Poisoned|can't|cannot|Discard 1 card/i.test(s), stl:/Heal|less damage|Prevent|no Retreat/i.test(s), cmb:/Draw|Search|Attach|Look at/i.test(s) }; }
function tcPw(c, r){ // play power: how good a card is in a deck, never shown directly
  if (c.kind!=='creature') return c.pw0+(r()-0.5)*0.14;
  let dpe=0, eff=0; for (const a of c.atk){ dpe=Math.max(dpe,(a.d||0)/Math.max(1,a.cost)); const t=tcEffTags(a.t); if (t.ctl||t.stl||t.cmb) eff=0.08; }
  return Math.max(0.05, Math.min(0.98, 0.16+0.42*Math.min(1,dpe/30)+0.24*Math.min(1,c.hp/230)+eff+({common:0,unc:0.03,rare:0.07,ultra:0.13,secret:0.07}[c.rar])+(r()-0.5)*0.22));
}
function tcStyle(c){ if (c.kind!=='creature') return TC_TRN[c.kind].st[c.ti]; let ctl=0,stl=0,cmb=0,dpe=0; for (const a of c.atk){ dpe=Math.max(dpe,(a.d||0)/Math.max(1,a.cost)); const t=tcEffTags(a.t); ctl+=t.ctl?1:0; stl+=t.stl?1:0; cmb+=t.cmb?1:0; } if (ctl) return 'control'; if (cmb) return 'combo'; if (stl) return 'stall'; return dpe>=26?'aggro':'mid'; }
function tcMakeAttacks(el, rar, r){
  const A=TC_ATK[el]; const i0=Math.floor(r()*3), i1=(i0+1+Math.floor(r()*2))%3; const m={common:1,unc:1.15,rare:1.4,ultra:1.9,secret:1.4}[rar];
  const mk=(a,cost)=>({n:a[0], cost, d:a[1]? Math.round(a[1]*m*(0.7+0.3*cost)/10)*10 : '', t:a[2]});
  if (rar==='common') return [mk(A[i0], 1+Math.floor(r()*2))];
  if (rar==='unc') return [mk(A[i0],1), mk(A[i1],2)];
  return [mk(A[i0],rar==='ultra'?2:2), mk(A[i1],rar==='ultra'?3:3)];
}
function tcBuildSet(n, def){
  const r=mkRng(hsh('tcs'+G.seed+':'+n)); const b=(n-1)%3, remix=n>3; const pre=remix? TC_PRE[(n-5)%TC_PRE.length]+' ' : '';
  const arts=[]; for (let row=0; row<9; row++) for (let k=0;k<3;k++) arts.push({i:row*9+b*3+k, el:TC_ROW[row]});
  for (let i=arts.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arts[i],arts[j]]=[arts[j],arts[i]]; }
  const rars=arts.map((_,i)=> i<7?'rare': i<15?'unc':'common'); const cards=[];
  arts.forEach((a,i)=>{ const rar=rars[i]; const stage= rar==='common'?'Basic': rar==='unc'? (r()<0.7?'Stage 1':'Basic') : (r()<0.6?'Stage 2':'Stage 1');
    const hp= rar==='common'? 50+10*Math.floor(r()*4) : rar==='unc'? 70+10*Math.floor(r()*5) : 110+10*Math.floor(r()*7);
    const c={set:n, kind:'creature', rar, name:pre+TC_NAMES[a.i], el:a.el, stage, hp, art:{s:'c',i:a.i}, ret:1+Math.floor(r()*3), ap:+(0.75+r()*0.8).toFixed(2), hue:remix?((n-4)*37)%360:0};
    c.atk=tcMakeAttacks(a.el, rar, r); c.weak=tcWeak(a.el); cards.push(c); });
  const ord=(c)=>TC_RAROR[c.rar]*100+TC_ROW.indexOf(c.el)*10;
  cards.sort((x,y)=>ord(x)-ord(y)||x.art.i-y.art.i);
  for (let j=0;j<3;j++){ const f=TC_FULL[b*3+j]; const c={set:n, kind:'creature', rar:'ultra', name:pre+f[0], el:f[1], stage:'Basic', hp:190+10*Math.floor(r()*5), art:{s:'f',i:b*3+j}, ret:2+Math.floor(r()*2), ap:+(1.2+r()*0.7).toFixed(2), hue:remix?((n-4)*37)%360:0}; c.atk=tcMakeAttacks(f[1],'ultra',r); c.weak=tcWeak(f[1]); cards.push(c); }
  for (const kind of ['item','supply','stadium']) for (let j=0;j<3;j++){ const T=TC_TRN[kind], ti=b*3+j; cards.push({set:n, kind, ti, rar:T.rar[ti], name:pre+T.names[ti], rules:T.rules[ti], art:{s:T.art,i:ti}, pw0:T.pw[ti], ap:+(0.8+r()*0.5).toFixed(2), hue:remix?((n-4)*37)%360:0}); }
  cards.forEach((c,i)=>{ c.no=i+1; c.cid=n*100+c.no; });
  const rares=cards.filter(c=>c.kind==='creature'&&c.rar==='rare'); const main=cards.length;
  for (let i=0;i<6 && i<rares.length;i++){ const s=Object.assign({},rares[i]); s.rar='secret'; s.no=main+i+1; s.same=rares[i].cid; s.cid=rares[i].cid; s.art=Object.assign({},s.art,{full:1}); s.hp=rares[i].hp; cards.push(s); }
  tcFinish(cards, r); return cards;
}
function tcFinish(cards, r){ for (const c of cards){ if (c.pw!=null) continue; const src=cards.find(x=>x.cid===c.cid&&x.pw!=null); c.pw=src? src.pw : +tcPw(c, r).toFixed(3); c.st=tcStyle(c); } }
function tcReprints(n){
  const r=mkRng(hsh('tcr'+G.seed+':'+n)); const pool=[]; for (let s=1;s<n;s++){ if (tcSetDef(s).reprint) continue; for (const c of tcSetCards(s)) if (c.rar!=='secret') pool.push(c); }
  const score=c=>c.pw+(r()-0.5)*0.3, top=(f,k)=>pool.filter(f).sort((a,b)=>score(b)-score(a)).slice(0,k);
  const creatures=top(c=>c.kind==='creature'&&c.rar==='common',9).concat(top(c=>c.kind==='creature'&&c.rar==='unc',6), top(c=>c.kind==='creature'&&c.rar==='rare',5));
  const trainers=top(c=>c.kind!=='creature'&&c.rar==='common',2).concat(top(c=>c.kind!=='creature'&&c.rar==='unc',3), top(c=>c.kind!=='creature'&&c.rar==='rare',2)); const ultras=top(c=>c.rar==='ultra',2);
  const cards=creatures.concat(ultras,trainers).map(c=>Object.assign({},c,{set:n, rp:c.set+':'+c.no})); cards.sort((x,y)=>TC_RAROR[x.rar]-TC_RAROR[y.rar]||x.cid-y.cid);
  cards.forEach((c,i)=>{ c.no=i+1; }); return cards;
}
function tcSetCards(n){ const k=G.seed+':'+n; let c=TC_CACHE.get(k); if (c) return c; const def=tcSetDef(n); c= def.reprint? tcReprints(n) : tcBuildSet(n,def); TC_CACHE.set(k,c); return c; }
function tcVariants(c){ return c.rar==='common'||c.rar==='unc'? ['N','R'] : c.rar==='rare'? ['N','H'] : c.rar==='ultra'? ['U'] : ['S']; }
// ---------- keys and designs ----------
const tcKey=(set,no,v)=>'T|'+set+'|'+no+'|'+v;
function tcD(key){
  let d=TCD.get(key); if (d) return d;
  const [,s,no,v]=key.split('|'); const set=+s, num=+no; const def=tcSetDef(set);
  if (num===0){ d={key,set,no:0,v,sealed:true,def,card:null,title:def.name+' '+(v==='P'?'booster pack':'booster box'),rar:'sealed',cid:0}; }
  else { const card=tcSetCards(set)[num-1]; if (!card || card.no!==num) throw new Error('no such card '+key); d={key,set,no:num,v,sealed:false,def,card,title:card.name,rar:card.rar,cid:card.cid,kind:card.kind,el:card.el||null}; }
  TCD.set(key,d); return d;
}
function tcAllKeys(set){ const out=[]; for (const c of tcSetCards(set)) for (const v of tcVariants(c)) out.push(tcKey(set,c.no,v)); return out; }
function tcPrintsOf(cid){ const out=[]; const sets=tcReleasedSets(G.day+400); for (const s of sets){ for (const c of tcSetCards(s)) if (c.cid===cid && c.rar!=='secret') out.push(c); } return out; }
function tcReleasedSets(t){ const out=[]; for (let n=1;n<60;n++){ if (tcSetDef(n).rel<=t) out.push(n); else break; } return out; }
function tcNextSet(t){ for (let n=1;n<60;n++) if (tcSetDef(n).rel>t) return n; return null; }
function tcArtOf(card){ const a=card.art; const m={c:'c',f:'f',it:'it',su:'su',st:'st'}[a.s]; return TCG_ART[m][a.i]; }
function tcCardLabel(key){ const d=tcD(key); if (d.sealed) return d.title; return d.card.name+' ('+d.def.code+' '+String(d.no).padStart(3,'0')+(d.v!=='N'?', '+TC_VARN[d.v].toLowerCase():'')+')'; }
