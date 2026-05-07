import { createEvmAdapter } from "@/lib/chains/evm";

export const ethereum = createEvmAdapter({ chain: "ethereum", symbol: "ETH" });

