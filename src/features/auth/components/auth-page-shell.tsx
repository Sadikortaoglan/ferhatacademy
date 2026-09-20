import Link from "next/link";

const NAV_LINKS = [
  { href: (locale: string) => `/${locale}/courses`, label: "Eğitimler" },
  { href: (locale: string) => `/${locale}/products`, label: "Ürünler" },
  { href: (locale: string) => `/${locale}/about`, label: "Hakkında" },
];

export function AuthPageShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-lg font-black text-primary tracking-tight">
            Ferhat Academy
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href(locale)} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground transition-colors">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {children}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border bg-surface py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Ferhat Academy</span>
          <div className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href(locale)} className="hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
