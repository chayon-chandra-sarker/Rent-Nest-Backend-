/*
  Warnings:

  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `price` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `amenities` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "paidAt" DROP NOT NULL,
ALTER COLUMN "paidAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "amenities",
ADD COLUMN     "amenities" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT;
