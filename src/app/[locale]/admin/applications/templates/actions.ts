"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth";
import { z } from "zod";

const templateSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/, "Yalnızca küçük harf, rakam ve alt çizgi kullanın"),
  type: z.enum(["MENTORSHIP", "LIVE_TRAINING", "CONSULTATION", "COHORT_PREMIUM_PROGRAM", "GENERAL_CUSTOM"]),
  nameTr: z.string().min(1),
  nameEn: z.string().min(1),
});

const stepSchema = z.object({
  stableKey: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
  titleTr: z.string().min(1),
  titleEn: z.string().min(1),
  descTr: z.string().optional(),
  descEn: z.string().optional(),
  active: z.boolean().default(true),
  position: z.number().int().default(0),
});

const conditionRuleSchema = z.object({
  questionKey: z.string(),
  operator: z.enum(["EQUALS", "NOT_EQUALS", "CONTAINS", "GREATER_THAN", "LESS_THAN"]),
  value: z.string(),
});

const conditionSchema = z.object({
  rules: z.array(conditionRuleSchema),
  logic: z.enum(["AND", "OR"]).default("AND"),
}).nullable();

const questionSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "PHONE", "EMAIL", "NUMBER", "SINGLE_SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX", "BOOLEAN", "CURRENCY_RANGE", "DATE", "TIME_RANGE"]),
  section: z.enum(["BASIC_INFO", "CURRENT_SITUATION", "GOALS", "CHALLENGES", "PROGRAM_FIT", "AVAILABILITY", "ADDITIONAL_INFO"]),
  stepId: z.string().nullable().optional(),
  labelTr: z.string().min(1),
  labelEn: z.string().min(1),
  helperTr: z.string().optional(),
  helperEn: z.string().optional(),
  placeholderTr: z.string().optional(),
  placeholderEn: z.string().optional(),
  required: z.boolean().default(false),
  active: z.boolean().default(true),
  position: z.number().int().default(0),
  presentation: z.enum(["STANDARD", "CARDS", "COMPACT_CARDS"]).default("STANDARD"),
  autoAdvance: z.boolean().default(false),
  highlightInAdmin: z.boolean().default(false),
  conditionJson: conditionSchema.optional(),
});

const optionSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
  labelTr: z.string().min(1),
  labelEn: z.string().min(1),
  position: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function createTemplate(locale: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = templateSchema.parse(data);
  const existing = await prisma.applicationFormTemplate.findUnique({ where: { key: parsed.key } });
  if (existing) throw new Error("Bu key zaten kullanılıyor");
  const template = await prisma.applicationFormTemplate.create({ data: parsed });
  revalidatePath(`/${locale}/admin/applications/templates`);
  return template;
}

export async function updateTemplate(locale: string, id: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = templateSchema.partial().parse(data);
  const template = await prisma.applicationFormTemplate.update({ where: { id }, data: parsed });
  revalidatePath(`/${locale}/admin/applications/templates`);
  return template;
}

export async function archiveTemplate(locale: string, id: string) {
  await requireAdmin(locale);
  await prisma.applicationFormTemplate.update({ where: { id }, data: { archived: true } });
  revalidatePath(`/${locale}/admin/applications/templates`);
  return { ok: true };
}

export async function duplicateTemplate(locale: string, id: string) {
  await requireAdmin(locale);
  const source = await prisma.applicationFormTemplate.findUnique({
    where: { id },
    include: { questions: { include: { options: true }, orderBy: { position: "asc" } } },
  });
  if (!source) throw new Error("Template not found");
  const newKey = `${source.key}_copy_${Date.now()}`.slice(0, 60);
  const newTemplate = await prisma.applicationFormTemplate.create({
    data: {
      key: newKey,
      type: source.type,
      nameTr: `${source.nameTr} (Kopya)`,
      nameEn: `${source.nameEn} (Copy)`,
      questions: {
        create: source.questions.map((q) => ({
          key: q.key,
          type: q.type,
          section: q.section,
          labelTr: q.labelTr,
          labelEn: q.labelEn,
          helperTr: q.helperTr,
          helperEn: q.helperEn,
          placeholderTr: q.placeholderTr,
          placeholderEn: q.placeholderEn,
          required: q.required,
          active: q.active,
          position: q.position,
          options: {
            create: q.options.map((o) => ({
              key: o.key,
              labelTr: o.labelTr,
              labelEn: o.labelEn,
              position: o.position,
              active: o.active,
            })),
          },
        })),
      },
    },
  });
  revalidatePath(`/${locale}/admin/applications/templates`);
  return newTemplate;
}

