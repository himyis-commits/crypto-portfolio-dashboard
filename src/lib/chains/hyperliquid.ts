import type { NativeBalance, TokenBalance, Transaction } from "@/lib/types";

type HyperliquidState = {
  balances?: Array<{ coin?: string; total?: string }>;
};

function mockHype(): NativeBalance {
  return {
    chain: "hyperliquid",
    symbol: "HYPE",
    decimals: 8,
    raw: "0",
    amount: 0
  };
}

export const hyperliquid = {
  chain: "hyperliquid" as const,
  async getNativeBalance(address: string): Promise<NativeBalance> {
    // Hyperliquid info endpoint (best effort) for user balances.
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "spotClearinghouseState", user: address }),
      cache: "no-store"
    }).catch(() => null);
    if (!res?.ok) return mockHype();
    const json = (await res.json().catch(() => null)) as HyperliquidState | null;
    const rows = json?.balances ?? [];
    const hype = rows.find((b) => (b.coin ?? "").toUpperCase() === "HYPE");
    const amount = Number(hype?.total ?? "0");
    if (!Number.isFinite(amount)) return mockHype();
    return {
      chain: "hyperliquid",
      symbol: "HYPE",
      decimals: 8,
      raw: String(Math.floor(amount * 1e8)),
      amount
    };
  },
  async getTokenBalances(_address: string): Promise<TokenBalance[]> {
    return [];
  },
  async getTransactions(_address: string): Promise<Transaction[]> {
    return [];
  }
};

