import { describe, it, expect } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { createTestUser, createTestAdmin } from "../factories";

// These functions use the real Prisma client from src/lib/prisma.
// DATABASE_URL is set by globalSetup to point at the test container.
// We import them as plain functions (not server actions) by bypassing the
// "use server" directive — Vitest strips it correctly in Node environment.
import { activateUser, deactivateUser } from "@/app/[locale]/admin/users/[userId]/actions";

// activateUser / deactivateUser call auth.api.getSession internally.
// We mock that layer so we can test the DB logic directly.
import { vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/auth";

async function setupAdminSession(adminId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (auth.api.getSession as any).mockResolvedValue({
    user: { id: adminId },
  });
}

describe("deactivateUser", () => {
  it("sets banned=true and records an audit log", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma);
    // Override admin role so requireAdminActor passes
    await testPrisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    await setupAdminSession(admin.id);

    await deactivateUser(user.id, "Test deactivation");

    const updated = await testPrisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.banned).toBe(true);
    expect(updated?.banReason).toBe("Test deactivation");

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "USER_DEACTIVATED", targetId: user.id },
    });
    expect(log).not.toBeNull();
    expect(log?.actorId).toBe(admin.id);
  });

  it("invalidates all sessions for the banned user", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma);
    await testPrisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    // Create a session for the user
    await testPrisma.session.create({
      data: {
        userId: user.id,
        token: `tok_${Math.random()}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    await setupAdminSession(admin.id);

    await deactivateUser(user.id);

    const sessions = await testPrisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(0);
  });
});

describe("activateUser", () => {
  it("sets banned=false and clears banReason, records audit log", async () => {
    const admin = await createTestAdmin(testPrisma);
    const user = await createTestUser(testPrisma, { banned: true });
    await testPrisma.user.update({
      where: { id: user.id },
      data: { banReason: "Was banned", banned: true },
    });
    await testPrisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    await setupAdminSession(admin.id);

    await activateUser(user.id);

    const updated = await testPrisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.banned).toBe(false);
    expect(updated?.banReason).toBeNull();

    const log = await testPrisma.auditLog.findFirst({
      where: { action: "USER_ACTIVATED", targetId: user.id },
    });
    expect(log).not.toBeNull();
  });

  it("does not activate when caller is not admin (security regression)", async () => {
    const regularUser = await createTestUser(testPrisma);
    const targetUser = await createTestUser(testPrisma, { banned: true });
    await setupAdminSession(regularUser.id);

    await expect(activateUser(targetUser.id)).rejects.toThrow("Forbidden");

    const unchanged = await testPrisma.user.findUnique({ where: { id: targetUser.id } });
    expect(unchanged?.banned).toBe(true);
  });
});
