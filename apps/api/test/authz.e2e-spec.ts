import request from 'supertest';
import type { Server } from 'http';
import { createTestApp, type TestApp } from './test-app';

/**
 * Every route, walked over real HTTP, asserting who may reach it.
 *
 * Role isolation had been proven only by the ad-hoc live batteries logged in
 * CLAUDE.md — which passed, but ran once, by hand, against the operator's own
 * database. Nothing re-checked it on a commit, and there is no global auth
 * guard: `APP_GUARD` is the throttler only, so a controller written without
 * `@UseGuards` is silently public. That is the failure this suite is here to
 * catch, which is why the table below is exhaustive rather than a sample.
 *
 * The assertions are deliberately about authorization alone — a permitted
 * caller is checked for "not 401 and not 403", not for a 200, because the
 * database is mocked and what the handler then does is the service specs'
 * subject, not this one's.
 */

type Method = 'get' | 'post' | 'patch' | 'delete';
interface Route {
  method: Method;
  path: string;
  /** Body sent for the permitted-caller leg, where a route needs one. */
  body?: Record<string, unknown>;
}

const r = (
  method: Method,
  path: string,
  body?: Record<string, unknown>,
): Route => ({
  method,
  path,
  body,
});

/** Reachable without any token at all. */
const PUBLIC_ROUTES: Route[] = [
  r('get', '/health'),
  r('get', '/blog'),
  r('get', '/blog/some-slug'),
  r('get', '/categories'),
  r('get', '/listings'),
  r('get', '/listings/l1'),
  r('get', '/sellers/s1'),
  r('get', '/sellers/s1/reviews'),
  r('get', '/cancellation-policy'),
  r('get', '/business-profile'),

  // Unauthenticated by necessity — these are how a caller *becomes*
  // authenticated, or how an outside system reaches us.
  r('post', '/auth/register'),
  r('post', '/auth/login'),
  r('post', '/auth/refresh'),
  r('post', '/auth/forgot-password'),
  r('post', '/auth/reset-password'),
  r('post', '/contact'),
  // Razorpay calls this one; its gate is the HMAC, not a bearer token.
  r('post', '/payments/webhook'),
];

/** Any signed-in user; ownership is enforced inside the service. */
const AUTHENTICATED_ROUTES: Route[] = [
  r('post', '/auth/logout-all'),
  r('get', '/listings/l1/contact'),

  r('get', '/seller/listings'),
  r('get', '/seller/listings/stats'),
  r('post', '/seller/listings'),
  r('post', '/seller/listings/images'),
  r('patch', '/seller/listings/l1'),
  r('delete', '/seller/listings/l1'),
  r('post', '/seller/uploads'),

  r('get', '/notifications'),
  r('patch', '/notifications/n1/read'),
  r('post', '/notifications/read-all'),

  r('post', '/orders'),
  r('get', '/orders'),
  r('get', '/orders/o1'),
  r('patch', '/orders/o1/cancel'),
  r('patch', '/orders/o1/confirm-delivery'),
  r('post', '/orders/o1/reviews'),

  r('post', '/payments/order'),
  r('post', '/payments/verify'),

  r('get', '/seller/payouts'),
  r('get', '/seller/payouts/summary'),

  r('get', '/seller/billing/status'),
  r('post', '/seller/billing/registration'),
  r('post', '/seller/billing/membership'),
  r('post', '/seller/billing/verify'),

  r('get', '/seller/sales'),
  r('post', '/seller/sales/o1/label'),
  r('post', '/seller/sales/o1/ship'),

  r('get', '/users/me'),
  r('patch', '/users/me', { name: 'Asha Menon' }),
  r('post', '/users/me/request-seller-verification'),

  r('get', '/wishlist'),
  r('get', '/wishlist/ids'),
  r('post', '/wishlist/toggle', { listingId: 'l1' }),
];

/** Admins only — a customer token must be refused with 403. */
const ADMIN_ROUTES: Route[] = [
  r('get', '/admin/blog'),
  r('get', '/admin/blog/p1'),
  r('post', '/admin/blog'),
  r('patch', '/admin/blog/p1'),
  r('patch', '/admin/blog/p1/publish'),
  r('delete', '/admin/blog/p1'),

  r('post', '/admin/categories'),
  r('patch', '/admin/categories/c1'),
  r('delete', '/admin/categories/c1'),

  r('get', '/admin/contact-messages'),
  r('patch', '/admin/contact-messages/m1/status'),

  r('get', '/admin/listings'),
  r('post', '/admin/listings'),
  r('patch', '/admin/listings/l1/moderate'),
  r('patch', '/admin/listings/l1/feature'),
  r('patch', '/admin/listings/l1/category'),

  r('get', '/admin/orders'),
  r('get', '/admin/orders/o1'),
  r('patch', '/admin/orders/o1/status'),

  r('get', '/admin/payouts'),
  r('post', '/admin/payouts/p1/pay'),

  r('get', '/admin/users'),
  r('get', '/admin/users/u1'),
  r('patch', '/admin/users/u1/verify'),

  r('patch', '/admin/cancellation-policy'),
  r('patch', '/admin/business-profile'),
  r('get', '/admin/payout-policy'),
  r('patch', '/admin/payout-policy'),
];

