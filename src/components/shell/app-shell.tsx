"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Wallet, RefreshCcw, Download, Upload, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { usePortfolioStore } from "@/store/portfolio-store";
import type { SupportedCurrency, Wallet as WalletT } from "@/lib/types";
import { useWallets } from "@/hooks/use-wallets";
import { cn } from "@/lib/utils";
import { AuthControls } from "@/components/auth/auth-controls";
import { CommandPalette } from "@/components/shell/command-palette";

function exportWallets(wallets: WalletT[]) {
  const blob = new Blob([JSON.stringify(wallets, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "himyis-wallets.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importWalletsFromFile(file: File): Promise<WalletT[]> {
  const text = await file.text();
  const parsed = JSON.parse(text) as WalletT[];
  if (!Array.isArray(parsed)) throw new Error("Invalid file");
  return parsed;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const currency = usePortfolioStore((s) => s.currency);
  const setCurrency = usePortfolioStore((s) => s.setCurrency);
  const { wallets, importWallets, cloudMode, cloudLoading, lastSyncedAt, syncError, syncNow } = useWallets();

  const [, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  function syncLabel() {
    if (!cloudMode) return "Local only";
    if (cloudLoading) return "Syncing...";
    if (syncError) return "Sync failed";
    if (!lastSyncedAt) return "Not synced yet";
    const sec = Math.floor((Date.now() - lastSyncedAt) / 1000);
    if (sec < 5) return "Synced just now";
    if (sec < 60) return `Synced ${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `Synced ${min}m ago`;
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="min-h-screen grid-fade">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070912]/70 backdrop-blur-glass">
        <div className="container flex h-[74px] max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Wallet className="h-4 w-4 text-white/90" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">himyis portfolio dashboard</div>
              <div className="text-xs text-muted-foreground">Real-time multi-chain tracking</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AuthControls />
            <CommandPalette />
            <div
              className={cn(
                "hidden lg:flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
                cloudMode
                  ? syncError
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-muted-foreground"
              )}
              title={syncError ?? "Wallet sync status"}
            >
              {cloudMode ? (
                syncError ? (
                  <CloudOff className="h-3.5 w-3.5" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              {syncLabel()}
            </div>
            {cloudMode ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex"
                onClick={() => void syncNow()}
                disabled={cloudLoading}
              >
                <RefreshCcw className={cn("h-3.5 w-3.5", cloudLoading ? "animate-spin" : "")} />
                Sync now
              </Button>
            ) : null}
            <div className={cn("w-[110px] sm:w-[130px] md:w-[150px]")}>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}>
                <option value="usd">USD</option>
                <option value="inr">INR</option>
                <option value="cad">CAD</option>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={() => exportWallets(wallets)} aria-label="Export wallets">
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Import wallets"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const w = await importWalletsFromFile(file);
                  importWallets(w);
                } finally {
                  e.currentTarget.value = "";
                }
              }}
            />

            <motion.div
              className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Auto-refresh ~30s
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container max-w-[1500px] py-8">{children}</main>
    </div>
  );
}

