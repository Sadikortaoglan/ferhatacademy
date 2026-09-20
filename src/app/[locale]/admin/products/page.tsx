import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionLink } from "@/components/shared/admin-actions";
import { formatPrice } from "@/server/commerce";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const products = await prisma.product.findMany({
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  const statusBadge = (status: string) => {
    if (status === "PUBLISHED") return "success" as const;
    if (status === "ARCHIVED") return "danger" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Ürünler</h1>
        <Link href={`/${locale}/admin/products/new`}>
          <Button>+ Yeni Ürün</Button>
        </Link>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Ad</th>
              <th className="text-left px-4 py-3 font-semibold">Tür</th>
              <th className="text-left px-4 py-3 font-semibold">Fiyat</th>
              <th className="text-left px-4 py-3 font-semibold">Durum</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const tr = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
              return (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{tr?.name ?? product.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.type}</td>
                  <td className="px-4 py-3">{formatPrice(product.price, product.currency, locale)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge(product.status)}>{product.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ActionLink href={`/${locale}/admin/products/${product.id}`} variant="edit" icon="edit" label="Düzenle" />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Henüz ürün yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
