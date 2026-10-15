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
if (typeof module!=='undefined') module.exports={CARDS:C, FACTIONS:F};
