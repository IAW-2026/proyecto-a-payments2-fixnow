-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('wallet', 'cash');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('pending', 'available', 'settled', 'blocked');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'wallet',
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'pending';
