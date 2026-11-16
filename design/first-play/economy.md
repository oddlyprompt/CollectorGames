# Phase 2, task 2: economy validation across seeds

Tool: `node tools/agents/validate.cjs --resume design/first-play/economy-runs.jsonl` (the existing robot players, `tools/agents/`, unchanged except for two added strategies and a quick-sale valuation). 57 runs: eleven strategies on seeds 11, 23, 7, 5 and 42, plus the reviewer's scalper on seeds 7 and 23, each for 540 days. No run crashed and the game logged no error in any of them. Raw results: `design/first-play/economy-runs.jsonl`.

**How to read the numbers.** Every strategy but one starts with $2,000 and no allowance. "Return" counts **cash plus what the holdings would fetch today by the quick route** (a single at the best offer any shop makes for it, nothing if no shop wants it; sealed product listed at 90% of its value, less the marketplace's 10% fee), against the money put in. "Paper" prices every card at its full estimated value instead, which is what the game's own net-worth figure shows. The gap between the two is what it costs to turn a collection back into money.

## Results

| Strategy | What it does | Return: median (min to max) | Paper: median (min to max) | Actions a day |
|---|---|---|---|---|
| idle | nothing | 0% | 0% | 0 |
| ripper | 10 packs a week, keeps everything | **-39%** (-45 to -13) | 0% (-11 to +42) | 0.9 |
| ripseller | lists pulls worth $2+, sells the rest to shops monthly | -31% (-80 to -4) | -12% (-61 to +16) | 2.3 |
| dumper | sells every pull to shops at once | -69% (-78 to -23) | -48% (-60 to -2) | 2.5 |
| sniper | marketplace listings at 70% of value or less | +18% (+8 to +21) | +19% | 0.3 |
| clearance | sealed off shelves when under 80% of value, relisted | **+116%** (+111 to +118) | +117% | 1.8 |
| investor | six boxes of each release, held | +17% (+3 to +38) | +45% (+27 to +71) | 0 |
| grader | near-mint $25+ cards, graded, sold | +6% (-2 to +76) | +6% | 0 |
| picker | shop singles tagged at 70% of value or less | +12% (+11 to +15) | +12% | 0.5 |
| hunter | shops, yard sales, collections, shows | +28% (+24 to +38) | +44% (+37 to +62) | 1.4 |
| **allowance** | the default start, collects a set, never resells sealed | -22% (-32 to -5) | -2% (-12 to +15) | 1.9 |
| scalper (seeds 7, 23) | the reviewer's launch-week strategy | +108% and +117% | +108% and +119% | 2.3 |

## What the numbers say

**Opening packs costs money, as it should.** A pack on a stocked shelf is now worth about its price on paper (median 0%), and a pile of opened cards sells for about 60 cents on the dollar. Selling pulls to shops as you go is the worst thing you can do with them (-69%). The spread on `ripseller` (-80% on seed 5, -4% on seed 23) is pull luck: on seed 5 it sold $1,141 of cards from 675 packs, on the others about $2,500; that strategy lives on hitting a chase card.

**The collector on an allowance gets a collection, not a profit.** Over 18 months the allowance player put in $3,925 ($75 and 77 Fridays), opened 456 packs, went to 19 card shows and 24 to 38 yard sales, and ended with:
- 88% to 93% of the newest Wildkin set and 83% to 87% of First Bond;
- regular at four or five of the five independent shops, friend of one (on four of five seeds);
- 7 or 8 of the 10 hunting goals;
- $1,435 to $2,079 still in cash, a collection worth $2,000 to $2,560 on paper and $1,220 to $1,650 if dumped.
This robot is frugal by rule (at most six packs a week, singles under $3), so the unspent cash says more about the robot than about the game; but it does confirm the reviewer's remark that money is not tight on the default allowance after the first weeks.

**Knowledge and legwork pay modestly and evenly.** Picking shop bargains: +11% to +15% on every seed, 38 to 77 finds. The full hunt: +24% to +38% in cash terms. Sniping the marketplace: +8% to +21%. None of these is risky and none is large; they scale with attention, not with capital.

**Patience pays on paper.** Boxes held from launch are worth 27% to 71% more after 18 months (First Bond leaves print in month 14), but only +3% to +38% if sold quickly.

**Standing advances with trade, not with time alone.** Strategies that never trade singles with a shop stay strangers. The picker (weekly rounds and small purchases) is a regular everywhere and a friend of one shop on two seeds after 18 months; the allowance player likewise. Reaching "regular" took the allowance player well under a year at its usual shop. Nobody reached friend at more than one shop.

## Exploits

**Launch-week flipping is still the most profitable thing in the game, and it is bounded.** The reviewer's scalper, reproduced: **+117% on seed 7 and +108% on seed 23 over 540 days** (the reviewer measured about +177% to +209% over 200 days before the fix). The built-in `clearance` robot agrees on all five seeds (+111% to +118%). Where the money comes from, seed 7, total worth every 30 days: $2,000 at the start, $3,048 on day 30 (First Bond and Tenth Tide launch), $3,338 on day 90 (Broken Reach), $4,154 on day 210 (Duskfall), then **flat: $4,264 on day 300 and $4,373 on day 540**. So it earns only in the weeks around a release, when the product really is selling out; it earns nothing once shelves are full; and the per-customer weekly limits cap it at roughly $400 to $1,000 a release however much money the player has (the same dollars on seed after seed).

Judgment: **not changed.** It is not unlimited, it is not hidden, it needs capital a new player does not have (a box costs twice the starting cash), and "the week a set comes out is different" is true to the hobby. It is still out of proportion to everything else (+116% against +28% for the full hunt), so it is listed as a design decision for the owner rather than a defect to patch in a stabilisation pass.

No other strategy found a loop or a runaway: no negative cash, no shop driven bankrupt, no card created or lost (`hunt_test.cjs` and `retail_test.cjs` check ownership every 50 days of a 400-day run).

## Relative viability, in plain words

| If you want to... | It works like this |
|---|---|
| open packs for fun | about break-even on paper, a real cost if you ever sell |
| complete a set on pocket money | about 90% in 18 months with shops, shows and yard sales; the last tenth is the chase cards |
| make money by knowing prices | small, steady, safe: +10% to +30% over 18 months |
| make money at launch | the best return in the game, a few hundred dollars a release, needs a bankroll and a round of every store |
| invest in sealed boxes | slow; the pay-off starts when a set leaves print |
| grade cards | rarely possible on $2,000: one to three suitable cards turn up in 18 months, and one of them made +76% on seed 42 |

## Limits of this validation
- Robots, not people. A robot never gets bored, never misreads a screen and never falls for a card it likes.
- Five seeds. Returns were tight across them for every strategy except those that depend on pulls.
- The allowance robot collects Wildkin only. Tidemark and Broken Reach were exercised by the other strategies (all buy from every game's shelves) but no robot *collects* them.
- The quick-sale value ignores that a shop's cash and case space are finite, so it is slightly generous for large collections.
- Marketplace auctions, preorders and grading turnarounds were not strategies of their own.
