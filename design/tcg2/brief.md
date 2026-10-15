<!-- The owner's brief for the second card game, pasted into the conversation on 2026-10-16 and saved here unchanged. Source of truth; the proposals that answer it are in proposals.md. -->
# Second TCG — Design & Development Brief

Project: CollectorGames
Status: Early concept and systems design
Working identity: Untitled Land & Sea High-Fantasy TCG
Purpose: Provide context for future game development, card generation, and integration into the existing collector simulator.

## 1. Core Concept

We are developing a second fictional trading card game to exist alongside Wildkin in the CollectorGames simulation.

Unlike Wildkin, which is a colorful, creature-focused collectible card game, this second TCG is a more traditional high-fantasy strategy card game, broadly familiar to collectors of Magic: The Gathering.

However, we do not want to reproduce Magic's mechanics. The objective is to create an original game with recognizable collecting conventions, strategic depth, distinct mechanics, and a believable secondary market.

Its defining theme is Land versus Sea.

The fictional world is dominated by oceans, islands, coastal kingdoms, underwater civilizations, and land-based empires. Magic, creatures, soldiers, monsters, artifacts, and ancient civilizations exist across both environments.

The world should feel expansive, mysterious, and lived-in, rather than being exclusively pirate-themed.

## 2. Fictional History and Launch Strategy

This TCG will be introduced into CollectorGames as an already-established game celebrating its 10th anniversary.

Players should feel that the game existed before they started collecting it.

### Historical collection approach

We do not need to generate ten complete years of fictional card releases.

Instead:

- Create a representative historical card library spanning different eras.
- Include original printings, discontinued cards, historically important rares, forgotten commons, and valuable early cards.
- Introduce the active game through a 10th-anniversary release.
- Reuse historical cards and illustrations within anniversary reprints.
- Allow older cards and sealed products to appear through garage sales, online marketplaces, collections, and other acquisition systems.
- Expand the historical library over time when necessary.

The goal is a believable collecting history, not a fully reconstructed historical game.

### Reprint policy

Future releases should include a defined proportion of reprints from previous sets.

Standard reprints reuse existing illustrations.

Special anniversary treatments or alternate-art versions may receive new illustrations, but these should be exceptions rather than requirements.

The precise reprint percentage remains undecided.

### Collector-market implications

A card's identity and its individual printings must be tracked separately.

For example, an original printing of a powerful card could be worth substantially more than a modern reprint with identical gameplay functionality.

Market values can reflect:

- Original printing and release era
- Rarity and print availability
- Competitive usefulness
- Reprint history
- Collector demand
- Historical significance
- Bans, restrictions, and evolving competitive trends

The existing CollectorGames market simulation should eventually support these distinctions.

## 3. Visual Identity

### Art direction

Traditional painterly high fantasy with a strong nautical influence.

The art should be:

- Illustrative, detailed, and readable at trading-card size.
- Varied in subject, composition, lighting, and atmosphere.
- Clear about the character, creature, object, or event being depicted.
- Consistent with the world without looking artificially uniform.

Avoid the stereotypical AI-generated high-fantasy aesthetic where every character is excessively ornate, dramatically backlit, glowing, or presented as an epic legendary figure.

A fisherman, soldier, dockworker, or ordinary forest creature should look appropriately ordinary.

Major legendary cards can have more dramatic compositions, but the entire collection should not look like premium showcase artwork.

### Production approach

Continue using the established 3×3 image-sheet workflow, generating nine individual illustrations per sheet.

Each cell represents one card illustration.

The production pipeline should enforce:

- Clear subject identification
- Readable silhouettes
- Appropriate composition and framing
- No unintended text, symbols, or UI elements in illustrations
- Consistent visual direction within a sheet
- Sufficient margins for cropping
- Correct subject-to-card mapping

Unlike Wildkin, illustrations generally represent complete card scenes rather than reusable creature poses.

### Rarity treatments

This game does not require Wildkin-style premium creature artwork or elaborate rarity-dependent frames.

Rarity should primarily be communicated through the card's rarity symbol, similar to traditional fantasy TCGs.

Claude can handle rarity symbols and other card-frame treatments programmatically.

This should substantially reduce the illustration workload.

## 4. Seven Core Card Types

| Card Type | Function |
|---|---|
| Units | Creatures, soldiers, monsters, magical beings, and other combatants |
| Spells | Direct magical effects, attacks, counters, and tactical actions |
| Relics | Magical objects, equipment, artifacts, and persistent tools |
| Vessels | Ships and other mobile assets, particularly associated with Sea strategies |
| Strongholds | Castles, fortresses, defensive structures, and fortified positions |
| Domains | Environments and territories that alter battlefield conditions |
| Enchantments | Persistent magical effects and ongoing modifications |

### Vessels versus Strongholds

These are deliberately separate card types.

Vessels emphasize movement, transportation, tactical positioning, and coordinated attacks.

Strongholds emphasize defense, protection, territorial control, and sustained advantages.

They provide strategic counterparts for Sea and Land decks without being exact mechanical duplicates.

Neither should be mandatory for its corresponding environment.

### Domains

