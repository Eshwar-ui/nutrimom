/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',

  /**
   * A ratchet, not a target. Each number sits just under what the suite
   * reaches today, so the build fails on a regression while leaving room to
   * raise them as coverage grows. Do not lower one to make a build pass.
   *
   * The money and fulfilment services are pinned individually: they are where
   * a silent regression costs someone real money, and averaging them into one
   * global figure would let a drop in `payments` hide behind a rise anywhere
   * else. Note that a file matched by a path threshold is excluded from the
   * global group, which is why the global numbers below are lower than the
   * headline figure — what remains in that group is the untested remainder.
   *
   * Coverage here counts the unit suite only. The controllers, guards and the
   * exception filter are exercised by `test/*.e2e-spec.ts`, which runs under a
   * separate config and reports separately — so `roles.guard.ts` reads low
   * here despite being asserted on 63 routes in `authz.e2e-spec.ts`.
   */
  coverageThreshold: {
    global: {
      statements: 19,
      branches: 24,
      functions: 13,
      lines: 18,
    },
    '**/orders.service.ts': {
      statements: 83,
      branches: 74,
      functions: 76,
      lines: 86,
    },
    '**/payments.service.ts': {
      statements: 90,
      branches: 78,
      functions: 89,
      lines: 94,
    },
    '**/shipping.service.ts': {
      statements: 98,
      branches: 94,
      functions: 100,
      lines: 100,
    },
    '**/payouts.service.ts': {
      statements: 65,
      branches: 57,
      functions: 40,
      lines: 70,
    },
    '**/membership-expiry.service.ts': {
      statements: 86,
      branches: 76,
      functions: 66,
      lines: 90,
    },
    '**/reviews.service.ts': {
      statements: 83,
      branches: 80,
      functions: 71,
      lines: 88,
    },
    '**/wishlist.service.ts': {
      statements: 86,
      branches: 91,
      functions: 75,
      lines: 89,
    },
    '**/all-exceptions.filter.ts': {
      statements: 100,
      branches: 71,
      functions: 100,
      lines: 100,
    },
  },
};
