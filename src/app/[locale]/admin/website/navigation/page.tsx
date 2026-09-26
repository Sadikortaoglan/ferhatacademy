import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { NavEditor } from "./nav-editor";

export default async function AdminNavigationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  const items = await prisma.navItem.findMany({ orderBy: { position: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Navigasyon</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hangi sayfaların navbar ve footer&apos;da görüneceğini, sıralamasını ve görünürlüğünü yönetin.
        </p>
      </div>
      <NavEditor locale={locale} initialItems={items} />
    </div>
  );
}
