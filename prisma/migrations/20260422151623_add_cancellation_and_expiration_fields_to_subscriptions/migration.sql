-- AlterTable
ALTER TABLE "Subscriptions" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Subscriptions_expiresAt_idx" ON "Subscriptions"("expiresAt");
