import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { db, schema } from '@app/drizzle';
import * as session from '@app/lib/auth/session.ts';
import redis from '@app/lib/redis.ts';
import { createServer } from '@app/lib/server.ts';

describe('login', () => {
  beforeEach(async () => {
    await redis.flushdb('SYNC');
    await db.delete(schema.chiiOsWebSessions);
  });

  afterEach(async () => {
    await redis.flushdb('SYNC');
    await db.delete(schema.chiiOsWebSessions);
  });

  test('should failed on too many requests', async () => {
    const app = await createServer();

    const opt = {
      method: 'post',
      url: '/p1/login',
      payload: { email: 'ee', password: 'eepp', turnstileToken: 'fake-response' },
    } as const;

    const login = () => app.inject(opt);

    const all = await Promise.all(Array.from({ length: 20 }).map(() => login()));

    const res = await login();

    expect(all.filter((x) => x.statusCode === 429)).not.toHaveLength(0);

    expect(res.statusCode).toBe(429);
    expect(res.json()).toMatchSnapshot();
  });

  test('should login', async () => {
    const app = await createServer();

    const res = await app.inject({
      method: 'post',
      url: '/p1/login',
      payload: {
        email: 'treeholechan@gmail.com',
        password: 'lovemeplease',
        turnstileToken: 'fake-response',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.cookies.filter((x) => x.name === session.CookieKey)).toHaveLength(1);
    expect(res.json()).toMatchSnapshot();
  });
});
