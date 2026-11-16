# Audit against the core principle: "deep simulation, simple experience" (2026-11-16)

Owner's principle: a deep, believable, self-sustaining hobby world that stays effortless to enjoy casually; one world for casual collectors, enthusiasts and strategists; progressive disclosure, not modes; prices from identifiable mechanisms, never invented explanations; heavy simulation must not stall the interface.

Evidence: the code on `claude/first-play` (references below), the five-seed economy validation (`design/first-play/economy.md`), the performance work (`design/first-play/performance.md`) and the independent reviews of the studio overhaul. **No human has played the game yet**, so everything said here about how it *feels* is a judgement from code and screenshots, not observation.

**Status: audit and proposal only. Nothing in this document has been implemented. Approval is needed before any of it starts.**

---

## 1. What already meets the principle

| Principle | Where it holds | Evidence |
|---|---|---|
| Metagame drives prices through a real mechanism | Play value = how much the simulated decks use a card (`usage`), times tournament hype (`hy`, added by top-8 results and bans), times legality | `tcFairRaw`, `tcg_value.js:14`; `tcg_world.js:151, 181`; the same in Tidemark and Broken Reach |
| Tournament outcomes are real | Swiss events and finals are played by the rules engine; bans are decided by testing the deck without the card | `tcg_world.js`, `tm_world.js` |
| Real copies, real ownership | Every card is a copy owned by someone; shops, yard sales and shows sell real copies; nothing is conjured | `retail_test.cjs`, `hunt_test.cjs` check ownership every 50 days |
| Supply and scarcity, in one place | Tidemark's ten-year market counts surviving copies and prices vintage cards by how many are left | `tm_econ2.js`, `xtV2Mult` |
| Retail inventory is real | Shelves, orders, limits and a sold-out figure measured from real shelves feed sealed prices | `tcg_retail.js` (`pulse`, `limitOf`) |
| Profitability is not equalised | Strategies range from -69% to +116% over 18 months; nothing was nerfed to even them | `economy.md` |
| Estimate vs sales, partly | Card pages show a range, say how many sales back it and why a range is wide | `valueBasisHTML`, `M.est` |
| Casual play is possible without finance | Pack hints are off for new saves, the opening summary leads with collection progress, goals and set checklists exist | alpha-readiness pass |
| Deterministic, save-compatible | Worlds come from the seed; performance work proved byte-identical worlds | `performance.md` |

## 2. Where the economy is superficial or inconsistent

Ranked by how much they undermine "prices arise from identifiable mechanisms".

| # | Finding | Evidence | Why it matters |
|---|---|---|---|
| E1 | **A card's price is a formula, not a market.** Value = rarity base x art appeal x fandom x set prestige x novelty curve x out-of-print timer, plus play value; sales only nudge it (each sale adds 3.5% "pressure" that fades 4.5% a day, capped at +60%). NPCs buy when their own view of that value covers the asking price. The market follows the model; it does not form the price. | `tcFairRaw` (`tcg_value.js:14-22`); `recordSale` (`kit/market.js:61`); `findBuyer`, `marketTick` (`market.js`) | Bargains, spikes and corrections can only come from the model's inputs, never from many sellers or few buyers. |
| E2 | **Supply does not enter Wildkin or Broken Reach prices.** How many copies exist, how many are listed or how many sit in shops changes nothing. Scarcity after print is a timer (+28% a year), not a count. Only Tidemark's vintage market counts copies. | `oop` term in `tcFairRaw`; contrast `xtV2Mult` | "Scarcity" and "print run" are labels, not mechanisms, for two of the three games. |
| E3 | **Demand pressure only pushes up.** A sale raises pressure; a pile of unsold listings, a cut price or a dumped collection lowers nothing (pressure only decays). NPC listings drop 8% every eight days to a 99-cent floor, but the card's value does not follow. | `recordSale`, `market.js` price-cut rule | No oversupply crash, no correction caused by sellers outnumbering buyers. |
| E4 | **Boxes can be worth less than their packs.** After print ends, a box stays at list while any box is on a shelf, while loose packs already rise (Tenth Tide: pack $7.45, box $149). | `tidemark_econ.py` run, `READINESS.md` | Visible inconsistency an advanced player will spot. |
| E5 | **One canned claim.** Every release day says "Stores report long lines... Boxes are expected to sell out within days", whatever the shelves do. Other news lines are tied to real events. | `tcg_world.js`, `tm_world.js`, `br_world.js` (release) | A rationalisation not traceable to the simulation. Small, but against the principle. |
| E6 | **Launch-week flipping is the best strategy by far** (+116% median against +28% for the full hunt). It comes from a real mechanism (limited shelves while a product is hot), so it is not a defect by this principle, but it is worth seeing whether E1 to E3 change it before deciding anything. | `economy.md` | Not a target for nerfing; a measurement to repeat. |

## 3. Where casual play may be obstructed

Not observed with a person; judged from code and the screen reviews.

