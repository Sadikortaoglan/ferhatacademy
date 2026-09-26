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
      steps: { orderBy: { position: "asc" } },
      questions: {
        include: { options: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
      _count: { select: { applications: true } },
      products: {
        select: {
          id: true,
          slug: true,
          translations: { where: { locale }, select: { name: true } },
        },
        take: 20,
      },
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
      {/* Used By section */}
      {template.products.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Kullanıldığı Programlar ({template.products.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {template.products.map((p) => {
              const name = p.translations[0]?.name ?? p.slug;
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/admin/products/${p.id}`}
                  className="rounded-full border border-border bg-background px-3 py-0.5 text-xs font-medium text-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {template.products.length === 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
          Bu şablon henüz hiçbir programa atanmamış.
        </div>
      )}
      <TemplateEditor locale={locale} template={template} />
    </div>
  );
}
