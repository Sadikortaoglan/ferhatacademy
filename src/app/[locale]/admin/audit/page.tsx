import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/shared/admin-actions";

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; action?: string; actor?: string }>;
}) {
  const { locale } = await params;
  const { page = "1", action, actor } = await searchParams;
  const t = await getTranslations("admin");
  const pageNum = Math.max(1, parseInt(page));

  const where = {
    ...(action ? { action: action as never } : {}),
    ...(actor ? { actor: { OR: [{ name: { contains: actor } }, { email: { contains: actor } }] } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actionColors: Record<string, "default" | "secondary" | "danger" | "outline"> = {
    GRANT_ACCESS: "default",
    REVOKE_ACCESS: "danger",
    CREATE_ASSIGNMENT: "secondary",
    UPDATE_COURSE: "secondary",
    DELETE_COURSE: "danger",
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("auditLog")} />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t("action")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("actor")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("target")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    {t("noLogs")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Badge variant={actionColors[log.action] ?? "outline"} className="text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.actor.name ?? log.actor.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.targetType && (
                        <span className="text-xs">
                          {log.targetType}: {log.targetId?.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {log.createdAt.toLocaleString(locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {total} kayıt · Sayfa {pageNum}/{totalPages}
          </span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <ActionLink href={`/${locale}/admin/audit?page=${pageNum - 1}`} variant="secondary" label="← Önceki" />
            )}
            {pageNum < totalPages && (
              <ActionLink href={`/${locale}/admin/audit?page=${pageNum + 1}`} variant="secondary" label="Sonraki →" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
