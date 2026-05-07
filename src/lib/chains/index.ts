import type { ChainAdapter } from "@/lib/chains/types";
import type { ChainId } from "@/lib/types";
import { ethereum } from "@/lib/chains/ethereum";
import { bitcoin } from "@/lib/chains/bitcoin";
import { solana } from "@/lib/chains/solana";
import { litecoin } from "@/lib/chains/litecoin";
import { polygon } from "@/lib/chains/polygon";
import { bsc } from "@/lib/chains/bsc";
import { arbitrum } from "@/lib/chains/arbitrum";
import { base } from "@/lib/chains/base";
import { hyperliquid } from "@/lib/chains/hyperliquid";

export const chainAdapters: Record<ChainId, ChainAdapter> = {
  ethereum,
  bitcoin,
  solana,
  litecoin,
  polygon,
  bsc,
  arbitrum,
  base,
  hyperliquid
};

