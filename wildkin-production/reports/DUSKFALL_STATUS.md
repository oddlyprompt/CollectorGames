# Wildkin: Duskfall (Set 002) status

Date: 2026-10-17. Written by Claude Code. Card reference: `../sets/dsk/RULES.md`. Data: `../manifest-dsk.json` (built by `tools/wildkin_dsk.py`).

## Short answer

Duskfall is in the game as the second Wildkin set: 180 cards, every one with approved art (Essence are drawn), real rules, packs, a release, previews and preorders, and a place in the metagame next to First Bond. First Bond's cards, art and simulated results did not change, apart from one wording fix in one card's text.

## Where each fact comes from

| Fact | Source | Status |
|---|---|---|
| Names, numbers, categories, affinities, families, stages, reprints, premium subjects | The owner's checklist in SOL's final handoff (`../sets/dsk/art_manifest.json`) | roster (the handoff calls it "proposed"; used exactly as delivered, nothing added or renamed) |
| Art for all 180 cards | SOL's 61 delivered sources, ingested with `tools/wildkin_art.py set-delivery` | approved (owner, 2026-10-17) |
| The 27 reprints and 9 Essence | Copied from the First Bond card; they play as that card (same identity) | reprint |
| Rules for the 104 cards with new gameplay | `tools/wildkin_dsk.py`, using only effects the engine already plays | designed by Claude Code (not canon) |
| Rarities | First Bond's rule by stage (Basic common, Stage 1 uncommon, Stage 2 and standalone rare); Allies uncommon except the three premium subjects; item Gear common, attached Gear uncommon; Biomes uncommon; System Lockdown rare | decided by Claude Code (not canon) |
| Biome effects | First Bond's nine effects reused for other affinities, so Dusk and Iron get a home field (Gloamfen Crossing: Dusk retreat free; Old Ironworks: Iron +10 damage; and so on) | decided |
| Collector demand | Velunox is the set's chase (4 premium prints); then Crucimoth, Moonbun, the Dusk lines; Sel Veyra and Edda Voss lead the characters | decided |
| Release date | 7 December 2026 (a Monday, 26 weeks after First Bond); announced 35 days ahead with a first look and preorders | decided |
| Pack, odds, box, price | Same as First Bond (10 cards 6/2/1/1, same rare-slot odds, 36-pack box, $4.50 / $150) | decided |

## Balance changes made while testing (first drafts that were too strong)

| Card | First draft | Now | Why |
|---|---|---|---|
| Duskleaf (034) | 100 HP, healing ability, 40 and 80 damage | 90 HP, no ability, 20 and 70 | in 4 of the top 6 decks |
| Edda Voss (092) | search + draw 3 | search + draw 2 | in almost every top deck |
| Canopang (060) | heal 20 to the team for 2 Essence | heal 10 | stall decks too strong |
| Gearjaw (015), Corrodeon (033), Ferradon (065) | Essence removal every attack | coin flip or less damage | Iron decks led the field |
| Koirune (056) | 60/170 damage, damage-reduction ability | 50/160, no ability | 34% of the field in a 20-month run |
| Veilmora (063) | 170 HP, 120+40, Bench shield | 160 HP, 110+30, no ability | 35% of the field and two bans in a 20-month run |

## What was tested

Numbers from this build:
- Simulation with both sets: the top 15 decks win 37% to 56% of their games (First Bond alone: 39% to 63%); 144 candidate decks.
- 20 months from a new game (`wildkin_econ.py 20`): before Duskfall nothing changed (First Bond box about $173 in print). After 7 December 2026 the most played deck holds 14% to 21% of the field and no ban triggers; every deck in the field plays at least one Duskfall card. Duskfall pack value $4.15 to $4.56 (price $4.50), box $143 to $168 (price $150): opening Duskfall roughly breaks even, a little less than First Bond. Chase: Koirune SIR about $300 to $340, Clasped Velunox about $290 to $320; On release day (launch premium): box about $200, pack value $5.31, Koirune SIR and Clasped Velunox about $400, Velunox SIR about $320.

Tests: `tools/duskfalltest.py` (new: catalog against the manifest, reprint identities, art, hidden until announced, preorders, release day, packs, prices, two-set metagame, an old save opened after the release, set page and card faces, save and reload), `tools/wildkintest.py`, `tools/wildkin_sim.js` (First Bond alone: identical to before the engine change; `--sets 1,2`), `tools/wildkin_econ.py 20`, `tools/shelltest.py tcg`, `tools/playtest.py tcg`, `tools/test_art_pipeline.py`, both manifest checks.

## Not done

- No Duskfall packaging renders were delivered: the pack and box are drawn wrappers using the Velunox SIR and Clasped Velunox paintings. SOL can deliver `product.dsk.pack-1..4`, `box-closed`, `box-open` like First Bond's; the game picks them up with `tools/wildkin_art.py products --code dsk`.
- No human has played the rules; balance is by simulation only.
- A save that is already past 7 December 2026 gets Duskfall the day it is opened (shops, market and metagame update that day; there is no announcement period).
