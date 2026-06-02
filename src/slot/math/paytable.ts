import type { SlotSymbol } from "../types";

export type Paytable = Record<SlotSymbol, Record<number, number>>;

export const defaultPaytable: Paytable = {
  A: { 3: 10, 4: 20, 5: 40 },
  K: { 3: 8, 4: 16, 5: 30 },
  Q: { 3: 6, 4: 12, 5: 25 },
  J: { 3: 5, 4: 10, 5: 20 },
  TEN: { 3: 4, 4: 8, 5: 16 },
  WILD: { 3: 20, 4: 50, 5: 100 },
  SCATTER: { 3: 2, 4: 10, 5: 50 },
};
