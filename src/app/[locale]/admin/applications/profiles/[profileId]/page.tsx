import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileEditor } from "./profile-editor";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ locale: string; profileId: string }>;
}) {
  const { locale, profileId } = await params;
  await requireAdmin(locale);

  const profile = await prisma.applicationPageProfile.findUnique({
    where: { id: profileId },
    include: {
      faqItems: { orderBy: { position: "asc" } },
      processSteps: { orderBy: { position: "asc" } },
      products: {
        include: {
          translations: true,
          formTemplate: { select: { id: true, nameTr: true, _count: { select: { steps: true, questions: true } } } },
        },
        take: 20,
      },
    },
  });
  if (!profile) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/applications/profiles`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Profiller
        </Link>
        <h1 className="text-xl font-black text-foreground">{profile.headlineTr}</h1>
      </div>
      {/* Products using this profile */}
      {profile.products.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bu Profili Kullanan Programlar ({profile.products.length})
          </p>
          <div className="space-y-2">
            {profile.products.map((p) => {
              const name = p.translations.find((t) => t.locale === locale)?.name ?? p.translations[0]?.name ?? p.slug;
              return (
                <div key={p.id} className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <Link
                    href={`/${locale}/admin/products/${p.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {name}
                  </Link>
                  {p.formTemplate ? (
                    <span className="text-xs text-muted-foreground">
                      Form: <span className="text-foreground font-medium">{p.formTemplate.nameTr}</span>
                      {" · "}{p.formTemplate._count.steps} adım · {p.formTemplate._count.questions} soru
                    </span>
                  ) : (
                    <span className="text-xs text-warning">Form şablonu atanmamış</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ProfileEditor locale={locale} profile={profile} />
    </div>
  );
}
