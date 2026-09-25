"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTemplate } from "../actions";

const TYPE_OPTIONS = [
  { value: "MENTORSHIP", label: "Mentörlük" },
  { value: "LIVE_TRAINING", label: "Canlı Eğitim" },
  { value: "CONSULTATION", label: "Danışmanlık" },
  { value: "COHORT_PREMIUM_PROGRAM", label: "Premium Program" },
  { value: "GENERAL_CUSTOM", label: "Genel / Özel" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function NewTemplateForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    key: "",
    type: "GENERAL_CUSTOM",
    nameTr: "",
    nameEn: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const template = await createTemplate(locale, data);
        router.push(`/${locale}/admin/applications/templates/${template.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">Şablon Türü</label>
        <select
          className={inputClass}
          value={data.type}
          onChange={(e) => setData((p) => ({ ...p, type: e.target.value }))}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          Anahtar (key){" "}
          <span className="text-muted-foreground font-normal text-xs">— URL/kod güvenli, değiştirilemez</span>
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="ornek: mentorship_2025"
          value={data.key}
          onChange={(e) =>
            setData((p) => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))
          }
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Ad (TR)</label>
          <input
            type="text"
            className={inputClass}
            value={data.nameTr}
            onChange={(e) => setData((p) => ({ ...p, nameTr: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Ad (EN)</label>
          <input
            type="text"
            className={inputClass}
            value={data.nameEn}
            onChange={(e) => setData((p) => ({ ...p, nameEn: e.target.value }))}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Oluşturuluyor..." : "Şablon Oluştur"}
      </button>
    </form>
  );
}
