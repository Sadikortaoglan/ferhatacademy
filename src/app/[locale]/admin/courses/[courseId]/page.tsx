import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseOverviewForm } from "@/features/admin/components/course-overview-form";
import { CurriculumBuilder } from "@/features/admin/components/curriculum-builder";
import { publishCourse, archiveCourse } from "@/features/admin/actions/courses";
import { AdminTabs } from "@/components/shared/admin-tabs";

interface Props {
  params: Promise<{ locale: string; courseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminCourseEditorPage({ params, searchParams }: Props) {
  const { locale, courseId } = await params;
  const { tab = "overview" } = await searchParams;
  const t = await getTranslations("admin");

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
            include: { translations: true },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const title =
    course.translations.find((tr) => tr.locale === locale)?.title ??
    course.translations.find((tr) => tr.locale === "tr")?.title ??
    course.slug;

  const statusVariant = { DRAFT: "secondary" as const, PUBLISHED: "success" as const, ARCHIVED: "outline" as const };
  const statusLabel = { DRAFT: t("draft"), PUBLISHED: t("published"), ARCHIVED: t("archived") };

  const tabs = [
    { id: "overview", label: "📝  Genel Bilgi" },
    { id: "curriculum", label: "📚  Müfredat" },
    { id: "publish", label: "🚀  Yayınlama" },
  ];

  const basePath = `/${locale}/admin/courses/${courseId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${locale}/admin/courses`} className="text-sm text-muted-foreground hover:text-foreground">
              ← Kurslar
            </Link>
          </div>
          <h1 className="text-2xl font-black">{title}</h1>
        </div>
        <Badge variant={statusVariant[course.status]}>{statusLabel[course.status]}</Badge>
      </div>

      {/* Tabs */}
      <AdminTabs tabs={tabs} basePath={basePath} defaultTab="overview" />

      {/* Genel Bilgi */}
      {tab === "overview" && (
        <CourseOverviewForm course={course} locale={locale} />
      )}

      {/* Müfredat */}
      {tab === "curriculum" && (
        <CurriculumBuilder course={course} locale={locale} />
      )}

      {/* Yayınlama */}
      {tab === "publish" && (
        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Durum</span>
              <Badge variant={statusVariant[course.status]}>{statusLabel[course.status]}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Modül sayısı</span>
              <span>{course.modules.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Toplam ders</span>
              <span>{course.modules.reduce((s, m) => s + m.lessons.length, 0)}</span>
            </div>
          </div>

          {course.status === "DRAFT" && (
            <form action={async () => { "use server"; await publishCourse(courseId); }}>
              <Button type="submit" className="w-full">{t("publish")}</Button>
            </form>
          )}
          {course.status === "PUBLISHED" && (
            <form action={async () => { "use server"; await archiveCourse(courseId); }}>
              <Button type="submit" variant="outline" className="w-full">{t("archive")}</Button>
            </form>
          )}
          {course.status === "ARCHIVED" && (
            <form action={async () => { "use server"; await publishCourse(courseId); }}>
              <Button type="submit" className="w-full">Yeniden Yayınla</Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            Public URL:{" "}
            <span className="font-mono">/{locale}/courses/{course.slug}</span>
          </p>
        </div>
      )}
    </div>
  );
}
