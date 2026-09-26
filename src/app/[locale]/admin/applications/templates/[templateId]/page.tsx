import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TemplateEditor } from "./template-editor";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; templateId: string }>;
}) {
  const { locale, templateId } = await params;
  await requireAdmin(locale);

  const template = await prisma.applicationFormTemplate.findUnique({
    where: { id: templateId },
    include: {
      questions: {
        include: {
          options: { orderBy: { position: "asc" } },
        },
        orderBy: { position: "asc" },
      },
      _count: { select: { applications: true } },
    },
  });
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/${locale}/admin/applications/templates`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Şablonlar
        </Link>
        <h1 className="text-xl font-black text-foreground">{template.nameTr}</h1>
        {template.archived && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
            Arşivlendi
          </span>
        )}
      </div>
      <TemplateEditor locale={locale} template={template} />
    </div>
  );
}
