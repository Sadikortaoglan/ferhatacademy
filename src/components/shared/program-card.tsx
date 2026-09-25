import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MockProgram } from "@/config/mock-content";

const typeLabels: Record<string, { tr: string; en: string }> = {
  COURSE: { tr: "Kurs", en: "Course" },
  LIVE_TRAINING: { tr: "Canlı Eğitim", en: "Live Training" },
  MENTORSHIP: { tr: "Mentorluk", en: "Mentorship" },
  MEMBERSHIP: { tr: "Üyelik", en: "Membership" },
  DIGITAL_PRODUCT: { tr: "Dijital Ürün", en: "Digital Product" },
  SINGLE_VIDEO: { tr: "Video", en: "Video" },
};

interface ProgramCardProps {
  program: MockProgram;
  locale: string;
  href?: string;
}

export function ProgramCard({ program, locale, href }: ProgramCardProps) {
  const isTr = locale === "tr";
  const title = isTr ? program.titleTr : program.titleEn;
  const shortDesc = isTr ? program.shortDescTr : program.shortDescEn;
  const typeLabel = typeLabels[program.type]?.[isTr ? "tr" : "en"] ?? program.type;
  const target = href ?? `/${locale}/courses`;

  return (
    <Link
      href={target}
      className="card-themed group block rounded-xl overflow-hidden border border-border bg-surface hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Cover area */}
      <div
        className={cn(
          "aspect-video w-full flex items-center justify-center relative",
          program.coverBg
        )}
      >
        <span className="text-4xl font-black text-white/10 select-none uppercase tracking-widest">
          {title.slice(0, 2)}
        </span>
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{shortDesc}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {program.lessonCount && <span>{program.lessonCount} ders</span>}
            {program.durationLabel && <span>{program.durationLabel}</span>}
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              program.price === null ? "text-success" : "text-foreground"
            )}
          >
            {program.price === null ? (isTr ? "Ücretsiz" : "Free") : program.price}
          </span>
        </div>
      </div>
    </Link>
  );
}
