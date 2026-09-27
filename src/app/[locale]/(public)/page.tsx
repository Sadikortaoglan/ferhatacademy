import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen, MonitorPlay, User2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { CourseCard } from "@/components/shared/course-card";
import { ProductCard } from "@/components/shared/product-card";
import { getHomepageConfig } from "@/server/homepage";
import { prisma } from "@/lib/prisma";
import { HeroSliderClient } from "@/components/hero-slider";
import type {
  HomepageConfigData,
  HeroConfig,
  HeroStandard,
  HeroSlider,
  HeroBanner,
  HeroStatement,
  HomepageSection,
  CtaButton,
} from "@/lib/homepage-types";

// ── CTA helper ────────────────────────────────────────────────────────────

function CtaLink({
  cta,
  locale,
  className,
  children,
}: {
  cta: CtaButton;
  locale: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/${locale}${cta.destination}`} className={className}>
      {children}
    </Link>
  );
}

// ── Hero renderers ────────────────────────────────────────────────────────

function HeroStandardSection({ hero, locale }: { hero: HeroStandard; locale: string }) {
  const lines = hero.headlineTr.split("\\n");
  const highlight = hero.highlightedText?.trim();

  return (
    <section className="section-dark px-4 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className={hero.alignment === "center" ? "text-center mx-auto max-w-xl" : ""}>
          {hero.eyebrow && (
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              {hero.eyebrow}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {lines.map((line, i) => {
              const isHighlighted = highlight && line.includes(highlight);
              return (
                <span key={i} className="block">
                  {isHighlighted ? (
                    <>
                      {line.slice(0, line.indexOf(highlight))}
                      <span className="text-primary">{highlight}</span>
                      {line.slice(line.indexOf(highlight) + highlight.length)}
                    </>
                  ) : (
                    <span className="text-white">{line}</span>
                  )}
                </span>
              );
            })}
          </h1>
          {hero.descriptionTr && (
            <p className="mt-6 text-base sm:text-lg text-white/60 max-w-lg leading-relaxed">
              {hero.descriptionTr}
            </p>
          )}
          {(hero.primaryCta || hero.secondaryCta) && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {hero.primaryCta && (
                <CtaLink cta={hero.primaryCta} locale={locale}>
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    {hero.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CtaLink>
              )}
              {hero.secondaryCta && (
                <CtaLink cta={hero.secondaryCta} locale={locale}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
                  >
                    {hero.secondaryCta.label}
                  </Button>
                </CtaLink>
              )}
            </div>
          )}
        </div>
        <div className="w-full">
          {hero.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.imageUrl}
                alt={hero.headlineTr}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 aspect-video bg-white/5 flex items-center justify-center">
              <span className="text-white/20 text-sm">Görsel yüklenmedi</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroSliderSection({ hero, locale }: { hero: HeroSlider; locale: string }) {
  const activeSlides = hero.slides.filter((s) => s.enabled);
  if (activeSlides.length === 0) {
    return (
      <section className="section-dark px-4 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-black text-white">Yakında</h1>
        </div>
      </section>
    );
  }
  return <HeroSliderClient hero={hero} locale={locale} />;
}

function HeroBannerSection({ hero, locale }: { hero: HeroBanner; locale: string }) {
  return (
    <section className="relative overflow-hidden min-h-[400px] sm:min-h-[520px] flex items-end">
      {hero.imageUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.imageUrl} alt={hero.headlineTr ?? ""} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 section-dark" />
      )}
      <div className="relative z-10 w-full px-4 py-12 sm:py-16 max-w-7xl mx-auto">
        {(hero.headlineTr || hero.descriptionTr || hero.primaryCta) && (
          <div className="max-w-xl">
            {hero.headlineTr && (
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {hero.headlineTr}
              </h1>
            )}
            {hero.descriptionTr && (
              <p className="mt-4 text-base text-white/70 leading-relaxed">{hero.descriptionTr}</p>
            )}
            {hero.primaryCta && (
              <div className="mt-6">
                <CtaLink cta={hero.primaryCta} locale={locale}>
                  <Button size="lg" className="gap-2">
                    {hero.primaryCta.label} <ArrowRight className="h-4 w-4" />
                  </Button>
                </CtaLink>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroStatementSection({ hero, locale }: { hero: HeroStatement; locale: string }) {
  const lines = hero.sloganTr.split("\\n");
  const center = hero.alignment === "center";

  return (
    <section className="relative section-dark px-4 py-24 sm:py-36 overflow-hidden">
      {hero.backgroundImageUrl && (
        <div className="absolute inset-0 opacity-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.backgroundImageUrl} alt="" className="w-full h-full object-cover" aria-hidden />
        </div>
      )}
      <div className={`relative z-10 max-w-4xl mx-auto ${center ? "text-center" : ""}`}>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        {hero.subtextTr && (
          <p className={`mt-8 text-lg sm:text-xl text-white/50 font-light leading-relaxed ${center ? "max-w-lg mx-auto" : "max-w-lg"}`}>
            {hero.subtextTr}
          </p>
        )}
        {hero.primaryCta && (
          <div className={`mt-10 ${center ? "flex justify-center" : ""}`}>
            <CtaLink cta={hero.primaryCta} locale={locale}>
              <Button size="lg" className="gap-2">
                {hero.primaryCta.label} <ArrowRight className="h-4 w-4" />
              </Button>
            </CtaLink>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroRenderer({ hero, locale }: { hero: HeroConfig; locale: string }) {
  switch (hero.mode) {
    case "STANDARD":
      return <HeroStandardSection hero={hero as HeroStandard} locale={locale} />;
    case "SLIDER":
      return <HeroSliderSection hero={hero as HeroSlider} locale={locale} />;
    case "BANNER":
      return <HeroBannerSection hero={hero as HeroBanner} locale={locale} />;
    case "STATEMENT":
      return <HeroStatementSection hero={hero as HeroStatement} locale={locale} />;
  }
}

// ── Section renderers ──────────────────────────────────────────────────────

type CourseRow = Awaited<ReturnType<typeof fetchCourses>>[0];
type ProductRow = Awaited<ReturnType<typeof fetchProducts>>[0];

async function fetchCourses(ids?: string[]) {
  return prisma.course.findMany({
    where: ids?.length
      ? { id: { in: ids }, status: "PUBLISHED" }
      : { status: "PUBLISHED" },
    include: {
      translations: true,
      modules: { include: { lessons: { select: { id: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: ids?.length ? ids.length : 6,
  });
}

async function fetchProducts(ids?: string[]) {
  return prisma.product.findMany({
    where: ids?.length
      ? { id: { in: ids }, status: "PUBLISHED" }
      : { status: "PUBLISHED" },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
    take: ids?.length ? ids.length : 6,
  });
}

async function SectionRenderer({
  section,
  locale,
  courses,
  products,
  t,
  tNav,
}: {
  section: HomepageSection;
  locale: string;
  courses: CourseRow[];
  products: ProductRow[];
  t: Awaited<ReturnType<typeof getTranslations<"home">>>;
  tNav: Awaited<ReturnType<typeof getTranslations<"navigation">>>;
}) {
  if (!section.enabled) return null;

  if (section.type === "FEATURED_COURSES") {
    const display = section.mode === "MANUAL" && section.manualIds?.length
      ? courses.filter((c) => section.manualIds!.includes(c.id))
      : courses;
    if (display.length === 0) return null;
    return (
      <Section title={section.headlineTr ?? t("featuredTitle")} subtitle={section.subtitleTr ?? t("featuredSubtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {display.map((course) => (
            <CourseCard key={course.id} course={course} locale={locale} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/courses`}>
            <Button variant="outline" size="lg">{tNav("courses")} →</Button>
          </Link>
        </div>
      </Section>
    );
  }

  if (section.type === "FEATURED_PRODUCTS") {
    const display = section.mode === "MANUAL" && section.manualIds?.length
      ? products.filter((p) => section.manualIds!.includes(p.id))
      : products;
    if (display.length === 0) return null;
    return (
      <Section title={section.headlineTr ?? "Ürünler"} subtitle={section.subtitleTr}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {display.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} userId={null} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/products`}>
            <Button variant="outline" size="lg">{tNav("products")} →</Button>
          </Link>
        </div>
      </Section>
    );
  }

  if (section.type === "LEARNING_OPTIONS") {
    return (
      <section className="bg-muted px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {section.headlineTr ?? t("learningOptionsTitle")}
            </h2>
            {section.subtitleTr && (
              <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
                {section.subtitleTr}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: t("selfPacedTitle"), desc: t("selfPacedDesc") },
              { icon: MonitorPlay, title: t("liveTitle"), desc: t("liveDesc") },
              { icon: User2, title: t("personalTitle"), desc: t("personalDesc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-surface rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "LIVE_TRAINING") {
    return (
      <Section title={section.headlineTr ?? t("liveTrainingTitle")} subtitle={section.subtitleTr ?? t("liveTrainingSubtitle")} dark>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <User2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">{t("liveOneOnOneTitle")}</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{t("liveOneOnOneDesc")}</p>
            <div className="mt-4">
              <span className="inline-block text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">Zoom</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <MonitorPlay className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">{t("liveGroupTitle")}</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{t("liveGroupDesc")}</p>
            <div className="mt-4">
              <span className="inline-block text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">Workshop</span>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/live`}>
            <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent">
              {tNav("live")} →
            </Button>
          </Link>
        </div>
      </Section>
    );
  }

  if (section.type === "FREE_CONTENT") {
    return (
      <Section title={section.headlineTr ?? t("freeContentTitle")} subtitle={section.subtitleTr ?? t("freeContentSubtitle")}>
        <p className="text-muted-foreground text-center py-8">Ücretsiz içerikler yakında eklenecek.</p>
      </Section>
    );
  }

  if (section.type === "ABOUT") {
    return (
      <section className="bg-muted px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center">
            <div className="sm:col-span-1">
              {section.imageUrl ? (
                <div className="rounded-2xl overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={section.imageUrl} alt={section.headlineTr ?? "Ferhat"} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl bg-foreground/10 aspect-square flex items-center justify-center">
                  <User2 className="h-16 w-16 text-foreground/20" />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                {t("aboutSubtitle")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {section.headlineTr ?? t("aboutTitle")}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {section.bodyTr ?? t("aboutText")}
              </p>
              <Link href={`/${locale}/about`} className="mt-5 inline-block">
                <Button variant="outline">{section.ctaLabel ?? t("aboutLink")} →</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "CTA_BANNER") {
    return (
      <section className="bg-muted px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-2xl overflow-hidden border border-border ${section.imageUrl ? "relative" : "bg-surface"}`}>
            {section.imageUrl && (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.imageUrl} alt="" className="w-full h-full object-cover opacity-20" aria-hidden />
              </div>
            )}
            <div className="relative z-10 p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">{section.headlineTr}</h2>
              {section.descriptionTr && (
                <p className="mt-3 text-base text-muted-foreground">{section.descriptionTr}</p>
              )}
              {section.primaryCta && (
                <div className="mt-6">
                  <CtaLink cta={section.primaryCta} locale={locale}>
                    <Button size="lg" className="gap-2">
                      {section.primaryCta.label} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CtaLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "TEXT_IMAGE") {
    const imgLeft = section.imagePosition === "left";
    return (
      <Section>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center ${imgLeft ? "" : ""}`}>
          {imgLeft && section.imageUrl && (
            <div className="rounded-2xl overflow-hidden aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.imageUrl} alt={section.headlineTr} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{section.headlineTr}</h2>
            {section.descriptionTr && (
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">{section.descriptionTr}</p>
            )}
            {section.primaryCta && (
              <div className="mt-6">
                <CtaLink cta={section.primaryCta} locale={locale}>
                  <Button variant="outline" size="lg" className="gap-2">
                    {section.primaryCta.label} <ArrowRight className="h-4 w-4" />
                  </Button>
                </CtaLink>
              </div>
            )}
          </div>
          {!imgLeft && section.imageUrl && (
            <div className="rounded-2xl overflow-hidden aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={section.imageUrl} alt={section.headlineTr} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Section>
    );
  }

  if (section.type === "FINAL_CTA") {
    return (
      <section className="section-dark px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {section.headlineTr ?? t("ctaTitle")}
          </h2>
          {section.subtitleTr && (
            <p className="mt-4 text-base text-white/60">{section.subtitleTr}</p>
          )}
          {section.primaryCta && (
            <div className="mt-8">
              <CtaLink cta={section.primaryCta} locale={locale}>
                <Button size="lg" className="gap-2">
                  {section.primaryCta.label} <ArrowRight className="h-4 w-4" />
                </Button>
              </CtaLink>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tNav, config] = await Promise.all([
    getTranslations("home"),
    getTranslations("navigation"),
    getHomepageConfig(),
  ]);

  const needsCourses = config.sections.some(
    (s) => s.enabled && s.type === "FEATURED_COURSES"
  );
  const needsProducts = config.sections.some(
    (s) => s.enabled && s.type === "FEATURED_PRODUCTS"
  );

  const courseSection = config.sections.find(
    (s) => s.type === "FEATURED_COURSES" && s.enabled
  ) as Extract<HomepageSection, { type: "FEATURED_COURSES" }> | undefined;

  const productSection = config.sections.find(
    (s) => s.type === "FEATURED_PRODUCTS" && s.enabled
  ) as Extract<HomepageSection, { type: "FEATURED_PRODUCTS" }> | undefined;

  const [courses, products] = await Promise.all([
    needsCourses ? fetchCourses(courseSection?.mode === "MANUAL" ? courseSection.manualIds : undefined) : Promise.resolve([]),
    needsProducts ? fetchProducts(productSection?.mode === "MANUAL" ? productSection.manualIds : undefined) : Promise.resolve([]),
  ]);

  return (
    <>
      <HeroRenderer hero={config.hero} locale={locale} />
      {config.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          locale={locale}
          courses={courses}
          products={products}
          t={t}
          tNav={tNav}
        />
      ))}
    </>
  );
}
