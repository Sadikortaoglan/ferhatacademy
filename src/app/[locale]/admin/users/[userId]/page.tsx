import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/shared/admin-actions";
import { GrantAccessDialog } from "@/features/admin/components/grant-access-dialog";
import { RevokeAccessButton } from "@/features/admin/components/revoke-access-button";
import { UserStatusActions } from "@/features/admin/components/user-status-actions";
import { RoleManagement } from "@/features/admin/components/role-management";
import { Role } from "@prisma/client";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, userId } = await params;
  const { tab = "overview" } = await searchParams;
  const t = await getTranslations("admin");

  const session = await getSession();
  const actor = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } })
    : null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      entitlements: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { orderBy: { position: "asc" } },
        },
      },
    },
  });
  if (!user) notFound();

  const courses = await prisma.course.findMany({
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  const tabs = ["overview", "access", "assignments"] as const;

  return (
    <div className="space-y-6">
      <PageHeader title={user.name ?? user.email}>
        <ActionLink href={`/${locale}/admin/users`} variant="secondary" icon="back" label={t("users")} />
      </PageHeader>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {tabs.map((t_) => (
          <Link
            key={t_}
            href={`/${locale}/admin/users/${userId}?tab=${t_}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t_
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t_ === "overview" ? "👤  " + t("tabOverview") : t_ === "access" ? "🔑  " + t("tabAccess") : "📋  " + t("tabAssignments")}
          </Link>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Account status banner for banned users */}
          {user.banned && (
            <div className="rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
              <p className="text-sm text-danger-subtle-foreground font-medium">
                {t("accountBanned")}
                {user.banReason && <span className="font-normal"> — {user.banReason}</span>}
              </p>
            </div>
          )}

          {/* Hesap Yetkisi — Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hesap Yetkisi</CardTitle>
            </CardHeader>
            <CardContent>
              {actor ? (
                <RoleManagement
                  targetUserId={user.id}
                  targetUserName={user.name ?? user.email}
                  targetCurrentRole={user.role as Role}
                  actorRole={actor.role as Role}
                  actorId={actor.id}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Yetkilendirme bilgisi alınamadı.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("tabProfile")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("name")}</span>
                  <span>{user.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("email")}</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("role")}</span>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("createdAt")}</span>
                  <span>{user.createdAt.toLocaleDateString(locale)}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-muted-foreground mb-2">{t("userStatus")}</p>
                  <UserStatusActions
                    userId={user.id}
                    isBanned={user.banned}
                    banReason={user.banReason}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("tabSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("activeAccesses")}</span>
                  <span>{user.entitlements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("assignments")}</span>
                  <span>{user.assignments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Access */}
      {tab === "access" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t("activeAccesses")}</h3>
            <GrantAccessDialog
              courses={courses}
              users={[{ id: user.id, name: user.name, email: user.email }]}
              locale={locale}
            />
          </div>
          {user.entitlements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("noActiveAccess")}
            </p>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">{t("colCourse")}</th>
                      <th className="px-4 py-3 text-left font-medium">{t("colSource")}</th>
                      <th className="px-4 py-3 text-left font-medium">{t("colExpires")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.entitlements.map((ent) => {
                      const linkedCourse = courses.find((c) => c.id === ent.resourceId);
                      const courseTitle =
                        linkedCourse?.translations.find((tr) => tr.locale === locale)?.title ??
                        linkedCourse?.translations[0]?.title ??
                        ent.resourceId;
                      return (
                        <tr key={ent.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{courseTitle}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{ent.sourceType}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {ent.expiresAt ? ent.expiresAt.toLocaleDateString(locale) : t("indefinite")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <RevokeAccessButton entitlementId={ent.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Assignments */}
      {tab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t("assignments")}</h3>
            <Link href={`/${locale}/admin/assignments/new?userId=${user.id}`}>
              <Button size="sm">+ {t("createAssignment")}</Button>
            </Link>
          </div>
          {user.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("noAssignments")}
            </p>
          ) : (
            <div className="space-y-3">
              {user.assignments.map((asgn) => (
                <Card key={asgn.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{asgn.title}</p>
                      {asgn.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{asgn.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("itemCount", { count: asgn.items.length })}
                      </p>
                    </div>
                    <Badge variant={asgn.status === "ACTIVE" ? "default" : "secondary"}>
                      {asgn.status}
                    </Badge>
                    <ActionLink href={`/${locale}/admin/assignments/${asgn.id}`} variant="edit" icon="edit" label={t("edit")} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
