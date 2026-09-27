"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import { createAuditLog } from "@/server/audit";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function listAppointments(opts: {
  page?: number;
  status?: AppointmentStatus | "ALL";
  search?: string;
}) {
  await requireAdmin();
  const page = opts.page ?? 1;
  const perPage = 20;
  const where = {
    ...(opts.status && opts.status !== "ALL" ? { status: opts.status } : {}),
    ...(opts.search
      ? {
          OR: [
            { fullName: { contains: opts.search, mode: "insensitive" as const } },
            { email:    { contains: opts.search, mode: "insensitive" as const } },
            { phone:    { contains: opts.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where,
      include: { type: { select: { nameTr: true, nameEn: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.appointmentRequest.count({ where }),
  ]);
  return { items, total, page, perPage };
}

export async function getAppointmentDetail(id: string) {
  await requireAdmin();
  return prisma.appointmentRequest.findUnique({
    where: { id },
    include: {
      type: true,
      product: { select: { slug: true, translations: { where: { locale: "tr" }, select: { name: true } } } },
    },
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, adminNote?: string) {
  const actor = await requireAdmin();
  await prisma.appointmentRequest.update({
    where: { id },
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
  await createAuditLog({
    action: "APPOINTMENT_STATUS_UPDATED",
    actorId: actor.id,
    targetId: id,
    targetType: "AppointmentRequest",
    metadata: { status },
  });
  revalidatePath("/[locale]/admin/appointments", "page");
  revalidatePath(`/[locale]/admin/appointments/${id}`, "page");
  return { ok: true };
}

export async function listAppointmentTypes() {
  await requireAdmin();
  return prisma.appointmentType.findMany({ orderBy: { position: "asc" } });
}

export async function upsertAppointmentType(data: {
  id?: string;
  key: string;
  nameTr: string;
  nameEn: string;
  descTr?: string;
  descEn?: string;
  durationMinutes?: number;
  isFree?: boolean;
  active?: boolean;
  position?: number;
}) {
  await requireAdmin();
  if (data.id) {
    await prisma.appointmentType.update({
      where: { id: data.id },
      data: {
        nameTr: data.nameTr,
        nameEn: data.nameEn,
        descTr: data.descTr ?? null,
        descEn: data.descEn ?? null,
        durationMinutes: data.durationMinutes ?? null,
        isFree: data.isFree ?? true,
        active: data.active ?? true,
        position: data.position ?? 0,
      },
    });
  } else {
    await prisma.appointmentType.create({
      data: {
        key: data.key,
        nameTr: data.nameTr,
        nameEn: data.nameEn,
        descTr: data.descTr ?? null,
        descEn: data.descEn ?? null,
        durationMinutes: data.durationMinutes ?? null,
        isFree: data.isFree ?? true,
        active: data.active ?? true,
        position: data.position ?? 0,
      },
    });
  }
  revalidatePath("/[locale]/admin/appointments/types", "page");
  return { ok: true };
}

export async function toggleAppointmentTypeActive(id: string, active: boolean) {
  await requireAdmin();
  await prisma.appointmentType.update({ where: { id }, data: { active } });
  revalidatePath("/[locale]/admin/appointments/types", "page");
  return { ok: true };
}
