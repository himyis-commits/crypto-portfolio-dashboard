export type SupportedCurrency = "usd" | "inr" | "cad";

export type ChainId =
  | "ethereum"
  | "bitcoin"
  | "solana"
  | "litecoin"
  | "polygon"
  | "bsc"
  | "arbitrum"
  | "base"
  | "hyperliquid";

export type Wallet = {
  id: string;
  label: string;
  address: string;
  chain: ChainId;
  createdAt: number;
};

export type NativeBalance = {
  chain: ChainId;
  symbol: string;
  decimals: number;
  raw: string; // big integer string (atomic units)
  amount: number; // human units
};

export type TokenBalance = {
  chain: ChainId;
  tokenAddress?: string; // undefined for native
  symbol: string;
  name?: string;
  decimals: number;
  raw: string;
  amount: number;
  logoUrl?: string;
};

export type Transaction = {
  chain: ChainId;
  hash: string;
  timestamp: number; // unix seconds
  from?: string;
  to?: string;
  direction: "in" | "out" | "self" | "unknown";
  amount?: number;
  symbol?: string;
  usdValue?: number;
};

export type PortfolioSnapshot = {
  at: number; // ms epoch
  totalUsd: number;
};

export type WalletPortfolio = {
  walletId: string;
  updatedAt: number;
  native: NativeBalance;
  tokens: TokenBalance[];
  transactions: Transaction[];
};

export type PriceMap = Record<string, number>; // key: coinGeckoId -> price in quote currency

