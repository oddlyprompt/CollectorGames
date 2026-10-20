# Tidemark economy v2: proposal (for review, nothing implemented)

Status: implemented 2026-10-20 (owner decisions: older saves keep v1 with an optional rebuild and backup; 2,500 to 3,500 raw copies as a test target; finite seller-backed Saltmarket). The implementation notes and measured results are in CLAUDE.md; differences from this proposal: the economy flag is `G.xtg.ecv`, the sealed 0.8-1.4 'opening ratio' became 'no arbitrage above 1.4x and not beyond 33x contents' because sealed vintage trades at a collector premium, 'metagame and Wildkin bit-identical' became 'Wildkin and v1 worlds bit-identical (golden suites); a v2 world\'s metagame is checked statistically (the economy code uses its own random streams but the shared market still draws from the world\'s)'. Original proposal 2026-10-19. Owner brief: make the ten-year history authentic through vintage condition scarcity, real availability, historical market evolution,
collecting behaviour, sealed-product scarcity and appropriate pricing. Two requirements from the owner: (1) the simulated history must change real supply and availability, not only
price graphs; (2) vintage Near Mint (NM) needs authentic rarity, designed and tested rather than set as arbitrary percentages, so a well-preserved 2016 card is a meaningful find.
Everything below is **decided/designed by Claude, not canon**, until you approve it. Wildkin is not touched.

## 1. What the game does today (measured, 2026-10-19, seed run on the current build)
| Finding | Measured | Why it is wrong for a ten-year history |
|---|---|---|
| Vintage cards are made fresh | Half of the old copies are created as "pulled", which uses the pack-fresh condition whatever the age: 77% NM, 17% LP | A 2016 card is as likely to be NM as a 2025 card |
| Wear stops growing | Condition for age 5 and age 10 is the same (the age curve is capped near 5 years) | Nothing gets worse after year 5 |
| Result | NM share of raw First Tide copies 39%; 40 to 55% for sets 5 to 9 years old | Vintage NM should be a small minority |
| Copies are scattered by a formula | Copies per card in the whole world: 0.2 to 1.8 per named card, from a Poisson draw by rarity and a flat 7%-a-year loss | The count is not tied to any print run, opening or loss; nothing after day one changes it |
| No history of what happened to copies | Nothing records opening, loss, damage, grading or hoarding | So scarcity cannot respond to what the player or the NPCs do |
| Almost nothing is graded | 9 slabs in the whole world | Vintage slabs and population reports have no depth |
| Sealed is plentiful | 138 of 300 live listings (46%) are sealed; 10 First Tide sealed items in the world | A ten-year-old box should be rare and rarely sold |
| Saltmarket ignores scarcity | Every printing of every set is in stock, near mint, at market plus 15% (about 65% of the old Legendaries at any time) | The player can buy any vintage NM card on demand |
| Price comes from age, not supply | Original printings gain 22% a year; the reserve list up to 4x; the number of copies does not enter | A card with one copy and a card with fifty price the same |

## 2. The model: a ledger of what happened to every card
Instead of drawing copies from a formula, the game keeps a **census** per print (`G.xtg.cen[key]`): how many copies exist in each condition band, how many are graded (by grade) and, for each set, how many sealed packs and boxes exist.
The census is built once when a new game starts by replaying ten years, then carried forward by the same rules every month while you play. The NPC collectors' copies are a **sample of the census** (the game world is a market of about 50 collectors, the census is the whole market), so what is for sale is always a consequence of what is left.

### 2.1 Replaying a set's life (once per historical set, at new game; deterministic from the seed, own random stream)
1. **Print run and opening.** Packs opened by the market in the set's first year: `Q(set)` packs, growing with the years of the game (the game was small in 2016, large by 2025). Each pack is rolled with the real Tidemark pack structure (`tcRollPack`/`xtRollPack`), so the named-card odds, foils and the "unnamed slot is bulk" rule are what they are today. The cards become the set's first cohort; a share of packs and boxes is kept **sealed** (hoarders and shops), a share is opened.
2. **Who holds them (care classes).** Each opened card goes to a holder type: collector (sleeved, binder), player (decks, travels), casual (loose). The mix moves with the years as the culture matures (collectors 12% in 2016 to 35% in 2025).
3. **Each year after release** every card in a cohort is run through the yearly rules:
   - lost or destroyed with probability by holder and rarity (commons are thrown away far more than Legendaries; low-value cards leave faster);
   - wear: steps down one band (NM to LP to MP to HP to DMG) with probability by holder; players' cards wear faster while the card is in Standard;
   - valuable cards are protected: when a card's value passes thresholds the holder moves it up a class (sleeved, then graded), so rare cards are better preserved than commons;
   - grading: the chance a raw copy is graded each year rises with value and condition (only NM and LP are worth sending); a graded copy leaves the raw pool and adds to the population report;
   - sealed product: each year some sealed packs and boxes are opened (more when the contents are worth more than the sealed price, which is what opens boxes in real life) and some are lost; opening feeds the cohort with fresh copies.
