-- CreateEnum
CREATE TYPE "PricePresentation" AS ENUM ('FIXED', 'HIDDEN', 'FROM', 'FREE');

-- CreateEnum
CREATE TYPE "CtaFlow" AS ENUM ('INFO_ONLY', 'APPLICATION', 'DIRECT_PURCHASE', 'APPLICATION_THEN_PURCHASE', 'FREE_ENROLLMENT');

-- AlterTable
ALTER TABLE "products"
  ADD COLUMN "pricePresentation" "PricePresentation" NOT NULL DEFAULT 'FIXED',
  ADD COLUMN "ctaFlow"           "CtaFlow"           NOT NULL DEFAULT 'DIRECT_PURCHASE',
  ADD COLUMN "primaryCtaLabelTr"   TEXT,
  ADD COLUMN "primaryCtaLabelEn"   TEXT,
  ADD COLUMN "secondaryCtaLabelTr" TEXT,
  ADD COLUMN "secondaryCtaLabelEn" TEXT;
