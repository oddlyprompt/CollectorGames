# Tidemark product integrity, one shopping world, one population (revised plan, 2026-10-21)

Status: **proposal for the owner's approval. No code, no set-list changes and no new art until this is approved.** Everything marked "recommended" is Claude's recommendation, not a decision.

## 0. Why this plan exists, and the new order
The owner's testing found real defects, not a need for a fancier simulation:
1. **Historical Tidemark products are broken.** Sets with 10 to 21 named cards are sold as 36-pack boosters. Packs fail, hold one card or none, and boxes repeat the same cards. Sealed prices are disconnected from what is inside.
2. **The shopping world is fragmented.** Wildkin and Tidemark have separate stores.
3. **Markets do not behave convincingly.** Prices move through formulas and modifiers, not because collectors act.

Revised priorities (owner, 2026-10-21): 1 resolve Tidemark product integrity; 2 the shared shopping world; 3 the persistent procedural collector population; 4 market behaviour from real supply, demand and transactions; 5 Rift Parade into the ecosystem; 6 storefront, UI and collection overhauls; 7 public alpha preparation. **The Hunt is lower priority and not required for the alpha.** Existing saves may be wiped.

The earlier population, appeal-engine and store ideas are kept (sections 3 to 6), but they come after the product fixes, because a smarter market on top of broken products would only hide the defects.

---

## 1. Tidemark Product Integrity Plan (first workstream)

### 1.1 The audit
Method (`tools/tidemark_product_audit.py`, read-only, reproducible): for every set, the card pool by rarity from `cards.json`; the standard product configuration the game sells (a 15-card booster: 10 commons, 3 uncommons, 1 rare or Legendary, 1 basic or foil; a 36-pack box); then **600 simulated box openings per set** (300 for Tenth Tide: 18,300 boxes and about 659,000 packs per sealed-price formula), counting tracked cards per pack, duplicates, how much of the pool a box shows, and the value of the contents. "Tracked" means a card that exists in the checklist; the game today fills every other slot with an unnamed **bulk** card worth two cents.

Where the thin sets came from: the checklist names only the notable cards of each historical set (`named_cards` in the manifest) but advertises the full size (250 for First Tide, 200 for the other 28, collector numbers like "FT 003/250"). Only 59 First Tide cards were named, because the prototype's 57 plain founding cards live there; the other 29 sets have 10 to 21. See `outstanding_assets.md` decision 7.

