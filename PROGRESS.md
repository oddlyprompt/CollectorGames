# Phase 2 "First Play" progress (branch claude/first-play, based on claude/studio-overhaul)
Brief: stabilise for a closed-alpha playtest. Four tasks, commit after each, then stop. No new content or mechanics.
Resume here if the session is interrupted. Setup on a fresh machine: `pip install "playwright==1.63.0" pillow` (the version must match the pre-installed Chromium; never run `playwright install`), `python3 tools/build.py`, `cd dist && python3 -m http.server 8770`.

- [ ] Task 1 Performance: profile day-advance (Monday spikes, 38 s outlier), root cause, targeted fix, before/after, regression + golden
- [ ] Task 2 Economy: 10 strategies x 5 seeds x 540 days; reviewer's scalper on seeds 7 and 23; allowance player; report
- [ ] Task 3 Regression + release candidate: full suite, economy tests, itch requirements, versioned RC, deployment procedure
- [ ] Task 4 Playtest guide and feedback template
- [ ] Final: list of remaining blockers, decision

## Log
