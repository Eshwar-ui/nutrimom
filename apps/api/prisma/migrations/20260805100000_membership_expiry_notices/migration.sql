-- Membership expiry warnings. A seller's listing window could previously
-- lapse with no signal at all — expiresAt was only read at gate-check time,
-- so the first sign of expiry was being blocked from listing.

ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP_EXPIRED';

-- Stamped once per membership so the sweep notifies a seller once, not on
-- every run.
ALTER TABLE "SellerMembership" ADD COLUMN "expiryWarningSentAt" TIMESTAMP(3);
ALTER TABLE "SellerMembership" ADD COLUMN "expiredNoticeSentAt" TIMESTAMP(3);

-- Suppress the backlog: every membership that already expired before this
-- shipped is marked as notified, so existing sellers don't get a burst of
-- stale "your membership expired" alerts on first boot after deploy.
UPDATE "SellerMembership"
SET "expiredNoticeSentAt" = now(), "expiryWarningSentAt" = now()
WHERE "expiresAt" <= now();
