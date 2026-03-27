import { z } from 'zod';

export const serverInputSchema = z.object({
  serverUrl: z
    .string()
    .trim()
    .url('Please provide a valid URL, including protocol (https://...)')
    .refine((value) => /^https?:\/\//i.test(value), {
      message: 'Server URL must start with http:// or https://',
    }),
  authToken: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

export type ServerInput = z.infer<typeof serverInputSchema>;
