import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.coerce.number().int().default(3000),
  CLIENT_ORIGIN: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    'Invalid environment variables',
    _env.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = _env.data;
