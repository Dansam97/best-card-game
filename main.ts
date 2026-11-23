// Entry program for the best-card-game-20261122-1826 bounty (Node 22, standard library only).
// The game itself is the static site in game/ (game/index.html and its ES modules, no network).
// This program hands the entry in: it copies game/ and screenshots/ into the output directory
// and writes dossier.json there with the vendored make.fun library, exactly as the gate expects.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Note: the output directory is a mount owned by root while the grader runs this program as an
// unprivileged user, so this program only ever creates or overwrites entries INSIDE it. It never
// removes or recreates the output directory itself.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits (only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse anyway).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
