import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/server/commerce";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    type: string;
    purchaseMode: string;
    price: number;
    currency: string;
    coverImageUrl: string | null;
    translations: { locale: string; name: string; shortDescription: string | null }[];
  };
  locale: string;
  userId: string | null;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const priceDisplay = product.price === 0 ? (locale === "tr" ? "Ücretsiz" : "Free") : formatPrice(product.price, product.currency, locale);

  const ctaLabel =
    product.purchaseMode === "INVITE_ONLY" ? (locale === "tr" ? "Davet ile" : "By Invite") :
    product.purchaseMode === "APPLICATION_REQUIRED" || product.purchaseMode === "APPLICATION_REQUIRED_BEFORE_PURCHASE" ? (locale === "tr" ? "Başvur" : "Apply") :
    product.price === 0 ? (locale === "tr" ? "Ücretsiz Katıl" : "Enroll Free") :
    (locale === "tr" ? "Satın Al" : "Buy Now");

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group block rounded-xl overflow-hidden border border-border bg-surface hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {product.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.coverImageUrl} alt={translation?.name ?? ""} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-black text-primary/20 uppercase">{(translation?.name ?? "").slice(0, 2)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{product.type}</Badge>
          {product.purchaseMode !== "DIRECT_PURCHASE" && (
            <Badge variant="outline" className="text-xs">
              {product.purchaseMode === "INVITE_ONLY" ? (locale === "tr" ? "Davet ile" : "By Invite") : (locale === "tr" ? "Başvuru gerekli" : "Application required")}
            </Badge>
          )}
        </div>
        <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
          {translation?.name ?? "—"}
        </h3>
        {translation?.shortDescription && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{translation.shortDescription}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-primary">{priceDisplay}</span>
          <span className="text-xs text-muted-foreground">{ctaLabel}</span>
        </div>
      </div>
    </Link>
  );
}