export async function addQuestion(locale: string, templateId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = questionSchema.parse(data);
  const maxPos = await prisma.applicationQuestion.aggregate({
    where: { templateId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;
  const { conditionJson, stepId, ...rest } = parsed;
  const question = await prisma.applicationQuestion.create({
    data: {
      ...rest,
      position,
      templateId,
      stepId: stepId ?? null,
      conditionJson: conditionJson === null ? Prisma.DbNull : (conditionJson as object | undefined),
    },
    include: { options: true },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return question;
}

export async function updateQuestion(locale: string, templateId: string, questionId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = questionSchema.partial().parse(data);
  const { conditionJson, stepId, ...rest } = parsed;
  const updateData: Record<string, unknown> = { ...rest };
  if (stepId !== undefined) updateData.stepId = stepId;
  if (conditionJson !== undefined) {
    updateData.conditionJson = conditionJson === null ? Prisma.DbNull : (conditionJson as object);
  }
  const q = await prisma.applicationQuestion.update({
    where: { id: questionId },
    data: updateData,
    include: { options: { orderBy: { position: "asc" } } },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return q;
}

export async function deleteQuestion(locale: string, templateId: string, questionId: string) {
  await requireAdmin(locale);
  const q = await prisma.applicationQuestion.findUnique({ where: { id: questionId } });
  if (!q) throw new Error("Question not found");
  await prisma.applicationQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}

export async function reorderQuestions(locale: string, templateId: string, orderedIds: string[]) {
  await requireAdmin(locale);
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.applicationQuestion.update({ where: { id }, data: { position: idx } })
    )
  );
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}

export async function addOption(locale: string, questionId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = optionSchema.parse(data);
  const q = await prisma.applicationQuestion.findUnique({ where: { id: questionId }, select: { templateId: true } });
  if (!q) throw new Error("Question not found");
  const option = await prisma.applicationQuestionOption.create({
    data: { ...parsed, questionId },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${q.templateId}`);
  return option;
}

export async function updateOption(locale: string, optionId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = optionSchema.partial().parse(data);
  const option = await prisma.applicationQuestionOption.update({
    where: { id: optionId },
    data: parsed,
  });
  return option;
}

export async function deleteOption(locale: string, optionId: string) {
  await requireAdmin(locale);
  await prisma.applicationQuestionOption.delete({ where: { id: optionId } });
  return { ok: true };
}

export async function reorderOptions(locale: string, questionId: string, orderedIds: string[]) {
  await requireAdmin(locale);
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.applicationQuestionOption.update({ where: { id }, data: { position: idx } })
    )
  );
  return { ok: true };
}

export async function addStep(locale: string, templateId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = stepSchema.parse(data);
  const maxPos = await prisma.applicationFormStep.aggregate({
    where: { templateId },
    _max: { position: true },
  });
  const position = parsed.position ?? (maxPos._max.position ?? -1) + 1;
  const step = await prisma.applicationFormStep.create({
    data: { ...parsed, position, templateId },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return step;
}

export async function updateStep(locale: string, templateId: string, stepId: string, data: unknown) {
  await requireAdmin(locale);
  const parsed = stepSchema.partial().parse(data);
  const step = await prisma.applicationFormStep.update({
    where: { id: stepId },
    data: parsed,
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return step;
}

export async function deleteStep(locale: string, templateId: string, stepId: string) {
  await requireAdmin(locale);
  // Unlink questions from step before deleting
  await prisma.applicationQuestion.updateMany({
    where: { stepId },
    data: { stepId: null },
  });
  await prisma.applicationFormStep.delete({ where: { id: stepId } });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}

export async function reorderSteps(locale: string, templateId: string, orderedIds: string[]) {
  await requireAdmin(locale);
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.applicationFormStep.update({ where: { id }, data: { position: idx } })
    )
  );
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}

export async function updateQuestionCondition(
  locale: string,
  templateId: string,
  questionId: string,
  conditionJson: unknown
) {
  await requireAdmin(locale);
  const parsed = conditionSchema.parse(conditionJson);
  await prisma.applicationQuestion.update({
    where: { id: questionId },
    data: { conditionJson: parsed === null ? Prisma.DbNull : (parsed as object) },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}

export async function assignQuestionToStep(
  locale: string,
  templateId: string,
  questionId: string,
  stepId: string | null
) {
  await requireAdmin(locale);
  await prisma.applicationQuestion.update({
    where: { id: questionId },
    data: { stepId },
  });
  revalidatePath(`/${locale}/admin/applications/templates/${templateId}`);
  return { ok: true };
}
