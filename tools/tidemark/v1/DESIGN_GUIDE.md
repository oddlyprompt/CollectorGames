# Tidemark Version 1: card design guide

How every Tidemark card gets its numbers and abilities. The names, types, factions, rarities and roles come from the checklist (`tidemark-production/manifest.json`, `gameplay_identity`). This folder adds the play: one `design_<faction>.js` per faction, read by `cards.js`, which validates every card and generates its text from the ops (`ops.js`). Status of all numbers: **designed** (2026-10-19), balanced by simulation, not canon until the owner approves and people have played.

Check a file: `node tools/tidemark/v1/cards.js --partial --text CR` (CR TW IR TB FF AC HL NE). It prints every card's generated text and every error; `--partial` allows other factions to be missing.

## Rules 1.0 in one paragraph

Two fronts: the **Shore** (Land is at home) and the **Deep** (Sea and Vessels are at home; Dual and Neutral are at home on both). Each player has a Harbor of 20; reduce the opponent's to 0. Influence capacity grows by 1 each turn to 10 and refills. Allegiance: a card with requirement *q* needs *q* of your permanents of its side in play (Dual cards count for both sides, and a Dual card needs *q* of either side). Units enter ready: they can block on the opponent's next turn but cannot attack the turn they arrive unless they have Charge. Any ready unit attacks either front; the defender blocks with any ready unit from either front (Vessels only block in the Deep), one blocker per attacker, damage at the same time. A unit that attacked away from home is **Stranded**: it stays exhausted through your next Rise. Unblocked damage hits the defender's Strongholds first on the Shore and their Vessels first in the Deep, then the Harbor. **Damage on units heals at the end of every turn.** After turn 12 each player's Harbor loses 1 at their Rise (the rising tide). Decks are 50 cards, up to 3 copies of a card, 1 of each Legendary.

Keywords (the only ones): Charge, Surge (at home when it attacks the Shore), Rampart (+0/+2 blocking at home), Leader (other units on its front get +1 power), Swift (a Swift spell can be played during any battle; a Swift unit can be played during the opponent's battle as a blocker), Undertow (a unit that fights it and survives returns to its owner's hand), Tough (takes 1 less damage), Trample (excess combat damage carries through), Ferry N (`y: N`; when you attack, up to N of your attackers count as at home wherever they fight).

## A design

```js
'Royal Lancer': {c:4, q:2, p:4, t:3, k:'charge'},
'Keep Warden': {c:5, q:2, p:4, t:6, k:'rampart', x:[['play','fortify',3]]},
'Siege Mortar': {c:3, q:2, x:[['play','dmg',4,'unit']]},
```

`c` cost, `q` Allegiance requirement, `p`/`t` Power/Toughness (Units and Vessels), `f` durability (Strongholds), `y` Ferry, `k` keywords, `x` abilities `[when, op, ...args]`, `n` an optional one-line designer note (why the card is the way it is, especially when the role needed interpreting). The op list, the triggers and the filter words are at the top of `ops.js` and in its `OPS` table; read it. Only those exist: never invent an op. If a role cannot be expressed, interpret it with the ops that exist and say how in `n`.

## Numbers

**Units, plain stats (no abilities, q at the guide value):** Power + Toughness = 2 × cost + 1 for costs 1 and 2, 2 × cost for 3 to 6, 2 × cost − 1 above (cost 1: 2/1 or 1/2; 2: 2/3 or 3/2; 3: 3/3; 4: 4/4 or 3/5; 5: 5/5; 6: 6/6; 7: 7/6; 8: 8/7). One point more for each Allegiance point above the guide. Rare +1, Legendary +2 over the curve, paid for with a high requirement.

**What abilities cost (in stat points taken off the body):** Charge 1, Rampart 1, Surge 1, Trample 1, Undertow 1, Swift (unit) 1, Tough 2, Leader 2, Ferry 1 per point on a unit (Vessels have Ferry built in: price a Vessel as a unit with its Ferry free up to 2). Enter effects: draw 1 = 2, scry 1 = 0.5, dmg 1 = 1.5, dmg 2 = 3, mend 2 = 0.5, ramp 1 = 2.5, tokens = their stats. Rise triggers about twice an enter trigger. Statics that affect many units: price by how many units they usually touch.

