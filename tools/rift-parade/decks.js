// Rift Parade representative decks. Each deck is a list of [card number, copies]; `fill` tops it up to 40 cards
// (one copy at a time, in order, respecting the copy limit). These are illustrative archetypes built from the set's
// synergy packages, not factions: any legal 40 cards may be played together.
'use strict';
const {NUM}=require('./cards.js');
const DECKS=[
 {id:'kinetic',name:'Kinetic Rush',style:'Aggro / Techniques',lead:'Kai',
  core:[['001',3],['003',2],['012',2],['050',3],['085',3],['066',2],['115',1],['006',2],['008',2],['013',3],['105',2],['067',1],['075',2],['004',2],['079',2]],
  fill:['025','098','088','011','020','029','016','068']},
 {id:'impact',name:'Impact Wall',style:'Defensive control',lead:'Brax',
  core:[['028',3],['059',3],['093',2],['125',1],['030',3],['031',2],['101',2],['002',2],['008',2],['036',2],['062',2],['037',2],['038',1],['103',1]],
  fill:['015','052','073','074','082','121','067','105']},
 {id:'chorus',name:'Resonance Chorus',style:'Character synergy / go wide',lead:'Lulu',
  core:[['032',3],['060',3],['094',3],['104',2],['120',1],['047',3],['073',2],['107',2],['083',2],['036',2],['103',2],['002',2],['038',1]],
  fill:['033','015','034','024','062','074','006','008','056']},
 {id:'severmark',name:'Sever and Mark',style:'Tactical control',lead:'Ayame, Toma',
  core:[['015',3],['052',3],['088',2],['101',1],['118',1],['029',3],['058',3],['092',2],['119',1],['072',3],['106',2],['069',2],['017',2],['019',2],['034',2],['002',2]],
  fill:['016','053','129','045','023','027','008','030']},
 {id:'workshop',name:'Workshop',style:'Relic combinations',lead:'Mika, Reiya',
  core:[['011',3],['051',3],['087',2],['102',2],['117',2],['130',1],['005',2],['021',2],['042',2],['041',3],['055',2],['124',1],['068',3],['079',2],['014',2],['112',1],['081',1],['044',1]],
  fill:['009','046','077','078','111','100','070','013','089']},
 {id:'rift',name:'Rift Walkers',style:'Dimensional manipulation / tempo',lead:'Nova',
  core:[['007',3],['049',3],['065',2],['086',2],['099',2],['116',1],['003',3],['016',3],['010',2],['009',2],['046',2],['076',3],['110',2],['048',2],['053',2],['128',1],['033',2]],
  fill:['061','085','034','082','108','022','018','004']},
 {id:'rollers',name:'High Rollers',style:'Risk / reward disruption',lead:'Crow, Vendor',
  core:[['063',3],['064',3],['097',2],['098',1],['123',1],['039',3],['040',2],['075',3],['109',2],['054',3],['090',2],['126',1],['077',2],['043',2],['023',2],['020',2]],
  fill:['055','089','084','061','095','002','058','070']},
 {id:'spotlight',name:'Haunted Broadcast',style:'Midrange / positioning control',lead:'Vivi, Momo',
  core:[['024',3],['056',3],['057',3],['091',2],['127',1],['026',2],['078',2],['071',3],['025',2],['027',2],['082',1],['033',3],['061',2],['095',2],['122',1],['018',2]],
  fill:['034','020','002','088','036','074','062','052']},
];
function build(d){ const out=[]; const n={}; const add=num=>{ const c=NUM[num]; if(!c) throw new Error('deck '+d.id+': no card '+num); if((n[c.id]||0)>=c.max) return false; n[c.id]=(n[c.id]||0)+1; out.push(c.id); return true; };
  for(const [num,k] of d.core) for(let i=0;i<k;i++) add(num);
  let guard=0; while(out.length<40&&guard++<200) for(const f of d.fill){ if(out.length>=40) break; add(f); }
  if(out.length>40) out.length=40; return out; }
const BUILT=DECKS.map(d=>Object.assign({},d,{list:build(d)}));
module.exports={DECKS:BUILT,build};
