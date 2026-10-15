// Tidemark prototype card pool: 60 cards for simulation only (design/tcg2/prototype-rules.md).
// PROTOTYPE, not canon: names, numbers and effects exist to test the rules and will change.
// al: L Land, S Sea, D Dual, N Neutral. req: Allegiance needed (Land/Sea permanents you control; Dual counts either).
// Units: pow/tgh. Vessels: pow/tgh (Hull) and carry. Strongholds: fort (durability). Domains: front S (Shore) or D (Deep).
// kw keywords and fx effects are interpreted by engine.js; card text is generated from them (text.js) so text and play agree.
const F={CR:'Crownlands',TW:'Thornwild',IR:'Iron Reach',TB:'Tideborn',FF:'Free Fleets',AC:'Abyssal Choir',HL:'Harbor Leagues',NE:'Neutral'};
const C=[
 // ---- Crownlands (Land): soldiers, Strongholds, steady armies
 {n:'Shieldwall Recruit',t:'unit',f:'CR',al:'L',req:0,cost:1,r:'C',pow:1,tgh:2,kw:['rampart']},
 {n:'Coastal Swordsman',t:'unit',f:'CR',al:'L',req:0,cost:2,r:'C',pow:2,tgh:3},
 {n:'Crown Sergeant',t:'unit',f:'CR',al:'L',req:1,cost:3,r:'U',pow:2,tgh:3,kw:['leader']},
 {n:'Royal Lancer',t:'unit',f:'CR',al:'L',req:2,cost:4,r:'U',pow:4,tgh:3,kw:['charge']},
 {n:'Keep Warden',t:'unit',f:'CR',al:'L',req:2,cost:5,r:'U',pow:3,tgh:6,kw:['rampart'],fx:[['fortify',3]]},
 {n:'Old King\'s Bastion',t:'stronghold',f:'CR',al:'L',req:1,cost:4,r:'R',fort:8,fx:[['shore_toughness',1]]},
 {n:'Rally the Levy',t:'spell',f:'CR',al:'L',req:1,cost:3,r:'C',fx:[['tokens',2,'Levy',1,1]]},
 {n:'Queen Isolde Varr',t:'unit',f:'CR',al:'L',req:3,cost:7,r:'L',pow:6,tgh:7,kw:['leader','rampart']},
 // ---- Thornwild (Land): forest peoples and beasts, ambush, growth
 {n:'Thicket Fox',t:'unit',f:'TW',al:'L',req:0,cost:1,r:'C',pow:2,tgh:1},
 {n:'Bramble Stalker',t:'unit',f:'TW',al:'L',req:0,cost:2,r:'C',pow:2,tgh:2,kw:['ambush']},
 {n:'Mossback Boar',t:'unit',f:'TW',al:'L',req:1,cost:3,r:'C',pow:3,tgh:3,kw:['charge']},
 {n:'Grove Tender',t:'unit',f:'TW',al:'L',req:1,cost:3,r:'U',pow:2,tgh:2,fx:[['ramp',1]]},
 {n:'Rootcall',t:'spell',f:'TW',al:'L',req:1,cost:2,r:'C',kw:['swift'],fx:[['pump',2,2]]},
 {n:'Elder Antler',t:'unit',f:'TW',al:'L',req:2,cost:6,r:'R',pow:6,tgh:6,kw:['ambush']},
 {n:'The Narrows',t:'domain',f:'TW',al:'L',req:1,cost:2,r:'U',front:'S',fx:[['max_attackers',2]]},
 {n:'Old Hollowhorn',t:'unit',f:'TW',al:'L',req:3,cost:8,r:'L',pow:8,tgh:8,kw:['ambush','trample']},
 // ---- Iron Reach (Land): miners, masons, constructs, Relics
 {n:'Mine Sapper',t:'unit',f:'IR',al:'L',req:0,cost:2,r:'C',pow:1,tgh:3,fx:[['ping',1]]},
 {n:'Runesmith',t:'unit',f:'IR',al:'L',req:1,cost:3,r:'C',pow:2,tgh:3,fx:[['draw',1]]},
 {n:'Forge Construct',t:'unit',f:'IR',al:'L',req:1,cost:4,r:'U',pow:3,tgh:5,kw:['tough']},
 {n:'Ironbound Plate',t:'relic',f:'IR',al:'L',req:0,cost:2,r:'C',fx:[['equip',1,2,'rampart']]},
 {n:'Tidebreaker Ballista',t:'relic',f:'IR',al:'L',req:1,cost:3,r:'U',fx:[['rise_ping','D',1]]},
 {n:'Siege Mortar',t:'spell',f:'IR',al:'L',req:2,cost:4,r:'C',fx:[['damage',4]]},
 {n:'Deepmine Hold',t:'stronghold',f:'IR',al:'L',req:2,cost:5,r:'R',fort:10,fx:[['rise_heal',1]]},
 {n:'Granite Colossus',t:'unit',f:'IR',al:'L',req:3,cost:8,r:'R',pow:8,tgh:9,kw:['tough']},
 // ---- Tideborn (Sea): underwater civilisations, tempo, repositioning
 {n:'Reef Scout',t:'unit',f:'TB',al:'S',req:0,cost:1,r:'C',pow:1,tgh:2,kw:['surge']},
 {n:'Current Dancer',t:'unit',f:'TB',al:'S',req:0,cost:2,r:'C',pow:2,tgh:2,kw:['surge']},
 {n:'Tidecaller',t:'unit',f:'TB',al:'S',req:1,cost:3,r:'U',pow:2,tgh:3,fx:[['bounce',3]]},
 {n:'Undertow Mage',t:'unit',f:'TB',al:'S',req:2,cost:4,r:'U',pow:3,tgh:3,kw:['undertow']},
 {n:'Pearl Oracle',t:'unit',f:'TB',al:'S',req:2,cost:5,r:'R',pow:3,tgh:5,fx:[['draw',2]]},
 {n:'Tidal Shift',t:'spell',f:'TB',al:'S',req:0,cost:1,r:'C',kw:['swift'],fx:[['shift']]},
 {n:'Riptide',t:'spell',f:'TB',al:'S',req:1,cost:2,r:'C',kw:['swift'],fx:[['bounce',99]]},
 {n:'Coral Spire',t:'domain',f:'TB',al:'S',req:1,cost:3,r:'U',front:'D',fx:[['strand_all']]},
 // ---- Free Fleets (Sea): sailors, traders, privateers; Vessels and raids
 {n:'Deckhand Brawler',t:'unit',f:'FF',al:'S',req:0,cost:1,r:'C',pow:2,tgh:1,kw:['charge']},
 {n:'Swift Cutter',t:'vessel',f:'FF',al:'S',req:0,cost:2,r:'C',pow:2,tgh:2,carry:1,kw:['charge']},
 {n:'Privateer Captain',t:'unit',f:'FF',al:'S',req:1,cost:3,r:'U',pow:3,tgh:2,kw:['charge','leader']},
 {n:'Brigantine',t:'vessel',f:'FF',al:'S',req:1,cost:4,r:'U',pow:3,tgh:4,carry:2},
 {n:'Boarding Party',t:'spell',f:'FF',al:'S',req:1,cost:3,r:'C',fx:[['rally',1]]},
 {n:'Fair Winds',t:'enchantment',f:'FF',al:'S',req:1,cost:2,r:'U',fx:[['grant_surge']]},
 {n:'War Galleon',t:'vessel',f:'FF',al:'S',req:2,cost:6,r:'R',pow:5,tgh:6,carry:3,fx:[['broadside',2]]},
 {n:'Admiral Kestra Vane',t:'unit',f:'FF',al:'S',req:3,cost:6,r:'L',pow:5,tgh:5,kw:['charge','leader']},
 // ---- Abyssal Choir (Sea): deep-sea leviathans and drowned cults; big late threats
 {n:'Drowned Acolyte',t:'unit',f:'AC',al:'S',req:0,cost:2,r:'C',pow:1,tgh:3,fx:[['ramp',1]]},
 {n:'Kraken Spawn',t:'unit',f:'AC',al:'S',req:2,cost:5,r:'U',pow:5,tgh:5},
 {n:'Hymn of the Drowned',t:'enchantment',f:'AC',al:'S',req:2,cost:4,r:'R',fx:[['rise_sweep','D',1]]},
 {n:'The Choir Beneath',t:'domain',f:'AC',al:'S',req:2,cost:3,r:'U',front:'D',fx:[['front_buff',1,1]]},
 {n:'Abyss Calls',t:'spell',f:'AC',al:'S',req:2,cost:5,r:'U',fx:[['destroy',99]]},
 {n:'Trench Horror',t:'unit',f:'AC',al:'S',req:3,cost:7,r:'R',pow:7,tgh:6,fx:[['destroy',4]]},
 {n:'Ancient Leviathan',t:'unit',f:'AC',al:'S',req:3,cost:8,r:'L',pow:9,tgh:9,kw:['surge']},
 {n:'Brine Seer',t:'unit',f:'AC',al:'S',req:1,cost:3,r:'C',pow:2,tgh:3,fx:[['scry_draw',1]]},
 // ---- Harbor Leagues (Dual): merchant ports and lighthouse keepers, the hybrid glue
 {n:'Lighthouse Keeper',t:'unit',f:'HL',al:'D',req:0,cost:2,r:'C',pow:1,tgh:3,fx:[['draw_if_both',1]]},
 {n:'Dockmaster',t:'unit',f:'HL',al:'D',req:1,cost:3,r:'U',pow:2,tgh:3,carry:2},
 {n:'Harbor Sentinel',t:'unit',f:'HL',al:'D',req:1,cost:4,r:'C',pow:3,tgh:4,kw:['rampart']},
 {n:'Tidewall Harbor',t:'stronghold',f:'HL',al:'D',req:1,cost:4,r:'U',fort:7,fx:[['all_toughness',1]]},
 {n:'Twin Tides',t:'spell',f:'HL',al:'D',req:2,cost:4,r:'U',fx:[['damage_each_front',3]]},
 {n:'Merchant Prince Aurel',t:'unit',f:'HL',al:'D',req:2,cost:5,r:'L',pow:4,tgh:4,fx:[['draw',2],['heal',3]]},
 // ---- Neutral
 {n:'Wandering Merchant',t:'unit',f:'NE',al:'N',req:0,cost:2,r:'C',pow:2,tgh:2,fx:[['draw',1]]},
 {n:'Sellsword',t:'unit',f:'NE',al:'N',req:0,cost:3,r:'C',pow:3,tgh:3},
 {n:'Navigator\'s Compass',t:'relic',f:'NE',al:'N',req:0,cost:2,r:'U',fx:[['ramp',1]]},
 {n:'Storm Front',t:'spell',f:'NE',al:'N',req:0,cost:6,r:'R',fx:[['sweep_front',3]]},
 {n:'Ward of the Old Lights',t:'enchantment',f:'NE',al:'N',req:0,cost:3,r:'U',fx:[['harbor_ward',1]]},
 {n:'Ruins of Saltgate',t:'domain',f:'NE',al:'N',req:0,cost:2,r:'C',front:'S',fx:[['raid_bonus',1]]},
];
C.forEach((c,i)=>{ c.id=i+1; c.kw=c.kw||[]; c.fx=c.fx||[]; c.fac=F[c.f]; });
// ---- Pool 0.3 (round 3): the same 60 slots under rules 0.3 (design/tcg2/round3-report.md).
// Built from the pool above so every change is listed here with its reason. Automatic changes for rules 0.3:
// 'carry' becomes the Ferry keyword (ferry N: up to N of your attackers count as at home wherever they fight),
// and Ambush becomes Swift on a unit (it can be played during the opponent's battle, as a blocker).
// Each patch: [card name, changes, reason]. "Plain unit" means the first round 3 card value check
// (round3-cardvalue-pool02-first.md: rules 0.3, pool 0.2, AI v2): the card swapped for a unit of the same cost with Power
// and Toughness equal to its cost, and the deck's win rate change in points. Positive = the card was worth less than that
// plain unit. That first check gave the plain unit no Allegiance requirement, which flattered it; the corrected check is
// round3-cardvalue-pool02.md, and round3-report.md says which changes it still supports.
const P3=[
 // the deck carried by one card: Abyssal Depths 63% with Drowned Acolyte carrying 10 points; Land's ramp card costs 3
 ['Drowned Acolyte', {cost:3}, 'Carried Abyssal Depths, the top deck (swap costs 10.0): costs 3 like the Land ramp unit'],
 ['Grove Tender', {tgh:3}, 'Plain unit better by 3.6: 2/3'],
 // support cards worth clearly less than a plain unit. Tideborn cards (shared by Tempo and Depths, the two strongest decks)
 // stay as they were even where they rate below a plain unit; Tempo's bounce spells may also be worth more to people than to the AI
 ['Boarding Party', {cost:2}, 'Plain unit better by 9.7 (Fleet), 7.1 (Harbor), 5.9 (Tempo): costs 2'],
 ['Fair Winds', {cost:1}, 'Plain unit better by 7.0 (Fleet) / 5.8 (Tempo): costs 1'],
 ['Rootcall', {cost:1}, 'Plain unit better by 7.5: costs 1'],
 ['Twin Tides', {cost:3}, 'Plain unit better by 4.1 / 3.2: costs 3'],
 ['Siege Mortar', {cost:3}, 'Plain unit better by 6.6: costs 3'],
 ['Tidebreaker Ballista', {cost:2}, 'Plain unit better by 6.1: costs 2'],
 ['Rally the Levy', {fx:[['tokens',2,'Levy',1,2]]}, 'Plain unit better by 5.8 / 4.0: tokens are 1/2'],
 ['Keep Warden', {pow:4}, 'Plain unit better by 4.9 / 4.5 / 3.9: 4/6'],
 ['Runesmith', {tgh:4}, 'Plain unit better by 4.9: 2/4'],
 // tuning pass 2: the two Land decks were lowest (Bastion 42%, Thornwild 43% under AI v2), so cards only they use
 ['Thicket Fox', {tgh:2}, 'Tuning: Thornwild Rush was lowest; its 1-drop is 2/2'],
 ['Forge Construct', {pow:4}, 'Tuning: Crown Bastion was lowest; 4/5 Tough'],
 ['Privateer Captain', {kw:['leader']}, 'Tuning: Tideborn Tempo stayed highest (61%), carried by its Charge units (Captain swap costs 5.1); Charge removed, Leader kept'],
 // Strongholds: plain unit better by 5.6 to 7.4 in every deck that runs them
 ["Old King's Bastion", {cost:3}, 'Plain unit better by 5.8 / 5.7 / 3.7: costs 3'],
 ['Deepmine Hold', {cost:4}, 'Plain unit better by 5.7: costs 4'],
 ['Tidewall Harbor', {cost:3}, 'Plain unit better by 7.4 / 5.6: costs 3'],
 // Vessels and Ferry
 ['Brigantine', {cost:3, ferry:1}, 'Plain unit better by 6.8 / 6.4: costs 3; Ferry 1 (was carry 2: Ferry works for every attacker, carry only for Land units in the Deep)'],
 ['Dockmaster', {pow:3}, 'Plain unit better by 6.9 / 5.9: 3/3, keeps Ferry 2'],
 ['War Galleon', {cost:5, ferry:2}, 'Plain unit better by 4.2: costs 5; Ferry 2 (was carry 3)'],
 ['Harbor Sentinel', {ferry:1}, 'Plain unit better by 5.2; the Harbor Leagues keep a crossing role now that escort is gone: Ferry 1'],
 // Domains that give each front a home advantage (the fronts needed teeth)
 ['The Narrows', {fx:[['home_guard',2]]}, 'Plain unit better by 7.9. Now: units blocking at home on the Shore get +0/+2'],
 ['Coral Spire', {cost:2, fx:[['home_guard',2]]}, 'Plain unit better by 10.1 / 6.8; its strand effect only mattered for carry. Now costs 2: units blocking at home in the Deep get +0/+2 (the Deep counterpart of The Narrows)'],
];
const C3=C.map(c=>{ const x=Object.assign({}, c, {kw:c.kw.slice(), fx:c.fx.map(o=>o.slice())});
  if (x.carry){ x.ferry=x.carry; delete x.carry; }
  if ((x.t==='unit'||x.t==='vessel') && x.kw.includes('ambush')) x.kw=x.kw.map(k=>k==='ambush'?'swift':k);
  return x; });
const CHANGES3=[]; for (const [n,ch,why] of P3){ const x=C3.find(c=>c.n===n); if (!x) throw new Error('pool 0.3: no card '+n);
  const before={}; for (const k of Object.keys(ch)) before[k]=JSON.stringify(x[k]); Object.assign(x, JSON.parse(JSON.stringify(ch))); CHANGES3.push({n, before, after:ch, why}); }
if (typeof module!=='undefined') module.exports={CARDS:C, CARDS3:C3, CHANGES3, FACTIONS:F};
