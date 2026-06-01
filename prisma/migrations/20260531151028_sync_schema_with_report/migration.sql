/*
  Warnings:

  - You are about to drop the column `notes` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `settledAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `settlementStatus` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "notes",
DROP COLUMN "paymentMethod",
DROP COLUMN "settledAt",
DROP COLUMN "settlementStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "SettlementStatus";
