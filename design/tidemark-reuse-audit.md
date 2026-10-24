# Tidemark reuse-first audit (2026-10-22)

Status: **audit only**. No card, printing, art or game code was changed. The 66-card First Tide proposal (`first-tide-expansion-proposal.md`) is **paused** and should not be approved or used until this audit is reviewed. Reproduce every number with `python3 tools/tidemark_reuse_audit.py` (read-only; it only reads `tidemark-production/cards.json` and `checklist.csv`).

## Short answer
1. **Tenth Tide's reprints are already linked.** All 70 reprints point to an existing original printing with the same identity and the same illustration (file reused, no new art). Nothing is missing there, so none of the 70 can fill an empty historical position: they came *from* positions that are already filled. Sources: First Tide 26, Thornfall 5, Deepforge 5, Bastions of Stone 4, Siege of Lanthorn 4, Open Water 4, Harbor Moon 4, Merchant Tides 4, Gale and Wave 3, Broken Chains 3, Reefward 2, Crownwar 1, Drowned Hymns 1, Black Tide 1, Stormglass 1, Wild Tithe 1, Lanterns 1.
2. **The 150 new Tenth Tide cards and the 10 alternate arts cannot go back in time.** They are 2026 designs; putting them in a 2016 to 2025 set has no historical basis, so they are excluded.
3. **The only legitimate reuse is later historical sets reprinting earlier historical cards** (as real games do). Under the conservative rules below that is room for **187 extra printings with zero new artwork** (415 if reprints may be up to half a set). It fills no gap in **First Tide, Salt and Banner or Lanterns of the Harbor**: nothing earlier exists to reprint.
4. **First Tide is better placed than I thought.** At 59 cards it already clears the 30-card floor for an honest mini-booster. Reuse cannot add to it, so its full-booster size (75) needs **16** new cards, not 66; 125 is only needed if you want that size for its own sake.

## The audit rules I applied (proposals; tell me if any are wrong)
- A source identity must come from a set **at least one calendar year earlier**, so nothing is inserted into an earlier year. (A same-year summer set cannot reprint a spring card.)
- Never a reserve-list card (19, all Founding-era) and never a Legendary (the Legendaries stay unique to the set that introduced them).
- Each identity is reprinted at most once in the historical sets (a third copy of a card in ten years is a different story).
- Reprints are at most one third of a set's catalogue (Tenth Tide itself is 32%); the bracket shows the result if you allow one half.
- A reprint **keeps its illustration** and the card's rules and rating; only the printing changes: set symbol, collector number (an existing gap), kind "reprint", link to the original printing. This is exactly what the 70 Tenth Tide reprints already do.

## Per-set table
`*` recommended flagship. Figures are 1/3 cap (1/2 cap in brackets). "Eligible" = distinct earlier-year identities that pass the rules. "New to 30" = new cards still needed to reach the mini-booster floor; "new to 75" = to reach the full-booster size. Each new card needs one new illustration (about 8.5 per sheet).

| Set | Year | Existing originals | Eligible sources | Reusable missing printings | Catalogue after reuse | New cards/illustrations to reach 30 | New to reach 75 |
|---|---|---|---|---|---|---|---|
| First Tide * | 2016 | 59 | 0 | +0 (+0) | 59 (59) | 0 (0) | 16 (16) |
| Salt and Banner | 2016 | 10 | 0 | +0 (+0) | 10 (10) | 20 (20) | 65 (65) |
| Lanterns of the Harbor | 2016 | 16 | 0 | +0 (+0) | 16 (16) | 14 (14) | 59 (59) |
| Iron Coast | 2017 | 10 | 72 | +4 (+10) | 14 (20) | 16 (10) | 61 (55) |
| Reefward * | 2017 | 15 | 72 | +7 (+15) | 22 (30) | 8 (0) | 53 (45) |
| The Crownwar | 2017 | 10 | 72 | +4 (+10) | 14 (20) | 16 (10) | 61 (55) |
| Open Water | 2018 | 14 | 101 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Bastions of Stone | 2018 | 14 | 101 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Thornfall * | 2018 | 18 | 101 | +8 (+18) | 26 (36) | 4 (0) | 49 (39) |
| Merchant Tides | 2019 | 15 | 145 | +7 (+15) | 22 (30) | 8 (0) | 53 (45) |
| Broken Chains | 2019 | 14 | 145 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Deepforge * | 2019 | 15 | 145 | +7 (+15) | 22 (30) | 8 (0) | 53 (45) |
| Siege of Lanthorn * | 2020 | 15 | 187 | +7 (+15) | 22 (30) | 8 (0) | 53 (45) |
| Gale and Wave | 2020 | 14 | 187 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Harbor Moon | 2020 | 14 | 187 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Fathoms Deep | 2021 | 13 | 227 | +6 (+13) | 19 (26) | 11 (4) | 56 (49) |
| Drowned Hymns * | 2021 | 14 | 227 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Sunken Vaults | 2021 | 13 | 227 | +6 (+13) | 19 (26) | 11 (4) | 56 (49) |
| Leviathan Rising | 2022 | 14 | 265 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Coral Bastion * | 2022 | 13 | 265 | +6 (+13) | 19 (26) | 11 (4) | 56 (49) |
| The Wild Tithe | 2022 | 14 | 265 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Black Tide * | 2023 | 13 | 301 | +6 (+13) | 19 (26) | 11 (4) | 56 (49) |
| Echoes of the Trench | 2023 | 14 | 301 | +6 (+14) | 20 (28) | 10 (2) | 55 (47) |
| Stormglass | 2023 | 15 | 301 | +7 (+15) | 22 (30) | 8 (0) | 53 (45) |
| New Reaches | 2024 | 21 | 340 | +10 (+21) | 31 (42) | 0 (0) | 44 (33) |
| Free Lanes | 2024 | 20 | 340 | +9 (+20) | 29 (40) | 1 (0) | 46 (35) |
| Keepers of the Light * | 2024 | 21 | 340 | +10 (+21) | 31 (42) | 0 (0) | 44 (33) |
| Crown and Shoal | 2025 | 21 | 398 | +10 (+21) | 31 (42) | 0 (0) | 44 (33) |
| Return of the Tide * | 2025 | 20 | 398 | +9 (+20) | 29 (40) | 1 (0) | 46 (35) |
| Tidelines | 2025 | 21 | 398 | +10 (+21) | 31 (42) | 0 (0) | 44 (33) |

