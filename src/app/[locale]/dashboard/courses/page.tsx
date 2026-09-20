import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { getUserCourses, getCourseProgress } from "@/server/access";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function MyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const t = await getTranslations("dashboard");
  const tCourses = await getTranslations("courses");

  const courses = await getUserCourses(session!.user.id);

  return (
    <div className="space-y-6">
      <PageHeader title={t("myCourses")} />
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">{tCourses("noCoursesTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {tCourses("noCoursesDesc")}
            </p>
            <Link href={`/${locale}/courses`} className="mt-4">
              <Button>{tCourses("discoverCta")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            if (!course) return null;
            const { completed, total, percent } = getCourseProgress(course);
            const title =
              course.translations.find((tr) => tr.locale === locale)?.title ??
              course.translations[0]?.title ??
              "—";
            const shortDesc =
              course.translations.find((tr) => tr.locale === locale)?.shortDescription ??
              course.translations[0]?.shortDescription;
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <div
                  className="aspect-video bg-muted flex items-center justify-center"
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
                    <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{title}</h3>
                  {shortDesc && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {shortDesc}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {completed}/{total} {tCourses("lessons")}
                      </span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full">
                      <div
                        className="h-1.5 bg-primary rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <Link href={`/${locale}/dashboard/courses/${course.id}`} className="block mt-3">
                    <Button variant={percent > 0 ? "default" : "outline"} className="w-full" size="sm">
                      {percent > 0 ? tCourses("continue") : tCourses("start")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
