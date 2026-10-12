-- Grandfathers existing paying sellers into the merged verification pipeline
-- (see ListingsService.assertCanList / SellerBillingService.status): listing
-- now requires BOTH paid registration AND admin approval (isSellerVerified),
-- where before only an active membership was checked. Without this, every
-- already-paying seller who was never manually badge-approved would be
-- silently locked out of creating new listings the moment this ships.
-- Idempotent — safe to re-run.
UPDATE "User"
SET "isSellerVerified" = true
WHERE "registrationPaidAt" IS NOT NULL AND "isSellerVerified" = false;