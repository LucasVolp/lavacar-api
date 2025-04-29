/*
  Warnings:

  - Changed the type of `weekday` on the `Schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "weekday",
ADD COLUMN     "weekday" "Weekday" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_weekday_shopId_key" ON "Schedule"("weekday", "shopId");
