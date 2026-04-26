-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "asaasEventId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asaasCustomerId" TEXT NOT NULL,
    "asaasSubscriptionId" TEXT NOT NULL,
    "billingType" "PaymentMethod" NOT NULL,
    "cycle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_asaasEventId_key" ON "WebhookEvent"("asaasEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_asaasEventId_idx" ON "WebhookEvent"("asaasEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionIntent_asaasSubscriptionId_key" ON "SubscriptionIntent"("asaasSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionIntent_userId_idx" ON "SubscriptionIntent"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionIntent_asaasSubscriptionId_idx" ON "SubscriptionIntent"("asaasSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionIntent_status_idx" ON "SubscriptionIntent"("status");

-- AddForeignKey
ALTER TABLE "SubscriptionIntent" ADD CONSTRAINT "SubscriptionIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
