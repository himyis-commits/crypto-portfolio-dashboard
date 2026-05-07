export const COINGECKO_ID_BY_SYMBOL: Record<string, string> = {
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

export function coingeckoIdForSymbol(symbol: string): string | null {
  return COINGECKO_ID_BY_SYMBOL[symbol.toUpperCase()] ?? null;
}

