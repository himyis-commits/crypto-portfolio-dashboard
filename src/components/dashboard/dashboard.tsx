"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { usePortfolioStore } from "@/store/portfolio-store";
import { CHAINS } from "@/lib/chains/registry";
import type { ChainId, NativeBalance, TokenBalance, Transaction } from "@/lib/types";
import { formatMoney, formatCompact } from "@/lib/format";
import { coingeckoIdForSymbol } from "@/lib/coingecko";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { WalletManager } from "@/components/dashboard/wallet-manager";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#a78bfa", "#38bdf8", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#c084fc"];

function chainOrder(a: ChainId, b: ChainId) {
  return CHAINS[a].label.localeCompare(CHAINS[b].label);
}

function nativeAsToken(n: NativeBalance): TokenBalance {
  return {
    chain: n.chain,
    symbol: n.symbol,
    name: CHAINS[n.chain].label,
    decimals: n.decimals,
    raw: n.raw,
    amount: n.amount
  };
}

function aggregateTokens(wallets: { native: NativeBalance; tokens: TokenBalance[] }[]) {
  const map = new Map<string, { t: TokenBalance; amount: number }>();
  for (const w of wallets) {
    const n = nativeAsToken(w.native);
    {
      const key = `${n.chain}:${n.symbol}:${n.tokenAddress ?? "native"}`;
      const prev = map.get(key);
      if (!prev) map.set(key, { t: n, amount: n.amount });
      else map.set(key, { t: prev.t, amount: prev.amount + n.amount });
    }
    for (const t of w.tokens) {
      const key = `${t.chain}:${t.symbol}:${t.tokenAddress ?? "native"}`;
      const prev = map.get(key);
      if (!prev) map.set(key, { t, amount: t.amount });
      else map.set(key, { t: prev.t, amount: prev.amount + t.amount });
    }
  }
  return Array.from(map.values()).map((x) => ({ ...x.t, amount: x.amount }));
}

function aggregateTransactions(wallets: { transactions: Transaction[] }[]) {
  const all = wallets.flatMap((w) => w.transactions);
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
}

function priceForSymbol(symbol: string, prices: Record<string, number>) {
  const id = coingeckoIdForSymbol(symbol);
  return id ? prices[id] ?? 0 : 0;
}

