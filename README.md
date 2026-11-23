# best-card-game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Dansam97/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Dansam97/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Emberfall Duel** — an original card duel that plays offline in a desktop browser. You are the Ashen Duelist, facing Brix the Emberknight across the duelling stone. Both duelists hold 20 life. Every round Brix declares his intent out loud — a Heavy Blow, a shield stance, a desperate prayer — and shows it as a revealed card, so you always know what is coming and can answer it: raise a Stone shield, out-burn him with Flame, mend with Leaf, or Kindle extra energy and cards with Spark. Your energy refills and grows each round (up to 5), your hand refills to four cards, and the first duelist to reach 0 life falls. The game is plain static files under `game/` (HTML, CSS and vanilla ES modules — no library, no network), with a title screen, a table showing both hands and both life totals, and full victory and defeat screens. `main.ts` hands the entry in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Run it

```sh
# Play the game: serve the static site and open it in a desktop browser
cd game && python3 -m http.server 8080
# then visit http://localhost:8080

# Or hand the entry in (writes game/, screenshots/ and dossier.json to the output dir)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=p62m1pd8&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
