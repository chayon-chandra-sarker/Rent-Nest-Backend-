/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripeCustomerId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
