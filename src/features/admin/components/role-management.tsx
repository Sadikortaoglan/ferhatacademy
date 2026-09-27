"use client";

import { useState, useTransition } from "react";
import { Role } from "@prisma/client";
import { assignableRoles } from "@/server/role-management";
import { changeUserRole } from "@/app/[locale]/admin/users/[userId]/actions";

const ROLE_LABELS: Record<Role, string> = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

const ROLE_COLORS: Record<Role, string> = {
  USER: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  SUPER_ADMIN: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

interface RoleManagementProps {
  targetUserId: string;
  targetUserName: string;
  targetCurrentRole: Role;
  actorRole: Role;
  actorId: string;
}

export function RoleManagement({
  targetUserId,
  targetUserName,
  targetCurrentRole,
  actorRole,
  actorId,
}: RoleManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentRole, setCurrentRole] = useState(targetCurrentRole);

  const options = assignableRoles(actorRole, currentRole, actorId, targetUserId);
  const canChange = options.length > 0;

  function confirm() {
    if (!selectedRole) return;
    startTransition(async () => {
      setError(null);
      const res = await changeUserRole(targetUserId, selectedRole);
      if (res.ok) {
        setCurrentRole(selectedRole);
        setSelectedRole(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error ?? "Bilinmeyen hata.");
        setSelectedRole(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Mevcut Rol:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[currentRole]}`}>
          {ROLE_LABELS[currentRole]}
        </span>
      </div>

      {canChange && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Yeni rol seç:</p>
          <div className="flex flex-wrap gap-2">
            {options.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedRole === role
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {ROLE_LABELS[role]}
                {role === Role.SUPER_ADMIN && " ⚠️"}
              </button>
            ))}
          </div>
        </div>
      )}

      {!canChange && (
        <p className="text-xs text-muted-foreground italic">
          Bu kullanıcının rolünü değiştirme yetkiniz yok.
        </p>
      )}

      {/* Confirmation */}
      {selectedRole && (
        <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Rol değişikliği onayı</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{targetUserName}</span> kullanıcısının rolü:
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[currentRole]}`}>
              {ROLE_LABELS[currentRole]}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[selectedRole]}`}>
              {ROLE_LABELS[selectedRole]}
            </span>
          </div>
          {selectedRole === Role.SUPER_ADMIN && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              ⚠️ Super Admin tüm yönetim yetkilerine sahip olur. Bu işlemi dikkatlice yapın.
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={confirm}
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Kaydediliyor..." : "Onayla"}
            </button>
            <button
              onClick={() => setSelectedRole(null)}
              disabled={isPending}
              className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ Rol başarıyla güncellendi. Kullanıcının aktif oturumları sonlandırıldı.
        </p>
      )}
    </div>
  );
}
