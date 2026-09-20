import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { canAccessLesson } from "@/server/access";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/features/dashboard/components/video-player";
import { MarkCompleteButton } from "@/features/dashboard/components/mark-complete-button";
import { Lock } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { locale, courseId, lessonId } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);

  const hasAccess = await canAccessLesson(session.user.id, lessonId);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      translations: true,
      module: {
        include: {
          course: { include: { translations: true } },
          lessons: {
            orderBy: { position: "asc" },
            include: { translations: true },
          },
        },
      },
      progress: { where: { userId: session.user.id } },
    },
  });

  if (!lesson || lesson.module.courseId !== courseId) notFound();

  const t = await getTranslations("lesson");

  const title =
    lesson.translations.find((tr) => tr.locale === locale)?.title ??
    lesson.translations[0]?.title ??
    "—";
  const description =
    lesson.translations.find((tr) => tr.locale === locale)?.description ??
    lesson.translations[0]?.description;
  const content =
    lesson.translations.find((tr) => tr.locale === locale)?.content ??
    lesson.translations[0]?.content;

  const currentIndex = lesson.module.lessons.findIndex((l) => l.id === lessonId);
  const nextLesson = lesson.module.lessons[currentIndex + 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link href={`/${locale}/dashboard/courses/${courseId}`}>
          <Button variant="ghost" size="sm">
            ← {t("backToCourse")}
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-foreground">{title}</h1>

      {!hasAccess ? (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3">
          <Lock className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">{t("accessDenied")}</p>
          <Link href={`/${locale}/dashboard/courses/${courseId}`}>
            <Button variant="outline">{t("backToCourse")}</Button>
          </Link>
        </div>
      ) : lesson.type === "VIDEO" && lesson.videoProvider && lesson.videoExternalId ? (
        <VideoPlayer
          lessonId={lessonId}
          videoProvider={lesson.videoProvider}
          videoExternalId={lesson.videoExternalId}
          initialCompleted={lesson.progress[0]?.status === "COMPLETED"}
        />
      ) : lesson.type === "VIDEO" ? (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">{t("noVideo")}</p>
        </div>
      ) : null}

      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}

      {lesson.type === "TEXT" && content && hasAccess && (
        <div className="prose prose-sm max-w-none">
          <div className="rounded-lg border border-border p-6 bg-surface">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">{content}</p>
          </div>
        </div>
      )}

      {hasAccess && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            {lesson.type === "TEXT" && (
              <MarkCompleteButton
                lessonId={lessonId}
                initialCompleted={lesson.progress[0]?.status === "COMPLETED"}
              />
            )}
            {lesson.progress[0]?.status === "COMPLETED" && lesson.type !== "TEXT" && (
              <Badge variant="success">{t("completed")}</Badge>
            )}
          </div>
          {nextLesson && (
            <Link
              href={`/${locale}/dashboard/courses/${courseId}/lessons/${nextLesson.id}`}
            >
              <Button>
                {nextLesson.translations.find((tr) => tr.locale === locale)?.title ??
                  nextLesson.translations[0]?.title} →
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
