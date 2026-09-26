"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  sendApplicationSubmittedToApplicant,
  sendApplicationSubmittedToAdmin,
} from "@/lib/email";

type UtmData = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPath?: string;
  referrer?: string;
};

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

function buildZodSchema(
  questions: {
    key: string;
    type: string;
    required: boolean;
    conditionJson: unknown;
    options: { key: string }[];
  }[],
  visibleKeys: Set<string>
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    const visible = visibleKeys.has(q.key);
    let field: z.ZodTypeAny;
    switch (q.type) {
      case "MULTI_SELECT":
      case "CHECKBOX":
        field = z.array(z.string());
        break;
      case "NUMBER":
        field = z.coerce.number();
        break;
      case "BOOLEAN":
        field = z.enum(["true", "false"]);
        break;
      default:
        field = z.string();
    }
    if (visible && q.required) {
      if (field instanceof z.ZodString) field = field.min(1, "Bu alan zorunludur");
    } else {
      field = field.optional();
    }
    shape[q.key] = field;
  }
  return z.object(shape);
}

type ConditionRule = {
  questionKey: string;
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN";
  value: string;
};

type ConditionJson = { rules: ConditionRule[]; logic?: "AND" | "OR" };

function serverEvalCondition(
  conditionJson: unknown,
  answers: Record<string, unknown>
): boolean {
  if (!conditionJson) return true;
  const cj = conditionJson as ConditionJson;
  if (!cj.rules?.length) return true;
  const eval1 = (r: ConditionRule) => {
    const val = answers[r.questionKey];
    switch (r.operator) {
      case "EQUALS":
        return Array.isArray(val) ? val.includes(r.value) : String(val ?? "") === r.value;
      case "NOT_EQUALS":
        return Array.isArray(val) ? !val.includes(r.value) : String(val ?? "") !== r.value;
      case "CONTAINS":
        return String(val ?? "").toLowerCase().includes(r.value.toLowerCase());
      case "GREATER_THAN":
        return Number(val) > Number(r.value);
      case "LESS_THAN":
        return Number(val) < Number(r.value);
      default:
        return true;
    }
  };
  return cj.logic === "OR" ? cj.rules.some(eval1) : cj.rules.every(eval1);
}

async function createAdminNotifications(
  applicationId: string,
  productId: string,
  applicantName: string,
  productName: string
) {
  // Notify all ADMIN and SUPER_ADMIN users
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, banned: false },
    select: { id: true },
  });
  if (!admins.length) return;

  await prisma.adminNotification.createMany({
    data: admins.map((a) => ({
      recipientUserId: a.id,
      type: "APPLICATION_SUBMITTED" as const,
      title: `Yeni Başvuru — ${productName}`,
      message: `${applicantName} başvurdu`,
      entityType: "Application",
      entityId: applicationId,
    })),
    skipDuplicates: true,
  });
}

