import { z } from "zod";

const schema = z.object({
  SLOT_ENGINE_BASE_URL: z.string().url(),
  SLOT_GAME_ID: z.string().min(1),
  SLOT_ENGINE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_ENV: z.string().default("local"),
});

export const slotEnv = schema.safeParse({
  SLOT_ENGINE_BASE_URL: process.env.SLOT_ENGINE_BASE_URL,
  SLOT_GAME_ID: process.env.SLOT_GAME_ID,
  SLOT_ENGINE_API_KEY: process.env.SLOT_ENGINE_API_KEY,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});

export const hasValidSlotEnv = slotEnv.success;
