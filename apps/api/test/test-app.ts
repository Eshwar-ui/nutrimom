import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ErrorReporter } from '../src/common/errors/error-reporter';
import { createPrismaMock, type PrismaMock } from './prisma-mock';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaMock;
  /** Mints a real access token the running app's JwtStrategy will accept. */
  tokenFor(user: { id: string; email: string; role: string }): string;
  close(): Promise<void>;
}

/**
 * Boots the real `AppModule` — every controller, guard, pipe and the global
 * exception filter, wired exactly as `main.ts` wires them — over HTTP, with
 * only the database swapped out. That is the layer these suites are for: the
 * service specs already cover query behaviour, and nothing else proves that a
 * route is actually guarded.
 *
 * `rawBody: true` mirrors `main.ts`; the Razorpay webhook verifies its HMAC
 * against the exact received bytes, so an app built without it would not be
 * testing the real request path.
 */
export interface TestAppOptions {
  /**
   * Leave the real `ThrottlerGuard` in place. Off by default: it is an
   * APP_GUARD, so it runs ahead of every controller guard, and a suite that
   * walks sixty routes would trip the 120/min ceiling and start seeing 429
   * where it expected 401 — a green-looking suite proving nothing. The
   * throttler gets its own suite instead, where the limit is the subject.
   */
  throttle?: boolean;
}

export async function createTestApp(
  options: TestAppOptions = {},
): Promise<TestApp> {
  const prisma = createPrismaMock();

  let builder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    // Keep unhandled faults out of any real sink and off the console; the
    // filter's own spec covers what it reports.
    .overrideProvider(ErrorReporter)
    .useValue({ capture: jest.fn() });

  if (!options.throttle) {
    builder = builder
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true });
  }

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ rawBody: true });
  // The filter logs every 5xx it handles; a suite that deliberately provokes
  // them would otherwise bury its own failures in stack traces.
  app.useLogger(false);
  await app.init();

  const jwt = moduleRef.get(JwtService);

  return {
    app,
    prisma,
    tokenFor(user) {
      return jwt.sign(
        { sub: user.id, email: user.email, role: user.role, tv: 0 },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        },
      );
    },
    close: () => app.close(),
  };
}
