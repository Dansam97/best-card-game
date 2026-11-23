// main.js — boots Emberfall Duel, wires the buttons and hand clicks to the state
// machine in duel.js, and handles the screenshot hooks (?shot=title|play|win|lose)
// the maker uses to photograph the game's own screens. Normal play starts at the
// title screen and never touches the scripted states.

import { createRng, endTurn, newDuel, playCard, scriptedDuel } from './duel.js';
import { renderGame } from './render.js';

const params = new URLSearchParams(location.search);
const hashShot = location.hash.replace('#', '');
const shot = params.get('shot') || (['title', 'play', 'win', 'lose'].includes(hashShot) ? hashShot : null);
const seed = Number(params.get('seed') ?? '1') || 1;
const rng = createRng(shot ? 7 : (Date.now() % 100000) + seed);

let state;

function startDuel() {
  state = newDuel(rng);
  document.getElementById('title-screen').classList.add('hidden');
  renderGame(state);
}

if (shot === 'play' || shot === 'win' || shot === 'lose') {
  state = scriptedDuel(shot);
  document.getElementById('title-screen').classList.add('hidden');
  renderGame(state);
} else {
  state = scriptedDuel('play'); // a living table sits behind the title screen
  renderGame(state);
}

document.getElementById('start-duel').addEventListener('click', startDuel);
for (const button of document.querySelectorAll('.again-button')) {
  button.addEventListener('click', startDuel);
}

document.getElementById('player-hand').addEventListener('click', (event) => {
  const target = event.target.closest('[data-hand-index]');
  if (!target || target.disabled) return;
  const foeLifeBefore = state.foeLife;
  if (playCard(state, Number(target.dataset.handIndex), rng)) {
    renderGame(state, state.foeLife < foeLifeBefore ? 'foe-hit' : null);
  }
});

document.getElementById('end-turn').addEventListener('click', () => {
  const youLifeBefore = state.youLife;
  endTurn(state, rng);
  renderGame(state, state.youLife < youLifeBefore ? 'you-hit' : null);
});

// Keyboard: number keys play the matching card, Enter/Space ends the turn.
document.addEventListener('keydown', (event) => {
  if (!document.getElementById('title-screen').classList.contains('hidden')) return;
  if (state.over) return;
  const n = Number(event.key);
  if (n >= 1 && n <= state.hand.length) {
    const foeLifeBefore = state.foeLife;
    if (playCard(state, n - 1, rng)) renderGame(state, state.foeLife < foeLifeBefore ? 'foe-hit' : null);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const youLifeBefore = state.youLife;
    endTurn(state, rng);
    renderGame(state, state.youLife < youLifeBefore ? 'you-hit' : null);
  }
});