**Per set** (current build; "box price before" is the first economy's sealed price, "box price now" is the current one; contents are the mean value of 600 simulated boxes, all cards near mint):

| # | Set | Named | Pool C / U / R / L | Pack config fits the pool? | Packs with 0 / at most 1 tracked card | Tracked cards per box (of 540) | Distinct cards per box | Duplicate share | Copies of the top card per box | Mean box contents | Box price before | Box price now |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | FT | 59 | 25 / 20 / 9 / 5 | valid | 3% / 15% | 113 | 47.9 | 57% | 6.5 | $634 | $1799 | $1629 |
| 2 | SB | 10 | 7 / 3 / 3 / 0 | C 7<10 | 39% / 77% | 33 | 10.1 | 68% | 6.1 | $50 | $1187 | $98 |
| 3 | LH | 16 | 12 / 3 / 3 / 1 | valid | 22% / 58% | 51 | 15.6 | 69% | 6.9 | $103 | $1161 | $213 |
| 4 | IC | 10 | 5 / 3 / 1 / 1 | C 5<10 | 49% / 85% | 25 | 8.8 | 64% | 5.8 | $135 | $1112 | $333 |
| 5 | RW | 15 | 9 / 4 / 1 / 1 | C 9<10 | 30% / 68% | 42 | 13.9 | 66% | 6.5 | $110 | $1088 | $274 |
| 6 | CW | 10 | 4 / 4 / 2 / 2 | C 4<10 | 50% / 85% | 25 | 9.2 | 62% | 5.6 | $67 | $1063 | $152 |
| 7 | OW | 14 | 5 / 7 / 1 / 1 | C 5<10 | 39% / 77% | 33 | 12.3 | 61% | 5.9 | $46 | $859 | $92 |
| 8 | BS | 14 | 7 / 4 / 3 / 3 | C 7<10 | 35% / 73% | 37 | 13.0 | 64% | 6.2 | $37 | $839 | $117 |
| 9 | TF | 18 | 8 / 6 / 3 / 1 | C 8<10 | 28% / 65% | 44 | 16.0 | 63% | 6.4 | $52 | $819 | $117 |
| 10 | MT | 15 | 7 / 4 / 3 / 1 | C 7<10 | 34% / 73% | 37 | 13.2 | 64% | 6.2 | $43 | $780 | $117 |
| 11 | BC | 14 | 4 / 9 / 1 / 1 | C 4<10 | 38% / 77% | 33 | 12.9 | 60% | 5.7 | $28 | $760 | $117 |
| 12 | DF | 15 | 5 / 6 / 3 / 1 | C 5<10 | 38% / 77% | 33 | 12.9 | 60% | 5.8 | $43 | $741 | $117 |
| 13 | SL | 15 | 5 / 7 / 2 / 1 | C 5<10 | 37% / 76% | 34 | 13.0 | 61% | 5.9 | $38 | $701 | $92 |
| 14 | GW | 14 | 6 / 4 / 3 / 1 | C 6<10 | 38% / 76% | 33 | 12.2 | 63% | 6.1 | $39 | $682 | $117 |
| 15 | HM | 14 | 5 / 4 / 4 / 1 | C 5<10 | 42% / 80% | 30 | 11.8 | 60% | 5.9 | $41 | $662 | $117 |
| 16 | FD | 13 | 5 / 5 / 3 / 3 | C 5<10 | 41% / 78% | 31 | 11.8 | 61% | 5.9 | $26 | $557 | $92 |
| 17 | DH | 14 | 3 / 5 / 5 / 1 | C 3<10 | 47% / 84% | 26 | 11.4 | 56% | 5.4 | $35 | $540 | $117 |
| 18 | SV | 13 | 5 / 4 / 3 / 1 | C 5<10 | 43% / 81% | 29 | 11.1 | 61% | 5.8 | $26 | $524 | $92 |
| 19 | LR | 14 | 4 / 7 / 2 / 1 | C 4<10 | 41% / 80% | 30 | 12.0 | 59% | 5.7 | $30 | $490 | $117 |
| 20 | CB | 13 | 4 / 4 / 2 / 3 | C 4<10 | 48% / 84% | 25 | 10.2 | 59% | 5.5 | $33 | $474 | $92 |
| 21 | WT | 14 | 6 / 3 / 4 / 1 | C 6<10 | 40% / 78% | 32 | 11.9 | 62% | 5.9 | $29 | $456 | $92 |
| 22 | BT | 13 | 4 / 2 / 6 / 1 | C 4<10, U 2<3 | 48% / 85% | 25 | 10.4 | 58% | 5.5 | $29 | $423 | $92 |
| 23 | ET | 14 | 5 / 4 / 4 / 1 | C 5<10 | 42% / 80% | 30 | 11.7 | 60% | 5.8 | $26 | $406 | $92 |
| 24 | ST | 15 | 4 / 7 / 3 / 1 | C 4<10 | 40% / 79% | 31 | 12.6 | 59% | 5.7 | $23 | $390 | $92 |
| 25 | NR | 21 | 9 / 7 / 4 / 1 | C 9<10 | 23% / 59% | 50 | 18.7 | 62% | 6.4 | $24 | $336 | $92 |
| 26 | FL | 20 | 11 / 5 / 3 / 1 | valid | 21% / 56% | 53 | 18.1 | 65% | 6.6 | $28 | $322 | $92 |
| 27 | KH | 21 | 8 / 5 / 6 / 2 | C 8<10 | 26% / 63% | 46 | 17.5 | 61% | 6.3 | $27 | $308 | $92 |
| 28 | CS | 21 | 9 / 6 / 5 / 1 | C 9<10 | 23% / 58% | 50 | 18.5 | 63% | 6.5 | $28 | $279 | $92 |
| 29 | RT | 20 | 7 / 7 / 4 / 2 | C 7<10 | 28% / 65% | 44 | 16.9 | 61% | 6.2 | $29 | $242 | $92 |
| 30 | TL | 21 | 10 / 6 / 4 / 1 | valid | 21% / 56% | 52 | 18.7 | 64% | 6.6 | $22 | $229 | $92 |
| 31 | TT | 220 | 103 / 63 / 39 / 15 | valid | 0% / 0% | 513 | 187.5 | 63% | 8.6 | $217 | $230 | $221 |

(Per-set rows: Valid = the pool has at least 10 distinct commons, 3 uncommons and 1 rare or Legendary, the minimum for a pack with no duplicate card. Contents of Tenth Tide are 100% tracked except the basic.)

### 1.2 Findings
1. **26 of the 30 historical sets cannot fill the advertised pack.** Their pool has fewer than 10 distinct commons; Salt and Banner also has no rare or Legendary (its rare slot is filled from an uncommon) and Black Tide has only 2 uncommons. Only First Tide (25 commons), Lanterns of the Harbor (12), Free Lanes (11) and Tidelines (10) meet the bare minimum, plus Tenth Tide.
2. **Packs are almost empty of real cards.** In the 29 historical sets other than First Tide, on average **74% of packs hold at most one tracked card**, and 21% to 50% hold none. The rest of each pack is bulk. First Tide: 3% empty, 12% one card, 56% hold three to five.
3. **Boxes repeat the same few cards.** Each thin-set box shows 9 to 19 distinct cards and 25 to 53 tracked cards in 540; 56% to 69% of the tracked cards in a box are duplicates; the commonest card appears 5.4 to 6.9 times. Tenth Tide, for comparison, shows 187 of 220 cards with 63% duplicates and its commonest card 8.6 times per box. The ratio is similar to Tenth Tide's, but the pool is 10 to 21 cards instead of 220, so opening a box is not an experience.
4. **Sealed price is not tied to contents.** Under the first economy a thin-set box cost **$229 to $1,187 for contents worth $21 to $73** (about 11x to 30x), and First Tide **$1,799 for $304** (5.9x). Under the current build the multiple is 2.0x to 4.2x ($92 to $333 for thin sets, $1,629 for First Tide at 2.6x). That is the right order of magnitude, but the premium comes from a formula (a premium that grows with age, a floor of half retail, a scarcity factor), not from demand.
5. **I could not reproduce "a First Tide box with $7 to $8 of cards".** In 600 simulated First Tide boxes the 10th percentile of contents was $163 under the first economy's prices and $288 under the current ones. The disconnect you saw is real for the thin sets (about 11x to 30x); if the box was First Tide, a very unlucky box is possible but very rare, or the box was a thin-set box. A sealed product that can be worth $1,100 while holding about $40 is the defect, whichever set it was.
6. **The pack-opening screen could not show an empty pack** (fixed in the pull request awaiting merge, but the root cause below remains).

### 1.3 Root causes
- A single product design (booster of 15 cards, box of 36) was applied to every set regardless of how many cards exist.
- Sets are modelled as their named cards plus invisible bulk, so most of every pack is a fiction the player cannot see or use.
- No validator ties a product's configuration to its card pool.
- Sealed price was a formula of age and a floor, not a result of demand and supply.

### 1.4 Recommendations (decisions for the owner)
**A. Stop modelling thin sets as booster sets. Recommended:** classify every set by what it really is.
- **Major sets:** Tenth Tide (220) and **First Tide, the foundational expansion** (needs expanding, see D). These sell booster packs and boxes.
- **Mini-sets (the other 29, 10 to 21 named cards):** they sell **fixed-contents and small products**, not 36-pack boosters:
  1. **Boxed set:** one of every card in the set, sealed (the only product whose contents are always exactly known). The collectible sealed value lives here.
  2. **Mini-booster:** 6 cards (4 commons, 1 uncommon, 1 rare or Legendary, or the best rarity the set has), **no duplicate within a pack**, drawn only from the set's tracked cards, no bulk. A **mini-box is 12 packs** (72 cards, about 5 copies of each card for a 15-card set).
  3. A **starter deck** (fixed 50-card list built from the set's cards) only where the set has at least 17 cards (3 copies each); otherwise none.
  Which of these a set actually sells follows its size, listed in a small data table (`product catalogue`).
- **Why not just expand every set?** It would need about **1,700 new cards and about 200 art sheets** (see section 1.7), nearly three times everything Tidemark has today. That is a content decision for the owner, not something to hide inside a simulation.

**B. Remove the bulk mechanic.** A pack contains only cards that exist. The only untracked card is the **basic** in the 15th slot of a major-set booster (like a Magic basic: never collectible). Collector numbers on printed cards then read "003/059" style out of the cards that exist (this edits how each historical card's collector line is drawn, but no name, art or number of a named card changes). **Needs approval** because it changes the printed collector line.

**C. Sealed value.** Every sealed product shows two numbers: **expected contents** (with a spread: the 10th, 50th and 90th percentile of simulated openings) and **market value sealed**. The sealed collector premium over contents must be explained by demand and scarcity: how many collectors want it (people with a sealed-collecting goal) against how many exist (the census). Until the population exists the premium is a bounded placeholder, and every product page says "collector premium" next to the number.

**D. First Tide as the foundational set.** First Tide has 25 commons, 20 uncommons, 9 rares and 5 Legendaries (59). In a 36-pack box its commons appear 14 times each. Recommended targets (a box with no card more than about 8 times for commons, 6 for uncommons, 3 for rares):
- **Minimum (recommended): +25 cards** (about +20 commons, +5 rares): 84 cards, **about 3 art sheets**, designs and balance for 25 cards.
- **Fuller: +66 cards** (125 cards, close to a real draftable set): about 8 sheets.
Until the expansion exists, First Tide sells as a mini-set (boxed set and mini-boosters) so nothing broken is on sale.

**E. New content and art are proposals only.** I will list the new First Tide cards as a **design proposal** (names, roles, rarity, reasoning) for approval, and nothing is drawn or added to the checklist until you approve it.

### 1.5 Pack and box collation rules (valid-by-construction)
1. **Slots come from a recipe** per product (counts per rarity). A recipe that the pool cannot satisfy **fails the build** (the validator below).
2. **No card appears twice in one pack.** If a slot has no unused card in its rarity, it takes the next rarity down (a fixed, documented order), never a duplicate and never an empty or unnamed card.
3. **Rarity-pool shuffle:** commons and uncommons are dealt from a shuffled bag per box so a box is as even as its pool allows (the same card never appears more than `ceil(slots / pool) + 1` times), the way real collation works; the rare slot is dealt from its own bag with the Legendary rate.
4. **Invariants that must hold for every pack and box generated** (checked in tests, over millions of packs): the right number of cards; every card belongs to the set; no duplicate in a pack; slot rarities as the recipe says; a box has the right number of packs.
5. **Build-time Product Integrity Validator** (`tools/`): runs on every build; fails with the set and the reason when a product's recipe does not fit its pool, a set advertises a product it cannot fill, or a set has no rare for a rare slot. A product that fails is not shown in any store.

### 1.6 Sealed collector value against opened contents
- **Opened contents value** = the expected value of the cards in the product, with spread. It is computed from the product recipe and current card prices.
- **Sealed value** = what a collector pays for the unopened product. It starts at contents and adds a **collector premium**, which in the new market comes from (a) how scarce the product is (the sealed census by set age), (b) how many people want sealed product, (c) condition and age.
- The two are always shown separately, and the tests state the allowed ratio per class of product (see 1.8).

### 1.7 Content and art estimates (only if the owner chooses expansion)
Production today: 657 illustrations in 77 sheets of nine (about 8.5 per sheet).

| Option | New cards | New art sheets | What it fixes |
|---|---|---|---|
| Recommended: First Tide +25, mini-sets use mini products | 25 | about 3 | First Tide becomes a valid major set; the 29 mini-sets get honest products |
| First Tide +66 | 66 | about 8 | a full draftable foundational set |
| Every set to 45 commons, 18 uncommons, 12 rares and Legendaries (75 cards) | about 1,700 | about 200 | every set becomes a normal booster set |
| Merge thin sets into "blocks" of about 45 cards (changes the set list) | 0 | 0 | not recommended: it rewrites release history |

Each new card also needs rules design and balance, as every Tidemark card has had.

### 1.8 Tests for product integrity (before anything ships)
- **Validator coverage:** every product of every set passes the build-time validator; a deliberately broken recipe fails it (the validator is tested).
- **Invariants:** at least 10 million packs and 300,000 boxes generated per product class with zero violations (size, membership, rarity slots, no duplicate in a pack).
- **Collation:** in 10,000 boxes of each major product no commons appear more than `ceil(slots / pool) + 1` times; no mini-box has a card more than twice the average.
- **Pull odds:** per product, the measured Legendary-slot rate, foil rate and per-card pull probability match the recipe within sampling error; every card in a set appears in at least 99% of 100-box samples.
- **Duplicates:** the distribution of duplicates per box (mean, 90th percentile, maximum) is printed for every product and bounded: no box where one card is more than 25% of the tracked cards for a major set; for mini-boxes at most 40%.
- **Contents value:** for every product the 1st, 10th, 50th, 90th and 99th percentile of contents value are printed and compared with the product's price: no product's 10th percentile contents below 20% of the retail price of its class.
- **Sealed vs contents:** the premium of sealed over contents is within the allowed band per class and **moves with scarcity** (an older set with less sealed supply has a higher premium; adding supply lowers it).
- **Screens:** every product opens card by card on the real opening screen in a test that drives the UI (the Tidemark screen test is extended).

---

## 2. One shared shopping world (priority 2)
One persistent set of retailers carrying several games. Each store declares, per game, how much it carries, driven by the game's **popularity score** (its share of the population's attention), regional interest, the store's specialty and real supply.
- **Big-box chains (2):** Wildkin full allocation and weekly restocks. Tidemark a small allocation in some stores, some weeks, newest products only. A niche game may get none.
- **Local game stores (about 5, named, one per region):** each with a specialty depth (for example Wildkin-heavy, Tidemark-deep, general), its own allocation per game, singles case, sealed shelf and buylist. They take turns hosting regionals, favouring stores deep in the game being played.
- **Online singles shops** join the same directory, each with the games it covers and real seller-backed stock.
- **Persistence:** store state, stock, orders and events are saved with the world.
- The Shop tab lists every store, what it carries, when it restocks and what event it hosts.
Depends on: product integrity (a store can only stock valid products).

## 3. Persistent procedural collector population (priority 3)
About a few hundred fully simulated **people** (agents, each with a small brain) plus a crowd of casual people shaping aggregate demand. They are saved with the world and keep identity and history across months.
- **Roles:** player, collector, completionist, investor, flipper, holder, dealer, grader, casual; roles drift.
- **Preferences and budgets:** which games, which stores (region), income and spending cycles, patience.
- **Personal collection (PC) goals:** a character, a deck, a spec, a set, an art style, a grade and condition target, or a sealed collection; chosen from exposure and taste; completed, dropped or replaced.
- **Opinions, including art:** each person forms their own opinion of an illustration from descriptors computed from the image plus personal taste; opinions spread socially (buzz).
- **Actions that create market activity:** buying and selling, acquisitions, liquidations when a collector quits or needs cash, speculation on a card or set, trading, grading, holding sealed, chasing a deck after a tournament.
- **Growth and shocks:** arrivals and departures at a base rate, spikes at releases, preorders, major tournaments, reprint news and random news events; churn after a bad ban or a crash.
Depends on: the store directory (people shop at stores in their region) and product integrity.

## 4. Market behaviour from supply, demand and transactions (priority 4)
- **No artificial movement:** remove the fixed per-sale price bumps, random jitter and hand-written modifiers. A price is set by what people are willing to pay for the copies that exist, using actual transactions, asks, bids and store shelf prices.
- **Price cause log:** every price change records its cause (a demand shift from named goals, a supply change, a sale, an event). A test requires that at least 95% of movement over a year is explained by logged causes and that no price changes without one.
- **Supply:** the census and ledger from economy v2 (copies lost, worn, graded, opened) stay, and sealed supply follows a curve: exceedingly rare for the oldest set, growing toward the current set, depleting when opened.
Depends on: the population.

## 5. A separate appeal engine per game
The shared code asks a game "how strong is each taste dimension for this print?" and the game answers from its own data; the shared code never knows what a "beloved Wildkin" is.
- **Tidemark:** condition, metagame, rarity, synergies (and faction fandom).
- **Wildkin:** beloved Wildkin (mascots, evolution lines, fandom), art, rarity, metagame, condition.
- **Rift Parade (needs its data):** fan favourites, fan service, chase cards, rarity, character design.

## 6. Phases and dependencies
| Phase | Deliverable | Depends on | The owner can check |
|---|---|---|---|
| 0 | Approve this plan and the decisions in section 9 | none | this document |
| 1 | Product Integrity: validator, collation rules, product catalogue (boxed sets, mini-boosters, major boosters), no bulk, sealed shown as contents plus premium, the 15-card booster for major sets; First Tide interim as a mini-set; large-scale opening tests | owner decisions A to D | open products of every set and see real cards |
| 1b | First Tide expansion design proposal (names, roles) for approval, then production | art for about 25 cards | the proposal, then the new set |
| 2 | Shared shopping world: store directory, popularity-driven carrying, five local game stores, regionals | 1 | one Shop tab with all stores |
| 3 | Population: agents, roles, budgets, PC goals, growth and spikes; old collector types removed | 1, 2 | named collectors with goals; market listings from them |
| 4 | Market from transactions: price discovery, cause log, sealed premium from demand, per-game appeal engines (Tidemark first, then Wildkin) | 3 | price changes you can trace to people |
| 5 | Rift Parade into the ecosystem | its card data and rules; phases 2 to 4 | a third game in the same stores and market |
| 6 | Storefront, UI and collection overhauls | 2 to 4 | new screens |
| 7 | Public alpha preparation | all | extended testing |
Every phase ends with the full test run and a pull request for your review; saves are wiped between phases without special handling.

## 7. Test criteria across the plan (what shows it actually works)
- **Packs and boxes:** section 1.8 (millions of packs, collation, pull odds, duplicate distributions, contents value, sealed against contents, the validator itself).
- **Stores:** over a year of simulated play, Wildkin is available at 90% or more of big-box visits, Tidemark 30% to 60%, Rift Parade 0% before release and under 10% after; every game is at one or more local stores; regionals rotate so a store does not host the same game twice in a row; stock is conserved (a store cannot sell what it does not have); store state survives a save and load.
- **Population:** distributions of roles, budgets and goals are printed and bounded; population size follows releases and tournaments (a measurable spike) and falls after a crash; every person's holdings and money are conserved (no money or copy appears from nowhere).
- **Market behaviour:** shock tests: 30 people given a goal on a card raise its price within weeks and it falls when they stop; a liquidation lowers prices of what is sold; a deck rising in the field raises its cards; the price cause log explains 95% of movement; no card or product price leaves a stated band without a logged cause.
- **Exploits:** auction sniping, buying a store out and reselling, buylist arbitrage, cornering a card, regionals as a money machine.
- **Screens:** tapping every listing, store page, product page, opening screen and event page with no error.
- **Performance:** boot under 1 second, a day under 60 ms on average and a month under 2 seconds with 300 simulated people, save under 250 KB compressed.

## 8. Scope and performance risks
- **Scope:** five large pieces (products, stores, population, market, Rift Parade) plus UI work. The order above lets each ship and be tested alone; phase 1 is deliberately small and first.
- **Content risk:** First Tide expansion needs designs and art; expanding every set is about 200 sheets and is not proposed. Printed collector numbers change if bulk is removed.
- **Performance:** a few hundred weekly-ticked agents is cheap; thousands would not be. The crowd is aggregated, not simulated one by one.
- **Emergent-economy risk:** prices driven by people can drift, spiral or collapse. Safeguards: bounded price bands with logged breaches, budget and money conservation, shock tests, and calibration against the same anchors (pack value against retail, chase prices).
- **Test churn:** golden snapshots are re-baselined on purpose at each phase; wiped saves remove compatibility work.
- **No human playtest yet:** every phase should be played by the owner before the next starts.

## 9. Decisions needed from the owner
1. **Mini-sets (29 sets with 10 to 21 named cards):** boxed set plus mini-boosters (recommended) or another product mix? (If you want them as full boosters, that is the 200-sheet option.)
2. **First Tide:** +25 cards (recommended) or +66, and may I write the design proposal for the new cards?
3. **Bulk and numbering:** remove bulk and renumber collector lines as "003/059" (recommended)?
4. **Class of products shown in stores before the population exists:** show the contents value next to every sealed price (recommended).
5. **Local game stores:** about five named stores in five regions, names invented by me.
6. **Rift Parade:** needs its data and rules before phase 5; I have not looked at the `feature/rift-parade` branch.
