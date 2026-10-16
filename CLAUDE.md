# Collector games: guide for Claude Code

## Wildkin Version 1: First Bond comes from the manifest
`design/wildkin-v1-production-bible.md` (the owner's production bible) is the source of truth. The prototype creatures, sets and art are gone from the game. The Wildkin build reads **only** `wildkin-production/manifest.json` (the 180 First Bond cards) and `wildkin-production/approved/registry.json` (approved art):
- `tools/wildkin_manifest.py` builds the manifest, art queue and reports from `wildkin-production/source/appendix_a_roster.tsv` (extracted from the bible) and the tables in the script. Every fact has a status: **canon**, **designed** (card rules, 2026-10-15), **decided** (non-mascot affinities, non-creature rarities, fandom weights, decided under the owner's instruction of 2026-10-15) or **provisional** (nothing left in First Bond; kept for future sets). Never present provisional as canon, and never invent cards, names or numbers. `--check` fails if the files are stale or invalid. It also writes `wildkin-production/RULES.md`, the readable rules and card reference.
- `tools/wildkin_design.py` holds the Version 1 card design: every attack, ability and trainer effect as small operations ("ops"), the weakness wheel, the decided affinities and the fandom weights. Card text is generated from the ops, so text and play never disagree.
- `src/engine/tcg_rules.js` (`WKR`) is the rules engine: full games (setup, Essence, evolution, abilities, Allies/Gear/Tactics/Biomes, conditions, weakness, prizes), a greedy player for both sides, a deck builder, and the field (candidate decks, gauntlet, round robin). It runs in the browser and in Node. `tools/wildkin_meta.js` precomputes the field at build time (`WK_META`; without Node the game computes it). `tools/wildkin_sim.js` is the balance check: run it after any card or engine change.
- The metagame (`tcg_world.js`) uses the engine's matchups: weekly share shifts, Swiss tournaments with a top-8 bracket and a final played card by card, and a rules committee that bans the card whose loss hurts a dominant deck most (tested by rebuilding the deck), never a staple. Saves keep the field they use (`G.tcg.mx`) with a fingerprint of the base field, so a change to card rules or the engine rebuilds it on load; bump `RV` in `tcg_rules.js` only for a change the fingerprint cannot see.
- `tools/wildkin_art.py` is the only way art gets into the game (check, approve, reject, ingest, legacy for 3x3 sheets; singles-check and singles-approve for single premium paintings mapped by `incoming/premium-individuals/card-map.json`). Approved art is never overwritten without `--replace`. SOL (the art model) follows `wildkin-production/SOL_HANDOFF.md` and owns art direction: no concept approval step; a subject's first approved sheet is its reference.
- `tools/wildkin_build.py` (called by `build.py` for tcg) writes `WK_CANON` and `WK_ART` into game.js and copies only approved images to `dist/tcg/art/`. Missing art draws a labelled "ART PENDING" placeholder, never another card's picture.
- Opening (`tcg_ui2.js`): several packs or a box open to a grid of pack tiles; a pack glows when its best card is premium or worth `TC_GOOD` ($5), gold at `TC_BIG` ($50). Inside a pack the Essence is revealed first and the rare slot last; good cards are sleeved and top-loaded; big hits and Gem Mint grades call `celebrate()` (drama.js, shared by all games). The sealed list groups identical products with Open all.
- Stores (`tcg_stores.js`): big-box retail (restocks Mondays, `tcShopWeek`/`tcShopDay`), The Tidepool local game store (sealed over list, Thursday allocation, a weekly singles case, a buylist at 55% of market; `G.tcg.lgs`) and Kinvault online singles (every print near mint at market +15%, weekly stock; `G.tcg.kv`). Store state is created on first use, so old saves need no migration.
- Ally cards draw the hero large on an approved scene chosen in `ALLY_BACKDROP` (`tools/wildkin_build.py`; presentation only, not in the manifest). The build trims cutouts to their subject box (`bb` in `WK_ART`). Non-creature illustrations keep the top of the painting (faces).
- Saves carry `G.tcg.cv=2`. Prototype saves (no `cv`) are labelled in the launcher, never loaded, never modified (`pack_apply.js`).
- Status and gaps: `wildkin-production/reports/V1_READINESS.md`, `outstanding_assets.md`, `reconciliation.md`.

## What this is
Three browser games from one engine. All content is fictional.
- **Sports Card Collector** (`sports`): a simulated baseball league, card products, packs, grading, shows, breaks.
- **Comics Collector** (`comics`): eighty years of simulated comics, publishers, creators, variants, preorders, grading.
- **Wildkin Collector** (`tcg`): a fictional creature trading card game with sets, a tournament metagame, bans, rotation, a singles market and grading.

Plain HTML and JavaScript. No framework, no server, no build tool beyond one Python script.

## Commands
- `python3 tools/build.py [sports|comics|tcg]` builds into `dist/<game>/` (needs Python 3 and `pip install pillow`).
- `python3 tools/build.py --publish` also copies the games into `docs/` (served by GitHub Pages).
- Serve and look: `cd dist && python3 -m http.server 8770`, then open `/sports/`, `/comics/`, `/tcg/`.
- Tests (need `pip install playwright` and `playwright install chromium`; start the server above first):
  - `python3 tools/shelltest.py <game> [port]`: launcher, new game, every tab, save slots, reload and Continue, backup export and import.
  - `python3 tools/playtest.py <game>`: buys, grades, lists, runs about two months, and checks the Hunt only sells what that game collects.
  - `python3 tools/wildkintest.py`: First Bond against the manifest, art mapping, packs and odds, play loop, prototype-save protection.
  - `python3 tools/wildkin_econ.py [months]`: headless Wildkin economy run (prices, chase cards, metagame health).
  - `python3 tools/test_art_pipeline.py`: the art intake on synthetic deliveries (no server needed).
  - `node tools/wildkin_sim.js [games-per-pair]`: the rules engine headless on First Bond (needs a built tcg): game length, how games end, every candidate deck's gauntlet, the top-15 round robin, card use.
- Before saying something is done: build, then run `shelltest` for every game you touched. A clean run prints `ERRS []`. For Wildkin also run `wildkintest.py`, `wildkin_manifest.py --check` after touching the manifest or design tables, and `wildkin_sim.js` after touching card rules or the engine.

## How the code is organised
- `src/engine/*.js` is the whole simulation and UI. `src/packs/*.js` defines each game (`PACK`). `src/shell/` is the launcher, save slots and per-game screens.
- **Everything is one global script.** `tools/build.py` concatenates files in a fixed order (see `ENGINE`, `TCG` lists), so load order matters. Later files often *wrap* earlier functions (`const _x=fn; fn=function(){...}`). A function name defined twice silently overwrites the first. Before adding a global, grep for the name. (A real clash happened with `evRow`.)
- `PACK` is defined first. `packHas('sports'|'comics'|'tcg'|'hunt')` decides which worlds get generated. `src/shell/pack_apply.js` sets the tabs, market and news filters, and the Wildkin home, shop and collection screens.
- **The baseball league only runs in the Sports build.** In comics and Wildkin, `newGame` calls `initNoLeague()` (empty players, products and standings) and the league, retail and release ticks do nothing (`packHas('sports')` gates in `market.js`, `world.js`). Old comics and Wildkin saves made before this still carry their frozen league data and load fine. Code shared with Sports (hunt, scenarios, market) must not assume baseball cards or products exist; gate with `HCARD()` or `packHas('sports')`.
- **Saves:** `src/shell/saves.js` stores named slots in IndexedDB, gzip-compressed JSON. Backups are `.ccsave` files (magic `CCS1`, a JSON header, then the payload). Keys starting with `_` are never saved. What gets saved is controlled by `saveReplacer` (market.js, cm_save.js, tcg_boot.js).
- **Determinism:** worlds come from `G.seed` through `mkRng(hsh(...))`. Wildkin cards come from the manifest (identical in every world); only hidden play-power jitter uses the seed. Nothing about cards is stored in saves.
- **Adding a new kind of collectible to the shared market** follows the pattern at the bottom of `tcg_value.js`: wrap `interest`, `itemOf`, `createListing`, `removeListing`, `transfer`, `recordSale`, `playerList`, `npcPool`, `itemLabel`, then add UI wrappers (see `tcg_ui3.js`: `listingRow`, `lsText`, `marketFiltered`, `listingSheet`, `designSheet`). Old code often assumes every item is a baseball card, so grep for `D(key)` and loops over `G.sales` when something crashes.
- The 3D inspector is `viewer3d.js` (three.js from `vendor/`). Print effects for close-ups are in `polish.js`. The grading reveal and crack-and-resubmit are in `drama.js`.

## The Wildkin economy (First Bond, measured with `tools/wildkin_econ.py`; re-measure after any change)
- First Bond launches on 8 June 2026, one week after a new game starts (1 June); it is announced with every card shown and preorders on day one. Launch prices carry a premium that fades in about a month (`nov` in `tcFairRaw`).
- Pack worth about $7 on launch day, about $5.40 a month later, about $5.80 after a year, against $4.50 retail. Box about $237 at launch, about $185 a month later, about $197 after a year, against $150.
- Medians after launch: commons 3 to 4 cents, uncommons about 12 cents, rares about 40 to 50 cents, holo rares about $1.30, IR about $6 to $7, FA about $13, SIR about $200 to $220, Clasped about $130.
- Chase: Cactuft SIR about $540 on launch day, then about $400 to $430 raw (about $2,100 at GCS 10), then Nimbusail, Sel Veyra and June Kestrel SIRs around $200, Clasped Aegisopod about $190. Collector fandom (manifest, decided starting weights) bends prices through `TC_TUNE` in `tcg_value.js`; play value comes from how much the simulated decks use a card; the rare slot odds live in the manifest.
- Metagame: 15 decks from the engine's field, simulated win rates about 39% to 63% in the round robin, top deck 13% to 21% of the field, the lead deck changes several times a year. With one set there is no rotation; bans only follow 10 weeks above 24% and did not trigger in a 12-month run (the ban path is tested in `wildkintest.py`).

## Known issues
- Wildkin: every card has approved art (the 4 SIR paintings are below the print minimum, accepted by the owner); card rules are designed and balanced by simulation, but no human has playtested them; only one set exists (see `wildkin-production/reports/V1_READINESS.md`).
- Wildkin has no Hunt, no follows or chases for cards, and no breaks or repacks.
- A few Hunt shop descriptions in the comics build still mention cards.
- Never tested on a real phone or on itch.io. The 3D viewer was only tested with a software renderer.

## Roadmap, in order
1. **Wildkin milestone.** Done: First Bond as data (manifest), engine on the new set, art as image files loaded on demand, chase tier, art intake, all art, card rules with a simulated metagame. Then:
   - Hype sets (more sets are needed first).
   - Hunt, follows and chases for cards.
   - A set-variation system that composes card art from species cutouts, poses and scenes (`tools/ingest.py` makes the cutouts).
   - Enough content for six or seven years of sets.
2. ~~Strip the baseball league out of the comics and Wildkin builds.~~ Done.
3. Comics milestone: real cover art sheets replace the vector covers.
4. Sports milestone: player art sheets and stadiums.
5. Two more card games: a Magic-style spell game and an anime character game, as options inside the Wildkin game.

## Art
Sheets are generated elsewhere as 3x3 grids with thin dark gutters and no text. `tools/ingest.py` cuts them. Cutout sheets use a flat green screen (magenta for green creatures), about 10 percent margin, no floor shadow needed. The cutout method was tested and works (see README).

## Design documents
- `design/wildkin-v1-production-bible.md`: the owner's Version 1 production bible (180-card First Bond roster, 43-sheet art plan). Source of truth for Wildkin; supersedes the roster numbers below where they differ.
- `design/tcg2/brief.md`: the owner's brief for the second card game (Land versus Sea high fantasy, launching at its 10th anniversary). `design/tcg2/proposals.md` answers its open decisions as proposals. Approved working design (2026-10-16): the two-front Shore/Deep battlefield, commitment Allegiance, a 60-card prototype simulated before any card library or art (no bulk art yet). Prototype rules: `design/tcg2/prototype-rules.md` (version 0.3, adopted after round 2); latest results `design/tcg2/round3-report.md` (owner decisions open; round 2's balance numbers were wrong because of a simulator bug, see its correction notice). Engine, cards and experiments in `tools/tidemark/`, not part of any game build: `node tools/tidemark/check.js` (self-test; run after any engine or card change), `sim.js 200` (one configuration; rules 0.3, pool 0.3, AI v2 by default), `round3.js 300` and `cardvalue.js 160 --pool 0.3` (the round 3 data). `cards.js` keeps pool 0.2 frozen and builds pool 0.3 from a change list with reasons; `round2.js` and `probe.js` run the old engine (`oldEntry`) to stay reproducible.
- `design/platform-direction.md`: one app hosting four card games (proposal).
- `design/wildkin-universe.md`: the owner's locked plan for the Wildkin creature roster (150 roots, 245 forms, evolution families, affinities, art sheet plan) and the decisions still open. Read it before touching Wildkin species, cards or art.

## Source art
`art-source/` holds the owner's generated sheets, untouched (see `art-source/README.md`). They are the real art direction for the rebuilt Wildkin: creatures are soft, toy-like 3D renders on a flat screen; scenes are matching 3D miniature-diorama backgrounds with an open floor in the lower third. `python3 tools/build_art.py` cuts every sheet into `assets/creatures/<name>/<pose>.webp` and `assets/scenes/<biome>/<biome>-NN.jpg` and writes `assets/manifest.json` (scene biome, floor ground/water/air, time of day, tags; creature name, screen colour, pose). The scene tags and pose order live in `tools/build_art.py`. `tools/ingest.py` does the cutting: soft matte that keeps hairlines, screen colour un-mixed from edges, `--drop-effects` removes stray "!"/sparkle marks. `lab/index.html` is the art review page (every cutout on grey with edge-touching flags, and a creature-in-scene composer with light matching); `build.py --publish` copies it and the cut art to `docs/lab/`. Creature movement types and sizes (walker, swimmer, floater) live in `CREATURES` in `tools/build_art.py`. `START_HERE.md` has the first tasks.

## Working with the owner
The owner works mostly from a phone and is not a professional developer. Explain changes in plain language, keep commits small, ask at most one question at a time, and batch feedback. Always report what was tested and what was not, and never claim something works unless a test ran.
