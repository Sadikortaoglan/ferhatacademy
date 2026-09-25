import Link from "next/link";

interface CourseCardProps {
  course: {
    id: string;
    slug: string;
    status?: string;
    coverImageUrl: string | null;
    translations: { locale: string; title: string; shortDescription: string | null }[];
    modules: { lessons: { id: string }[] }[];
  };
  locale: string;
}

export function CourseCard({ course, locale }: CourseCardProps) {
  const translation =
    course.translations.find((tr) => tr.locale === locale) ??
    course.translations[0];
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <Link
      href={`/${locale}/courses/${course.slug}`}
      className="card-themed group block rounded-xl overflow-hidden border border-border bg-surface hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="aspect-video w-full bg-muted relative overflow-hidden">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt={translation?.title ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-black text-primary/20 uppercase tracking-widest">
              {(translation?.title ?? "").slice(0, 2)}
            </span>
          </div>
        )}
        {course.status === "ARCHIVED" && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            📦 Arşiv
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
          {translation?.title ?? "—"}
        </h3>
        {translation?.shortDescription && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {translation.shortDescription}
          </p>
        )}
        {lessonCount > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">{lessonCount} ders</p>
        )}
      </div>
    </Link>
  );
}
