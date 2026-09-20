import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/server/commerce";
import { PaymentActionButtons } from "@/features/commerce/components/payment-action-buttons";
import { ManualPaymentForm } from "@/features/commerce/components/manual-payment-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  await requireAdmin(locale);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { include: { translations: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const statusBadge = (status: string) => {
    if (status === "PAID" || status === "APPROVED") return "success" as const;
    if (status === "CANCELLED" || status === "REFUNDED" || status === "REJECTED") return "danger" as const;
    if (status === "PAYMENT_REVIEW" || status === "REPORTED") return "warning" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black flex-1">Sipariş: {order.reference}</h1>
        <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Kullanıcı</h2>
        <p className="text-sm">{order.user.name} — {order.user.email}</p>
        <p className="text-sm text-muted-foreground">Sipariş: {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Ürünler</h2>
        {order.items.map((item) => {
          const tr = item.product?.translations.find((t) => t.locale === locale) ?? item.product?.translations[0];
          return (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{tr?.name ?? item.productNameSnapshot}</span>
              <span className="font-semibold">{formatPrice(item.unitPrice, item.currency, locale)}</span>
            </div>
          );
        })}
        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span>Toplam</span>
          <span>{formatPrice(order.totalAmount, order.currency, locale)}</span>
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Ödemeler</h2>
        {order.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz ödeme bildirimi yok.</p>
        ) : (
          order.payments.map((pay) => (
            <div key={pay.id} className="space-y-2 border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge(pay.status)}>{pay.status}</Badge>
                  <span className="text-sm">{pay.method}</span>
                </div>
                <span className="text-sm font-semibold">{formatPrice(pay.amount, pay.currency, locale)}</span>
              </div>
              {pay.transferReference && <p className="text-xs text-muted-foreground">Dekont: {pay.transferReference}</p>}
              {pay.userNote && <p className="text-xs text-muted-foreground">Not: {pay.userNote}</p>}
              {(pay.status === "REPORTED" || pay.status === "PENDING") && (
                <PaymentActionButtons paymentId={pay.id} />
              )}
            </div>
          ))
        )}
      </div>

      {order.status !== "PAID" && (
        <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
          <h2 className="font-bold">Manuel Ödeme Kaydet</h2>
          <ManualPaymentForm orderId={order.id} />
        </div>
      )}
    </div>
  );
}
