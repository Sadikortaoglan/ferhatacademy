"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function completeAssignmentItem(itemId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const item = await prisma.assignmentItem.findUnique({
    where: { id: itemId },
    include: { assignment: { select: { userId: true } } },
  });
  if (!item || item.assignment.userId !== session.user.id) {
    throw new Error("Not found");
  }

  await prisma.assignmentItem.update({
    where: { id: itemId },
    data: { completedAt: new Date() },
  });
  revalidatePath("/[locale]/dashboard/program", "page");
}
