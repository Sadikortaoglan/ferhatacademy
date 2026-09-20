import { describe, it, expect, beforeAll } from "vitest";
import { testPrisma } from "../helpers/prisma";
import {
  createTestUser,
  createTestAdmin,
  createTestCourse,
  createTestModule,
  createTestLesson,
  createTestEntitlement,
} from "../factories";

// We test the actual Prisma-backed access logic by importing the real functions
// but overriding the DATABASE_URL so they hit the test container.
// Since src/lib/prisma uses globalThis singleton, we must set DATABASE_URL
// before this module loads (done in globalSetup).
import { canAccessLesson, canAccessCourse, getCourseProgress } from "@/server/access";

describe("canAccessLesson", () => {
  it("allows access to PUBLIC lessons without entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "PUBLIC" });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(true);
  });

  it("allows access to preview lessons without entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED", isPreview: true });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(true);
  });

  it("denies access to ENTITLED lesson without entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED" });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(false);
  });

  it("grants access to ENTITLED lesson when user has course entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED" });
    await createTestEntitlement(testPrisma, user.id, course.id, admin.id);

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(true);
  });

  it("denies access when entitlement is revoked", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED" });
    await createTestEntitlement(testPrisma, user.id, course.id, admin.id, {
      revokedAt: new Date(),
    });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(false);
  });

  it("denies access when entitlement has expired", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED" });
    const yesterday = new Date(Date.now() - 86_400_000);
    await createTestEntitlement(testPrisma, user.id, course.id, admin.id, {
      expiresAt: yesterday,
    });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(false);
  });

  it("grants access when entitlement has not yet started", async () => {
    // startsAt in the future → should deny
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    const mod = await createTestModule(testPrisma, course.id);
    const lesson = await createTestLesson(testPrisma, mod.id, { visibility: "ENTITLED" });
    const tomorrow = new Date(Date.now() + 86_400_000);
    await createTestEntitlement(testPrisma, user.id, course.id, admin.id, {
      startsAt: tomorrow,
    });

    const result = await canAccessLesson(user.id, lesson.id);
    expect(result).toBe(false);
  });

  it("returns false for non-existent lesson", async () => {
    const user = await createTestUser(testPrisma);
    const result = await canAccessLesson(user.id, "nonexistent-lesson-id");
    expect(result).toBe(false);
  });
});

describe("canAccessCourse", () => {
  it("denies course access without entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const course = await createTestCourse(testPrisma);

    expect(await canAccessCourse(user.id, course.id)).toBe(false);
  });

  it("grants course access with active entitlement", async () => {
    const user = await createTestUser(testPrisma);
    const admin = await createTestAdmin(testPrisma);
    const course = await createTestCourse(testPrisma);
    await createTestEntitlement(testPrisma, user.id, course.id, admin.id);

    expect(await canAccessCourse(user.id, course.id)).toBe(true);
  });
});
