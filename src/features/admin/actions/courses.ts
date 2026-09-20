"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";

async function requireAdminActor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    throw new Error("Unauthorized");
  }
  return dbUser;
}

const courseSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  titleTr: z.string().min(1),
  titleEn: z.string().min(1),
  shortDescTr: z.string().optional(),
  shortDescEn: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

export async function createCourse(data: unknown) {
  const actor = await requireAdminActor();
  const parsed = courseSchema.parse(data);

  const course = await prisma.course.create({
    data: {
      slug: parsed.slug,
      translations: {
        create: [
          {
            locale: "tr",
            title: parsed.titleTr,
            shortDescription: parsed.shortDescTr,
          },
          {
            locale: "en",
            title: parsed.titleEn,
            shortDescription: parsed.shortDescEn,
          },
        ],
      },
      ...(parsed.coverImageUrl ? { coverImageUrl: parsed.coverImageUrl } : {}),
    },
  });

  await createAuditLog({
    action: "COURSE_CREATED",
    actorId: actor.id,
    targetId: course.id,
    targetType: "Course",
  });

  revalidatePath("/[locale]/admin/courses", "page");
  return course;
}

const updateCourseSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  titleTr: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  shortDescTr: z.string().optional(),
  shortDescEn: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

export async function updateCourse(id: string, data: unknown) {
  const actor = await requireAdminActor();
  const parsed = updateCourseSchema.parse(data);

  await prisma.$transaction(async (tx) => {
    if (parsed.slug || parsed.coverImageUrl !== undefined) {
      await tx.course.update({
        where: { id },
        data: {
          ...(parsed.slug ? { slug: parsed.slug } : {}),
          ...(parsed.coverImageUrl !== undefined ? { coverImageUrl: parsed.coverImageUrl } : {}),
        },
      });
    }
    if (parsed.titleTr !== undefined || parsed.shortDescTr !== undefined) {
      await tx.courseTranslation.upsert({
        where: { courseId_locale: { courseId: id, locale: "tr" } },
        update: {
          ...(parsed.titleTr ? { title: parsed.titleTr } : {}),
          ...(parsed.shortDescTr !== undefined ? { shortDescription: parsed.shortDescTr } : {}),
        },
        create: { courseId: id, locale: "tr", title: parsed.titleTr ?? "", shortDescription: parsed.shortDescTr },
      });
    }
    if (parsed.titleEn !== undefined || parsed.shortDescEn !== undefined) {
      await tx.courseTranslation.upsert({
        where: { courseId_locale: { courseId: id, locale: "en" } },
        update: {
          ...(parsed.titleEn ? { title: parsed.titleEn } : {}),
          ...(parsed.shortDescEn !== undefined ? { shortDescription: parsed.shortDescEn } : {}),
        },
        create: { courseId: id, locale: "en", title: parsed.titleEn ?? "", shortDescription: parsed.shortDescEn },
      });
    }
  });

  await createAuditLog({
    action: "COURSE_UPDATED",
    actorId: actor.id,
    targetId: id,
    targetType: "Course",
  });

  revalidatePath("/[locale]/admin/courses", "page");
}

export async function publishCourse(id: string) {
  const actor = await requireAdminActor();
  await prisma.course.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await createAuditLog({
    action: "COURSE_PUBLISHED",
    actorId: actor.id,
    targetId: id,
    targetType: "Course",
  });
  revalidatePath("/[locale]/admin/courses", "page");
}

export async function archiveCourse(id: string) {
  const actor = await requireAdminActor();
  await prisma.course.update({ where: { id }, data: { status: "ARCHIVED" } });
  await createAuditLog({
    action: "COURSE_UPDATED",
    actorId: actor.id,
    targetId: id,
    targetType: "Course",
    metadata: { change: "archived" },
  });
  revalidatePath("/[locale]/admin/courses", "page");
}

const moduleSchema = z.object({
  titleTr: z.string().min(1),
  titleEn: z.string().min(1),
});

