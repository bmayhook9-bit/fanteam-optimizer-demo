import express from 'express';
import authRoutes from '../../server/routes/auth';

const app = express();
app.use(express.json());
app.use(authRoutes);

export default app;
