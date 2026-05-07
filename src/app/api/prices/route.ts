import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupportedCurrency } from "@/lib/types";
import { fetchJson } from "@/lib/server/http";

const QuerySchema = z.object({
  currency: z.enum(["usd", "inr", "cad"]).default("usd"),
  ids: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []))
});

type CoinGeckoSimplePrice = Record<string, Record<string, number>>;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    currency: url.searchParams.get("currency") ?? undefined,
    ids: url.searchParams.get("ids") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const currency = parsed.data.currency as SupportedCurrency;
  const ids = parsed.data.ids;
  if (ids.length === 0) return NextResponse.json({ currency, prices: {} }, { status: 200 });

  const cg = new URL("https://api.coingecko.com/api/v3/simple/price");
  cg.searchParams.set("ids", ids.join(","));
  cg.searchParams.set("vs_currencies", currency);
  cg.searchParams.set("include_24hr_change", "true");

  const data = await fetchJson<CoinGeckoSimplePrice>(cg.toString(), {
    // Cache at the edge for 30s: used by portfolio refresh.
    // Note: route handler caching uses Next fetch caching semantics.
    next: { revalidate: 30 }
  } as RequestInit).catch(() => null);

  if (!data) {
    // Soft fallback: price = 0 (UI still works and shows data, just no valuation).
    const prices: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    return NextResponse.json({ currency, prices, isMock: true }, { status: 200 });
  }

  const prices: Record<string, number> = {};
  for (const id of ids) prices[id] = data[id]?.[currency] ?? 0;
  return NextResponse.json({ currency, prices }, { status: 200 });
}

