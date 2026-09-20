import { requireAdmin } from "@/server/auth";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar locale={locale} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface flex items-center px-4 md:px-6 shrink-0 gap-3">
          <AdminMobileNav locale={locale} />
          <span className="text-sm text-muted-foreground">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
