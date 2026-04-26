/*
  Warnings:

  - A unique constraint covering the columns `[weekday]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "status" "ShopStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_weekday_key" ON "Schedule"("weekday");
