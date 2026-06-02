import type { SlotEngineClient, SpinRequest, SpinResult } from "../types";

interface ProviderSpinResponse {
  spin_id: string;
  reels: SpinResult["reels"];
  total_win: number;
  balance: number;
}

export class ProviderClient implements SlotEngineClient {
  constructor(
    private readonly baseUrl: string,
    private readonly gameId: string,
    private readonly apiKey: string
  ) {}

  async spin(request: SpinRequest): Promise<SpinResult> {
    const response = await fetch(`${this.baseUrl}/games/${this.gameId}/spin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Spin request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ProviderSpinResponse;

    return {
      spinId: payload.spin_id,
      reels: payload.reels,
      totalWin: payload.total_win,
      balance: payload.balance,
    };
  }
}
