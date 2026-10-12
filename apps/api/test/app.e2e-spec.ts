import request from 'supertest';
import type { Server } from 'http';
import { createTestApp, type TestApp } from './test-app';

/**
 * HTTP smoke test for the assembled application.
 *
 * Replaces the Nest scaffold this file used to hold, which asserted
 * `GET / -> "Hello World!"` against an app that has never had a `/` route —
 * so `pnpm test:e2e` failed with a 404 on every run since the repo was created.
 */
describe('Application (HTTP)', () => {
  let ctx: TestApp;
  let server: Server;

  beforeAll(async () => {
    ctx = await createTestApp();
    server = ctx.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('GET /health', () => {
    it('reports 200 and database up when the query succeeds', async () => {
      ctx.prisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);

      const res = await request(server).get('/health').expect(200);

      expect(res.body).toMatchObject({
        status: 'ok',
        database: 'up',
        service: 'nutrimom-api',
      });
      expect(typeof (res.body as { uptime: number }).uptime).toBe('number');
    });

    it('reports 503 so a load balancer routes around the instance', async () => {
      ctx.prisma.$queryRaw.mockRejectedValueOnce(new Error('connection lost'));

      const res = await request(server).get('/health').expect(503);

      expect(res.body).toMatchObject({ status: 'degraded', database: 'down' });
    });

    it('never leaks the underlying database error to the client', async () => {
      ctx.prisma.$queryRaw.mockRejectedValueOnce(
        new Error('password authentication failed for user "postgres"'),
      );

      const res = await request(server).get('/health').expect(503);

      expect(JSON.stringify(res.body)).not.toContain('password');
      expect(JSON.stringify(res.body)).not.toContain('postgres');
    });
  });

  describe('routing', () => {
    it('404s an unknown path', async () => {
      await request(server).get('/definitely-not-a-route').expect(404);
    });

    it('404s the root, which has no handler', async () => {
      await request(server).get('/').expect(404);
    });
  });

  describe('validation', () => {
    it('rejects a malformed login body with 400, not 500', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);

      // The ZodValidationPipe must answer before the service is reached — a
      // 500 here would mean invalid input got as far as the database.
      expect(res.status).toBe(400);
    });

    it('rejects a body that is not an object at all', async () => {
      await request(server)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('"just a string"')
        .expect(400);
    });
  });

  describe('the global exception filter', () => {
    it('turns an unexpected fault into a generic 500 with no internals', async () => {
      ctx.prisma.user.findUnique.mockRejectedValueOnce(
        new Error(
          'Invalid `prisma.user.findUnique()` invocation: connection pool timeout',
        ),
      );

      const res = await request(server)
        .post('/auth/login')
        .send({ email: 'someone@example.com', password: 'correct horse' })
        .expect(500);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('prisma');
      expect(body).not.toContain('connection pool');
      expect(body).not.toContain('at ');
    });
  });
});
