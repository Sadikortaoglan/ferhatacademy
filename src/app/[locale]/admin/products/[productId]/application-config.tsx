"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProductApplicationConfig } from "./actions";

interface Template {
  id: string;
  key: string;
  nameTr: string;
  archived: boolean;
  _count: { steps: number; questions: number };
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

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

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
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const selectedProfile = profiles.find((p) => p.id === profileId) ?? null;
  const isComplete = requiresApplication ? (templateId !== "" && profileId !== "") : true;

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
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Bu ürün başvuru gerektirmez. Satın alma modu değiştirilirse bu ayarlar aktif olur.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Configuration Status */}
      <div className={`rounded-xl border px-4 py-3 ${isComplete ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isComplete ? "text-success" : "text-warning"}`}>
            {isComplete ? "✓ Yapılandırma Tamamlandı" : "⚠ Eksik Yapılandırma"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className={templateId ? "text-success" : "text-warning"}>
            {templateId ? "✓" : "✗"} Form şablonu
          </span>
          <span className={profileId ? "text-success" : "text-warning"}>
            {profileId ? "✓" : "✗"} Sayfa profili
          </span>
          {selectedTemplate && (
            <>
              <span className="text-muted-foreground">
                Adımlar: <strong className="text-foreground">{selectedTemplate._count.steps}</strong>
              </span>
              <span className="text-muted-foreground">
                Sorular: <strong className="text-foreground">{selectedTemplate._count.questions}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Template selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground">Form Şablonu</label>
          <select
            className={selectClass}
            value={templateId}
            onChange={(e) => { setTemplateId(e.target.value); setSaved(false); }}
          >
            <option value="">— Şablon seç —</option>
            {templates.filter((t) => !t.archived).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameTr} — {t._count.steps} adım, {t._count.questions} soru
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/${locale}/admin/applications/templates/${selectedTemplate.id}`}
                className="text-xs text-primary hover:underline"
              >
                Şablonu Düzenle →
              </Link>
            </div>
          )}
        </div>

        {/* Profile selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground">Başvuru Sayfası Profili</label>
          <select
            className={selectClass}
            value={profileId}
            onChange={(e) => { setProfileId(e.target.value); setSaved(false); }}
          >
            <option value="">— Profil seç —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.headlineTr} ({p.key})
              </option>
            ))}
          </select>
          {selectedProfile && (
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/${locale}/admin/applications/profiles/${selectedProfile.id}`}
                className="text-xs text-primary hover:underline"
              >
                Profili Düzenle →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Resolved summary */}
      {selectedTemplate && selectedProfile && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs space-y-1">
          <p className="font-semibold text-foreground mb-1.5">Çözümlenen Yapılandırma</p>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
            <span>Form:</span>
            <span className="font-medium text-foreground">{selectedTemplate.nameTr}</span>
            <span>Sayfa Başlığı:</span>
            <span className="font-medium text-foreground">{selectedProfile.headlineTr}</span>
            <span>Adımlar:</span>
            <span className="font-medium text-foreground">{selectedTemplate._count.steps}</span>
            <span>Sorular:</span>
            <span className="font-medium text-foreground">{selectedTemplate._count.questions}</span>
          </div>
        </div>
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
