# Tetra-Master-style rule variants (2026-10-30)

**Why:** hands-on play found the game unreadable: unlimited chain reactions mean any card can be flipped back next turn, so the last big chain decides the game and a human cannot calculate it. Owner decision: follow Tetra Master (FF9) more closely, drop the pointing-back Guard bonus.

**Tetra Master, as understood from guides (not verified against the game):** a one-way arrow flips a card automatically; stats only decide a battle when both cards point at each other; a combo goes one level and stops. Sources: analog.games' Tetra Master entry, Caves of Narshe's guide, Gamer Guides.

**Method:** `node tools/brokenreach/variants.js [games] [aiGames]` (env `K`= first-player bonus, `ONLY`= variants). Random 20-card decks, all planets in rotation, greedy (best immediate capture) players, 800 games per row; skill gap = Standard AI against a one-move-ahead greedy player, 100 games. First-player bonus 2 in all rows. Raw output: `VARIANTS_RAW.txt`.

| Variant | Captures per placement | Placements with 4+ | Longest chain | Captures in the last 4 placements | First share | Standard AI beats greedy |
|---|---|---|---|---|---|---|
| current v0.2 (unlimited, +1 pointing back) | 2.35 | 26% | 14 | 9.7 | 47% | 54% |
| A no pointing-back bonus | 3.34 | 39% | 15 | 16.2 | 42% | 52% |
| **B  A + combos stop after 1 level (chosen)** | 2.00 | 17% | 8 | 7.0 | 50% | 57% |
| B2 A + combos stop after 2 levels | 2.63 | 34% | 12 | 10.1 | 46% | 58% |
| C one-way arrows capture automatically | 7.04 | 74% | 15 | 49.3 | 3% | 8% |
| D C + combos stop after 1 level | 3.49 | 54% | 9 | 15.7 | 37% | 48% |
| E keep +1, combos stop after 1 level | 1.57 | 8% | 7 | 5.1 | 52% | 62% |
| G A + no combos at all | 1.09 | 0% | 4 | 3.7 | 50% | 59% |
| H keep +1, no combos | 0.93 | 0% | 4 | 3.0 | 55% | 69% |

**Readings**
- Removing the +1 alone makes things worse (A: more captures, longer chains). The chain limit is what tames the game, as the owner suspected.
- Tetra Master's "one-way arrow captures automatically" (C, D) does not work with this catalogue: cards average 3.3 arrows, so almost every contact is free. It would need cards with 1 to 3 arrows (a card-level change, not tried).
- **B** is the closest to Tetra Master that plays well: no pointing-back bonus, combos stop after one level, 2.0 captures per placement, longest chain 8, first-player share 50% with the bonus of 2. **G** (no combos) is the simplest and most predictable, but nothing cascades. Both are selectable; B is the default. Without the first-player bonus the second player is favoured under B (first share 33% at bonus 0, 43% at bonus 1, 50% at bonus 2), so the bonus stays.
- A human is still outplayed by the Standard AI (57% vs a 1-move player); the gap is smaller than with unlimited chains only for G. The exposure badges and previews in the game are the human-side answer.
- Not measured: how the three preset decks fare under B, human play, whether 'Open Lanes' (wide arrows) is now too weak. Presets were built under the old rules.
