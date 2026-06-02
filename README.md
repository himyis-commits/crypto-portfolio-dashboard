# Stake Slot Starter (Next.js + TypeScript)

Starter repository for building a slot-style game UI and integration layer on top of an external engine provider.

## What this gives you

- Next.js 15 + TypeScript project baseline
- Starter folder layout for slot game domain code
- Environment template for provider integration
- CI workflow (lint, typecheck, build) on pull requests

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Run local dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project structure

Core starter paths:

- `src/slot/config/` - runtime configuration and feature flags
- `src/slot/math/` - RTP/volatility/reel definitions and simulation helpers
- `src/slot/engine/` - adapter layer for provider engine APIs
- `src/slot/ui/` - slot-specific UI components
- `docs/` - project and integration notes

You can keep current app components while moving slot-specific logic into `src/slot`.

## Branch workflow

- `main` - stable branch
- feature branches for work items (recommended)

## CI

GitHub Actions runs on each pull request:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Notes

- Use mock data in early development and switch to real provider endpoints via env variables.
- Keep engine integration in isolated adapters to avoid coupling UI and provider contracts.
