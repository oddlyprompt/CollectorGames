# SOL handoff: The Broken Reach set 01 (proposal, 2026-10-30)

You are producing illustration only. Read `ART_BIBLE.md` first, then work from `art_queue.json` (also readable as `ART_QUEUE.md`).

## Order of work
1. **Batch M00: master designs** (8 characters, 6 species). Send these first and stop: the owner approves them (gate G5). Do not start card art before that.
2. **Production batches** B01 to B15 (at most 12 pictures each), then the premium arts A01 to A03 (nine each). Send each batch when it is finished and checked; do not claim completion without the actual image files.
3. After the owner reviews a batch, fix what they flag as a **revision** (`-v02`), never by overwriting.

## What every queue item gives you
`id` and `file` (the exact file name), `brief` (the handoff's art direction), `shot` (a different camera for each picture, so the set does not repeat itself), `refs` (the master designs this picture must match: characters and species) and, for a premium art, `differs_from` (the base picture it must not copy).

## Pictures
- One picture per id, named exactly as `file`: `BR01-001_base.png`, `BR01-IL-01.png`, `MASTER-kaia-venn.png`. A revision is `BR01-001_base-v02.png`.
- Base cards square (1:1), premium arts portrait (about 3:4), master sheets landscape; shortest side at least 300 px (the owner waived 1600 px). No text, borders, rarity icons or arrows. Main action inside the central 70%.
- Every picture a distinct composition, subject, action and setting. Face consistency for the six crew, Rix and Silas, using the approved masters.

## Delivery
A zip (or folder) holding the pictures and a manifest (`production-status.csv` or `review-manifest.csv/json`) with at least `id,file,sha256`. The game's intake (`python3 tools/brokenreach/art_intake.py DELIVERY_DIR`) rejects anything that is the wrong shape, under 400 px, truncated, unnamed, unlisted or whose sha256 does not match; raw sheets, contact previews and continuity-lock copies are ignored, files the rest as **delivered, awaiting owner review** and makes a labelled contact sheet per batch. Only pictures the owner approves reach the game.
