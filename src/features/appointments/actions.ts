"use server";

import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationToUser, sendAppointmentNotificationToAdmin } from "@/lib/email";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { validateEmail, validatePhone, normalizePhone } from "@/lib/validators";

export type CreateAppointmentInput = {
  fullName: string;
  email: string;
  phone?: string;
  typeId: string;
  preferredDate?: string;
  preferredTimeRange?: string;
  note?: string;
  sourcePage?: string;
  productId?: string;
  locale?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type CreateAppointmentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function getActiveAppointmentTypes() {
  return prisma.appointmentType.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
}

export async function createAppointmentRequest(
  input: CreateAppointmentInput
): Promise<CreateAppointmentResult> {
  // Server-side validation (authoritative — do not trust client normalization)
  if (!input.fullName?.trim()) return { ok: false, error: "fullName required" };
  if (!input.typeId) return { ok: false, error: "typeId required" };

  const emailResult = validateEmail(input.email ?? "");
  if (!emailResult.valid) return { ok: false, error: "Geçerli bir e-posta adresi girin." };

  // Phone is required for appointments
  const phoneResult = validatePhone(input.phone ?? "");
  if (!phoneResult.valid) return { ok: false, error: "Geçerli bir telefon numarası girin." };

  const type = await prisma.appointmentType.findUnique({ where: { id: input.typeId, active: true } });
  if (!type) return { ok: false, error: "invalid appointment type" };

  const appointment = await prisma.appointmentRequest.create({
    data: {
      fullName: input.fullName.trim(),
      email: emailResult.normalized,
      phone: phoneResult.e164,
      typeId: input.typeId,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      preferredTimeRange: input.preferredTimeRange || null,
      note: input.note?.trim() || null,
      sourcePage: input.sourcePage || null,
      productId: input.productId || null,
      locale: input.locale ?? "tr",
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
    },
  });

  // Find admin users to notify
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });

  // Create admin notifications (fire and forget — don't block emails if this fails)
  if (admins.length > 0) {
    prisma.adminNotification.createMany({
      data: admins.map((admin) => ({
        recipientUserId: admin.id,
        type: "APPOINTMENT_REQUEST" as const,
        title: "Yeni Randevu Talebi",
        message: `${input.fullName} · ${type.nameTr}`,
        entityType: "AppointmentRequest",
        // entityId intentionally omitted — FK constraint ties it to applications table
      })),
    }).catch(console.error);
  }

  // Send emails (fire and forget — don't fail the request if email fails)
  const preferredDateStr = input.preferredDate
    ? new Date(input.preferredDate).toLocaleDateString(input.locale === "tr" ? "tr-TR" : "en-US")
    : undefined;

  sendAppointmentConfirmationToUser({
    to: appointment.email,
    fullName: appointment.fullName,
    typeName: input.locale === "tr" ? type.nameTr : type.nameEn,
    preferredDate: preferredDateStr,
    preferredTimeRange: input.preferredTimeRange,
    locale: input.locale,
  }).catch(console.error);

  sendAppointmentNotificationToAdmin({
    fullName: appointment.fullName,
    email: appointment.email,
    phone: appointment.phone,
    typeName: type.nameTr,
    preferredDate: preferredDateStr,
    preferredTimeRange: appointment.preferredTimeRange,
    note: appointment.note,
    appointmentId: appointment.id,
  }).catch(console.error);

  return { ok: true, id: appointment.id };
}
