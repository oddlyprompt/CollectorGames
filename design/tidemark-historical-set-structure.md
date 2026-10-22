# Tidemark historical set structure: a focused recommendation (2026-10-21; owner decisions and update in section 9, 2026-10-22)

Status: recommendation for the owner. **No set list, collector number or set identity changes in this document or in any code until you decide.** Read together with section 1 of `tcg-population-economy.md`; where they differ, this document replaces its mini-set recommendation (1.4 A).

## 1. What the data shows that changes the picture
1. **The named cards are not a random leftover; they are evenly spaced samples of the full list.** First Tide's 59 cards sit at numbers 3, 7, 11, 15, 20, 24 ... 248 (about every fourth number of 250). A 200-card set's 10 cards sit at 11, 31, 51 ... 191 (every 20th). So the original design was a full-size set with a sample written down. **Completing a set means filling numbered gaps. No existing card ever changes number.** That answers "do not change collector numbering": nothing needs to change under any option.
2. **A product catalogue can follow the card pool automatically.** If the build-time validator decides which products a set can honestly sell from how many cards it has (section 5), then "mini-set", "hybrid" and "full set" are not three different engines; they are three stages of the same mechanism. Boosters unlock when the pool is big enough. The content strategy therefore does not block the engineering.
3. **A deck uses about 20 different cards** (50 cards, at most 3 copies; the 250-deck library averages 19.8 distinct, range 18 to 21). Tenth Tide's 10 start archetypes use 116 of its 220 cards; **4 archetypes need about 64 cards, 6 need about 88, 8 need about 109.** That is the yardstick for "credible competitive history".
4. **The live game simulates only the Tenth Tide format** (220 cards). Historical formats are not played; they exist as card ratings, prices and lore. So history matters to credibility and to prices, not to the running metagame code.

## 2. The three options, with numbers
Production reference: Tidemark has 657 illustrations in 77 sheets (about 8.5 cards per sheet). Counts below are cards that do not exist today.

| | **1. Preserve advertised sizes** (200 and 250) | **2. Hybrid: one flagship a year, the rest genuine mini-sets** (recommended) | **3. Mini-sets as they are** (First Tide to 125) |
|---|---|---|---|
| New card designs | **5,550** (6,050 advertised minus 500 existing) | **638**: First Tide +66 to 125, nine more flagships +65 each to 80 | **66** (First Tide only) |
| New art | about **650 sheets** (8.5 times today's total); about **490** if a quarter of each set may reprint earlier cards | about **75 sheets** (about one more copy of today's total) | about **8 sheets** |
| What a set is | all 30 sets are normal 200 to 250-card boosters | 10 flagship sets (75 to 125 cards, normal boosters) and 20 supplements (10 to 21 cards, fixed products) | First Tide a booster set; the other 29 are supplements |
| Products | boosters everywhere, 36-pack boxes | boosters for flagships; supplements sell boxed sets and starter products, and mini-boosters only where the pool has real variety | as option 2, but only First Tide has boosters |
| Implementation complexity | the same engine; the content pipeline (checklist generator, art queue, intake) must scale 8 times; 12,000 card keys instead of 1,500 in the market (more memory and time per day, a bigger replay, longer lists in every screen); the library tool would never need to cover historical formats | one validator, two product classes, a staged unlock; 9 new waves of content, each small | the least engineering and the least content |
| Gameplay consequence | huge Eternal-style pool (a two-year window is about 1,200 cards): the history is rich, but nothing in the live game uses most of it | **a two-year window is 208 to 251 cards, the size of Tenth Tide's 220**, so each year has about 8 archetypes | a two-year window is 81 to 124 cards (about 5 archetypes at best, and about 10 cards per faction, so decks are nearly forced); see 3 |
| Long-term maintenance | very high: 5,550 cards to balance, price and keep consistent with the reserve list and reprint rules | moderate: 638 cards plus the supplement rules | lowest |
| Risk | 650 sheets of art is a long production for something most players never use | needs a choice of 9 flagships (default rule below) | the history stays thin; opening old packs is mostly impossible |

**Efficient production levers** (they apply to options 1 and 2): (a) design commons and uncommons from templates and let the existing simulation tools balance them, leaving only rares and Legendaries (about 30% of a set) to be hand-designed; (b) allow reprints from earlier sets in later historical sets, as Tenth Tide already reprints 70 (about 25% fewer new illustrations); (c) release in waves of one set at a time: card design proposal, your approval, art in 3x3 sheets, the existing intake check, and the set's booster unlocks automatically when its pool meets the thresholds; (d) keep numbering stable by filling gaps. None of these removes the need for art; art volume is the real cost.

