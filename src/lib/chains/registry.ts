import type { ChainId } from "@/lib/types";

export type ChainMeta = {
  id: ChainId;
  label: string;
  nativeSymbol: string;
  coinGeckoId: string;
  explorerLabel: string;
};

export const CHAINS: Record<ChainId, ChainMeta> = {
  ethereum: {
    id: "ethereum",
    label: "Ethereum",
    nativeSymbol: "ETH",
    coinGeckoId: "ethereum",
    explorerLabel: "Etherscan"
  },
  bitcoin: {
    id: "bitcoin",
    label: "Bitcoin",
    nativeSymbol: "BTC",
    coinGeckoId: "bitcoin",
    explorerLabel: "Blockchair/Blockchain.com"
  },
  solana: {
    id: "solana",
    label: "Solana",
    nativeSymbol: "SOL",
    coinGeckoId: "solana",
    explorerLabel: "Solscan"
  },
  litecoin: {
    id: "litecoin",
    label: "Litecoin",
    nativeSymbol: "LTC",
    coinGeckoId: "litecoin",
    explorerLabel: "Blockchair"
  },
  polygon: {
    id: "polygon",
    label: "Polygon",
    nativeSymbol: "MATIC",
    coinGeckoId: "polygon-pos",
    explorerLabel: "Polygonscan"
  },
  bsc: {
    id: "bsc",
    label: "BNB Chain",
    nativeSymbol: "BNB",
    coinGeckoId: "binancecoin",
    explorerLabel: "BscScan"
  },
  arbitrum: {
    id: "arbitrum",
    label: "Arbitrum",
    nativeSymbol: "ETH",
    coinGeckoId: "ethereum",
    explorerLabel: "Arbiscan"
  },
  base: {
    id: "base",
    label: "Base",
    nativeSymbol: "ETH",
    coinGeckoId: "ethereum",
    explorerLabel: "Basescan"
  },
  hyperliquid: {
    id: "hyperliquid",
    label: "Hyperliquid",
    nativeSymbol: "HYPE",
    coinGeckoId: "hyperliquid",
    explorerLabel: "Hyperliquid API"
  }
};

