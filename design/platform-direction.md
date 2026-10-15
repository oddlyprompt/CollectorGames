# Platform direction: one collector game, four card games

Written 2026-10-16 for the owner. A proposal, not a decision. Nothing here is built yet.

## Where things stand

- Three separate builds share one engine: Sports, Comics and Wildkin. Each has its own launcher, saves and look, and every header says "Card Collector".
- Wildkin is wired in as *the* card game: its code is named `tcg_*`, it reads one manifest (`WK_CANON`), one rules engine (`WKR`), one frame set (`TCF`). The market, grading, slabs, the 3D viewer, packs, the NPC traders and the metagame machinery are mostly general already; the cards, rules, frames and art are Wildkin's.
- The owner plans four card games: Wildkin, a second game that is already developed, and two more with concepts ready.

## Proposal

**1. One app, many card games.** A single collector app where each card game is a "line" on the shelf. You choose which lines are active when you start a game (all four, or just one), and the shop, market, collection, grading and news hold cards from every active line. One wallet and one collection make cross-game decisions interesting: spend on the hot Wildkin set, or the new release of game two?

**2. A game module for each card game.** Each game brings the same parts: a manifest (cards, sets, art), a rules engine (or a lighter "play strength" model for games that do not need simulated matches), card frames, pack and box art, and an accent theme. The shared engine does everything else. Wildkin becomes the first module; the second game is the test that the boundary is in the right place.

**3. A house style plus a skin per game.**
- **House style (the app):** a collector's den, not a spreadsheet. Dark, warm surfaces (deep ink, a velvet-like card mat), gold and pearl foil accents, one display typeface for headings and one clean text face, cards always shown large with a soft holo sheen on premium prints, product shots front and centre. Calm enough that every game's art looks good on it.
- **Per-game skin:** each line brings its accent colours, logo, pack and box art, a header banner and its own card frames. Wildkin: soft pastel diorama, gold foil, the nine affinity colours.
- Sports and Comics can adopt the house style later; nothing forces them to.

**4. A real name.** "Card Collector" is a description. Some directions to react to (not checked for trademarks yet):
- *Grail House*: the hunt for the one card.
- *Pull Rate*: the thrill of opening packs.
- *Binderline*: collecting and completing.
- *Hobby Hall*: a card shop you live in.
- *Mint Hour*: grading and condition.

The name and the house style should be decided together, after seeing what game two looks like, so they fit all four lines.

## Suggested order

1. Owner shares game two (cards, rules, art direction) and the concepts for three and four.
2. Pick the name and the house style; Claude Code builds a style sheet and a launcher mock-up.
3. Split Wildkin into the first game module without changing how it plays (tests must stay green, saves keep loading).
4. Add game two as the second module.
5. Re-skin the shared screens in the house style; each game keeps its skin.
