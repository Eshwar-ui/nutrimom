-- Adds a human-readable sequential order number (e.g. "NM-20260730-014") alongside the
-- existing cuid primary key, backed by a per-day atomic counter table.

-- 1. New sequence table backing atomic per-day counters.
CREATE TABLE "DailyOrderSequence" (
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyOrderSequence_pkey" PRIMARY KEY ("date")
);

-- 2. Add the column nullable first — existing rows have no orderNumber yet.
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

-- 3. Backfill every existing order, numbered within its own UTC calendar day
--    ordered by createdAt (oldest first), matching how new orders will be
--    numbered going forward.
WITH numbered AS (
  SELECT
    id,
    to_char(("createdAt" AT TIME ZONE 'UTC'), 'YYYYMMDD') AS day,
    ROW_NUMBER() OVER (
      PARTITION BY to_char(("createdAt" AT TIME ZONE 'UTC'), 'YYYYMMDD')
      ORDER BY "createdAt"
    ) AS rn
  FROM "Order"
)
UPDATE "Order" o
SET "orderNumber" = 'NM-' || numbered.day || '-' || LPAD(numbered.rn::text, 3, '0')
FROM numbered
WHERE o.id = numbered.id;

-- 4. Seed the sequence table with each day's backfilled count, so the next
--    order placed on a day that already has history continues the sequence
--    instead of restarting at 001 and colliding with a backfilled number.
INSERT INTO "DailyOrderSequence" ("date", "count")
SELECT
  to_char(("createdAt" AT TIME ZONE 'UTC'), 'YYYYMMDD') AS date,
  COUNT(*) AS count
FROM "Order"
GROUP BY to_char(("createdAt" AT TIME ZONE 'UTC'), 'YYYYMMDD');

-- 5. Now that every row has a value, enforce NOT NULL + uniqueness.
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
