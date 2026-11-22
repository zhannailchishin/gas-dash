# Gas Dash 🏃💵

An arcade runner about surviving gas spikes on **Arc Testnet** — Circle's USDC-native-gas L1.

You play a USDC coin sprinting across the chain: collect `tx` coins for points, jump gas-price spikes, and dodge congestion walls. The longer you survive, the faster the chain gets — and the harder it is to keep up.

**No wallet connection required.** This is a pure front-end arcade game built to celebrate what makes Arc interesting (USDC as native gas, fast blocks, low fees) — not a dApp.

## Network

| | |
|---|---|
| Chain | Arc Testnet |
| Chain ID | `5042002` |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |
| Gas asset | USDC |

## Controls

- `SPACE` / `↑` — jump over obstacles
- `↓` — duck
- Tap/click the canvas also jumps (mobile-friendly)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
gas-dash/
├── index.html        # canvas + HUD markup
├── src/
│   ├── main.js        # game loop, physics, spawning, collisions, rendering
│   └── style.css       # arcade neon theme
├── vite.config.js
└── package.json
```

## Why this exists

Built as part of exploring [Arc](https://www.arc.network) — a USDC-native-gas L1 from Circle. This is a companion project to a couple of serious Arc dApps (a wallet and a live network dashboard), built this time just to be fun and show something different: a small, polished arcade game themed around the chain's own mechanics (gas price spikes, transaction throughput) rather than another wallet UI.

## Tech

- Vanilla JS + HTML5 Canvas (no game engine, no React — kept deliberately lightweight)
- Vite for dev server/build
- No external game assets — everything is drawn procedurally on canvas

## License

MIT
