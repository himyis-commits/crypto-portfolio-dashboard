import type { NativeBalance, TokenBalance, Transaction } from "@/lib/types";
import { fetchJson } from "@/lib/server/http";

type BlockchairAddressRes = {
  data: Record<
    string,
    {
      address: {
        balance: number; // satoshis
      };
      transactions?: string[];
    }
  >;
};

function mockBtc(): NativeBalance {
  const amount = 0;
  return {
    chain: "bitcoin",
    symbol: "BTC",
    decimals: 8,
    raw: String(Math.floor(amount * 1e8)),
    amount
  };
}

export const bitcoin = {
  chain: "bitcoin" as const,
  async getNativeBalance(address: string): Promise<NativeBalance> {
    // Public endpoint, rate-limited. Falls back to mock if it errors.
    const url = `https://api.blockchair.com/bitcoin/dashboards/address/${encodeURIComponent(address)}`;
    const data = await fetchJson<BlockchairAddressRes>(url, { cache: "no-store" }).catch(() => null);
    if (!data) return mockBtc();
    const item = data.data?.[address];
    const sats = item?.address?.balance;
    if (typeof sats !== "number") return mockBtc();
    return {
      chain: "bitcoin",
      symbol: "BTC",
      decimals: 8,
      raw: String(sats),
      amount: sats / 1e8
    };
  },
  async getTokenBalances(_address: string): Promise<TokenBalance[]> {
    return [];
  },
  async getTransactions(_address: string): Promise<Transaction[]> {
    return [];
  }
};

