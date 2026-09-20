import { getTranslations } from "next-intl/server";
import { Section } from "@/components/shared/section";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/shared/course-card";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("courses");

  const courses = await prisma.course.findMany({
    where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
    include: {
      translations: true,
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <section className="section-dark px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-[hsl(0_0%_95%)]">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[hsl(220_15%_65%)] max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <Section>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">{t("noCourses")}</p>
        )}
      </Section>
    </>
  );
}
