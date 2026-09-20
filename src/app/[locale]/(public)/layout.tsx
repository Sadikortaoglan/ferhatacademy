import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { getSession } from "@/server/auth";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email, role: (session.user as { role?: string }).role ?? "USER" }
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader locale={locale} user={user} />
      <main className="flex-1">{children}</main>
      <PublicFooter locale={locale} />
    </div>
  );
}
