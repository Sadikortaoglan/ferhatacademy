import { prisma } from "@/lib/prisma";

export async function getUserEntitlements(userId: string) {
  const now = new Date();
  return prisma.entitlement.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
    },
    include: {
      course: { include: { translations: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function canAccessLesson(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) return false;
  if (lesson.visibility === "PUBLIC") return true;
  if (lesson.isPreview) return true;
  if (lesson.visibility === "REGISTERED") return true;

  const now = new Date();
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        {
          OR: [
            { resourceType: "LESSON", resourceId: lessonId },
            { resourceType: "COURSE", resourceId: lesson.module.courseId },
          ],
        },
      ],
    },
  });
  return !!entitlement;
}

export async function canAccessCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const now = new Date();
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      resourceType: "COURSE",
      resourceId: courseId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
    },
  });
  return !!entitlement;
}

export async function getUserCourses(userId: string) {
  const now = new Date();
  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      resourceType: "COURSE",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
    },
    include: {
      course: {
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
                  progress: { where: { userId } },
                },
              },
            },
          },
        },
      },
    },
  });
  const courses = entitlements.map((e) => e.course).filter(Boolean);
  const seen = new Set<string>();
  return courses.filter((c) => {
    if (!c || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export function getCourseProgress(
  course: Awaited<ReturnType<typeof getUserCourses>>[number]
) {
  if (!course) return { total: 0, completed: 0, percent: 0 };
  const lessons = course.modules.flatMap((m) => m.lessons);
  const total = lessons.length;
  const completed = lessons.filter(
    (l) => l.progress[0]?.status === "COMPLETED"
  ).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}
