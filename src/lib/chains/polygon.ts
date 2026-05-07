import { createEvmAdapter } from "@/lib/chains/evm";

export const polygon = createEvmAdapter({ chain: "polygon", symbol: "MATIC" });

