import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import User from '../models/User';
import { env } from '../lib/env';

interface DbUser {
  id: number;
  username: string;
  password: string;
  tier: string;
}

interface UserModel {
  createUser(
    username: string,
    password: string,
    tier: string,
  ): Promise<Omit<DbUser, 'password'>>;
  findByUsername(username: string): Promise<DbUser | undefined>;
}

const UserModel = User as unknown as UserModel;

const router = express.Router();

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  tier: z.string().optional(),
});

router.post(
  '/register',
  async (req: express.Request, res: express.Response) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Invalid fields' });
    const { username, password, tier = 'free' } = parsed.data;
    try {
      const hash = await bcrypt.hash(password, 10);
      const user = await UserModel.createUser(username, hash, tier);
      const token = jwt.sign(
        { id: user.id, username: user.username, tier: user.tier },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.json({ token, tier: user.tier });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNIQUE'))
        return res.status(400).json({ error: 'User exists' });
      res.status(500).json({ error: 'Server error' });
    }
  },
);

router.post('/login', async (req: express.Request, res: express.Response) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid fields' });
  const { username, password } = parsed.data;
  const user = await UserModel.findByUsername(username);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { id: user.id, username: user.username, tier: user.tier },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
  res.json({ token, tier: user.tier });
});

export default router;
