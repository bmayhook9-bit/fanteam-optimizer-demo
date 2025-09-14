import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../server/models/User.js';

const credsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.url || '').toLowerCase();

    if (req.method === 'POST' && url.includes('/auth/signup')) {
      const { username, password } = credsSchema.parse(req.body ?? {});
      const existing = await User.findByUsername(username);
      if (existing) return res.status(409).json({ error: 'User exists' });

      const hash = await bcrypt.hash(password, 10);
      await User.createUser(username, hash, 'free');

      const token = jwt.sign({ username, tier: 'free' }, JWT_SECRET, {
        expiresIn: '7d',
      });
      return res.status(201).json({ token });
    }

    if (req.method === 'POST' && url.includes('/auth/login')) {
      const { username, password } = credsSchema.parse(req.body ?? {});
      const user = await User.findByUsername(username);
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
  } catch (err: unknown) {
    return res
      .status(400)
      .json({ error: (err as Error)?.message || 'Unexpected error' });
  }
}
