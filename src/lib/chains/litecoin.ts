import type { NativeBalance, TokenBalance, Transaction } from "@/lib/types";
import { fetchJson } from "@/lib/server/http";

type BlockchairAddressRes = {
  data: Record<
    string,
    {
      address: {
        balance: number; // litoshis
      };
    }
  >;
};

function mockLtc(): NativeBalance {
  const amount = 0;
  return {
    chain: "litecoin",
    symbol: "LTC",
    decimals: 8,
    raw: String(Math.floor(amount * 1e8)),
    amount
  };
}

export const litecoin = {
  chain: "litecoin" as const,
  async getNativeBalance(address: string): Promise<NativeBalance> {
    const url = `https://api.blockchair.com/litecoin/dashboards/address/${encodeURIComponent(address)}`;
    const data = await fetchJson<BlockchairAddressRes>(url, { cache: "no-store" }).catch(() => null);
    if (!data) return mockLtc();
    const item = data.data?.[address];
    const litoshis = item?.address?.balance;
    if (typeof litoshis !== "number") return mockLtc();
    return {
      chain: "litecoin",
      symbol: "LTC",
      decimals: 8,
      raw: String(litoshis),
      amount: litoshis / 1e8
    };
  },
  async getTokenBalances(_address: string): Promise<TokenBalance[]> {
    return [];
  },
  async getTransactions(_address: string): Promise<Transaction[]> {
    return [];
  }
};

