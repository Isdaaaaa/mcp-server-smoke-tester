import { z } from "zod";

export const smokeTestInputSchema = z.object({
  serverUrl: z.string().url("Server URL must be a valid URL"),
  authToken: z.string().min(1, "Auth token is required").optional(),
  timeoutMs: z.number().int().positive().max(60_000).default(10_000)
});

export type SmokeTestInput = z.infer<typeof smokeTestInputSchema>;
