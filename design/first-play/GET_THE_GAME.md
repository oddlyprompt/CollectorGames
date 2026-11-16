# Get the game and play it on your iPhone

No Python, no Terminal, no installing anything. You need: your GitHub login, a free itch.io account, and about 15 minutes the first time.

---

## Step 1. Download the game (2 minutes)

1. Open this page (sign in to GitHub if asked):
   **https://github.com/oddlyprompt/CollectorGames/actions/workflows/release-candidate.yml**
2. Tap the top row with a **green tick** (the newest finished build). If it shows a yellow dot, it is still building: wait about 15 minutes and refresh.
3. Scroll to the bottom of that page, to **Artifacts**.
4. Tap **trading-card-collector-0.9.0-alpha-rc1-itch**. A ZIP file (about 105 MB) downloads.
   - On iPhone it goes to the **Files** app, in **Downloads**.
   - On a computer it goes to your Downloads folder.
5. **Do not unzip it.** That ZIP is exactly what itch.io wants.

(Downloads stay available for 90 days. After that, make a new build: see Step 6.)

---

## Step 2. Put it on itch.io, private (5 minutes)

A computer is easiest for this step, but an iPhone works too.

1. Go to **https://itch.io**, sign in (or create a free account).
2. Tap your profile picture → **Upload new project**.
3. Fill in:
   - **Title:** Trading Card Collector (anything you like)
   - **Kind of project:** **HTML**
   - **Uploads:** tap **Upload files**, pick the ZIP from Step 1. When it finishes, tick **This file will be played in the browser**.
   - **Embed options:**
     - Viewport dimensions: **420 × 800**
     - Tick **Mobile friendly**, orientation **Portrait**
     - Tick **Click to launch in fullscreen** (important on iPhone: it opens the game in its own page, which keeps saves reliable)
   - **Visibility & access** (at the bottom): choose **Draft**.
     Draft means only you can see it. Choose **Restricted** instead if you want to send it to a few people with a password.
4. Tap **Save & view page**.

Nothing here makes the game public. Leave it on Draft or Restricted.

---

## Step 3. Open it on your iPhone

1. On your iPhone, open **Safari** and go to **https://itch.io**. Sign in with the same account.
2. Tap your profile picture → **Dashboard** → your game → **View page**.
   (Tip: once it is open, tap the Share button → **Add to Home Screen** so it is one tap next time.)
3. Tap **Run game**. The first load takes a little while (about 100 MB of pictures; Wi-Fi recommended).
4. On the first screen tap **New game**, keep **A fresh start**, tap **Start**.

You are playing. The guide for a first session is `design/first-play/PLAYTEST_GUIDE.md`, and the questions afterwards are in `FEEDBACK_FORM.md`.

Good to know:
- Time only moves when you tap **Next day** or **Skip**.
- Some game weeks start with a pause of a few seconds after **Next day**. That is expected in this build. Wait up to 20 seconds.
- Always use the **same browser and the same itch.io page**. Saves live inside that browser on that phone.

---

## Step 4. Check that saving works (2 minutes, do this once)

1. Play for a few game days (buy or open something so there is something to lose).
2. The game saves by itself. To be sure, open **Settings** (gear icon, top right) and tap **Save now**.
3. Close the Safari tab completely.
4. Open the game again from itch.io. On the first screen your save is listed: tap **Continue** (or tap the save's name).
5. Check the date at the top and your cards are as you left them.

If your save is missing after closing Safari: tell me. Then play in a new Safari tab of the game page itself, not inside the itch.io page, or use **Add to Home Screen**.

---

## Step 5. Keep a backup, and restore it

A backup is one small file (ending in `.ccsave`) holding your whole game. Make one before anything you might regret, and send it to me if you hit a problem: it lets me open your exact game.

**Make a backup** (either way works)
- In the game: **Settings** (gear icon) → **Download a backup**.
- Or on the game's first screen (reload the page): next to your save, tap **Backup**.

A `.ccsave` file downloads (iPhone: Files app → Downloads). Keep it somewhere safe, for example iCloud Drive.

**Restore a backup** (on the same phone, a new phone, or a computer)
1. Open the game. On the first screen tap **Import a save**.
2. Pick the `.ccsave` file (iPhone: **Browse** → Downloads or iCloud Drive).
3. It appears as a new save in the list. Your old saves are not touched. Tap it to play.

Not yet tried on a real iPhone: making and restoring backups were tested in a desktop browser only. If the `.ccsave` file looks greyed out and cannot be picked on the iPhone, that is an iPhone file-type quirk: restore it on a computer instead, and tell me so I can fix it.

---

## Step 6. Getting a newer build later (one tap)

Whenever I change the game on the branch `claude/first-play`, GitHub builds a new download by itself. You do not need to do anything except Step 1 again.

To rebuild by hand (for example, the 90 days ran out):
1. Open **https://github.com/oddlyprompt/CollectorGames/actions/workflows/release-candidate.yml**
2. Tap the newest run.
3. Tap **Re-run all jobs** (top right; on a phone it may be under the **⋯** menu), then confirm.
4. About 15 minutes later, the new download is under **Artifacts** on that page.

To put a new build on itch.io: open your game → **Edit game** → under Uploads, delete the old ZIP, upload the new one, tick **This file will be played in the browser**, **Save**. Your saves on the phone carry over.

(When this workflow is one day on the main branch, the Actions page also gets a **Run workflow** button where you can type a new version name, such as `0.9.0-alpha-rc2`.)

---

## What has and has not been tested

- Tested automatically on every build, in a desktop browser at iPhone screen size: the ZIP has `index.html` at its root, every picture is inside, the version is stamped, the game starts, cards draw, it saves and continues after a reload, and it works when embedded in another page (as itch.io does).
- **Never tested:** a real iPhone, Safari, or itch.io itself. Your first session is also the first real-device test, so a few rough edges are possible. Screenshots help.

## If something goes wrong

| What you see | What to do |
|---|---|
| No **Artifacts** section on the GitHub page | The build is still running (yellow dot) or failed (red cross). If red, tell me; nothing is published either way. |
| itch.io says "no index.html" | You uploaded an unzipped folder or a zip inside a zip. Upload the ZIP exactly as GitHub gave it. |
| The game page is blank or grey | Wait a minute on Wi-Fi and reload. If it stays blank, take a screenshot and tell me. |
| Cards show "ART PENDING" | Normal for some Tidemark cards whose paintings are not made yet. |
| The game froze after Next day | Wait up to 20 seconds. If longer, take a screenshot of the date at the top. |
| A save is gone | Restore your latest backup (Step 5) and tell me what you did just before. |