## What it adds up to
| | No reuse | Reuse, 1/3 cap | Reuse, 1/2 cap |
|---|---|---|---|
| Printings added with no new art | 0 | 187 | 415 |
| New cards/illustrations so every set reaches 30 (mini-booster floor) | 429 | 246 | 88 |
| New cards/illustrations for the ten flagships to reach 75 (full booster) | 547 | 481 | 403 |
| Sets already at 30 or more | 1 (First Tide) | 5 (FT, NR, KH, CS, TL) | 13 |

So reuse cuts the new-art requirement for the *floor* sharply (429 to 246, or 88 at the half cap) but only trims the *flagship* requirement by 12% to 26%: with 10 to 21 originals per set, even 50% reprints leaves most of a 75-card set to design. Reuse is the right first step and not a substitute for new flagship content.

## Original printings and modern reprints stay distinct (item 7: checked)
A printing is its own collectible: its key is `X|set|number|variant`, its price uses its own set's release date, prestige and kind (`pk`: original earns 22% a year of collector premium, reprint 7%), its copies come from its own set's packs, and condition comes from the age of its set. Checked in the running game (3 worlds, 150 days in, economy v2) for the 70 existing original/reprint pairs:
- originals were dearer than their Tenth Tide reprint in **210 of 210** pairs, median about **2.9 times**;
- copies in the world: about 160 to 177 originals in total against 790 to 1,056 reprints (roughly 1 to 6);
- Near Mint share of surviving copies: **23% to 31%** for originals against **77% to 80%** for the new printings;
- the illustration is shared (70 of 70) but nothing else is.
Not yet tested: adding reprint printings *inside* historical sets. The data model (`pk`, first-print rule `TM_FIRST`, per-set census) is built for it and I expect it to work, but the replay, the print-count discount in play value and the golden tests have never run with it. That would be the first thing built and tested.

Side effect to accept or avoid: a historical reprint adds copies of that **identity** (its play value is shared), and slightly discounts the original's play value (10% per extra printing in the formula). The original *printing's* collector value is unaffected.

## Remaining requirements, recalculated
- **First Tide:** 0 new cards needed for honest products (mini-booster at 59); +16 for a full 75-card booster; the 125 target and the 66 cards are not needed for products. A 125-card First Tide is a creative choice, not a requirement.
- **2016 sets (Salt and Banner, Lanterns):** no reuse possible; 20 and 14 new cards to reach 30, or stay as boxed sets (10 and 16 cards).
- **2017 to 2023 supplements:** reuse lifts each from 10 to 15 originals to 14 to 26 printings; they remain boxed sets, collector bundles and themed decks unless you want a further 4 to 11 new cards each to reach the mini-booster floor.
- **2024 and 2025 sets (6 sets):** reach 29 to 31 with reuse alone (21 originals + 8 to 10 reprints); NR, KH, CS and TL clear 30, FL and RT are one card short.
- **Flagships (ten, recommended list unchanged):** 44 to 56 new cards each at the 1/3 cap (33 to 49 at the half cap) for a 75-card set, 16 for First Tide.

## Genuinely necessary new content (recommendation)
1. **Nothing new now.** Product integrity (the validator, honest products) needs no new card; mini-boosters can be offered for First Tide and, after reuse, for the four 2024 and 2025 sets.
2. **Phase A, reuse only (no art, no design):** create the reprint printings that pass the rules for the sets where they bring a set across a product threshold (the 2024 and 2025 sets, +9 to +10 each) and for flagships, in gaps of the existing numbering. Then validate and re-baseline the economy once.
3. **Phase B, minimal new content, only if wanted:** First Tide +16 (to 75) as the first flagship wave; this replaces the 66-card proposal (its best 16 could be drawn from it). Everything else waits for flagship waves one at a time.
4. The mini-booster rule (at least 1,000 distinct packs) is untested against the reuse-enlarged pools; the audit tool needs a pack-diversity check before any set is promoted.

## Decisions for you
1. Are the reuse rules right (one year earlier, no reserve list, no Legendaries, once per identity, 1/3 of a set)? Especially: may a reprint be 1/2 of a set?
2. May later historical sets contain reprints of earlier cards at all? (It changes the lore: a 2024 set containing a 2016 card.)
3. May I replace the 66-card First Tide plan with "59 now, +16 later" as above?