## 3. Does ten years of competitive history stay credible with mini-sets?
Only if something supplies the missing cards.
- **Without anything else (option 3 as is):** a two-year Standard window is 81 cards in 2018, 83 to 90 in 2019 to 2023, 104 in 2024 and 124 in 2025. By the yardstick above that is 4 to 6 archetypes at most, and with 8 factions it is about 10 cards per faction, so a deck is almost a single faction pair with no choices. Ten years would read as ten years of the same two or three decks.
- **Option 3 plus a core-set rule:** if First Tide's 125 cards stay legal in Standard forever (the checklist already calls it "the core set"), the window becomes **206 to 249 cards**, close to Tenth Tide. This makes option 3 credible at almost no content cost, at the price of the founding cards staying central for a decade (which also supports their reserve-list value).
- **Option 2** gives windows of 208 to 251 cards without a special rule, and each year's flagship adds a real set of new cards that rotates in and out.
- **A concrete benefit of options 2 and 3 with a core set:** the real engine and deck library could later replay each year's Standard (about 15 minutes of offline work per year) to produce what actually won in 2021, and the world's history, news and card price memory would come from play, not from numbers. At 81 cards it could not.

## 4. First Tide at 125 cards and its advertised 250
- **Fit:** First Tide's 250 numbers stay as printed. 125 of them are catalogued (59 now, plus 66 in gaps between the existing numbers, about one of every three gaps) and 125 stay "not yet catalogued". Nothing is renumbered; the checklist can show "125 of 250 catalogued" and later waves can fill more gaps. Packs contain only catalogued cards, so the invisible bulk disappears without touching any collector number. Whether the printed card shows "/250" or a smaller number is the numbering decision you asked me to defer.
- **Recommended composition of the 125** (today 25 C, 20 U, 9 R, 5 L): **55 commons (+30), 38 uncommons (+18), 24 rares (+15), 8 Legendaries (+3).** In a 36-pack box that is 6.5 copies of an average common (today's 59 cards give 14, the 84-card plan about 8), 2.8 of an uncommon and 1.3 of a rare, and any given Legendary is in about 4 boxes of 10. The 19 reserve-list cards stay as they are; new Legendaries are not on the reserve list unless you say so.
- **Cost:** 66 designs and about 8 sheets. 125 is clearly better than 84: with 84 an average common appears 8 times per box.

## 5. The product rule, and the mini-booster rarity discrepancy
**One rule decides what a set can sell, from its catalogued pool** (the build-time validator enforces it; a set advertises only what passes):

| Catalogued cards | Products |
|---|---|
| under 30 | **boxed set** (one of every card, sealed); **starter deck** only if 17 or more cards (3 copies each); **mini-booster** only if the pack has at least 1,000 possible distinct packs (see below) |
| 30 to 74 | mini-booster (8 cards: 5 commons, 2 uncommons, 1 feature slot) and 24-pack box, plus the boxed set |
| 75 or more with at least 40 commons, 15 uncommons and 10 rares and Legendaries | the 15-card booster and 36-pack box |

**The discrepancy:** a mini-booster's feature slot needs a rare, but some sets have none. The rule, applied identically everywhere and printed on the product: the **feature slot is a rare when the set has rares**; a Legendary replaces it about 1 pack in 8 if the set has Legendaries; **if the set has no rares, the slot is an uncommon and a Legendary appears at the same 1-in-8 rate if the set has any; if the set has neither, the slot is an uncommon.** The validator refuses any recipe that would show a rarity the pool cannot supply, and no pack ever contains a duplicate, an unnamed card or a silently substituted slot.

**A second problem the numbers expose:** a mini-booster from a tiny pool is nearly the same pack every time. For the recipe of 4 commons, 1 uncommon and 1 feature, the number of possible distinct packs is, for example, 8 for The Crownwar (4 commons), 9 for Broken Chains, 14 for Black Tide, 20 for Coral Bastion, 30 for Iron Coast, and **0 for Drowned Hymns (3 commons, so it cannot make a pack)**. **20 of the 29 supplement-sized sets cannot support a mini-booster with real variety;** only Lanterns of the Harbor (1,485), Reefward (1,008), Thornfall (1,680) and the six 2024 to 2025 sets (1,470 to 6,600) can. So under any option, **most genuine mini-sets would sell the boxed set and starter products only**; you could not rip a pack of most of them. That is honest, but it should be your choice.

## 6. Recommendation
1. **Adopt option 2 (hybrid), staged.** One flagship per year. Default rule: the year's set with the most named cards (ties: more rares and Legendaries): **First Tide (2016), Reefward (2017), Thornfall (2018), Merchant Tides (2019), Siege of Lanthorn (2020), Drowned Hymns (2021), The Wild Tithe (2022), Stormglass (2023), Keepers of the Light (2024), Crown and Shoal (2025).** You may swap any of them; the names suggest a few better candidates than a count does (for example Siege of Lanthorn and Black Tide sound like flagships and Salt and Banner does not).
2. **Fill gaps, never renumber.** First Tide to 125 first (66 cards), then the other flagships to about 80, one wave at a time; each wave begins with a design proposal for your approval, then art, then the existing intake check.
3. ~~Treat First Tide as the core set~~ (superseded 2026-10-22: see section 9.3, the owner declined an automatic permanent core and the study does not support one once windows are full-size).
4. **Build the engineering now, independent of content:** the validator, the product rule above, collation, boxed sets, no invisible bulk, and the contents-versus-sealed-value display. Until a wave lands, a set sells exactly what its current pool honestly supports; First Tide sells as a supplement until its 66 cards exist.
5. **Do not do option 1** unless you want a very long art production; it can still be approached wave by wave later, because the same mechanism unlocks products as sets grow, and no work in options 2 or 3 is wasted.

## 7. Decisions needed
1. **Option 2 with the default flagship rule** (or your own list of flagships)?
2. **First Tide at 125 with the composition in section 4**, and may I write the design proposal for its 66 new cards?
3. **First Tide as a permanent core set** in Standard?
4. **Supplement products:** boxed set and starter deck for most, and mini-boosters only where the pool supports at least 1,000 distinct packs?
5. **Numbering:** keep every printed number and "/250" until content is decided (nothing changes now).

## 8. Risks
- **Art volume** is the limiting resource under options 1 and 2; the plan is built so a wave can stop at any point with a valid game.
- **Design drift:** new historical cards must fit their year's identity and the reserve-list and reprint rules; every wave is reviewed before art.
- **Price and census changes:** more cards per set change supply and demand in the world; the economy tests are rerun after each wave.
- **Performance** is only a concern under option 1 (about 12,000 keys).


---

## 9. Update 2026-10-22: owner decisions applied, flagship choice, format study, product variety

### 9.1 Decisions now settled
Hybrid structure approved in principle: one flagship expansion per year plus smaller supplemental releases. Every historical set keeps its identity and collector numbers; new cards fill numbering gaps; each set shows its **advertised** size next to what is catalogued ("catalogued 59 of 250"). First Tide goes from 59 to 125 (proposal: `design/first-tide-expansion-proposal.md`, nothing added). First Tide is **not** made permanently Standard-legal (9.3). Product variety is honest to the card pool (9.4). Build order is in `design/tcg-population-economy.md`, section 6.

### 9.2 Flagships chosen by significance, theme and competitive relevance
Not by which set has the most named cards. The evidence I have is: how many of the set's cards were important enough to be reprinted in Tenth Tide (the strongest proxy for lasting competitive relevance), Legendary and rare counts (how much of the set's story it carries), the set's name (theme), and its place in the ten-year story. I have no lore document beyond the names, so the theme column is a reading of titles; correct me where it is wrong.

