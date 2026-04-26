-- CreateEnum
CREATE TYPE "VehicleSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "AppointmentService" ADD COLUMN     "isBudget" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleSize" "VehicleSize";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "hasVariants" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBudgetOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "size" "VehicleSize" NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "ServiceVariant" (
    "id" TEXT NOT NULL,
    "size" "VehicleSize" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceVariant_serviceId_idx" ON "ServiceVariant"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceVariant_serviceId_size_key" ON "ServiceVariant"("serviceId", "size");

-- AddForeignKey
ALTER TABLE "ServiceVariant" ADD CONSTRAINT "ServiceVariant_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
