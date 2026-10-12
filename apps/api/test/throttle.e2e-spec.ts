import request from 'supertest';
import type { Server } from 'http';
import { createTestApp, type TestApp } from './test-app';

/**
 * The rate limits, with the real `ThrottlerGuard` left in place.
 *
 * The authz suite disables it deliberately, so without this file the limits
 * would be configured and never exercised — and they are the only thing
 * standing between the login route and an unlimited credential-stuffing run,
 * or between the public contact form and a spam flood.
 */
describe('Rate limiting', () => {
  let ctx: TestApp;
  let server: Server;

  beforeAll(async () => {
    ctx = await createTestApp({ throttle: true });
    server = ctx.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await ctx.close();
  });

  /** Fires n requests from one IP, in order, and returns the status codes. */
  async function burst(n: number, send: () => request.Test): Promise<number[]> {
    const statuses: number[] = [];
    for (let i = 0; i < n; i++) {
      statuses.push((await send()).status);
    }
    return statuses;
  }

  it('caps login attempts at 5 a minute', async () => {
    const statuses = await burst(7, () =>
      request(server)
        .post('/auth/login')
        .send({ email: 'buyer@example.com', password: 'wrong-password' }),
    );

    // The first five are allowed through to fail on their own merits; the
    // sixth onward is refused by the throttler.
    expect(statuses.slice(0, 5).every((s) => s !== 429)).toBe(true);
    expect(statuses[5]).toBe(429);
    expect(statuses[6]).toBe(429);
  });

  it('caps password-reset requests, which otherwise enumerate by volume', async () => {
    const statuses = await burst(7, () =>
      request(server)
        .post('/auth/forgot-password')
        .send({ email: 'someone@example.com' }),
    );

    expect(statuses[6]).toBe(429);
  });

  it('caps the public contact form', async () => {
    const statuses = await burst(7, () =>
      request(server).post('/contact').send({
        name: 'Asha Menon',
        email: 'asha@example.com',
        message: 'Hello, I have a question about a listing.',
      }),
    );

    expect(statuses[6]).toBe(429);
  });

  it('leaves ordinary reads on the generous default, not the auth limit', async () => {
    // 120/min globally — a browse page issues several calls per view and must
    // not be throttled like a login form.
    const statuses = await burst(10, () => request(server).get('/listings'));

    expect(statuses.every((s) => s !== 429)).toBe(true);
  });

  it('throttles per route, so one hot endpoint does not lock out the rest', async () => {
    await burst(7, () =>
      request(server)
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'x' }),
    );

    const res = await request(server).get('/health');
    expect(res.status).not.toBe(429);
  });
});
