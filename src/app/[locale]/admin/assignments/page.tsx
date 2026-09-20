import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ActionLink } from "@/components/shared/admin-actions";
import { Plus, ClipboardList } from "lucide-react";

export default async function AdminAssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  const assignments = await prisma.assignment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("assignments")}>
        <Link href={`/${locale}/admin/assignments/new`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createAssignment")}
          </Button>
        </Link>
      </PageHeader>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("noAssignmentsGlobal")}</p>
            <Link href={`/${locale}/admin/assignments/new`} className="mt-4">
              <Button>{t("createAssignment")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Kullanıcı</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Öğe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {a.user.name ?? a.user.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {a._count.items} öğe
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.status === "ACTIVE" ? "success" : "secondary"}>
                      {a.status === "ACTIVE" ? t("active") : t("archived")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionLink href={`/${locale}/admin/assignments/${a.id}`} variant="edit" icon="edit" label={t("edit")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
