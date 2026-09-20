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

const createAssignmentSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function createAssignment(data: unknown) {
  const actor = await requireAdminActor();
  const parsed = createAssignmentSchema.parse(data);

  const assignment = await prisma.assignment.create({
    data: {
      userId: parsed.userId,
      title: parsed.title,
      description: parsed.description,
      createdById: actor.id,
    },
  });

  await createAuditLog({
    action: "ASSIGNMENT_CREATED",
    actorId: actor.id,
    targetId: parsed.userId,
    targetType: "User",
    metadata: { assignmentId: assignment.id },
  });

  revalidatePath("/[locale]/admin/assignments", "page");
  revalidatePath("/[locale]/admin/users/[userId]", "page");
  return assignment;
}

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function updateAssignment(id: string, data: unknown) {
  const actor = await requireAdminActor();
  const parsed = updateAssignmentSchema.parse(data);
  await prisma.assignment.update({ where: { id }, data: parsed });
  await createAuditLog({
    action: "ASSIGNMENT_UPDATED",
    actorId: actor.id,
    targetId: id,
    targetType: "Assignment",
  });
  revalidatePath("/[locale]/admin/assignments", "page");
}

const assignmentItemSchema = z.object({
  type: z.enum(["LESSON", "TASK"]).default("LESSON"),
  lessonId: z.string().optional(),
  title: z.string().optional(),
  instructions: z.string().optional(),
  isRequired: z.boolean().default(true),
});

export async function addAssignmentItem(assignmentId: string, data: unknown) {
  await requireAdminActor();
  const parsed = assignmentItemSchema.parse(data);
  const count = await prisma.assignmentItem.count({ where: { assignmentId } });
  const item = await prisma.assignmentItem.create({
    data: {
      assignmentId,
      position: count + 1,
      type: parsed.type,
      lessonId: parsed.lessonId ?? null,
      title: parsed.title ?? null,
      instructions: parsed.instructions ?? null,
      isRequired: parsed.isRequired,
    },
    include: { lesson: { include: { translations: true } } },
  });
  revalidatePath("/[locale]/admin/assignments/[assignmentId]", "page");
  return item;
}

const updateItemSchema = z.object({
  title: z.string().optional(),
  instructions: z.string().optional(),
  isRequired: z.boolean().optional(),
  lessonId: z.string().optional(),
});

export async function updateAssignmentItem(id: string, data: unknown) {
  await requireAdminActor();
  const parsed = updateItemSchema.parse(data);
  await prisma.assignmentItem.update({ where: { id }, data: parsed });
  revalidatePath("/[locale]/admin/assignments/[assignmentId]", "page");
}

export async function deleteAssignmentItem(id: string) {
  await requireAdminActor();
  await prisma.assignmentItem.delete({ where: { id } });
  revalidatePath("/[locale]/admin/assignments/[assignmentId]", "page");
}

export async function reorderAssignmentItems(
  assignmentId: string,
  orderedIds: string[]
) {
  await requireAdminActor();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.assignmentItem.update({
        where: { id },
        data: { position: index + 1 },
      })
    )
  );
  revalidatePath("/[locale]/admin/assignments/[assignmentId]", "page");
}
