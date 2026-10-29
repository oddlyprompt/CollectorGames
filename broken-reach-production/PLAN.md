# The Broken Reach: implementation plan (written 2026-10-29, before the game integration)

Source: SOL/owner handoff v0.1 (`source/broken_reach_set01_data.json`, `source/broken_reach_set01_chases.csv`; the .xlsx workbook was not delivered). Everything in it is **proposed / provisional**. Gates: G0 scaffold done; G1 rules + tests done (this commit); G2 balance, G3 playable demo, G4 lore approval, G5/G6 art, G7 pack simulation, G8 collector and career integration are not done.

## Findings about the repository (what a new franchise has to fit)
- Tidemark is the pattern: its own data folder (`tidemark-production/`), its own rules code (`tools/tidemark/v1`), a prefixed fork of the card-game UI code in `src/engine/tm/`, one shared save, wallet and marketplace (item type `x`), a world state `G.xtg`, copies `G.xtc`, economy v2 (`ecv`). A franchise does not touch another franchise's data (golden tests check this).
- The shared market kit (`src/tcg/kit/market.js`) is configured per franchise (`cardMarket(L)`); a new franchise needs its own item type letter, key format, price table, packs, NPC collector types and Home/Collection chips. That is step 8, after the rules are trusted.
- Existing games are tournaments between decks (engine plays a whole game for the metagame). The Broken Reach is a short grid battler (16 placements), so its "metagame" will be deck-vs-deck results from this same resolver; nothing from Wildkin or Tidemark rules is reused.

## Order of work
0. **Done 2026-10-29 (Play Alpha):** browser battler, three AI levels, deckbuilder with three preset decks, turn-order experiments (`TURN_ORDER_REPORT.md`), tests (`tools/brokenreach/test.js`, `tools/brokenreach_uitest.py`). Page: `dist/tcg/broken-reach/` (source `src/br/`, builder `tools/brokenreach_build.py`).
1. **Done:** data import with stable ids, base card versus printing (`import.js`); resolver (`engine.js`); 42 golden tests (`test.js`); seeded harness (`sim.js`, report `SIM_REPORT_2026-10-29.txt`).
2. Playable local match (placeholder rectangles, 24 representative cards, 3 planets, arrow icons, animated cascade order) as a separate screen from the collection. Deckbuilder with a starter deck; combat works on a copy of ownership so a flip never changes a collection.
3. Owner decisions on the open rules (see `RULES_NOTES.md`), then balance pass on stats (Gate G2).
4. Packs/collation (10 cards, exactly one premium-or-foil slot, wildcard), box simulation, then the shared-market integration in a new `src/engine/br/` fork with its own prefix, economy v2 conventions only where they fit.
5. Career mode with local-shop tournaments and rival NPCs.
Art: none is produced here. 180 + 27 briefs exist; the handoff says to confirm master character sheets for the six crew, Rix and Silas first.
