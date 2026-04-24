-- AlterTable
ALTER TABLE "OrganizationInvite" ADD COLUMN     "shopId" TEXT;

-- CreateIndex
CREATE INDEX "OrganizationInvite_shopId_idx" ON "OrganizationInvite"("shopId");

-- AddForeignKey
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
