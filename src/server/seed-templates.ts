import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/application-templates";

export async function seedDefaultTemplates() {
  for (const def of DEFAULT_TEMPLATES) {
    const existing = await prisma.applicationFormTemplate.findUnique({ where: { key: def.key } });
    if (existing) continue;

    await prisma.applicationFormTemplate.create({
      data: {
        key: def.key,
        type: def.type,
        nameTr: def.nameTr,
        nameEn: def.nameEn,
        questions: {
          create: def.questions.map((q) => ({
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
            position: q.position,
            options: q.options
              ? {
                  create: q.options.map((o) => ({
                    key: o.key,
                    labelTr: o.labelTr,
                    labelEn: o.labelEn,
                    position: o.position,
                  })),
                }
              : undefined,
          })),
        },
      },
    });
  }
}
