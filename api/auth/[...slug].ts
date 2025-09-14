import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createUser, findByUsername } from '../../server/models/User';
import { env } from '../../server/lib/env';

interface Req {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
  body?: unknown;
}

interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
}

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  tier: z.string().optional(),
});

export default async function handler(req: Req, res: Res) {
  const slugParam = req.query.slug ?? [];
  const [action] = Array.isArray(slugParam) ? slugParam : [slugParam];

  if (req.method !== 'POST' || !action) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid fields' });
    return;
  }

  const { username, password, tier = 'free' } = parsed.data;

  try {
    if (action === 'register') {
      const hash = await bcrypt.hash(password, 10);
      const user = await createUser(username, hash, tier);
      const token = jwt.sign(
        { id: user.id, username: user.username, tier: user.tier },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.status(200).json({ token, tier: user.tier });
      return;
    }

    if (action === 'login') {
      const user = await findByUsername(username);
      if (!user) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }
      const token = jwt.sign(
        { id: user.id, username: user.username, tier: user.tier },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.status(200).json({ token, tier: user.tier });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (action === 'register' && message.includes('UNIQUE')) {
      res.status(400).json({ error: 'User exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
