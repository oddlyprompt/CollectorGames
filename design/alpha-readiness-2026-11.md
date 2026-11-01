# Alpha-readiness pass, 2026-11-01

Scope: make the existing collector experience (Wildkin, Tidemark, Broken Reach in the Trading Card Collector) reliable, understandable and enjoyable for controlled testing. Evidence: an external audit of collector script `f9a01846be` and battler `9fabe8d`; every finding was re-checked against current code first. Nothing in this pass is published or deployed.

## 1. Findings re-checked and what was done

| # | Audit finding | Current code | Action |
|---|---|---|---|
| 1 | Tidemark wantlist and card-page Buy shortcuts return "Out of stock" | **Confirmed.** `xtWhere` emitted `kvbuy`/`lgssingle` (Wildkin's handlers). Wildkin's and Broken Reach's shortcuts were already correct. | Fixed to `xkvbuy`/`xlgssingle`. **New finding:** with the economy-v2 Saltmarket, `xtKvStock()` returns a fresh table each call, so the kit's `s[k]--` never reduced synthetic stock (a card could be bought without limit). Added `kvTake` to the store kit; Tidemark decrements the persistent stock. Test: `purchase_routes_test.py`. |
| 2 | Opening five minutes: Home says "Open a pack" with empty shelves | Confirmed on day 1 (nothing released). | `src/shell/tcg_home.js`: skippable five-step start, tiles say "Preview · <set> <date>" until stock exists. |
| 3 | Home panels too large, decisions buried | Confirmed. | "Needs you", "Your focus", compact tiles and KPIs above the old panels (which are unchanged below). |
| 4 | Pack hints leak ("No standout cards in this lot"); celebrations spoil | Confirmed (hints on by default, goal banner during opening). | Hints off for **new** worlds (`opt:{nohint:true}` at world creation; older saves untouched), per-game switch in Settings. Goal celebrations are held (`UI.celQ`) until the summary. Summary leads with collection progress. |
| 5 | $11.25 offer accepted on a $1.45 ask | Confirmed: `playerOffer` accepted anything above the seller floor and settled at the offered amount. | Offers at or above the ask are refused with an explanation; the input has `max` and a hint. Estimates: see below. |
| 6 | Browsing: pages of unavailable stock, huge pager; Collection looks empty | Confirmed. | Shops: search, in-stock only by default (switch), four-button pager. Collection follows the last purchase/opening and explains an empty game. |
| 7 | Outdated copy | Mostly confirmed (see list below). | Fixed; the battler legend checks whether the card has art. |
| 8 | HTML5 packaging | Measured (section 3). | Measurement script; no restructure. |
| 9 | Verification | Section 2. | New suites in `run_all_tests.sh`. |

### Estimates (item 5)
`M.est` (`src/tcg/kit/market.js`) blended 45% model fair value with 55% of the median of up to six recent sales **regardless of how many there were**, so one odd sale dominated a thin market (this is the reported "comparable sales rose while fair value stayed low"). Now:
- sales weight = `min(0.55, 0.7 * n / (n + 3))` (n=1: 0.175, n=3: 0.35, n=10: 0.54),
- with fewer than 8 sales each sale is clamped to within 2.2x of fair value (4x otherwise) before the median, so a real market move (many consistent sales) still moves the price, a single outlier does not,
- the estimate returns `fv`, `med`, `cl`, `n`, `thin`; card pages show "Model fair value / recent sales of this print and grade (n, median) / asking prices are in the Market".
Limit: sales are matched by print and grade. Raw sales do not record condition, so a raw near-mint and a raw lightly-played sale of the same print are still compared.
Rounding: offers, previews and settlements all use cents (`money(x,true)`, `Math.round(x*100)/100` in `transfer`).

### Outdated copy fixed
Settings (baseball start-over and About text; now accurate for three games, plus pack-hint switches and "show the first steps"), `PACK.about`, Tidemark intro (release state is read from the date), "Designed for Version 1, not canon" (Tidemark card page) and "Proposed, not tested or canon" (Broken Reach card page) replaced by plain labels, the Broken Reach intro ("a proposal, not canon"), the battler's "Approved artwork is pending" (shown only when the card has no art), the Tidemark opening summary's unnamed-bulk lines (the catalogue has no bulk), the metagame pages' "Most played cards" (lists only cards in current decks; it listed older cards at 0%), fresh-pack condition ("Pack fresh, centering flawed (lightly played by grade)" for factory flaws on an unplayed pull). Duplicate rarity labels: **not reproduced.** A scan of Home, the three shops, the Market, Collection (cards, sets, grading), card pages and card-design pages in all three games, with cards opened in each, found no label repeated across a separator (`·`, `,`, `-`, `/`); no change made. If you can send a screenshot of the original, I will look for it.

## 2. Verification (headless Chromium, phone viewports; run 2026-11-01)
Run with `sh tools/run_all_tests.sh --golden` against a fresh `python3 tools/build.py`, then individual reruns where a suite failed.

| Suite | Result |
|---|---|
| `check_globals.py` | pass, no duplicate globals (sports 997, comics 997, tcg 1,801) |
| `shelltest` sports / comics / tcg | `ERRS []` for all three |
| `playtest sports` | `ERRS []` |
| `wildkintest`, `duskfalltest`, `tidemarktest`, `tidemark_ui_test` | all pass |
| `brokenreachcollecttest`, `brokenreach_uitest`, `node tools/brokenreach/test.js` | all pass |
| `test_art_pipeline`, `test_br_art_pipeline` | pass |
| `purchase_routes_test` (new) | **pass, 5 of 5 consecutive runs** after fixing the test's choice of print (see below) |
| `opening_test`, `market_safety_test`, `home_test`, `browse_test`, `br_layout_test`, `phone_layout_test` (all new) | pass |
| `soak_test` (new) | pass: low-budget start, 420 days, all three franchises, sales and NPC offers settled, Express grading submitted and returned with grades, backup exported and imported into a separate slot (same day and card count), reload after one year |
| `golden.py check` | failed before re-capture (screen text, new estimate fields, one collection total 34.80 to 34.85); re-captured with a logged reason; **passes after**. No cash, ownership or economy value moved. |

Test-side faults found and fixed while verifying (not game bugs): `purchase_routes_test` assumed the online shop was always the cheapest source (Home shows the cheapest source, which may be the marketplace); `soak_test` listed 10-cent commons at a $1 floor (nothing should sell), always chose the same listing type, and called the asynchronous `ACT.adv` without waiting.
Not run in this pass: `tidemark_econ2_test`, `wildkin_econ`, `tidemark_econ` (economy measurements; the valuation change affects only displayed estimates and collection totals, not prices or trades), the timed 45-minute booster-free retention session, any physical iPhone or Safari test, any itch.io iframe test.

## 3. HTML5 packaging (measured with `tools/itch_package.py`)
`dist/tcg` (the only build that would be uploaded): **1,811 files, 108.3 MB**; largest file 3.47 MB (`game.js`), then `vendor/three.min.js` 0.67 MB and 0.5 MB paintings.
| Group | Files | MB |
|---|---|---|
| Tidemark illustrations (`art/TMI-*`) | 1,254 | 53.4 |
| Wildkin cards, products, objects | 276 | 37.7 |
| Broken Reach (`art/br-*`) | 210 | 9.8 |
| Wildkin scenes | 60 | 3.1 |
| Code, styles, vendor, icons, battler page | 11 | 4.3 |
Limits used (as quoted in the audit, **not re-checked against itch's documentation**: the build sandbox cannot reach itch.io): 1,000 files, 500 MB, 200 MB per file. Result: size and largest file are far inside; **the file count is 811 over**. No file in `dist/tcg` is unreferenced (every art file name appears in `game.js`) and there are no duplicate large files, so nothing can be removed to fix it.
Progressive loading is already true: the launcher and Home request 3 art files (0.2 MB); the Market and Collection about 13 (0.6 MB). The service worker pre-caches only five files.
Least disruptive fix if the file limit applies: pack the 1,254 Tidemark paintings (the only group big enough to matter) into per-set image sheets of about 20 paintings with a small index, and draw each card from its sheet region. 1,254 files become about 65 and the total about 620. That touches `tmLoad`/`render.js` and the art build, so it is **not done here** (the brief says not to rewrite asset loading for an assumed limit). Decision needed from the owner: does the target host enforce the file limit (an itch upload would show it immediately).

## 4. Recorded as unresolved (not completed, replaced or removed from launch scope)
- **Rift Parade**: not implemented; its data and rules have not been supplied to this repository (see `design/tcg-population-economy.md` phase 5).
- **The Hunt for cards**: not implemented (Wildkin has no Hunt, follows or chases).
These were on the earlier alpha checklist and remain open.

## 5. Known remaining defects and unverified areas
- No physical-device or Safari testing; no itch iframe testing; the condensed font does not load in the sandbox browser, so tab labels were seen only in a fallback font.
- Home: "Needs you" has no restock row (the next restock date is shown in the shop, not computed for Home). News rows explain ownership ("you own N copies") and open the card or shop, but do not explain price direction.
- Estimates cannot separate raw conditions (see above). Auction proxy bidding is unchanged.
- Collection still has six rows of filter pills; Settings and the 3D viewer controls have only had the shared theme.
- The battler (`dist/tcg/broken-reach/`) was only touched for the legend text; its look and layout are unchanged and out of scope.
- Golden baselines were re-captured for the look-and-feel and Home changes (screen HTML only).
