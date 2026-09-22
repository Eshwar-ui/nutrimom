/**
 * Hermetic environment for the HTTP suites.
 *
 * `ConfigModule` reads `apps/api/.env` when it exists, but it never overrides a
 * value already on `process.env` — so setting these here keeps the suites off
 * the operator's real database and gateway credentials, and lets them run in CI
 * where no `.env` exists at all. Every value is fake on purpose: `PrismaService`
 * is overridden in the test app, and nothing in these suites reaches a network.
 */
const TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  PORT: '0',
  CORS_ORIGIN: 'http://localhost:4000',
  WEB_URL: 'http://localhost:4000',

  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',

  PAYMENT_PROVIDER: 'razorpay',
  SHIPPING_PROVIDER: 'manual',

  RAZORPAY_KEY_ID: 'rzp_test_fake',
  RAZORPAY_KEY_SECRET: 'test-key-secret',
  RAZORPAY_WEBHOOK_SECRET: 'test-webhook-secret',

  SUPABASE_URL: 'https://fake.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  SUPABASE_STORAGE_BUCKET: 'listing-images',

  MAIL_FROM_EMAIL: 'test@example.com',
};

for (const [key, value] of Object.entries(TEST_ENV)) {
  process.env[key] = value;
}

// Never let a suite POST a stack trace to a real sink, even if the developer's
// shell happens to export one.
delete process.env.ERROR_WEBHOOK_URL;
delete process.env.RESEND_API_KEY;
