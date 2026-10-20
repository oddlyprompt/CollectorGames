// ===================== CARD KIT: ECONOMY STRATEGIES (v1 DEFAULTS) =====================
// A line's economy is a set of strategies the shared pipeline calls (design/shared-tcg-architecture.md section 3b). Version 'v1' is the behaviour both games had
// when the refactor began; a line replaces a strategy only where its market genuinely differs, as a new version (v2) with its own golden baselines.
//   condition.sample(r, src, age)   the four condition scores of a new copy: r a random source, src 'pull'|'shop'|'deck'|other, age in years since release
//   condition.price(scores, card)   the multiplier condition applies to a raw price (v1: by label only; v2 may use the card's rarity, age and value)
const CONDITION_V1={ version:'v1', mult:{NM:1,LP:0.82,MP:0.6,HP:0.4,DMG:0.22},
  sample(r, src, age){ return src==='pull'? condFresh(r,0.55) : src==='shop'? condFresh(r,0.7) : condWorn(r, age, src==='deck'?1.5:1); },
  price(c, card){ return this.mult[condLabel(c)]; } };
