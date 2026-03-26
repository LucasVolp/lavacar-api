-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'PENDING', 'OVERDUE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'BOLETO', 'PIX');

-- AlterEnum
ALTER TYPE "VehicleSize" ADD VALUE 'MOTORCYCLE';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "Subscriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "plan" TEXT NOT NULL,
    "billingType" "PaymentMethod" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_subscriptionId_key" ON "Subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "Subscriptions_organizationId_idx" ON "Subscriptions"("organizationId");

-- CreateIndex
CREATE INDEX "Subscriptions_status_idx" ON "Subscriptions"("status");

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
