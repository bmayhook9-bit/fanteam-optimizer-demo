import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  SENTRY_DSN: z.string().optional(),
  USERS_DB: z.string().optional(),
  CLIENT_ORIGIN: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
