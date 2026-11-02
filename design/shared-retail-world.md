# Shared retail world — 2026-11-02

Alpha now has its three products: Wildkin, Tidemark and Broken Reach. Broken Reach replaces Rift Parade for this release. This pass replaces franchise-specific physical stores with a shared local circuit. The procedural Hunt, community progression and card shows remain a separate design task.

## Locations

| Shop | Identity | Singles | Ordering |
|---|---|---|---|
| The Tidepool | Community/play | Affordable raw cards | Thursday, cautious |
| The Lantern Room | Patient collector | Broad raw/graded selection | Tuesday, long coverage |
| The Cargo Cage | Budget digging | Large cheap raw case, occasional better finds | Saturday |
| Corner Pocket Games | Sealed and play nights | None; no buylist | Wednesday |
| The Glass Cabinet | Premium specialist | Select NM raw cards and valuable slabs | Friday |
| Seven big-box branches | Busy and quieter locations across three chains plus Family Market | None; no buylist | Different weekly review days |

All locations carry games in the same world. Filters choose a game within a location; visiting a different franchise does not create another branch. Each location keeps its own stock, cash, sales, buying preferences and last-visit snapshot. Store descriptions, prices, case size and inventory support their identities.

## Stock and demand

Big-box locations have larger launch orders (up to 120 packs/seven boxes per SKU), eight days of target coverage, wholesale discounts and different foot traffic. Recent actual sales, including the player's purchases, feed a smoothed demand estimate. Launch interest decays with product age. Low-demand products eventually stop being reordered and remaining stock is discounted. No new orders after print ends.

Independent shops cap new-product shelves at 24 packs/two boxes per SKU. Longer coverage targets and a small shelf minimum let slow products linger. They retain older stock instead of clearing it automatically. Historical sealed purchases come from existing NPC collections, with a finite twelve-copy acquisition cap per shop; these are not weekly vintage reprints. A review date is an order review, not a guaranteed restock.

Singles are actual copies moved from unlisted NPC holdings or bought from the player. Their identity, condition, grade and certificate remain intact. Shops have finite cash and case capacity. Brand quotas leave room for later releases. Expensive/graded cards are not manufactured to fill the premium case. Scarcity can leave a specialist's case sparse. NPC single purchases require cash and pay the shop; NPC sellers receive the shop's payment.

The supply model is deliberately bounded and local. It does not yet simulate distributor shortages, competing store chains sharing purchase orders, reputation, travel, relationships or staff dialogue. These are tuning/expansion possibilities, not completed features.

## Saves and interfaces

`G.retail` version 1 owns location inventories; the existing copy tables own all singles and historical sealed copies. Store-owned copies use owner `-2` and `rs=<location>`, preserving Tidemark's existing census convention. Legacy shelves are allocated once, legacy case descriptors become persistent copies once, and owned player cards are preserved. Aggregate franchise shelf totals remain available to existing sealed valuation models. Old per-franchise physical restock ticks stop after migration. Online singles catalogues retain their existing economies.

Stores has a shared navigation tab. Directory cards show shop identity and last-visit information. Within a shop: sealed, singles/slabs, cash offers, game filters, name/set search and compact pagination. Big-box and sealed-only locations omit singles/buylist controls. Card-page and Home purchase shortcuts name the actual stocked location. The franchise tabs keep their sealed-opening panels; online catalogues remain accessible from Stores.

Small fixes alongside the store work: seven-tab phone navigation stays on one row; Collection pagers wrap on narrow screens; onboarding states the selected scenario's actual allowance, including zero; readiness notes recognise Broken Reach as the third alpha product. Shop descriptions fold away and purchase buttons have larger phone touch targets.

## Verification

`tools/retail_test.cjs` runs the built game's simulation, transaction, copy-conservation, legacy migration, save normalization, graded-copy and 420-day stock/budget checks without a browser. `tools/retail_ui_test.py` checks real browser clicks, purchases across all three games, selling, search, big-box restrictions, layouts from 320 to 1280 pixels, and save/reload. Both are included in `tools/run_all_tests.sh`.

Browser screenshots use desktop Chromium with a phone viewport, not a physical phone. Physical iOS/Safari, the itch iframe and a timed long-form human playtest remain unverified. Hosting/file-count packaging is unchanged by this pass. Source changes are prepared for review; `docs/` has not been rebuilt or deployed.
