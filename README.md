# Aurum — Crypto Portfolio Dashboard

Premium, mobile-first multi-chain crypto portfolio dashboard.

## Tech

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (dark by default) + shadcn-style components
- Zustand (persisted wallets in `localStorage`)
- Recharts (allocation + portfolio history)
- Framer Motion (subtle premium motion)
- Server-side API routes for explorer integrations (no client-side API keys)

## Features (included)

- Wallet management
  - Add unlimited wallets (Ethereum, Bitcoin, Solana, Litecoin, Polygon, BSC, Arbitrum)
  - Labels
  - Basic auto chain detection (ETH/BTC/SOL) + manual override
  - Local-only storage (no backend required)
  - Wallet import/export JSON
- Real-time tracking
  - Auto refresh ~every 45s
  - Native balances (live where possible, otherwise mock fallback)
  - Token balances (mock fallback included; production adapter hooks ready)
  - USD/INR/CAD quote currencies via CoinGecko
- Dashboard UI
  - Total portfolio value
  - Allocation pie chart
  - Portfolio history area chart
  - Assets list with logos and valuations
  - Recent transactions table (mock fallback included)

## Setup

1) Install Node.js (includes `npm`) from Node LTS.

2) Install dependencies

```bash
npm install
```

3) Environment variables

```bash
cp .env.example .env.local
```

Fill in any explorer keys you have (recommended: Etherscan family). If keys are missing or you hit rate limits, the app automatically falls back to mock data so the UI remains functional.

For cross-device wallet sync, also set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## API design

- `GET /api/prices?currency=usd|inr|cad&ids=...`
  - Server-side cached CoinGecko prices (30s)
- `POST /api/portfolio`
  - Aggregates balances + token lists + txs per wallet
  - Computes allocation and returns a ready-to-render payload

## Chain abstraction

Chain modules live in:

- `src/lib/chains/ethereum.ts`
- `src/lib/chains/bitcoin.ts`
- `src/lib/chains/solana.ts`
- `src/lib/chains/litecoin.ts`
- `src/lib/chains/polygon.ts`
- `src/lib/chains/bsc.ts`
- `src/lib/chains/arbitrum.ts`

Each module exposes:

- `getNativeBalance(address)`
- `getTokenBalances(address)`
- `getTransactions(address)`

## Notes / Next upgrades

- Add real token balances using Covalent or Alchemy (server-side) in `src/lib/chains/evm.ts` and `src/lib/chains/solana.ts`
- Add multi-chain transaction history adapters per explorer
- Add PnL tracking by storing periodic snapshots in IndexedDB
- Add alerts + websocket live updates later

## Cross-device sync (Supabase)

The app now supports email magic-link login and cloud wallet sync.

1) Create a Supabase project.
2) In Supabase SQL Editor, run:

```sql
create table if not exists public.wallets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  address text not null,
  chain text not null,
  created_at bigint not null
);

alter table public.wallets enable row level security;

create policy "wallets_select_own"
on public.wallets
for select
to authenticated
using (auth.uid() = user_id);

create policy "wallets_insert_own"
on public.wallets
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "wallets_update_own"
on public.wallets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wallets_delete_own"
on public.wallets
for delete
to authenticated
using (auth.uid() = user_id);
```

3) Enable authentication providers in Supabase Auth:
   - Email (magic link)
   - Google OAuth (recommended)
4) In Supabase Auth URL settings, add:
   - Site URL: `http://localhost:3000` (and your production domain later)
   - Redirect URL: `http://localhost:3000`
5) Add the two `NEXT_PUBLIC_SUPABASE_*` vars in `.env.local` and Vercel env settings.
6) Sign in from the app header to sync wallets across devices.

