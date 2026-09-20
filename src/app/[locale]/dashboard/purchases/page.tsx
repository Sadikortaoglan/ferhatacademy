import { requireUser } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/server/commerce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    if (status === "PAID") return "success" as const;
    if (status === "CANCELLED" || status === "REFUNDED") return "danger" as const;
    return "secondary" as const;
  };

  const statusLabel: Record<string, string> = {
    PENDING_PAYMENT: locale === "tr" ? "Ödeme Bekleniyor" : "Awaiting Payment",
    PAYMENT_REVIEW: locale === "tr" ? "İnceleniyor" : "Under Review",
    PAID: locale === "tr" ? "Ödendi" : "Paid",
    CANCELLED: locale === "tr" ? "İptal" : "Cancelled",
    REFUNDED: locale === "tr" ? "İade Edildi" : "Refunded",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{locale === "tr" ? "Satın Aldıklarım" : "My Purchases"}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{locale === "tr" ? "Henüz bir satın alma işleminiz yok." : "No purchases yet."}</p>
          <Link href={`/${locale}/products`}>
            <Button className="mt-4">{locale === "tr" ? "Ürünleri Keşfet" : "Browse Products"}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl p-5 bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{order.reference}</span>
                <Badge variant={statusBadge(order.status)}>{statusLabel[order.status] ?? order.status}</Badge>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.productNameSnapshot}</span>
                  <span className="font-semibold">{formatPrice(item.unitPrice, item.currency, locale)}</span>
                </div>
              ))}
              {order.status === "PENDING_PAYMENT" && order.payments.length === 0 && order.items[0]?.productId && (
                <Link href={`/${locale}/checkout/${order.items[0].productId}`}>
                  <Button size="sm" variant="outline">{locale === "tr" ? "Ödemeye Devam Et" : "Continue Payment"}</Button>
                </Link>
              )}
              {order.status === "PAYMENT_REVIEW" && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">{locale === "tr" ? "Ödemeniz inceleniyor." : "Payment under review."}</p>
              )}
              {order.status === "PAID" && (
                <p className="text-sm text-green-600 dark:text-green-400">{locale === "tr" ? "Ödemeniz onaylandı. İçerikleriniz aktif." : "Payment confirmed. Your content is active."}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
