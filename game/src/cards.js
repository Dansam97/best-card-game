// cards.js — the Emberfall Duel card catalogue and deck building.
// Every card belongs to one of four suits, and the suit says what the card does:
//   flame (▲) deals damage, stone (■) raises a shield,
//   leaf (●) mends life, spark (◆) kindles energy and fresh cards.
// A card's `power` is the big readable number on its face: damage, shield or healing done.

export const SUITS = {
  flame: { glyph: '▲', label: 'FLAME' },
  stone: { glyph: '■', label: 'STONE' },
  leaf: { glyph: '●', label: 'LEAF' },
  spark: { glyph: '◆', label: 'SPARK' },
};

export const CARD_TYPES = [
  { id: 'cinder-jab', name: 'Cinder Jab', suit: 'flame', cost: 1, power: 4, kind: 'damage', text: 'Deal 4 damage.', copies: 5 },
  { id: 'flame-lance', name: 'Flame Lance', suit: 'flame', cost: 2, power: 7, kind: 'damage', text: 'Deal 7 damage.', copies: 4 },
  { id: 'ember-meteor', name: 'Ember Meteor', suit: 'flame', cost: 3, power: 11, kind: 'damage', text: 'Deal 11 damage.', copies: 2 },
  { id: 'stone-aegis', name: 'Stone Aegis', suit: 'stone', cost: 1, power: 6, kind: 'shield', text: 'Gain 6 shield.', copies: 4 },
  { id: 'bulwark', name: 'Bulwark', suit: 'stone', cost: 2, power: 10, kind: 'shield', text: 'Gain 10 shield.', copies: 2 },
  { id: 'grove-tonic', name: 'Grove Tonic', suit: 'leaf', cost: 2, power: 6, kind: 'heal', text: 'Restore 6 life.', copies: 3 },
  { id: 'renewal', name: 'Renewal', suit: 'leaf', cost: 1, power: 3, kind: 'heal', text: 'Restore 3 life.', copies: 2 },
  { id: 'ember-siphon', name: 'Ember Siphon', suit: 'leaf', cost: 2, power: 4, kind: 'siphon', text: 'Deal 4 damage and restore 4 life.', copies: 2 },
  { id: 'kindle', name: 'Kindle', suit: 'spark', cost: 0, power: 1, kind: 'kindle', text: 'Gain 1 energy and draw 1 card.', copies: 3 },
];

const typeById = new Map(CARD_TYPES.map((card) => [card.id, card]));

export function cardType(id) {
  return typeById.get(id);
}

// Build a fresh shuffled deck of card ids from the catalogue's copy counts.
export function buildDeck(rng) {
  const deck = [];
  for (const card of CARD_TYPES) {
    for (let i = 0; i < card.copies; i += 1) deck.push(card.id);
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
