import { requireAdmin } from "@/server/auth";
import { getHomepageAdminConfig } from "./actions";
import { HomepageEditor } from "./homepage-editor";

export default async function AdminHomepagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const config = await getHomepageAdminConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Ana Sayfa Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sitenin ana sayfasını kod yazmadan düzenle ve yayınla.
        </p>
      </div>
      <HomepageEditor initialConfig={config} locale={locale} />
    </div>
  );
}