4. **Hoarding and dealers** (section 4) decide how much of the census is locked away and how much is on the market.

### 2.2 Parameters (first proposal, to be calibrated by the tests in section 7)
| Holder | Share (2016 to 2025) | Lost per year | Wears one band per year |
|---|---|---|---|
| Collector | 12% to 35% | 0.8% | 4.5% |
| Player | 38% to 40% | 6% | 24% (more while in Standard) |
| Casual | 50% to 25% | 14% | 30% |
Rarity multiplier on loss: common 1.6, uncommon 1.2, rare 0.8, Legendary 0.4. Entry condition is today's pack-fresh condition (77% NM, 17% LP, 5% MP, 1% HP), which is not changed.

### 2.3 What this predicts (cohort calculation with the table above; the real simulation must reproduce it)
| Cohort | Age | Copies left | NM | LP | MP | HP | DMG | NM copies per 100 pulled |
|---|---|---|---|---|---|---|---|---|
| Common | 1 yr | 90% | 64% | 28% | 7% | 2% | 0% | 57 |
| Common | 10 yrs (2016) | 28% | 21% | 22% | 20% | 17% | 20% | 6 |
| Rare | 10 yrs (2016) | 50% | 14% | 19% | 21% | 20% | 26% | 7 |
| Legendary | 10 yrs (2016) | 70% | 11% | 17% | 22% | 21% | 29% | 8 |
| Today (v1), any rarity | 10 yrs | not modelled | 39% | | | | | |
So a 2016 NM copy is about 1 in 14 of the cards pulled and about 1 in 7 to 1 in 9 of the survivors; a 2016 card in GCS 10 condition is rarer again because only the cleanest NM copies qualify.
Modern sets are unchanged: a Tenth Tide pack, box, price table and the metagame are not part of this.

## 3. Materialising the census into the game
- **Sample.** At game start NPC collectors receive copies drawn from the census, scaled so the game holds about 2,500 to 3,500 vintage raw copies (about 700 today) so that the market has enough to browse but not enough to buy anything on demand. The scale is the one number we calibrate for how the hunt feels (open decision below).
- **Real consequences.** A copy that is sold, graded, opened, destroyed or kept leaves or changes the census immediately. If you buy the only NM copy of a card it is gone from the market until its owner sells it; grading moves it from raw to the population report; opening a 2016 box removes it from the sealed census and adds its cards. The monthly step keeps applying the yearly rules in twelfths, so the history continues rather than freezes on day one.
- **Population report** is the census of graded copies (not the 9 slabs there are now). A vintage GCS 10 is rare because the model made it rare.

## 4. Availability and collecting behaviour
Each NPC type gets a listing propensity (how often it sells) in place of one shared rule:
| NPC | Behaviour in v2 |
|---|---|
| Players (xpl) | Hold what is in Standard, sell cards that rotate out, hold few vintage cards |
| Completionists/master-set (xtm) | Hold and almost never list their set; sell duplicates only |
| Fandom collectors (xtl) | Hold premium and Legendary cards; list on a price spike |
| Dealers/flippers (xfl) | List fast with a markup; carry the stock the player can actually find |
| Sealed collectors (xsl) | Hold sealed product; list rarely; the main holders of old boxes |
| Graders (xgr) | Buy raw NM vintage, grade it, list the slabs |
Plus **events** with news lines: an estate sale puts a few vintage NM cards or a sealed box on the market at once (rare, once or twice a year); a famous player's deck sells; a dealer clears a shelf. These are the "meaningful find" moments that do not depend on the player searching.
**Stores follow the census.** Saltmarket (online singles) lists only what exists: vintage stock is a few copies drawn from NPC sellers (finite, restocked weekly from the census, a vintage premium), modern stock is unchanged. The Lantern Room's case draws from the same pool.

