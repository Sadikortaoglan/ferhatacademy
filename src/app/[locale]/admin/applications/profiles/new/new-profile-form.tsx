"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProfile } from "../actions";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function NewProfileForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    key: "",
    headlineTr: "",
    headlineEn: "",
    subtitleTr: "",
    subtitleEn: "",
    ctaLabelTr: "Başvur",
    ctaLabelEn: "Apply",
    layout: "SPLIT",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const profile = await createProfile(locale, data);
        router.push(`/${locale}/admin/applications/profiles/${profile.id}`);
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
        <label className="block text-sm font-semibold text-foreground">
          Anahtar (key){" "}
          <span className="text-muted-foreground font-normal text-xs">— URL güvenli, değiştirilemez</span>
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="ornek: mentorship_default"
          value={data.key}
          onChange={(e) =>
            setData((p) => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_") }))
          }
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Başlık (TR) *</label>
          <input
            type="text"
            className={inputClass}
            value={data.headlineTr}
            onChange={(e) => setData((p) => ({ ...p, headlineTr: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Başlık (EN) *</label>
          <input
            type="text"
            className={inputClass}
            value={data.headlineEn}
            onChange={(e) => setData((p) => ({ ...p, headlineEn: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Alt Başlık (TR)</label>
          <input
            type="text"
            className={inputClass}
            value={data.subtitleTr}
            onChange={(e) => setData((p) => ({ ...p, subtitleTr: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">Alt Başlık (EN)</label>
          <input
            type="text"
            className={inputClass}
            value={data.subtitleEn}
            onChange={(e) => setData((p) => ({ ...p, subtitleEn: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">CTA Butonu (TR)</label>
          <input
            type="text"
            className={inputClass}
            value={data.ctaLabelTr}
            onChange={(e) => setData((p) => ({ ...p, ctaLabelTr: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-foreground">CTA Butonu (EN)</label>
          <input
            type="text"
            className={inputClass}
            value={data.ctaLabelEn}
            onChange={(e) => setData((p) => ({ ...p, ctaLabelEn: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">Düzen</label>
        <select
          className={inputClass}
          value={data.layout}
          onChange={(e) => setData((p) => ({ ...p, layout: e.target.value }))}
        >
          <option value="SPLIT">İki Sütun (Split)</option>
          <option value="FORM_FIRST">Form Önce</option>
          <option value="EDITORIAL">Editorial</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Oluşturuluyor..." : "Profil Oluştur"}
      </button>
    </form>
  );
}
