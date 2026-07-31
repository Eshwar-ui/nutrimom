-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SELLER_REGISTERED';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedUserId" TEXT;
