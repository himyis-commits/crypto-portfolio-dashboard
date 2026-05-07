import { createEvmAdapter } from "@/lib/chains/evm";

export const bsc = createEvmAdapter({ chain: "bsc", symbol: "BNB" });