**Allegiance requirement guide:** cost 1 to 2: q 0 (q 1 for strong Uncommons); cost 3 to 4: q 1; cost 5 to 6: q 2; cost 7+: q 3; Legendaries q 3 (q 2 if cost 5 or less). Neutral cards always q 0 and are a little weaker than faction cards (about one stat point). Dual (Harbor Leagues) cards use the same guide.

**Spells (reference points from the prototype, which simulated balanced):** 4 damage to a unit: cost 3 q 2. 3 damage: cost 2. Destroy any unit: cost 5 q 2. Swift return a unit to hand: cost 2 q 1. Swift +2/+2: cost 1. Two 1/2 tokens: cost 3 q 1. 3 damage to every unit on one front: cost 6. 3 damage to one unit on each front: cost 3 q 2. Draw 2: cost 3. Stronghold durability: about 2 × cost + 2, with its bonus taking 1 to 2 off.

**Rarity:** Commons are simple (a body, one keyword or one small ability). Uncommons have one or two abilities. Rares are strong or unusual. Legendaries are the faces of the game: big, splashy, unique, never simply better versions of commons. Keep the Founding prototype's 57 cards at their pool 0.3 numbers (`tools/tidemark/cards.js`, the `P3` changes applied) unless the checklist role changed; they were balanced by three rounds of simulation (`prototype_source` in the manifest names the prototype card).

## Faction play

- **Crownlands (Land):** Strongholds, Rampart, Leader, soldiers, Levy tokens, steady defence. The control faction.
- **Thornwild (Land):** beasts, Swift ambushers, Charge, growth, Trample, Domains of the forest. The aggressive Land faction.
- **Iron Reach (Land):** constructs, Tough, Relics and Equipment, damage that sieges Strongholds, cannons into the Deep.
- **Tideborn (Sea):** tempo: return to hand, Surge, Swift tricks, moving units between fronts.
- **Free Fleets (Sea):** Vessels, Ferry, Charge, raids on the Harbor, Sailors.
- **Abyssal Choir (Sea):** the late game: big leviathans, Enchantments, destruction, drowned cultists, tokens, recursion; its costs are paid with Harbor strength sometimes.
- **Harbor Leagues (Dual):** the glue: Ferry, card draw, Influence, Dual synergies, screens on both fronts.
- **Neutral:** playable in any deck: mercenaries, travellers, plain answers; slightly below faction rate.

## Interpreting roles

- "Heals a unit / heals your units": damage heals every turn anyway, so healing is protection: `mend` (+0/+N until your next turn) on enter, or at Rise for "heals at each Rise".
- "Restores Harbor strength": `harbor N`.
- "Can block Swift units": `tax 1 'swift'` (opponent's Swift cards cost more): Swift is the surprise, and watchfulness makes surprises dearer.
- "Forces an attacker to fight it" (lures): `['block','weaken',N,0,'foe']` or a high-Toughness body with Rampart; say which in `n`.
- "Grows each turn": `['rise','grow',1,1]` (or `1,0`). "Grows with X": `scale`.
- "Returns from the discard pile": `['death','recur']` (to hand), or `reanimate` for bigger effects.
- "Takes control": `control`. "Copies a Vessel": `copy 'own vessel'`.
- "Look at the top card(s)": `scry N`; "look and draw one": `dig N`.
- "Taxes X": `tax N F`. "X cost less": `cost N F`.
- "Counts as Land and Sea": `both_allegiance`.
- "Survives the first lethal hit": `survive`. "Can block twice": `twice`.
- Cards that copy or double other cards' effects (Iron Steward, Oreth, Council of Ports, Tidal Mirror) have no general op: use `echo` for Tidal Mirror, and for the others design an effect with the existing ops that plays the same role (for example "your Enchantments cost 1 less and draw a card when played"); explain in `n`.

## Domains

A Domain sits on its front (Shore or Deep, from the checklist), one per front, shared by both players; a new Domain replaces the old one. Its statics apply to units **on its front, for both players** (filters like `'any vessel'`, `'homeblock'`), and its `cost` applies to both players. Keep Domains symmetric and cheap (cost 1 to 3); their value is in which deck benefits more.
