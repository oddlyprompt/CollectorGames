# One population, one store network, one engine per game (proposal, 2026-10-21)

Status: proposal for the owner's review. Nothing here is implemented. Everything marked "decided" is Claude's call until approved.

## 0. What the owner asked for (2026-10-21)
- All card games, current and future, **share the market and the stores**. The engine that drives collectors, market prices and the metagame is **separate per game**.
- Engines should be **deep**: prices come from the intent of the people who play and collect, not from fixed formulas.
  - Tidemark: condition, metagame, rarity, synergies.
  - Wildkin: beloved Wildkin, amazing art, rarity, metagame, condition.
  - Rift Parade (later): fan favorites, fan service, chase cards, rarity, character design.
- **Sealed product** is exceedingly rare for the oldest set and grows toward the current day (Tidemark first).
- **Stores differ by game popularity.** Wildkin is the most popular, so stores carry the most of it. Tidemark and Rift Parade are less known: big-box may carry some Tidemark, may carry no Rift Parade, and Rift Parade has to be found at a local game store. About five local game stores take turns hosting regionals and go deeper on the niche games.
- **Existing saves can be wiped.** No compatibility with old worlds is needed.

## 1. What wiping saves lets us delete
This removes most of the cost of the earlier work: there is no first economy to keep alive.
- Delete the first economy paths (the `xtV2()` switch, `ecv`, `window.__xtEcon`, the rebuild button and backup, v1 condition prices, v1 sealed formula) and Wildkin's fixed price formulas as they are replaced.
- Bump the save version; an older save opens to a clear "this save is from an older version and cannot be loaded" message (the launcher already labels prototype saves).
- Re-baseline every golden snapshot once, on purpose, after each phase; the test suites are rewritten around the new model instead of pinning old behaviour.

## 2. The population: people with their own brains (revised 2026-10-21 after the owner's notes)
The population is **procedurally generated and grows**. It is not a fixed list of collector types. Each person is an **agent** with a compact brain, so there can be hundreds of fully simulated people (named regulars you can recognise on the market) plus a statistical crowd of casual people that shapes aggregate demand without being simulated one by one (a performance choice: a few hundred brains ticked weekly is cheap, tens of thousands is not).

**Who they are**
- **Role mix:** player, collector, completionist, investor, flipper, holder, dealer, grader, casual. A person can drift between roles over time (a player who quits keeps their cards and becomes a holder).
- **Where and how much:** home region, which stores they frequent, income and budget cycles, patience.
- **Which games:** an affinity per game that moves with exposure (a Wildkin player sees a Tidemark tournament win and tries it).

**What they want: their personal collection (PC)**
Each person keeps a short list of **PC goals**, formed the way real collectors form them:
- a **character** (a Wildkin and its evolution line), a **deck** (build and keep a specific list), a **spec** (a speculative bet on a card or set), a **set**, an **art style** or an **artist**, a **grade and condition target**, a **sealed collection** (keeps product sealed) or none of these (opens everything).
- **Product preference:** rips packs, buys boxes, buys singles, holds sealed, or flips.
- Goals are chosen from what the person has been exposed to and what their taste favours, and they change: a goal is completed, abandoned when the person gets bored, or replaced after a news event.
These goals are what produce real market behaviour: concentrated demand on a few prints, a sudden run on a deck's cards, completionists clearing a set, flippers chasing the same cards the holders just stopped selling.

