import { Role } from "@prisma/client";

// ─── Authorization helpers ────────────────────────────────────────────────────

export function isAdmin(role: Role) {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

export function isSuperAdmin(role: Role) {
  return role === Role.SUPER_ADMIN;
}

export function canManageUsers(role: Role) {
  return isAdmin(role);
}

/**
 * Returns whether the actor can change a target user's role to a given new role.
 * Does NOT check the last-SUPER_ADMIN rule — that requires a DB query.
 */
export function canChangeUserRole(
  actorRole: Role,
  targetCurrentRole: Role,
  newRole: Role,
  actorId: string,
  targetId: string,
): { allowed: boolean; reason?: string } {
  // USER cannot change any role
  if (actorRole === Role.USER) {
    return { allowed: false, reason: "Yetersiz yetki." };
  }

  // ADMIN restrictions
  if (actorRole === Role.ADMIN) {
    // Cannot promote to SUPER_ADMIN
    if (newRole === Role.SUPER_ADMIN) {
      return { allowed: false, reason: "SUPER_ADMIN rolü ataması için yetkiniz yok." };
    }
    // Cannot touch SUPER_ADMIN accounts
    if (targetCurrentRole === Role.SUPER_ADMIN) {
      return { allowed: false, reason: "SUPER_ADMIN hesaplarında değişiklik yapamazsınız." };
    }
    // Cannot promote themselves
    if (actorId === targetId && newRole !== Role.USER) {
      return { allowed: false, reason: "Kendinize rol ataması yapamazsınız." };
    }
  }

  // No-op: same role
  if (targetCurrentRole === newRole) {
    return { allowed: false, reason: "Kullanıcı zaten bu rolde." };
  }

  return { allowed: true };
}

/**
 * Returns the roles an actor may assign to a target.
 */
export function assignableRoles(
  actorRole: Role,
  targetCurrentRole: Role,
  actorId: string,
  targetId: string,
): Role[] {
  if (actorRole === Role.USER) return [];

  if (actorRole === Role.ADMIN) {
    // ADMIN cannot touch SUPER_ADMIN accounts or assign SUPER_ADMIN
    if (targetCurrentRole === Role.SUPER_ADMIN) return [];
    // ADMIN cannot change their own role upward
    if (actorId === targetId) return [];
    return [Role.USER, Role.ADMIN].filter((r) => r !== targetCurrentRole);
  }

  // SUPER_ADMIN can assign anything except same role
  return [Role.USER, Role.ADMIN, Role.SUPER_ADMIN].filter((r) => r !== targetCurrentRole);
}
