import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { canAccessCourse } from "@/server/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, PlayCircle, FileText, CheckCircle2, ChevronRight } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, courseId } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);

  const hasAccess = await canAccessCourse(session.user.id, courseId);
  if (!hasAccess) redirect(`/${locale}/dashboard/courses`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      translations: true,
      modules: {
        orderBy: { position: "asc" },
        include: {
          translations: true,
          lessons: {
            orderBy: { position: "asc" },
            include: {
              translations: true,
              progress: { where: { userId: session.user.id } },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const t = await getTranslations("courses");
  const tLesson = await getTranslations("lesson");

  const title =
    course.translations.find((tr) => tr.locale === locale)?.title ??
    course.translations[0]?.title ??
    "—";

  const totalLessons = course.modules.flatMap((m) => m.lessons).length;
  const completedLessons = course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.progress[0]?.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader title={title}>
        <Link href={`/${locale}/dashboard/courses`}>
          <Button variant="outline" size="sm">← {t("title")}</Button>
        </Link>
      </PageHeader>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{totalLessons} {t("lessons")}</span>
        <span>•</span>
        <span>{completedLessons}/{totalLessons} {t("progress")}</span>
        <div className="flex-1 max-w-32 h-1.5 bg-border rounded-full">
          <div
            className="h-1.5 bg-primary rounded-full"
            style={{
              width: totalLessons > 0
                ? `${Math.round((completedLessons / totalLessons) * 100)}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("curriculum")}</h2>
        {course.modules.map((mod) => {
          const modTitle =
            mod.translations.find((tr) => tr.locale === locale)?.title ??
            mod.translations[0]?.title ??
            "—";
          return (
            <Card key={mod.id}>
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <h3 className="font-medium text-sm">{modTitle}</h3>
              </div>
              <div className="divide-y divide-border">
                {mod.lessons.map((lesson) => {
                  const lessonTitle =
                    lesson.translations.find((tr) => tr.locale === locale)?.title ??
                    lesson.translations[0]?.title ??
                    "—";
                  const isCompleted = lesson.progress[0]?.status === "COMPLETED";
                  const isInProgress = lesson.progress[0]?.status === "IN_PROGRESS";
                  const isLocked =
                    lesson.visibility === "ENTITLED" || lesson.visibility === "PRIVATE";

                  return (
                    <Link
                      key={lesson.id}
                      href={`/${locale}/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : lesson.type === "TEXT" ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="flex-1 text-sm">{lessonTitle}</span>
                      {lesson.isPreview && (
                        <Badge variant="success" className="text-xs">
                          {t("freeLesson")}
                        </Badge>
                      )}
                      {isInProgress && (
                        <span className="text-xs text-primary">
                          {lesson.progress[0]?.progressPercent}%
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
