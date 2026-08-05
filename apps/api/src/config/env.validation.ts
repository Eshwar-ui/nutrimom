import { z } from 'zod';

// Fail fast at boot if the environment is misconfigured.
const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4001),
  CORS_ORIGIN: z.string().default('http://localhost:4000'),
  // The web app's own origin (no trailing slash) - used to build links that
  // go out in emails (e.g. the password-reset link), since the API can't
  // infer it from CORS_ORIGIN (that's an allowlist, possibly several origins).
  WEB_URL: z.string().url().default('http://localhost:4000'),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Active payment gateway. Extend the enum + add an adapter to support more.
  PAYMENT_PROVIDER: z.enum(['razorpay']).default('razorpay'),
  // Shipping label provider. 'manual' = built-in printable label (no vendor,
  // no scannable AWB); 'shiprocket' books a real courier pickup and returns a
  // hosted AWB label. Shiprocket additionally needs the three vars below and
  // a pickup location configured in their dashboard.
  SHIPPING_PROVIDER: z.enum(['manual', 'shiprocket']).default('manual'),
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  // Must exactly match a pickup location name in the Shiprocket dashboard.
  SHIPROCKET_PICKUP_LOCATION: z.string().default('Primary'),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  // Supabase Storage — holds seller-uploaded listing photos. The service-role
  // key is server-only and never sent to the browser (uploads proxy through the
  // API). The bucket must exist and be public-read.
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('listing-images'),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // Transactional email (password reset). Get a key at resend.com; FROM_EMAIL
  // must be on a domain verified in that Resend account.
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),

  // Where unhandled server errors are POSTed as JSON. Optional — unset means
  // errors are logged only. Any JSON sink works (Slack/Discord incoming
  // webhook, Better Stack, Axiom); see ErrorReporter.
  ERROR_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    );
  }
  // Cross-field: selecting a provider without its credentials would only fail
  // at the first label generation — i.e. in front of a seller mid-fulfilment.
  // Fail at boot instead.
  if (parsed.data.SHIPPING_PROVIDER === 'shiprocket') {
    const missing = (
      ['SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD'] as const
    ).filter((k) => !parsed.data[k]);
    if (missing.length > 0) {
      throw new Error(
        `SHIPPING_PROVIDER=shiprocket requires ${missing.join(' and ')}`,
      );
    }
  }
  return parsed.data;
}
