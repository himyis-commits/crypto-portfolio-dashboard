"use client";

import * as React from "react";
import { Check, Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import type { ChainId, SupportedCurrency } from "@/lib/types";
import { useWallets } from "@/hooks/use-wallets";
import { CHAINS } from "@/lib/chains/registry";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";

function looksLikeChain(address: string): ChainId | null {
  const a = address.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return "ethereum";
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(a)) return "bitcoin";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)) return "solana";
  return null;
}

export function WalletManager(props: {
  walletValueMap?: Record<string, number>;
  walletSparklineMap?: Record<string, number[]>;
  currency?: SupportedCurrency;
}) {
  const walletValueMap = props.walletValueMap ?? {};
  const walletSparklineMap = props.walletSparklineMap ?? {};
  const currency = props.currency ?? "usd";
  const { wallets, addWallet, addDemoWalletSet, removeWallet, cloudMode } = useWallets();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [chain, setChain] = React.useState<ChainId>("ethereum");
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-wallet", handler);
    return () => window.removeEventListener("open-add-wallet", handler);
  }, []);

  const auto = looksLikeChain(address);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Wallets</CardTitle>
          <CardDescription>
            Add unlimited multi-chain addresses, copy instantly, and track per-wallet.
            {cloudMode ? " Synced to your account." : " Saved locally in this browser."}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => addDemoWalletSet()}>
            <Sparkles className="h-4 w-4" />
            Add 3 sample wallets
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4" />
                Add wallet
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add wallet</DialogTitle>
              <DialogDescription>
                Wallets are stored locally in your browser. Explorer keys (if any) are used only server-side.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main ETH Wallet" />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddress(v);
                    const inferred = looksLikeChain(v);
                    if (inferred) setChain(inferred);
                  }}
                  placeholder="0x… / bc1… / Solana pubkey…"
                />
                {auto ? <div className="text-xs text-muted-foreground">Detected: {CHAINS[auto].label}</div> : null}
              </div>
              <div className="grid gap-2">
                <Label>Chain</Label>
                <Select value={chain} onChange={(e) => setChain(e.target.value as ChainId)}>
                  {Object.values(CHAINS).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    addWallet({ label, address, chain });
                    setLabel("");
                    setAddress("");
                    setChain("ethereum");
                    setOpen(false);
                  }}
                  disabled={!address.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid gap-3">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-medium">{w.label}</div>
                  <Badge variant="info">{CHAINS[w.chain].label}</Badge>
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">{w.address}</div>
                <div className="text-xs text-emerald-200/90">{formatMoney(walletValueMap[w.id] ?? 0, currency)}</div>
                <div className="mt-1 h-8 w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(walletSparklineMap[w.id] ?? []).map((value, idx) => ({ idx, value }))}
                      margin={{ left: 0, right: 0, top: 2, bottom: 0 }}
                    >
                      <Line type="monotone" dataKey="value" stroke="#60a5fa" dot={false} strokeWidth={1.8} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(w.address);
                    setCopiedId(w.id);
                    window.setTimeout(() => setCopiedId((x) => (x === w.id ? null : x)), 1200);
                  }}
                  aria-label="Copy wallet address"
                >
                  {copiedId === w.id ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/70" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeWallet(w.id)} aria-label="Remove wallet">
                  <Trash2 className="h-4 w-4 text-white/70" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

