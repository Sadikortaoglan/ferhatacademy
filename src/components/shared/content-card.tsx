import Link from "next/link";
import { cn } from "@/lib/utils";
import { Lock, Play, UserPlus } from "lucide-react";
import type { MockFreeContent, VisibilityType } from "@/config/mock-content";

const visibilityConfig: Record<
  VisibilityType,
  { labelTr: string; labelEn: string; icon: React.ElementType; badgeClass: string }
> = {
  PUBLIC: {
    labelTr: "Ücretsiz",
    labelEn: "Free",
    icon: Play,
    badgeClass: "bg-success text-white",
  },
  REGISTERED: {
    labelTr: "Ücretsiz Kayıt",
    labelEn: "Free Register",
    icon: UserPlus,
    badgeClass: "bg-blue-600 text-white",
  },
  ENTITLED: {
    labelTr: "Erişim Gerekli",
    labelEn: "Access Required",
    icon: Lock,
    badgeClass: "bg-primary text-primary-foreground",
  },
  PRIVATE: {
    labelTr: "Özel",
    labelEn: "Private",
    icon: Lock,
    badgeClass: "bg-muted text-muted-foreground",
  },
};

interface ContentCardProps {
  content: MockFreeContent;
  locale: string;
}

export function ContentCard({ content, locale }: ContentCardProps) {
  const isTr = locale === "tr";
  const title = isTr ? content.titleTr : content.titleEn;
  const desc = isTr ? content.descTr : content.descEn;
  const vis = visibilityConfig[content.visibility];
  const Icon = vis.icon;
  const href = content.href ? `/${locale}${content.href}` : undefined;

  const card = (
    <div className="rounded-xl overflow-hidden border border-border bg-surface group-hover:border-primary/50 transition-colors">
      {/* Cover */}
      <div
        className={cn(
          "aspect-video w-full flex items-center justify-center relative",
          content.coverBg
        )}
      >
        <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
          <Play className="h-8 w-8 text-white fill-white" />
        </div>
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
              vis.badgeClass
            )}
          >
            <Icon className="h-3 w-3" />
            {isTr ? vis.labelTr : vis.labelEn}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {content.durationLabel}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm leading-snug">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{desc}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block cursor-pointer">
        {card}
      </Link>
    );
  }

  return <div className="group">{card}</div>;
}
