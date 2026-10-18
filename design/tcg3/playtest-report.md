# Rift Parade: manual playtest report

## Who played, and what this is not

Two full games were played through the interactive command-line game (`tools/rift-parade/cli.js`) against the "balanced" computer player. **I (Claude, an AI) played them, one decision at a time, reading the same text a human would read.** No human has played Rift Parade yet. These sessions test whether the rules are readable and the decisions are real; they cannot tell us whether people will enjoy it. Full transcripts: `playtests/session-1-chorus-vs-impact.txt` (Resonance Chorus against Impact Wall, I went second, won in 8 rounds) and `playtests/session-2-kinetic-vs-severmark.txt` (Kinetic Rush against Sever and Mark, I went first, won in 6 rounds). Both were won by the human-side player, which also says something about the pilot (below).

## What the sessions showed about the design

| Question | Finding |
|---|---|
| Are turns interesting? | Yes. Every turn had a real choice about which card to slip, what to cast with the energy, and whether to attack. Slipping is the sharpest decision: in session 1 I slipped a zone I never expected to need and was glad of the energy three turns later. |
| Do players understand their options? | After the first turn, yes. The prompt lists every legal action with costs, and `? N` shows card text. Next Episode costs are shown inline ("5 less 4, Next Episode on Lulu, Wrong Way Hero"), which made the ladder easy to use. |
| Do decisions have consequences? | Yes. Examples: attackers exhaust and cannot block, so the computer's all-in attack left it open to exact lethal in session 2; a Backstage Vivi lost her Spotlight protection and was killed by a stored-Impact Release in session 1. |
| Is the signature mechanic fun? | Slip, Next Episode and the reaction window were the most enjoyable. In session 1 a 1-energy Next Episode (Wrong Way Hero to All Together Now) with the team pump produced a 10-damage turn; a held Resonance Overflow turned a bad block into a kill. The Rift gauge mattered less than hoped: it shut Phase off or on and shaped the Anomaly forecast, and an Anomaly fired in only one of the two games (Row Slip in session 1, late). The simulations say Anomalies fire about once a game, so this is consistent, but it is worth watching with human players. |
| Does it have momentum? | Yes: both games snowballed once a player got ahead on board, but the loser had outs (healing, sweepers such as The Forgotten Disaster, and reactions). Stalls happened in session 1 (a healing wall), which is why the simulations measured them and a Strain rule was added. |
| Can players recover? | Session 1 was close from round 5 to 8 (the opponent reached 1 Resolve). Healing, bounce and the Forgotten Disaster countdown gave real recovery paths. |
| Distinct from Tidemark? | Yes in play: energy comes from your own hand, there are no fronts or factions, combat is attack/can't-block with a reaction window, and the Rift and Next Episode have no Tidemark equivalent. |
| Readable rules? | Mostly. Things a new player must learn: attacking exhausts (so cannot block), Phase works only at Rift 3 or more, and Spotlight protects only from the Stage. |
| Frustrating mechanics? | Possibly Release (a stored-damage kill at no energy), and a held Hard Stop that is usually slipped by the computer. Neither felt unfair; both should be watched with humans. |

## Interface problems found and fixed during these sessions

* The action log was only printed at the end of the opponent's turn; it now streams before each prompt.
* Identical cards were listed twice; the lists now show one entry per card name (also for search and discard choices).
* Pull (Nova, Passing Stranger) was mandatory and could return an energy card you wanted to keep; it is now optional.
* Relics were displayed as "0/0"; Phase was shown on Marked Characters that had lost it; the second main phase prompt appeared when only Steps were possible. All fixed.
* Not fixed: menu numbers change after every action, so typing several answers at once (which I did) is error-prone. A real front end should not do that.

## Limits

Two games, one opponent type, played by an AI that had read the rules and card data. No second human, no real-time pressure, no hidden-information bluffing (the computer never reads hidden cards but also never bluffs). Treat the findings as a design review by a careful reader, not as player research.
