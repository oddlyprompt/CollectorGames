# Tidemark Collector: the game (status, decisions, gaps)

Added 2026-10-19. The owner asked for Tidemark in the collector game "like Wildkin: sets, packs, prices, market and the living metagame, using
`tidemark-production/cards.json` and `tools/tidemark/v1`". This file says what exists, what Claude **decided** (none of it is canon until the owner
approves it) and what is missing. The code map is in `CLAUDE.md` (section "Tidemark Collector: the fourth game").

## What you can do
- Start a game (five scenarios: a fresh start, pocket change, a preorder of 12 Tenth Tide packs, a preorder of 2 boxes, deep pockets) on 1 June 2026.
- **Tenth Tide** is announced on day one with its Legendaries and alternate arts shown; the rest is revealed over the following weeks; it releases on **26 June 2026**.
  Preorders (retail price, charged on the day), big-box retail (restocked Mondays), the local game store (the Lantern Room: a Thursday allocation, a weekly case of
  singles, a buylist at 55%) and Saltmarket (online singles, every printing near mint at market +15%).
- **Ten years of history** are already in the world: 30 sets from First Tide (2016) to Tidelines (2025), 500 named cards, each in regular and foil. Their singles and
  their sealed packs and boxes are on the marketplace, in Saltmarket and in the Lantern Room's case. An old pack opens into its named cards plus bulk.
- The marketplace, grading (GCS), listing, auctions, offers, the 3D inspector, the journal and saves are the shared ones, exactly as in Wildkin.
- Collection goals (an alternate-art pull, every faction, one of each card type, a card from every set, the reserve list, the anniversary base set, every
  alternate art, the master set...), a wantlist with the cheapest source, set checklists with Missing and Wantlist filters, sell duplicates.
- A metagame that lives: the field, weekly shifts, Swiss events with a top 8 and a final **played by the rules engine**, new decks and re-tunes appearing,
  dead decks leaving, bans, all moving card prices.

## Decided by Claude (2026-10-19), not canon
| What | Decision |
|---|---|
| Start date and release | The game starts 1 June 2026. Tenth Tide releases Friday 26 June 2026 (the checklist says only "spring 2026"; the brief says "a few weeks in"). |
| Historical release dates | Third Friday of April, July and October of each set's year (the checklist gives year and season only). |
| Prices | Pack $4.99, box (36 packs) $144; the Lantern Room $5.49 / $159.99. |
| Pack | 12 cards: 8 common, 3 uncommon, 1 rare slot; Legendary instead of the rare 1 pack in 8; a foil replaces a common 1 pack in 6 (rarity 60/28/10/2% C/U/R/L); an alternate art replaces the rare slot 1 pack in 60 (Tenth Tide only). |
| Bulk | A historical set is 200 or 250 cards but only its named cards exist. An unnamed slot is bulk, worth 2 cents, sold to the bulk bin when a pack is opened. |
| Print policy | Only Tenth Tide is printed (425 days, restocked Mondays, then out of print). Every older set is out of print at the start. |
| Formats | Standard before Tenth Tide = sets of the last two years (5 sets on day one; play value from card ratings only). When Tenth Tide releases, Standard = its 220 cards alone (announced as a rotation); every other card is Eternal-only. The engine does not simulate Eternal; its demand comes from card rating alone. |
| Collector fandom | Faction weights (Free Fleets .66, Abyssal Choir .62, Thornwild .55, Tideborn .52, Crownlands .50, Iron Reach .46, Harbor Leagues .42, Neutral .34), plus Legendaries, Vessels and the reserve list. |
| Prices over time | Original printings gain 22% a year of collector premium (reprints 7%), the reserve list up to 4x. Tenth Tide has a launch premium that fades in about a month, then anchors near retail while on shelves and rises once out of print (see `tools/tidemark_econ.py`). |
| Stores | The Lantern Room (local game store) and Saltmarket (online singles) are invented names, like Wildkin's stores. |
| Fields | The format opens with 15 decks (the 10 archetypes of `decks.js` and the 5 lists that did best against them in the library). |

## The metagame, how it is computed
`tools/tidemark/v1/library.js` plays everything at build time with the real engine (about 25 ms a game, both seats) and writes `meta_library.json`: the lists,
and a win-rate matrix between every pair. The game then runs the Wildkin model on top of it (shares drift toward what beats what everyone plays; events nudge
shares; brews, re-tunes and build-arounds come from the library and are tested against the six most played decks before one is brought; a new list plays
5 points worse for six weeks; a deck under 0.8% for six weeks leaves and is not rediscovered for a year; a deck above 18% for ten weeks gets its key card banned; 24% as in Wildkin let one deck lead for years in this field).
Live in the browser: tournament finals (one game each), ban tests (each candidate card is removed by rebuilding the deck and replaying it against six decks) and
the lists rebuilt after a ban. Numbers: see the `META` line printed by `tools/tidemark_econ.py` (CLAUDE.md has the measured values).

## Gaps and known issues
- **No sets after Tenth Tide.** The data ends there: no new releases, no further rotation. The living field and the market keep running; a second anniversary-era
  set needs designs and art first.
- **Three paintings are missing from the repository** (Sentinel of Azure Keep, Roothorn Stag, Choir-Depth Leviathan: approved by the owner, files not supplied). Those cards draw ART PENDING.
- No packaging renders: packs and boxes are drawn by the game from the set's own paintings. The anniversary collector box from the brief is not made.
- Eternal is not played by the engine; the 430 historical cards Tenth Tide does not reprint get their play value from a rating.
- Card rules are designed and balanced by simulation; nobody has played them (see `BALANCE.md`).
- A ban takes about five seconds to decide in the browser, and about the same to rebuild the field when it takes effect. Never tested on a real phone.
