import type { ChainId, NativeBalance, TokenBalance, Transaction } from "@/lib/types";

export type ChainAdapter = {
  chain: ChainId;
  getNativeBalance: (address: string) => Promise<NativeBalance>;
  getTokenBalances: (address: string) => Promise<TokenBalance[]>;
  getTransactions: (address: string) => Promise<Transaction[]>;
};

