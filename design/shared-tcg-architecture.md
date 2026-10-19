# Shared card-game architecture: audit and refactor proposal

Written 2026-10-19 for the owner's review. **A proposal. No refactor has been started.** The baseline it protects is commit `d73b84c`
(branch `claude/checkpoint-tidemark-integrated`, local tag `checkpoint-tidemark-integrated`).

## 1. Where we are (measured)

Two card games now share one world, one save, one wallet and one marketplace. Wildkin is `src/engine/tcg_*.js`; Tidemark is a fork of it in
`src/engine/tm/` with every name prefixed `xt`/`XT_` so both load in one script.

| Area | Wildkin file | Tidemark file | Size each | Lines identical after renaming |
|---|---|---|---|---|
| Copies, prices, packs, sealed, NPC collectors, market hooks | `tcg_value` | `tm_value` | 21 / 23 KB | 52% |
| Metagame, events, bans, previews, retail lifecycle | `tcg_world` | `tm_world` | 26 / 24 KB | 49% |
| Stores (retail, local shop, online singles) | `tcg_stores` | `tm_stores` | 15 / 15 KB | 35% |
| Collecting goals, wantlist, duplicates | `tcg_collect` | `tm_collect` | 13 / 13 KB | 52% |
| Views: home, shop, sets, meta, collection | `tcg_ui1` | `tm_ui1` | 20 / 19 KB | 60% |
| Set sheet, card page, pack opening | `tcg_ui2` | `tm_ui2` | 26 / 25 KB | 68% |
| Marketplace rows, calendar | `tcg_ui3` | `tm_ui3` | 7 / 7 KB | 41% |
| Card faces, wear, foil, slabs, packaging, viewer hooks | `tcg_render` | `tm_render` | 23 / 19 KB | 45% |
| Boot, saves, daily tick | `tcg_boot` | `tm_boot` | 3 / 3 KB | 37% |

