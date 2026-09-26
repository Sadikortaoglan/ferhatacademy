import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TemplateListActions } from "./template-list-actions";

const TYPE_LABELS: Record<string, string> = {
  MENTORSHIP: "Mentörlük",
  LIVE_TRAINING: "Canlı Eğitim",
  CONSULTATION: "Danışmanlık",
  COHORT_PREMIUM_PROGRAM: "Premium Program",
  GENERAL_CUSTOM: "Genel",
};

export default async function AdminTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const templates = await prisma.applicationFormTemplate.findMany({
    include: {
      _count: { select: { questions: true, applications: true, steps: true } },
      products: {
        select: {
          id: true,
          slug: true,
          translations: { where: { locale }, select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Form Şablonları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Başvuru formlarını buradan yönetin. Bir şablon birden fazla programa atanabilir.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/applications/templates/new`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          + Yeni Şablon
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Şablon</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Tür</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Adımlar</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Sorular</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Başvurular</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Kullanıldığı Yerler</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Durum</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {templates.map((t) => {
              const usedByNames = t.products.map(
                (p) => p.translations[0]?.name ?? p.slug
              );
              return (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{t.nameTr}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.key}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TYPE_LABELS[t.type] ?? t.type}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {t._count.steps}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {t._count.questions}
                  </td>
                  <td className="px-4 py-3 text-center">{t._count.applications}</td>
                  <td className="px-4 py-3">
                    {usedByNames.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          {usedByNames.length} program
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {usedByNames.join(", ")}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.archived ? "danger" : "success"}>
                      {t.archived ? "Arşivlendi" : "Aktif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/${locale}/admin/applications/templates/${t.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Düzenle
                      </Link>
                      <TemplateListActions
                        locale={locale}
                        templateId={t.id}
                        archived={t.archived}
                        usedByCount={t.products.length}
                        applicationCount={t._count.applications}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {templates.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz şablon yok.{" "}
                  <Link
                    href={`/${locale}/admin/applications/templates/new`}
                    className="text-primary hover:underline"
                  >
                    İlk şablonu oluştur
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
