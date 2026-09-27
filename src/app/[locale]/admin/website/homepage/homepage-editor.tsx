"use client";

import { useState, useRef, useTransition } from "react";
import { nanoid } from "nanoid";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Upload,
  Loader2,
  CheckCircle,
  Eye,
  Monitor,
  Smartphone,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveHomepageConfig } from "./actions";
import type {
  HomepageConfigData,
  HeroMode,
  HeroConfig,
  HeroStandard,
  HeroSlider,
  HeroBanner,
  HeroStatement,
  HomepageSection,
  SectionType,
  CtaButton,
  CtaDestination,
  SlideItem,
} from "@/lib/homepage-types";

// ── Helpers ────────────────────────────────────────────────────────────────

const CTA_DESTINATIONS: { value: CtaDestination; label: string }[] = [
  { value: "/courses", label: "Kurslar" },
  { value: "/products", label: "Ürünler" },
  { value: "/live", label: "Canlı Eğitimler" },
  { value: "/about", label: "Hakkında" },
  { value: "/register", label: "Kayıt Ol" },
  { value: "/randevu", label: "Randevu Al" },
  { value: "/academy", label: "Akademi" },
];

const HERO_MODES: { value: HeroMode; label: string; desc: string }[] = [
  { value: "STANDARD", label: "Standart", desc: "Başlık + açıklama + görsel + CTA" },
  { value: "SLIDER", label: "Slider", desc: "2–5 slaytlı geçişli hero" },
  { value: "BANNER", label: "Banner", desc: "Kampanya / program duyurusu" },
  { value: "STATEMENT", label: "Slogan", desc: "Güçlü tipografi odaklı hero" },
];

const ADDABLE_SECTIONS: { type: SectionType; label: string }[] = [
  { type: "FEATURED_COURSES", label: "Öne Çıkan Kurslar" },
  { type: "FEATURED_PRODUCTS", label: "Öne Çıkan Ürünler" },
  { type: "LEARNING_OPTIONS", label: "Öğrenme Seçenekleri" },
  { type: "LIVE_TRAINING", label: "Canlı Eğitimler" },
  { type: "ABOUT", label: "Hakkında" },
  { type: "FREE_CONTENT", label: "Ücretsiz İçerikler" },
  { type: "CTA_BANNER", label: "CTA Banner" },
  { type: "TEXT_IMAGE", label: "Metin + Görsel" },
  { type: "FINAL_CTA", label: "Final CTA" },
];

const SECTION_LABELS: Record<SectionType, string> = {
  FEATURED_COURSES: "Öne Çıkan Kurslar",
  FEATURED_PRODUCTS: "Öne Çıkan Ürünler",
  LEARNING_OPTIONS: "Öğrenme Seçenekleri",
  LIVE_TRAINING: "Canlı Eğitimler",
  ABOUT: "Hakkında",
  FREE_CONTENT: "Ücretsiz İçerikler",
  CTA_BANNER: "CTA Banner",
  TEXT_IMAGE: "Metin + Görsel",
  FINAL_CTA: "Final CTA",
};

// ── Shared sub-components ──────────────────────────────────────────────────

function ImageUploadField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... veya yükle"
          className="flex-1"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value && (
        <img
          src={value}
          alt="Önizleme"
          className="h-20 w-auto max-w-[160px] object-cover rounded-lg border border-border"
        />
      )}
    </div>
  );
}

