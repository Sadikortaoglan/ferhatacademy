import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { CompleteTaskButton } from "@/features/dashboard/components/complete-task-button";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const t = await getTranslations("program");

  const assignments = await prisma.assignment.findMany({
    where: { userId: session!.user.id, status: "ACTIVE" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { lesson: { include: { translations: true, module: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">{t("noProgramTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("noProgramDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const completed = assignment.items.filter((i) => !!i.completedAt).length;
            const total = assignment.items.length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <Card key={assignment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {completed}/{total} {t("progress")}
                    </Badge>
                  </div>
                  <div className="h-2 bg-border rounded-full mt-2">
                    <div
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignment.items.map((item, idx) => {
                    const isCompleted = !!item.completedAt;
                    const lessonTitle =
                      item.lesson?.translations.find((tr) => tr.locale === locale)
                        ?.title ?? item.lesson?.translations[0]?.title;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isCompleted ? "border-border bg-muted/30" : "border-border"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              {idx + 1}.
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.type === "LESSON" ? t("lessonType") : t("taskType")}
                            </Badge>
                            {item.isRequired ? (
                              <Badge variant="secondary" className="text-xs">
                                {t("required")}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {t("optional")}
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-sm font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}
                          >
                            {item.type === "LESSON"
                              ? lessonTitle ?? item.title
                              : item.title}
                          </p>
                          {item.instructions && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.instructions}
                            </p>
                          )}
                        </div>
                        {!isCompleted && item.type === "LESSON" && item.lessonId && item.lesson && (
                          <Link
                            href={`/${locale}/dashboard/courses/${item.lesson.module.courseId}/lessons/${item.lessonId}`}
                            className="shrink-0"
                          >
                            <Button size="sm" variant="outline">
                              {t("continueLesson")}
                            </Button>
                          </Link>
                        )}
                        {!isCompleted && item.type === "TASK" && (
                          <CompleteTaskButton itemId={item.id} />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