## 5. Pricing
- **Condition multiplier by age.** NM stays 1.0 and the other bands fall faster with age, from the ratio of how scarce each band is among survivors (a 2016 LP is worth far less than a 2016 NM; at a modern set the bands stay as they are, 0.82, 0.60, 0.40, 0.22). The multiplier is bounded so one scarce band cannot run away.
- **Scarcity term.** Collector value for vintage uses the census: `price ~ demand / (available copies)^e`, with a low exponent e (about 0.35), a floor and a cap, and with the present age/reserve-list premiums kept as the starting point and the envelope (a v2 price never leaves 0.5x to 3x of the v1 price for the same card without the test reporting why).
- **Graded copies.** The GCS-10 scarcity factor (now a flat 1.12 when the population is under 4) becomes a smooth function of the population report.
- **Sealed.** Sealed price comes from the sealed census plus the value of what is inside (EV of the pack in vintage NM terms): price rises as the census falls, never below EV minus the cost of opening, and never so far above that nobody opens (test below). A First Tide box stays near today's order of magnitude (about $1,600) unless the census says otherwise.
- **Market eras.** A small, documented set of market-wide eras for Tidemark's ten years (decided, not canon): growth, a speculative boom, a correction, steady growth. They shape the yearly demand index used when the history is replayed, and are the same in every world (details vary by seed).

## 6. Historical market evolution you will see
Each print gets a replayed price history from the same model (sales in `G.sales`, the trend arrow and the price chart in the card's sheet), so a card that peaked in its Standard year and fell after rotation looks like it did, a reprint in Tenth Tide moves the older printings as designed today, and the reserve list holds. Nothing here changes which cards exist.

## 7. Simulation tests (all must pass before this ships)
| # | Test | Pass condition |
|---|---|---|
| 1 | Ledger conservation | Over 3 simulated years, every copy is accounted: opened + sealed = printed; sold + graded + lost = removed; nothing appears from nowhere (exact equality) |
| 2 | Condition by age | For ages 1, 3, 5, 7, 10 and each rarity, the NM, LP, MP, HP, DMG shares of the live census fall inside the ranges in 2.3 (+/- 4 points) over 20 seeds |
| 3 | Vintage NM is a find | For each of the first six sets, the expected number of NM copies of a named card visible for sale in a year is stated per rarity and falls in the agreed band (proposed: a 2016 Legendary NM seen 0 to 3 times a year, a 2016 common NM 5 to 40) |
| 4 | Real consequences | Scripted player actions: buy the only NM copy -> next 8 weeks that print has no NM listing; grade a copy -> raw census down by one, population up by one; open a vintage box -> sealed census down by one and cards up by the pack contents |
| 5 | Price coherence | Opening-versus-holding ratio for each vintage sealed product between 0.8 and 1.4; no raw vintage price outside 0.5x to 3x of v1 (report each outlier); modern prices, Tenth Tide pack/box and the META line unchanged |
| 6 | Robustness | 20 seeds x 36 months: no negative census, no card with more NM than copies, no price below the floor or above the cap, boot time under +0.5 s, save size under +60 KB compressed |
| 7 | Isolation | The economy uses its own random stream; with v2 on, the metagame results (META line) and Wildkin are bit-identical to now |
| 8 | Regression/golden | Wildkin goldens bit-identical. Tidemark goldens for v1 saves unchanged. Tidemark v2 scenarios get new baselines only after you have seen the diff report |
| 9 | Save compatibility | Old saves open and play; your copies, slabs, listings, offers and journal are never rewritten |

## 8. Rollout and risk
- v2 is an economy version in the Tidemark line (`XT_ECON.version='v2'`), implemented as strategy replacements (condition, supply, pricing, trading, history), the pattern already in the kit. v1 stays reproducible.
- **New games** use v2. **Existing saves** keep playing v1 for their NPC market (no surprise changes to a running game); your cards are never touched. (Open decision: also offer an optional "rebuild the vintage market" on load.)
- Costs: a census of about 730 prints x 12 numbers (about 40 KB raw), replay at game start (target under 0.5 s).
- Risks: the sample scale decides how the hunt feels (too few copies and the market looks empty, too many and nothing is rare); NPC propensities interact (tests 3 and 6 will tell). Each parameter table above is a first proposal; tests set the final values, and every change is recorded with its reason, as in `balance.js`.

## 9. Decisions for you
1. **Old saves:** keep v1 market (recommended), or offer a rebuild.
2. **How rare is vintage in the world:** the proposal above (about 2,500 to 3,500 vintage raw copies visible, 2016 NM roughly 1 in 14 pulled). Say if the hunt should be harder or easier.
3. **Saltmarket vintage:** finite, from real NPC sellers (recommended), or keep an "always something, at a big premium" backstop for the oldest sets.
