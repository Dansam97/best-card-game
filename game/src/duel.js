// duel.js — the Emberfall Duel state machine and Brix's brain.
// One duel: both duelists start at 20 life. Each round the player spends a refilling
// pool of energy on cards from a hand of four, then ends the turn and Brix carries out
// the intent he declared at the start of the round — so his next move is always on the
// table, readable, and ready to be countered with a shield or a bigger hit.

import { buildDeck, cardType } from './cards.js';

export const START_LIFE = 20;
export const HAND_SIZE = 4;

// Small deterministic RNG (mulberry32) so a given seed always plays the same duel.
export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function energyCapForRound(round) {
  return Math.min(round + 1, 5);
}

export function newDuel(rng) {
  const state = {
    round: 1,
    youLife: START_LIFE,
    foeLife: START_LIFE,
    youShield: 0,
    foeShield: 0,
    energy: energyCapForRound(1),
    energyCap: energyCapForRound(1),
    deck: buildDeck(rng),
    discard: [],
    hand: [],
    foeHandCount: HAND_SIZE,
    intent: null,
    over: null,
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0 },
    log: [],
  };
  drawUpTo(state, rng);
  declareIntent(state, rng);
  state.log.push('Brix bows. "Show me your fire, ashen one."');
  return state;
}

function drawOne(state, rng) {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return;
    state.deck = state.discard;
    state.discard = [];
    for (let i = state.deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }
  state.hand.push(state.deck.pop());
}

function drawUpTo(state, rng) {
  while (state.hand.length < HAND_SIZE) {
    const before = state.hand.length;
    drawOne(state, rng);
    if (state.hand.length === before) return;
  }
}

// Damage always eats shield first; returns the life actually lost.
function applyDamage(state, side, amount) {
  const shieldKey = side === 'you' ? 'youShield' : 'foeShield';
  const lifeKey = side === 'you' ? 'youLife' : 'foeLife';
  const blocked = Math.min(state[shieldKey], amount);
  state[shieldKey] -= blocked;
  const through = amount - blocked;
  state[lifeKey] = Math.max(0, state[lifeKey] - through);
  return through;
}

// Brix telegraphs his next move. He favours attacks, mends when hurt, and hides
// behind stone when the player is sitting on a full hand of flame.
export function declareIntent(state, rng) {
  const roll = rng();
  let intent;
  if (state.foeLife <= 7 && roll < 0.5) {
    intent = { kind: 'heal', power: 6, name: 'Ashen Prayer', text: 'Brix will restore 6 life.' };
  } else if (roll < 0.18) {
    intent = { kind: 'shield', power: 7, name: 'Stone Stance', text: 'Brix will gain 7 shield.' };
  } else if (roll < 0.28) {
    intent = { kind: 'siphon', power: 4, name: 'Soul Siphon', text: 'Brix will deal 4 damage and restore 4 life.' };
  } else if (state.round >= 3 && roll > 0.9) {
    intent = { kind: 'damage', power: 11, name: 'Meteor Call', text: 'Brix will deal 11 damage!' };
  } else if (roll > 0.55) {
    intent = { kind: 'damage', power: 8, name: 'Heavy Blow', text: 'Brix will deal 8 damage.' };
  } else {
    intent = { kind: 'damage', power: 5, name: 'Ember Strike', text: 'Brix will deal 5 damage.' };
  }
  state.intent = intent;
  return intent;
}

