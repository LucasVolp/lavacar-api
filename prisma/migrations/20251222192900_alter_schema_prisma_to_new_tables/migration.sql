/*
  Warnings:

  - The values [OPEN,CLOSED] on the enum `ShopStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `serviceId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `address` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Shop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plate,userId]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDuration` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `BlockedTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BlockedTimeType" AS ENUM ('FULL_DAY', 'PARTIAL');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'SUV', 'VAN', 'OTHER');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';

-- AlterEnum
BEGIN;
CREATE TYPE "ShopStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
ALTER TABLE "public"."Shop" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shop" ALTER COLUMN "status" TYPE "ShopStatus_new" USING ("status"::text::"ShopStatus_new");
-- ALTER TABLE "Schedule" ALTER COLUMN "isOpen" TYPE "ShopStatus_new" USING ("isOpen"::text::"ShopStatus_new");
ALTER TYPE "ShopStatus" RENAME TO "ShopStatus_old";
ALTER TYPE "ShopStatus_new" RENAME TO "ShopStatus";
DROP TYPE "public"."ShopStatus_old";
ALTER TABLE "Shop" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "BlockedTime" DROP CONSTRAINT "BlockedTime_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_userId_fkey";

-- DropIndex
DROP INDEX "Appointment_serviceId_idx";

-- DropIndex
DROP INDEX "Schedule_weekday_key";

-- DropIndex
DROP INDEX "Vehicle_plate_key";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "serviceId",
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "totalDuration" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "BlockedTime" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "type" "BlockedTimeType" NOT NULL,
ALTER COLUMN "date" SET DATA TYPE DATE,
ALTER COLUMN "reason" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "breakEndTime" TEXT,
ADD COLUMN     "breakStartTime" TEXT,
ADD COLUMN     "isOpen" "ShopStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "address",
DROP COLUMN "contactPhone",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "bufferBetweenSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "minAdvanceMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "neighborhood" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "slotInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "state" CHAR(2) NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "zipCode" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'CAR',
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "color" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ServiceGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "servicePrice" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceGroup_shopId_idx" ON "ServiceGroup"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceGroup_name_shopId_key" ON "ServiceGroup"("name", "shopId");

-- CreateIndex
CREATE INDEX "AppointmentService_appointmentId_idx" ON "AppointmentService"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentService_serviceId_idx" ON "AppointmentService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_appointmentId_serviceId_key" ON "AppointmentService"("appointmentId", "serviceId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_shopId_scheduledAt_idx" ON "Appointment"("shopId", "scheduledAt");

-- CreateIndex
CREATE INDEX "BlockedTime_shopId_date_idx" ON "BlockedTime"("shopId", "date");

-- CreateIndex
CREATE INDEX "Evaluation_appointmentId_idx" ON "Evaluation"("appointmentId");

-- CreateIndex
CREATE INDEX "Evaluation_userId_idx" ON "Evaluation"("userId");

-- CreateIndex
CREATE INDEX "Service_groupId_idx" ON "Service"("groupId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_document_key" ON "Shop"("document");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_email_key" ON "Shop"("email");

-- CreateIndex
CREATE INDEX "Shop_slug_idx" ON "Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "Shop"("status");

-- CreateIndex
CREATE INDEX "Shop_city_state_idx" ON "Shop"("city", "state");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Vehicle_plate_idx" ON "Vehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_userId_key" ON "Vehicle"("plate", "userId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceGroup" ADD CONSTRAINT "ServiceGroup_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ServiceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedTime" ADD CONSTRAINT "BlockedTime_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
