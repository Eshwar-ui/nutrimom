/**
 * A permissive stand-in for `PrismaService`.
 *
 * The HTTP suites exist to prove routing, guards, pipes and the exception
 * filter — not query behaviour, which the service unit specs already cover. So
 * every model method resolves to a benign empty value unless a test overrides
 * it, and no test needs to know which queries a controller happens to make.
 *
 * Auto-vivified rather than hand-listed: the schema has 20-odd models, and a
 * hand-written mock would go stale the first time a model is added and fail as
 * `Cannot read properties of undefined`, which reads like a routing bug.
 */

type AnyFn = jest.Mock;

/** Sensible empty result per Prisma method name. */
function defaultResultFor(method: string): unknown {
  if (method === 'findMany') return [];
  if (method === 'count') return 0;
  if (method === 'updateMany' || method === 'deleteMany') return { count: 0 };
  if (method === 'aggregate' || method === 'groupBy') return [];
  // findUnique / findFirst and friends: "not there".
  return null;
}

function modelMock(): Record<string, AnyFn> {
  const cache = new Map<string, AnyFn>();
  return new Proxy({} as Record<string, AnyFn>, {
    get(_target, prop) {
      // Guard against the proxy being awaited: without this an `await prisma`
      // anywhere would see a `then` and hang or resolve to nonsense.
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      if (!cache.has(prop)) {
        cache.set(prop, jest.fn().mockResolvedValue(defaultResultFor(prop)));
      }
      return cache.get(prop);
    },
  });
}

/**
 * Every property is both callable-as-a-mock and indexable into further mocks,
 * so `prisma.$queryRaw.mockResolvedValueOnce(...)` and
 * `prisma.user.findUnique.mockResolvedValueOnce(...)` both type-check without
 * a cast at the call site.
 */
export type PrismaMock = Record<string, AnyFn & Record<string, AnyFn>>;

export function createPrismaMock(): PrismaMock {
  const models = new Map<string, Record<string, AnyFn>>();
  const clientFns = new Map<string, AnyFn>();

  const client = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== 'string' || prop === 'then') return undefined;

        if (prop.startsWith('$')) {
          if (!clientFns.has(prop)) {
            if (prop === '$transaction') {
              // Interactive form gets the mock client itself; array form just
              // resolves the promises it was handed.
              clientFns.set(
                prop,
                jest
                  .fn()
                  .mockImplementation((arg: unknown): Promise<unknown> =>
                    typeof arg === 'function'
                      ? (arg as (tx: unknown) => Promise<unknown>)(client)
                      : Promise.all(arg as Promise<unknown>[]),
                  ),
              );
            } else {
              clientFns.set(prop, jest.fn().mockResolvedValue([]));
            }
          }
          return clientFns.get(prop);
        }

        // Lifecycle hooks Nest calls on the provider.
        if (prop === 'onModuleInit' || prop === 'onModuleDestroy') {
          if (!clientFns.has(prop)) {
            clientFns.set(prop, jest.fn().mockResolvedValue(undefined));
          }
          return clientFns.get(prop);
        }

        if (!models.has(prop)) models.set(prop, modelMock());
        return models.get(prop);
      },
    },
  );

  return client;
}
