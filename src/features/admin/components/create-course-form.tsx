"use client";
import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createCourse } from "@/features/admin/actions/courses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, CheckCircle, XCircle, Loader2, Upload } from "lucide-react";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanın"),
  titleTr: z.string().min(1),
  titleEn: z.string().optional(),
  shortDescTr: z.string().optional(),
  shortDescEn: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function CoverPreview({
  url,
  onUpload,
}: {
  url: string;
  onUpload: (newUrl: string) => void;
}) {
  const [imgStatus, setImgStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const youtubeId = url ? extractYouTubeId(url) : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!url || youtubeId) { setImgStatus("idle"); return; }
    setImgStatus("loading");
    const img = new Image();
    img.onload = () => setImgStatus("ok");
    img.onerror = () => setImgStatus("error");
    img.src = url;
  }, [url, youtubeId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yükleme başarısız");
      onUpload(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const renderPreview = () => {
    if (youtubeId) {
      return (
        <div className="relative rounded-xl overflow-hidden border border-border aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            ▶ YouTube
          </div>
        </div>
      );
    }
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[140px] rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground text-sm gap-2 p-4">
          <ImageIcon className="h-8 w-8 opacity-40" />
          <span className="text-center text-xs">URL gir ya da fotoğraf yükle</span>
        </div>
      );
    }
    if (imgStatus === "loading") return (
      <div className="flex items-center justify-center h-full min-h-[140px] rounded-xl border border-border bg-muted/40 text-muted-foreground gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
      </div>
    );
    if (imgStatus === "error") return (
      <div className="flex flex-col items-center justify-center h-full min-h-[140px] rounded-xl border border-danger/30 bg-danger/5 text-danger gap-2 text-sm p-4">
        <XCircle className="h-5 w-5" />
        <span className="text-xs text-center">Görsel yüklenemedi — URL&apos;yi kontrol et</span>
      </div>
    );
    return (
      <div className="relative rounded-xl overflow-hidden border border-border aspect-video">
        <img src={url} alt="Kapak önizleme" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-success/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          <CheckCircle className="h-3.5 w-3.5" /> Hazır
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderPreview()}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
        </button>
        {uploadError && <span className="text-xs text-danger">{uploadError}</span>}
      </div>
    </div>
  );
}

export function CreateCourseForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { coverImageUrl: "" },
  });

  const coverImageUrl = useWatch({ control, name: "coverImageUrl" }) ?? "";

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const course = await createCourse(data);
      router.push(`/${locale}/admin/courses/${course.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* URL */}
          <div className="space-y-2">
            <Label>Kurs Linki (URL) *</Label>
            <Input placeholder="meta-reklamcilik-temelleri" {...register("slug")} />
            {errors.slug
              ? <p className="text-xs text-danger">{errors.slug.message}</p>
              : <p className="text-xs text-muted-foreground">Kursun internet adresinin son kısmı. Örnek: <span className="font-mono">meta-ads-2025</span></p>
            }
          </div>

          {/* Başlıklar */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("titleTr")} *</Label>
              <Input {...register("titleTr")} placeholder="Meta Reklamcılık Temelleri" />
              {errors.titleTr && <p className="text-xs text-danger">Zorunlu alan</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("titleEn")} <span className="text-muted-foreground text-xs font-normal">(opsiyonel)</span></Label>
              <Input {...register("titleEn")} placeholder="Meta Ads Fundamentals" />
            </div>
          </div>

          {/* Kısa açıklamalar */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("shortDescTr")} <span className="text-muted-foreground text-xs font-normal">(opsiyonel)</span></Label>
              <Input {...register("shortDescTr")} placeholder="Kısa tanıtım cümlesi..." />
            </div>
            <div className="space-y-2">
              <Label>{t("shortDescEn")} <span className="text-muted-foreground text-xs font-normal">(opsiyonel)</span></Label>
              <Input {...register("shortDescEn")} placeholder="Short description..." />
            </div>
          </div>

          {/* Kapak görseli — URL + preview yan yana */}
          <div className="space-y-3">
            <Label>{t("coverImageUrl")} <span className="text-muted-foreground text-xs font-normal">(YouTube linki veya görsel URL)</span></Label>
            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/... veya youtube.com/..."
                  {...register("coverImageUrl")}
                />
                <p className="text-xs text-muted-foreground">YouTube linki girer isen video, resim linki girer isen resim görürsün</p>
              </div>
              <CoverPreview
                url={coverImageUrl}
                onUpload={(newUrl) => setValue("coverImageUrl", newUrl, { shouldValidate: true })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Oluşturuluyor...</> : t("createCourse")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
