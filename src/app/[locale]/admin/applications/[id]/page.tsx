import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusButtons } from "@/features/commerce/components/application-status-buttons";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdmin(locale);

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true,
      product: { include: { translations: true } },
    },
  });

  if (!app) {
    return <div className="p-8 text-muted-foreground">Başvuru bulunamadı.</div>;
  }

  // Try to load structured response snapshot (added by future migration)
  let responseSnap: Array<{
    section: string;
    labelTr: string;
    answer: unknown;
  }> = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = await (prisma as any).applicationResponse?.findUnique?.({
      where: { applicationId: id },
    });
    if (resp?.snapshotJson && Array.isArray(resp.snapshotJson)) {
      responseSnap = resp.snapshotJson as typeof responseSnap;
    }
  } catch {
    // model doesn't exist yet
  }

  // Legacy flat-field answers as fallback
  const legacyAnswers = [
    { label: "Hedef", value: app.goal },
    { label: "Neden ilgili", value: app.whyInterested },
    { label: "Mevcut durum", value: (app as { currentSituation?: string | null }).currentSituation },
    { label: "Ana zorluk", value: app.mainChallenge },
    { label: "Ek not", value: app.optionalNote },
    { label: "Telefon", value: app.phone },
    { label: "Tercih edilen dil", value: app.preferredLanguage },
  ].filter((a): a is { label: string; value: string } => typeof a.value === "string" && a.value.length > 0);

  const translation =
    app.product.translations.find((t) => t.locale === locale) ?? app.product.translations[0];

  const statusBadge = (s: string) =>
    s === "APPROVED" ? ("success" as const) : s === "REJECTED" ? ("danger" as const) : ("secondary" as const);

  // Group snapshot by section
  const snapBySec = responseSnap.reduce<Record<string, typeof responseSnap>>(
    (acc, item) => {
      const sec = item.section ?? "ADDITIONAL_INFO";
      (acc[sec] ??= []).push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/applications`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Geri
        </Link>
        <h1 className="text-xl font-black text-foreground">Başvuru Detayı</h1>
      </div>

      {/* Applicant / program summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground mb-1">Başvuran</p>
          <p className="font-bold text-foreground">{app.user.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{app.user.email}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground mb-1">Program</p>
          <p className="font-bold text-foreground">{translation?.name ?? app.productId}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(app.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Durum:</span>
          <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
        </div>
        <ApplicationStatusButtons appId={app.id} currentStatus={app.status} />
      </div>

      {/* Snapshot answers (structured, from future migration) */}
      {responseSnap.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Cevaplar</h2>
          {Object.entries(snapBySec).map(([section, items]) => (
            <div key={section} className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2 bg-muted border-b border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {section.replace(/_/g, " ")}
                </p>
              </div>
              <div className="divide-y divide-border">
                {items.map((item, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground">{item.labelTr}</p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                      {Array.isArray(item.answer)
                        ? (item.answer as string[]).join(", ")
                        : String(item.answer ?? "—")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : legacyAnswers.length > 0 ? (
        /* Legacy flat-field answers */
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              CEVAPLAR
            </p>
          </div>
          <div className="divide-y divide-border">
            {legacyAnswers.map((a, i) => (
              <div key={i} className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">{a.label}</p>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{a.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Bu başvuruya ait cevap bulunamadı.</p>
      )}

      {/* Admin note */}
      {app.internalAdminNote && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-bold text-muted-foreground mb-1">Admin Notu</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{app.internalAdminNote}</p>
        </div>
      )}
    </div>
  );
}
