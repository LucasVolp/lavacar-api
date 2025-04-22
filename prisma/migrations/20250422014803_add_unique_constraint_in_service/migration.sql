/*
  Warnings:

  - A unique constraint covering the columns `[name,shopId]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Service_name_shopId_key" ON "Service"("name", "shopId");
