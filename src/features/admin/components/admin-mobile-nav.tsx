"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Eye,
  Menu,
  X,
  ScrollText,
  Globe,
  Palette,
  FileText,
  LayoutTemplate,
} from "lucide-react";

const getNavItems = (locale: string) => [
  { href: `/${locale}/admin`, label: "admin.overview", icon: LayoutDashboard, exact: true },
  { href: `/${locale}/admin/users`, label: "admin.users", icon: Users, exact: false },
  { href: `/${locale}/admin/courses`, label: "admin.courses", icon: BookOpen, exact: false },
  { href: `/${locale}/admin/assignments`, label: "admin.assignments", icon: ClipboardList, exact: false },
  { href: `/${locale}/admin/applications`, label: "admin.applications", icon: FileText, exact: false },
  { href: `/${locale}/admin/applications/templates`, label: "admin.formTemplates", icon: FileText, exact: false },
  { href: `/${locale}/admin/access`, label: "admin.access", icon: ShieldCheck, exact: false },
  { href: `/${locale}/admin/audit`, label: "admin.auditLog", icon: ScrollText, exact: false },
  { href: `/${locale}/admin/website/homepage`, label: "admin.homepage", icon: LayoutTemplate, exact: false },
  { href: `/${locale}/admin/website/navigation`, label: "admin.navigation", icon: Globe, exact: false },
  { href: `/${locale}/admin/website/appearance`, label: "admin.appearance", icon: Palette, exact: false },
  { href: `/${locale}/admin/settings`, label: "admin.settings", icon: Settings, exact: false },
];

export function AdminMobileNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <>
      <button
        className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <Link href={`/${locale}/admin`} className="text-lg font-bold text-primary" onClick={() => setOpen(false)}>
                Ferhat Academy
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
              {getNavItems(locale).map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(label)}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border">
              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                <Eye className="h-4 w-4" />
                {t("admin.memberView")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
