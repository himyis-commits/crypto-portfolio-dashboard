"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SupportedCurrency, Wallet } from "@/lib/types";
import { makeId } from "@/lib/id";

type PortfolioState = {
  currency: SupportedCurrency;
  wallets: Wallet[];
  setCurrency: (c: SupportedCurrency) => void;
  addWallet: (args: { label: string; address: string; chain: Wallet["chain"] }) => void;
  addDemoWalletSet: () => void;
  removeWallet: (walletId: string) => void;
  updateWallet: (walletId: string, patch: Partial<Pick<Wallet, "label" | "address" | "chain">>) => void;
  importWallets: (wallets: Wallet[]) => void;
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      currency: "usd",
      wallets: [],
      setCurrency: (currency) => set({ currency }),
      addWallet: ({ label, address, chain }) =>
        set((s) => ({
          wallets: [
            { id: makeId(), label: label.trim() || "Untitled Wallet", address: address.trim(), chain, createdAt: Date.now() },
            ...s.wallets
          ]
        })),
      addDemoWalletSet: () =>
        set((s) => ({
          wallets: [
            {
              id: makeId(),
              label: "Polygon Treasury",
              address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              chain: "polygon",
              createdAt: Date.now()
            },
            {
              id: makeId(),
              label: "BNB Yield Wallet",
              address: "0x55d398326f99059fF775485246999027B3197955",
              chain: "bsc",
              createdAt: Date.now()
            },
            {
              id: makeId(),
              label: "Arbitrum Active",
              address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
              chain: "arbitrum",
              createdAt: Date.now()
            },
            ...s.wallets
          ]
        })),
      removeWallet: (walletId) => set((s) => ({ wallets: s.wallets.filter((w) => w.id !== walletId) })),
      updateWallet: (walletId, patch) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === walletId ? { ...w, ...patch } : w))
        })),
      importWallets: (wallets) => set({ wallets })
    }),
    {
      name: "himyis.portfolio",
      storage: createJSONStorage(() => localStorage),
      version: 2
    }
  )
);

