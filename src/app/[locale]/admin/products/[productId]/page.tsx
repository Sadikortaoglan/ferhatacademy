import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/server/commerce";
import { PublishProductButton, ArchiveProductButton } from "@/features/commerce/components/product-admin-buttons";
import { ApplicationConfig } from "./application-config";
import { ProductSalesConfig } from "@/features/commerce/components/product-sales-config";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  await requireAdmin(locale);
  const te = await getTranslations("enums");

  const [product, templates, profiles] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        inclusions: { orderBy: { position: "asc" } },
        grants: true,
      },
    }),
    prisma.applicationFormTemplate.findMany({
      where: { archived: false },
      select: {
        id: true,
        key: true,
        nameTr: true,
        archived: true,
        _count: { select: { steps: true, questions: true } },
      },
    }),
    prisma.applicationPageProfile.findMany({
      select: { id: true, key: true, headlineTr: true },
    }),
  ]);
  if (!product) notFound();

  const tr = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const statusBadge = product.status === "PUBLISHED" ? "success" as const : product.status === "ARCHIVED" ? "danger" as const : "secondary" as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black flex-1">{tr?.name ?? product.slug}</h1>
        <Badge variant={statusBadge}>{te(`productStatus.${product.status}`)}</Badge>
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-4">
        <h2 className="font-bold">Genel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Slug:</span> <span className="font-mono">{product.slug}</span></div>
          <div><span className="text-muted-foreground">Tür:</span> {te(`productType.${product.type}`)}</div>
          <div><span className="text-muted-foreground">Satın Alma Modu:</span> {te(`purchaseMode.${product.purchaseMode}`)}</div>
          <div><span className="text-muted-foreground">Fiyat:</span> {formatPrice(product.price, product.currency, locale)}</div>
        </div>
        {tr?.description && (
          <div className="text-sm">
            <span className="text-muted-foreground">Açıklama:</span>
            <p className="mt-1">{tr.description}</p>
          </div>
        )}
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Erişim Hakları (ProductGrants)</h2>
        {product.grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz erişim hakkı tanımlanmamış.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {product.grants.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                <Badge variant="secondary">{g.grantType}</Badge>
                <span className="font-mono text-xs">{g.resourceId}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Program İçeriği (Inclusions)</h2>
        {product.inclusions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz içerik eklenmemiş.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {product.inclusions.map((inc) => (
              <li key={inc.id} className="flex items-center gap-2">
                <Badge variant="outline">{inc.type}</Badge>
                <span>{inc.titleTr}</span>
                {inc.quantity && <span className="text-muted-foreground">×{inc.quantity}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Yayın İşlemleri</h2>
        <div className="flex gap-3">
          {product.status !== "PUBLISHED" && <PublishProductButton productId={product.id} />}
          {product.status === "PUBLISHED" && <ArchiveProductButton productId={product.id} />}
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Satış &amp; Başvuru</h2>
        <p className="text-xs text-muted-foreground">Fiyat gösterimi, müşteri akışı ve CTA buton yapılandırması.</p>
        <ProductSalesConfig
          locale={locale}
          productId={product.id}
          productSlug={product.slug}
          current={{
            pricePresentation: product.pricePresentation,
            ctaFlow: product.ctaFlow,
            price: product.price,
            currency: product.currency,
            primaryCtaLabelTr: product.primaryCtaLabelTr ?? null,
            primaryCtaLabelEn: product.primaryCtaLabelEn ?? null,
            secondaryCtaLabelTr: product.secondaryCtaLabelTr ?? null,
            secondaryCtaLabelEn: product.secondaryCtaLabelEn ?? null,
            linkedCourseId: product.linkedCourseId ?? null,
            formTemplateId: product.formTemplateId ?? null,
            pageProfileId: product.pageProfileId ?? null,
          }}
        />
      </div>

      <div className="border border-border rounded-xl p-5 bg-surface space-y-3">
        <h2 className="font-bold">Başvuru Ayarları</h2>
        <ApplicationConfig
          locale={locale}
          productId={product.id}
          purchaseMode={product.purchaseMode}
          currentTemplateId={product.formTemplateId ?? null}
          currentProfileId={product.pageProfileId ?? null}
          templates={templates}
          profiles={profiles}
        />
      </div>
    </div>
  );
}
