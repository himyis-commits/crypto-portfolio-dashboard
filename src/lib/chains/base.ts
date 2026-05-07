import { createEvmAdapter } from "@/lib/chains/evm";

export const base = createEvmAdapter({ chain: "base", symbol: "ETH" });

