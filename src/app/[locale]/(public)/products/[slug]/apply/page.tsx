import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ApplicationFormPanel } from "@/features/applications/components/form-panel";
import { ApplyPageContext } from "@/features/applications/components/apply-page-context";
import { getApplicationPageData } from "@/features/applications/actions";
import { ChevronLeft } from "lucide-react";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect(`/${locale}/login?returnTo=/${locale}/products/${slug}/apply`);
  }

  const product = await getApplicationPageData(slug);
  if (!product || product.status !== "PUBLISHED") notFound();

  const existing = await prisma.application.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: product.id } },
  });

  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const programName = translation?.name ?? "";
  const programDescription = (translation as { shortDescription?: string | null } | undefined)?.shortDescription ?? "";

  const formTemplate = product.formTemplate
    ? {
        ...product.formTemplate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: product.formTemplate.questions.map((q) => ({ ...q, conditionJson: q.conditionJson as any })),
      }
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageProfile = product.pageProfile as Record<string, any> | null ?? null;

  const isTr = locale === "tr";

  const pageHeadline = isTr
    ? (pageProfile?.headlineTr ?? programName)
    : (pageProfile?.headlineEn ?? programName);
  const pageSubtitle = isTr
    ? (pageProfile?.subtitleTr ?? programDescription)
    : (pageProfile?.subtitleEn ?? programDescription);
  const motivationText = isTr
    ? (pageProfile?.motivationTr ?? null)
    : (pageProfile?.motivationEn ?? pageProfile?.motivationTr ?? null);
  const ctaLabel = isTr ? pageProfile?.ctaLabelTr : pageProfile?.ctaLabelEn;
  const programVisualUrl = pageProfile?.programVisualUrl ?? null;

  const hasActiveApplication =
    existing && !["REJECTED", "CANCELLED"].includes(existing.status);

  const hasBgImage = !!programVisualUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Slim breadcrumb nav */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Link
            href={`/${locale}/products/${slug}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {programName}
          </Link>
          <span className="text-xs text-muted-foreground/40">/</span>
          <span className="text-xs text-foreground font-medium">
            {isTr ? "Başvuru" : "Application"}
          </span>
        </div>
      </div>

      {/* Program identity header */}
      <div
        className={`relative overflow-hidden ${hasBgImage ? "min-h-[260px] sm:min-h-[300px]" : "py-10 sm:py-14"}`}
        style={hasBgImage ? { background: "var(--color-background)" } : undefined}
      >
        {hasBgImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={programVisualUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/70" />
          </>
        )}
        <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 ${hasBgImage ? "py-12 sm:py-16" : ""}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
            {isTr ? "Başvuru" : "Application"}
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight max-w-2xl">
            {pageHeadline}
          </h1>
          {pageSubtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {hasActiveApplication ? (
          /* Already applied */
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto text-2xl">
                ✓
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {isTr ? "Başvurunuz Alındı" : "Application Received"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTr
                    ? "Bu program için daha önce başvuru yaptınız."
                    : "You have already applied for this program."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5">
                <span className="text-sm font-semibold text-foreground">{existing.status}</span>
              </div>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/${locale}/dashboard/applications`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  {isTr ? "Başvurularım" : "My Applications"}
                </Link>
                <Link
                  href={`/${locale}/products/${slug}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  {isTr ? "Programa Dön" : "Back to Program"}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
            {/* Left: motivation + context — below form on mobile */}
            <div className="order-2 lg:order-1 space-y-8 min-w-0">
              {motivationText && (
                <blockquote className="border-l-2 border-primary pl-4">
                  <p className="text-sm text-foreground leading-relaxed">{motivationText}</p>
                </blockquote>
              )}
              <ApplyPageContext
                locale={locale}
                inclusions={product.inclusions ?? []}
                processSteps={pageProfile?.processSteps ?? []}
                faqItems={pageProfile?.faqItems ?? []}
                reassuranceText={
                  isTr ? (pageProfile?.reassuranceTr ?? null) : (pageProfile?.reassuranceEn ?? null)
                }
              />
            </div>

            {/* Right: THE FORM — appears first on mobile, sticky on desktop */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-20">
                <div className="rounded-2xl border border-border bg-surface shadow-sm p-6 lg:p-8">
                  <div className="mb-5 pb-4 border-b border-border">
                    <h2 className="text-base font-black text-foreground">
                      {isTr ? "Başvuru Formu" : "Application Form"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isTr
                        ? "* ile işaretli alanlar zorunludur."
                        : "Fields marked with * are required."}
                    </p>
                  </div>
                  <ApplicationFormPanel
                    productId={product.id}
                    productSlug={slug}
                    productName={programName}
                    locale={locale}
                    formTemplate={formTemplate}
                    ctaLabel={ctaLabel ?? undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
