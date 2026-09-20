import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookOpen, MonitorPlay, User2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { MediaPlaceholder } from "@/components/shared/media-placeholder";
import { ProgramCard } from "@/components/shared/program-card";
import { ContentCard } from "@/components/shared/content-card";
import { mockPrograms, mockFreeContent } from "@/config/mock-content";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tNav = await getTranslations("navigation");

  const heroLines = t("heroTitle").split("\n");

  return (
    <>
      {/* ── HERO ── */}
      <section className="section-dark px-4 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {heroLines.map((line, i) => (
                <span
                  key={i}
                  className={i === 1 ? "block text-primary" : "block text-white"}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/60 max-w-lg leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={`/${locale}/courses`}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  {t("heroCta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
                >
                  {t("heroSecondaryCta")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <MediaPlaceholder
                aspectRatio="video"
                label={t("mediaPlaceholder")}
                bgClassName="bg-white/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ── */}
      <Section title={t("featuredTitle")} subtitle={t("featuredSubtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} locale={locale} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/courses`}>
            <Button variant="outline" size="lg">
              {tNav("courses")} →
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── LEARNING OPTIONS ── */}
      <section className="bg-muted px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t("learningOptionsTitle")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
              {t("learningOptionsSubtitle")}
            </p>
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

      {/* ── LIVE TRAINING ── */}
      <Section title={t("liveTrainingTitle")} subtitle={t("liveTrainingSubtitle")} dark>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <User2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">{t("liveOneOnOneTitle")}</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{t("liveOneOnOneDesc")}</p>
            <div className="mt-4">
              <span className="inline-block text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">
                Zoom
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <MonitorPlay className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">{t("liveGroupTitle")}</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{t("liveGroupDesc")}</p>
            <div className="mt-4">
              <span className="inline-block text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">
                Workshop
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/live`}>
            <Button
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent"
            >
              {tNav("live")} →
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── FREE CONTENT ── */}
      <Section title={t("freeContentTitle")} subtitle={t("freeContentSubtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {mockFreeContent.map((content) => (
            <ContentCard key={content.id} content={content} locale={locale} />
          ))}
        </div>
      </Section>

      {/* ── ABOUT FERHAT ── */}
      <section className="bg-muted px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center">
            <div className="sm:col-span-1">
              <MediaPlaceholder
                aspectRatio="square"
                bgClassName="bg-foreground/10 rounded-2xl"
                showIcon
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                {t("aboutSubtitle")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t("aboutTitle")}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("aboutText")}
              </p>
              <Link href={`/${locale}/about`} className="mt-5 inline-block">
                <Button variant="outline">{t("aboutLink")} →</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section-dark px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white">{t("ctaTitle")}</h2>
          <p className="mt-4 text-base text-white/60">{t("ctaSubtitle")}</p>
          <div className="mt-8">
            <Link href={`/${locale}/register`}>
              <Button size="lg" className="gap-2">
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
