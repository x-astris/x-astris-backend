-- DropForeignKey
ALTER TABLE "BalanceYear" DROP CONSTRAINT "BalanceYear_projectId_fkey";

-- DropForeignKey
ALTER TABLE "PnlYear" DROP CONSTRAINT "PnlYear_projectId_fkey";

-- AddForeignKey
ALTER TABLE "PnlYear" ADD CONSTRAINT "PnlYear_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceYear" ADD CONSTRAINT "BalanceYear_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
