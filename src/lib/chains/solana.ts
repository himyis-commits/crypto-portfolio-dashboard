import type { NativeBalance, TokenBalance, Transaction } from "@/lib/types";
import { fetchJson } from "@/lib/server/http";
import { env } from "@/lib/server/env";

type SolRpcBalanceRes = {
  result?: {
    value?: number;
  };
};
type SolRpcTokenRes = {
  result?: {
    value?: Array<{
      account?: {
        data?: {
          parsed?: {
            info?: {
              tokenAmount?: {
                amount?: string;
                uiAmount?: number;
                decimals?: number;
              };
            };
          };
        };
      };
    }>;
  };
};

type SolscanAccountRes = { success: boolean; data?: { lamports: number } };

function rpcUrls() {
  return [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo"
  ];
}

function mockSol(): NativeBalance {
  const amount = 0;
  return {
    chain: "solana",
    symbol: "SOL",
    decimals: 9,
    raw: String(Math.floor(amount * 1e9)),
    amount
  };
}

export const solana = {
  chain: "solana" as const,
  async getNativeBalance(address: string): Promise<NativeBalance> {
    // Prefer direct Solana RPC for reliable real-time native balance.
    for (const rpc of rpcUrls()) {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address, { commitment: "confirmed" }]
        }),
        cache: "no-store"
      }).catch(() => null);
      if (!res?.ok) continue;
      const json = (await res.json().catch(() => null)) as SolRpcBalanceRes | null;
      const lamports = json?.result?.value;
      if (typeof lamports !== "number") continue;
      return {
        chain: "solana",
        symbol: "SOL",
        decimals: 9,
        raw: String(lamports),
        amount: lamports / 1e9
      };
    }

    // Optional fallback path via Solscan if key exists.
    const url = `https://public-api.solscan.io/account/${encodeURIComponent(address)}`;
    const headers: Record<string, string> = { accept: "application/json" };
    if (env.SOLSCAN_API_KEY) headers.token = env.SOLSCAN_API_KEY;
    const data = await fetchJson<SolscanAccountRes>(url, { headers, cache: "no-store" }).catch(() => null);
    const lamports = data?.data?.lamports;
    if (typeof lamports !== "number") return mockSol();
    return {
      chain: "solana",
      symbol: "SOL",
      decimals: 9,
      raw: String(lamports),
      amount: lamports / 1e9
    };
  },
  async getTokenBalances(_address: string): Promise<TokenBalance[]> {
    const mints = [
      {
        symbol: "USDC",
        name: "USD Coin",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        logoUrl: "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        mint: "Es9vMFrzaCERf4A8i6dN7rTQ8fQzM9x6pRPxXtYxPj9",
        logoUrl: "https://assets.coingecko.com/coins/images/325/large/Tether.png"
      }
    ] as const;

    const out: TokenBalance[] = [];
    for (const mint of mints) {
      const res = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [
            _address,
            { mint: mint.mint },
            { commitment: "confirmed", encoding: "jsonParsed" }
          ]
        }),
        cache: "no-store"
      }).catch(() => null);
      if (!res?.ok) continue;
      const json = (await res.json().catch(() => null)) as SolRpcTokenRes | null;
      const rows = json?.result?.value ?? [];
      let amount = 0;
      let raw = "0";
      let decimals = 6;
      for (const r of rows) {
        const tokenAmount = r.account?.data?.parsed?.info?.tokenAmount;
        const ui = tokenAmount?.uiAmount ?? 0;
        amount += ui;
        raw = String((BigInt(raw) + BigInt(tokenAmount?.amount ?? "0")).toString());
        decimals = tokenAmount?.decimals ?? decimals;
      }
      if (amount > 0) {
        out.push({
          chain: "solana",
          symbol: mint.symbol,
          name: mint.name,
          decimals,
          raw,
          amount,
          logoUrl: mint.logoUrl
        });
      }
    }
    return out;
  },
  async getTransactions(_address: string): Promise<Transaction[]> {
    return [];
  }
};