Domains represent environmental conditions or locations, such as reefs, forests, islands, mountain passes, and magical territories.

Domains may affect both players and create changing tactical conditions.

They are distinct from Strongholds.

## 5. Land and Sea — Central Gameplay Identity

Land and Sea are not merely thematic labels. They are the game's defining mechanical distinction.

Players should be able to construct:

- Dedicated Land decks
- Dedicated Sea decks
- Hybrid Land/Sea decks

### Universal combat

Proposed rule: Land units can attack Sea units and vice versa.

We do not want hard restrictions that make large portions of a deck unusable against particular opponents.

Environmental differences should create tactical advantages rather than automatic victories.

### Strategic characteristics

Land

- Defensive stability
- Fortifications
- Territorial control
- Sustained combat
- Stronghold synergies

Sea

- Mobility
- Disruption
- Tactical repositioning
- Surprise attacks
- Vessel synergies

Hybrid

- Adaptability
- Cross-environment combinations
- Broader tactical options
- Potential resource or efficiency tradeoffs

These are initial design identities, not rigid rules for every card.

### Balance philosophy

No environment should inherently dominate another.

The goal is to create situations where a carefully constructed Land deck can counter a popular Sea strategy, or vice versa.

Environmental advantages should be asymmetric and strategically interesting.

As an initial balance target, established competitive archetypes should ideally maintain matchup win rates around 45–55%, subject to testing.

The game's evolving meta should influence card demand, values, and the collector-market simulation.

## 6. Resource System — Influence

Proposed system, not yet finalized.

Rather than copying Magic's land-based resource system, we discussed a resource called Influence.

### Basic progression

- Players automatically gain one additional Influence capacity per turn.
- Maximum capacity is tentatively 10.
- Resource generation does not depend on drawing dedicated resource cards.
- Cards require Influence to play.

The goal is to reduce resource-related bad draws while preserving strategic deck-building decisions.

### Allegiance requirements

Cards may also have Land, Sea, Dual, or Neutral allegiance requirements.

Illustrative examples:

| Card | Influence | Allegiance |
|---|---|---|
| Coastal Swordsman | 2 | Land |
| Tidecaller | 3 | Sea |
| Harbor Sentinel | 4 | Dual |
| Ancient Leviathan | 8 | Sea |
| Wandering Merchant | 2 | Neutral |

A separate allegiance progression or commitment system could make dedicated decks more efficient while allowing hybrid decks to remain competitive.

Important: The exact allegiance mechanics have not yet been defined. Do not invent finalized rules without further design discussion.

## 7. Game Complexity and Accessibility

The game should feel immediately understandable to someone familiar with traditional fantasy TCGs.

Familiar concepts include:

- Combat units
- Spellcasting
- Persistent effects
- Equipment and artifacts
- Rarity
- Deck archetypes
- Competitive metas
- Reprints and collectible printings

However, the Land/Sea system, Vessels, Strongholds, Domains, and Influence should provide a distinctive identity.

The objective is strategic depth without unnecessary complexity.

Match length, deck size, turn structure, combat resolution, and victory conditions remain undecided.

## 8. Integration Into CollectorGames

This TCG is being developed primarily for the collecting and market-simulation experience.

Its underlying game mechanics must be coherent enough to support believable competitive simulations.

Players should experience:

- New set releases
- Historical cards entering the market
- Competitive archetypes rising and falling
- Cards increasing in value because of new combinations
- Reprints affecting secondary-market prices
- Ban and restriction discussions
- Collector demand for early printings
- Older sealed products and collections
- Different collecting strategies across multiple fictional TCGs

The existing CollectorGames simulation already has systems intended to model competitive relevance, bans, market reactions, and simulated news.

This new game should integrate with those systems rather than creating redundant ones.

The player does not necessarily need to play full competitive matches for these mechanics to matter. The rules should provide a coherent foundation for simulated competition and believable market behavior.

## 9. Design Decisions Still Outstanding

Before generating the complete card catalog, resolve:

1. Final name and branding for the TCG.
2. Core game rules, including turn structure, combat, victory conditions, and deck size.
3. Exact Influence and Allegiance mechanics.
4. Detailed functions of the seven card types.
5. Factions and civilizations within Land and Sea.
6. Rarity tiers and set composition.
7. Historical eras and representative historical sets.
8. Size and structure of the 10th-anniversary launch set.
9. Reprint percentage and policy for future releases.
10. Artwork production checklist and card-frame system.
11. Competitive archetypes and market-value simulation rules.
12. Release cadence and long-term expansion structure.

## 10. Guidance for Claude

Treat this document as a design foundation, not a completed implementation specification.

Do not independently finalize unresolved gameplay mechanics or generate a large card library before the systems are approved.

Prioritize:

1. Mechanical coherence.
2. Believable collecting history.
3. Sustainable illustration production.
4. Compatibility with existing CollectorGames systems.
5. A distinct identity from Wildkin and Magic: The Gathering.

The ultimate objective is a fictional TCG that feels established, collectible, strategically credible, and capable of supporting years of simulated releases without requiring an unsustainable art-production workload.
