import type { SupportedCurrency } from "@/lib/types";

export function formatMoney(
  amount: number,
  currency: SupportedCurrency,
  opts?: { maximumFractionDigits?: number }
) {
  const maximumFractionDigits = opts?.maximumFractionDigits ?? 2;
  const locale =
    currency === "inr" ? "en-IN" : currency === "cad" ? "en-CA" : "en-US";
  const code = currency.toUpperCase();
  const out = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits
  }).format(amount);
  if (currency === "cad") return out.replace("$", "CA$");
  return out;
}

export function formatCompact(amount: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(amount);
}

