-- CreateEnum
CREATE TYPE "PresentationStyle" AS ENUM ('STANDARD', 'CARDS', 'COMPACT_CARDS');

-- CreateEnum
CREATE TYPE "AdminNotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_REVIEW_STARTED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_REVIEW_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_TEMPLATE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_TEMPLATE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'APPLICATION_NOTIFICATION_CONFIG_UPDATED';

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'BOOLEAN';
ALTER TYPE "QuestionType" ADD VALUE 'CURRENCY_RANGE';
ALTER TYPE "QuestionType" ADD VALUE 'DATE';
ALTER TYPE "QuestionType" ADD VALUE 'TIME_RANGE';

-- AlterTable
ALTER TABLE "application_questions"
  ADD COLUMN "autoAdvance" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "conditionJson" JSONB,
  ADD COLUMN "highlightInAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "presentation" "PresentationStyle" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "stepId" TEXT;

-- AlterTable
ALTER TABLE "applications"
  ADD COLUMN "adminNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "confirmationEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "landingPath" TEXT,
  ADD COLUMN "referrer" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "utmContent" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmTerm" TEXT;

-- CreateTable
CREATE TABLE "application_form_steps" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "titleTr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descTr" TEXT,
    "descEn" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_form_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_form_steps_templateId_stableKey_key" ON "application_form_steps"("templateId", "stableKey");

-- AddForeignKey
ALTER TABLE "application_form_steps" ADD CONSTRAINT "application_form_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "application_form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_questions" ADD CONSTRAINT "application_questions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "application_form_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notification_application_fk" FOREIGN KEY ("entityId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
