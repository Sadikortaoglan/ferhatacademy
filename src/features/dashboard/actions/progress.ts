"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAuthUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function markLessonStarted(lessonId: string) {
  const user = await requireAuthUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { lastViewedAt: new Date(), status: "IN_PROGRESS" },
    create: {
      userId: user.id,
      lessonId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      lastViewedAt: new Date(),
    },
  });
  revalidatePath("/[locale]/dashboard", "page");
}

export async function updateLessonProgress(
  lessonId: string,
  progressPercent: number
) {
  const user = await requireAuthUser();
  const clamped = Math.max(0, Math.min(100, progressPercent));
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {
      progressPercent: clamped,
      lastViewedAt: new Date(),
      status: clamped >= 90 ? "COMPLETED" : "IN_PROGRESS",
      ...(clamped >= 90 ? { completedAt: new Date() } : {}),
    },
    create: {
      userId: user.id,
      lessonId,
      progressPercent: clamped,
      status: clamped >= 90 ? "COMPLETED" : "IN_PROGRESS",
      startedAt: new Date(),
      lastViewedAt: new Date(),
    },
  });
}

export async function markLessonCompleted(lessonId: string) {
  const user = await requireAuthUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {
      status: "COMPLETED",
      progressPercent: 100,
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      progressPercent: 100,
      startedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: new Date(),
    },
  });
  revalidatePath("/[locale]/dashboard", "page");
}
