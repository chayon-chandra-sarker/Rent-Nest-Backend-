/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments_stripeSessionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripeSessionId";
