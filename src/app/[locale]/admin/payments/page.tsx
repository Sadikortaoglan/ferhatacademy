import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatPrice } from "@/server/commerce";
import { PaymentActionButtons } from "@/features/commerce/components/payment-action-buttons";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const payments = await prisma.payment.findMany({
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
  });

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return "success" as const;
    if (status === "REJECTED" || status === "REFUNDED") return "danger" as const;
    if (status === "REPORTED") return "warning" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Ödemeler</h1>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
              <th className="text-left px-4 py-3 font-semibold">Tutar</th>
              <th className="text-left px-4 py-3 font-semibold">Yöntem</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((pay) => (
              <tr key={pay.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>{pay.order.user.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{pay.order.user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/${locale}/admin/orders/${pay.orderId}`} className="font-mono text-xs hover:underline text-primary">
                    {pay.order.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatPrice(pay.amount, pay.currency, locale)}</td>
                <td className="px-4 py-3">{pay.method}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge(pay.status)}>{pay.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {(pay.status === "REPORTED" || pay.status === "PENDING") ? (
                    <PaymentActionButtons paymentId={pay.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Henüz ödeme kaydı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
