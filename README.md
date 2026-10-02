# Collector games

Three fictional collecting games built from one engine. Everything in them is made up.

| Game | Folder | What you collect |
|---|---|---|
| Sports Card Collector | `docs/sports` | baseball cards, packs, grading, shows |
| Comics Collector | `docs/comics` | a century of comics, preorders, variants, grading |
| Wildkin Collector | `docs/tcg` | a creature trading card game with sets, tournaments, bans and rotations |

Each game saves to named slots in the browser, so you can run several games at once. Settings has **Download a backup**, which gives you a `.ccsave` file you can restore on another device.

## Try a game right now
Open the game's folder and open `index.html`. It runs straight from the folder. For a normal web address, use one of the options below.

## Put a game online
**GitHub Pages (free, no extra account).** First run `python3 tools/build.py --publish` (Claude Code can do this for you) so the `docs/` folder exists. Then, in the repository: Settings, Pages, "Deploy from a branch", branch `main`, folder `/docs`, Save. After a minute you get an address like `yourname.github.io/yourrepo/`, with a page that links to all three games.

**itch.io.** Make a new project, set "Kind of project" to HTML, and upload a zip of one game's folder (`index.html` must be at the top of the zip). Tick "This file will be played in the browser". Set visibility to Draft or Restricted while you test, so only you can see it. itch.io asks you to disclose AI-generated art in the project settings.

**Netlify.** Go to app.netlify.com/drop and drag one game's folder onto the page.

**Vercel.** Import the repository, leave the build command empty, and set the output directory to `docs/sports` (or `comics`, or `tcg`). Make one project per game.

## Install it on a phone
Open the game's web address in the phone's browser, then use "Add to Home Screen". It then opens like an app and works offline after the first visit. There are no store apps yet; those need paid developer accounts.

## Rebuilding after changes
You need Python 3 and Pillow (`pip install pillow`).

    python3 tools/build.py --publish

This rebuilds all three games into `dist/` and copies them to `docs/`. Add a game name (`sports`, `comics` or `tcg`) to build only that one.

## Adding art
Generate a 3x3 sheet, then cut it into pieces:

    python3 tools/ingest.py sheet.png --kind scene --out assets/scenes/meadow
    python3 tools/ingest.py sheet.png --kind cutout --key green --out assets/mascots/fox

Use `--key magenta` for creatures that are green. Ask the generator for about 10% empty margin around each subject, a flat screen colour, and no text or frames. The tool tells you which cells touch their edge.

See `CLAUDE.md` for how the code is organised.
