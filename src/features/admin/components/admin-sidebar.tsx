"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Eye,
  ScrollText,
  ShoppingBag,
  FileText,
  CreditCard,
  Receipt,
} from "lucide-react";

const getNavItems = (locale: string) => [
  { href: `/${locale}/admin`, label: "admin.overview", icon: LayoutDashboard, exact: true },
  { href: `/${locale}/admin/users`, label: "admin.users", icon: Users, exact: false },
  { href: `/${locale}/admin/courses`, label: "admin.courses", icon: BookOpen, exact: false },
  { href: `/${locale}/admin/products`, label: "admin.products", icon: ShoppingBag, exact: false },
  { href: `/${locale}/admin/applications`, label: "admin.applications", icon: FileText, exact: false },
  { href: `/${locale}/admin/orders`, label: "admin.orders", icon: Receipt, exact: false },
  { href: `/${locale}/admin/payments`, label: "admin.payments", icon: CreditCard, exact: false },
  { href: `/${locale}/admin/assignments`, label: "admin.assignments", icon: ClipboardList, exact: false },
  { href: `/${locale}/admin/access`, label: "admin.access", icon: ShieldCheck, exact: false },
  { href: `/${locale}/admin/audit`, label: "admin.auditLog", icon: ScrollText, exact: false },
  { href: `/${locale}/admin/settings`, label: "admin.settings", icon: Settings, exact: false },
];

interface AdminSidebarProps {
  locale: string;
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="w-64 border-r border-border bg-surface hidden md:flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href={`/${locale}/admin`} className="text-lg font-bold text-primary">
          Ferhat Academy
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {getNavItems(locale).map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
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
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          <Eye className="h-4 w-4" />
          {t("admin.memberView")}
        </Link>
      </div>
    </aside>
  );
}
