#!/usr/bin/env node
/**
 * Holds the Flutter app's Dart contract mirror against the TypeScript one.
 *
 * The web app imports `@nutrimom/shared` and cannot drift from it. The mobile
 * app restates those enums and money constants in Dart, which means it *can*
 * drift — silently, and in the direction that matters: a value added to the API
 * that an installed build has never heard of.
 *
 * This compares, by name:
 *   - every `export const X = { ... } as const` enum in packages/shared
 *   - every `enum X { ... }` in apps/api/prisma/schema.prisma (for the enums
 *     that exist on the model but are not re-exported in shared)
 * against the `enum X { ... }` declarations in the Dart mirror, plus the two
 * money constants that are published prices.
 *
 * Exit code 1 on any difference. Do not "fix" a failure by deleting a case —
 * fix the mirror.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(root, 'packages/shared/src/index.ts');
const PRISMA = join(root, 'apps/api/prisma/schema.prisma');
const DART = join(root, 'apps/mobile/lib/src/contracts/enums.dart');
const DART_MONEY = join(root, 'apps/mobile/lib/src/contracts/money.dart');

/** `export const Role = { CUSTOMER: "CUSTOMER", ... } as const;` */
function tsEnums(source) {
  const out = new Map();
  const re = /export const (\w+) = \{([\s\S]*?)\} as const;/g;
  for (const [, name, body] of source.matchAll(re)) {
    // Not line-anchored: several of these are declared on a single line
    // (`export const Role = { CUSTOMER: "CUSTOMER", ADMIN: "ADMIN" } as const;`),
    // and anchoring silently found only the first member.
    const clean = body.replace(/\/\/.*$/gm, '');
    const values = [...clean.matchAll(/\w+:\s*"([A-Z0-9_]+)"/g)].map((m) => m[1]);
    // Skip non-enum const objects (label maps, plan catalogues).
    if (values.length > 0) out.set(name, values);
  }
  return out;
}

/** `enum Role {\n  CUSTOMER\n  ADMIN\n}` */
function prismaEnums(source) {
  const out = new Map();
  for (const [, name, body] of source.matchAll(/^enum (\w+) \{([\s\S]*?)^\}/gm)) {
    const values = body
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => /^[A-Z0-9_]+$/.test(line));
    if (values.length > 0) out.set(name, values);
  }
  return out;
}

