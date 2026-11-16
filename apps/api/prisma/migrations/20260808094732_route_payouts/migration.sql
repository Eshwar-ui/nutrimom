-- Reconstructed. This migration was applied to the dev database but its SQL was
-- never committed. It is rebuilt from what the database still carries (found with
-- `prisma migrate diff`): Razorpay Route fields that the current schema no longer
-- uses. Every statement is idempotent so it is safe on a database that already has
-- them, and it leaves them in place rather than dropping data.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYOUT_PAID';

-- AlterTable
ALTER TABLE "SellerPayout" ADD COLUMN IF NOT EXISTS "transferId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayAccountId" TEXT;
