import type { ChainId, NativeBalance, TokenBalance, Transaction } from "@/lib/types";
import { fetchJson } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { bigintToNumber } from "@/lib/bigint";

type ScanModule = "account";

function scanApiKey(chain: ChainId): string | undefined {
  switch (chain) {
    case "ethereum":
      return env.ETHERSCAN_API_KEY;
    case "polygon":
      return env.POLYGONSCAN_API_KEY;
    case "bsc":
      return env.BSCSCAN_API_KEY;
    case "arbitrum":
      return env.ARBISCAN_API_KEY;
    case "base":
      return undefined;
    default:
      return undefined;
  }
}

function scanBaseUrl(chain: ChainId): string {
  switch (chain) {
    case "ethereum":
      return "https://api.etherscan.io/api";
    case "polygon":
      return "https://api.polygonscan.com/api";
    case "bsc":
      return "https://api.bscscan.com/api";
    case "arbitrum":
      return "https://api.arbiscan.io/api";
    case "base":
      return "https://api.basescan.org/api";
    default:
      return "https://api.etherscan.io/api";
  }
}

type EtherscanLikeBalanceRes = { status: string; message: string; result: string };

function rpcUrls(chain: ChainId): string[] {
  switch (chain) {
    case "ethereum":
      return ["https://ethereum.publicnode.com", "https://eth.llamarpc.com"];
    case "polygon":
      return ["https://polygon-rpc.com", "https://polygon.llamarpc.com"];
    case "bsc":
      return ["https://bsc-dataseed.binance.org", "https://bsc.llamarpc.com"];
    case "arbitrum":
      return ["https://arb1.arbitrum.io/rpc", "https://arbitrum.llamarpc.com"];
    case "base":
      return ["https://mainnet.base.org", "https://base.llamarpc.com"];
    default:
      return [];
  }
}

const STABLECOIN_MAP: Record<ChainId, Array<{ symbol: "USDC" | "USDT"; address: string; decimals: number }>> = {
  ethereum: [
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 }
  ],
  polygon: [
    { symbol: "USDC", address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6 },
    { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 }
  ],
  bsc: [
    { symbol: "USDC", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 },
    { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 }
  ],
  arbitrum: [
    { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9", decimals: 6 }
  ],
  base: [
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "USDT", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 }
  ],
  bitcoin: [],
  solana: [],
  litecoin: [],
  hyperliquid: []
};

function transferSelectorWithAddress(address: string): string {
  // transfer(address,uint256) selector + padded address (for balanceOf call data)
  return `0x70a08231${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

async function getNativeFromEtherscanLike(args: { chain: ChainId; address: string; symbol: string }) {
  const base = scanBaseUrl(args.chain);
  const key = scanApiKey(args.chain);
  if (!key) return null;
  const url = new URL(base);
  url.searchParams.set("module", "account" satisfies ScanModule);
  url.searchParams.set("action", "balance");
  url.searchParams.set("address", args.address);
  url.searchParams.set("tag", "latest");
  url.searchParams.set("apikey", key);
  const data = await fetchJson<EtherscanLikeBalanceRes>(url.toString(), {
    // Next.js will cache at the route level; keep fetch standard here.
    cache: "no-store"
  });
  if (data.status !== "1") return null;
  const raw = data.result;
  const amount = bigintToNumber(raw, 18);
  return {
    chain: args.chain,
    symbol: args.symbol,
    decimals: 18,
    raw,
    amount
  } satisfies NativeBalance;
}

async function getNativeFromRpc(args: { chain: ChainId; address: string; symbol: string }) {
  const urls = rpcUrls(args.chain);
  for (const url of urls) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [args.address, "latest"]
      }),
      cache: "no-store"
    }).catch(() => null);
    if (!res?.ok) continue;
    const json = (await res.json().catch(() => null)) as { result?: string } | null;
    const hex = json?.result;
    if (!hex || !hex.startsWith("0x")) continue;
    const raw = BigInt(hex).toString();
    const amount = bigintToNumber(raw, 18);
    return {
      chain: args.chain,
      symbol: args.symbol,
      decimals: 18,
      raw,
      amount
    } satisfies NativeBalance;
  }
  return null;
}

function mockNative(chain: ChainId, symbol: string): NativeBalance {
  const amount = 0;
  return {
    chain,
    symbol,
    decimals: 18,
    raw: String(Math.floor(amount * 1e18)),
    amount
  };
}

export function createEvmAdapter(args: { chain: ChainId; symbol: string }) {
  const { chain, symbol } = args;
  return {
    chain,
    async getNativeBalance(address: string): Promise<NativeBalance> {
      const live = await getNativeFromEtherscanLike({ chain, address, symbol }).catch(() => null);
      if (live) return live;
      const rpc = await getNativeFromRpc({ chain, address, symbol }).catch(() => null);
      return rpc ?? mockNative(chain, symbol);
    },
    async getTokenBalances(address: string): Promise<TokenBalance[]> {
      const urls = rpcUrls(chain);
      const tokens = STABLECOIN_MAP[chain] ?? [];
      if (tokens.length === 0 || urls.length === 0) return [];
      for (const url of urls) {
        const out: TokenBalance[] = [];
        let endpointHealthy = true;
        for (const t of tokens) {
          const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_call",
              params: [
                {
                  to: t.address,
                  data: transferSelectorWithAddress(address)
                },
                "latest"
              ]
            }),
            cache: "no-store"
          }).catch(() => null);
          if (!res?.ok) {
            endpointHealthy = false;
            break;
          }
          const json = (await res.json().catch(() => null)) as { result?: string } | null;
          const hex = json?.result;
          if (!hex || !hex.startsWith("0x")) {
            endpointHealthy = false;
            break;
          }
          const raw = BigInt(hex).toString();
          const amount = bigintToNumber(raw, t.decimals);
          out.push({
            chain,
            tokenAddress: t.address,
            symbol: t.symbol,
            name: t.symbol === "USDC" ? "USD Coin" : "Tether USD",
            decimals: t.decimals,
            raw,
            amount,
            logoUrl:
              t.symbol === "USDC"
                ? "https://assets.coingecko.com/coins/images/6319/large/usdc.png"
                : "https://assets.coingecko.com/coins/images/325/large/Tether.png"
          });
        }
        if (endpointHealthy) return out.filter((t) => t.amount > 0);
      }
      return [];
    },
    async getTransactions(_address: string): Promise<Transaction[]> {
      return [];
    }
  };
}

