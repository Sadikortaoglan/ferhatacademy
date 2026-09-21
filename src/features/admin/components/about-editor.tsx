"use client";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload, GripVertical, CheckCircle } from "lucide-react";
import {
  saveAboutHero,
  saveAboutStats,
  saveAboutTimeline,
  saveAboutExpertise,
  saveAboutGallery,
} from "@/app/[locale]/admin/about/actions";

type Stat = { value: string; label: string };
type TimelineItem = { year: string; title: string; desc: string; color: string };
type ExpertiseItem = { icon: string; title: string; desc: string };
type GalleryImage = { url: string; alt: string };

interface Props {
  settings: {
    heroTitle: string;
    heroBio: string;
    heroImageUrl: string;
    badge: string;
    stats: Stat[];
    timeline: TimelineItem[];
    expertise: ExpertiseItem[];
    gallery: GalleryImage[];
  };
}

const TABS = ["Hero", "İstatistikler", "Zaman Tüneli", "Uzmanlık", "Galeri"] as const;
type Tab = typeof TABS[number];

const TIMELINE_COLORS = [
  { label: "Turuncu", value: "bg-orange-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Sarı", value: "bg-yellow-500" },
  { label: "Mavi", value: "bg-blue-500" },
  { label: "Yeşil", value: "bg-green-500" },
  { label: "Mor", value: "bg-purple-500" },
  { label: "Ana Renk", value: "bg-primary" },
];

function SaveBadge({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return (
    <span className="flex items-center gap-1 text-sm text-success">
      <CheckCircle className="h-4 w-4" /> Kaydedildi
    </span>
  );
}

function ImageUploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
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
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." className="flex-1" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {value && (
        <img src={value} alt="Önizleme" className="h-24 w-24 object-cover rounded-lg border border-border" />
      )}
    </div>
  );
}

function HeroTab({ initial }: { initial: Props["settings"] }) {
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle);
  const [heroBio, setHeroBio] = useState(initial.heroBio);
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl);
  const [badge, setBadge] = useState(initial.badge);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setLoading(true);
    await saveAboutHero({ heroTitle, heroBio, heroImageUrl, badge });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Rozet Metni</Label>
        <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Danışmanlık & Eğitim" />
      </div>
      <div className="space-y-2">
        <Label>Başlık</Label>
        <textarea
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          placeholder="Merhaba,\nben Ferhat."
        />
        <p className="text-xs text-muted-foreground">İkinci satırı renkli yapmak için yeni satır kullan</p>
      </div>
      <div className="space-y-2">
        <Label>Bio / Kısa Açıklama</Label>
        <textarea
          value={heroBio}
          onChange={(e) => setHeroBio(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
        />
      </div>
      <ImageUploadField label="Profil Fotoğrafı" value={heroImageUrl} onChange={setHeroImageUrl} />
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Kaydet
        </Button>
        <SaveBadge saved={saved} />
      </div>
    </div>
  );
}

function StatsTab({ initial }: { initial: Stat[] }) {
  const [stats, setStats] = useState<Stat[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (i: number, field: keyof Stat, val: string) =>
    setStats((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const remove = (i: number) => setStats((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setStats((prev) => [...prev, { value: "", label: "" }]);

  const save = async () => {
    setLoading(true);
    await saveAboutStats(stats);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {stats.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input value={s.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="500+" className="w-28" />
            <Input value={s.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="Mutlu Öğrenci" className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} className="text-danger hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={add} className="flex items-center gap-1">
        <Plus className="h-4 w-4" /> İstatistik Ekle
      </Button>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Kaydet
        </Button>
        <SaveBadge saved={saved} />
      </div>
    </div>
  );
}

function TimelineTab({ initial }: { initial: TimelineItem[] }) {
  const [items, setItems] = useState<TimelineItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (i: number, field: keyof TimelineItem, val: string) =>
    setItems((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, { year: "", title: "", desc: "", color: "bg-primary" }]);

  const save = async () => {
    setLoading(true);
    await saveAboutTimeline(items);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-danger transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Yıl</Label>
              <Input value={item.year} onChange={(e) => update(i, "year", e.target.value)} placeholder="2024" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renk</Label>
              <select
                value={item.color}
                onChange={(e) => update(i, "color", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIMELINE_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Başlık</Label>
            <Input value={item.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Ferhat Academy" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Açıklama</Label>
            <textarea
              value={item.desc}
              onChange={(e) => update(i, "desc", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="flex items-center gap-1">
        <Plus className="h-4 w-4" /> Olay Ekle
      </Button>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Kaydet
        </Button>
        <SaveBadge saved={saved} />
      </div>
    </div>
  );
}

function ExpertiseTab({ initial }: { initial: ExpertiseItem[] }) {
  const [items, setItems] = useState<ExpertiseItem[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (i: number, field: keyof ExpertiseItem, val: string) =>
    setItems((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, { icon: "⭐", title: "", desc: "" }]);

  const save = async () => {
    setLoading(true);
    await saveAboutExpertise(items);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-danger transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">İkon (emoji)</Label>
              <Input value={item.icon} onChange={(e) => update(i, "icon", e.target.value)} placeholder="📣" className="text-xl" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Başlık</Label>
              <Input value={item.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Meta Ads" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Açıklama</Label>
            <Input value={item.desc} onChange={(e) => update(i, "desc", e.target.value)} placeholder="Kısa açıklama..." />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="flex items-center gap-1">
        <Plus className="h-4 w-4" /> Uzmanlık Ekle
      </Button>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Kaydet
        </Button>
        <SaveBadge saved={saved} />
      </div>
    </div>
  );
}

function GalleryTab({ initial }: { initial: GalleryImage[] }) {
  const [images, setImages] = useState<GalleryImage[]>(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (i: number, field: keyof GalleryImage, val: string) =>
    setImages((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const remove = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          setImages((prev) => [...prev, { url: data.url, alt: file.name.replace(/\.[^.]+$/, "") }]);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setLoading(true);
    await saveAboutGallery(images);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <div key={i} className="relative group">
            <img src={img.url} alt={img.alt} className="w-full aspect-square object-cover rounded-lg border border-border" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
              <Input
                value={img.alt}
                onChange={(e) => update(i, "alt", e.target.value)}
                placeholder="Alt metin"
                className="text-xs h-7 bg-white/90 text-foreground"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-white bg-danger/80 hover:bg-danger rounded-full p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
          <span className="text-xs">{uploading ? "Yükleniyor..." : "Fotoğraf Ekle"}</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground">Birden fazla dosya seçebilirsin. Hover ile sil veya alt metin düzenle.</p>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Kaydet
        </Button>
        <SaveBadge saved={saved} />
      </div>
    </div>
  );
}

export function AboutEditor({ settings }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Hero");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {activeTab === "Hero" && <HeroTab initial={settings} />}
          {activeTab === "İstatistikler" && <StatsTab initial={settings.stats} />}
          {activeTab === "Zaman Tüneli" && <TimelineTab initial={settings.timeline} />}
          {activeTab === "Uzmanlık" && <ExpertiseTab initial={settings.expertise} />}
          {activeTab === "Galeri" && <GalleryTab initial={settings.gallery} />}
        </CardContent>
      </Card>
    </div>
  );
}
