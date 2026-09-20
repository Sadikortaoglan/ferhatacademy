import Link from "next/link";
import { Eye, Pencil, Trash2, ShieldCheck, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  // Ana işlem — turuncu dolu
  primary: "inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
  // Düzenle / Detay — mavi dolu
  view: "inline-flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm",
  edit: "inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
  // Silme / iptal — kırmızı
  danger: "inline-flex items-center gap-1.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-sm",
  // Onayla / Yayınla — yeşil
  success: "inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm",
  // Geri / İptal — soluk, outline
  secondary: "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
};

const ICONS = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
  grant: ShieldCheck,
  activate: CheckCircle,
  deactivate: XCircle,
  back: ArrowLeft,
};

interface ActionLinkProps {
  href: string;
  variant?: keyof typeof VARIANTS;
  icon?: keyof typeof ICONS;
  label: string;
  className?: string;
}

export function ActionLink({ href, variant = "view", icon, label, className }: ActionLinkProps) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <Link href={href} className={cn(VARIANTS[variant], className)}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {label}
    </Link>
  );
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  icon?: keyof typeof ICONS;
  label: string;
}

export function ActionButton({ variant = "secondary", icon, label, className, ...props }: ActionButtonProps) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <button type="button" className={cn(VARIANTS[variant], className)} {...props}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {label}
    </button>
  );
}