| Year | Recommended flagship | Why | Alternate |
|---|---|---|---|
| 2016 | **First Tide** | the foundation; 26 cards reprinted in Tenth Tide; 5 Legendaries | none |
| 2017 | **Reefward** | the only 2017 set with a Legendary and a rare and Tenth Tide reprints (2); Sea's first push | The Crownwar (a war title, but 10 cards, no Legendary) |
| 2018 | **Thornfall** | 18 named, 3 rares, 1 Legendary, 5 Tenth Tide reprints (the most of its year) | Open Water, Bastions of Stone |
| 2019 | **Deepforge** | 5 reprints (most of its year), 3 rares, 1 Legendary | Merchant Tides (4 reprints, trade theme) |
| 2020 | **Siege of Lanthorn** | a war title; 4 reprints, 1 Legendary | Harbor Moon (4 rares, 4 reprints) |
| 2021 | **Drowned Hymns** | 5 rares, 1 Legendary; Abyssal Choir's showcase | Fathoms Deep |
| 2022 | **Coral Bastion** | 3 Legendaries (the most of any set before 2024), 2 rares | The Wild Tithe (4 rares, 1 reprint) |
| 2023 | **Black Tide** | 6 rares (the most of any set), 1 Legendary, a dark title | Stormglass |
| 2024 | **Keepers of the Light** | 21 named, 2 Legendaries, 6 rares | New Reaches |
| 2025 | **Return of the Tide** | 2 Legendaries, 20 named, and its title leads into the anniversary | Crown and Shoal (21 named, 5 rares) |

This replaces the default list in section 6. It is a recommendation for the owner to confirm or swap. Waves are done one at a time, each with its own design proposal first.