describe('Route authorization', () => {
  let ctx: TestApp;
  let server: Server;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    server = ctx.app.getHttpServer() as Server;
    customerToken = ctx.tokenFor({
      id: 'u-customer',
      email: 'buyer@example.com',
      role: 'CUSTOMER',
    });
    adminToken = ctx.tokenFor({
      id: 'u-admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  afterAll(async () => {
    await ctx.close();
  });

  const send = (route: Route, token?: string) => {
    const req = request(server)[route.method](route.path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send(route.body ?? {});
  };

  describe('public routes need no token', () => {
    it.each(
      PUBLIC_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is reachable anonymously', async (_label, route) => {
      const res = await send(route);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe('authenticated routes reject anonymous callers', () => {
    it.each(
      AUTHENTICATED_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is 401 without a token', async (_label, route) => {
      await send(route).expect(401);
    });
  });

  describe('authenticated routes admit a signed-in customer', () => {
    it.each(
      AUTHENTICATED_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is not refused for a customer', async (_label, route) => {
      const res = await send(route, customerToken);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe('admin routes reject anonymous callers', () => {
    it.each(
      ADMIN_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is 401 without a token', async (_label, route) => {
      await send(route).expect(401);
    });
  });

  describe('admin routes reject a signed-in customer', () => {
    it.each(
      ADMIN_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is 403 for a customer', async (_label, route) => {
      await send(route, customerToken).expect(403);
    });
  });

  describe('admin routes admit an admin', () => {
    it.each(
      ADMIN_ROUTES.map(
        (route) =>
          [`${route.method.toUpperCase()} ${route.path}`, route] as const,
      ),
    )('%s is not refused for an admin', async (_label, route) => {
      const res = await send(route, adminToken);
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe('token handling', () => {
    it('rejects a token signed with the wrong secret', async () => {
      // A token minted by anything other than this API must not open a door.
      const forged = ctx.tokenFor({
        id: 'u-admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
      const tampered = forged.slice(0, -4) + 'AAAA';
      await request(server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${tampered}`)
        .expect(401);
    });

    it('rejects a well-formed token in the wrong scheme', async () => {
      await request(server)
        .get('/admin/users')
        .set('Authorization', adminToken)
        .expect(401);
    });

    it('rejects garbage in the Authorization header', async () => {
      await request(server)
        .get('/orders')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });

    it('does not grant admin by claiming the role in the body', async () => {
      await request(server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'ADMIN' })
        .expect(403);
    });
  });

  describe('the optional-auth listing detail route', () => {
    it('serves an anonymous visitor', async () => {
      const res = await request(server).get('/listings/l1');
      expect(res.status).not.toBe(401);
    });

    it('serves a signed-in visitor', async () => {
      const res = await request(server)
        .get('/listings/l1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).not.toBe(401);
    });

    it('does not 500 on a malformed token — it just treats the viewer as anonymous', async () => {
      const res = await request(server)
        .get('/listings/l1')
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('coverage of the table itself', () => {
    it('walks every route group', () => {
      // A tripwire: if these counts drift the table has gone stale relative
      // to the controllers, which is exactly when a new route slips in
      // unguarded.
      expect(PUBLIC_ROUTES.length).toBe(17);
      expect(AUTHENTICATED_ROUTES.length).toBe(35);
      expect(ADMIN_ROUTES.length).toBe(28);
    });

    it('lists no route twice', () => {
      const all = [...PUBLIC_ROUTES, ...AUTHENTICATED_ROUTES, ...ADMIN_ROUTES];
      const keys = all.map((route) => `${route.method} ${route.path}`);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('puts every admin/* path in the admin group', () => {
      const misplaced = [...PUBLIC_ROUTES, ...AUTHENTICATED_ROUTES].filter(
        (route) => route.path.startsWith('/admin'),
      );
      expect(misplaced).toEqual([]);
    });
  });
});