export async function submitDynamicApplication(
  productId: string,
  responses: Record<string, unknown>,
  utmData?: UtmData
): Promise<{ ok: boolean; applicationId?: string; existingStatus?: string }> {
  const sessionUser = await getSessionUser();

  // Check for existing active application
  const existing = await prisma.application.findUnique({
    where: { userId_productId: { userId: sessionUser.id, productId } },
  });
  if (existing && !["REJECTED", "CANCELLED"].includes(existing.status)) {
    return { ok: false, existingStatus: existing.status };
  }

  // Load product with template (including steps)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      translations: { take: 2 },
      formTemplate: {
        include: {
          steps: {
            where: { active: true },
            orderBy: { position: "asc" },
          },
          questions: {
            where: { active: true },
            include: {
              options: { where: { active: true }, orderBy: { position: "asc" } },
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!product) throw new Error("Product not found");

  const productTranslation =
    (product.translations as { locale: string; name: string }[]).find((t) => t.locale === "tr") ??
    (product.translations as { locale: string; name: string }[])[0];
  const productName = productTranslation?.name ?? product.slug;

  if (product.formTemplate) {
    const template = product.formTemplate;

    // Server-side visibility check (mirrors client logic)
    const visibleKeys = new Set(
      template.questions
        .filter((q) => serverEvalCondition(q.conditionJson, responses))
        .map((q) => q.key)
    );

    // Only validate questions that were visible to the user
    const visibleQuestions = template.questions.filter((q) => visibleKeys.has(q.key));
    const schema = buildZodSchema(visibleQuestions, visibleKeys);
    const parsed = schema.parse(
      Object.fromEntries(Object.entries(responses).filter(([k]) => visibleKeys.has(k)))
    );

    // Build snapshot preserving labels and option labels at submission time
    const snapshotJson = template.questions.map((q) => {
      const ans = (parsed as Record<string, unknown>)[q.key];
      let optionLabels: unknown;
      if (["SINGLE_SELECT", "RADIO", "CURRENCY_RANGE"].includes(q.type) && typeof ans === "string") {
        const opt = q.options.find((o) => o.key === ans);
        if (opt) optionLabels = { tr: opt.labelTr, en: opt.labelEn };
      } else if (["MULTI_SELECT", "CHECKBOX"].includes(q.type) && Array.isArray(ans)) {
        optionLabels = (ans as string[]).map((k) => {
          const opt = q.options.find((o) => o.key === k);
          return opt ? { key: k, tr: opt.labelTr, en: opt.labelEn } : { key: k };
        });
      }
      return {
        key: q.key,
        stepId: q.stepId,
        labelTr: q.labelTr,
        labelEn: q.labelEn,
        type: q.type,
        section: q.section,
        visible: visibleKeys.has(q.key),
        answer: visibleKeys.has(q.key) ? ans : null,
        optionLabels,
      };
    });

    const app = await prisma.application.create({
      data: {
        userId: sessionUser.id,
        productId,
        templateId: template.id,
        // UTM attribution
        utmSource: utmData?.utmSource,
        utmMedium: utmData?.utmMedium,
        utmCampaign: utmData?.utmCampaign,
        utmContent: utmData?.utmContent,
        utmTerm: utmData?.utmTerm,
        landingPath: utmData?.landingPath,
        referrer: utmData?.referrer,
        response: {
          create: {
            templateId: template.id,
            templateVersion: template.version,
            responsesJson: parsed as object,
            snapshotJson: snapshotJson as object,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "APPLICATION_SUBMITTED",
        actorId: sessionUser.id,
        targetType: "Application",
        targetId: app.id,
        metadata: { productId, productName },
      },
    });

    revalidatePath("/[locale]/dashboard/applications", "page");
    revalidatePath("/[locale]/admin/applications", "page");

    // Admin in-app notifications
    const applicantName = sessionUser.name ?? sessionUser.email;
    void createAdminNotifications(app.id, productId, applicantName, productName).catch(() => {});

    // Idempotent emails — only send once per application
    void (async () => {
      try {
        await sendApplicationSubmittedToApplicant({
          to: sessionUser.email,
          name: applicantName,
          productName,
          applicationId: app.id,
        });
        await prisma.application.update({
          where: { id: app.id },
          data: { confirmationEmailSentAt: new Date() },
        });
      } catch {}
    })();

    void (async () => {
      try {
        await sendApplicationSubmittedToAdmin({
          applicantName,
          applicantEmail: sessionUser.email,
          productName,
          applicationId: app.id,
        });
        await prisma.application.update({
          where: { id: app.id },
          data: { adminNotifiedAt: new Date() },
        });
      } catch {}
    })();

    return { ok: true, applicationId: app.id };
  } else {
    // No template — fall back to legacy flat fields
    const legacySchema = z.object({
      phone: z.string().optional(),
      goal: z.string().min(1, "Hedef zorunludur"),
      whyInterested: z.string().min(1, "Bu alan zorunludur"),
      mainChallenge: z.string().optional(),
      optionalNote: z.string().optional(),
      currentSituation: z.string().optional(),
    });
    const parsed = legacySchema.parse({
      goal: responses.main_goal ?? responses.goal ?? "",
      whyInterested: responses.why_interested ?? responses.why_join ?? responses.whyInterested ?? "",
      phone: responses.phone ?? "",
      mainChallenge: responses.main_challenge ?? responses.current_challenge ?? "",
      optionalNote: responses.optional_note ?? "",
      currentSituation: responses.current_situation ?? "",
    });

    const app = await prisma.application.create({
      data: {
        userId: sessionUser.id,
        productId,
        utmSource: utmData?.utmSource,
        utmMedium: utmData?.utmMedium,
        utmCampaign: utmData?.utmCampaign,
        landingPath: utmData?.landingPath,
        referrer: utmData?.referrer,
        ...parsed,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "APPLICATION_SUBMITTED",
        actorId: sessionUser.id,
        targetType: "Application",
        targetId: app.id,
        metadata: { productId, productName },
      },
    });

    revalidatePath("/[locale]/dashboard/applications", "page");
    revalidatePath("/[locale]/admin/applications", "page");

    const applicantName = sessionUser.name ?? sessionUser.email;
    void createAdminNotifications(app.id, productId, applicantName, productName).catch(() => {});
    void sendApplicationSubmittedToApplicant({
      to: sessionUser.email,
      name: applicantName,
      productName,
      applicationId: app.id,
    }).catch(() => {});
    void sendApplicationSubmittedToAdmin({
      applicantName,
      applicantEmail: sessionUser.email,
      productName,
      applicationId: app.id,
    }).catch(() => {});

    return { ok: true, applicationId: app.id };
  }
}

export async function getApplicationPageData(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      translations: true,
      inclusions: { orderBy: { position: "asc" } },
      formTemplate: {
        include: {
          steps: {
            where: { active: true },
            orderBy: { position: "asc" },
          },
          questions: {
            where: { active: true },
            include: {
              options: { where: { active: true }, orderBy: { position: "asc" } },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      pageProfile: {
        include: {
          blocks: { where: { enabled: true }, orderBy: { position: "asc" } },
          faqItems: { where: { enabled: true }, orderBy: { position: "asc" } },
          processSteps: { orderBy: { position: "asc" } },
        },
      },
    },
  });
}