### 9.3 Standard legality: with and without a permanent First Tide core (study run 2026-10-22)
Method (`tools/tidemark/v1/format_study.js`, a proxy, not the game's own metagame): for each year from 2018 to 2025 take the sets of that year and the year before (the window Standard would use) and build 34 decks with the game's deck builder (the 10 archetypes plus random two-faction brews with tech packages), play a round robin with the real rules engine (6 games per pair), then let a replicator (share update by win rate) settle the field. Four variants per year:
- **A** the real window as it exists today (about 80 to 125 cards, 14 to 21 named per set);
- **B** A plus the 59 First Tide cards as a permanent core;
- **C** a *hypothetical* window of 215 cards (what the window would be once flagships have around 80 cards), no core;
- **D** C with First Tide's 59 cards inside it as a core.
Measures: effective archetypes (inverse concentration of the settled field, higher is more diverse), the share of the top archetype, and how much of the top-5 decks' cards come from the core compared with the core's share of the pool.

| Variant | Years | Effective archetypes | Top archetype share | Core cards in top-5 decks, against core share of pool |
|---|---|---|---|---|
| A: real thin window, no core | 8 | 2.5 to 11 (median about 7) | 16% to 61% (median about 27%) | n/a |
| B: thin window plus core | 8 | 7.5 to 13.4 (median about 11) | 15% to 27% (median about 21%) | 52% to 64% against 32% to 42% |
| C: full window, no core | 8 | 10 to 14 (mean 11.9) | 12% to 19% (mean 17%) | n/a |
| D: full window plus core | 8 | 7.7 to 16 (mean 11.9) | 11% to 23% (mean 18%) | 39% to 54% against 27% |

What it says (with its limits stated below):
1. **A thin window is not believable without help.** With only today's 14 to 21 named cards per set, the settled field has 2.5 to 11 effective archetypes, and in 2018, 2021 and 2022 a single archetype takes 61%, 35% and 44% of the field. A permanent core fixes this (B), roughly doubling effective archetypes in the worst years.
2. **Once the window is full-size, the core adds nothing** to diversity (mean 11.9 against 11.9 effective archetypes; top archetype share 17% against 18%). The diversity comes from having enough cards, not from the core.
3. **The core is over-used where it exists.** In D the 59 core cards are 27% of the pool but 39% to 54% of the cards in the top-5 decks (about 1.4 to 2 times their share); in B 52% to 64% against 32% to 42%. That is the "foundational cards dominate a decade" risk the owner raised, and it is visible here. Part of it is that First Tide cards were balanced early in the design and are plain and efficient; it is a limit of the proxy, not proof about future cards.
4. **Recommendation:** do *not* make First Tide permanent. Instead (a) keep Standard as a rolling two-year window of flagships and supplements, (b) grow flagships so windows reach about 150 to 215 cards (the content strategy already does this), and (c) while a window is still thin, offer the early-years historical formats as Eternal-style or "classic" only, not as the main game. First Tide stays a foundational *collectible* set (its price, its age and its 26 Tenth Tide reprints do not depend on legality). If a core is still wanted later, a *small* rotating "evergreen" slot is the safer form than a permanent set.
Limits: the proxy builds decks from the current card designs, the "hypothetical" full windows add random existing historical identities that are not real cards, 6 games per pair is thin, the replicator is not the game's weekly model, and the game itself only simulates Tenth Tide's format today, so no in-game test is possible yet. This is evidence for a design decision, not a measurement of the finished game.

### 9.4 Honest supplement products
Rule (unchanged): a product exists only if the pool supports it. Applied to the 28 historical supplements (10 to 21 named cards, plus First Tide until it reaches 125):

| Pool | Products |
|---|---|
| under 17 named | Boxed set: every named card once, fixed contents shown, no rarity roll. Optional **collector bundle**: the boxed set plus a numbered alternate foil of its Legendary or best rare (only where the set has one). |
| 17 to 29 named | Boxed set, collector bundle, and a **themed deck** (a fixed 40-card deck built from the set with at most 3 copies of each card; a deck of 50 cards needs 17 distinct cards and so only the six 2024 and 2025 sets qualify today). |
| 30 to 74 named | Mini-booster (8 cards, 24-pack box) *only if* the pool yields at least 1,000 distinct packs by the audit; otherwise as above. |
| 75 or more named, 40 C / 15 U / 10 R+L | Full 15-card booster, 36-pack box. |

Mini-boosters are therefore not offered for any supplement today. Until the waves land only First Tide (after its expansion) and Tenth Tide have boosters; flagships get their boosters when their wave reaches the thresholds, not before.
Two contradictions this resolves: **rarity in fixed products** (a boxed set has each card once, so rarity does not change what you get; rarity affects only boosters), and the **15th-card basic** (a booster for a set with no basic land card should not carry an invisible basic: the 15th slot becomes a foil chance or an extra common from the set, a real tracked card).
