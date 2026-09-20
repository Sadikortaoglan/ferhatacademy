"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Compass,
  ShieldCheck,
  Menu,
  X,
  UserCircle,
  ShoppingBag,
  FileText,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface DashboardNavProps {
  locale: string;
  user: { name?: string | null; email: string; role?: string };
}

export function DashboardNav({ locale, user }: DashboardNavProps) {
  const t = useTranslations("navigation");
  const tDash = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const navLinks = [
    { href: `/${locale}/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/dashboard/courses`, label: t("myCourses"), icon: BookOpen },
    { href: `/${locale}/dashboard/program`, label: t("myProgram"), icon: ClipboardList },
    { href: `/${locale}/dashboard/purchases`, label: t("purchases"), icon: ShoppingBag },
    { href: `/${locale}/dashboard/applications`, label: "Başvurularım", icon: FileText },
    { href: `/${locale}/courses`, label: t("discover"), icon: Compass },
  ];

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <>
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-primary shrink-0">
              Ferhat Academy
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    pathname === href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href={`/${locale}/admin`}>
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {tDash("adminPanel")}
                </Button>
              </Link>
            )}

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                </div>
                <span className="max-w-32 truncate">{user.name ?? user.email}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-surface shadow-xl z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-foreground truncate">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/profile`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCircle className="h-4 w-4" />
                      Profilim
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors border-t border-border"
                    >
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-16 left-0 right-0 bg-surface border-b border-border p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile user info */}
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {(user.name ?? user.email).slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <Link
              href={`/${locale}/dashboard/profile`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-muted"
            >
              <UserCircle className="h-4 w-4" />
              Profilim
            </Link>
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4" />
                {tDash("adminPanel")}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-danger hover:bg-danger/5 transition-colors border-t border-border mt-2 pt-3"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
