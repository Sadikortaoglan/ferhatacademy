import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ApplicationContextPanel, type ContextData } from "@/features/applications/components/context-panel";
import { ApplicationFormPanel } from "@/features/applications/components/form-panel";
import { getApplicationPageData } from "@/features/applications/actions";

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

  const formTemplate = product.formTemplate ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageProfile = product.pageProfile as Record<string, any> | null ?? null;

  const isTr = locale === "tr";

  const contextData: ContextData = {
    programName,
    programDescription,
    programVisualUrl: pageProfile?.programVisualUrl ?? null,
    motivationText: isTr
      ? (pageProfile?.motivationTr ?? null)
      : (pageProfile?.motivationEn ?? pageProfile?.motivationTr ?? null),
    processSteps: pageProfile?.processSteps ?? [],
    faqItems: pageProfile?.faqItems ?? [],
    inclusions: product.inclusions ?? [],
    reassuranceText: isTr
      ? (pageProfile?.reassuranceTr ?? null)
      : (pageProfile?.reassuranceEn ?? pageProfile?.reassuranceTr ?? null),
  };

  const pageHeadline = isTr
    ? (pageProfile?.headlineTr ?? programName)
    : (pageProfile?.headlineEn ?? programName);
  const pageSubtitle = isTr
    ? (pageProfile?.subtitleTr ?? programDescription)
    : (pageProfile?.subtitleEn ?? programDescription);
  const ctaLabel = isTr ? pageProfile?.ctaLabelTr : pageProfile?.ctaLabelEn;

  const hasActiveApplication =
    existing && !["REJECTED", "CANCELLED"].includes(existing.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`/${locale}/products/${slug}`}
            className="hover:text-foreground transition-colors"
          >
            {programName}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {isTr ? "Başvuru" : "Application"}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8 lg:mb-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            {isTr ? "Başvuru" : "Application"}
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground leading-tight">
            {pageHeadline}
          </h1>
          {pageSubtitle && (
            <p className="text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {pageSubtitle}
            </p>
          )}
        </div>

        {hasActiveApplication ? (
          /* Already applied */
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto text-2xl">
                📋
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {isTr ? "Başvurunuz Mevcut" : "Application Exists"}
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
          /* Two-column split layout */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left context panel — 2/5 ≈ 40% — shows below form on mobile */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <ApplicationContextPanel data={contextData} locale={locale} />
            </div>

            {/* Right form panel — 3/5 ≈ 60% — appears first on mobile */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="lg:sticky lg:top-8">
                <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
                  <div className="mb-6 pb-5 border-b border-border">
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
