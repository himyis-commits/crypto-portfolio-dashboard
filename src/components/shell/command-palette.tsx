"use client";

import * as React from "react";
import { Command, PlusCircle, Search, Wallet } from "lucide-react";
import { usePortfolioStore } from "@/store/portfolio-store";
import { useWallets } from "@/hooks/use-wallets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Action = {
  id: string;
  label: string;
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const setCurrency = usePortfolioStore((s) => s.setCurrency);
  const { addDemoWalletSet } = useWallets();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((x) => !x);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actions: Action[] = [
    {
      id: "add-wallet",
      label: "Add wallet",
      run: () => window.dispatchEvent(new Event("open-add-wallet"))
    },
    {
      id: "add-demo",
      label: "Add sample wallets",
      run: () => void addDemoWalletSet()
    },
    { id: "currency-usd", label: "Switch currency: USD", run: () => setCurrency("usd") },
    { id: "currency-inr", label: "Switch currency: INR", run: () => setCurrency("inr") },
    { id: "currency-cad", label: "Switch currency: CAD", run: () => setCurrency("cad") }
  ];
  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Button variant="outline" size="sm" className="hidden lg:inline-flex" onClick={() => setOpen(true)}>
        <Command className="h-3.5 w-3.5" />
        Quick actions
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Command palette</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actions..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid gap-2">
            {filtered.map((a) => (
              <button
                key={a.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm transition hover:bg-white/[0.08]"
                )}
                onClick={() => {
                  a.run();
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>{a.label}</span>
                {a.id.includes("wallet") ? <Wallet className="h-4 w-4 text-muted-foreground" /> : <PlusCircle className="h-4 w-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

