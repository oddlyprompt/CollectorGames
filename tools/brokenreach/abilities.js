'use strict';
// Every printed ability text of Set 01 mapped by hand to explicit operations (no natural-language execution).
// Texts are PROVISIONAL (handoff v0.1); an unmapped text makes the importer fail.
// Lifetimes: 'cascade' = until the next placement begins; 'match' = while on the board.
// k: place_* run when the unit is placed; cap_* when it is captured; aura_* and stat_* are always on while on the board
// (a unit's controller owns its auras); atk_* are checked at each challenge.
const AB = {
 'On placement, gain +1 Attack for this cascade if adjacent to a friendly unit.': [{k:'place_atk',if:'adjFriend',amt:1}],
 'On placement, gain +1 Attack on diagonal challenges this cascade.': [{k:'place_diag_atk',amt:1}],
 'While controlled, this unit gains +1 Guard on corner spaces.': [{k:'stat_guard_pos',pos:'corner',amt:1}],
 'While controlled, this unit gains +1 Guard on edge spaces.': [{k:'stat_guard_pos',pos:'edge',amt:1}],
 'Adjacent friendly Ship units gain +1 Guard.': [{k:'aura',stat:'guard',f:{type:'Ship'},amt:1}],
 'Your adjacent Ship units gain +1 Guard.': [{k:'aura',stat:'guard',f:{type:'Ship'},amt:1}],
 'Adjacent friendly Crew & Military units gain +1 Guard.': [{k:'aura',stat:'guard',f:{type:'Crew & Military'},amt:1}],
 'Adjacent friendly units gain +1 Guard.': [{k:'aura',stat:'guard',f:{},amt:1}],
 'Your adjacent Veyr Consortium units gain +1 Guard.': [{k:'aura',stat:'guard',f:{aff:'Veyr Consortium'},amt:1}],
 'Adjacent Veyne Exchange units gain +1 Attack while this unit is controlled.': [{k:'aura',stat:'atk',f:{aff:'Veyne Exchange'},amt:1}],
 'On placement, this unit ignores reciprocal-arrow Guard bonuses.': [{k:'place_ignore_recip'}],
 'When captured, this unit gains +1 Attack for its activation.': [{k:'cap_atk',amt:1}],
 'When captured, rotate this unit 90° before it activates.': [{k:'cap_rotate'}],
 'After this unit is captured, rotate it 90° before it activates.': [{k:'cap_rotate'}],
 'Ignore negative Planet modifiers on this unit.': [{k:'ignore_neg_planet'}],
 'On placement, gain +1 Attack if adjacent to an enemy Ship.': [{k:'place_atk',if:'adjEnemyShip',amt:1}],
 'On placement, gain +1 Attack if adjacent to a friendly Pilot.': [{k:'place_atk',if:'adjFriendPilot',amt:1}],
 'Gain +1 Attack when challenging a unit whose printed Guard is higher than yours.': [{k:'atk_vs_higher',amt:1}],
 'On placement, rotate one adjacent friendly unit 90°.': [{k:'place_rotate',who:'friend'}],
 'On placement, rotate one adjacent enemy unit 90° before your attacks.': [{k:'place_rotate',who:'enemy'}],
 'On placement, rotate this unit 90° before resolving its arrows.': [{k:'place_rotate_self'}],
 'On placement, add one missing diagonal arrow for this cascade.': [{k:'place_add_diag'}],
 'On placement, one adjacent enemy loses reciprocal-arrow Guard bonus this turn.': [{k:'place_enemy_norecip'}],
 'On placement, one adjacent enemy loses 1 Guard for this cascade.': [{k:'place_enemy_guard',amt:1}],
 "When captured, its new controller's next attacker has -1 Attack this cascade.": [{k:'cap_next_attacker_penalty',amt:1}],
 // planets (one shared effect for both players)
 'Cards in corner spaces gain +1 Guard.': [{k:'pl_guard_pos',pos:'corner',amt:1}],
 'Cards on the four central spaces gain +1 Guard.': [{k:'pl_guard_pos',pos:'center',amt:1}],
 'Diagonal challenges have -1 Attack, minimum 0.': [{k:'pl_diag_penalty',amt:1}],
 'Cards on edge spaces gain +1 Attack when placed.': [{k:'pl_place_atk_edge',amt:1}],
 'Units with exactly two arrows gain +1 Attack.': [{k:'pl_two_arrow_atk',amt:1}],
 'On the first placement of each player, +1 Guard to that unit.': [{k:'pl_first_placement_guard',amt:1}],
 'Once per match, rotate your newly placed card 90° before challenges.': [{k:'pl_once_rotate',deg:90}],
 'Once per match, rotate a newly placed unit 180° before challenges.': [{k:'pl_once_rotate',deg:180}],
};
if (typeof module!=='undefined') module.exports={AB};
