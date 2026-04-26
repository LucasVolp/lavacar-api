/*
  Warnings:

  - Added the required column `document` to the `SubscriptionIntent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgName` to the `SubscriptionIntent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionIntent" ADD COLUMN     "document" TEXT NOT NULL,
ADD COLUMN     "orgName" TEXT NOT NULL;
