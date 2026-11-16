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

## 4. Where interested and advanced players lack explanations

| # | Finding | Evidence |
|---|---|---|
| A1 | **No "why did this move?"** A card page shows a range and recent sales, but not which inputs changed (deck use up, tournament win, ban, novelty fading, out of print, sales pressure). The simulation knows; the player cannot see it. | `valueBasisHTML` shows sale count only |
| A2 | **Three different numbers are not kept apart.** The estimate (model plus sales), actual sales (shown as a short list and sparkline) and what you could sell it for **now** (best shop offer, or quick sale) are not shown side by side. Net worth uses full estimates, which overstate quick-sale value by roughly 30% to 40% for an ordinary collection (allowance robot: $2,000 to $2,560 on paper, $1,220 to $1,650 if sold quickly). | `netWorthNow` (`journal.js:3`); `economy.md` |
| A3 | **History is thin.** Only the last 24 sales of a print are kept, and the model value itself has no history, so "this card doubled since the championship" cannot be shown. | `kit/market.js:61` (sales capped at 24) |
| A4 | **Supply signals are mostly invisible.** The grading population is shown; copies listed now, copies in shops and (for Tidemark vintage) copies left are not, or not in one place. | card pages |
| A5 | **No hobby digest.** The news lists events one by one; there is no weekly "what happened in the hobby" view tying movers to causes and decks. | news feed |

## 5. Proposed plan (bounded, in order; each step separately approved, tested and committed)

The order puts honesty and explanation first (no change to how prices behave), then a phone measurement, then the economic changes that need the owner's approval because they move prices.

### Step 1. Tell the truth about prices (no change to prices or play)
- **Price breakdown on card pages** ("Why this price", folded by default): today's value split into the model's actual inputs (collector demand, deck use, tournament buzz, legality, out of print, novelty, recent sales pressure) and what changed since 30 days ago. Uses the real factors from `tcFairRaw` and its siblings; to compare with the past, keep a small weekly snapshot of the factors for cards the player owns, wants, has pinned, or that moved most (bounded size, saved).
- **Three numbers, labelled the same way everywhere:** *Estimate*, *Recent sales* (count, median, last), *Sell now* (best shop offer today, or "no shop wants it"). Add a *quick-sale value* next to net worth in the journal.
- **Remove the canned release line;** say what the shelves actually did (or nothing).
- Tests: the breakdown must add up to the price shown; snapshots survive save and load; golden suite unchanged except screen text.
- Size: small to medium. **Changes no price and no outcome.**

### Step 2. Measure on a real phone (no code)
- One session on an iPhone (the owner's first play) with the release candidate, noting any stall longer than about 3 seconds and the date. Decides whether Step 4's performance item is needed.

### Step 3. Progressive disclosure, same game (no change to prices)
- **Casual default:** card tiles and the collection can hide dollar values (a per-save switch, off by default for new games or offered in first steps; to be decided with the owner). Prices stay one tap away.
- **Interested layer:** a weekly *Hobby report* (one screen, from the simulation only): biggest movers with their cause from Step 1, most-played decks and what changed, bans and releases, what sold for most. Linked from Home, never forced.
- **Advanced layer:** on card pages, folded *Market details*: estimate history (from the Step 1 snapshots), all recorded sales, copies listed now, copies in shops, grading population, and for Tidemark vintage, copies left.
- Size: medium.

### Step 4. Make supply and demand real (changes prices: needs explicit approval)
- **Supply into price for Wildkin and Broken Reach**, in the same bounded way Tidemark's vintage market already does: copies listed and in shops against copies held, with a bounded multiplier; out-of-print scarcity from surviving sealed and NM copies instead of a timer.
- **Symmetric demand pressure:** listings that do not sell, price cuts and large dumps lower pressure as sales raise it.
- **Box never below its packs** after print end.
- Re-run: robot validation on five seeds (the launch-flipping figure included), economy scripts, golden suite with a logged re-baseline, ownership invariants. Report how strategies' returns changed; do not tune them to be equal.
- Size: medium to large. **Moves prices and outcomes; existing saves would see their prices change on load (cards and ownership untouched).**

### Step 5 (only if Step 2 shows it is needed). Remove the Monday stall
- Give the weekly deck-brewing tests seeds that do not depend on the day, so they can be played ahead during the week like ban days already are. **Changes which decks appear (a different but equally valid metagame), so it needs approval.**

### Not proposed
Separate casual or expert modes; nerfing profitable strategies; new franchises, shops or mechanics; a dashboard.

## 6. Decision needed
Approve Step 1 (honest price explanations and the three labelled numbers, no change to prices) to start. Steps 3 to 5 each come back for approval with their measured effect.
