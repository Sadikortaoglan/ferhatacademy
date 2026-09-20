import { getTranslations } from "next-intl/server";
import { User2, MonitorPlay } from "lucide-react";
import { Section } from "@/components/shared/section";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("live");

  return (
    <>
      <section className="section-dark px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-[hsl(0_0%_95%)]">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[hsl(220_15%_65%)] max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <User2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t("oneOnOne")}</h2>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <MonitorPlay className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{t("groupWorkshop")}</h2>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface p-8 max-w-xl mx-auto text-center">
          <h3 className="text-lg font-bold text-foreground">{t("contactTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("contactSubtitle")}</p>
        </div>
      </Section>
    </>
  );
}
