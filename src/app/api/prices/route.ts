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
type FxApiRes = { rates?: Record<string, number> };

async function fetchCoinGeckoPrices(ids: string[], quote: SupportedCurrency) {
  const cg = new URL("https://api.coingecko.com/api/v3/simple/price");
  cg.searchParams.set("ids", ids.join(","));
  cg.searchParams.set("vs_currencies", quote);
  cg.searchParams.set("include_24hr_change", "true");
  return await fetchJson<CoinGeckoSimplePrice>(cg.toString(), {
    next: { revalidate: 30 }
  } as RequestInit).catch(() => null);
}

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

  const data = await fetchCoinGeckoPrices(ids, currency);

  if (!data) {
    // Fallback for non-USD quotes:
    // fetch USD prices and convert using a public FX feed.
    if (currency !== "usd") {
      const usdData = await fetchCoinGeckoPrices(ids, "usd");
      const fx = await fetchJson<FxApiRes>("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 300 }
      } as RequestInit).catch(() => null);
      const rate = fx?.rates?.[currency.toUpperCase()] ?? 0;
      if (usdData && rate > 0) {
        const converted: Record<string, number> = {};
        for (const id of ids) converted[id] = (usdData[id]?.usd ?? 0) * rate;
        return NextResponse.json({ currency, prices: converted, fxFallback: true }, { status: 200 });
      }
    }

    const prices: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    return NextResponse.json({ currency, prices, isMock: true }, { status: 200 });
  }

  const prices: Record<string, number> = {};
  for (const id of ids) prices[id] = data[id]?.[currency] ?? 0;
  return NextResponse.json({ currency, prices }, { status: 200 });
}

