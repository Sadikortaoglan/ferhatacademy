import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireUser(locale: string = "tr") {
  const session = await getSession();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }
  return session.user;
}

export async function requireAdmin(locale: string = "tr") {
  const user = await requireUser(locale);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect(`/${locale}/dashboard`);
  }
  return dbUser;
}

export async function requireSuperAdmin(locale: string = "tr") {
  const user = await requireUser(locale);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== Role.SUPER_ADMIN) {
    redirect(`/${locale}/dashboard`);
  }
  return dbUser;
}

export async function getUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      preferredLocale: true,
    },
  });
}