**Art is a subjective opinion each person forms, not a score we hand them**
- At build time each illustration gets a set of **visual descriptors** computed from the real image and the checklist (palette and warmth, brightness and contrast, busyness, subject: creature, character, scene, vessel, and for Wildkin the species and scene tags).
- Each person has an **art taste** over those descriptors plus personal quirks, and forms an opinion of a print when they see it (opening packs, browsing the market, a friend's showcase).
- **Taste spreads socially:** a print many aligned people like gets "buzz" (news lines, a favourite on a popular collector's page), which draws in others. So a card can become an art darling for reasons nobody coded, and different worlds crown different favourites from the same cards.
- The game only suggests (a print's descriptors and tier, optionally an editable `art_hints.json`); the people decide.

**The population grows, with spikes**
- People **arrive and leave** all the time, at a base rate that depends on each game's popularity.
- **Spikes** around releases, preorders, major tournaments, reprint news and random news events (a streamer promotes a game, a ban shakes a deck, a famous collection sells); **churn spikes** after a bad ban or a price crash.
- New arrivals are generated from the world seed and the event that brought them, so a new set brings in players, and a championship brings in spectators who become players.

**Cost and scale (stated up front)**
Each detailed brain is about 40 numbers and ticks weekly with small rules; boot under 1 second for 300 brains, a month of play under 2 seconds. The crowd is aggregated per game and region.

## 3. Each game supplies its own appeal engine
The shared code asks a game one thing: **"for this print, how strong is each taste dimension?"** (0 to 1). The game computes it from its own data; the shared code never knows what a "beloved Wildkin" or a "synergy" is.

| Dimension | Tidemark | Wildkin | Rift Parade (needs a spec) |
|---|---|---|---|
| character love | faction and Legendary fandom (decided weights) | beloved Wildkin: mascot flag, evolution family popularity, manifest fandom weights | fan favorites |
| art | descriptors of each illustration; each person forms their own opinion (section 2) | the same, with species and scene tags | character design |
| rarity and chase | rarity, reserve list, alternate art | rarity tiers, SIR and Clasped chase | chase cards |
| metagame and play | usage in the live field, win-rate share | same, from Wildkin's field | same |
| condition | by band, scarcer with age | by band | by band |
| synergy | how many top decks and lists the card combines with (`synergy()` already exists in `decks.js`) | family and partner pairings | per game |
| nostalgia | age of the set, original printings | age of the set | age |
| fan service and hype | hype around releases and events | same | fan service |

Each game declares **which dimensions matter and how much** (its taste map). Tidemark leans on condition, metagame, rarity and synergy; Wildkin on beloved characters and art; neither ignores the rest.

## 4. How prices form (shared kit, per-game parameters)
1. Each person's **interest** in a print = taste vector dot appeal vector, scaled by their affinity for that game, their budget and their role (a player wants the cards in the live field; a completionist wants every card of one set; an investor wants scarce and rising cards).
2. **Demand** for a print = the sum of interest over people who could buy it. **Supply** = copies a buyer can reach (the census and ledger already built for Tidemark economy v2) plus store stock.
3. **Price** moves toward `base x (demand / supply)^e`, damped over weeks and bounded, with grades priced from the population report and condition priced from how scarce each band is. This is the v2 scarcity mechanism with a real demand side.
4. **Anchors for calibration, not hard-coded prices:** pack and box value against retail, chase cards near where they are now, vintage scarcity as in the economy v2 tests.
5. **Listings and sales** are made by people according to their role (a dealer lists fast, a completionist holds their set, an investor holds scarce cards), the same kind of rules the Tidemark `keep` hook uses now.

## 5. Sealed product: a curve from rare to common
Every game gets a print-run curve by set age (decided numbers, tuned by simulation):
- **Oldest set:** almost none survive; on average well under one box in a world, a few packs.
- **Growing with each set** (about x1.5 per set at first, flattening), because more was printed, more was kept and less has been opened yet.
- **Current set:** plenty, and on shelves.
- Opening depletes supply for good (the ledger already enforces this). Price follows contents plus a premium for age and scarcity, so a box is never wildly more than what is in it.
- Wildkin has two sets today and gets the same curve as it grows.

## 6. One store network
A **directory of stores**; each store declares, per game, how much it carries.
- **Big-box chains (2):** the most popular game gets full allocation and weekly restocks. A less known game gets a small allocation, in some stores, some weeks, and only the newest set. A game that is too niche may get none. This depends on each game's **popularity score** (its share of the population's attention), so it moves over time: if Tidemark grows, big-box carries more.
- **Local game stores (5, each named, each in a region):** each has a specialty depth (for example Wildkin-heavy, Tidemark-deep, Rift-deep, general), its own allocation per game, singles case breadth, buylist percentage and a sealed shelf. Niche games are found here first.
- **Regionals:** the local stores take turns hosting a weekly or monthly regional per game (a rotation that favours stores deep in that game). Hosting a regional brings people to the store, spikes demand for the cards in the winning decks, and fills that store's stock for a week.
- **Online singles shops (Kinvault, Saltmarket):** become entries in the same directory with game coverage and a stock rule (real seller-backed stock for old cards, as in v2).
- **Player-facing:** the Shop tab lists every store, what it carries, when it restocks and what event it hosts.

## 7. Engine boundaries in code (shared vs per game)
- `src/tcg/kit/population.js` (people, roles, interest, demand), `kit/stores.js` (the directory, allocation by popularity, regional rotation), `kit/market.js` (what exists now), `kit/economy.js` (price formation).
- `src/tcg/lines/<game>/` holds only what is that game's own: card data, appeal (section 3), supply history (print runs, sealed curve), rules and metagame, packs and set structure. Wildkin and Tidemark code are reorganised into this shape as part of the work, because the old forks are no longer needed to keep old saves working.
- Rift Parade is a new folder plus one registry entry plus its appeal engine.

## 8. How it is tested (quantitative, before it ships)
- **Anchors:** pack and box value against retail for every set; chase card prices within bands that I list before running.
- **Demand responds to what the game says it should:**
  - a deck that rises in the field raises its cards' prices within weeks, and falls with them;
  - at equal rarity, the most beloved Wildkin cost more than the least beloved, by a stated factor;
  - a high-art print costs more than a plain print of the same rarity;
  - a scarce condition costs more, and old copies are worn.
- **Stores:** over a year, Wildkin is available at 90%+ of big-box visits, Tidemark at about 30% to 60%, Rift Parade at 0% before its release and under 10% after; every game is available at one or more local stores; regionals rotate so no store hosts twice running for the same game.
- **Sealed:** expected sealed items alive by set age follow the curve; no box priced above a stated multiple of its contents.
- **Exploits:** auction sniping, buying a store out and reselling, buylist arbitrage, corner attempts, regionals as a money machine.
- **Performance:** boot under 1 second, 30 days under 2 seconds, save size under 250 KB compressed.
- **Playtests:** scripted collectors and players (the completion and discovery agents from the economy v2 suite), and screens driven like a player's (the new Tidemark screen test) for every store and event page.

## 9. Decisions and open items for the owner
1. **Art opinions.** Decided: people form their own opinions from computed image descriptors plus social spread; the game only suggests. An optional `art_hints.json` can nudge a print if you want to seed a favourite.
2. **Number of local game stores:** proposed 5, each in one of 5 regions, named by me (invented names like the existing Tidepool and Lantern Room).
3. **Rift Parade:** needs its card data and rules before its appeal engine can be written; the structure above is ready for it. I found a `feature/rift-parade` branch on the remote but have not looked at it.
4. **Order:** proposed phases, each testable on its own:
   1. the store directory and who carries what, with regionals (mostly visible, low risk);
   2. the shared population (agents with brains, PC goals, growth and spikes) and Tidemark's appeal engine, with the old formulas removed;
   3. Wildkin's appeal engine (beloved characters, art);
   4. the sealed curves and print runs for both games;
   5. Rift Parade when its data exists.
