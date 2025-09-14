import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth';
import { env } from './lib/env';
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const app = express();
const { JWT_SECRET, PORT, CLIENT_ORIGIN } = env;

app.use(helmet());
app.use(cors(CLIENT_ORIGIN ? { origin: CLIENT_ORIGIN } : undefined));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 60 }));
app.use(express.static(path.join(process.cwd(), 'dist')));

interface RequestWithUser extends express.Request {
  user?: JwtPayload;
}

function authenticate(
  req: RequestWithUser,
  res: express.Response,
  next: express.NextFunction,
) {
  const header = req.headers['authorization'];
  if (!header) return res.sendStatus(401);
  const token = header.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: VerifyErrors | null, decoded) => {
    if (err || !decoded) return res.sendStatus(403);
    req.user = decoded as JwtPayload;
    next();
  });
}

app.use('/api/auth', authRoutes);

app.get('/api/protected', authenticate, (req: RequestWithUser, res) => {
  const user = req.user as { username: string; tier: string };
  res.json({ message: `Hello ${user.username}!`, tier: user.tier });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
