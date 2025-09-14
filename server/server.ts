import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import { env } from './lib/env';

const app = express();
const PORT = Number(env.PORT) || 3000;

app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 60 }));
app.use(express.static(path.join(process.cwd(), 'dist')));

app.use('/api/auth', authRoutes);

// Only start a listener when run directly (keeps tests clean)
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
