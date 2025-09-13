import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let User: { close: () => Promise<void> };

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  const mod = await import('../server/server');
  app = mod.default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  User = require('../server/models/User.js');
});

afterAll(async () => {
  if (User && typeof User.close === 'function') {
    await User.close();
  }
});

describe('auth routes', () => {
  it('registers and logs in a user', async () => {
    const username = `user_${Date.now()}`;
    await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'secret' })
      .expect(200);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'secret' })
      .expect(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid login', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'missing_user', password: 'nope' })
      .expect(400);
  });
});
