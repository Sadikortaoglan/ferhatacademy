import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/server/settings";
import { PageHeader } from "@/components/shared/page-header";
import { SiteSettingsForm } from "@/features/admin/components/site-settings-form";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settingsTitle")}
        description={t("settingsDesc")}
      />
      <SiteSettingsForm settings={settings} locale={locale} />
    </div>
  );
}
