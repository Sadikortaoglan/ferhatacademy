"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

interface Props {
  locale: string;
  currentQ?: string;
  currentRole?: string;
  currentStatus?: string;
  currentFrom?: string;
  currentTo?: string;
}

function toISO(date: Date) {
  return date.toISOString().split("T")[0];
}

export function UserSearch({ locale, currentQ, currentRole, currentStatus, currentFrom, currentTo }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const hasFilters = !!(currentQ || currentRole || currentStatus || currentFrom || currentTo);

  const update = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const vals: Record<string, string | undefined> = {
      q: currentQ,
      role: currentRole,
      status: currentStatus,
      from: currentFrom,
      to: currentTo,
      page: "1",
      ...overrides,
    };
    for (const [k, v] of Object.entries(vals)) {
      if (v && v !== "") p.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    update({ from: toISO(from), to: toISO(to) });
  };

  const ROLES = [
    { value: "", label: t("allRoles") },
    { value: "USER", label: t("roleUser") },
    { value: "ADMIN", label: t("roleAdmin") },
    { value: "SUPER_ADMIN", label: t("roleSuperAdmin") },
  ];

  const STATUSES = [
    { value: "", label: t("statusFilterAll") },
    { value: "active", label: t("statusFilterActive") },
    { value: "inactive", label: t("statusFilterInactive") },
  ];

  const DATE_PRESETS = [
    { label: t("today"), days: 0 },
    { label: t("last7days"), days: 7 },
    { label: t("last30days"), days: 30 },
  ];

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          defaultValue={currentQ ?? ""}
          placeholder={t("searchPlaceholder")}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value || undefined });
          }}
          onBlur={(e) => {
            const val = e.target.value;
            if (val !== (currentQ ?? "")) update({ q: val || undefined });
          }}
        />
      </div>

      {/* Role filter */}
      <select
        value={currentRole ?? ""}
        onChange={(e) => update({ role: e.target.value || undefined })}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={currentStatus ?? ""}
        onChange={(e) => update({ status: e.target.value || undefined })}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Date presets */}
      <div className="flex gap-1">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.days)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/users`)}
          className="h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}