About 160 KB of each side is the same machine with different data, and roughly half of its lines are literally identical (the lines are long, so the
real overlap is higher than the percentage). The parts that are genuinely different are small: `tcg_rules.js` (46 KB, Wildkin's engine) versus
`tm_rules.js` (2 KB adapter over `tools/tidemark/v1`), the data layers, the frame renderers, the pack structure and a handful of formulas.

Each line also installs about 38 hooks into shared functions (`interest`, `itemOf`, `createListing`, `transfer`, `recordSale`, `playerList`, `npcPool`,
`lsText`, `listingRow`, `marketFiltered`, `listingSheet`, `designSheet`, `feedLabel`, `miniKey`, `collectionTotals`, `upNext`, `objFor`, `faceSVG`, `finOf`,
`pcData`, `v3Art`, `v3Back`, `v3Raster`, `rvRaw`, `rvSlab`, `rvTitle`, `rvValue`, `popLine`, `ACT.inspdetail`, `saveReplacer`, `migrate`, `advanceDay`,
`newGame`, `resetCaches`, `render`, the three `VIEWS`). A third line would add 38 more wrappers and another 160 KB copy. Item kinds are also hard-coded
as letters (`'c'` card, `'m'` comic, `'t'` Wildkin, `'x'` Tidemark) in `drama.js`, `journal.js`, `ui2.js`, `flow.js`, `ui3.js`, `ui4.js`,
`launcher.js`, `pack_apply.js` and `scenario.js`.

Baseline numbers for the budget (unified build, one Wildkin + Tidemark world): `game.js` 2.46 MB, art 69 MB, new game 0.4 s, 30 days 1.2 s, one year
7.5 s (including the Tidemark ban computation when it happens), save 175 KB gzipped, about 9,700 card copies and 520 listings after a year.

## 2. Audit by area

For each: what is shared today, what is copied, and what is truly franchise-specific.

**Storefronts and purchasing** (`*_stores`, `tcBuySealed`, `tcPreorder`, `tcFulfilPreorders`, `tcShopWeek/Day`)
- Copied: the whole flow. Big-box retail restock and sell-down, preorders charged on release, the local shop (Thursday allocation, weekly singles case, buylist at
  55%), the online singles shop (Monday stock, market +15%), the sealed list and "Open all".
- Franchise-specific: store names and prices, which sets are in print and for how long, shop stock tables, the singles case mix, store look and feel (later).
- Needs: one store engine driven by a store descriptor per line (names, prices, allocations, print policy), so a new store type is written once.

**Marketplace and selling** (`*_value` hooks, `*_ui3`, `tcCopySheet`, `tcLgsOffer`, auctions)
- Copied: the nine market wrappers, NPC collector types and their interest model, NPC listing generation, grading submission and return, the listing sheet,
  sale and fee bookkeeping.
- Franchise-specific: what an NPC wants (the "interest" weights per collector type) and what a card's value is.
- Needs: the market integration registered once per line through a single `registerItemKind()`; interest and value supplied by the line.

**Inventory and collections** (`G.tc`, `G.xtc`, `myTc`, `*_collect`, `tcCollV`)
- Copied: copy objects (id, key, owner, condition, grade, history), stacks, filters, goals, wantlist, duplicates, "mark as seen", set checklists.
- Franchise-specific: set structure (Wildkin base plus premium; Tidemark 31 sets with bulk), which goals make sense, rarity names and filters.
- Needs: one collection model (an index of owned items by line, set, rarity, condition) and one collection view that the line fills with filters and goals.
  This is also what the collection-interface overhaul (roadmap 7) should be built on.

**Pack opening and card handling** (`tcRollPack`, `tcOpenSealed`, `tcoGrid`, `tcFront`, `tcWear`, `tcSlab`, `miniT`)
- Copied: the opening overlay, tiles and glow, reveal order, big-hit celebration, summary versus price paid and sealed value; wear, slabs, foil overlay,
  the viewer and reveal hooks.
- Franchise-specific: pack structure and odds, what a card face is (SVG frame versus canvas frame with art), packaging art.
- Needs: pack roll and card face behind a line interface; the opening overlay and the card-handling effects shared.

**Shared UI components** (`*_ui1/2`, `pack_apply.js`)
- Copied: panels, rows, stacks, set sheet, card page layout, market chips, the metagame list, event rows.
- Needs: a small component layer (card tile, price chip, stack grid, set grid, store panel, deck row) plus a theme token set per line. This is the
  foundation for the visual overhaul (roadmap 5) and for distinctive stores (roadmap 6).

**Economy and time progression** (`*_world`, `tcFairRaw`, `tcDay`, `tcCatchUp`, `advanceDay` wrapper)
- Copied: the weekly metagame model (share drift, Swiss events with a top 8, brewing, pruning, bans, `TCM`/`TCP` constants), the retail lifecycle, previews and
  rotation news, the daily and weekly tick, catch-up for old saves, the price formula's shape (collector value, play value, novelty, out-of-print, grade multipliers).
- Franchise-specific: how matchups are produced (Wildkin: a live candidate field built by `WKR`; Tidemark: a precomputed library), formats and rotation, set release
  history, price tables and tuning, ban line (24% vs 18%).
- Needs: one world engine that talks to a rules adapter (field, matchup, play a final, rebuild a deck without a card), and a price model with a line-supplied table.

**What is already shared and good:** the shell (launcher, saves), the market core, grading, the 3D viewer, polish effects, the journal, news and calendar, drama
(reveals, celebrate). The consolidation is about the card-game layer on top of them.

## 3. Proposed architecture

The goal is *shared services plus franchise modules*, not one parameterised file and not a rewrite.

```
src/engine/            existing core, market, grading, viewer, journal   (unchanged)
src/tcg/kit/           shared card-game services, one file per concern
  lines.js             the registry: LINES, lineOfKey(key), lineOfItem(item), activeLines()
  copies.js            copy objects, condition, wear, grade, population, history
  prices.js            price model shape (collector + play + novelty + out-of-print), grade multipliers, sealed lifecycle
  market.js            registerItemKind(line): the nine market hooks, NPC collectors, listing generation
  stores.js            store engine driven by line store descriptors (retail, local shop, online singles)
  packs.js             opening overlay, tiles, glow, reveal order, summary; calls line.rollPack
  collection.js        collection index, stacks, filters, goals, wantlist, duplicates
  meta.js              weekly metagame model, events, bans, brewing, pruning; calls line.rules
  world.js             daily/weekly tick, previews, release, retail lifecycle, catch-up
  ui.js                shared components and theme tokens
src/tcg/lines/wildkin/ manifest loader, rules engine (WKR) + adapter, frames, packaging, price table, set rules
src/tcg/lines/tidemark/ cards loader, rules engine adapter, frame renderer, packaging, price table, set rules
src/tcg/lines/rift/    (future) the same six files
```

**A line is a plain object implementing a contract** (data and a few functions), registered with `LINES`:
`id`, `name`, `theme`; `sets()`, `setDef(n)`, `cards(n)`, `variants(card)`; `rollPack(set, rng)`, `packStructure`, `sealedProducts`; `face(key)`, `packArt(set, form)`;
`priceTable`, `playValue(card)`, `collectorValue(card)`; `rules` = `{field(sets), matchup(a, b), play(a, b, seed), rebuildWithout(deck, card), deckCards(deck)}`;
`formats(t)` (legal sets, rotation), `printPolicy(set)`, `stores` descriptors, `goals`, `filters`, `news` text templates, `scenarios`.

**One instance per line, not one parameterised body.** Each kit file exports an installer, `installPrices(line)`, `installMarket(line)`, and so on, that builds
that line's functions in a closure and registers them. Two lines can therefore run the same code with different data and never clash, which removes the `xt`
prefix hack. Distinct logic stays in the line folder: a line may override any kit function (`line.overrides.fairRaw`) when its economy genuinely differs.
The build keeps concatenating files in a fixed order; no ES-module migration is needed.

**Shared dispatch instead of per-line wrappers.** The 38 wrappers become one dispatcher each: the shared function looks up the line from the item type or
key prefix (`lineOfKey`) and calls it. `drama.js`, `journal.js` and the other hard-coded `'t'/'x'` branches switch to `lineOfItem`. A third line costs a line
folder and one registry entry, not 38 wrappers.

**Saves stay as they are.** Wildkin keeps `G.tcg`, `G.tc`, `G.tpop`, item type `t`, key prefix `T|`; Tidemark keeps `G.xtg`, `G.xtc`, `G.xpop`, `x`, `X|`.
The registry maps each line to its existing fields through accessors (`line.state()`, `line.copies()`). New lines use a generic `G.lines[id]`. Nothing is
renamed in saved data, so no migration is needed for existing saves. A schema version (`G.sv`) is added so later migrations have a place to hang.

**Franchise identity stays in the line:** rules engines and card designs, set histories and print policies, pack odds, frames and packaging, price tables,
fandom weights, formats and rotation, store flavour, ban lines. The kit only ever asks the line for these.

**How the roadmap lands on it**
- *Rift Parade (3):* a new `lines/rift/` folder (cards loader, rules adapter or a lighter play-strength model, frames, packs, price table, store descriptors) plus one registry
  entry. It is the proof that the boundary is right, so it is built after consolidation, not before.
- *The Hunt (4):* today `hunt.js` assumes cards or comics (`HCARD()`, `HCOMIC()`, category maps `CARD_CATS`/`COMIC_CATS`). It should become a service over
  the registry: sellers own items of any line (the owner-id scheme `-(1000+sellerId)` already allows it), searchable categories come from each line
  (`line.huntCategories`: bulk bins, vintage, graded, sealed), and the Hunt UI lives inside the collecting experience rather than as a tab. Needs `lineOfItem` first.
- *Visual and UI overhaul (5), stores (6), collection interface (7):* all three sit on `kit/ui.js` (components and theme tokens), the store descriptors and the
  collection index. Doing the consolidation first means each of them is built once and every line gets it.
- *Weekly progression system (8):* a `weekly` service that reads each line's calendar (releases, events, ban windows, restocks) and the player's collection
  and issues a weekly agenda, goals and rewards, saved in one field (`G.weekly`). It needs the world engine to expose a calendar per line.
- *Testing and alpha (9):* the golden tests below become the permanent regression suite, plus performance budgets (below).

## 4. Protecting existing behaviour

**Must be preserved:** saves, collections (every copy, its condition, grade, history, listing state), card values, pack odds, market behaviour, the
metagame, and the existing tests.

**Migration risks, in order of danger**
1. *Random number order.* Worlds, packs and markets draw from seeded generators; moving code can change the order or count of draws and change every price
   and pull. Mitigation: golden tests that compare exact outputs before and after each step.
2. *Save compatibility.* Field names, item types and key formats are part of the save. Mitigation: none are renamed; archived real saves must load unchanged.
3. *Silent global overwrites.* Duplicate function names overwrite each other silently. Mitigation: a build-time check that fails on duplicate top-level names.
4. *Wrapper order.* Hooks chain in load order; moving a wrapper changes behaviour. Mitigation: replace chains with dispatchers one hook at a time, with tests.
5. *The Tidemark field and library.* The matchup library is tied to a fingerprint; any change to engine or card data rebuilds saved fields. Mitigation: the refactor
   must not change `TMR.RV`; the library is not regenerated.
6. *Performance.* A year takes 7.5 s today. Closures per line must not slow ticks. Mitigation: budgets measured before and after.
7. *Wildkin test expectations* (`wildkintest`, `duskfalltest`) call global names like `tcD`. Mitigation: keep thin global aliases for Wildkin until the tests move to the registry.

**Regression tests to build before changing any code (the safety net)**
1. *Golden prices:* for a fixed seed and day, every key in both lines: `fairRaw` and the grade-10 value; recorded now, compared exactly after.
2. *Golden packs:* 5,000 packs per line with fixed generators; compare the sequence of keys and the bulk counts exactly. Compare pack EV.
3. *Golden metagame:* a fixed-seed 52-week run per line: shares by week, events, new decks, bans, and the final field. Needs the global generator seeded
   (a small test hook, no behaviour change).
4. *Golden market:* 60 days of listings: counts, price distribution, sales, per line.
5. *Save archive:* real `.ccsave` files captured from the checkpoint: a Wildkin-only save from before Tidemark, a day-one unified save, one after Tenth Tide's release, one
   after a ban. Each must load, run 30 days without errors, and produce the same collection value as recorded.
6. *API contract test:* every line registered with `LINES` is run through one generic suite (catalog, keys round-trip, pack roll, price finite, face renders, a buy-open-sell-grade loop).
7. *Duplicate-name check* at build time.
8. *Existing suites stay green at every step:* `wildkintest`, `duskfalltest`, `tidemarktest`, `shelltest` for all games, `playtest`, `test_art_pipeline`.
9. *Performance budget test:* new game, 30 days, one year, save size, bundle size.

## 5. Migration sequence

Every step is a separate commit, ships on its own, and leaves all tests green. The order puts the lowest-risk, highest-duplication code first.

| # | Step | Risk | Result |
|---|---|---|---|
| 0 | Golden harness and archived saves, duplicate-name check, seeded test hook. **No behaviour change.** | none | the safety net |
| 1 | Line registry and dispatch: `lineOfKey`/`lineOfItem`; replace the hard-coded `'t'/'x'` branches in shared files. Both lines register. | low | one place to add a line |
| 2 | Pure helpers into the kit: condition, wear, grade, population, slab, foil overlay, condition text, `median`-style helpers. Delete the Tidemark copies. | low | about 15 KB gone |
| 3 | Market integration into `registerItemKind(line)`; NPC collectors and interest as data. | medium | 38 wrappers become 1 per line |
| 4 | Stores into the store engine with descriptors. | medium | stores written once |
| 5 | Pack opening overlay and card-handling effects into the kit. | medium | opening written once |
| 6 | Collection index, view, goals, wantlist into the kit. | medium | basis for the collection overhaul |
| 7 | World engine and metagame model behind the rules adapter. | **high** | the biggest duplicate, last because the golden metagame test guards it |
| 8 | Shell: tabs, home, collection chips, scenarios and boot driven by the registry. | medium | a new line appears without editing the shell |
| 9 | Remove the forks, the `xt` prefix and the aliases. | low | cleanup |

Rough size: steps 0 to 2 about two days of work, 3 to 6 about a week, 7 about two to three days, 8 and 9 two days. Wildkin stays the reference implementation for
every step: the kit is extracted from it, Tidemark is moved onto it, and the diff against the golden outputs must be empty.

## 6. Performance and scale (for alpha)
- Each line adds about 700 KB of script, 30 to 70 MB of art, 4,000 to 5,000 copies and 200 to 300 listings per world. Four lines would be about 5 MB of script,
  200+ MB of art, and a daily tick several times slower. Proposed: lines can be switched off per save (the start screen asks which lines to play), art loads on demand
  and is cached (already true), NPC and listing counts scale per active line, and the world tick budget is measured in step 0.
- Ban computation in the browser (about 5 s for Tidemark) should move to a worker, or its candidate count reduced, before more engine-backed lines arrive.

## 7. What I need from you
Review and decide. The one choice that changes the plan: **should the refactor aim for bit-identical results** (same prices, pulls and market for the same seed;
my recommendation, because it makes the golden tests exact and any difference a bug) **or accept small statistical differences** (faster, but regressions are harder to see).
Everything else in this document can be adjusted in review.
