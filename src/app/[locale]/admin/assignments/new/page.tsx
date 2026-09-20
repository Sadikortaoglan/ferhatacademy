import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { CreateAssignmentForm } from "@/features/admin/components/create-assignment-form";
import { ActionLink } from "@/components/shared/admin-actions";
import { ClipboardList, Info } from "lucide-react";

export default async function NewAssignmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <ActionLink
            href={`/${locale}/admin/assignments`}
            variant="secondary"
            icon="back"
            label={t("assignments")}
            className="mb-2"
          />
          <h1 className="text-2xl font-black mt-1">{t("createAssignment")}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Bir kullanıcı için kişisel öğrenme programı oluşturun. Dersler ve görevler kaydettikten sonra eklenebilir.
          </p>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2">
            <ClipboardList className="h-3.5 w-3.5" />
            Taslak olarak oluşturulur
          </div>
        </div>
      </div>

      {/* İki kolon layout */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Sol — Form */}
        <CreateAssignmentForm users={users} locale={locale} />

        {/* Sağ — Yardım paneli */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Info className="h-4 w-4 text-primary" />
              Nasıl çalışır?
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Önce kullanıcıyı seç",
                "Başlık ve açıklama gir",
                "Ödevi kaydet",
                "Detay sayfasında dersler ve görevler ekle",
                "Sıralama ve zorunluluk durumlarını belirle",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
            <p className="text-sm font-semibold">Kaydettikten sonra ne olur?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Ödev taslak olarak oluşturulur",
                "Kullanıcının programına atanır",
                "Dersler ve görevler ekleyebilirsin",
                "Kullanıcı aktifleştirince panelinde görünür",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
