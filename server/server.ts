import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import authRoutes from './routes/auth';
import { env } from './lib/env';
import type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const app = express();
const JWT_SECRET = env.JWT_SECRET;
const PORT = Number(env.PORT) || 3000;
const CLIENT_ORIGIN = env.CLIENT_ORIGIN;
if (CLIENT_ORIGIN) {
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
    }),
  );
}
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
