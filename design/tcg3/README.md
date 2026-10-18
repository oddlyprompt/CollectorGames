# Rift Parade (third trading card game): design folder

Gameplay design, card data and test reports for Rift Parade Set 01, *Wrong Side of Reality*. The engine and tools are in `tools/rift-parade/` (start with its README). Not connected to the game build.

| File | What |
|---|---|
| `rules.md` | The rule book |
| `CARDS.md`, `cards.json` | All 130 cards: identity from the production pack, generated rules text, purpose |
| `card-audit.md` | Per-card validity audit (all 130 pass) |
| `balance-report.md`, `balance-log.md` | Balance results, pilot study, ablations, changes, remaining concerns |
| `sim-report-*.md`, `data/` | Generated simulation reports and raw results |
| `playtest-report.md`, `playtests/` | Manual playtests (played by Claude, not a human) |
| `integration-handoff.md` | How this could later connect to CollectorGames |
| `regression.md` | Results of the existing games' tests |
| `source/` | The production pack, unchanged |
