"use client";

import { useState, useTransition } from "react";
import { CtaFlow, PricePresentation } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProductSalesConfig } from "@/app/[locale]/admin/products/[productId]/actions";
import { resolveProductCta, validateCtaConfig, type ProductCtaInput } from "@/server/product-cta";

const PRICE_PRESENTATION_LABELS: Record<PricePresentation, { label: string; hint: string }> = {
  FIXED:  { label: "Sabit Fiyat",    hint: "Belirlediğin fiyat görünür" },
  HIDDEN: { label: "Gizli",          hint: "Fiyat hiç gösterilmez" },
  FROM:   { label: "Başlayan Fiyat", hint: "₺X'dan başlayan şeklinde gösterilir" },
  FREE:   { label: "Ücretsiz",       hint: "Ücretsiz olarak gösterilir (fiyat 0 TL olmalı)" },
};

const CTA_FLOW_LABELS: Record<CtaFlow, { label: string; hint: string }> = {
  INFO_ONLY:               { label: "Bilgi / Ön Görüşme", hint: "Kullanıcı randevu veya bilgi alır, satın alma yoktur" },
  APPLICATION:             { label: "Başvuru",            hint: "Önce başvuru, onay sonrası erişim (ödeme yok)" },
  DIRECT_PURCHASE:         { label: "Direkt Satın Al",    hint: "Direkt ödeme sayfasına gider" },
  APPLICATION_THEN_PURCHASE: { label: "Önce Başvuru → Ödeme", hint: "Başvuru onaylandıktan sonra ödeme yapılır" },
  FREE_ENROLLMENT:         { label: "Ücretsiz Kayıt",    hint: "Kullanıcı ücretsiz olarak kaydolur" },
};

interface Props {
  locale: string;
  productId: string;
  productSlug: string;
  current: {
    pricePresentation: PricePresentation;
    ctaFlow: CtaFlow;
    price: number;
    currency: string;
    primaryCtaLabelTr: string | null;
    primaryCtaLabelEn: string | null;
    secondaryCtaLabelTr: string | null;
    secondaryCtaLabelEn: string | null;
    linkedCourseId: string | null;
    formTemplateId: string | null;
    pageProfileId: string | null;
  };
}

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

