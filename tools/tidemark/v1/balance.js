// Tidemark balance patches: changes to the designs found by simulation, each with its reason. Applied by cards.js after the
// design files, so the designs stay as designed and every change is on record (cards.json lists them as balance_changes).
// "Value" is cardvalue.js: the deck's win rate with the card minus with a plain unit of the same cost, in points
// (24 games against each of the nine other decks; about ±3.5 points of noise).
module.exports=[
 // round 1 (2026-10-19): the clearest outliers of the first full measurement
 ['Black Tide Leviathan', {x:[['play','sweep',3,'enemy unit']]}, 'Value +9.3, the strongest card: its arrival sweep deals 3, not 4'],
 ['Trench Horror', {p:6}, 'Value +8.8 in the Tenth Tide field (prototype card): 6/6'],
 ['Nerith Undying', {p:4}, 'Value +7.4: 4/5'],
 ['Roothorn Stag', {p:4}, 'Value +4.6 in Thornwild Rush, the strongest deck (73% to 81%): 4/4'],
 ["Brannoch's Last Blade", {c:4}, 'Value +6.0: costs 4'],
 ['Forgehold', {c:3}, 'Value -9.7: Strongholds rate below a plain unit (as in the prototype): costs 3'],
 ['Bastion of the Pass', {c:4}, 'Value -9.3: costs 4'],
 ['Lantern Signal', {x:[['play','pump',2,2,'own unit'],['play','draw',1]]}, 'Value -9.3: +2/+2'],
 ['Thorn Caltrops', {c:1}, 'Value -6.9: costs 1'],
 ['Pearl Ward', {x:[['static','aura',1,2,'tough']]}, 'Value -5.6: +1/+2 and Tough'],
 ['Stone Carver', {t:3}, 'Value -4.2: 2/3'],
 ['League Galleass', {p:5}, 'Value -2.8 and the Harbor Leagues decks lowest (29%): 5/6'],
 // Harbor Leagues: its Tenth Tide units sit a point or more under the curve and its decks were lowest (29%)
 ['Quay Porter', {p:2}, 'Harbor Leagues under curve (1/2 for 1, curve 3): 2/2'],
 ['Ferry Boatwoman', {t:2}, 'Harbor Leagues under curve: 1/2 Ferry 1'],
 ['Gull Flock', {p:2}, 'Harbor Leagues under curve: 2/1 Swift'],
 ['Harbor Guard Recruit', {t:2}, 'Harbor Leagues under curve: 1/2 Rampart'],
 ['Customs Inspector', {t:3}, 'Harbor Leagues under curve: 2/3'],
 ['League Marine', {t:3}, 'Harbor Leagues under curve: 3/3 Ferry 1'],
 ['Tide Clerk', {t:4}, 'Harbor Leagues under curve: 3/4'],
 ['Harbor Mistress Calla Wren', {p:4}, 'Legendary under curve: 4/4'],
 ['Master of Tides and Tolls', {t:5}, 'Harbor Leagues under curve: 4/5'],
 ['League Envoy', {t:4}, 'Value -3.7 earlier: 2/4'],
 // round 2: Iron Reach-led decks lowest (22%, 36%); its Tenth Tide commons sit under the curve. Thornwild Rush highest (68%)
 ['Furnace Stoker', {p:2, t:2}, 'Iron Reach under curve (1/2 for 3 with 2 Influence once): 2/2'],
 ['Iron Golem Sentry', {t:5}, 'Iron Reach under curve: 3/5 Rampart'],
 ['Cannon Crew', {p:3}, 'Iron Reach under curve: 3/3'],
 ['Pit Pony', {p:2}, 'Iron Reach under curve: 2/2'],
 ['Iron Crown of Varr', {x:[['static','equip',1,1,'leader']]}, 'Value +3.2 in Thornwild Rush (66% to 68%), whose Leaders stack: the Crown no longer also gives every Leader +1/+1'],
];
