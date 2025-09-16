import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../server/models/User.js';

type DbUser = { id: number; username: string; password: string; tier?: string };

const credsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET missing' });
  }

  const slug = Array.isArray(req.query.slug)
    ? req.query.slug
    : [req.query.slug].filter(Boolean);
  const action = (slug[0] || '').toLowerCase();

  // Vercel may pass body as string when not JSON; normalize
  const rawBody = (req as any).body; // Vercel typing is loose here
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : (rawBody || {});

  try {
    if (req.method === 'POST' && action === 'signup') {
      const { username, password } = credsSchema.parse(body);
      const existing: DbUser | undefined = await User.findByUsername(username);
      if (existing) return res.status(409).json({ error: 'User exists' });

      const hash = await bcrypt.hash(password, 10);
      await User.createUser(username, hash, 'free');

      const token = jwt.sign({ username, tier: 'free' }, JWT_SECRET, {
        expiresIn: '7d',
      });
      return res.status(201).json({ token });
    }

    if (req.method === 'POST' && action === 'login') {
      const { username, password } = credsSchema.parse(body);
      const user: DbUser | undefined = await User.findByUsername(username);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { username, tier: user.tier || 'free' },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      return res.status(200).json({ token });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return res.status(400).json({ error: message });
  }
}
