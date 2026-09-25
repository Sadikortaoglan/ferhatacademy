"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    options: { key: string }[];
  }[]
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    let field: z.ZodTypeAny;
    switch (q.type) {
      case "MULTI_SELECT":
      case "CHECKBOX":
        field = z.array(z.string());
        break;
      case "NUMBER":
        field = z.coerce.number();
        break;
      default:
        field = z.string();
    }
    if (q.required) {
      if (field instanceof z.ZodString) field = field.min(1, "Bu alan zorunludur");
    } else {
      field = field.optional();
    }
    shape[q.key] = field;
  }
  return z.object(shape);
}

export async function submitDynamicApplication(
  productId: string,
  responses: Record<string, unknown>
): Promise<{ ok: boolean; applicationId?: string; existingStatus?: string }> {
  const sessionUser = await getSessionUser();

  // Check for existing active application
  const existing = await prisma.application.findUnique({
    where: { userId_productId: { userId: sessionUser.id, productId } },
  });
  if (existing && !["REJECTED", "CANCELLED"].includes(existing.status)) {
    return { ok: false, existingStatus: existing.status };
  }

  // Load product with template
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      formTemplate: {
        include: {
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

  if (product.formTemplate) {
    const template = product.formTemplate;
    const schema = buildZodSchema(template.questions);
    const parsed = schema.parse(responses);

    // Build snapshot for historical safety
    const snapshotJson = template.questions.map((q) => {
      const ans = (parsed as Record<string, unknown>)[q.key];
      let optionLabels: unknown;
      if (["SINGLE_SELECT", "RADIO"].includes(q.type) && typeof ans === "string") {
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
        labelTr: q.labelTr,
        labelEn: q.labelEn,
        type: q.type,
        section: q.section,
        answer: ans,
        optionLabels,
      };
    });

    const app = await prisma.application.create({
      data: {
        userId: sessionUser.id,
        productId,
        templateId: template.id,
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

    revalidatePath("/[locale]/dashboard/applications", "page");
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
      data: { userId: sessionUser.id, productId, ...parsed },
    });
    revalidatePath("/[locale]/dashboard/applications", "page");
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