| # | Finding | Evidence |
|---|---|---|
| C1 | **Money is on almost every screen.** Card tiles, Home and the collection show dollar values; a collector who does not care still reads prices everywhere. There is no "just show me my cards" view. | card tiles, Home KPIs, Collection |
| C2 | **Seven tabs and three games at once.** Home, Stores, Wildkin, Tidemark, Broken Reach, Market, Collection. A newcomer meets three franchises, five shops, seven chains, a market and a hunt in the first minutes. | `src/packs/tcg.js` |
| C3 | **Some game weeks stall.** Up to about 4.6 s on a desktop on some Mondays after a Tidemark ban (worst measured), roughly three times that on a phone (estimate; never measured on a phone). A casual player tapping Next day will feel it. | `performance.md` |
| C4 | **"Needs you" can push market chores** (offers on listings, auctions) onto a player who only listed one card. It is opt-in by listing, so this is mild. | `tcg_home.js` |

## 4. Owner's clarification (2026-11-16): deduce, don't explain

> "The player just needs to be able to deduce how the mechanics work, not be explained. An advanced collector should know: the meta changed, it's a rare card, supply is low now, I can price high, but I expect more sellers to list and drive the price down."

So the game must not narrate causes (no "why this price" breakdowns). What it needs is (a) mechanisms that **behave the way a real hobby behaves**, so a knowledgeable player's expectations come true, and (b) the **raw evidence** a collector would look at, in plain view: what is listed and at what asks, what actually sold, what decks are winning, what got banned or reprinted, what is still on shelves.

Measured against that, the gaps change:

| # | What a collector would expect | What the game does now | Evidence |
|---|---|---|---|
| D1 | High prices bring sellers out; listings pile up; the price comes back down. | **Does not happen.** Collectors pick cards to list at random with a fixed chance of keeping them; the price on the market has no effect on whether they sell. | `M.npcList`, `kit/market.js:39-41` |
| D2 | Many listings and few buyers push prices down. | **Does not happen.** Sales raise "pressure"; unsold listings and price cuts lower nothing. | `recordSale`, `kit/market.js:61` (E3) |
| D3 | A short supply raises prices; a reprint or a flood lowers them. | **Only for Tidemark's old sets.** Wildkin and Broken Reach scarcity is a timer. | E2 |
| D4 | The price a card sells at is set by buyers and sellers. | **Mostly the model's number,** nudged by sales. | E1 |
| D5 | A collector can see the evidence: how many are listed, at what asks, recent sales, deck share, who won. | **Partly.** Recent sales (last 24), grading population, deck shares and tournaments are visible; the number listed and the spread of asks for one card, and shelf stock across town, are not in one place on the card. | card pages |

The explanation items in the first draft (a "why this price" breakdown, a hobby report that names causes) are **withdrawn**. Showing the three numbers apart (estimate, actual sales, what a shop pays today) stays, because they are evidence, not explanation.

## 5. Revised plan (bounded, in order; each step separately approved, tested and committed)

### Step 1. A market that responds (changes prices: needs approval)
The core of the principle. All three games share this market code (`src/tcg/kit/market.js`), so one change serves all three.
- **Sellers respond to price.** A collector compares the going price (recent sales and asks) with what the card is worth to them; the higher the market runs above that, the more likely they list, and the more they ask. A spike draws copies out.
- **Listings and failed sales push down, sales push up.** The price pressure term becomes two-sided: unsold listings, price cuts and many asks against few buyers lower it; sales at or above ask raise it.
- **Supply counts for Wildkin and Broken Reach,** bounded, the way Tidemark's vintage market already counts: copies held and listed against the number in existence; after print, sealed and near-mint copies left instead of a timer.
- **A box is never worth less than its packs.**
- Test: robot validation on five seeds (launch flipping included), economy scripts, golden suite with a logged re-baseline, ownership invariants, plus a new check that a spike draws listings and fades (a card's price after a tournament win rises, listings of it rise, and the price comes back toward its new level within weeks). Report how each strategy's returns change; do not tune them to be equal.
- Existing saves keep every card and every copy; their prices change on load.
- Size: medium to large.

### Step 2. Put the evidence where a collector looks (no change to prices)
- On a card page, plainly and without commentary: copies listed now and the range of asks; recent sales (all kept for a year, not only the last 24, compactly); copies on shelves around town for sealed product; grading population; this card's share in the top decks.
- The three numbers kept apart: estimate, last sales, what a shop pays today; the journal's net worth gains a "if sold today" figure beside it.
- Remove the canned release-day line (the news should only report what happened).
- Size: small to medium.

### Step 3. Casual comfort (no change to prices)
- An option to hide prices on card tiles and in the collection for players who only collect (prices one tap away).
- Size: small.

### Step 4 (only if your iPhone session shows stalls). Remove the Monday stall
- Seeds for the weekly deck-brewing tests that do not depend on the day, so they can be played ahead. Changes which decks appear; needs approval.

### Not proposed
Explanations of causes; separate modes; nerfing strategies; new content; a dashboard.

## 6. Decision needed
Approve Step 1, the responsive market. It is the change that makes "supply is low, I can price high, more sellers will list" true. Step 2 is safe to do first if you would rather see the evidence before the prices move.
