import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ActionLink } from "@/components/shared/admin-actions";
import { formatPrice } from "@/server/commerce";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    if (status === "PAID") return "success" as const;
    if (status === "CANCELLED" || status === "REFUNDED") return "danger" as const;
    if (status === "PAYMENT_REVIEW") return "warning" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Siparişler</h1>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Referans</th>
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold">Tutar</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{order.reference}</td>
                <td className="px-4 py-3">
                  <div>{order.user.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{order.user.email}</div>
                </td>
                <td className="px-4 py-3">{formatPrice(order.totalAmount, order.currency, locale)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <ActionLink href={`/${locale}/admin/orders/${order.id}`} variant="view" icon="view" label="Detay" />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Henüz sipariş yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
