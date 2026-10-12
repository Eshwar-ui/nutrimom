-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REFUNDED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayPaymentId_key" ON "Order"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerPayment_gatewayPaymentId_key" ON "SellerPayment"("gatewayPaymentId");
