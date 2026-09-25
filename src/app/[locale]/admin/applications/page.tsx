import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusButtons } from "@/features/commerce/components/application-status-buttons";

export default async function AdminApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const applications = await prisma.application.findMany({
    include: {
      user: { select: { name: true, email: true } },
      product: { include: { translations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return "success" as const;
    if (status === "REJECTED") return "danger" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Başvurular</h1>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold">Ürün</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((app) => {
              const productTr = app.product.translations.find((t) => t.locale === locale) ?? app.product.translations[0];
              return (
                <tr key={app.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{app.user.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{app.user.email}</div>
                  </td>
                  <td className="px-4 py-3">{productTr?.name ?? app.product.id}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ApplicationStatusButtons appId={app.id} currentStatus={app.status} />
                      <Link
                        href={`/${locale}/admin/applications/${app.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Detay
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Henüz başvuru yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
