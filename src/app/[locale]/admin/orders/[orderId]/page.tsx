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
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            include: {
              translations: true,
              grants: true,
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  // Collect all resourceIds from grants to resolve course names
  const grantResourceIds = order.items
    .flatMap((item) => item.product?.grants ?? [])
    .filter((g) => g.grantType === "COURSE_ACCESS" && g.resourceId)
    .map((g) => g.resourceId as string);

  const courses = grantResourceIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: grantResourceIds } },
        include: { translations: true },
      })
    : [];

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const statusBadge = (status: string): "success" | "danger" | "warning" | "secondary" => {
    if (status === "PAID" || status === "APPROVED") return "success";
    if (status === "CANCELLED" || status === "REFUNDED" || status === "REJECTED") return "danger";
    if (status === "PAYMENT_REVIEW" || status === "REPORTED") return "warning";
    return "secondary";
  };

  // Build list of what will be unlocked on approval
  const pendingGrants: { productName: string; grantType: string; courseName: string | null }[] = [];
  for (const item of order.items) {
    if (!item.product) continue;
    const tr = item.product.translations.find((t) => t.locale === locale) ?? item.product.translations[0];
    const productName = tr?.name ?? item.productNameSnapshot;
    for (const grant of item.product.grants) {
      const course = grant.resourceId ? courseMap.get(grant.resourceId) : null;
      const courseTr = course?.translations.find((t) => t.locale === locale) ?? course?.translations[0];
      pendingGrants.push({
        productName,
        grantType: grant.grantType,
        courseName: courseTr?.title ?? course?.slug ?? null,
      });
    }
  }

  const isPending = order.status !== "PAID" && order.status !== "CANCELLED" && order.status !== "REFUNDED";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black flex-1">Sipariş: {order.reference}</h1>
        <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
      </div>

      {/* Who paid */}
      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Kim Satın Aldı?</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Ad Soyad:</span> {order.user.name ?? "—"}</p>
          <p><span className="text-muted-foreground">E-posta:</span> {order.user.email}</p>
          {order.user.phone && (
            <p><span className="text-muted-foreground">Telefon:</span> {order.user.phone}</p>
          )}
          <p><span className="text-muted-foreground">Sipariş Tarihi:</span> {new Date(order.createdAt).toLocaleString("tr-TR")}</p>
          <p><span className="text-muted-foreground">Sipariş No:</span> <span className="font-mono">{order.reference}</span></p>
        </div>
      </div>

      {/* What they bought */}
      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Ne Satın Aldı?</h2>
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

      {/* What happens on approval */}
      {pendingGrants.length > 0 && (
        <div className={`border rounded-xl p-5 space-y-3 ${order.status === "PAID" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"}`}>
          <h2 className="font-bold text-sm">
            {order.status === "PAID"
              ? "✅ Onaylandı — Verilen Erişimler"
              : "⚡ Onaylanırsa Otomatik Verilecek Erişimler"}
          </h2>
          <ul className="space-y-1">
            {pendingGrants.map((g, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">
                  {g.grantType === "COURSE_ACCESS" ? "🎓" : g.grantType === "LESSON_ACCESS" ? "📖" : "🎫"}
                </span>
                <span>
                  {g.grantType === "COURSE_ACCESS" ? "Kurs Erişimi" : g.grantType === "LESSON_ACCESS" ? "Ders Erişimi" : g.grantType}
                  {g.courseName && <> → <span className="font-semibold">{g.courseName}</span></>}
                  {!g.courseName && <span className="text-muted-foreground"> (kaynak bulunamadı)</span>}
                </span>
              </li>
            ))}
          </ul>
          {order.status !== "PAID" && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Ödeme onaylandığı anda bu erişimler kullanıcıya otomatik olarak tanımlanır. Herhangi bir manuel işlem gerekmez.
            </p>
          )}
        </div>
      )}

      {/* Payments */}
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
                  <span className="text-sm font-medium">{pay.method}</span>
                </div>
                <span className="text-sm font-semibold">{formatPrice(pay.amount, pay.currency, locale)}</span>
              </div>
              {pay.transferReference && (
                <p className="text-xs text-muted-foreground">Dekont / Referans: <span className="font-mono">{pay.transferReference}</span></p>
              )}
              {pay.userNote && <p className="text-xs text-muted-foreground">Kullanıcı Notu: {pay.userNote}</p>}
              <p className="text-xs text-muted-foreground">
                Bildirildi: {pay.reportedAt ? new Date(pay.reportedAt).toLocaleString("tr-TR") : "—"}
                {pay.approvedAt && <> · Onaylandı: {new Date(pay.approvedAt).toLocaleString("tr-TR")}</>}
              </p>
              {(pay.status === "REPORTED" || pay.status === "PENDING") && (
                <PaymentActionButtons paymentId={pay.id} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Manual payment form — only when order is still open */}
      {isPending && (
        <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
          <h2 className="font-bold">Manuel Ödeme Kaydet</h2>
          <p className="text-xs text-muted-foreground">
            Kullanıcının ödeme bildirimi yoksa veya doğrudan onaylamak istiyorsanız burayı kullanın. Kaydet &amp; Onayla butonu erişimleri otomatik aktive eder.
          </p>
          <ManualPaymentForm orderId={order.id} defaultAmount={order.totalAmount} />
        </div>
      )}
    </div>
  );
}
