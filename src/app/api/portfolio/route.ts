import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  ChainId,
  SupportedCurrency,
  Wallet,
  WalletPortfolio,
  PortfolioSnapshot,
  TokenBalance
} from "@/lib/types";
import { chainAdapters } from "@/lib/chains";
import { CHAINS } from "@/lib/chains/registry";
import { fetchJson } from "@/lib/server/http";

const BodySchema = z.object({
  currency: z.enum(["usd", "inr", "cad"]).default("usd"),
  wallets: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        address: z.string(),
        chain: z.enum([
          "ethereum",
          "bitcoin",
          "solana",
          "litecoin",
          "polygon",
          "bsc",
          "arbitrum",
          "base",
          "hyperliquid"
        ]),
        createdAt: z.number()
      })
    )
    .default([])
});

const TOKEN_ID_BY_SYMBOL: Record<string, string> = {
  ETH: "ethereum",
  BTC: "bitcoin",
  SOL: "solana",
  LTC: "litecoin",
  MATIC: "polygon-pos",
  BNB: "binancecoin",
  HYPE: "hyperliquid",
  USDC: "usd-coin",
  USDT: "tether"
};

function tokenToCoinGeckoId(t: Pick<TokenBalance, "symbol">): string | null {
  return TOKEN_ID_BY_SYMBOL[t.symbol.toUpperCase()] ?? null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const currency = parsed.data.currency as SupportedCurrency;
  const wallets = parsed.data.wallets as Wallet[];

  // Determine which CoinGecko ids we need prices for.
  const ids = new Set<string>();
  for (const w of wallets) ids.add(CHAINS[w.chain].coinGeckoId);
  // Token prices: ask for stable tokens we may emit as mocks.
  ids.add("usd-coin");
  ids.add("tether");

  const pricesRes = await fetchJson<{ prices: Record<string, number> }>(
    new URL(
      `/api/prices?currency=${currency}&ids=${encodeURIComponent(Array.from(ids).join(","))}`,
      req.url
    ).toString(),
    { next: { revalidate: 30 } } as RequestInit
  ).catch(() => ({ prices: {} as Record<string, number> }));

  const prices = pricesRes.prices;

  const perWallet: WalletPortfolio[] = [];
  for (const w of wallets) {
    const adapter = chainAdapters[w.chain];
    if (!adapter) continue;
    const [native, tokens, txs] = await Promise.all([
      adapter.getNativeBalance(w.address),
      adapter.getTokenBalances(w.address),
      adapter.getTransactions(w.address)
    ]);
    perWallet.push({
      walletId: w.id,
      updatedAt: Date.now(),
      native,
      tokens,
      transactions: txs
    });
  }

  // Compute valuation (quote currency) for portfolio cards.
  const walletValues = perWallet.map((wp) => {
    const nativeId = CHAINS[wp.native.chain].coinGeckoId;
    const nativePx = prices[nativeId] ?? 0;
    const nativeValue = wp.native.amount * nativePx;

    let tokensValue = 0;
    for (const t of wp.tokens) {
      const id = tokenToCoinGeckoId(t);
      const px = id ? prices[id] ?? 0 : 0;
      tokensValue += t.amount * px;
    }

    return {
      walletId: wp.walletId,
      total: nativeValue + tokensValue,
      nativeValue,
      tokensValue
    };
  });

  const total = walletValues.reduce((a, b) => a + b.total, 0);

  // Chain allocation.
  const byChain: Record<ChainId, number> = {
    ethereum: 0,
    bitcoin: 0,
    solana: 0,
    litecoin: 0,
    polygon: 0,
    bsc: 0,
    arbitrum: 0,
    base: 0,
    hyperliquid: 0
  };
  for (const w of wallets) {
    const v = walletValues.find((x) => x.walletId === w.id)?.total ?? 0;
    byChain[w.chain] += v;
  }

  // Simple (mock) portfolio history: last 24h hourly points around current total.
  const history: PortfolioSnapshot[] = Array.from({ length: 24 }).map((_, i) => {
    const hoursAgo = 23 - i;
    const at = Date.now() - hoursAgo * 3600_000;
    const drift = Math.sin(i / 3) * 0.012; // ±1.2%
    return { at, totalUsd: total * (1 + drift) };
  });

  return NextResponse.json(
    {
      currency,
      prices,
      total,
      byChain,
      wallets: perWallet,
      history,
      refreshedAt: Date.now()
    },
    {
      status: 200,
      headers: {
        // Client polls every ~45s; allow CDN/browser caching for 30s.
        "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
      }
    }
  );
}

