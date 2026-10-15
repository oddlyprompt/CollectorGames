# SOL brief: First Bond packaging (booster packs and booster box)

The cards look premium; the packaging does not yet. Until these renders arrive, the game draws the pack and box itself (a foil pack and a three-quarter box dressed in existing First Bond paintings, `tcPackSVG` in `src/engine/tcg_render.js`). This brief asks for the real thing.

Read `SOL_HANDOFF.md` first: the same style, file and delivery rules apply.

## What to make

| Task ID | What | Size | Background |
|---|---|---|---|
| `PRODUCT-PACK-01` | Booster pack featuring **Cactuft** | at least 1000 x 1400 px, portrait | flat chroma green, RGB(40, 160, 60) |
| `PRODUCT-PACK-02` | Booster pack featuring **Koirune** | same | same |
| `PRODUCT-PACK-03` | Booster pack featuring **Prismotl** | same | same |
| `PRODUCT-PACK-04` | Booster pack featuring **Aegisopod** | same | same |
| `PRODUCT-BOX-01` | Booster box, closed, three-quarter view (front and right side visible, a little of the lid) | at least 1600 x 1400 px | same |
| `PRODUCT-BOX-02` | Booster box, lid open, packs standing inside in rows | at least 1600 x 1400 px | same |

One PNG per task, named exactly after the task ID (for example `incoming/PRODUCT-PACK-01.png`), plus the optional JSON sidecar described in `SOL_HANDOFF.md`.

## How they should look

- **Same world as the cards.** Soft, toy-like dimensional 3D render, soft even studio light, like `art-source/creatures/`. The featured creature must match its approved card art exactly (same proportions, colours, markings).
- **Packs:** a foil pillow pouch seen **straight from the front**, not tilted, so the game can place text on it. Crimped, serrated seals at top and bottom. Gold-and-pearl foil edges with a gentle sheen. The creature in a small scene from its biome fills the front, kept clear of the **top quarter** (the game prints the WILDKIN logo there) and the **bottom fifth** (the set name and "10 cards").
- **Box:** a sturdy display box, front panel facing slightly left, the right side and a sliver of the lid visible. The front panel shows a group of the flagship mascots (Cactuft, Koirune, Prismotl, Aegisopod, Flapod) together. Keep the **top third of the front panel** clear for the logo and the **bottom strip** clear for the set name.
- **No text at all.** No logo, no set name, no numbers, no fake lettering. The game adds every word, so the same render works for later sets.
- Nothing touching the image edge, about 10 percent margin, no floor shadow (the game draws its own), no sparkles or effect marks on the screen colour.

## What happens next

These task IDs are not in the art intake yet. When the owner says the renders are coming, Claude Code adds the six `PRODUCT-` tasks to the queue and to `tools/wildkin_art.py` (cutout, checks, approval), and the game switches from the drawn packaging to the approved renders, with the drawn version kept as the fallback.
