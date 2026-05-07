"use client";

import * as React from "react";
import type { ChainId, Wallet } from "@/lib/types";
import { makeId } from "@/lib/id";
import { usePortfolioStore } from "@/store/portfolio-store";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase/client";

type WalletRow = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  chain: ChainId;
  created_at: number;
};

const DEMO_WALLETS: Array<{ label: string; address: string; chain: ChainId }> = [
  { label: "Polygon Treasury", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", chain: "polygon" },
  { label: "BNB Yield Wallet", address: "0x55d398326f99059fF775485246999027B3197955", chain: "bsc" },
  { label: "Arbitrum Active", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", chain: "arbitrum" }
];

function fromRow(r: WalletRow): Wallet {
  return {
    id: r.id,
    label: r.label,
    address: r.address,
    chain: r.chain,
    createdAt: r.created_at
  };
}

export function useWallets() {
  const { user, enabled } = useAuth();
  const localWallets = usePortfolioStore((s) => s.wallets);
  const addLocalWallet = usePortfolioStore((s) => s.addWallet);
  const removeLocalWallet = usePortfolioStore((s) => s.removeWallet);
  const importLocalWallets = usePortfolioStore((s) => s.importWallets);

  const [cloudWallets, setCloudWallets] = React.useState<Wallet[]>([]);
  const [cloudLoading, setCloudLoading] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<number | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const cloudMode = Boolean(enabled && user && supabase);

  const refreshCloud = React.useCallback(async () => {
    if (!cloudMode || !user || !supabase) return;
    setCloudLoading(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("id,user_id,label,address,chain,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCloudWallets((data as WalletRow[] | null)?.map(fromRow) ?? []);
      setLastSyncedAt(Date.now());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cloud sync failed";
      setSyncError(msg);
    } finally {
      setCloudLoading(false);
    }
  }, [cloudMode, user]);

  React.useEffect(() => {
    if (!cloudMode) {
      setCloudWallets([]);
      setCloudLoading(false);
      setLastSyncedAt(null);
      setSyncError(null);
      return;
    }
    void refreshCloud();
  }, [cloudMode, refreshCloud]);

  const wallets = cloudMode ? cloudWallets : localWallets;

  async function addWallet(args: { label: string; address: string; chain: ChainId }) {
    if (!cloudMode || !user || !supabase) {
      addLocalWallet(args);
      return;
    }
    const row: WalletRow = {
      id: makeId(),
      user_id: user.id,
      label: args.label.trim() || "Untitled Wallet",
      address: args.address.trim(),
      chain: args.chain,
      created_at: Date.now()
    };
    await supabase.from("wallets").insert(row);
    await refreshCloud();
  }

  async function removeWallet(walletId: string) {
    if (!cloudMode || !user || !supabase) {
      removeLocalWallet(walletId);
      return;
    }
    await supabase.from("wallets").delete().eq("id", walletId).eq("user_id", user.id);
    await refreshCloud();
  }

  async function importWallets(walletsToImport: Wallet[]) {
    if (!cloudMode || !user || !supabase) {
      importLocalWallets(walletsToImport);
      return;
    }
    await supabase.from("wallets").delete().eq("user_id", user.id);
    const rows: WalletRow[] = walletsToImport.map((w) => ({
      id: w.id || makeId(),
      user_id: user.id,
      label: w.label,
      address: w.address,
      chain: w.chain,
      created_at: w.createdAt || Date.now()
    }));
    if (rows.length > 0) await supabase.from("wallets").insert(rows);
    await refreshCloud();
  }

  async function addDemoWalletSet() {
    for (const w of DEMO_WALLETS) {
      await addWallet(w);
    }
  }

  return {
    wallets,
    cloudMode,
    cloudLoading,
    lastSyncedAt,
    syncError,
    syncNow: refreshCloud,
    addWallet,
    removeWallet,
    importWallets,
    addDemoWalletSet
  };
}

