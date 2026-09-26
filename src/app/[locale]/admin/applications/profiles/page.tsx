import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminProfilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const profiles = await prisma.applicationPageProfile.findMany({
    include: {
      _count: { select: { products: true, faqItems: true, processSteps: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const LAYOUT_LABELS: Record<string, string> = {
    SPLIT: "Split (2 Sütun)",
    FORM_FIRST: "Form Önce",
    EDITORIAL: "Editoryal",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Başvuru Sayfa Profilleri</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Her program için başvuru sayfası içeriğini yönetin.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/applications/profiles/new`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Yeni Profil
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div>
              <p className="font-bold text-foreground">{p.headlineTr}</p>
              <p className="text-xs font-mono text-muted-foreground">{p.key}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{LAYOUT_LABELS[p.layout] ?? p.layout}</span>
              <span>·</span>
              <span>{p._count.faqItems} SSS</span>
              <span>·</span>
              <span>{p._count.processSteps} adım</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{p._count.products} ürün bağlı</span>
              <Link
                href={`/${locale}/admin/applications/profiles/${p.id}`}
                className="text-xs text-primary hover:underline"
              >
                Düzenle →
              </Link>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            <p className="text-sm">Henüz profil yok.</p>
            <Link
              href={`/${locale}/admin/applications/profiles/new`}
              className="text-primary hover:underline text-sm"
            >
              İlk profili oluştur →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
