import { requireAdmin } from "@/server/auth";

export default async function AdminNavigationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Navigasyon</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Site menüsü ve navigasyon ayarları.</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">Navigasyon editörü yakında eklenecek.</p>
      </div>
    </div>
  );
}
