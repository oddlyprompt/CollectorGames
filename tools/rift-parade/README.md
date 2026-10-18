# Rift Parade game engine (Set 01: Wrong Side of Reality)

A complete, isolated, playable implementation of the Rift Parade trading card game: rules engine, all 130 Set 01 cards, computer players, representative decks, a simulator, a card audit, a test suite and an interactive command-line game. It is **not** connected to the CollectorGames build (`src/`, `tools/build.py` are untouched); see `design/tcg3/integration-handoff.md`.

Rules: `design/tcg3/rules.md`. Card reference: `design/tcg3/CARDS.md`. Balance report: `design/tcg3/balance-report.md`. Card audit: `design/tcg3/card-audit.md`.

Needs only Node 18+. No packages.

## Play a game

```
node tools/rift-parade/cli.js --deck kinetic --opp rift            # you (player 0) against the computer
node tools/rift-parade/cli.js --deck chorus --opp impact --ai aggro --seed 7 --first 1
node tools/rift-parade/cli.js --watch --deck severmark --opp workshop   # two computer players, prints the full log
```

Decks: `kinetic`, `impact`, `chorus`, `severmark`, `workshop`, `rift`, `rollers`, `spotlight` (see `decks.js`). Computer players (`--ai`): `balanced` (default), `aggro`, `control`, `greedy`, `random`. At any prompt: a number chooses, `? N` shows the rules text of option N, `l` shows the log, `q` quits. `--script file` answers prompts from a file (one answer per line), `--log file` saves the action log.

## Test

```
node tools/rift-parade/check.js           # full suite: data, rules, per-card tests, 130-card audit, fuzzing, determinism (about 40 s)
node tools/rift-parade/check.js --quick   # same checks, smaller samples (about 15 s)
node tools/rift-parade/audit.js [--write] # card audit only; --write regenerates design/tcg3/card-audit.md
node tools/rift-parade/docs.js [--check]  # regenerate / verify cards.json, CARDS.md and the rule book's parameter table
```

## Simulate and balance

```
node tools/rift-parade/sim.js 60 --out results.json            # round robin of the 8 decks, 60 games per pairing, balanced pilots
node tools/rift-parade/sim.js 40 --agent aggro --agentB control # different pilots per seat
node tools/rift-parade/sim.js 20 --rules secondPlayerFirstEnergy=2   # override rules.json numbers
node tools/rift-parade/report.js results.json > report.md       # markdown report from a results file
```

Games are reproducible: the seed is derived from the pairing, game number and `--seed0`. Each pairing alternates which seat goes first.

## Files

| File | What |
|---|---|
| `rules.json` | Every tunable rule number |
| `cards.js` | The 130 cards: mechanics merged with the production pack's identity |
| `engine.js` | Rules engine: setup, turns, combat, abilities, Rift, legal-action list, deterministic from a seed |
| `ai.js` | Computer players (look-ahead search over copies of the game state) |
| `decks.js` | Eight representative decks |
| `text.js` | Rules text generated from card data |
| `cli.js` | Interactive game |
| `sim.js`, `report.js` | Tournament simulator and report |
| `audit.js`, `check.js`, `testkit.js` | Card audit and tests |
| `docs.js` | Generates `design/tcg3/cards.json`, `CARDS.md`, the rule book's parameter table |
