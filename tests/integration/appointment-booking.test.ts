import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { AppointmentStatus } from "@prisma/client";

async function seedType() {
  return testPrisma.appointmentType.create({
    data: {
      key: "test-on-gorusme",
      nameTr: "Test Ön Görüşme",
      nameEn: "Test Discovery Call",
      isFree: true,
      active: true,
      position: 0,
    },
  });
}

describe("Appointment Booking — data contract", () => {
  beforeEach(async () => {
    await testPrisma.appointmentRequest.deleteMany();
    await testPrisma.appointmentType.deleteMany();
  });

  it("creates appointment request with required fields", async () => {
    const type = await seedType();
    const appt = await testPrisma.appointmentRequest.create({
      data: {
        fullName: "Ahmet Yılmaz",
        email: "ahmet@example.com",
        typeId: type.id,
        locale: "tr",
      },
    });
    expect(appt.status).toBe("PENDING");
    expect(appt.fullName).toBe("Ahmet Yılmaz");
    expect(appt.email).toBe("ahmet@example.com");
    expect(appt.typeId).toBe(type.id);
    expect(appt.id).toBeTruthy();
  });

  it("stores optional fields correctly", async () => {
    const type = await seedType();
    const appt = await testPrisma.appointmentRequest.create({
      data: {
        fullName: "Ayşe Kaya",
        email: "ayse@example.com",
        phone: "+905551234567",
        typeId: type.id,
        preferredDate: new Date("2026-10-15"),
        preferredTimeRange: "09:00-11:00",
        note: "E-ticaret danışmanlığı almak istiyorum.",
        sourcePage: "about",
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "autumn-2026",
        locale: "tr",
      },
    });
    expect(appt.phone).toBe("+905551234567");
    expect(appt.preferredTimeRange).toBe("09:00-11:00");
    expect(appt.note).toBe("E-ticaret danışmanlığı almak istiyorum.");
    expect(appt.utmSource).toBe("instagram");
    expect(appt.sourcePage).toBe("about");
  });

  it("status can be updated from PENDING to CONFIRMED", async () => {
    const type = await seedType();
    const appt = await testPrisma.appointmentRequest.create({
      data: { fullName: "Test User", email: "test@example.com", typeId: type.id },
    });
    expect(appt.status).toBe("PENDING");

    const updated = await testPrisma.appointmentRequest.update({
      where: { id: appt.id },
      data: { status: "CONFIRMED", adminNote: "Onaylandı, uygun saat paylaşıldı." },
    });
    expect(updated.status).toBe("CONFIRMED");
    expect(updated.adminNote).toBe("Onaylandı, uygun saat paylaşıldı.");
  });

  it("all valid statuses can be set", async () => {
    const type = await seedType();
    const statuses: AppointmentStatus[] = ["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"];

    for (const status of statuses) {
      const appt = await testPrisma.appointmentRequest.create({
        data: { fullName: "Test", email: `test-${status}@example.com`, typeId: type.id, status },
      });
      expect(appt.status).toBe(status);
    }
  });

  it("listing by status filter works correctly", async () => {
    const type = await seedType();
    await testPrisma.appointmentRequest.createMany({
      data: [
        { fullName: "User A", email: "a@example.com", typeId: type.id, status: "PENDING" },
        { fullName: "User B", email: "b@example.com", typeId: type.id, status: "CONFIRMED" },
        { fullName: "User C", email: "c@example.com", typeId: type.id, status: "PENDING" },
      ],
    });

    const pending = await testPrisma.appointmentRequest.findMany({ where: { status: "PENDING" } });
    const confirmed = await testPrisma.appointmentRequest.findMany({ where: { status: "CONFIRMED" } });

    expect(pending).toHaveLength(2);
    expect(confirmed).toHaveLength(1);
  });

  it("active appointment types are returned correctly", async () => {
    await testPrisma.appointmentType.createMany({
      data: [
        { key: "active-type", nameTr: "Aktif Tip", nameEn: "Active Type", active: true, position: 0 },
        { key: "passive-type", nameTr: "Pasif Tip", nameEn: "Passive Type", active: false, position: 1 },
      ],
    });
    const active = await testPrisma.appointmentType.findMany({ where: { active: true } });
    expect(active).toHaveLength(1);
    expect(active[0].key).toBe("active-type");
  });

  it("appointment type deletion is blocked when appointments exist", async () => {
    const type = await seedType();
    await testPrisma.appointmentRequest.create({
      data: { fullName: "Test", email: "test@example.com", typeId: type.id },
    });
    await expect(
      testPrisma.appointmentType.delete({ where: { id: type.id } })
    ).rejects.toThrow();
  });

  it("idempotent status update: updating same status twice is safe", async () => {
    const type = await seedType();
    const appt = await testPrisma.appointmentRequest.create({
      data: { fullName: "Test", email: "t@example.com", typeId: type.id, status: "CONFIRMED" },
    });
    const first  = await testPrisma.appointmentRequest.update({ where: { id: appt.id }, data: { status: "CONFIRMED" } });
    const second = await testPrisma.appointmentRequest.update({ where: { id: appt.id }, data: { status: "CONFIRMED" } });
    expect(first.status).toBe("CONFIRMED");
    expect(second.status).toBe("CONFIRMED");
  });
});
