"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicHeaderProps {
  locale: string;
  user?: { name: string | null; email: string; role: string } | null;
}

export function PublicHeader({ locale, user }: PublicHeaderProps) {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const otherLocale = locale === "tr" ? "en" : "tr";

  const navLinks = [
    { href: `/${locale}/academy`, label: t("academy") },
    { href: `/${locale}/courses`, label: t("courses") },
    { href: `/${locale}/live`, label: t("live") },
    { href: `/${locale}/products`, label: t("products") },
    { href: `/${locale}/about`, label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="text-xl font-black text-primary tracking-tight shrink-0"
        >
          Ferhat Academy
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href={`/${otherLocale}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
          >
            {otherLocale}
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link href={`/${locale}/admin`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href={`/${locale}/dashboard`}>
                <Button size="sm" className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {user.name ?? t("dashboard")}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">{tAuth("login")}</Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button size="sm">{t("joinAcademy")}</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: locale + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href={`/${otherLocale}`}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2"
          >
            {otherLocale}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">{t("dashboard")}</Button>
                  </Link>
                  {isAdmin && (
                    <Link href={`/${locale}/admin`} onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Admin Paneli</Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href={`/${locale}/login`} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">{tAuth("login")}</Button>
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">{t("joinAcademy")}</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
