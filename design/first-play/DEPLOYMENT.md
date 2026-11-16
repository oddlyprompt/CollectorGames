# Release candidate: how to build, test and hand it to a tester

Nothing in these steps publishes the game or changes the public site (`docs/`, GitHub Pages). Do not run `build.py --publish` and do not merge for a closed test.

## 1. Build
```
pip install "playwright==1.63.0" pillow      # test tools; the Playwright version must match the installed Chromium
python3 tools/build.py tcg                   # writes dist/tcg
python3 tools/release.py --version 0.9.0-alpha-rc1
```
`release.py` writes `release/trading-card-collector-0.9.0-alpha-rc1/` and the same folder as a `.zip` (about 105 MB, `index.html` at its root). `release/` is not kept in the repository; it is rebuilt from the commit named in `RELEASE.json`.

What differs from the ordinary build: Tidemark's 1,253 paintings are packed into 32 `art/tm-<n>.pak` files, which brings the package from 1,811 files to 591; the version is in the page title, the About text and `RELEASE.json`; the offline cache has its own name. The game code is otherwise byte for byte the build's.

## 2. Test it locally
```
cd release/trading-card-collector-0.9.0-alpha-rc1 && python3 -m http.server 8780
python3 tools/release_test.py 8780           # in another terminal, from the repository root
```
Then open `http://localhost:8780/` yourself. On a phone on the same Wi-Fi: `http://<this computer's address>:8780/`.

## 3. Hand it to a tester (choose one)
**A. In person or on your own network.** Serve the folder as in step 2 and give the tester the address. Simplest, nothing leaves your machine. Saves stay in the tester's browser.

**B. itch.io, restricted.** Not done by this project's tools; a person does it.
1. Create a new project. Kind of project: **HTML**. Upload the `.zip` and tick **This file will be played in the browser**.
2. Embed options: "Click to launch in fullscreen" on, **Mobile friendly** on, orientation portrait, viewport about 420 x 800.
3. Visibility: **Draft** or **Restricted** with a password or download keys. Do not set it to Public.
4. Open the page yourself first: start a new game, open a pack, save, reload the page and continue.

Limits the package was checked against: 1,000 files, 500 MB extracted, 200 MB per file. These figures come from several secondary sources (forum answers and third-party guides, November 2026). **itch.io's own documentation page could not be read from the build machine**, so read https://itch.io/docs/creators/html5 before uploading. The package is at 591 files, 108.5 MB, largest file 3.6 MB, longest path 57 characters, so it has room on every figure.

Known unknowns on a host: the game was tested inside a cross-origin frame in Chromium (new game, save) but never on itch.io itself, never in Safari and never on a physical phone. Saves use the browser's IndexedDB; a browser that blocks storage in embedded pages (Safari can) would lose saves between visits. "Click to launch in fullscreen" opens the game in its own tab on most phones, which avoids that. The fonts come from Google Fonts; without a connection to it the game falls back to system fonts.

## 4. Rolling back or replacing
A new candidate is a new version name (`--version 0.9.0-alpha-rc2`); the offline cache name changes with it, so a tester's browser fetches the new files. Saves carry over between candidates (they are stored by the browser for the address, not in the package). To withdraw a candidate, stop serving it or delete the upload; nothing else depends on it.

## 5. Record with each candidate
The contents of `RELEASE.json` (version, commit, file count), the result line of `tools/run_all_tests.sh` and of `tools/release_test.py`, and the list of known issues in `design/first-play/READINESS.md`.
