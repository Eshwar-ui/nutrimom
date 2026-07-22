import { z } from 'zod';

// Fail fast at boot if the environment is misconfigured.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4001),
  CORS_ORIGIN: z.string().default('http://localhost:4000'),
  // The web app's own origin (no trailing slash) — used to build links that
  // go out in emails (e.g. the password-reset link), since the API can't
  // infer it from CORS_ORIGIN (that's an allowlist, possibly several origins).
  WEB_URL: z.string().url().default('http://localhost:4000'),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Active payment gateway. Extend the enum + add an adapter to support more.
  PAYMENT_PROVIDER: z.enum(['razorpay']).default('razorpay'),
  // Shipping label provider. 'manual' = built-in printable label (no vendor);
  // add 'shiprocket' etc. with an adapter for real courier AWBs.
  SHIPPING_PROVIDER: z.enum(['manual']).default('manual'),
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
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    );
  }
  return parsed.data;
}
