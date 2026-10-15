# Start here

**Where to work.** Do the game work in Claude Code (the Code tab in the Claude app, pointed at this repository, branch `main`). Use the chat for art direction, concept decisions and judging what you have generated. If it changes a file in this project, it belongs in Claude Code.

**Getting the files in.** On github.com, open the repository, choose Add file, Upload files, and drop in the three zip files (`project.zip`, `art-creatures.zip`, `art-scenes.zip`) without unzipping them. Commit to `main`. Then start a **new** Claude Code session so it sees them.

**First message to paste into Claude Code:**

Look at the repository root. Delete any leftover files there whose names contain two underscores in a row (they are from an earlier upload attempt). Then unzip project.zip, art-creatures.zip and art-scenes.zip into the repository root, keeping their folders, delete the three zips, and commit. Read CLAUDE.md and design/wildkin-universe.md. Then do these three things in order, committing after each one, and tell me in plain language what you did and what you tested.

1. Install Pillow (`pip install pillow`) and run `python3 tools/build.py --publish`. The docs/ folder does not exist yet, so overwriting it is fine. Run `tools/shelltest.py` for each game if you can, and commit.
2. Build the art library. Look at every sheet in `art-source/`. Improve `tools/ingest.py` so hairline details (the koi dragon's whiskers) survive, pale bodies do not keep a green tint, and stray effect marks (the "!" bursts, sparkles, speed lines) can be dropped. Cut every creature sheet into `assets/creatures/<name>/` and every scene sheet into `assets/scenes/<biome>/`. Write `assets/manifest.json` describing each piece: for scenes the biome, the floor type (ground, water or air) and the time of day; for creatures the name, the screen colour and the pose. Look at the images to decide the tags.
3. Remove the baseball league from the comics and Wildkin builds (it is hidden but still generated, which slows startup). Leave the Sports build as it is. Test all three games.

Do not change Wildkin's species, sets, energies or art. That content is being redesigned and will be replaced.

**When the Wildkin concept is ready:** put it in the `design/` folder and tell Claude Code to rebuild Wildkin from it.
