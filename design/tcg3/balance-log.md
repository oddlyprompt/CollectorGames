# Rift Parade balance log

Each entry: what the simulation showed, what changed, and the effect. Simulations use `tools/rift-parade/sim.js` with the "balanced" search pilot unless noted; N is games per pairing (8 decks, 36 pairings including mirrors).

## Round 0: engine and first drafts (no balance data kept)
* Found and fixed engine bugs before any balance conclusions: player Conditions never counted down (`inPlay` looked at the wrong player's list), reaction Techniques playable with no attacker, duplicate cards offered twice.
* The first search pilot never slipped on turn one (a card in hand outscored one point of energy in its evaluation). Fixed by valuing the first energy points highly (`poolVal` in ai.js). All results below use the fixed pilot.

## Round 1: second-player compensation
* With no compensation the first player won 57.6%; with one free energy card for the second player (a permanent extra energy) the first player won 26-37%. Too coarse a lever.
* Replaced with a one-turn bonus: the second player has 2 extra energy on their first turn and draws 1 extra card. First-player win rate 51.9% over 576 games.

## Round 2: first full tournament (1080 games)
* Resonance Chorus 80%, Impact Wall 66%, High Rollers 31%.
* Resonance: gave +1/+1 per other Resonance Character (a one-drop became 3/4). Changed to +1 Power only. Lulu, All Together Now +2/+2 to +1/+1; Resonance Overflow +2/+2 to +2/+1.
* Absorb cap 6 to 5; Brax Debt Collector 1/4 to 1/3, Brax Impact Loaded 2/5 to 2/4, Walking Avalanche 3/6 to 3/5, Ayame Holding the Line 2/6 to 2/5; Freight Tunnel Seven now +0/+1 (was +1/+1); Load Bearing +0/+3 to +0/+2.
* High Rollers (Crow, Vendor) buffed: Ninth Vendor 2/3 to 3/3, Final Offer 4/4 to 5/4, A Life for a Name 5/5 to 6/5, Vendor's Ledger 2 to 3 Resolve, Crow Hustler 2/3 to 3/3, Wagerbound Phantom +2 to +3, Kai Losing Bet 2 to 3 damage, Loaded Coin 3/3 to 3/4, All Odds Mine 3/4 to 4/4. Deck list pruned of the weakest Conditions.
* Mika, Scrapstorm animates Relics 2/2 to 3/3.

## Round 3: pilot upgrades, missing cards, tuning (2,160 games per run)
* The pilot could not see why Imbue, Rush or removal were good (the benefit comes in the attack that follows), so Imbue Techniques and Relics were slipped as energy. Added a one-step "pressure" term (expected unblocked damage) to the pilot's evaluation, and a small value for a Reaction held in hand. Result: Charge Transfer and Mika's Imbue abilities are actually used.
* `Pull` (Nova, Passing Stranger) was mandatory and pulled a Rift card back whether you wanted it or not. It is now optional.
* Eight cards were in none of the eight decks (Night Market Entrance, Sealed District Gate, Emergency Stitch Kit, Pippi You Will Survive, Reiya Exit Clause, Suture the Impossible, The Forgotten Disaster, The Countdown Begins). Added to decks so every card is exercised.
* Dead or near-dead cards redesigned: Clean Sever (needed a Condition; now Condition or Zone and draws), Bondbreaker Stroke (now draws), Equivalent Exchange (now draws 3), A Name From Beyond (now +1 Power too), Charge Transfer (4/3 instead of 3/2).
* Phase now needs the Rift at 3 (was 2): the Rift deck led at 61-64%. Last-Second Detour cost 2 to 3, Nova What She Didn't Say 3/5 to 3/4.
* Spotlight bodies buffed (Camera Wisp 2/2, On Air 3/4, Your Host Tonight 4/4, Special Broadcast 4/5, Stagehand +1/+1 Backstage). Workshop characters buffed by +1 Power (Salvage Runner, Wrench Whisperer, Makeshift Beacon, Artifact Broker, Deal Maker). Toma and Ayame bodies buffed (Junior Analyst 2/2, Pattern Sight 3/3, Found the Flaw 4/3 then 3/3, Suspicious Ally 3/3, Cut What Cannot Be Cut 4/4 then 4/3).
* Signed Wager Slip now draws 2 on a win and costs 2 Resolve on a miss; Coinflip Curse 4 damage / 1 Resolve; Crow, Probability Hustler gains 1 energy with its draw.

## Round 4: crack-back awareness, stalls, second-player compensation
* A manual game showed the pilot sending every creature into an attack and losing to exact lethal on the swing back. Added an "exposure" term (damage it would take next turn through the blockers it still has ready). The games got slower and defensive decks gained: Impact Wall 63%, Spotlight 41% at the strongest setting, so the weight was lowered (balanced 0.3).
* Impact Wall nerfed (Brax Debt Collector 1/3, Reservoir 4/6, Emergency Stitch Kit heals 3), Spotlight restored (Camera Wisp 2/2, Stagehand +1/+1), Ninth Vendor 3/4, Charge Transfer now draws a card.
* Stalls: the Impact Wall mirror ended by running out of cards 68% of the time and 7-9% of all games did. Added **Strain**: from round 12 each player loses (round - 11) Resolve at their wake. Games ending by deck-out fell from about 8% to 2% (balanced pilots).
* Second-player compensation: free energy cards were far too strong (26-37% first-player wins). One-turn bonuses are worth about 10 points per extra energy on turn 1 or 2, an extra first-turn draw about 5 points. Final: second player has 1 extra energy on each of their first two turns. Final measured first-player win rate 49.8% over 5,400 games.
* Every one of the 130 cards is now in at least one of the eight decks; the audit and the simulations exercise each.