function CtaEditor({
  value,
  onChange,
  label,
}: {
  value?: CtaButton;
  onChange: (cta: CtaButton | undefined) => void;
  label: string;
}) {
  const enabled = !!value;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() =>
            onChange(enabled ? undefined : { label: "", destination: "/courses" })
          }
          className="text-xs text-primary underline"
        >
          {enabled ? "Kaldır" : "Ekle"}
        </button>
      </div>
      {enabled && (
        <div className="flex gap-2">
          <Input
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Buton metni"
            className="flex-1"
          />
          <select
            value={value.destination}
            onChange={(e) =>
              onChange({ ...value, destination: e.target.value as CtaDestination })
            }
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-foreground"
          >
            {CTA_DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Hero editors ──────────────────────────────────────────────────────────

function HeroStandardEditor({
  hero,
  onChange,
}: {
  hero: HeroStandard;
  onChange: (h: HeroStandard) => void;
}) {
  const u = <K extends keyof HeroStandard>(k: K, v: HeroStandard[K]) =>
    onChange({ ...hero, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label>Eyebrow (küçük etiket, isteğe bağlı)</Label>
        <Input value={hero.eyebrow ?? ""} onChange={(e) => u("eyebrow", e.target.value)} placeholder="ör. Dijital Pazarlama Akademisi" />
      </div>
      <div>
        <Label>Başlık (TR) — satır atlamak için \n kullan</Label>
        <Input data-testid="hero-headline-input" value={hero.headlineTr} onChange={(e) => u("headlineTr", e.target.value)} />
      </div>
      <div>
        <Label>Başlık (EN, isteğe bağlı)</Label>
        <Input value={hero.headlineEn ?? ""} onChange={(e) => u("headlineEn", e.target.value)} />
      </div>
      <div>
        <Label>Vurgulanan kelime/ifade (başlık içindeki renkli kısım)</Label>
        <Input value={hero.highlightedText ?? ""} onChange={(e) => u("highlightedText", e.target.value)} placeholder="ör. Gerçek Sonuçlar" />
      </div>
      <div>
        <Label>Açıklama (TR)</Label>
        <textarea
          value={hero.descriptionTr ?? ""}
          onChange={(e) => u("descriptionTr", e.target.value)}
          rows={3}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
        />
      </div>
      <div>
        <Label>Açıklama (EN, isteğe bağlı)</Label>
        <textarea
          value={hero.descriptionEn ?? ""}
          onChange={(e) => u("descriptionEn", e.target.value)}
          rows={2}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
        />
      </div>
      <ImageUploadField value={hero.imageUrl ?? ""} onChange={(v) => u("imageUrl", v)} label="Hero görseli" />
      <CtaEditor value={hero.primaryCta} onChange={(v) => u("primaryCta", v)} label="Birincil CTA" />
      <CtaEditor value={hero.secondaryCta} onChange={(v) => u("secondaryCta", v)} label="İkincil CTA" />
      <div>
        <Label>Hizalama</Label>
        <select
          value={hero.alignment ?? "left"}
          onChange={(e) => u("alignment", e.target.value as "left" | "center")}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-foreground"
        >
          <option value="left">Sol</option>
          <option value="center">Ortala</option>
        </select>
      </div>
    </div>
  );
}

function SlideEditor({
  slide,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  slide: SlideItem;
  onChange: (s: SlideItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const u = <K extends keyof SlideItem>(k: K, v: SlideItem[K]) => onChange({ ...slide, [k]: v });

  return (
    <div className="border border-border rounded-lg overflow-hidden" data-testid="slide-row">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left text-sm font-medium text-foreground"
        >
          {slide.headlineTr || "Başlıksız slayt"}
        </button>
        <button
          type="button"
          onClick={() => u("enabled", !slide.enabled)}
          title={slide.enabled ? "Devre dışı bırak" : "Etkinleştir"}
        >
          {slide.enabled ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="p-4 space-y-3 border-t border-border">
          <div>
            <Label>Başlık (TR)</Label>
            <Input data-testid="slide-headline-input" value={slide.headlineTr} onChange={(e) => u("headlineTr", e.target.value)} />
          </div>
          <div>
            <Label>Başlık (EN)</Label>
            <Input value={slide.headlineEn ?? ""} onChange={(e) => u("headlineEn", e.target.value)} />
          </div>
          <div>
            <Label>Açıklama (TR)</Label>
            <textarea
              value={slide.descriptionTr ?? ""}
              onChange={(e) => u("descriptionTr", e.target.value)}
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
            />
          </div>
          <ImageUploadField value={slide.imageUrl ?? ""} onChange={(v) => u("imageUrl", v)} label="Görsel" />
          <CtaEditor value={slide.primaryCta} onChange={(v) => u("primaryCta", v)} label="Birincil CTA" />
          <CtaEditor value={slide.secondaryCta} onChange={(v) => u("secondaryCta", v)} label="İkincil CTA" />
        </div>
      )}
    </div>
  );
}

function HeroSliderEditor({
  hero,
  onChange,
}: {
  hero: HeroSlider;
  onChange: (h: HeroSlider) => void;
}) {
  const setSlides = (slides: SlideItem[]) => onChange({ ...hero, slides });

  const addSlide = () => {
    if (hero.slides.length >= 5) return;
    setSlides([
      ...hero.slides,
      { id: nanoid(), headlineTr: "", enabled: true },
    ]);
  };

  const move = (index: number, dir: -1 | 1) => {
    const arr = [...hero.slides];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setSlides(arr);
  };

  return (
    <div className="space-y-4" data-testid="slider-editor">
      {/* Autoplay settings */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/40 rounded-lg text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hero.autoplay ?? false}
            onChange={(e) => onChange({ ...hero, autoplay: e.target.checked })}
            className="rounded"
          />
          <span className="font-medium text-foreground">Otomatik geçiş</span>
        </label>
        {hero.autoplay && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Interval:</span>
            <select
              value={hero.autoplayInterval ?? 5000}
              onChange={(e) => onChange({ ...hero, autoplayInterval: Number(e.target.value) as 3000 | 4000 | 5000 | 6000 })}
              className="border border-border rounded px-2 py-1 text-sm bg-surface text-foreground"
            >
              <option value={3000}>3 saniye</option>
              <option value={4000}>4 saniye</option>
              <option value={5000}>5 saniye</option>
              <option value={6000}>6 saniye</option>
            </select>
          </div>
        )}
      </div>

      {hero.slides.map((slide, i) => (
        <SlideEditor
          key={slide.id}
          slide={slide}
          onChange={(s) => {
            const arr = [...hero.slides];
            arr[i] = s;
            setSlides(arr);
          }}
          onRemove={() => setSlides(hero.slides.filter((_, j) => j !== i))}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          canMoveUp={i > 0}
          canMoveDown={i < hero.slides.length - 1}
        />
      ))}
      {hero.slides.length < 5 && (
        <Button type="button" variant="outline" size="sm" onClick={addSlide}>
          <Plus className="h-4 w-4 mr-1" /> Slayt Ekle
        </Button>
      )}
      {hero.slides.length === 0 && (
        <p className="text-sm text-muted-foreground">Henüz slayt eklenmedi.</p>
      )}
    </div>
  );
}

function HeroBannerEditor({
  hero,
  onChange,
}: {
  hero: HeroBanner;
  onChange: (h: HeroBanner) => void;
}) {
  const u = <K extends keyof HeroBanner>(k: K, v: HeroBanner[K]) => onChange({ ...hero, [k]: v });
  return (
    <div className="space-y-4">
      <ImageUploadField value={hero.imageUrl ?? ""} onChange={(v) => u("imageUrl", v)} label="Banner görseli / artwork" />
      <div>
        <Label>Başlık (TR, isteğe bağlı)</Label>
        <Input value={hero.headlineTr ?? ""} onChange={(e) => u("headlineTr", e.target.value)} placeholder="ör. Yeni Mentörlük Programı" />
      </div>
      <div>
        <Label>Başlık (EN, isteğe bağlı)</Label>
        <Input value={hero.headlineEn ?? ""} onChange={(e) => u("headlineEn", e.target.value)} />
      </div>
      <div>
        <Label>Açıklama (TR, isteğe bağlı)</Label>
        <textarea
          value={hero.descriptionTr ?? ""}
          onChange={(e) => u("descriptionTr", e.target.value)}
          rows={2}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
        />
      </div>
      <CtaEditor value={hero.primaryCta} onChange={(v) => u("primaryCta", v)} label="CTA Butonu" />
    </div>
  );
}

function HeroStatementEditor({
  hero,
  onChange,
}: {
  hero: HeroStatement;
  onChange: (h: HeroStatement) => void;
}) {
  const u = <K extends keyof HeroStatement>(k: K, v: HeroStatement[K]) => onChange({ ...hero, [k]: v });
  return (
    <div className="space-y-4">
      <div>
        <Label>Slogan (TR) — güçlü, kısa. Satır atlamak için \n kullan</Label>
        <textarea
          value={hero.sloganTr}
          onChange={(e) => u("sloganTr", e.target.value)}
          rows={3}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none font-bold"
          placeholder={"ör. Reklam vermek kolay.\nSonuç üretmek sistem ister."}
        />
      </div>
      <div>
        <Label>Slogan (EN, isteğe bağlı)</Label>
        <textarea
          value={hero.sloganEn ?? ""}
          onChange={(e) => u("sloganEn", e.target.value)}
          rows={2}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
        />
      </div>
      <div>
        <Label>Alt metin (TR, isteğe bağlı)</Label>
        <Input value={hero.subtextTr ?? ""} onChange={(e) => u("subtextTr", e.target.value)} />
      </div>
      <ImageUploadField value={hero.backgroundImageUrl ?? ""} onChange={(v) => u("backgroundImageUrl", v)} label="Arka plan görseli (isteğe bağlı)" />
      <CtaEditor value={hero.primaryCta} onChange={(v) => u("primaryCta", v)} label="CTA Butonu" />
      <div>
        <Label>Hizalama</Label>
        <select
          value={hero.alignment ?? "left"}
          onChange={(e) => u("alignment", e.target.value as "left" | "center")}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-foreground"
        >
          <option value="left">Sol</option>
          <option value="center">Ortala</option>
        </select>
      </div>
    </div>
  );
}

// ── Section editors ────────────────────────────────────────────────────────

function SectionRow({
  section,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: HomepageSection;
  onChange: (s: HomepageSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = SECTION_LABELS[section.type];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-surface">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left text-sm font-semibold text-foreground"
        >
          {label}
          {!section.enabled && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(gizli)</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...section, enabled: !section.enabled } as HomepageSection)}
          title={section.enabled ? "Gizle" : "Göster"}
          className="flex items-center gap-1 text-xs"
        >
          {section.enabled ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-primary hover:underline"
        >
          {open ? "Kapat" : "Düzenle"}
        </button>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="p-4 border-t border-border space-y-3">
          <SectionFields section={section} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function SectionFields({
  section,
  onChange,
}: {
  section: HomepageSection;
  onChange: (s: HomepageSection) => void;
}) {
  const u = (patch: Partial<HomepageSection>) =>
    onChange({ ...section, ...patch } as HomepageSection);

  if (
    section.type === "FEATURED_COURSES" ||
    section.type === "FEATURED_PRODUCTS" ||
    section.type === "LEARNING_OPTIONS" ||
    section.type === "LIVE_TRAINING" ||
    section.type === "FREE_CONTENT"
  ) {
    return (
      <div className="space-y-3">
        <div>
          <Label>Başlık (TR)</Label>
          <Input
            value={(section as { headlineTr?: string }).headlineTr ?? ""}
            onChange={(e) => u({ headlineTr: e.target.value } as Partial<HomepageSection>)}
          />
        </div>
        <div>
          <Label>Alt başlık (TR, isteğe bağlı)</Label>
          <Input
            value={(section as { subtitleTr?: string }).subtitleTr ?? ""}
            onChange={(e) => u({ subtitleTr: e.target.value } as Partial<HomepageSection>)}
          />
        </div>
        {(section.type === "FEATURED_COURSES" || section.type === "FEATURED_PRODUCTS") && (
          <div>
            <Label>İçerik seçimi</Label>
            <select
              value={section.mode}
              onChange={(e) => u({ mode: e.target.value as "AUTO" | "MANUAL" } as Partial<HomepageSection>)}
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-foreground"
            >
              <option value="AUTO">Otomatik (yayındaki içerikleri göster)</option>
              <option value="MANUAL">Manuel (belirli içerikleri seç)</option>
            </select>
            {section.mode === "MANUAL" && (
              <p className="text-xs text-muted-foreground mt-1">
                Manuel seçim için içerik ID&apos;lerini virgülle girin:
              </p>
            )}
            {section.mode === "MANUAL" && (
              <Input
                value={section.manualIds?.join(", ") ?? ""}
                onChange={(e) =>
                  u({
                    manualIds: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  } as Partial<HomepageSection>)
                }
                placeholder="id1, id2, id3"
                className="mt-1"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (section.type === "ABOUT") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Başlık (TR)</Label>
          <Input value={section.headlineTr ?? ""} onChange={(e) => u({ headlineTr: e.target.value })} />
        </div>
        <div>
          <Label>Metin (TR)</Label>
          <textarea
            value={section.bodyTr ?? ""}
            onChange={(e) => u({ bodyTr: e.target.value })}
            rows={4}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
          />
        </div>
        <ImageUploadField value={section.imageUrl ?? ""} onChange={(v) => u({ imageUrl: v })} label="Görsel" />
        <div>
          <Label>CTA metni (isteğe bağlı)</Label>
          <Input value={section.ctaLabel ?? ""} onChange={(e) => u({ ctaLabel: e.target.value })} placeholder="Daha Fazla →" />
        </div>
      </div>
    );
  }

  if (section.type === "CTA_BANNER") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Başlık (TR)</Label>
          <Input value={section.headlineTr} onChange={(e) => u({ headlineTr: e.target.value })} />
        </div>
        <div>
          <Label>Açıklama (TR, isteğe bağlı)</Label>
          <textarea
            value={section.descriptionTr ?? ""}
            onChange={(e) => u({ descriptionTr: e.target.value })}
            rows={2}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
          />
        </div>
        <ImageUploadField value={section.imageUrl ?? ""} onChange={(v) => u({ imageUrl: v })} label="Görsel (isteğe bağlı)" />
        <CtaEditor value={section.primaryCta} onChange={(v) => u({ primaryCta: v })} label="CTA Butonu" />
      </div>
    );
  }

  if (section.type === "TEXT_IMAGE") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Başlık (TR)</Label>
          <Input value={section.headlineTr} onChange={(e) => u({ headlineTr: e.target.value })} />
        </div>
        <div>
          <Label>Açıklama (TR)</Label>
          <textarea
            value={section.descriptionTr ?? ""}
            onChange={(e) => u({ descriptionTr: e.target.value })}
            rows={3}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-foreground resize-none"
          />
        </div>
        <ImageUploadField value={section.imageUrl ?? ""} onChange={(v) => u({ imageUrl: v })} label="Görsel" />
        <div>
          <Label>Görsel konumu</Label>
          <select
            value={section.imagePosition ?? "right"}
            onChange={(e) => u({ imagePosition: e.target.value as "left" | "right" })}
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-foreground"
          >
            <option value="left">Sol</option>
            <option value="right">Sağ</option>
          </select>
        </div>
        <CtaEditor value={section.primaryCta} onChange={(v) => u({ primaryCta: v })} label="CTA Butonu" />
      </div>
    );
  }

  if (section.type === "FINAL_CTA") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Başlık (TR)</Label>
          <Input value={section.headlineTr ?? ""} onChange={(e) => u({ headlineTr: e.target.value })} />
        </div>
        <div>
          <Label>Alt başlık (TR, isteğe bağlı)</Label>
          <Input value={section.subtitleTr ?? ""} onChange={(e) => u({ subtitleTr: e.target.value })} />
        </div>
        <CtaEditor value={section.primaryCta} onChange={(v) => u({ primaryCta: v })} label="CTA Butonu" />
      </div>
    );
  }

  return null;
}

// ── Main editor ────────────────────────────────────────────────────────────

function createDefaultSection(type: SectionType): HomepageSection {
  const id = nanoid();
  switch (type) {
    case "FEATURED_COURSES":
      return { type, id, enabled: true, headlineTr: "Öne Çıkan Kurslar", mode: "AUTO" };
    case "FEATURED_PRODUCTS":
      return { type, id, enabled: true, headlineTr: "Öne Çıkan Ürünler", mode: "AUTO" };
    case "LEARNING_OPTIONS":
      return { type, id, enabled: true, headlineTr: "Nasıl Öğrenmek İstersin?" };
    case "LIVE_TRAINING":
      return { type, id, enabled: true, headlineTr: "Canlı Eğitimler" };
    case "ABOUT":
      return { type, id, enabled: true, headlineTr: "Ferhat Hakkında" };
    case "FREE_CONTENT":
      return { type, id, enabled: true, headlineTr: "Ücretsiz İçerikler" };
    case "CTA_BANNER":
      return { type, id, enabled: true, headlineTr: "" };
    case "TEXT_IMAGE":
      return { type, id, enabled: true, headlineTr: "", imagePosition: "right" };
    case "FINAL_CTA":
      return { type, id, enabled: true, headlineTr: "Öğrenmeye Bugün Başla" };
  }
}

function changeHeroMode(current: HeroConfig, newMode: HeroMode): HeroConfig {
  if (newMode === current.mode) return current;
  switch (newMode) {
    case "STANDARD":
      return { mode: "STANDARD", headlineTr: "", alignment: "left" };
    case "SLIDER":
      return { mode: "SLIDER", slides: [] };
    case "BANNER":
      return { mode: "BANNER", enabled: true };
    case "STATEMENT":
      return { mode: "STATEMENT", sloganTr: "", alignment: "left" };
  }
}

export function HomepageEditor({
  initialConfig,
  locale,
}: {
  initialConfig: HomepageConfigData;
  locale: string;
}) {
  const [config, setConfig] = useState<HomepageConfigData>(initialConfig);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showAddSection, setShowAddSection] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        await saveHomepageConfig(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydetme başarısız");
      }
    });
  };

  const setHero = (hero: HeroConfig) => setConfig((c) => ({ ...c, hero }));
  const setSections = (sections: HomepageSection[]) => setConfig((c) => ({ ...c, sections }));

  const moveSection = (index: number, dir: -1 | 1) => {
    const arr = [...config.sections];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setSections(arr);
  };

  const addSection = (type: SectionType) => {
    setSections([...config.sections, createDefaultSection(type)]);
    setShowAddSection(false);
  };

  const currentHeroMode = config.hero.mode;

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl px-4 py-3 sticky top-4 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
            Canlı sayfayı aç
          </a>
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded-md transition-colors ${previewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded-md transition-colors ${previewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Yayınlandı
            </span>
          )}
          {error && <span className="text-sm text-red-500">{error}</span>}
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Kaydet & Yayınla
          </Button>
        </div>
      </div>

      {/* Preview hint */}
      <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-2">
        Değişiklikleri kaydetmeden önce &quot;Canlı sayfayı aç&quot; bağlantısından kontrol edebilirsin.
        {previewMode === "mobile" && " Mobil görünüm için sayfayı telefonundan veya DevTools ile görüntüle."}
      </div>

      {/* ── HERO ── */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Hero</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ana sayfanın en üst bölümü</p>
        </div>
        <div className="p-5 space-y-5">
          {/* Mode selector */}
          <div>
            <Label className="mb-2 block">Hero Modu</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HERO_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setHero(changeHeroMode(config.hero, m.value))}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    currentHeroMode === m.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 bg-surface"
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific editor */}
          <div className="border-t border-border pt-4">
            {config.hero.mode === "STANDARD" && (
              <HeroStandardEditor
                hero={config.hero as HeroStandard}
                onChange={setHero}
              />
            )}
            {config.hero.mode === "SLIDER" && (
              <HeroSliderEditor
                hero={config.hero as HeroSlider}
                onChange={setHero}
              />
            )}
            {config.hero.mode === "BANNER" && (
              <HeroBannerEditor
                hero={config.hero as HeroBanner}
                onChange={setHero}
              />
            )}
            {config.hero.mode === "STATEMENT" && (
              <HeroStatementEditor
                hero={config.hero as HeroStatement}
                onChange={setHero}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground">Bölümler</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sırala, gizle/göster, düzenle veya yeni bölüm ekle
            </p>
          </div>
        </div>
        <div className="p-5 space-y-2">
          {config.sections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz bölüm yok. Aşağıdan ekleyebilirsin.
            </p>
          )}
          {config.sections.map((section, i) => (
            <SectionRow
              key={section.id}
              section={section}
              onChange={(s) => {
                const arr = [...config.sections];
                arr[i] = s;
                setSections(arr);
              }}
              onRemove={() => setSections(config.sections.filter((_, j) => j !== i))}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < config.sections.length - 1}
            />
          ))}

          {/* Add section */}
          <div className="pt-2">
            {showAddSection ? (
              <div className="border border-dashed border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground mb-2">Bölüm türü seç:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ADDABLE_SECTIONS.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => addSection(s.type)}
                      className="text-left px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSection(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors w-full justify-center"
              >
                <Plus className="h-4 w-4" /> Bölüm Ekle
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
