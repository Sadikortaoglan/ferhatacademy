import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { getProductAccessState } from "@/server/commerce";
import { resolveProductCta } from "@/server/product-cta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle } from "lucide-react";
import { AppointmentCTA } from "@/features/appointments/components/appointment-cta";
import { getActiveAppointmentTypes } from "@/features/appointments/actions";

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

  const [session, appointmentTypes] = await Promise.all([
    getSession(),
    (["MENTORSHIP", "CONSULTATION", "LIVE_TRAINING"] as string[]).includes(product.type)
      ? getActiveAppointmentTypes()
      : Promise.resolve([]),
  ]);

  const userState = session?.user
    ? await getProductAccessState(product.id, session.user.id)
    : "NOT_LOGGED_IN";

  const { priceLabel, primaryCta, secondaryCta } = resolveProductCta(
    {
      id: product.id,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      purchaseMode: product.purchaseMode,
      pricePresentation: product.pricePresentation,
      ctaFlow: product.ctaFlow,
      primaryCtaLabelTr: product.primaryCtaLabelTr,
      primaryCtaLabelEn: product.primaryCtaLabelEn,
      secondaryCtaLabelTr: product.secondaryCtaLabelTr,
      secondaryCtaLabelEn: product.secondaryCtaLabelEn,
      linkedCourseId: product.linkedCourseId,
      formTemplateId: product.formTemplateId,
      pageProfileId: product.pageProfileId,
    },
    userState,
    locale,
  );

  const translation = product.translations.find((tr) => tr.locale === locale) ?? product.translations[0];

  // Only show appointment CTA as secondary if not already provided by resolver
  // and product is a service type and user is not entitled
  const showAppointmentFallback =
    appointmentTypes.length > 0 &&
    userState !== "ENTITLED" &&
    !secondaryCta &&
    product.ctaFlow !== "INFO_ONLY"; // INFO_ONLY already routes to appointment

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

          {/* Price — only shown when resolver returns a label */}
          {priceLabel && (
            <div className="text-3xl font-black text-primary">{priceLabel}</div>
          )}

          {/* Primary CTA */}
          {primaryCta && (
            primaryCta.disabled ? (
              <Button size="lg" disabled className="w-full sm:w-auto">{primaryCta.label}</Button>
            ) : primaryCta.href ? (
              <Link href={primaryCta.href}>
                <Button size="lg" variant={primaryCta.variant ?? "default"} className="w-full sm:w-auto">
                  {primaryCta.label}
                </Button>
              </Link>
            ) : null
          )}

          {/* Secondary CTA — from resolver config */}
          {secondaryCta && (
            secondaryCta.href ? (
              <Link href={secondaryCta.href}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {secondaryCta.label}
                </Button>
              </Link>
            ) : null
          )}

          {/* Secondary CTA — appointment fallback for service products */}
          {showAppointmentFallback && (
            <AppointmentCTA
              types={appointmentTypes}
              locale={locale}
              sourcePage={`product/${slug}`}
              productId={product.id}
              variant="outline"
              label={locale === "tr" ? "Önce Ön Görüşme Al" : "Book a Discovery Call"}
              className="w-full sm:w-auto"
            />
          )}
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
