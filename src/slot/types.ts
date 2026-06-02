export type SlotSymbol = "A" | "K" | "Q" | "J" | "TEN" | "WILD" | "SCATTER";

export interface SpinRequest {
  betAmount: number;
  lines: number;
}

export interface SpinResult {
  spinId: string;
  reels: SlotSymbol[][];
  totalWin: number;
  balance: number;
}

export interface SlotEngineClient {
  spin(request: SpinRequest): Promise<SpinResult>;
}
