import { z } from 'zod';

export const authModeSchema = z.enum(['none', 'bearer', 'custom-header']);

const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export const serverInputSchema = z
  .object({
    serverUrl: z
      .string()
      .trim()
      .url('Please provide a valid URL including protocol (https://...)')
      .refine((value) => /^https?:\/\//i.test(value), {
        message: 'Server URL must start with http:// or https://',
      }),
    authMode: authModeSchema,
    bearerToken: z.string().trim(),
    customHeaderName: z.string().trim(),
    customHeaderValue: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.authMode === 'bearer' && value.bearerToken.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bearerToken'],
        message: 'Bearer token is required when Bearer auth is selected.',
      });
    }

    if (value.authMode === 'custom-header') {
      if (value.customHeaderName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customHeaderName'],
          message: 'Header name is required for custom header auth.',
        });
      } else if (!headerNamePattern.test(value.customHeaderName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customHeaderName'],
          message: 'Header name contains invalid characters.',
        });
      }

      if (value.customHeaderValue.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customHeaderValue'],
          message: 'Header value is required for custom header auth.',
        });
      }
    }
  });

export type ServerInput = z.infer<typeof serverInputSchema>;

export const defaultServerInput: ServerInput = {
  serverUrl: '',
  authMode: 'none',
  bearerToken: '',
  customHeaderName: '',
  customHeaderValue: '',
};
