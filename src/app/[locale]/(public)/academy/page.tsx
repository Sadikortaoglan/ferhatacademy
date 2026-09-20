import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/section";
import { ProgramCard } from "@/components/shared/program-card";
import { mockPrograms } from "@/config/mock-content";

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations("navigation");
  const t = await getTranslations("home");

  return (
    <>
      <section className="section-dark px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-[hsl(0_0%_95%)]">
            {tNav("academy")}
          </h1>
          <p className="mt-4 text-lg text-[hsl(220_15%_65%)] max-w-xl mx-auto">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      <Section title={t("featuredTitle")} subtitle={t("featuredSubtitle")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} locale={locale} />
          ))}
        </div>
      </Section>
    </>
  );
}
