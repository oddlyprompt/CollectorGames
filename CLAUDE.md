# Collector games: guide for Claude Code

## IMPORTANT: the current Wildkin content is placeholder
The owner is writing a new Wildkin concept (`design/wildkin-universe.md` and whatever follows). **That document is the source of truth.** Everything about Wildkin that is in the code today is a throwaway prototype: the 81 + 9 creature names, the nine energy types (Flame, Tide, Grove, Radiant, Void, Frost, Storm, Stone, Lunar), the four sets (Hearthwild, Skyreach, Duskmere, Anthology), the generated art, the stats and attack text. Do not extend it, do not treat it as canon, and do not try to keep it compatible with the new concept. What *is* reusable is the machinery: the market, collectors, grading, save slots, the 3D viewer, the tournament and metagame simulation, rotation and bans, the card frame renderers, and `tools/ingest.py`.

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
- Before saying something is done: build, then run `shelltest` for every game you touched. A clean run prints `ERRS []`.

## How the code is organised
- `src/engine/*.js` is the whole simulation and UI. `src/packs/*.js` defines each game (`PACK`). `src/shell/` is the launcher, save slots and per-game screens.
- **Everything is one global script.** `tools/build.py` concatenates files in a fixed order (see `ENGINE`, `TCG` lists), so load order matters. Later files often *wrap* earlier functions (`const _x=fn; fn=function(){...}`). A function name defined twice silently overwrites the first. Before adding a global, grep for the name. (A real clash happened with `evRow`.)
- `PACK` is defined first. `packHas('sports'|'comics'|'tcg'|'hunt')` decides which worlds get generated. `src/shell/pack_apply.js` sets the tabs, market and news filters, and the Wildkin home, shop and collection screens.
- **The baseball league only runs in the Sports build.** In comics and Wildkin, `newGame` calls `initNoLeague()` (empty players, products and standings) and the league, retail and release ticks do nothing (`packHas('sports')` gates in `market.js`, `world.js`). Old comics and Wildkin saves made before this still carry their frozen league data and load fine. Code shared with Sports (hunt, scenarios, market) must not assume baseball cards or products exist; gate with `HCARD()` or `packHas('sports')`.
- **Saves:** `src/shell/saves.js` stores named slots in IndexedDB, gzip-compressed JSON. Backups are `.ccsave` files (magic `CCS1`, a JSON header, then the payload). Keys starting with `_` are never saved. What gets saved is controlled by `saveReplacer` (market.js, cm_save.js, tcg_boot.js).
- **Determinism:** worlds come from `G.seed` through `mkRng(hsh(...))`. Wildkin sets and cards are regenerated from the seed, not stored.
- **Adding a new kind of collectible to the shared market** follows the pattern at the bottom of `tcg_value.js`: wrap `interest`, `itemOf`, `createListing`, `removeListing`, `transfer`, `recordSale`, `playerList`, `npcPool`, `itemLabel`, then add UI wrappers (see `tcg_ui3.js`: `listingRow`, `lsText`, `marketFiltered`, `listingSheet`, `designSheet`). Old code often assumes every item is a baseball card, so grep for `D(key)` and loops over `G.sales` when something crashes.
- The 3D inspector is `viewer3d.js` (three.js from `vendor/`). Print effects for close-ups are in `polish.js`. The grading reveal and crack-and-resubmit are in `drama.js`.

## The prototype Wildkin economy (useful as a calibration reference only; re-measure for the new concept)
- Pack worth about $3.50 to $5.50 against a $4.50 retail price. Box worth about $120 to $190 against $150.
- Commons about 5 cents, uncommons about 40 cents, holo rares about $2.50, ultras $10 to $15, secrets $13 to $22.
- Metagame: about 15 archetypes, top deck usually 15 to 25 percent, bans rare (about one or two a year), Standard is the newest three sets.
- Known gap: no card is worth hundreds of dollars. Real hype sets have a $300 to $1,500 chase card (a loved species, a 1-in-1,000+ pull rate, a sold-out set, big slab premiums).

## Known issues
- Wildkin art is embedded as data inside `tcg_art.js` (7 MB). It should be real image files.
- Wildkin has no Hunt, no follows or chases for cards, and no breaks or repacks.
- A few Hunt shop descriptions in the comics build still mention cards.
- Wildkin art is limited: sets 1 to 3 use unique art, Anthology reuses it, and sets after that reuse art with a name prefix.
- Never tested on a real phone or on itch.io. The 3D viewer was only tested with a software renderer.

## Roadmap, in order
1. **Wildkin milestone, rebuilt from the new concept.** First turn the owner's concept into data (affinities, families, roster, card types, set structure, rarity ladder, pull rates, calendar), then replace the prototype content. Then:
   - Art as image files, loaded on demand.
   - Chase tier and hype sets (see economy above).
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
- `design/wildkin-universe.md`: the owner's locked plan for the Wildkin creature roster (150 roots, 245 forms, evolution families, affinities, art sheet plan) and the decisions still open. Read it before touching Wildkin species, cards or art.

## Source art
`art-source/` holds the owner's generated sheets, untouched (see `art-source/README.md`). They are the real art direction for the rebuilt Wildkin: creatures are soft, toy-like 3D renders on a flat screen; scenes are matching 3D miniature-diorama backgrounds with an open floor in the lower third. `python3 tools/build_art.py` cuts every sheet into `assets/creatures/<name>/<pose>.webp` and `assets/scenes/<biome>/<biome>-NN.jpg` and writes `assets/manifest.json` (scene biome, floor ground/water/air, time of day, tags; creature name, screen colour, pose). The scene tags and pose order live in `tools/build_art.py`. `tools/ingest.py` does the cutting: soft matte that keeps hairlines, screen colour un-mixed from edges, `--drop-effects` removes stray "!"/sparkle marks. `START_HERE.md` has the first tasks.

## Working with the owner
The owner works mostly from a phone and is not a professional developer. Explain changes in plain language, keep commits small, ask at most one question at a time, and batch feedback. Always report what was tested and what was not, and never claim something works unless a test ran.
