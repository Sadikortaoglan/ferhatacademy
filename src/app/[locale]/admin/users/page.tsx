import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/status-badge";
import { ActionLink } from "@/components/shared/admin-actions";
import { Button } from "@/components/ui/button";
import { UserSearch } from "@/features/admin/components/user-search";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string; from?: string; to?: string }>;
}

const PAGE_SIZE = 20;

const VALID_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageStr, q, role, status, from, to } = await searchParams;
  const t = await getTranslations("admin");
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const safeRole = VALID_ROLES.includes(role as typeof VALID_ROLES[number]) ? role as typeof VALID_ROLES[number] : undefined;
  const safeFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(from) : undefined;
  const safeTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(to + "T23:59:59Z") : undefined;
  const safeStatus = status === "active" ? false : status === "inactive" ? true : undefined;

  const where = {
    ...(q ? {
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(safeRole ? { role: safeRole } : {}),
    ...(safeStatus !== undefined ? { banned: safeStatus } : {}),
    ...(safeFrom || safeTo ? {
      createdAt: {
        ...(safeFrom ? { gte: safeFrom } : {}),
        ...(safeTo ? { lte: safeTo } : {}),
      },
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const vals = { q, role, status, from, to, page: "1", ...overrides };
    for (const [k, v] of Object.entries(vals)) {
      if (v && v !== "") p.set(k, v);
    }
    return `/${locale}/admin/users?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users")}
        description={`${total} ${t("totalUsers").toLowerCase()}`}
      />

      <UserSearch locale={locale} currentQ={q} currentRole={role} currentStatus={status} currentFrom={from} currentTo={to} />

      {users.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-3">
          <p className="text-muted-foreground">Bu filtrelerle eşleşen kullanıcı bulunamadı.</p>
          <Link href={`/${locale}/admin/users`}>
            <Button variant="outline" size="sm">Filtreleri Temizle</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("email")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("role")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t("createdAt")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <RoleBadge role={user.role} />
                      {user.banned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          Pasif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {user.createdAt.toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionLink href={`/${locale}/admin/users/${user.id}`} variant="view" icon="view" label={t("viewDetail")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{page} / {totalPages} sayfa · {total} sonuç</span>
          <div className="flex gap-2">
            {page > 1 && (
              <ActionLink href={buildHref({ page: String(page - 1) })} variant="secondary" label="←" />
            )}
            {page < totalPages && (
              <ActionLink href={buildHref({ page: String(page + 1) })} variant="secondary" label="→" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
