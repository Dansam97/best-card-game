// render.js — paints the duel state into the DOM: both duelists' life bars and
// shields, Brix's face-down hand and his revealed intent card, the player's face-up
// hand of readable cards, the energy pips and the running duel log.

import { SUITS, cardType } from './cards.js';
import { START_LIFE } from './duel.js';

const el = (id) => document.getElementById(id);

function costPips(cost) {
  if (cost === 0) return '<span class="pip free">FREE</span>';
  return `<span class="pip">${'◆'.repeat(cost)}</span>`;
}

// One readable card face: cost pips, suit glyph, the big power number, name and text.
export function cardFaceHTML(card, extraClass = '') {
  const suit = SUITS[card.suit];
  return `
    <div class="card-top"><span class="card-cost">${costPips(card.cost)}</span><span class="card-suit ${card.suit}">${suit.glyph} ${suit.label}</span></div>
    <div class="card-power ${card.suit}">${card.power}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-text">${card.text}</div>`;
}

function intentHTML(intent) {
  if (!intent) return '<div class="intent-none">—</div>';
  const kindGlyph = { damage: '▲', shield: '■', heal: '●', siphon: '◆' }[intent.kind];
  return `
    <div class="intent-card">
      <div class="intent-power">${kindGlyph} ${intent.power}</div>
      <div class="intent-name">${intent.name}</div>
      <div class="intent-text">${intent.text}</div>
    </div>`;
}

function lifeBar(fillEl, textEl, shieldEl, life, shield) {
  fillEl.style.width = `${Math.max(0, (life / START_LIFE) * 100)}%`;
  textEl.textContent = `${life} / ${START_LIFE}`;
  shieldEl.textContent = shield > 0 ? `⛨ ${shield}` : '';
}

export function renderGame(state, flash = null) {
  el('round-banner').textContent = `ROUND ${state.round}`;
  lifeBar(el('foe-life-fill'), el('foe-life-text'), el('foe-shield'), state.foeLife, state.foeShield);
  lifeBar(el('you-life-fill'), el('you-life-text'), el('you-shield'), state.youLife, state.youShield);

  el('intent-card').innerHTML = intentHTML(state.intent);

  // Brix's hand: face-down backs, one per card he holds.
  el('foe-hand').innerHTML = Array.from({ length: state.foeHandCount }, () => `
    <div class="card card-back"><div class="back-flame">▲</div><div class="back-word">EMBERFALL</div></div>`).join('');

  // The player's hand: face-up, clickable when affordable.
  el('player-hand').innerHTML = state.hand.map((id, index) => {
    const card = cardType(id);
    const affordable = card.cost <= state.energy && !state.over;
    return `<button type="button" class="card card-face suit-${card.suit} ${affordable ? '' : 'unaffordable'}" data-hand-index="${index}" ${affordable ? '' : 'disabled'}>${cardFaceHTML(card)}</button>`;
  }).join('');

  el('energy-pips').innerHTML = Array.from({ length: state.energyCap }, (_, i) =>
    `<span class="energy-pip ${i < state.energy ? 'lit' : ''}">◆</span>`).join('');
  el('deck-count').textContent = `Deck: ${state.deck.length} · Discard: ${state.discard.length}`;
  el('end-turn').disabled = Boolean(state.over);

  el('log').innerHTML = state.log.slice(-3).map((line) => `<div class="log-line">${line}</div>`).join('');

  if (flash === 'foe-hit') el('opponent-zone').classList.add('flash');
  if (flash === 'you-hit') el('player-zone').classList.add('flash');
  setTimeout(() => {
    el('opponent-zone').classList.remove('flash');
    el('player-zone').classList.remove('flash');
  }, 450);

  el('win-screen').classList.toggle('hidden', state.over !== 'win');
  el('lose-screen').classList.toggle('hidden', state.over !== 'lose');
  if (state.over) {
    const stats = `Rounds: ${state.round} · Cards played: ${state.stats.cardsPlayed} · Damage dealt: ${state.stats.damageDealt} · Damage taken: ${state.stats.damageTaken}`;
    el('win-stats').textContent = stats;
    el('lose-stats').textContent = stats;
  }
}
