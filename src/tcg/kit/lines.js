// ===================== CARD-GAME LINES: THE REGISTRY =====================
// A "line" is one trading card franchise in the card-game world (Wildkin, Tidemark, later Rift Parade). Shared code (the journal, the grading reveal,
// the news filters, the boot upgrade) asks this registry which line an item, key or news item belongs to instead of hard-coding letters.
// Lines register themselves at the end of their own boot file. In the sports and comics builds the registry stays empty.
//   kind       the item letter used by objFor, grading returns and the journal ('t' Wildkin, 'x' Tidemark; 'c' cards and 'm' comics are not lines)
//   keyPrefix  first character of a print key ('T|1|5|N')
//   news       the kind of this line's news items
//   openAct    the ACT that opens one of its copies
//   has()      does this save contain the line's world yet
//   copies()   all copy objects, mine() the player's, value(copy), label(copy), mini(copy), submit(id), crack(id)
//   upgrade(progress), boot {at, span, msg}   builds the world when an older save is opened
const CARD_LINES=[];
function registerCardLine(L){ CARD_LINES.push(L); return L; }
const cardLineOfKind=k=>CARD_LINES.find(l=>l.kind===k)||null;
const cardLineOfKey=key=>CARD_LINES.find(l=>l.keyPrefix===key[0])||null;
const isCardGameKind=k=>!!cardLineOfKind(k);
const isCardGameNews=k=>CARD_LINES.some(l=>l.news===k);
// the ACT that opens a copy of this kind: a line's own, comics, or a baseball card
function copyAct(k){ const L=cardLineOfKind(k); return L? L.openAct : k==='m'? 'ccopy' : 'card'; }
