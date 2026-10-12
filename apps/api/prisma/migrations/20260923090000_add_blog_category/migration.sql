-- The Nurture Journal's taxonomy (founders' brief, section 11).
CREATE TYPE "BlogCategory" AS ENUM (
  'PREGNANCY',
  'YOGA',
  'POSTPARTUM',
  'NUTRITION',
  'STARTING_SOLIDS',
  'BABY',
  'TODDLER',
  'MOTHERHOOD',
  'MOMPRENEUR',
  'PRELOVED'
);

-- Nullable on purpose: posts written before the taxonomy existed have no
-- category, and guessing one for them would be inventing editorial intent.
ALTER TABLE "BlogPost" ADD COLUMN "category" "BlogCategory";

CREATE INDEX "BlogPost_category_published_publishedAt_idx"
  ON "BlogPost"("category", "published", "publishedAt");
