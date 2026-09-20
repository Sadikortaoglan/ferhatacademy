import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/shared/status-badge";
import { ActionLink } from "@/components/shared/admin-actions";
import { Users, BookOpen, ShieldCheck, ClipboardList, Plus, Search } from "lucide-react";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  const now = new Date();

  const [userCount, publishedCourseCount, activeEntitlements, activeAssignments, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.entitlement.count({
        where: {
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.assignment.count({ where: { status: "ACTIVE" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

  const stats = [
    { label: t("totalUsers"), value: userCount, icon: Users, href: `/${locale}/admin/users` },
    { label: t("publishedCourses"), value: publishedCourseCount, icon: BookOpen, href: `/${locale}/admin/courses` },
    { label: t("activeEntitlements"), value: activeEntitlements, icon: ShieldCheck, href: `/${locale}/admin/access` },
    { label: t("activeAssignments"), value: activeAssignments, icon: ClipboardList, href: `/${locale}/admin/assignments` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`/${locale}/admin/courses/new`}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("createCourse")}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/users`}>
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4" />
              {t("findUser")}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/access`}>
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ShieldCheck className="h-4 w-4" />
              {t("grantAccess")}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/assignments/new`}>
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="h-4 w-4" />
              {t("createAssignment")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recentRegistrations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                    {user.name && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <RoleBadge role={user.role} />
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {user.createdAt.toLocaleDateString(locale)}
                    </span>
                    <ActionLink href={`/${locale}/admin/users/${user.id}`} variant="view" icon="view" label={t("viewDetail")} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
