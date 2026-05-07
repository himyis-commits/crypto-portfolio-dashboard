import { createEvmAdapter } from "@/lib/chains/evm";

export const arbitrum = createEvmAdapter({ chain: "arbitrum", symbol: "ETH" });

