-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
