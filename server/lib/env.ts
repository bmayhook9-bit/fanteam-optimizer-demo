import { z } from 'zod';

export const EnvSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.coerce.number().int().default(3000),
  CLIENT_ORIGIN: z.string().url().optional().or(z.literal('')),
});

const _env = EnvSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    'Invalid environment variables',
    _env.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = _env.data;
