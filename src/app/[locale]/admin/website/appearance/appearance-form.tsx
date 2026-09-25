"use client";

import { useState, useTransition, useCallback } from "react";
import { saveGlobalOverrides, resetToThemeDefaults } from "./actions";
import type { AppearanceConfig } from "@/server/appearance";
import type { ThemeOverrides } from "@/lib/theme-resolver";
import { THEME_CONFIGS, type ThemeId } from "@/lib/themes";

const RADIUS_OPTIONS = [
  { value: "none", label: "Düz", preview: "0px" },
  { value: "sm", label: "Hafif", preview: "4px" },
  { value: "md", label: "Orta", preview: "8px" },
  { value: "lg", label: "Yuvarlak", preview: "12px" },
  { value: "xl", label: "Max", preview: "16px" },
];

const COLOR_FIELDS: { key: keyof ThemeOverrides; label: string; description: string }[] = [
  { key: "colorPrimary", label: "Ana Renk", description: "Butonlar, linkler, vurgu" },
  { key: "colorPrimaryForeground", label: "Ana Renk Yazısı", description: "Primary üzerindeki metin" },
  { key: "colorBackground", label: "Sayfa Zemini", description: "Genel arka plan" },
  { key: "colorSurface", label: "Kart Yüzeyi", description: "Kartlar, modal, header" },
  { key: "colorForeground", label: "Ana Metin", description: "Başlıklar ve temel metin" },
  { key: "colorMuted", label: "Soluk Zemin", description: "Tablo satırları, etiket zemini" },
  { key: "colorMutedForeground", label: "Soluk Metin", description: "Placeholder ve açıklamalar" },
  { key: "colorBorder", label: "Kenarlık", description: "Çizgiler ve ayraçlar" },
  { key: "colorSuccess", label: "Başarı", description: "Onay ve aktif durumlar" },
  { key: "colorWarning", label: "Uyarı", description: "Uyarı bildirimleri" },
  { key: "colorDanger", label: "Tehlike", description: "Hata, silme" },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance(r: number, g: number, b: number) {
  const toLinear = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function ContrastWarnings({ overrides, resolved }: { overrides: ThemeOverrides; resolved: Record<string, string> }) {
  const get = (key: keyof ThemeOverrides) => (overrides[key] as string | undefined) ?? resolved[`--color-${key.replace("color", "").replace(/([A-Z])/g, (m) => "-" + m.toLowerCase()).slice(1)}`] ?? "";
  const pairs: [keyof ThemeOverrides, keyof ThemeOverrides, string][] = [
    ["colorPrimary", "colorPrimaryForeground", "Primary buton metni"],
    ["colorBackground", "colorForeground", "Sayfa metni"],
    ["colorSurface", "colorForeground", "Kart metni"],
  ];
  const warnings: string[] = [];
  for (const [bg, fg, label] of pairs) {
    const ratio = contrastRatio(get(bg), get(fg));
    if (ratio !== null && ratio < 4.5) {
      warnings.push(`${label}: kontrast ${ratio.toFixed(1)}:1 (min 4.5:1)`);
    }
  }
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-1">
      <p className="text-xs font-semibold text-warning">Okunabilirlik Uyarısı</p>
      {warnings.map((w) => <p key={w} className="text-xs text-warning">{w}</p>)}
    </div>
  );
}

interface Props {
  initial: AppearanceConfig;
}

export function AppearanceForm({ initial }: Props) {
  const [overrides, setOverrides] = useState<ThemeOverrides>(initial.resolved.globalOverrides ?? {});
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const effectiveValue = useCallback((key: keyof ThemeOverrides): string => {
    if (overrides[key] !== undefined) return overrides[key] as string;
    const theme = THEME_CONFIGS[initial.themePreset as ThemeId] ?? THEME_CONFIGS.signature;
    return ((theme as unknown) as Record<string, unknown>)[key] as string ?? "";
  }, [overrides, initial.themePreset]);

  const update = useCallback((key: keyof ThemeOverrides, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  function handleSave() {
    startTransition(async () => {
      await saveGlobalOverrides(overrides);
      setSaved(true);
    });
  }

  function handleResetConfirm() {
    startTransition(async () => {
      await resetToThemeDefaults(initial.themePreset);
      setOverrides({});
      setShowReset(false);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <ContrastWarnings overrides={overrides} resolved={initial.resolved.effectiveColors} />

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Renk Özelleştirme</p>
          <p className="text-xs text-muted-foreground">Tema üzerine bireysel renk değişikliği yapabilirsin.</p>
        </div>
        <div className="divide-y divide-border">
          {COLOR_FIELDS.map(({ key, label, description }) => {
            const val = effectiveValue(key);
            return (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <input
                  type="color"
                  value={val}
                  onChange={(e) => update(key, e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-border shrink-0"
                  title={label}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => { const v = e.target.value; if (/^#[0-9a-f]{0,6}$/i.test(v)) update(key, v); }}
                  className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Köşe Yuvarlama</p>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((opt) => {
            const active = (overrides.radiusPreset ?? initial.resolved.radiusPreset) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("radiusPreset", opt.value)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-colors ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground hover:border-primary/50"
                }`}
              >
                <div style={{ width: 24, height: 24, backgroundColor: effectiveValue("colorPrimary"), borderRadius: opt.preview }} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Kaydediliyor..." : "Renkleri Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => setShowReset(true)}
          disabled={isPending}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Tema Varsayılanına Dön
        </button>
        {saved && !isPending && <span className="text-xs text-success font-medium">Kaydedildi!</span>}
      </div>

      {showReset && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Renkleri sıfırlamak istediğine emin misin?</p>
          <p className="text-xs text-muted-foreground">Tüm renk özelleştirmeleri aktif temanın varsayılanlarına döner.</p>
          <div className="flex gap-2">
            <button onClick={handleResetConfirm} disabled={isPending} className="rounded-md bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              Evet, Sıfırla
            </button>
            <button onClick={() => setShowReset(false)} className="rounded-md border border-border bg-surface px-4 py-1.5 text-sm text-muted-foreground">
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
