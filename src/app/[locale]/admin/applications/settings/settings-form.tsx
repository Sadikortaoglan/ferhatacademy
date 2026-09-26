"use client";

import { useState, useTransition } from "react";
import { saveNotificationSettings } from "./actions";

const SETTINGS = [
  {
    key: "notif_email_on_submitted",
    label: "Yeni başvuru e-postası (başvurana)",
    description: "Başvuru gönderildiğinde başvurana otomatik onay e-postası gönderilsin.",
  },
  {
    key: "notif_email_on_approved",
    label: "Onay e-postası (başvurana)",
    description: "Başvuru onaylandığında başvurana bildirim e-postası gönderilsin.",
  },
  {
    key: "notif_email_on_rejected",
    label: "Red e-postası (başvurana)",
    description: "Başvuru reddedildiğinde başvurana bildirim e-postası gönderilsin.",
  },
  {
    key: "notif_email_on_waitlisted",
    label: "Bekleme listesi e-postası (başvurana)",
    description: "Başvuru bekleme listesine alındığında başvurana bildirim e-postası gönderilsin.",
  },
  {
    key: "notif_admin_bell_on_submitted",
    label: "Admin bildirim zili (yeni başvuru)",
    description: "Yeni başvuru geldiğinde admin panelinde bildirim zili gösterilsin.",
  },
] as const;

interface Props {
  locale: string;
  initialSettings: Record<string, boolean>;
}

export function NotificationSettingsForm({ locale, initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, boolean>>(initialSettings);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveNotificationSettings(locale, values);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">E-posta & Bildirim Ayarları</h2>
        <div className="divide-y divide-border">
          {SETTINGS.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values[s.key]}
                onClick={() => toggle(s.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  values[s.key] ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    values[s.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {saved && <span className="text-sm text-green-600">Kaydedildi ✓</span>}
      </div>
    </div>
  );
}
