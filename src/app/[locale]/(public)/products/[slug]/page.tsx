import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { getProductAccessState, formatPrice } from "@/server/commerce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: true,
      inclusions: { orderBy: { position: "asc" } },
      grants: true,
      linkedCourse: {
        include: {
          translations: true,
          modules: {
            orderBy: { position: "asc" },
            include: {
              translations: true,
              lessons: { orderBy: { position: "asc" }, include: { translations: true } },
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") notFound();

  const session = await getSession();
  const accessState = session?.user ? await getProductAccessState(product.id, session.user.id) : "NOT_LOGGED_IN";
  const translation = product.translations.find((tr) => tr.locale === locale) ?? product.translations[0];
  const priceDisplay = product.price === 0
    ? (locale === "tr" ? "Ücretsiz" : "Free")
    : formatPrice(product.price, product.currency, locale);

  let ctaLabel = "";
  let ctaHref = "";
  let ctaDisabled = false;

  if (accessState === "ENTITLED") {
    ctaLabel = locale === "tr" ? "Eğitime Git" : "Open Course";
    ctaHref = product.linkedCourse ? `/${locale}/dashboard/courses/${product.linkedCourse.id}` : `/${locale}/dashboard`;
  } else if (accessState === "PAYMENT_PENDING") {
    ctaLabel = locale === "tr" ? "Ödeme Onayı Bekleniyor" : "Payment Pending";
    ctaDisabled = true;
  } else if (accessState === "APPLICATION_SUBMITTED") {
    ctaLabel = locale === "tr" ? "Başvurun İnceleniyor" : "Application Under Review";
    ctaDisabled = true;
  } else if (accessState === "APPLICATION_APPROVED") {
    ctaLabel = locale === "tr" ? "Satın Al" : "Buy Now";
    ctaHref = `/${locale}/checkout/${product.slug}`;
  } else if (accessState === "NO_APPLICATION") {
    ctaLabel = locale === "tr" ? "Başvur" : "Apply";
    ctaHref = `/${locale}/products/${slug}/apply`;
  } else if (product.purchaseMode === "INVITE_ONLY") {
    ctaLabel = locale === "tr" ? "Davet ile" : "Invite Only";
    ctaDisabled = true;
  } else if (product.price === 0) {
    ctaLabel = locale === "tr" ? "Ücretsiz Katıl" : "Enroll Free";
    ctaHref = `/${locale}/checkout/${product.slug}`;
  } else {
    ctaLabel = locale === "tr" ? "Satın Al" : "Buy Now";
    ctaHref = session?.user
      ? `/${locale}/checkout/${product.slug}`
      : `/${locale}/login?returnTo=/${locale}/products/${slug}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <Badge variant="secondary">{product.type}</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
            {translation?.name ?? "—"}
          </h1>
          {translation?.shortDescription && (
            <p className="text-lg text-muted-foreground">{translation.shortDescription}</p>
          )}
          <div className="text-3xl font-black text-primary">{priceDisplay}</div>
          {ctaDisabled ? (
            <Button size="lg" disabled className="w-full sm:w-auto">{ctaLabel}</Button>
          ) : ctaHref ? (
            <Link href={ctaHref}>
              <Button size="lg" className="w-full sm:w-auto">{ctaLabel}</Button>
            </Link>
          ) : null}
        </div>
        <div className="aspect-video rounded-xl overflow-hidden bg-muted">
          {product.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.coverImageUrl} alt={translation?.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-black text-primary/20 uppercase">
                {(translation?.name ?? "").slice(0, 2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {translation?.description && (
        <div className="prose prose-neutral max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{translation.description}</p>
        </div>
      )}

      {product.inclusions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {locale === "tr" ? "Bu programa dahil olanlar" : "What's included"}
          </h2>
          <ul className="space-y-2">
            {product.inclusions.map((inc) => (
              <li key={inc.id} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span>{locale === "tr" ? inc.titleTr : (inc.titleEn ?? inc.titleTr)}</span>
                {inc.quantity && <span className="text-muted-foreground">×{inc.quantity}</span>}
                {inc.durationMinutes && <span className="text-muted-foreground">({inc.durationMinutes} dk)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.linkedCourse && (
        <div>
          <h2 className="text-xl font-bold mb-4">{locale === "tr" ? "Müfredat" : "Curriculum"}</h2>
          <div className="space-y-3">
            {product.linkedCourse.modules.map((mod) => {
              const modTr = mod.translations.find((t) => t.locale === locale) ?? mod.translations[0];
              return (
                <div key={mod.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-semibold text-sm">{modTr?.title ?? "Module"}</div>
                  <ul className="divide-y divide-border">
                    {mod.lessons.map((lesson) => {
                      const lessonTr = lesson.translations.find((t) => t.locale === locale) ?? lesson.translations[0];
                      const isPreview = lesson.isPreview || lesson.visibility === "PUBLIC";
                      return (
                        <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                          {isPreview
                            ? <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                            : <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className={isPreview ? "text-foreground" : "text-muted-foreground"}>
                            {lessonTr?.title ?? "Lesson"}
                          </span>
                          {isPreview && <Badge variant="secondary" className="ml-auto text-xs">Preview</Badge>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
