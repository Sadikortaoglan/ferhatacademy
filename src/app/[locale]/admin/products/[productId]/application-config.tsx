"use client";

import { useState, useTransition } from "react";
import { updateProductApplicationConfig } from "./actions";

interface Template {
  id: string;
  key: string;
  nameTr: string;
  archived: boolean;
}

interface Profile {
  id: string;
  key: string;
  headlineTr: string;
}

interface Props {
  locale: string;
  productId: string;
  purchaseMode: string;
  currentTemplateId: string | null;
  currentProfileId: string | null;
  templates: Template[];
  profiles: Profile[];
}

const APPLICATION_PURCHASE_MODES = [
  "APPLICATION_REQUIRED",
  "APPLICATION_OPTIONAL",
  "APPLICATION_REQUIRED_BEFORE_PURCHASE",
];

export function ApplicationConfig({
  locale,
  productId,
  purchaseMode,
  currentTemplateId,
  currentProfileId,
  templates,
  profiles,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [templateId, setTemplateId] = useState(currentTemplateId ?? "");
  const [profileId, setProfileId] = useState(currentProfileId ?? "");

  const requiresApplication = APPLICATION_PURCHASE_MODES.includes(purchaseMode);
  const isComplete = templateId !== "" && profileId !== "";

  function handleSave() {
    startTransition(async () => {
      await updateProductApplicationConfig(locale, productId, {
        formTemplateId: templateId || null,
        pageProfileId: profileId || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  if (!requiresApplication) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Bu ürün başvuru gerektirmez. Satın alma modu değiştirilirse bu ayarlar aktif olur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Başvuru Yapılandırması</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}
        >
          {isComplete ? "Tam" : "Eksik"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Form Şablonu</label>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setSaved(false);
            }}
          >
            <option value="">— Şablon seç —</option>
            {templates
              .filter((t) => !t.archived)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameTr} ({t.key})
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Sayfa Profili</label>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={profileId}
            onChange={(e) => {
              setProfileId(e.target.value);
              setSaved(false);
            }}
          >
            <option value="">— Profil seç —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.headlineTr} ({p.key})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isComplete && (
        <p className="text-xs text-warning">
          Başvuru gerektiren bir ürün için form şablonu ve sayfa profili seçilmelidir.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {saved && <span className="text-xs text-success font-medium">Kaydedildi!</span>}
      </div>
    </div>
  );
}
