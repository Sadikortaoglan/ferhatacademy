import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { product: { include: { translations: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return "success" as const;
    if (status === "REJECTED") return "danger" as const;
    return "secondary" as const;
  };

  const statusLabel: Record<string, string> = {
    SUBMITTED: locale === "tr" ? "Başvurunuz alındı" : "Submitted",
    UNDER_REVIEW: locale === "tr" ? "İnceleniyor" : "Under Review",
    APPROVED: locale === "tr" ? "Onaylandı" : "Approved",
    REJECTED: locale === "tr" ? "Uygun bulunmadı" : "Rejected",
    WAITLISTED: locale === "tr" ? "Bekleme listesinde" : "Waitlisted",
    CANCELLED: locale === "tr" ? "İptal edildi" : "Cancelled",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{locale === "tr" ? "Başvurularım" : "My Applications"}</h1>
      {applications.length === 0 ? (
        <p className="text-muted-foreground">{locale === "tr" ? "Henüz bir başvurunuz bulunmuyor." : "No applications yet."}</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const t = app.product.translations.find((tr) => tr.locale === locale) ?? app.product.translations[0];
            return (
              <div key={app.id} className="border border-border rounded-xl p-5 bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t?.name}</span>
                  <Badge variant={statusBadge(app.status)}>{statusLabel[app.status] ?? app.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString(locale)}</p>
                {app.status === "APPROVED" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {locale === "tr" ? "Başvurunuz onaylandı. Satın alma işlemine devam edebilirsiniz." : "Application approved. You can now purchase."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
