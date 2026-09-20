import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GrantAccessDialog } from "@/features/admin/components/grant-access-dialog";
import { RevokeAccessButton } from "@/features/admin/components/revoke-access-button";

export default async function AdminAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const now = new Date();

  const [entitlements, courses, users] = await Promise.all([
    prisma.entitlement.findMany({
      include: {
        user: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
        course: { include: { translations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: { translations: true },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("access")}>
        <GrantAccessDialog courses={courses} users={users} locale={locale} />
      </PageHeader>

      {entitlements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t("noEntitlements")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("resource")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("source")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("expiresAt")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("courseStatus")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entitlements.map((e) => {
                  const isRevoked = !!e.revokedAt;
                  const isExpired = e.expiresAt ? e.expiresAt < now : false;
                  const courseTitle =
                    e.course?.translations.find((tr) => tr.locale === locale)?.title ??
                    e.course?.translations[0]?.title ??
                    e.resourceId;
                  return (
                    <tr key={e.id} className={`hover:bg-muted/40 transition-colors ${isRevoked || isExpired ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{e.user.name ?? e.user.email}</p>
                          {e.user.name && <p className="text-xs text-muted-foreground">{e.user.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <Badge variant="outline" className="text-xs mb-1">{e.resourceType}</Badge>
                          <p className="text-sm truncate max-w-40">{courseTitle}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.sourceType}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {e.expiresAt ? e.expiresAt.toLocaleDateString(locale) : t("noExpiry")}
                      </td>
                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <Badge variant="danger">{t("revoked")}</Badge>
                        ) : isExpired ? (
                          <Badge variant="outline">Expired</Badge>
                        ) : (
                          <Badge variant="success">{t("active")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isRevoked && !isExpired && (
                          <RevokeAccessButton entitlementId={e.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
