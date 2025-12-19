/*
  Warnings:

  - A unique constraint covering the columns `[projectId,year]` on the table `BalanceYear` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BalanceYear_projectId_year_key" ON "BalanceYear"("projectId", "year");
