-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'PHONE', 'EMAIL', 'NUMBER', 'SINGLE_SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX');

-- CreateEnum
CREATE TYPE "QuestionSection" AS ENUM ('BASIC_INFO', 'CURRENT_SITUATION', 'GOALS', 'CHALLENGES', 'PROGRAM_FIT', 'AVAILABILITY', 'ADDITIONAL_INFO');

-- CreateEnum
CREATE TYPE "ApplicationLayout" AS ENUM ('SPLIT', 'FORM_FIRST', 'EDITORIAL');

-- CreateEnum
CREATE TYPE "ApplicationBlockType" AS ENUM ('PROGRAM_VISUAL', 'MOTIVATION', 'TARGET_AUDIENCE', 'NOT_FOR_YOU', 'BENEFITS', 'INCLUSIONS', 'PROCESS', 'FAQ', 'REASSURANCE', 'OPTIONAL_INSTRUCTOR');

-- CreateEnum
CREATE TYPE "FormTemplateType" AS ENUM ('MENTORSHIP', 'LIVE_TRAINING', 'CONSULTATION', 'COHORT_PREMIUM_PROGRAM', 'GENERAL_CUSTOM');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "templateId" TEXT;

-- AlterTable (page_appearance_overrides created in later migration; this line is intentionally omitted)
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "formTemplateId" TEXT,
ADD COLUMN     "pageProfileId" TEXT;

-- CreateTable
CREATE TABLE "application_form_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "FormTemplateType" NOT NULL DEFAULT 'GENERAL_CUSTOM',
    "nameTr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_questions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "section" "QuestionSection" NOT NULL DEFAULT 'ADDITIONAL_INFO',
    "labelTr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "helperTr" TEXT,
    "helperEn" TEXT,
    "placeholderTr" TEXT,
    "placeholderEn" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelTr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_page_profiles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "headlineTr" TEXT NOT NULL,
    "headlineEn" TEXT NOT NULL,
    "subtitleTr" TEXT,
    "subtitleEn" TEXT,
    "programVisualUrl" TEXT,
    "motivationTr" TEXT,
    "motivationEn" TEXT,
    "ctaLabelTr" TEXT NOT NULL DEFAULT 'Başvur',
    "ctaLabelEn" TEXT NOT NULL DEFAULT 'Apply',
    "layout" "ApplicationLayout" NOT NULL DEFAULT 'SPLIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_page_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_page_blocks" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ApplicationBlockType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_page_faq_items" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionTr" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "answerTr" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_page_faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_page_process_steps" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "titleTr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descTr" TEXT,
    "descEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_page_process_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_responses" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT,
    "templateVersion" INTEGER,
    "responsesJson" JSONB NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_form_templates_key_key" ON "application_form_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "application_questions_templateId_key_key" ON "application_questions"("templateId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "application_question_options_questionId_key_key" ON "application_question_options"("questionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "application_page_profiles_key_key" ON "application_page_profiles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "application_responses_applicationId_key" ON "application_responses"("applicationId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "application_form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_pageProfileId_fkey" FOREIGN KEY ("pageProfileId") REFERENCES "application_page_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "application_form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_questions" ADD CONSTRAINT "application_questions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "application_form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_question_options" ADD CONSTRAINT "application_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "application_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_page_blocks" ADD CONSTRAINT "application_page_blocks_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "application_page_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_page_faq_items" ADD CONSTRAINT "application_page_faq_items_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "application_page_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_page_process_steps" ADD CONSTRAINT "application_page_process_steps_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "application_page_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_responses" ADD CONSTRAINT "application_responses_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
