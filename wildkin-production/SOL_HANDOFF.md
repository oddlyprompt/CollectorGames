# SOL handoff: how to deliver Wildkin art

You (SOL) make the images. Claude Code checks them, cuts them, connects them to cards and builds the game. The two of you never share files automatically: everything goes through this folder in the repository `oddlyprompt/CollectorGames`.

## 1. What to read

| File | What it is | Can you edit it? |
|---|---|---|
| `wildkin-production/ART_QUEUE.md` | The work list: every sheet, every cell, who is in it, which pose, status | No |
| `wildkin-production/art_queue.json` | The same, machine-readable | No |
| `wildkin-production/manifest.json` | The 180 cards, their numbers, names, families, affinities and art IDs | **Never** |
| `wildkin-production/reports/reconciliation.md` | What is canon, what is inferred, what is missing | No |
| `art-source/creatures/`, `art-source/scenes/` | The approved style. Match it. | No |

Card numbers, names, families, stages and rarities are fixed by the manifest. Do not renumber, rename, merge or invent cards. If something in the queue looks wrong, write it in `wildkin-production/incoming/QUESTIONS.md` and leave the image out.

## 2. What to deliver

One image per task, named **exactly** after the task ID, put in `wildkin-production/incoming/`:

```
wildkin-production/incoming/SHEET-03.png        a 3x3 sheet
wildkin-production/incoming/SIR-173.png         a single Special Illustration Rare
wildkin-production/incoming/SHEET-03--v2.png    a second attempt at the same task (keep the original name, add --v2, --v3 ...)
```

Next to each image, a small JSON file with the same name (recommended):

```json
{
  "task_id": "SHEET-03",
  "manifest_version": "1.0.0",
  "made_by": "SOL",
  "created": "2026-10-14",
  "prompt": "the exact prompt you used",
  "notes": "anything the reviewer should know"
}
```

PNG only. No JPEG (it smears the screen colour), no transparency in the delivered file (Claude Code makes the transparency).

## 3. How each kind of sheet must look

**All 3x3 sheets.** Three columns, three rows, thin dark gutters (a few pixels, near black), every cell the same size. Cell order is left to right, top to bottom: cell 1 is top left, cell 9 bottom right. A cell the queue says to leave empty is left as flat screen colour (cutout sheets) or flat dark (illustration sheets).

**Cutout sheets** (creatures, allies, gear):
- At least 1254 x 1254 px, square.
- Flat, evenly lit chroma green, close to RGB(40, 160, 60). Use chroma magenta, close to RGB(235, 18, 128), for green subjects. The queue says which.
- About 10% empty margin around every subject. Nothing may touch a cell edge: ears, tails, whiskers, antennae and spikes included. A clipped cell is rejected.
- No text, no frames, no floor shadow, no glow on the screen, no effect marks ("!" bursts, sparkles, speed lines).
- Soft, toy-like dimensional 3D render, soft even studio light, the same look and scale as `art-source/creatures/`.
- One creature's poses keep the same proportions, colours and markings in every cell. Stages of one family share a sheet so they stay consistent.

**Scene sheets** (Biomes B and C): at least 1254 x 1254, square, 3D miniature-diorama backgrounds like `art-source/scenes/`, an open floor in the lower third, soft even light, no creatures, no text.

**Illustration sheets** (Biomes A, Tactics): at least 1254 x 1254, full-bleed pictures per cell, no text.

**Premium sheets** (Illustration Rares, Full Arts, Clasp Program): the whole sheet is 5:7 portrait, at least **2100 x 2940 px**, so each cell is a 5:7 painting of at least 700 x 980. Paintings, not cutouts: a premium card must be a real new illustration, never a recoloured or resized base cutout. Keep the subject clear of the top and bottom quarters (the card prints its name and text there). The creature must match its approved cutout design exactly.

**Special Illustration Rares** (`SIR-173` to `SIR-176`): one painting each, 5:7 portrait, at least 1500 x 2100 px. These are the showpieces of the set.

## 4. Art direction is yours

You decide how every subject looks, building on the Wildkin art you have generated before. Only five creatures are drawn in this repository (Cactuft, Bashlet, Rolyte, Frondolin, Flapod); for everything else, design it yourself in the same style, using your earlier creature and character work as the reference. There is no separate concept step: make the production sheet directly.

Two rules keep the set consistent:

1. **The first approved sheet of a subject becomes its reference.** Every later picture of it (other poses, Illustration Rares, Full Arts, SIRs, the Clasped versions) must match that design: same proportions, colours and markings.
2. **Stay inside the manifest.** Names, numbers, families, stages and affinities come from `manifest.json`. A design may hint at a creature's affinity, but must not change who it is or which family it belongs to.

All families are confirmed (027 to 056 were confirmed by the owner on 2026-10-13), so every sheet in the queue can be made now. A good order: the canon mascot families (sheets 02-09, 11), then 12-29, then allies, gear, biomes, tactics, then premium art once the base designs exist.

## 5. What happens after you push

1. **Check.** `python3 tools/wildkin_art.py check` (also run automatically on every pull request that touches `incoming/`) validates the file name, size, aspect, grid and screen colour, cuts every cell, removes the screen, and flags clipping, leftover screen colour, broken transparency, empty cells and stray marks. It writes a review page with a contact sheet to `wildkin-production/reports/<TASK>/<hash>/report.md`.
2. **Approve.** The owner merges the pull request (or runs `python3 tools/wildkin_art.py approve SHEET-03`). Only cells with no errors are taken; cells with warnings need a human to approve them. Already-approved art is **never** overwritten by a new file: replacing a piece needs an explicit `--replace`, and the old piece is kept.
3. **Build.** Approved pieces go to `wildkin-production/approved/`, the queue status updates, and the game is rebuilt with the new art. Cards whose art is not approved yet show a labelled placeholder ("Art pending" plus the asset ID), never someone else's picture.
4. **Rejected** files are moved to `wildkin-production/rejected/<TASK>/` with the reason.

## 6. Checklist before you push

- [ ] The file name is exactly the task ID (`SHEET-NN.png` or `SIR-NNN.png`, optional `--vN`).
- [ ] Size and aspect match the task. 3x3 with even cells and thin dark gutters.
- [ ] Each cell holds the subject and pose the queue lists for that cell number. Empty cells are empty.
- [ ] Cutouts: flat screen, the right colour, 10% margin, nothing touches an edge, no shadows or effect marks.
- [ ] Premium: a new painting, 5:7, subject clear of the top and bottom quarters, the design matches the approved cutout.
- [ ] The JSON sidecar has the task ID and the manifest version from `manifest.json`.
- [ ] You did not edit `manifest.json`, `art_queue.json`, `ART_QUEUE.md` or anything outside `incoming/`.