/** `enum Role {\n  customer('CUSTOMER'),\n ... }` */
function dartEnums(source) {
  const out = new Map();
  for (const [, name, body] of source.matchAll(/^enum (\w+) \{([\s\S]*?)^\}/gm)) {
    const values = [...body.matchAll(/^\s*\w+\('([A-Z0-9_]+)'/gm)].map((m) => m[1]);
    if (values.length > 0) out.set(name, values);
  }
  return out;
}

const shared = readFileSync(SHARED, 'utf8');
const prisma = readFileSync(PRISMA, 'utf8');
const dart = readFileSync(DART, 'utf8');
const dartMoney = readFileSync(DART_MONEY, 'utf8');

const ts = tsEnums(shared);
const db = prismaEnums(prisma);
const mirror = dartEnums(dart);

const problems = [];

for (const [name, dartValues] of mirror) {
  // The wire contract wins where it exists; Prisma covers the enums the API
  // sends but shared does not re-export.
  const source = ts.has(name) ? 'packages/shared' : db.has(name) ? 'prisma/schema.prisma' : null;
  const expected = ts.get(name) ?? db.get(name);
  if (!expected) {
    problems.push(`${name}: declared in Dart but found in neither shared nor the Prisma schema.`);
    continue;
  }
  const missing = expected.filter((v) => !dartValues.includes(v));
  const extra = dartValues.filter((v) => !expected.includes(v));
  if (missing.length) {
    problems.push(
      `${name}: ${source} has ${missing.map((v) => `"${v}"`).join(', ')} — the Dart mirror does not. ` +
        `An installed build would throw ContractDriftException on it.`,
    );
  }
  if (extra.length) {
    problems.push(
      `${name}: the Dart mirror has ${extra.map((v) => `"${v}"`).join(', ')} — ${source} does not.`,
    );
  }
  // Order matters: the Dart tests assert on `values` in order, and a reordered
  // enum is a silently different index in any persisted value.
  if (!missing.length && !extra.length && expected.join(',') !== dartValues.join(',')) {
    problems.push(`${name}: same values, different order (${source}: ${expected.join(', ')}).`);
  }
}

// Enums the API exposes on the wire that the app has not mirrored at all.
for (const [name] of ts) {
  if (!mirror.has(name)) {
    problems.push(`${name}: exported by packages/shared but missing from the Dart mirror.`);
  }
}

// Prisma enums are not all on the wire, so a Prisma-only enum is not a
// failure by itself. But one that packages/shared *names* is: shared is the
// wire contract, so a type it mentions reaches a client. This is the rule that
// catches BlogCategory, which shared exposes as an array of objects rather
// than the `{...} as const` object the parser above understands, and which an
// earlier version of this script therefore passed straight over.
for (const [name] of db) {
  if (mirror.has(name) || ts.has(name)) continue;
  if (new RegExp(`\\b${name}\\b`).test(shared)) {
    problems.push(
      `${name}: a Prisma enum that packages/shared references, so it is on the wire, ` +
        `but the Dart mirror has no ${name}.`,
    );
  }
}

/* ---- array-shaped catalogues: `export const X = [{ value, slug, label }] as const` ---- */

// Slugs are URL contracts (`/journal?category=starting-solids`), so a slug
// that drifts breaks every link to it. Value, slug and label are compared.
const catalogues = [{ ts: 'BLOG_CATEGORIES', dart: 'BlogCategory' }];
for (const { ts: tsName, dart: dartName } of catalogues) {
  const block = new RegExp(`export const ${tsName} = \\[([\\s\\S]*?)\\] as const;`).exec(shared);
  if (!block) continue;
  const expected = [...block[1].matchAll(/value:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)]
    .map(([, value, slug, label]) => `${value}|${slug}|${label}`);
  const dartBlock = new RegExp(`^enum ${dartName} \\{([\\s\\S]*?)^\\}`, 'm').exec(dart);
  if (!dartBlock) {
    problems.push(`${tsName}: packages/shared defines it; the Dart mirror has no enum ${dartName}.`);
    continue;
  }
  const actual = [...dartBlock[1].matchAll(/^\s*\w+\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/gm)]
    .map(([, value, slug, label]) => `${value}|${slug}|${label}`);
  if (expected.join(',') !== actual.join(',')) {
    const missing = expected.filter((e) => !actual.includes(e));
    const extra = actual.filter((a) => !expected.includes(a));
    problems.push(
      `${tsName} vs Dart ${dartName}: ` +
        (missing.length ? `shared has ${missing.join(', ')} which Dart lacks. ` : '') +
        (extra.length ? `Dart has ${extra.join(', ')} which shared lacks. ` : '') +
        (!missing.length && !extra.length ? 'same entries, different order.' : ''),
    );
  }
}

/* ---- money constants: these are published prices, not just types ---- */

const registrationTs = /REGISTRATION_FEE_PAISE = (\d+)/.exec(shared)?.[1];
const registrationDart = /kRegistrationFeePaise = (\d+)/.exec(dartMoney)?.[1];
if (registrationTs !== registrationDart) {
  problems.push(
    `REGISTRATION_FEE_PAISE: shared says ${registrationTs}, Dart says ${registrationDart}.`,
  );
}

const planRe =
  /(\w+): \{ plan: "(\w+)", label: "([^"]+)", priceInPaise: (\d+), durationDays: (\d+)/g;
for (const [, , plan, label, price, days] of shared.matchAll(planRe)) {
  const dartRe = new RegExp(`\\w+\\('${plan}', '([^']+)', (\\d+), (\\d+)`);
  const found = dartRe.exec(dart);
  if (!found) {
    problems.push(`MEMBERSHIP_PLANS.${plan}: missing from the Dart mirror.`);
    continue;
  }
  const [, dLabel, dPrice, dDays] = found;
  if (dLabel !== label || dPrice !== price || dDays !== days) {
    problems.push(
      `MEMBERSHIP_PLANS.${plan}: shared says ${label}/${price}p/${days}d, ` +
        `Dart says ${dLabel}/${dPrice}p/${dDays}d.`,
    );
  }
}

if (problems.length) {
  console.error('\nMobile contract drift — apps/mobile is out of step with the API:\n');
  for (const p of problems) console.error(`  • ${p}`);
  console.error(
    '\nFix apps/mobile/lib/src/contracts/*.dart (and its tests), not this script.\n',
  );
  process.exit(1);
}

console.log(
  `Mobile contract OK — ${mirror.size} enums and the money constants match packages/shared.`,
);
