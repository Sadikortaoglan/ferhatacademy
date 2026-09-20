import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ActionLink } from "@/components/shared/admin-actions";
import { Plus, BookOpen } from "lucide-react";

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  const courses = await prisma.course.findMany({
    include: {
      translations: true,
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { entitlements: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusVariant = {
    DRAFT: "secondary" as const,
    PUBLISHED: "success" as const,
    ARCHIVED: "outline" as const,
  };

  const statusLabel = {
    DRAFT: t("draft"),
    PUBLISHED: t("published"),
    ARCHIVED: t("archived"),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("courses")}>
        <Link href={`/${locale}/admin/courses/new`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createCourse")}
          </Button>
        </Link>
      </PageHeader>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("noCourses")}</p>
            <Link href={`/${locale}/admin/courses/new`} className="mt-4">
              <Button>{t("createCourse")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Başlık</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Modül/Ders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("courseStatus")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => {
                const title =
                  course.translations.find((tr) => tr.locale === locale)?.title ??
                  course.translations.find((tr) => tr.locale === "tr")?.title ??
                  course.slug;
                const lessonCount = course.modules.flatMap((m) => m.lessons).length;
                return (
                  <tr key={course.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{course.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {course.modules.length} modül · {lessonCount} ders
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[course.status]}>
                        {statusLabel[course.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionLink href={`/${locale}/admin/courses/${course.id}`} variant="edit" icon="edit" label={t("editCourse")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
