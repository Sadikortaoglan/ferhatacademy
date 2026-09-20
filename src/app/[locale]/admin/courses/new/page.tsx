import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { CreateCourseForm } from "@/features/admin/components/create-course-form";
import { ActionLink } from "@/components/shared/admin-actions";

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <PageHeader title={t("createCourse")}>
        <ActionLink href={`/${locale}/admin/courses`} variant="secondary" icon="back" label={t("courses")} />
      </PageHeader>
      <CreateCourseForm locale={locale} />
    </div>
  );
}
