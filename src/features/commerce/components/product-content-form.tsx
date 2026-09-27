"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProductContent } from "@/app/[locale]/admin/products/[productId]/actions";

interface TranslationFields {
  name: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

interface ProductContentFormProps {
  locale: string;
  productId: string;
  productStatus: string;
  currentSlug: string;
  currentCoverImageUrl: string | null;
  translationTr: Partial<TranslationFields>;
  translationEn: Partial<TranslationFields>;
}

const EMPTY: TranslationFields = {
  name: "",
  shortDescription: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
};

export function ProductContentForm({
  locale,
  productId,
  productStatus,
  currentSlug,
  currentCoverImageUrl,
  translationTr,
  translationEn,
}: ProductContentFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tr" | "en">("tr");
  const [slug, setSlug] = useState(currentSlug);
  const [coverImageUrl, setCoverImageUrl] = useState(currentCoverImageUrl ?? "");
  const [tr, setTr] = useState<TranslationFields>({ ...EMPTY, ...translationTr });
  const [en, setEn] = useState<TranslationFields>({ ...EMPTY, ...translationEn });
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const isDraft = productStatus === "DRAFT";

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateProductContent(locale, productId, {
        slug: isDraft ? slug : undefined,
        coverImageUrl: coverImageUrl.trim() || null,
        translations: [
          { locale: "tr", name: tr.name, shortDescription: tr.shortDescription || null, description: tr.description || null, seoTitle: tr.seoTitle || null, seoDescription: tr.seoDescription || null },
          { locale: "en", name: en.name, shortDescription: en.shortDescription || null, description: en.description || null, seoTitle: en.seoTitle || null, seoDescription: en.seoDescription || null },
        ],
      });
      if (result.ok) {
        showToast(true, "İçerik kaydedildi.");
        router.refresh();
      }
    } catch {
      showToast(false, "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        setCoverImageUrl(json.url);
        showToast(true, "Kapak görseli yüklendi.");
      } else {
        showToast(false, json.error ?? "Yükleme başarısız.");
      }
    } catch {
      showToast(false, "Yükleme başarısız.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  const current = activeTab === "tr" ? tr : en;
  const setCurrent = activeTab === "tr"
    ? (f: Partial<TranslationFields>) => setTr((p) => ({ ...p, ...f }))
    : (f: Partial<TranslationFields>) => setEn((p) => ({ ...p, ...f }));

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`text-sm px-4 py-2 rounded-lg border ${toast.ok ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Slug */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Slug
          {!isDraft && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(yayındaki ürünlerde slug değiştirilemez)</span>
          )}
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          disabled={!isDraft}
          className="w-full font-mono text-sm border border-border rounded-lg px-3 py-2 bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="urun-slug"
        />
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Kapak Görseli</label>
        {coverImageUrl && (
          <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt="Kapak" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className={`cursor-pointer inline-flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors ${uploadingCover ? "opacity-50 pointer-events-none" : ""}`}>
            {uploadingCover ? "Yükleniyor..." : "Görsel Seç"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
          </label>
          {coverImageUrl && (
            <button type="button" onClick={() => setCoverImageUrl("")} className="text-xs text-muted-foreground hover:text-destructive">
              Kaldır
            </button>
          )}
        </div>
      </div>

      {/* Language tabs */}
      <div>
        <div className="flex gap-2 mb-4 border-b border-border">
          {(["tr", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTab(lang)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === lang ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {lang === "tr" ? "🇹🇷 Türkçe" : "🇬🇧 English"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Başlık *</label>
            <input
              type="text"
              value={current.name}
              onChange={(e) => setCurrent({ name: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
              placeholder={activeTab === "tr" ? "Ürün adı (Türkçe)" : "Product name (English)"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Kısa Açıklama</label>
            <textarea
              rows={2}
              value={current.shortDescription}
              onChange={(e) => setCurrent({ shortDescription: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none"
              placeholder={activeTab === "tr" ? "Kısa açıklama (kart görünümünde çıkar)" : "Short description (shown on cards)"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Açıklama</label>
            <textarea
              rows={5}
              value={current.description}
              onChange={(e) => setCurrent({ description: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none"
              placeholder={activeTab === "tr" ? "Tam açıklama (ürün sayfasında çıkar)" : "Full description (shown on product page)"}
            />
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SEO</p>
            <div className="space-y-1">
              <label className="text-sm font-medium">SEO Başlığı</label>
              <input
                type="text"
                value={current.seoTitle}
                onChange={(e) => setCurrent({ seoTitle: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                placeholder={activeTab === "tr" ? "Sayfa <title> etiketi" : "Page <title> tag"}
                maxLength={70}
              />
              <p className="text-xs text-muted-foreground">{current.seoTitle.length}/70</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">SEO Açıklaması</label>
              <textarea
                rows={2}
                value={current.seoDescription}
                onChange={(e) => setCurrent({ seoDescription: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none"
                placeholder={activeTab === "tr" ? "meta description" : "meta description"}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{current.seoDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}
