-- The condition-dispute window ("item not as described") was a hardcoded 48 in
-- the refunds page — the only number on that page not driven by config, and an
-- assumption rather than an operator decision. Default matches what the page
-- previously promised, so publishing this changes nothing until it's edited.
--
-- Not enforced in code: there is no dispute-raising endpoint yet, so this is
-- the published promise only. See the schema comment.
ALTER TABLE "CancellationPolicy" ADD COLUMN "conditionDisputeHours" INTEGER NOT NULL DEFAULT 48;
