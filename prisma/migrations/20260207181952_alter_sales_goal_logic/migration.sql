/*
  Warnings:

  - A unique constraint covering the columns `[shopId,period,startDate]` on the table `SalesGoal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "GoalPeriod" ADD VALUE 'CUSTOM';

-- CreateIndex
CREATE UNIQUE INDEX "SalesGoal_shopId_period_startDate_key" ON "SalesGoal"("shopId", "period", "startDate");
