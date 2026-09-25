"use client";

import { useState, useTransition } from "react";
import {
  updateProfile,
  addFaqItem,
  updateFaqItem,
  deleteFaqItem,
  addProcessStep,
  updateProcessStep,
  deleteProcessStep,
} from "../actions";

type FaqItem = {
  id: string;
  questionTr: string;
  questionEn: string;
  answerTr: string;
  answerEn: string;
  position: number;
  enabled: boolean;
};

type ProcessStep = {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr?: string | null;
  descEn?: string | null;
  position: number;
};

type Profile = {
  id: string;
  key: string;
  headlineTr: string;
  headlineEn: string;
  subtitleTr?: string | null;
  subtitleEn?: string | null;
  programVisualUrl?: string | null;
  motivationTr?: string | null;
  motivationEn?: string | null;
  ctaLabelTr: string;
  ctaLabelEn: string;
  layout: string;
  faqItems: FaqItem[];
  processSteps: ProcessStep[];
  products: { id: string; translations: { locale: string; name: string }[] }[];
};

const inputClass =
  "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const textareaClass = inputClass + " resize-y min-h-[80px]";

export function ProfileEditor({ locale, profile }: { locale: string; profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [meta, setMeta] = useState({
    headlineTr: profile.headlineTr,
    headlineEn: profile.headlineEn,
    subtitleTr: profile.subtitleTr ?? "",
    subtitleEn: profile.subtitleEn ?? "",
    programVisualUrl: profile.programVisualUrl ?? "",
    motivationTr: profile.motivationTr ?? "",
    motivationEn: profile.motivationEn ?? "",
    ctaLabelTr: profile.ctaLabelTr,
    ctaLabelEn: profile.ctaLabelEn,
    layout: profile.layout,
  });

  const [faqItems, setFaqItems] = useState<FaqItem[]>(profile.faqItems);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(profile.processSteps);

  function handleSaveMeta() {
    startTransition(async () => {
      await updateProfile(locale, profile.id, meta);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  // FAQ
  const [newFaq, setNewFaq] = useState({ questionTr: "", questionEn: "", answerTr: "", answerEn: "" });
  function handleAddFaq() {
    if (!newFaq.questionTr || !newFaq.answerTr) return;
    startTransition(async () => {
      const item = await addFaqItem(locale, profile.id, {
        questionTr: newFaq.questionTr,
        questionEn: newFaq.questionEn || newFaq.questionTr,
        answerTr: newFaq.answerTr,
        answerEn: newFaq.answerEn || newFaq.answerTr,
      });
      setFaqItems((prev) => [...prev, item as FaqItem]);
      setNewFaq({ questionTr: "", questionEn: "", answerTr: "", answerEn: "" });
    });
  }
  function handleDeleteFaq(id: string) {
    startTransition(async () => {
      await deleteFaqItem(locale, id);
      setFaqItems((prev) => prev.filter((f) => f.id !== id));
    });
  }
  function handleToggleFaq(id: string, enabled: boolean) {
    startTransition(async () => {
      await updateFaqItem(locale, id, { enabled });
      setFaqItems((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)));
    });
  }

  // Process steps
  const [newStep, setNewStep] = useState({ titleTr: "", titleEn: "", descTr: "", descEn: "" });
  function handleAddStep() {
    if (!newStep.titleTr) return;
    startTransition(async () => {
      const step = await addProcessStep(locale, profile.id, {
        titleTr: newStep.titleTr,
        titleEn: newStep.titleEn || newStep.titleTr,
        descTr: newStep.descTr || undefined,
        descEn: newStep.descEn || undefined,
      });
      setProcessSteps((prev) => [...prev, step as ProcessStep]);
      setNewStep({ titleTr: "", titleEn: "", descTr: "", descEn: "" });
    });
  }
  function handleDeleteStep(id: string) {
    startTransition(async () => {
      await deleteProcessStep(locale, id);
      setProcessSteps((prev) => prev.filter((s) => s.id !== id));
    });
  }

  return (
    <div className="space-y-8">
      {/* Meta */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground border-b border-border pb-2">Genel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Başlık (TR) *</label>
            <input className={inputClass} value={meta.headlineTr} onChange={(e) => setMeta((p) => ({ ...p, headlineTr: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Başlık (EN) *</label>
            <input className={inputClass} value={meta.headlineEn} onChange={(e) => setMeta((p) => ({ ...p, headlineEn: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Alt Başlık (TR)</label>
            <input className={inputClass} value={meta.subtitleTr} onChange={(e) => setMeta((p) => ({ ...p, subtitleTr: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Alt Başlık (EN)</label>
            <input className={inputClass} value={meta.subtitleEn} onChange={(e) => setMeta((p) => ({ ...p, subtitleEn: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Motivasyon Metni (TR)</label>
            <textarea className={textareaClass} value={meta.motivationTr} onChange={(e) => setMeta((p) => ({ ...p, motivationTr: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Motivasyon Metni (EN)</label>
            <textarea className={textareaClass} value={meta.motivationEn} onChange={(e) => setMeta((p) => ({ ...p, motivationEn: e.target.value }))} />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground">Program Görseli URL</label>
            <input className={inputClass} value={meta.programVisualUrl} onChange={(e) => setMeta((p) => ({ ...p, programVisualUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">CTA Butonu (TR)</label>
            <input className={inputClass} value={meta.ctaLabelTr} onChange={(e) => setMeta((p) => ({ ...p, ctaLabelTr: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">CTA Butonu (EN)</label>
            <input className={inputClass} value={meta.ctaLabelEn} onChange={(e) => setMeta((p) => ({ ...p, ctaLabelEn: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Düzen</label>
            <select className={inputClass} value={meta.layout} onChange={(e) => setMeta((p) => ({ ...p, layout: e.target.value }))}>
              <option value="SPLIT">İki Sütun (Split)</option>
              <option value="FORM_FIRST">Form Önce</option>
              <option value="EDITORIAL">Editorial</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveMeta} disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {saved && <span className="text-sm text-success">Kaydedildi ✓</span>}
        </div>
      </section>

      {/* Process Steps */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground border-b border-border pb-2">Süreç Adımları</h2>
        <div className="space-y-2">
          {processSteps.map((step, idx) => (
            <div key={step.id} className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <span className="text-xs font-bold text-muted-foreground w-5 mt-0.5">{idx + 1}.</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{step.titleTr}</p>
                {step.descTr && <p className="text-xs text-muted-foreground mt-0.5">{step.descTr}</p>}
              </div>
              <button onClick={() => handleDeleteStep(step.id)} disabled={isPending} className="text-xs text-danger hover:underline disabled:opacity-40">
                Sil
              </button>
            </div>
          ))}
          {processSteps.length === 0 && (
            <p className="text-xs text-muted-foreground">Henüz adım eklenmemiş.</p>
          )}
        </div>
        <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Yeni Adım</p>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} placeholder="Başlık (TR)" value={newStep.titleTr} onChange={(e) => setNewStep((p) => ({ ...p, titleTr: e.target.value }))} />
            <input className={inputClass} placeholder="Başlık (EN)" value={newStep.titleEn} onChange={(e) => setNewStep((p) => ({ ...p, titleEn: e.target.value }))} />
            <input className={inputClass} placeholder="Açıklama (TR)" value={newStep.descTr} onChange={(e) => setNewStep((p) => ({ ...p, descTr: e.target.value }))} />
            <input className={inputClass} placeholder="Açıklama (EN)" value={newStep.descEn} onChange={(e) => setNewStep((p) => ({ ...p, descEn: e.target.value }))} />
          </div>
          <button onClick={handleAddStep} disabled={isPending || !newStep.titleTr} className="rounded bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary disabled:opacity-40">
            + Ekle
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground border-b border-border pb-2">SSS (FAQ)</h2>
        <div className="space-y-2">
          {faqItems.map((faq) => (
            <div key={faq.id} className={`rounded-lg border px-3 py-2.5 ${faq.enabled ? "border-border" : "border-border/40 opacity-60"}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{faq.questionTr}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answerTr}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleToggleFaq(faq.id, !faq.enabled)} disabled={isPending} className="text-[10px] text-muted-foreground hover:text-foreground">
                    {faq.enabled ? "Gizle" : "Göster"}
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id)} disabled={isPending} className="text-[10px] text-danger hover:underline">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
          {faqItems.length === 0 && <p className="text-xs text-muted-foreground">Henüz SSS eklenmemiş.</p>}
        </div>
        <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Yeni SSS</p>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} placeholder="Soru (TR)" value={newFaq.questionTr} onChange={(e) => setNewFaq((p) => ({ ...p, questionTr: e.target.value }))} />
            <input className={inputClass} placeholder="Soru (EN)" value={newFaq.questionEn} onChange={(e) => setNewFaq((p) => ({ ...p, questionEn: e.target.value }))} />
            <textarea className={textareaClass} placeholder="Cevap (TR)" value={newFaq.answerTr} onChange={(e) => setNewFaq((p) => ({ ...p, answerTr: e.target.value }))} />
            <textarea className={textareaClass} placeholder="Cevap (EN)" value={newFaq.answerEn} onChange={(e) => setNewFaq((p) => ({ ...p, answerEn: e.target.value }))} />
          </div>
          <button onClick={handleAddFaq} disabled={isPending || !newFaq.questionTr || !newFaq.answerTr} className="rounded bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary disabled:opacity-40">
            + Ekle
          </button>
        </div>
      </section>

      {/* Linked products */}
      {profile.products.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-2">Bağlı Ürünler</h2>
          <div className="space-y-1">
            {profile.products.map((p) => {
              const tr = p.translations.find((t) => t.locale === locale) ?? p.translations[0];
              return (
                <div key={p.id} className="text-sm text-muted-foreground">
                  {tr?.name ?? p.id}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
