# Tim Hortons Pro League

Live companion for a 16-user Fantrax Premier League draft league — and the
groundwork for our own draft platform in 27/28.

Fantrax runs the league. This republishes it with the things Fantrax lacks: a
matchday view worth watching, competitions we define ourselves, a rolling
newspaper, and a per-player intelligence store.

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # vitest
npm run typecheck # core, scripts and the app
npm run lint      # ESLint
npm run build     # production build
```

No credentials needed to run the live viewer — it works off FPL's public API, so
it is useful from the first match of the season, six gameweeks before our league
even drafts.

## Layout

| Path | What |
|---|---|
| `packages/core` | Domain types, provider adapters, competition engines |
| `packages/ui` | Shared components (empty until a second consumer needs them) |
| `apps/companion` | The 26/27 Next.js app — ships GW6, 10 Oct 2026 |
| `apps/lab` | The 27/28 platform prototype — empty on purpose |

## Reading order

`PRODUCT.md` for who it is for and why · `CLAUDE.md` for the architecture and the
verified API contracts.