export function ProductSalesConfig({ locale, productId, productSlug, current }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [pricePresentation, setPricePresentation] = useState<PricePresentation>(current.pricePresentation);
  const [ctaFlow, setCtaFlow] = useState<CtaFlow>(current.ctaFlow);
  const [priceRaw, setPriceRaw] = useState(current.price > 0 ? String(current.price / 100) : "");
  const [primaryTr, setPrimaryTr] = useState(current.primaryCtaLabelTr ?? "");
  const [primaryEn, setPrimaryEn] = useState(current.primaryCtaLabelEn ?? "");
  const [secondaryTr, setSecondaryTr] = useState(current.secondaryCtaLabelTr ?? "");
  const [secondaryEn, setSecondaryEn] = useState(current.secondaryCtaLabelEn ?? "");

  const showPriceField = pricePresentation === "FIXED" || pricePresentation === "FROM";

  // Build a mock product for the resolver preview
  const previewProduct: ProductCtaInput = {
    id: productId,
    slug: productSlug,
    price: showPriceField ? Math.round(parseFloat(priceRaw || "0") * 100) : 0,
    currency: current.currency,
    purchaseMode: "DIRECT_PURCHASE", // not used in resolver
    pricePresentation,
    ctaFlow,
    primaryCtaLabelTr: primaryTr || null,
    primaryCtaLabelEn: primaryEn || null,
    secondaryCtaLabelTr: secondaryTr || null,
    secondaryCtaLabelEn: secondaryEn || null,
    linkedCourseId: current.linkedCourseId,
    formTemplateId: current.formTemplateId,
    pageProfileId: current.pageProfileId,
  };

  const preview = resolveProductCta(previewProduct, "NOT_LOGGED_IN", "tr");
  const validation = validateCtaConfig(previewProduct);

  function handleSave() {
    const priceInKurus = showPriceField ? Math.round(parseFloat(priceRaw || "0") * 100) : 0;
    startTransition(async () => {
      await updateProductSalesConfig(locale, productId, {
        pricePresentation,
        ctaFlow,
        price: priceInKurus,
        primaryCtaLabelTr: primaryTr || null,
        primaryCtaLabelEn: primaryEn || null,
        secondaryCtaLabelTr: secondaryTr || null,
        secondaryCtaLabelEn: secondaryEn || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: config */}
        <div className="space-y-5">
          {/* Price presentation */}
          <div className="space-y-2">
            <Label className="font-semibold">Fiyat Gösterimi</Label>
            <select
              value={pricePresentation}
              onChange={(e) => setPricePresentation(e.target.value as PricePresentation)}
              className={selectClass}
            >
              {(Object.keys(PRICE_PRESENTATION_LABELS) as PricePresentation[]).map((k) => (
                <option key={k} value={k}>{PRICE_PRESENTATION_LABELS[k].label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{PRICE_PRESENTATION_LABELS[pricePresentation].hint}</p>
          </div>

          {/* Price amount — only when needed */}
          {showPriceField && (
            <div className="space-y-2">
              <Label className="font-semibold">Fiyat (TL)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value)}
                placeholder="24999"
              />
              <p className="text-xs text-muted-foreground">Kuruş değil, tam TL olarak girin. Örn: 24999</p>
            </div>
          )}

          {/* CTA Flow */}
          <div className="space-y-2">
            <Label className="font-semibold">Müşteri Akışı</Label>
            <select
              value={ctaFlow}
              onChange={(e) => setCtaFlow(e.target.value as CtaFlow)}
              className={selectClass}
            >
              {(Object.keys(CTA_FLOW_LABELS) as CtaFlow[]).map((k) => (
                <option key={k} value={k}>{CTA_FLOW_LABELS[k].label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{CTA_FLOW_LABELS[ctaFlow].hint}</p>
          </div>

          {/* Primary CTA label */}
          <div className="space-y-2">
            <Label className="font-semibold">Ana Buton Yazısı <span className="font-normal text-muted-foreground">(opsiyonel)</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">TR</p>
                <Input value={primaryTr} onChange={(e) => setPrimaryTr(e.target.value)} placeholder="Başvur" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">EN</p>
                <Input value={primaryEn} onChange={(e) => setPrimaryEn(e.target.value)} placeholder="Apply" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Boş bırakılırsa otomatik yazı kullanılır.</p>
          </div>

          {/* Secondary CTA label */}
          <div className="space-y-2">
            <Label className="font-semibold">İkincil Buton Yazısı <span className="font-normal text-muted-foreground">(opsiyonel)</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">TR</p>
                <Input value={secondaryTr} onChange={(e) => setSecondaryTr(e.target.value)} placeholder="Ön Görüşme Al" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">EN</p>
                <Input value={secondaryEn} onChange={(e) => setSecondaryEn(e.target.value)} placeholder="Book a Call" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Girilirse ikinci bir aksiyon butonu oluşur (randevu sayfasına yönlendirir).</p>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="space-y-3">
          <Label className="font-semibold">Canlı Önizleme</Label>
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-5 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Müşteri şu şekilde görecek:</p>
            <p className="font-bold text-sm text-muted-foreground">Ürün Adı</p>
            {preview.priceLabel ? (
              <p className="text-2xl font-black text-primary">{preview.priceLabel}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">(fiyat gösterilmez)</p>
            )}
            {preview.primaryCta && (
              <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                preview.primaryCta.disabled
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-primary text-primary-foreground"
              }`}>
                {preview.primaryCta.label}
              </div>
            )}
            {preview.secondaryCta && (
              <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold border border-border text-foreground ml-2">
                {preview.secondaryCta.label}
              </div>
            )}
          </div>

          {/* Validation */}
          {validation.errors.length > 0 && (
            <div className="rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2 space-y-1">
              {validation.errors.map((e, i) => (
                <p key={i} className="text-xs text-danger-subtle-foreground">⛔ {e}</p>
              ))}
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="rounded-lg border border-warning/40 bg-warning-subtle px-3 py-2 space-y-1">
              {validation.warnings.map((w, i) => (
                <p key={i} className="text-xs text-warning-subtle-foreground">⚠️ {w}</p>
              ))}
            </div>
          )}
          {validation.valid && validation.warnings.length === 0 && (
            <p className="text-xs text-success-subtle-foreground bg-success-subtle border border-success/30 rounded-lg px-3 py-2">
              ✓ Yapılandırma geçerli.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={isPending || !validation.valid}>
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        {saved && <span className="text-sm text-success-subtle-foreground font-medium">✓ Kaydedildi</span>}
        {!validation.valid && <span className="text-xs text-danger-subtle-foreground">Hataları düzeltin.</span>}
      </div>
    </div>
  );
}
