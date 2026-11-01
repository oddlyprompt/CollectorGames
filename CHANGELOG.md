# Changelog

Player-facing changes first, development notes in the linked documents. Dates are real dates.

## 2026-11-01: alpha-readiness pass (branch `claude/eloquent-carson-27ik8y`, not published)

Full account, measurements and open items: `design/alpha-readiness-2026-11.md`.

**Fixed**
- **Tidemark purchase shortcuts.** Buy buttons on Home (wantlist) and on card pages called Wildkin's store handlers (`kvbuy`, `lgssingle`) and answered "Out of stock". They now call Tidemark's own (`xkvbuy`, `xlgssingle`).
- **Unlimited Tidemark singles.** Saltmarket's stock for recent sets was rebuilt on every look, so buying never reduced it. Stock now goes down when you buy.
- **Offers above the asking price.** An offer at or above the ask is refused with an explanation (use Buy now) instead of being accepted at the higher amount.
- **Comparable-sales estimates.** One odd sale no longer moves a thin market: sales count for little until there are several, and a price far from fair value is pulled back toward it. Card pages show model fair value, the number and median of recent sales, and say why a range is wide.
- **Most played cards** (metagame pages) lists only cards that are in decks now, instead of old cards at 0%.
- **Aged text:** Settings, the Tidemark intro, the Broken Reach battler legend and several card-page labels no longer describe a baseball game, an unreleased set that has shipped, pending art that is finished, or "Version 1, not canon".

**Added**
- **First steps on Home** (skippable, reopenable from Settings): days advance when you say, the Friday allowance, get something available, look at it, choose what to collect, your next move.
- **Needs you** on Home: offers to answer, watched auctions ending, grading returns, wanted cards for sale now (with a working Buy), releases within five weeks. **Your focus**: a chosen set's progress and pinned cards (Pin to Home on every card page). Game tiles say Preview with the release date before a release.
- **Pack openings:** hints are off for new saves (older saves keep their setting; a switch per game in Settings). Goal celebrations wait for the summary. Summaries start with what the pulls did for the collection (new cards, set progress, wanted cards found, goals, notable variants); money comes second.
- **Online singles shops:** search by card or set name, in-stock only by default with a switch to show everything, a four-button pager.
- **Collection** opens on the game you last bought from; an empty game points to where your cards are; a truly empty collection offers the Market and the shops.
- **News** items that name a card or set have a button to open it.
- Fresh pack pulls with a factory flaw read "Pack fresh, centering flawed" instead of "Lightly played".
- Broken Reach face: the longest ability texts fit their box.

**Tools**
- New tests: `purchase_routes_test.py`, `opening_test.py`, `market_safety_test.py`, `home_test.py`, `browse_test.py`, `br_layout_test.py`, `phone_layout_test.py`, `soak_test.py`; all in `run_all_tests.sh`.
- `tools/itch_package.py` measures the build against an HTML5 host's limits and writes a zip.

## 2026-11-01 and earlier

Earlier work (Broken Reach faces, packaging and art; the look-and-feel theme) is described in `CLAUDE.md` and the git history.
