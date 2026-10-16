# The Nurture Moms — mobile app

Flutter client for the marketplace and the four-pillar ecosystem. It is a
**second client on the existing API** (`apps/api`) — it owns no business rules
of its own. See [`MOBILE-APP-PRD.md`](../../MOBILE-APP-PRD.md) for scope,
phasing and the decision log.

**Phase 0 (foundation) is what's here.** Discovery, checkout, selling and the
pillar screens land in P1–P3.

## Running it

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://localhost:1133 \
            --dart-define=WEB_BASE_URL=http://localhost:1122
```

Both defines are optional in development: `AppConfig` falls back to the local
stack, and swaps `localhost` for `10.0.2.2` on Android so an emulator can
actually reach the host. Point them at staging or production for a real build.

The API must be running (`pnpm dev` from the repo root, or
`pnpm --filter api dev`).

## Layout

```
lib/src/
  contracts/      the Dart mirror of packages/shared — enums, money, validators
  core/
    config/       build-time configuration (--dart-define)
    network/      Dio client, auth interceptor, secure token store
    router/       go_router + the auth redirect
    theme/        the brief's palette and type
    widgets/      shared brand + form pieces
  features/
    auth/         sign in, register, forgot password
    account/      profile, edit, sign out (incl. everywhere)
    home/         app shell + splash
```

`data/` talks to the API, `application/` holds Riverpod state, `presentation/`
is widgets. State is **Riverpod** (PRD D9), routing is **go_router**.

## The contract mirror — read this before editing `lib/src/contracts/`

The web app imports `@nutrimom/shared` and cannot drift from the API. This app
restates those enums and money rules in Dart, so it *can* drift — and the
dangerous direction is silent: the API gains an enum value, an installed build
has never heard of it, and a status renders blank or throws in front of a user.

Two things hold the mirror in place:

1. **`flutter test`** — `test/contracts/` pins every wire value and mirrors
   `packages/shared/src/payout.spec.ts` case for case, including the
   JavaScript-compatible rounding in `splitPayout`.
2. **`pnpm check:mobile-contract`** (repo root) — parses the enums out of
   `packages/shared/src/index.ts` and `apps/api/prisma/schema.prisma`, parses
   the Dart mirror, and fails on any value present in one and not the other,
   on a reordering, and on a membership price or registration fee that has
   moved.

If the check fails, fix the mirror — not the script.

`ContractDriftException` is what a mirror miss looks like at runtime. It is a
real, expected condition in a released app (the server can deploy a new value
while an old build is installed); the force-upgrade gate in PRD R0.5 is what
bounds how long it can last.

## Money

Integer paise everywhere, exactly as in the API and the database. Nothing in
`contracts/money.dart` returns a double and no caller should introduce one.
`splitPayout` is the single definition of the commission split and is written
to match JavaScript's `Math.round` rather than Dart's `.round()` — the two
disagree on negative halfway cases.

## Auth

Access tokens live 15 minutes, so the interceptor refreshes them, **once**, and
**single-flight**: concurrent 401s await one refresh rather than racing several
and invalidating each other. Tokens live in the Keychain / Android KeyStore,
never `SharedPreferences`.

A refresh that fails is a genuine end of session — usually because a password
reset or `logout-all` bumped `User.tokenVersion` on the server. The app signs
out and says so on the login screen rather than landing there silently.

## Tests

```bash
flutter test          # from apps/mobile
flutter analyze
```

## Not wired up yet

Firebase (Crashlytics / Analytics / FCM, PRD D7) and the Razorpay SDK are P0/P1
items that need real project credentials; neither is in the tree yet. The
app-config force-upgrade gate needs API change **B2** before it can be built.