// Play one card from the player's hand. Returns false when it cannot be played.
export function playCard(state, handIndex, rng) {
  if (state.over) return false;
  const id = state.hand[handIndex];
  if (id === undefined) return false;
  const card = cardType(id);
  if (card.cost > state.energy) return false;
  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  state.discard.push(id);
  state.stats.cardsPlayed += 1;

  if (card.kind === 'damage') {
    const through = applyDamage(state, 'foe', card.power);
    state.stats.damageDealt += through;
    state.log.push(`You play ${card.name} — ${through} damage gets through.`);
  } else if (card.kind === 'shield') {
    state.youShield += card.power;
    state.log.push(`You play ${card.name} — your shield rises to ${state.youShield}.`);
  } else if (card.kind === 'heal') {
    const healed = Math.min(card.power, START_LIFE - state.youLife);
    state.youLife += healed;
    state.log.push(`You play ${card.name} — ${healed} life restored.`);
  } else if (card.kind === 'siphon') {
    const through = applyDamage(state, 'foe', card.power);
    const healed = Math.min(card.power, START_LIFE - state.youLife);
    state.youLife += healed;
    state.stats.damageDealt += through;
    state.log.push(`You play ${card.name} — ${through} damage dealt, ${healed} life drained back.`);
  } else if (card.kind === 'kindle') {
    state.energy += card.power;
    state.log.push('You play Kindle — the embers flare, +1 energy and a fresh card.');
    drawOne(state, rng);
  }

  if (state.foeLife <= 0) {
    state.over = 'win';
    state.log.push('Brix falls to one knee, laughing through the ash. "Well burned."');
  }
  return true;
}

// End the player's turn: Brix executes his declared intent, then a new round begins.
export function endTurn(state, rng) {
  if (state.over) return;
  const intent = state.intent;
  if (intent) {
    if (intent.kind === 'damage') {
      const through = applyDamage(state, 'you', intent.power);
      state.stats.damageTaken += through;
      state.log.push(`Brix uses ${intent.name} — ${through} damage gets through your guard.`);
    } else if (intent.kind === 'shield') {
      state.foeShield += intent.power;
      state.log.push(`Brix uses ${intent.name} — his shield rises to ${state.foeShield}.`);
    } else if (intent.kind === 'heal') {
      const healed = Math.min(intent.power, START_LIFE - state.foeLife);
      state.foeLife += healed;
      state.log.push(`Brix uses ${intent.name} — he restores ${healed} life.`);
    } else if (intent.kind === 'siphon') {
      const through = applyDamage(state, 'you', intent.power);
      const healed = Math.min(intent.power, START_LIFE - state.foeLife);
      state.foeLife += healed;
      state.stats.damageTaken += through;
      state.log.push(`Brix uses ${intent.name} — ${through} damage to you, ${healed} life drained back.`);
    }
  }
  if (state.youLife <= 0) {
    state.over = 'lose';
    state.log.push('Your flame gutters out on the duelling stone.');
    return;
  }
  state.round += 1;
  state.energyCap = energyCapForRound(state.round);
  state.energy = state.energyCap;
  drawUpTo(state, rng);
  declareIntent(state, rng);
}

// A scripted mid-duel used only for the screenshots (?shot=play / win / lose), so the
// pictures always show a rich, readable table. Normal play never touches this.
export function scriptedDuel(shot) {
  const rng = createRng(7);
  const state = newDuel(rng);
  state.round = 3;
  state.energyCap = energyCapForRound(3);
  state.energy = 3;
  state.youLife = 13;
  state.youShield = 4;
  state.foeLife = 9;
  state.foeShield = 0;
  state.hand = ['flame-lance', 'stone-aegis', 'grove-tonic', 'kindle'];
  state.intent = { kind: 'damage', power: 8, name: 'Heavy Blow', text: 'Brix will deal 8 damage.' };
  state.stats = { damageDealt: 11, damageTaken: 7, cardsPlayed: 5 };
  state.log = [
    'You play Cinder Jab — 4 damage gets through.',
    'Brix uses Ember Strike — your shield drinks the blow.',
    'Round 3. Brix raises his blade: Heavy Blow is coming.',
  ];
  if (shot === 'win') {
    state.foeLife = 0;
    state.over = 'win';
    state.log.push('You play Ember Meteor — 11 damage. Brix falls!');
  }
  if (shot === 'lose') {
    state.youLife = 0;
    state.over = 'lose';
    state.log.push('Brix uses Meteor Call — 11 damage. Your flame gutters out.');
  }
  return state;
}
