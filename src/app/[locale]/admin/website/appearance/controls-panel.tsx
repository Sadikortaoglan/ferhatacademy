"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { THEME_CONFIGS, type ThemeId } from "@/lib/themes";
import type { ThemeOverrides } from "@/lib/theme-resolver";
import type { PageKey } from "./actions";

const PAGE_KEY_LABELS: Record<string, string> = {
  HOME: "Ana Sayfa", ACADEMY: "Akademi", COURSES: "Kurslar", COURSE_DETAIL: "Kurs Detay",
  LIVE_TRAINING: "Canlı Eğitim", PRODUCTS: "Ürünler", PRODUCT_DETAIL: "Ürün Detay",
  ABOUT: "Hakkımda", LOGIN: "Giriş", REGISTER: "Kayıt",
};

interface ColorFieldDef {
  key: keyof ThemeOverrides;
  label: string;
  description: string;
  affects: string;
  group: "brand" | "text" | "surface" | "system" | "page_hero";
  pageOnly?: boolean;
}

const COLOR_FIELDS: ColorFieldDef[] = [
  { key: "colorPrimary", label: "Ana Renk", description: "CTA butonları ve vurgu alanları", affects: "Butonlar, aktif linkler", group: "brand" },
  { key: "colorPrimaryForeground", label: "Ana Buton Yazısı", description: "Ana renk üzerindeki metin", affects: "CTA buton metni", group: "brand" },
  { key: "colorAccent", label: "Aksent Rengi", description: "İkincil vurgu noktaları", affects: "İkincil butonlar, etiketler", group: "brand" },
  { key: "colorForeground", label: "Başlık Rengi", description: "H1, H2, H3 ve bölüm başlıkları", affects: "Tüm başlıklar", group: "text" },
  { key: "colorMutedForeground", label: "Soluk Metin", description: "Açıklamalar ve yardımcı bilgiler", affects: "Açıklamalar, metadata", group: "text" },
  { key: "colorBackground", label: "Sayfa Zemini", description: "Genel sayfa arka planı", affects: "Tüm sayfa arka planı", group: "surface" },
  { key: "colorSurface", label: "Kart / Panel Yüzeyi", description: "Kartlar, modal ve header", affects: "Eğitim kartları, header", group: "surface" },
  { key: "colorMuted", label: "Soluk Zemin", description: "Tablo satırları ve etiket zeminleri", affects: "Arka plan değişkenleri", group: "surface" },
  { key: "colorBorder", label: "Kenarlık", description: "Çizgiler ve bölüm ayraçları", affects: "Kart kenarları, input", group: "surface" },
  { key: "colorHeroBg", label: "Hero Arka Planı", description: "Hero bölümünün arka plan rengi", affects: "Ana sayfa hero", group: "page_hero", pageOnly: true },
  { key: "colorHeroHeading", label: "Hero Başlık Rengi", description: "Hero bölümündeki başlık", affects: "Hero H1", group: "page_hero", pageOnly: true },
  { key: "colorHeroBody", label: "Hero Metin Rengi", description: "Hero açıklama metni", affects: "Hero paragraf", group: "page_hero", pageOnly: true },
  { key: "colorSuccess", label: "Başarı Rengi", description: "Onay bildirimleri", affects: "Başarı badge", group: "system" },
  { key: "colorWarning", label: "Uyarı Rengi", description: "Uyarı bildirimleri", affects: "Uyarı badge", group: "system" },
  { key: "colorDanger", label: "Tehlike / Hata", description: "Hata bildirimleri", affects: "Hata mesajları", group: "system" },
];

const RADIUS_OPTIONS = [
  { value: "none", label: "Keskin", desc: "0px" },
  { value: "sm", label: "Hafif", desc: "4px" },
  { value: "md", label: "Dengeli", desc: "8px" },
  { value: "lg", label: "Yuvarlak", desc: "12px" },
  { value: "xl", label: "Maksimum", desc: "16px" },
];

const THEME_IDS: ThemeId[] = ["signature", "academy", "editorial"];

function ColorControl({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: ColorFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-3">
      <input
        type="color"
        value={value.length === 7 ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 rounded shrink-0 cursor-pointer border border-border"
        title={fieldDef.label}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-none">{fieldDef.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{fieldDef.description}</p>
        <p className="text-[10px] text-primary/70 mt-0.5">Etki: {fieldDef.affects}</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          if (/^#[0-9a-f]{0,6}$/i.test(e.target.value)) onChange(e.target.value);
        }}
        className="w-20 text-[11px] font-mono rounded border border-border bg-background px-1.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="divide-y divide-border/60">{children}</div>}
    </div>
  );
}

