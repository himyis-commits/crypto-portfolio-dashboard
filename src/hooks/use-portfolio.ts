"use client";

import * as React from "react";
import type { PortfolioResponse } from "@/lib/api-types";
import { usePortfolioStore } from "@/store/portfolio-store";
import { useWallets } from "@/hooks/use-wallets";

export function usePortfolio(args?: { refreshMs?: number }) {
  const refreshMs = args?.refreshMs ?? 30_000;
  const { wallets } = useWallets();
  const currency = usePortfolioStore((s) => s.currency);

  const [data, setData] = React.useState<PortfolioResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchOnce = React.useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallets, currency }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Portfolio fetch failed (${res.status})`);
      const json = (await res.json()) as PortfolioResponse;
      setData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [wallets, currency]);

  React.useEffect(() => {
    void fetchOnce();
    const t = setInterval(() => void fetchOnce(), refreshMs);
    return () => clearInterval(t);
  }, [fetchOnce, refreshMs]);

  return { data, error, loading, refresh: fetchOnce };
}

