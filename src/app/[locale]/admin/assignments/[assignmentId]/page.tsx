import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/shared/admin-actions";
import { AssignmentEditor } from "@/features/admin/components/assignment-editor";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; assignmentId: string }>;
}) {
  const { locale, assignmentId } = await params;
  const t = await getTranslations("admin");

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          lesson: {
            include: { translations: true },
          },
        },
      },
    },
  });

  if (!assignment) notFound();

  // Fetch all lessons for the item selector
  const lessons = await prisma.lesson.findMany({
    include: {
      translations: true,
      module: {
        include: { translations: true },
      },
    },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
  });

  const availableLessons = lessons.map((l) => ({
    id: l.id,
    moduleTitle:
      l.module.translations.find((t) => t.locale === locale)?.title ??
      l.module.translations[0]?.title ??
      "—",
    translations: l.translations,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.user.name ?? assignment.user.email}`}
      >
        <div className="flex items-center gap-2">
          <Badge variant={assignment.status === "ACTIVE" ? "default" : "secondary"}>
            {assignment.status}
          </Badge>
          <ActionLink href={`/${locale}/admin/users/${assignment.userId}`} variant="view" icon="view" label="Kullanıcı Profili" />
          <ActionLink href={`/${locale}/admin/assignments`} variant="secondary" icon="back" label={t("assignments")} />
        </div>
      </PageHeader>

      <AssignmentEditor
        assignment={assignment}
        availableLessons={availableLessons}
        locale={locale}
      />
    </div>
  );
}
