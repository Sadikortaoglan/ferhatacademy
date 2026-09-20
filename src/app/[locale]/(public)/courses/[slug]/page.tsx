import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { canAccessCourse } from "@/server/access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, FileText } from "lucide-react";

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("courses");

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      translations: true,
      modules: {
        orderBy: { position: "asc" },
        include: {
          translations: true,
          lessons: {
            orderBy: { position: "asc" },
            include: { translations: true },
          },
        },
      },
    },
  });

  if (!course || course.status === "DRAFT") notFound();
  const isArchived = course.status === "ARCHIVED";

  const session = await getSession();
  const hasAccess = session?.user
    ? await canAccessCourse(session.user.id, course.id)
    : false;

  const courseTr = course.translations.find((tr) => tr.locale === locale) ?? course.translations[0];
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Arşiv uyarısı */}
      {isArchived && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-background px-4 py-3 text-sm text-warning-foreground">
          <span className="text-base">📦</span>
          <span>Bu kurs artık aktif değil — yeni kayıt alınmıyor. İçeriklere yine de ulaşabilirsin.</span>
        </div>
      )}

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
              {courseTr?.title ?? "—"}
            </h1>
            {isArchived && <Badge variant="secondary">Arşiv</Badge>}
          </div>
          {courseTr?.shortDescription && (
            <p className="text-muted-foreground text-lg">{courseTr.shortDescription}</p>
          )}
          <p className="text-sm text-muted-foreground">{totalLessons} ders</p>
          {hasAccess ? (
            <Link href={`/${locale}/dashboard/courses/${course.id}`}>
              <Button size="lg">{t("goToCourse")}</Button>
            </Link>
          ) : isArchived ? (
            <Button size="lg" variant="outline" disabled>Kayıt Kapalı</Button>
          ) : session?.user ? (
            <Button size="lg" variant="outline" disabled>{t("noAccess")}</Button>
          ) : (
            <Link href={`/${locale}/login`}>
              <Button size="lg">{t("loginToAccess")}</Button>
            </Link>
          )}
        </div>
        <div className="aspect-video rounded-xl overflow-hidden bg-muted">
          {course.coverImageUrl ? (
            <img src={course.coverImageUrl} alt={courseTr?.title ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-6xl font-black text-primary/20 uppercase tracking-widest">
                {(courseTr?.title ?? "").slice(0, 2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {courseTr?.description && (
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{courseTr.description}</p>
        </div>
      )}

      {/* Curriculum */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t("curriculum")}</h2>
        <div className="space-y-3">
          {course.modules.map((mod) => {
            const modTr = mod.translations.find((tr) => tr.locale === locale) ?? mod.translations[0];
            return (
              <div key={mod.id} className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 font-medium text-sm">
                  {modTr?.title ?? "—"}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({mod.lessons.length} ders)
                  </span>
                </div>
                <div>
                  {mod.lessons.map((lesson) => {
                    const lessonTr =
                      lesson.translations.find((tr) => tr.locale === locale) ??
                      lesson.translations[0];
                    const isAccessible =
                      lesson.visibility === "PUBLIC" || lesson.isPreview || hasAccess;
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 px-4 py-3 border-t border-border text-sm"
                      >
                        <div className="shrink-0 text-muted-foreground">
                          {lesson.type === "TEXT" ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </div>
                        <span className={isAccessible ? "text-foreground" : "text-muted-foreground"}>
                          {lessonTr?.title ?? "—"}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          {lesson.isPreview && (
                            <Badge variant="secondary" className="text-xs">Preview</Badge>
                          )}
                          {!isAccessible && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {hasAccess && (
                            <Link
                              href={`/${locale}/dashboard/courses/${course.id}/lessons/${lesson.id}`}
                              className="text-primary text-xs hover:underline"
                            >
                              İzle
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
