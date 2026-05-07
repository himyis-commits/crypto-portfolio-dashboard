import type { ChainId, PortfolioSnapshot, SupportedCurrency, WalletPortfolio } from "@/lib/types";

export type PortfolioResponse = {
  currency: SupportedCurrency;
  prices: Record<string, number>;
  total: number;
  byChain: Record<ChainId, number>;
  wallets: WalletPortfolio[];
  history: PortfolioSnapshot[];
  refreshedAt: number;
};

