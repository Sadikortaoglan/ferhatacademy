import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { getUserCourses, getCourseProgress } from "@/server/access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Video,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const t = await getTranslations("dashboard");
  const tProg = await getTranslations("program");

  const userId = session!.user.id;

  const [courses, assignments, lastProgress] = await Promise.all([
    getUserCourses(userId),
    prisma.assignment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { lesson: { include: { translations: true, module: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    prisma.lessonProgress.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { lastViewedAt: "desc" },
      include: {
        lesson: {
          include: {
            translations: true,
            module: {
              include: {
                course: { include: { translations: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const activeAssignment = assignments[0];
  const completedItems =
    activeAssignment?.items.filter((i) => !!i.completedAt).length ?? 0;
  const totalItems = activeAssignment?.items.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("welcome")}, {session?.user.name ?? session?.user.email?.split("@")[0]} 👋
        </h1>
      </div>

      {/* Continue Learning */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {t("continueLearning")}
        </h2>
        {lastProgress ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {lastProgress.lesson.module.course.translations.find(
                      (tr) => tr.locale === locale
                    )?.title ??
                      lastProgress.lesson.module.course.translations[0]?.title}
                  </p>
                  <p className="font-semibold text-foreground truncate">
                    {lastProgress.lesson.translations.find(
                      (tr) => tr.locale === locale
                    )?.title ??
                      lastProgress.lesson.translations[0]?.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 bg-border rounded-full flex-1 max-w-48">
                      <div
                        className="h-1.5 bg-primary rounded-full"
                        style={{ width: `${lastProgress.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {lastProgress.progressPercent}%
                    </span>
                  </div>
                </div>
                <Link
                  href={`/${locale}/dashboard/courses/${lastProgress.lesson.module.courseId}/lessons/${lastProgress.lessonId}`}
                >
                  <Button size="sm" className="shrink-0">
                    {t("continue")} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-foreground font-medium">{t("noProgress")}</p>
              </div>
              <Link href={`/${locale}/dashboard/courses`}>
                <Button variant="outline" size="sm">
                  {t("noProgressCta")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* My Courses */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {t("myCourses")}
          </h2>
          {courses.length > 0 && (
            <Link href={`/${locale}/dashboard/courses`}>
              <Button variant="ghost" size="sm">
                Tümü <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          )}
        </div>
        {courses.length === 0 ? (
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-foreground font-medium">{t("noCourses")}</p>
              </div>
              <Link href={`/${locale}/courses`}>
                <Button variant="outline" size="sm">
                  {t("noCoursesCta")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => {
              if (!course) return null;
              const { completed, total, percent } = getCourseProgress(course);
              const title =
                course.translations.find((tr) => tr.locale === locale)?.title ??
                course.translations[0]?.title ??
                "—";
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div
                      className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden"
                      style={
                        course.coverImageUrl
                          ? {
                              backgroundImage: `url(${course.coverImageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : {}
                      }
                    >
                      {!course.coverImageUrl && (
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm truncate">{title}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {completed}/{total} {t("completed")}
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full">
                        <div
                          className="h-1.5 bg-primary rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/courses/${course.id}`}
                      className="block mt-3"
                    >
                      <Button size="sm" variant="outline" className="w-full">
                        {percent > 0 ? t("continue") : t("open")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* My Program */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t("assignedProgram")}
        </h2>
        {!activeAssignment ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">{t("noProgram")}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{activeAssignment.title}</CardTitle>
                <Badge variant="secondary">
                  {completedItems}/{totalItems} {tProg("progress")}
                </Badge>
              </div>
              <div className="h-1.5 bg-border rounded-full mt-2">
                <div
                  className="h-1.5 bg-primary rounded-full"
                  style={{
                    width:
                      totalItems > 0
                        ? `${Math.round((completedItems / totalItems) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAssignment.items.slice(0, 4).map((item) => {
                const isCompleted = !!item.completedAt;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`text-sm flex-1 truncate ${isCompleted ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.type === "LESSON"
                        ? (item.lesson?.translations.find((tr) => tr.locale === locale)
                            ?.title ??
                          item.lesson?.translations[0]?.title ??
                          item.title)
                        : item.title}
                    </span>
                    {!isCompleted && item.type === "LESSON" && item.lessonId && item.lesson && (
                      <Link
                        href={`/${locale}/dashboard/courses/${item.lesson.module.courseId}/lessons/${item.lessonId}`}
                      >
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          {tProg("continueLesson")}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
              {totalItems > 4 && (
                <Link href={`/${locale}/dashboard/program`}>
                  <Button variant="ghost" size="sm" className="w-full">
                    +{totalItems - 4} {tProg("steps")}{" "}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