interface Props {
  locale: string;
  activeTheme: ThemeId;
  globalOverrides: ThemeOverrides;
  pageOverrides: ThemeOverrides | null;
  hasPageOverride: boolean;
  currentPageKey: PageKey | null;
  scope: "global" | "page";
  onScopeChange: (s: "global" | "page") => void;
  onThemeSwitch: (id: ThemeId) => void;
  onGlobalChange: (key: keyof ThemeOverrides, value: string) => void;
  onPageChange: (pageKey: PageKey, key: keyof ThemeOverrides, value: string) => void;
  onResetToTheme: () => void;
  onDeletePageOverride: (pageKey: PageKey) => void;
}

export function ControlsPanel({
  locale,
  activeTheme,
  globalOverrides,
  pageOverrides,
  hasPageOverride,
  currentPageKey,
  scope,
  onScopeChange,
  onThemeSwitch,
  onGlobalChange,
  onPageChange,
  onResetToTheme,
  onDeletePageOverride,
}: Props) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeletePageConfirm, setShowDeletePageConfirm] = useState(false);
  const theme = THEME_CONFIGS[activeTheme];

  const getEffectiveValue = useCallback(
    (key: keyof ThemeOverrides): string => {
      const pageVal = pageOverrides?.[key] as string | undefined;
      const globalVal = globalOverrides?.[key] as string | undefined;
      const themeVal = (theme as unknown as Record<string, string>)[key] ?? "#000000";
      if (scope === "page" && pageVal) return pageVal;
      if (globalVal) return globalVal;
      return themeVal;
    },
    [pageOverrides, globalOverrides, theme, scope]
  );

  function handleChange(key: keyof ThemeOverrides, value: string) {
    if (scope === "page" && currentPageKey) {
      onPageChange(currentPageKey, key, value);
    } else {
      onGlobalChange(key, value);
    }
  }

  const isPageScope = scope === "page";
  const pageLabel = currentPageKey ? (PAGE_KEY_LABELS[currentPageKey] ?? currentPageKey) : "—";

  return (
    <div className="text-sm">
      <div className="px-3 py-3 bg-surface border-b border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sitenin renklerini ve görünümünü buradan ayarla. Sağdaki önizleme anlık güncellenir.
        </p>
      </div>

      {/* Scope switch */}
      {currentPageKey && (
        <div className="px-3 py-2 border-b border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">
            Düzenleme Kapsamı
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => onScopeChange("global")}
              className={`flex-1 rounded py-1.5 text-xs font-semibold transition-colors ${
                scope === "global"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Tüm Site
            </button>
            <button
              onClick={() => onScopeChange("page")}
              className={`flex-1 rounded py-1.5 text-xs font-semibold transition-colors ${
                scope === "page"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {pageLabel} Sayfası
            </button>
          </div>
          {isPageScope && !hasPageOverride && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Bu sayfa Global Tema kullanıyor. Değişiklik yapınca sayfa için özel stil oluşturulur.
            </p>
          )}
          {isPageScope && hasPageOverride && (
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[10px] text-primary font-medium">Bu sayfada özel görünüm aktif.</p>
              <button
                onClick={() => setShowDeletePageConfirm(true)}
                className="text-[10px] text-danger hover:underline"
              >
                Global görünüme dön
              </button>
            </div>
          )}
        </div>
      )}

      {/* Theme selector */}
      <CollapsibleSection title="TEMA" defaultOpen={true}>
        <div className="px-3 py-2 space-y-1.5">
          {THEME_IDS.map((tid) => {
            const t = THEME_CONFIGS[tid];
            const isActive = activeTheme === tid;
            return (
              <button
                key={tid}
                onClick={() => onThemeSwitch(tid)}
                className={`w-full flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-background hover:border-primary/40 text-foreground"
                }`}
              >
                <div className="flex gap-1 shrink-0">
                  {t.swatches.map((s, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: s }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-none">
                    {locale === "tr" ? t.nameTr : t.nameEn}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {locale === "tr" ? t.descriptionTr : t.descriptionEn}
                  </p>
                </div>
                {isActive && (
                  <span className="shrink-0 text-[10px] font-bold text-primary">Aktif</span>
                )}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Brand colors */}
      <CollapsibleSection title="MARKA RENKLERİ" defaultOpen={true}>
        {COLOR_FIELDS.filter((f) => f.group === "brand").map((f) => (
          <ColorControl
            key={f.key}
            fieldDef={f}
            value={getEffectiveValue(f.key)}
            onChange={(v) => handleChange(f.key, v)}
          />
        ))}
      </CollapsibleSection>

      {/* Text colors */}
      <CollapsibleSection title="METİN RENKLERİ" defaultOpen={false}>
        {COLOR_FIELDS.filter((f) => f.group === "text").map((f) => (
          <ColorControl
            key={f.key}
            fieldDef={f}
            value={getEffectiveValue(f.key)}
            onChange={(v) => handleChange(f.key, v)}
          />
        ))}
      </CollapsibleSection>

      {/* Surface colors */}
      <CollapsibleSection title="SAYFA RENKLERİ" defaultOpen={false}>
        {COLOR_FIELDS.filter((f) => f.group === "surface").map((f) => (
          <ColorControl
            key={f.key}
            fieldDef={f}
            value={getEffectiveValue(f.key)}
            onChange={(v) => handleChange(f.key, v)}
          />
        ))}
      </CollapsibleSection>

      {/* Hero colors — page scope, hero pages only */}
      {isPageScope &&
        currentPageKey &&
        ["HOME", "LIVE_TRAINING", "ABOUT"].includes(currentPageKey) && (
          <CollapsibleSection title="HERO BÖLÜMÜ" defaultOpen={false}>
            {COLOR_FIELDS.filter((f) => f.group === "page_hero").map((f) => (
              <ColorControl
                key={f.key}
                fieldDef={f}
                value={getEffectiveValue(f.key)}
                onChange={(v) => handleChange(f.key, v)}
              />
            ))}
          </CollapsibleSection>
        )}

      {/* System colors — global only */}
      {!isPageScope && (
        <CollapsibleSection title="SİSTEM RENKLERİ" defaultOpen={false}>
          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-2">
              Başarı/Uyarı/Hata renkleri tüm site genelinde tutarlı kalmalıdır.
            </p>
          </div>
          {COLOR_FIELDS.filter((f) => f.group === "system").map((f) => (
            <ColorControl
              key={f.key}
              fieldDef={f}
              value={getEffectiveValue(f.key)}
              onChange={(v) => handleChange(f.key, v)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Shape */}
      <CollapsibleSection title="ŞEKİL VE KÖŞELER" defaultOpen={false}>
        <div className="px-3 py-2 space-y-1.5">
          <p className="text-[10px] text-muted-foreground mb-1">
            Kartlar, butonlar ve inputların köşe görünümü.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {RADIUS_OPTIONS.map((opt) => {
              const currentRadius =
                (scope === "page"
                  ? (pageOverrides?.radiusPreset as string | undefined)
                  : (globalOverrides?.radiusPreset as string | undefined)) ?? theme.radiusPreset;
              const isSelected = currentRadius === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange("radiusPreset", opt.value)}
                  className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-md border text-[10px] font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.colorPrimary,
                      borderRadius: opt.desc,
                    }}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>

      {/* Reset */}
      <div className="px-3 py-3 border-t border-border">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-muted-foreground hover:text-danger transition-colors"
          >
            {scope === "global" ? "Tema varsayılanına dön" : "Sayfa özelleştirmesini kaldır"}
          </button>
        ) : (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Emin misin?</p>
            <p className="text-[10px] text-muted-foreground">
              {scope === "global"
                ? "Tüm global renk değişiklikleri sıfırlanır."
                : "Bu sayfanın özel görünümü kaldırılır."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetToTheme();
                  setShowResetConfirm(false);
                }}
                className="rounded bg-danger px-3 py-1 text-xs font-semibold text-white"
              >
                Evet, sıfırla
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete page override modal */}
      {showDeletePageConfirm && currentPageKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-xl border border-border p-5 max-w-sm mx-4 space-y-3 shadow-xl">
            <p className="font-bold text-foreground">Global görünüme dön?</p>
            <p className="text-sm text-muted-foreground">
              {PAGE_KEY_LABELS[currentPageKey]} sayfasındaki özel görünüm silinir ve global tema
              kullanılmaya başlanır.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDeletePageOverride(currentPageKey);
                  setShowDeletePageConfirm(false);
                }}
                className="rounded bg-danger px-4 py-1.5 text-sm font-semibold text-white"
              >
                Sil ve Global Temaya Dön
              </button>
              <button
                onClick={() => setShowDeletePageConfirm(false)}
                className="rounded border border-border px-4 py-1.5 text-sm text-muted-foreground"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
