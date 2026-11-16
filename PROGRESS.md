# Phase 2 "First Play" progress (branch claude/first-play, based on claude/studio-overhaul)
Brief: stabilise for a closed-alpha playtest. Four tasks, commit after each, then stop. No new content or mechanics.
Resume here if the session is interrupted. Setup on a fresh machine: `pip install "playwright==1.63.0" pillow` (the version must match the pre-installed Chromium; never run `playwright install`), `python3 tools/build.py`, `cd dist && python3 -m http.server 8770`.

- [x] Task 1 Performance: profile day-advance (Monday spikes, 38 s outlier), root cause, targeted fix, before/after, regression + golden
- [ ] Task 2 Economy: 10 strategies x 5 seeds x 540 days; reviewer's scalper on seeds 7 and 23; allowance player; report
- [ ] Task 3 Regression + release candidate: full suite, economy tests, itch requirements, versioned RC, deployment procedure
- [ ] Task 4 Playtest guide and feedback template
- [ ] Final: list of remaining blockers, decision

## Log
- Task 1 done and committed: see design/first-play/performance.md. Economy matrix (task 2) started with tools/agents/validate.cjs.
- Economy matrix restarted (resumable): node tools/agents/validate.cjs --jobs 3 --resume design/first-play/economy-runs.jsonl ; results print at the end. Packaging: tm_render.js has pak support (uncommitted until tools/release.py is written and tested).
