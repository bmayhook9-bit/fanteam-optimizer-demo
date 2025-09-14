import { z } from 'zod';

export const EnvSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.string().optional(),
  CLIENT_ORIGIN: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
