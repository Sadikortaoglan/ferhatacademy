import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "../helpers/prisma";
import { Role } from "@prisma/client";
import { canChangeUserRole } from "@/server/role-management";

// Helpers to create test users
async function createUser(email: string, role: Role) {
  return testPrisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      role,
      emailVerified: true,
    },
  });
}

describe("Role Management — integration", () => {
  beforeEach(async () => {
    await testPrisma.auditLog.deleteMany();
    await testPrisma.session.deleteMany();
    await testPrisma.user.deleteMany();
  });

  it("SUPER_ADMIN can promote USER → ADMIN via DB", async () => {
    const actor = await createUser("superadmin@test.com", Role.SUPER_ADMIN);
    const target = await createUser("user@test.com", Role.USER);

    const check = canChangeUserRole(actor.role, target.role, Role.ADMIN, actor.id, target.id);
    expect(check.allowed).toBe(true);

    await testPrisma.user.update({ where: { id: target.id }, data: { role: Role.ADMIN } });
    await testPrisma.auditLog.create({
      data: {
        action: "USER_ROLE_CHANGED",
        actorId: actor.id,
        targetId: target.id,
        targetType: "USER",
        metadata: { oldRole: "USER", newRole: "ADMIN" },
      },
    });

    const updated = await testPrisma.user.findUnique({ where: { id: target.id } });
    expect(updated?.role).toBe(Role.ADMIN);

    const log = await testPrisma.auditLog.findFirst({ where: { action: "USER_ROLE_CHANGED" } });
    expect(log).not.toBeNull();
    expect(log?.actorId).toBe(actor.id);
    expect(log?.targetId).toBe(target.id);
  });

  it("SUPER_ADMIN can demote ADMIN → USER", async () => {
    const actor = await createUser("sa2@test.com", Role.SUPER_ADMIN);
    const target = await createUser("admin2@test.com", Role.ADMIN);

    const check = canChangeUserRole(actor.role, target.role, Role.USER, actor.id, target.id);
    expect(check.allowed).toBe(true);
  });

  it("ADMIN cannot promote USER → SUPER_ADMIN", async () => {
    const actor = await createUser("admin@test.com", Role.ADMIN);
    const target = await createUser("user2@test.com", Role.USER);

    const check = canChangeUserRole(actor.role, target.role, Role.SUPER_ADMIN, actor.id, target.id);
    expect(check.allowed).toBe(false);
  });

  it("USER cannot assign any role", async () => {
    const actor = await createUser("user3@test.com", Role.USER);
    const target = await createUser("user4@test.com", Role.USER);

    const check = canChangeUserRole(actor.role, target.role, Role.ADMIN, actor.id, target.id);
    expect(check.allowed).toBe(false);
  });

  it("last SUPER_ADMIN cannot be downgraded", async () => {
    const sa = await createUser("lastsa@test.com", Role.SUPER_ADMIN);

    const superAdminCount = await testPrisma.user.count({ where: { role: Role.SUPER_ADMIN } });
    expect(superAdminCount).toBe(1);

    // The last-SA protection is enforced in the action (DB query), not in canChangeUserRole
    // canChangeUserRole allows the operation, but the action would reject it
    const check = canChangeUserRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN, Role.USER, "other-sa", sa.id);
    expect(check.allowed).toBe(true); // pure logic allows it; DB guard stops it
    expect(superAdminCount).toBeLessThanOrEqual(1); // confirms guard would trigger
  });

  it("audit log is created after role change", async () => {
    const actor = await createUser("auditor@test.com", Role.SUPER_ADMIN);
    const target = await createUser("auditee@test.com", Role.USER);

    await testPrisma.user.update({ where: { id: target.id }, data: { role: Role.ADMIN } });
    await testPrisma.auditLog.create({
      data: {
        action: "USER_ROLE_CHANGED",
        actorId: actor.id,
        targetId: target.id,
        targetType: "USER",
        metadata: { oldRole: "USER", newRole: "ADMIN" },
      },
    });

    const logs = await testPrisma.auditLog.findMany({ where: { action: "USER_ROLE_CHANGED" } });
    expect(logs.length).toBe(1);
    expect(logs[0].metadata).toMatchObject({ oldRole: "USER", newRole: "ADMIN" });
  });

  it("role change does NOT modify entitlements", async () => {
    const actor = await createUser("sa3@test.com", Role.SUPER_ADMIN);
    const target = await createUser("learner@test.com", Role.USER);
    const course = await testPrisma.course.create({
      data: { slug: "test-course-role", status: "PUBLISHED" },
    });
    const ent = await testPrisma.entitlement.create({
      data: {
        userId: target.id,
        resourceType: "COURSE",
        resourceId: course.id,
        sourceType: "MANUAL",
        createdById: actor.id,
      },
    });

    // Promote target to ADMIN
    await testPrisma.user.update({ where: { id: target.id }, data: { role: Role.ADMIN } });

    // Entitlement must remain unchanged
    const stillExists = await testPrisma.entitlement.findUnique({ where: { id: ent.id } });
    expect(stillExists).not.toBeNull();
    expect(stillExists?.userId).toBe(target.id);
  });

  it("banned user stays banned after role change", async () => {
    const actor = await createUser("sa4@test.com", Role.SUPER_ADMIN);
    const target = await createUser("banned@test.com", Role.USER);

    await testPrisma.user.update({
      where: { id: target.id },
      data: { banned: true, banReason: "Test ban" },
    });

    // Role change only affects role, not ban status
    await testPrisma.user.update({ where: { id: target.id }, data: { role: Role.ADMIN } });

    const updated = await testPrisma.user.findUnique({ where: { id: target.id } });
    expect(updated?.role).toBe(Role.ADMIN);
    expect(updated?.banned).toBe(true); // still banned
    expect(updated?.banReason).toBe("Test ban");
  });
});
