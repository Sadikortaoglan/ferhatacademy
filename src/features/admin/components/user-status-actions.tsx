"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { activateUser, deactivateUser } from "@/app/[locale]/admin/users/[userId]/actions";

interface Props {
  userId: string;
  isBanned: boolean;
  banReason?: string | null;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("common");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserStatusActions({ userId, isBanned, banReason }: Props) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<"activate" | "deactivate" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      if (dialog === "deactivate") {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }
      setDialog(null);
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isBanned
                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isBanned ? "bg-red-500" : "bg-emerald-500"}`} />
            {isBanned ? t("userStatusInactive") : t("userStatusActive")}
          </span>
          {isBanned && banReason && (
            <span className="text-xs text-muted-foreground">— {banReason}</span>
          )}
        </div>

        {isBanned ? (
          <button
            disabled={isPending}
            onClick={() => setDialog("activate")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "..." : t("activateUser")}
          </button>
        ) : (
          <button
            disabled={isPending}
            onClick={() => setDialog("deactivate")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "..." : t("deactivateUser")}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={dialog === "deactivate"}
        title={t("confirmDeactivateTitle")}
        description={t("confirmDeactivate")}
        confirmLabel={t("deactivateUser")}
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "activate"}
        title={t("confirmActivateTitle")}
        description={t("confirmActivate")}
        confirmLabel={t("activateUser")}
        confirmClass="bg-emerald-600 hover:bg-emerald-700"
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
