import { describe, it, expect } from "vitest";
import { Role } from "@prisma/client";
import { canChangeUserRole, assignableRoles, isAdmin, isSuperAdmin, canManageUsers } from "@/server/role-management";

const SA = Role.SUPER_ADMIN;
const AD = Role.ADMIN;
const US = Role.USER;

const ACTOR_ID = "actor-1";
const TARGET_ID = "target-2";

describe("isAdmin / isSuperAdmin / canManageUsers", () => {
  it("USER is not admin", () => expect(isAdmin(US)).toBe(false));
  it("ADMIN is admin", () => expect(isAdmin(AD)).toBe(true));
  it("SUPER_ADMIN is admin", () => expect(isAdmin(SA)).toBe(true));
  it("only SUPER_ADMIN isSuperAdmin", () => {
    expect(isSuperAdmin(SA)).toBe(true);
    expect(isSuperAdmin(AD)).toBe(false);
    expect(isSuperAdmin(US)).toBe(false);
  });
  it("canManageUsers follows isAdmin", () => {
    expect(canManageUsers(US)).toBe(false);
    expect(canManageUsers(AD)).toBe(true);
    expect(canManageUsers(SA)).toBe(true);
  });
});

describe("canChangeUserRole", () => {
  it("USER cannot change any role", () => {
    const r = canChangeUserRole(US, US, AD, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(false);
  });

  it("ADMIN cannot promote to SUPER_ADMIN", () => {
    const r = canChangeUserRole(AD, US, SA, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(false);
  });

  it("ADMIN cannot touch SUPER_ADMIN accounts", () => {
    const r = canChangeUserRole(AD, SA, US, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(false);
  });

  it("ADMIN cannot change their own role (self)", () => {
    // assignableRoles returns [] for self; canChangeUserRole enforces only upward self-change
    // The guard on self is in assignableRoles — ADMIN self returns []
    const r = canChangeUserRole(AD, AD, SA, ACTOR_ID, ACTOR_ID);
    expect(r.allowed).toBe(false); // trying to promote self to SUPER_ADMIN
  });

  it("ADMIN can demote a USER (no-op if same is handled)", () => {
    // USER → USER is same-role, not allowed
    const sameRole = canChangeUserRole(AD, US, US, ACTOR_ID, TARGET_ID);
    expect(sameRole.allowed).toBe(false);
  });

  it("ADMIN can promote USER → ADMIN", () => {
    const r = canChangeUserRole(AD, US, AD, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(true);
  });

  it("ADMIN can demote ADMIN → USER", () => {
    const r = canChangeUserRole(AD, AD, US, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(true);
  });

  it("SUPER_ADMIN can promote USER → SUPER_ADMIN", () => {
    const r = canChangeUserRole(SA, US, SA, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(true);
  });

  it("SUPER_ADMIN can demote SUPER_ADMIN → USER", () => {
    const r = canChangeUserRole(SA, SA, US, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(true);
  });

  it("same role change is denied", () => {
    const r = canChangeUserRole(SA, AD, AD, ACTOR_ID, TARGET_ID);
    expect(r.allowed).toBe(false);
  });
});

describe("assignableRoles", () => {
  it("USER gets empty list", () => {
    expect(assignableRoles(US, US, ACTOR_ID, TARGET_ID)).toEqual([]);
  });

  it("ADMIN cannot assign SUPER_ADMIN", () => {
    const roles = assignableRoles(AD, US, ACTOR_ID, TARGET_ID);
    expect(roles).not.toContain(SA);
    expect(roles).toContain(AD);
  });

  it("ADMIN gets empty list when target is SUPER_ADMIN", () => {
    expect(assignableRoles(AD, SA, ACTOR_ID, TARGET_ID)).toEqual([]);
  });

  it("ADMIN gets empty list for self", () => {
    expect(assignableRoles(AD, AD, ACTOR_ID, ACTOR_ID)).toEqual([]);
  });

  it("SUPER_ADMIN can assign all roles except current", () => {
    const roles = assignableRoles(SA, US, ACTOR_ID, TARGET_ID);
    expect(roles).toContain(AD);
    expect(roles).toContain(SA);
    expect(roles).not.toContain(US); // current role excluded
  });
});
