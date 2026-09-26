import { Suspense } from "react";
import Link from "next/link";
import { getNotificationPage, markAllRead, markNotificationRead } from "./actions";

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
}

export default async function NotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const filter = sp.filter === "unread" ? "unread" : "all";
  const page = Number(sp.page ?? 1);

  const { items, total, perPage } = await getNotificationPage(page, filter);
  const totalPages = Math.ceil(total / perPage);

  const tr = locale === "tr";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{tr ? "Bildirimler" : "Notifications"}</h1>
        {items.some((n) => !n.readAt) && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="text-sm text-primary hover:underline"
            >
              {tr ? "Tümünü okundu işaretle" : "Mark all as read"}
            </button>
          </form>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["all", "unread"] as const).map((f) => (
          <Link
            key={f}
            href={`?filter=${f}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? (tr ? "Tümü" : "All") : (tr ? "Okunmamış" : "Unread")}
          </Link>
        ))}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {tr ? "Bildirim yok" : "No notifications"}
          </p>
        ) : (
          items.map((n) => {
            const href =
              n.entityType === "Application" && n.entityId
                ? `/${locale}/admin/applications/${n.entityId}`
                : "#";
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface ${!n.readAt ? "bg-primary/3" : "bg-background"}`}
              >
                {!n.readAt && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                <div className={`flex-1 min-w-0 ${n.readAt ? "pl-5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {n.entityType === "Application" && n.entityId && (
                        <Link
                          href={href}
                          className="text-xs text-primary hover:underline"
                        >
                          {tr ? "Görüntüle" : "View"}
                        </Link>
                      )}
                      {!n.readAt && (
                        <form action={markNotificationRead.bind(null, n.id)}>
                          <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
                            {tr ? "Okundu" : "Mark read"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?filter=${filter}&page=${page - 1}`}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface transition-colors"
            >
              {tr ? "← Önceki" : "← Prev"}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?filter=${filter}&page=${page + 1}`}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface transition-colors"
            >
              {tr ? "Sonraki →" : "Next →"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
