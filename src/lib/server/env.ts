import { z } from "zod";

const EnvSchema = z.object({
  // Optional: if not set, app will use mock data for that chain.
  ETHERSCAN_API_KEY: z.string().optional(),
  POLYGONSCAN_API_KEY: z.string().optional(),
  BSCSCAN_API_KEY: z.string().optional(),
  ARBISCAN_API_KEY: z.string().optional(),

  // Optional providers
  COVALENT_API_KEY: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  SOLSCAN_API_KEY: z.string().optional()
});

export const env = EnvSchema.parse({
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY: process.env.POLYGONSCAN_API_KEY,
  BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
  ARBISCAN_API_KEY: process.env.ARBISCAN_API_KEY,
  COVALENT_API_KEY: process.env.COVALENT_API_KEY,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  SOLSCAN_API_KEY: process.env.SOLSCAN_API_KEY
});