export async function createModule(courseId: string, data: unknown) {
  await requireAdminActor();
  const parsed = moduleSchema.parse(data);
  const count = await prisma.module.count({ where: { courseId } });
  const mod = await prisma.module.create({
    data: {
      courseId,
      position: count + 1,
      translations: {
        create: [
          { locale: "tr", title: parsed.titleTr },
          { locale: "en", title: parsed.titleEn },
        ],
      },
    },
    include: { translations: true },
  });
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
  return mod;
}

export async function updateModule(id: string, data: unknown) {
  await requireAdminActor();
  const parsed = moduleSchema.parse(data);
  await prisma.$transaction([
    prisma.moduleTranslation.upsert({
      where: { moduleId_locale: { moduleId: id, locale: "tr" } },
      update: { title: parsed.titleTr },
      create: { moduleId: id, locale: "tr", title: parsed.titleTr },
    }),
    prisma.moduleTranslation.upsert({
      where: { moduleId_locale: { moduleId: id, locale: "en" } },
      update: { title: parsed.titleEn },
      create: { moduleId: id, locale: "en", title: parsed.titleEn },
    }),
  ]);
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}

export async function deleteModule(id: string) {
  await requireAdminActor();
  await prisma.module.delete({ where: { id } });
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  await requireAdminActor();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.module.update({ where: { id }, data: { position: index + 1 } })
    )
  );
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}

const lessonSchema = z.object({
  titleTr: z.string().min(1),
  titleEn: z.string().min(1),
  type: z.enum(["VIDEO", "TEXT"]).default("VIDEO"),
  visibility: z.enum(["PUBLIC", "REGISTERED", "ENTITLED", "PRIVATE"]).default("ENTITLED"),
  isPreview: z.boolean().default(false),
  videoProvider: z.enum(["YOUTUBE", "VIMEO", "BUNNY", "EXTERNAL"]).optional(),
  videoExternalId: z.string().optional(),
  durationSeconds: z.number().int().optional(),
  descriptionTr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export async function createLesson(moduleId: string, data: unknown) {
  await requireAdminActor();
  const parsed = lessonSchema.parse(data);
  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      type: parsed.type,
      position: count + 1,
      visibility: parsed.visibility,
      isPreview: parsed.isPreview,
      videoProvider: parsed.videoProvider ?? null,
      videoExternalId: parsed.videoExternalId ?? null,
      durationSeconds: parsed.durationSeconds ?? null,
      translations: {
        create: [
          { locale: "tr", title: parsed.titleTr, description: parsed.descriptionTr },
          { locale: "en", title: parsed.titleEn, description: parsed.descriptionEn },
        ],
      },
    },
    include: { translations: true },
  });
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
  return lesson;
}

export async function updateLesson(id: string, data: unknown) {
  await requireAdminActor();
  const parsed = lessonSchema.parse(data);
  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id },
      data: {
        type: parsed.type,
        visibility: parsed.visibility,
        isPreview: parsed.isPreview,
        videoProvider: parsed.videoProvider ?? null,
        videoExternalId: parsed.videoExternalId ?? null,
        durationSeconds: parsed.durationSeconds ?? null,
      },
    });
    await tx.lessonTranslation.upsert({
      where: { lessonId_locale: { lessonId: id, locale: "tr" } },
      update: { title: parsed.titleTr, description: parsed.descriptionTr },
      create: { lessonId: id, locale: "tr", title: parsed.titleTr, description: parsed.descriptionTr },
    });
    await tx.lessonTranslation.upsert({
      where: { lessonId_locale: { lessonId: id, locale: "en" } },
      update: { title: parsed.titleEn, description: parsed.descriptionEn },
      create: { lessonId: id, locale: "en", title: parsed.titleEn, description: parsed.descriptionEn },
    });
  });
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}

export async function deleteLesson(id: string) {
  await requireAdminActor();
  await prisma.lesson.delete({ where: { id } });
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}

export async function reorderLessons(moduleId: string, orderedIds: string[]) {
  await requireAdminActor();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { position: index + 1 } })
    )
  );
  revalidatePath("/[locale]/admin/courses/[courseId]", "page");
}
