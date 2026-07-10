/*
  Warnings:

  - You are about to drop the column `stripePaymentIntentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeCustomerId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "stripeCustomerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripeCustomerId";

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeCustomerId_key" ON "payments"("stripeCustomerId");
