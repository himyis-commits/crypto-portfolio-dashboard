export function bigintToNumber(raw: string, decimals: number): number {
  // Avoid Number overflow on very large balances; keep up to 8 decimal precision for UI.
  // This is for display only. For full precision, keep bigint math end-to-end.
  const v = BigInt(raw || "0");
  const base = BigInt(10) ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 8);
  const n = Number(whole.toString() + "." + fracStr);
  return Number.isFinite(n) ? n : 0;
}

