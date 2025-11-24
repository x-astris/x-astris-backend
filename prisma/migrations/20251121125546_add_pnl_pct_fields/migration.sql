/*
  Warnings:

  - A unique constraint covering the columns `[projectId,year]` on the table `PnlYear` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PnlYear" ADD COLUMN     "cogsPct" DOUBLE PRECISION,
ADD COLUMN     "opexPct" DOUBLE PRECISION,
ADD COLUMN     "revenueGrowthPct" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "taxRatePct" DOUBLE PRECISION DEFAULT 25;

-- CreateIndex
CREATE UNIQUE INDEX "PnlYear_projectId_year_key" ON "PnlYear"("projectId", "year");
