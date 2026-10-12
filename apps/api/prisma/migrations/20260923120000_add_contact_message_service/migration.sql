-- Which pillar of the ecosystem an enquiry came from, so admin -> Messages can
-- tell a yoga booking from a general question (RESTRUCTURE-PLAN.md, phase 3).
CREATE TYPE "EnquiryService" AS ENUM (
  'YOGA',
  'NUTRITION',
  'STARTING_SOLIDS',
  'COMMUNITY',
  'PRELOVED'
);

-- Nullable on purpose: the footer's contact link belongs to no service, and
-- every message sent before this column existed has none. Backfilling a guess
-- from the subject line would invent an attribution nobody recorded.
ALTER TABLE "ContactMessage" ADD COLUMN "service" "EnquiryService";

CREATE INDEX "ContactMessage_service_createdAt_idx"
  ON "ContactMessage"("service", "createdAt");
