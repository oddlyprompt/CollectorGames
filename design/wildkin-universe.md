# Wildkin universe (the owner's plan)

**Status: this is the source of truth.** The Wildkin currently in the game is a placeholder prototype and will be replaced, not extended. The owner is still developing the concept, so expect this file to grow.


Locked: **150 root creatures**, about **245 species and forms** in total.

| Group | Roots | 3-stage families | 2-stage families | Standalone | Final species and forms |
|---|---|---|---|---|---|
| Mascots | 40 | 12 | 13 | 15 | 77 |
| Lesser Wildkin | 110 | 18 | 22 | 70 | 168 |
| **Total** | **150** | **30** | **35** | **85** | **245** |

The arithmetic was checked: 12+13+15 = 40, 18+22+70 = 110, forms 12x3 + 13x2 + 15 = 77 and 18x3 + 22x2 + 70 = 168, so 245 forms from 150 roots.

## The first ten mascots (defined by the owner)
| # | Wildkin | Line | Affinity | Role |
|---|---|---|---|---|
| 01 | Cactuft | Standalone | Verdant | Primary lovable mascot; weird, cheerful, instantly recognisable |
| 02 | Prismotl | Prismotl, Opalotl, Aurorotl | Tide / Astral | Wonder mascot; beautiful, magical, collector-friendly |
| 03 | Bashlet | Bashlet, Maceback, Fortisaur | Stone | Classic starter-style hero; toughness and progression |
| 04 | Koirune | Koilet, Runakoi, Koirune | Tide / Astral | Prestige icon; ancient, elegant, high-end chase-card creature |
| 05 | Shelladin | Rolyte, Shelladin, Aegisopod | Stone / Iron | Defender mascot; noble but slightly ridiculous |
| 06 | Frondolin | Frondolin, Pangrove, Canopang | Verdant | Forest guardian; calm, sturdy, ancient |
| 07 | Candicoil | Candicoil, Spiramel | Wonder | Oddball fan favourite; playful and visually strange |
| 08 | Astrynx | Creskit, Astrynx | Astral | Cool mascot; mysterious night creature |
| 09 | Berribat | Berribat, Pompyre | Dusk / Verdant | Mischief mascot; spooky-cute, seasonal potential |
| 10 | Flapod | Standalone | Tide | Weird beloved standalone; comic personality |

Used so far: 5 three-stage, 3 two-stage, 2 standalone (23 forms).
Still to define among the 40 mascots: **7 three-stage, 10 two-stage, 13 standalone** (54 forms). All 110 lesser Wildkin are undefined.

## Decisions still open
1. **Affinity list.** The game and its art currently use nine energy types: Flame, Tide, Grove, Radiant, Void, Frost, Storm, Stone, Lunar (one energy sheet already made). This plan uses Verdant, Tide, Astral, Stone, Iron, Wonder, Dusk, with dual affinities. Either rename the nine (suggestion: Verdant = Grove, Astral = Lunar, Dusk = Void, Wonder = Radiant) and decide what Iron is, or define a new list. Lock this before more art is made: each affinity needs energy art, habitat art, a frame colour and its own deck archetypes.
2. **Dual affinities.** The engine gives each card one type. Dual types need a rule (weakness, energy costs, deck archetypes).
3. **Mascot ranking.** Which few mascots carry the big money? (The prestige icon, Koirune, is the natural top chase.)

## How it maps onto the game
- A **family** record: root, name, stages (form, stage number, evolves from), affinity (one or two), role, fandom score.
- A **card** points at a form. Basics sit in commons, Stage 1 in uncommons, Stage 2 in rares and holos, standalone mascots in rares and ultras, with alternate-art chase cards of final forms.
- **Fandom** is heavy-tailed: a handful of mascots hold most of the value. This is the lever for $300 to $1,500 chase cards. Lesser Wildkin fill the commons and uncommons.
- **Collector chases:** "complete the line" and "every form of one mascot".
- **Metagame:** evolution lines should matter (a Stage 2 deck needs its Basic and Stage 1), so archetype strength should account for line completeness.
- **Cadence:** two sets a year for 6 to 7 years is about 13 sets, so about 19 new forms per set.

## Art plan (creature art only)
Generate a family on one sheet so the stages stay consistent.
| Sheet type | Layout | Sheets |
|---|---|---|
| 3-stage family | 3 stages x 3 poses | 30 |
| 2-stage families | 2 families per sheet, 2 stages x 2 poses each | 18 |
| Mascot standalone (15) | 9 poses of one creature | 15 |
| Lesser standalone (70) | 9 different creatures, one pose each | 8 |
| **Creature art total** | | **71** |

Plus about 54 sheets for scenes (about 20), chase paintings (about 13) and trainers, items and stadiums (about 20), so roughly 125 sheets over seven years.
The first three sets need only about 20 to 25 creature sheets, so start with the first families and release more each year.
Creature sheets use a flat green screen (magenta for green creatures), about 10% margin, no text. Cut them with `tools/ingest.py`.

## Art decisions made so far
- **House style for base creatures: a soft, toy-like 3D render.** (Anime-style creatures do not fit; the owner confirmed all base creatures are 3D.)
- **Backgrounds start over.** None of the earlier prototype backgrounds are used. New backgrounds must match the creatures' 3D look (the miniature-diorama panel in the Cactuft examples is the direction). Creatures are rendered in soft studio light, so cutout scenes need soft, even lighting; dramatic coloured lighting is for painted chase cards only.
- **Pose sheet template (3x3, one creature per sheet):** standing, jumping, running, waving, sitting, sleeping curled up, surprised, looking up, three-quarter back view. Flat screen colour: green for most creatures, magenta for green ones. Ask for about 10 percent empty margin and no effect marks (the "!" bursts, sparkles and speed lines cut out as stray pieces).
- **Chase cards are full paintings** (the owner's three Cactuft examples: hero portrait, action burst, cozy macro diorama). Generate at card shape (5:7), subject clear of the top and bottom quarters, highest resolution available.
- **Sheets received so far (pose sheets):** Cactuft (magenta), and five more that read as Frondolin (leaf pangolin, magenta), a koi dragon in the Koilet line (green), Rolyte (armoured roly-poly, green), Flapod (dumbo octopus, green), Bashlet (blue ankylosaur, green). All cut cleanly; no screen colour left.
- **Known cutout limits:** hairline details (the koi dragon's whiskers) break up; a white body picks up a faint green tint from the screen. Both are fixable in `tools/ingest.py`.