export function Dashboard() {
  const currency = usePortfolioStore((s) => s.currency);
  const { data, error, loading } = usePortfolio({ refreshMs: 30_000 });

  const total = data?.total ?? 0;
  const chainAlloc = data?.byChain ?? null;
  const wallets = data?.wallets ?? [];
  const history = data?.history ?? [];

  const pieData = React.useMemo(() => {
    if (!chainAlloc) return [];
    const entries = (Object.entries(chainAlloc) as [ChainId, number][])
      .filter(([, v]) => v > 0)
      .sort(([a], [b]) => chainOrder(a, b));
    return entries.map(([chain, value]) => ({
      name: CHAINS[chain].label,
      chain,
      value
    }));
  }, [chainAlloc]);

  const tokenList = React.useMemo(() => aggregateTokens(wallets), [wallets]);
  const txs = React.useMemo(() => aggregateTransactions(wallets), [wallets]);
  const prices = data?.prices ?? {};
  const walletValueMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of wallets) {
      const nativeId = CHAINS[w.native.chain].coinGeckoId;
      const nativePx = prices[nativeId] ?? 0;
      const nativeValue = w.native.amount * nativePx;
      const tokenValue = w.tokens.reduce((sum, t) => {
        const id = coingeckoIdForSymbol(t.symbol);
        const px = id ? prices[id] ?? 0 : 0;
        return sum + t.amount * px;
      }, 0);
      map[w.walletId] = nativeValue + tokenValue;
    }
    return map;
  }, [wallets, prices]);
  const perf = React.useMemo(() => {
    if (!history.length) return { abs: 0, pct: 0 };
    const first = history[0]?.totalUsd ?? 0;
    const last = history[history.length - 1]?.totalUsd ?? 0;
    const abs = last - first;
    const pct = first > 0 ? (abs / first) * 100 : 0;
    return { abs, pct };
  }, [history]);
  const weeklyMetrics = React.useMemo(() => {
    const cutoff = Date.now() / 1000 - 7 * 24 * 3600;
    let inflow = 0;
    let outflow = 0;
    let realizedPnl = 0;
    for (const w of wallets) {
      for (const tx of w.transactions) {
        if (tx.timestamp < cutoff) continue;
        const px = tx.usdValue ?? ((tx.amount ?? 0) * priceForSymbol(tx.symbol ?? w.native.symbol, prices));
        if (tx.direction === "in") inflow += Math.abs(px);
        if (tx.direction === "out") outflow += Math.abs(px);
        if (tx.direction === "out" && tx.usdValue) realizedPnl += tx.usdValue * 0.03;
      }
    }
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      realizedPnl
    };
  }, [wallets, prices]);
  const walletSparklineMap = React.useMemo(() => {
    const map: Record<string, number[]> = {};
    const baselineTotal = history[0]?.totalUsd || total || 1;
    for (const [walletId, walletValue] of Object.entries(walletValueMap)) {
      const share = baselineTotal > 0 ? walletValue / baselineTotal : 0;
      map[walletId] = history.map((h) => Math.max(0, h.totalUsd * share));
    }
    return map;
  }, [history, total, walletValueMap]);
  const fxHint = React.useMemo(() => {
    if (currency === "usd") return null;
    // CoinGecko quote feed includes USDC/Tether in selected currency.
    // Since they are ~1 USD, this acts as a lightweight FX indicator.
    const fx = prices["usd-coin"] ?? prices.tether ?? 0;
    if (!Number.isFinite(fx) || fx <= 0) return null;
    return `1 USD ≈ ${fx.toFixed(2)} ${currency.toUpperCase()}`;
  }, [prices, currency]);

  return (
    <div className="grid gap-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="desktop-grid-primary"
      >
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet-500/15 blur-2xl" />
            <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-sky-500/10 blur-2xl" />
          </div>
          <CardHeader className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Total portfolio</CardTitle>
                <CardDescription>Auto-refreshed ~every 30s. Values in {currency.toUpperCase()}.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {loading ? <Badge>Refreshing</Badge> : <Badge variant="success">Live</Badge>}
                {error ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Partial data
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-6">
                <div className="min-w-0">
                  {loading ? (
                    <Skeleton className="h-10 w-56" />
                  ) : (
                    <div className="truncate text-4xl font-semibold tracking-tight">
                      {formatMoney(total, currency, { maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {wallets.length} wallets • {tokenList.length} tokens tracked
                  </div>
                  {fxHint ? <div className="mt-0.5 text-[10px] text-muted-foreground/75">{fxHint}</div> : null}
                </div>
                <div className="hidden md:block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                  <div className="text-[11px] text-muted-foreground">24h trend</div>
                  <div className={cn("text-sm font-semibold", perf.abs >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {perf.abs >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(perf.abs), currency)} ({perf.pct.toFixed(2)}%)
                  </div>
                </div>
                <div className="hidden md:flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs text-muted-foreground">
                  Glass mode • Dark by default
                </div>
              </div>

              <div className="h-[180px] w-full">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.map((h) => ({ ...h, total: h.totalUsd }))}>
                      <defs>
                        <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="at" hide />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(10, 10, 16, 0.7)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12
                        }}
                        formatter={(v: unknown) => formatMoney(Number(v ?? 0), currency)}
                        labelFormatter={() => ""}
                      />
                      <Area type="monotone" dataKey="total" stroke="#a78bfa" fill="url(#c1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>By chain (estimated from available balances).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 10, 16, 0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12
                      }}
                      formatter={(v: unknown) => formatMoney(Number(v ?? 0), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid gap-2">
              {pieData.length === 0 ? (
                <div className="text-sm text-muted-foreground">Add wallets to see allocation.</div>
              ) : (
                pieData.slice(0, 5).map((p, idx) => (
                  <div key={p.chain} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatMoney(p.value, currency)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly net flow</CardTitle>
            <CardDescription>Inflow/outflow over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <div className="text-xs text-muted-foreground">Inflow</div>
              <div className="font-semibold text-emerald-300">{formatMoney(weeklyMetrics.inflow, currency)}</div>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
              <div className="text-xs text-muted-foreground">Outflow</div>
              <div className="font-semibold text-rose-300">{formatMoney(weeklyMetrics.outflow, currency)}</div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
              <div className="text-xs text-muted-foreground">Net</div>
              <div className={cn("font-semibold", weeklyMetrics.net >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {formatMoney(weeklyMetrics.net, currency)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>PnL foundation</CardTitle>
            <CardDescription>Realized PnL model scaffold from transaction flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="text-muted-foreground">Realized PnL (7d)</div>
            <div className={cn("text-2xl font-semibold", weeklyMetrics.realizedPnl >= 0 ? "text-emerald-300" : "text-rose-300")}>
              {formatMoney(weeklyMetrics.realizedPnl, currency)}
            </div>
            <div className="text-xs text-muted-foreground">
              Next step: persist lot entries and exact fills per tx for true cost-basis accounting.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="desktop-grid-secondary items-start">
        <WalletManager walletValueMap={walletValueMap} walletSparklineMap={walletSparklineMap} currency={currency} />

        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Tokens + stablecoins with logos and values.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="grid gap-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-3">
                {tokenList.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No token balances available yet (native assets still tracked).</div>
                ) : (
                  tokenList.slice(0, 10).map((t) => {
                    const id = coingeckoIdForSymbol(t.symbol);
                    const px = id ? prices[id] ?? 0 : 0;
                    const value = t.amount * px;
                    return (
                      <div
                        key={`${t.chain}:${t.symbol}:${t.tokenAddress ?? "native"}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                            {t.logoUrl ? (
                              <Image src={t.logoUrl} alt={t.symbol} fill sizes="36px" className="object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-medium">{t.symbol}</div>
                              <Badge>{CHAINS[t.chain].label}</Badge>
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{t.name ?? "Token"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCompact(t.amount)}</div>
                          <div className="text-xs text-muted-foreground">≈ {formatMoney(value, currency)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest transactions across all added wallets.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="grid grid-cols-[1.2fr,0.6fr,0.6fr] bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                <div>Transaction</div>
                <div className="text-right">Amount</div>
                <div className="text-right">When</div>
              </div>
              <Separator />
              <div className="divide-y divide-white/10">
                {txs.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">No transactions available yet.</div>
                ) : (
                  txs.map((t) => (
                    <div key={`${t.chain}:${t.hash}`} className="grid grid-cols-[1.2fr,0.6fr,0.6fr] px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
                              t.direction === "in"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : t.direction === "out"
                                  ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                                  : "border-white/10 bg-white/5 text-white/70"
                            )}
                          >
                            {t.direction === "in" ? (
                              <ArrowDownRight className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{t.hash}</div>
                            <div className="text-xs text-muted-foreground">{CHAINS[t.chain].label}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {t.amount ? `${t.amount.toFixed(4)} ${t.symbol ?? ""}` : "—"}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(t.timestamp * 1000).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

