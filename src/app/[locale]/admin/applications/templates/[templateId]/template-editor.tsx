"use client";

import { useState, useTransition } from "react";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  addOption,
  updateOption,
  deleteOption,
  archiveTemplate,
  duplicateTemplate,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  updateQuestionCondition,
  assignQuestionToStep,
} from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionOption = {
  id: string;
  key: string;
  labelTr: string;
  labelEn: string;
  position: number;
  active: boolean;
};

type ConditionRule = {
  field: string;
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT";
  value: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ConditionJson = {
  logic: "AND" | "OR";
  rules: ConditionRule[];
} | null;

type Question = {
  id: string;
  key: string;
  type: string;
  section: string;
  stepId?: string | null;
  labelTr: string;
  labelEn: string;
  helperTr?: string | null;
  helperEn?: string | null;
  placeholderTr?: string | null;
  placeholderEn?: string | null;
  required: boolean;
  active: boolean;
  position: number;
  presentation?: string;
  autoAdvance?: boolean;
  highlightInAdmin?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditionJson?: any;
  options: QuestionOption[];
};

type FormStep = {
  id: string;
  stableKey: string;
  position: number;
  titleTr: string;
  titleEn: string;
  descTr?: string | null;
  descEn?: string | null;
  active: boolean;
};

type Template = {
  id: string;
  key: string;
  type: string;
  nameTr: string;
  nameEn: string;
  archived: boolean;
  version: number;
  questions: Question[];
  steps: FormStep[];
  _count: { applications: number };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: "SHORT_TEXT", label: "Kısa Metin" },
  { value: "LONG_TEXT", label: "Uzun Metin" },
  { value: "PHONE", label: "Telefon" },
  { value: "EMAIL", label: "E-posta" },
  { value: "NUMBER", label: "Sayı" },
  { value: "SINGLE_SELECT", label: "Tek Seçim (Select)" },
  { value: "MULTI_SELECT", label: "Çok Seçim" },
  { value: "RADIO", label: "Radio" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "BOOLEAN", label: "Evet/Hayır" },
];

const SECTIONS = [
  { value: "BASIC_INFO", label: "Temel Bilgiler" },
  { value: "CURRENT_SITUATION", label: "Mevcut Durum" },
  { value: "GOALS", label: "Hedefler" },
  { value: "CHALLENGES", label: "Zorluklar" },
  { value: "PROGRAM_FIT", label: "Program Uyumu" },
  { value: "AVAILABILITY", label: "Uygunluk" },
  { value: "ADDITIONAL_INFO", label: "Ek Bilgiler" },
];

const OPERATORS = [
  { value: "EQUALS", label: "eşit" },
  { value: "NOT_EQUALS", label: "eşit değil" },
  { value: "CONTAINS", label: "içeriyor" },
  { value: "GT", label: "büyük" },
  { value: "LT", label: "küçük" },
];

const OPTION_QUESTION_TYPES = ["SINGLE_SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"];

const inputClass =
  "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

// ─── OptionEditor ─────────────────────────────────────────────────────────────

function OptionEditor({
  question,
  locale,
  onUpdate,
}: {
  question: Question;
  locale: string;
  onUpdate: (q: Question) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [newOptTr, setNewOptTr] = useState("");
  const [newOptEn, setNewOptEn] = useState("");

  function handleAddOption() {
    if (!newOptTr.trim()) return;
    const key = (newOptTr.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + "_" + Date.now().toString(36)).slice(0, 60);
    startTransition(async () => {
      const opt = await addOption(locale, question.id, {
        key,
        labelTr: newOptTr,
        labelEn: newOptEn || newOptTr,
        position: question.options.length,
        active: true,
      });
      onUpdate({ ...question, options: [...question.options, opt as QuestionOption] });
      setNewOptTr("");
      setNewOptEn("");
    });
  }

  function handleUpdateOption(optId: string, field: "labelTr" | "labelEn", value: string) {
    startTransition(async () => {
      const updated = await updateOption(locale, optId, { [field]: value });
      onUpdate({
        ...question,
        options: question.options.map((o) => (o.id === optId ? { ...o, ...updated } : o)),
      });
    });
  }

  function handleDeleteOption(optId: string) {
    startTransition(async () => {
      await deleteOption(locale, optId);
      onUpdate({ ...question, options: question.options.filter((o) => o.id !== optId) });
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase">Seçenekler</p>
      {question.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input
            className={`${inputClass} flex-1`}
            defaultValue={opt.labelTr}
            onBlur={(e) => {
              if (e.target.value !== opt.labelTr) handleUpdateOption(opt.id, "labelTr", e.target.value);
            }}
            placeholder="TR"
          />
          <input
            className={`${inputClass} flex-1`}
            defaultValue={opt.labelEn}
            onBlur={(e) => {
              if (e.target.value !== opt.labelEn) handleUpdateOption(opt.id, "labelEn", e.target.value);
            }}
            placeholder="EN"
          />
          <button
            onClick={() => handleDeleteOption(opt.id)}
            disabled={isPending}
            className="shrink-0 text-xs text-danger hover:opacity-70"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          className={`${inputClass} flex-1`}
          value={newOptTr}
          onChange={(e) => setNewOptTr(e.target.value)}
          placeholder="Yeni seçenek (TR)"
          onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
        />
        <input
          className={`${inputClass} flex-1`}
          value={newOptEn}
          onChange={(e) => setNewOptEn(e.target.value)}
          placeholder="EN"
        />
        <button
          onClick={handleAddOption}
          disabled={isPending || !newOptTr.trim()}
          className="shrink-0 rounded bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-40"
        >
          + Ekle
        </button>
      </div>
    </div>
  );
}

// ─── ConditionBuilder ─────────────────────────────────────────────────────────

function ConditionBuilder({
  question,
  allQuestions,
  locale,
  templateId,
  onUpdate,
}: {
  question: Question;
  allQuestions: Question[];
  locale: string;
  templateId: string;
  onUpdate: (q: Question) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<{ logic: "AND" | "OR"; rules: ConditionRule[] }>(
    question.conditionJson ?? { logic: "AND", rules: [] }
  );

  const prevQuestions = allQuestions.filter((q) => q.id !== question.id && q.position < question.position);

  function addRule() {
    setCondition((prev) => ({
      ...prev,
      rules: [...prev.rules, { field: prevQuestions[0]?.key ?? "", operator: "EQUALS", value: "" }],
    }));
  }

  function removeRule(i: number) {
    setCondition((prev) => ({ ...prev, rules: prev.rules.filter((_, idx) => idx !== i) }));
  }

  function updateRule(i: number, patch: Partial<ConditionRule>) {
    setCondition((prev) => ({
      ...prev,
      rules: prev.rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const payload = condition.rules.length === 0 ? null : condition;
      await updateQuestionCondition(locale, templateId, question.id, payload);
      onUpdate({ ...question, conditionJson: payload });
      setOpen(false);
    });
  }

  function handleClear() {
    startTransition(async () => {
      await updateQuestionCondition(locale, templateId, question.id, null);
      onUpdate({ ...question, conditionJson: null });
      setCondition({ logic: "AND", rules: [] });
      setOpen(false);
    });
  }

  const hasCondition = question.conditionJson && question.conditionJson.rules.length > 0;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`text-xs rounded px-2 py-1 border transition-colors ${
          hasCondition
            ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {hasCondition ? `🔀 Koşul aktif (${question.conditionJson!.rules.length} kural)` : "🔀 Koşul ekle"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Bu soru gösterilsin:</span>
            <select
              className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
              value={condition.logic}
              onChange={(e) => setCondition((p) => ({ ...p, logic: e.target.value as "AND" | "OR" }))}
            >
              <option value="AND">Tüm kurallar sağlanınca (AND)</option>
              <option value="OR">Herhangi biri sağlanınca (OR)</option>
            </select>
          </div>

          {condition.rules.map((rule, i) => {
            const refQ = allQuestions.find((q) => q.key === rule.field);
            return (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                  value={rule.field}
                  onChange={(e) => updateRule(i, { field: e.target.value })}
                >
                  {prevQuestions.map((q) => (
                    <option key={q.key} value={q.key}>
                      {q.labelTr.slice(0, 30)}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                  value={rule.operator}
                  onChange={(e) => updateRule(i, { operator: e.target.value as ConditionRule["operator"] })}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                {refQ && OPTION_QUESTION_TYPES.includes(refQ.type) ? (
                  <select
                    className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                    value={rule.value}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                  >
                    <option value="">— seçin —</option>
                    {refQ.options.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.labelTr}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="rounded border border-border bg-background px-1.5 py-1 text-xs w-28"
                    value={rule.value}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    placeholder="değer"
                  />
                )}
                <button type="button" onClick={() => removeRule(i)} className="text-xs text-danger hover:opacity-70">
                  ✕
                </button>
              </div>
            );
          })}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addRule}
              disabled={prevQuestions.length === 0}
              className="text-xs rounded border border-border px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              + Kural ekle
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="text-xs rounded bg-primary px-2.5 py-1 text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Kaydet
            </button>
            {hasCondition && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="text-xs text-danger hover:opacity-70"
              >
                Koşulu kaldır
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QuestionRow ──────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  locale,
  templateId,
  allQuestions,
  steps,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: Question;
  locale: string;
  templateId: string;
  allQuestions: Question[];
  steps: FormStep[];
  onUpdate: (q: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editData, setEditData] = useState({
    type: question.type,
    section: question.section,
    labelTr: question.labelTr,
    labelEn: question.labelEn,
    helperTr: question.helperTr ?? "",
    helperEn: question.helperEn ?? "",
    required: question.required,
    active: question.active,
    presentation: question.presentation ?? "STANDARD",
    autoAdvance: question.autoAdvance ?? false,
    highlightInAdmin: question.highlightInAdmin ?? false,
  });

  const hasOptions = OPTION_QUESTION_TYPES.includes(question.type);

  function handleSave() {
    startTransition(async () => {
      const updated = await updateQuestion(locale, templateId, question.id, {
        ...editData,
        helperTr: editData.helperTr || undefined,
        helperEn: editData.helperEn || undefined,
      });
      onUpdate({ ...question, ...updated } as Question);
      setExpanded(false);
    });
  }

  function handleDelete() {
    if (!confirm("Bu soruyu silmek istiyor musun?")) return;
    startTransition(async () => {
      await deleteQuestion(locale, templateId, question.id);
      onDelete(question.id);
    });
  }

  function handleStepChange(stepId: string) {
    startTransition(async () => {
      await assignQuestionToStep(locale, templateId, question.id, stepId || null);
      onUpdate({ ...question, stepId: stepId || null });
    });
  }

  return (
    <div className={`rounded-xl border bg-card transition-colors ${question.active ? "border-border" : "border-border/40 opacity-60"}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveUp(question.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▲</button>
          <button onClick={() => onMoveDown(question.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{question.labelTr}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{question.type}</span>
            {question.required && <span className="text-xs text-danger">*</span>}
            {question.conditionJson && question.conditionJson.rules.length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">🔀 koşullu</span>
            )}
            {question.stepId && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                📋 {steps.find((s) => s.id === question.stepId)?.titleTr ?? "adım"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Kapat" : "Düzenle"}
          </button>
          <button onClick={handleDelete} disabled={isPending} className="rounded border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/5 disabled:opacity-40">
            Sil
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Soru Tipi</label>
              <select className={inputClass} value={editData.type} onChange={(e) => setEditData((p) => ({ ...p, type: e.target.value }))}>
                {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Bölüm</label>
              <select className={inputClass} value={editData.section} onChange={(e) => setEditData((p) => ({ ...p, section: e.target.value }))}>
                {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR) *</label>
              <input className={inputClass} value={editData.labelTr} onChange={(e) => setEditData((p) => ({ ...p, labelTr: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN) *</label>
              <input className={inputClass} value={editData.labelEn} onChange={(e) => setEditData((p) => ({ ...p, labelEn: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Yardım metni (TR)</label>
              <input className={inputClass} value={editData.helperTr} onChange={(e) => setEditData((p) => ({ ...p, helperTr: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Yardım metni (EN)</label>
              <input className={inputClass} value={editData.helperEn} onChange={(e) => setEditData((p) => ({ ...p, helperEn: e.target.value }))} />
            </div>
          </div>
          {steps.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Adım (Step)</label>
              <select
                className={inputClass}
                value={question.stepId ?? ""}
                onChange={(e) => handleStepChange(e.target.value)}
                disabled={isPending}
              >
                <option value="">— Adım yok —</option>
                {steps.map((s) => <option key={s.id} value={s.id}>{s.position + 1}. {s.titleTr}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-muted-foreground">Sunum stili</label>
            <select className={inputClass} value={editData.presentation} onChange={(e) => setEditData((p) => ({ ...p, presentation: e.target.value }))}>
              <option value="STANDARD">Standart</option>
              <option value="CARDS">Kartlar</option>
              <option value="COMPACT_CARDS">Kompakt kartlar</option>
            </select>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editData.required} onChange={(e) => setEditData((p) => ({ ...p, required: e.target.checked }))} className="rounded" />
              <span className="text-sm text-foreground">Zorunlu alan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editData.active} onChange={(e) => setEditData((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
              <span className="text-sm text-foreground">Aktif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editData.autoAdvance} onChange={(e) => setEditData((p) => ({ ...p, autoAdvance: e.target.checked }))} className="rounded" />
              <span className="text-sm text-foreground">Otomatik ilerle</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editData.highlightInAdmin} onChange={(e) => setEditData((p) => ({ ...p, highlightInAdmin: e.target.checked }))} className="rounded" />
              <span className="text-sm text-foreground">Admin&apos;de vurgula</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setExpanded(false)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              İptal
            </button>
            <button type="button" onClick={handleSave} disabled={isPending} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>

          {/* Condition builder */}
          <ConditionBuilder question={question} allQuestions={allQuestions} locale={locale} templateId={templateId} onUpdate={onUpdate} />
        </div>
      )}

      {hasOptions && (
        <div className="border-t border-border/50 px-4 pb-4">
          <OptionEditor question={question} locale={locale} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

// ─── AddQuestionForm ──────────────────────────────────────────────────────────

function AddQuestionForm({
  locale,
  templateId,
  defaultPosition,
  onAdded,
}: {
  locale: string;
  templateId: string;
  defaultPosition: number;
  onAdded: (q: Question) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [show, setShow] = useState(false);
  const [data, setData] = useState({ type: "SHORT_TEXT", section: "GOALS", labelTr: "", labelEn: "", required: false, active: true, position: defaultPosition });

  function handleAdd() {
    if (!data.labelTr.trim()) return;
    const key = (data.labelTr.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + "_" + Date.now().toString(36)).slice(0, 60);
    startTransition(async () => {
      try {
        const q = await addQuestion(locale, templateId, { ...data, key });
        onAdded(q as Question);
        setShow(false);
        setData({ type: "SHORT_TEXT", section: "GOALS", labelTr: "", labelEn: "", required: false, active: true, position: defaultPosition + 1 });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Hata");
      }
    });
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        + Soru Ekle
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-bold text-foreground">Yeni Soru</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Tip</label>
          <select className={inputClass} value={data.type} onChange={(e) => setData((p) => ({ ...p, type: e.target.value }))}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Bölüm</label>
          <select className={inputClass} value={data.section} onChange={(e) => setData((p) => ({ ...p, section: e.target.value }))}>
            {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR) *</label>
          <input className={inputClass} value={data.labelTr} onChange={(e) => setData((p) => ({ ...p, labelTr: e.target.value }))} placeholder="Türkçe soru metni" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN) *</label>
          <input className={inputClass} value={data.labelEn} onChange={(e) => setData((p) => ({ ...p, labelEn: e.target.value }))} placeholder="English question text" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.required} onChange={(e) => setData((p) => ({ ...p, required: e.target.checked }))} />
        <span className="text-sm">Zorunlu alan</span>
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">İptal</button>
        <button onClick={handleAdd} disabled={isPending || !data.labelTr} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {isPending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>
    </div>
  );
}

// ─── StepManager ──────────────────────────────────────────────────────────────

function StepManager({
  locale,
  templateId,
  steps,
  questions,
  onStepsChange,
}: {
  locale: string;
  templateId: string;
  steps: FormStep[];
  questions: Question[];
  onStepsChange: (steps: FormStep[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [newTitleTr, setNewTitleTr] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FormStep>>({});

  function handleAdd() {
    if (!newTitleTr.trim()) return;
    const stableKey = (newTitleTr.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + "_" + Date.now().toString(36)).slice(0, 60);
    startTransition(async () => {
      const step = await addStep(locale, templateId, {
        stableKey,
        titleTr: newTitleTr,
        titleEn: newTitleEn || newTitleTr,
        position: steps.length,
        active: true,
      });
      onStepsChange([...steps, step as FormStep]);
      setNewTitleTr("");
      setNewTitleEn("");
    });
  }

  function handleUpdate(stepId: string) {
    startTransition(async () => {
      const updated = await updateStep(locale, templateId, stepId, editData);
      onStepsChange(steps.map((s) => (s.id === stepId ? { ...s, ...updated } : s)));
      setEditingId(null);
    });
  }

  function handleDelete(stepId: string) {
    if (!confirm("Bu adımı silmek istiyor musun? Adıma atanmış sorular atanmamış hale gelir.")) return;
    startTransition(async () => {
      await deleteStep(locale, templateId, stepId);
      onStepsChange(steps.filter((s) => s.id !== stepId));
    });
  }

  function handleMoveUp(stepId: string) {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx <= 0) return;
    const newOrder = [...steps];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    const withPos = newOrder.map((s, i) => ({ ...s, position: i }));
    onStepsChange(withPos);
    startTransition(async () => {
      await reorderSteps(locale, templateId, withPos.map((s) => s.id));
    });
  }

  function handleMoveDown(stepId: string) {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx >= steps.length - 1) return;
    const newOrder = [...steps];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    const withPos = newOrder.map((s, i) => ({ ...s, position: i }));
    onStepsChange(withPos);
    startTransition(async () => {
      await reorderSteps(locale, templateId, withPos.map((s) => s.id));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adımlar (Steps)</span>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{steps.length} adım</span>
      </div>

      {steps.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4 rounded-lg border border-dashed border-border">
          Henüz adım yok. Ekleyerek çok adımlı form oluştur.
        </p>
      )}

      {steps.map((step) => {
        const stepQuestions = questions.filter((q) => q.stepId === step.id);
        const isEditing = editingId === step.id;
        return (
          <div key={step.id} className={`rounded-xl border bg-card ${step.active ? "border-border" : "border-border/40 opacity-60"}`}>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMoveUp(step.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▲</button>
                <button onClick={() => handleMoveDown(step.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.position + 1}. {step.titleTr}</p>
                <p className="text-xs text-muted-foreground">{stepQuestions.length} soru</p>
              </div>
              <button onClick={() => { setEditingId(isEditing ? null : step.id); setEditData({ titleTr: step.titleTr, titleEn: step.titleEn, descTr: step.descTr ?? "", descEn: step.descEn ?? "", active: step.active }); }} className="rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                {isEditing ? "Kapat" : "Düzenle"}
              </button>
              <button onClick={() => handleDelete(step.id)} disabled={isPending} className="rounded border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/5 disabled:opacity-40">Sil</button>
            </div>
            {isEditing && (
              <div className="border-t border-border px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">Başlık (TR) *</label>
                    <input className={inputClass} value={editData.titleTr ?? ""} onChange={(e) => setEditData((p) => ({ ...p, titleTr: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">Başlık (EN) *</label>
                    <input className={inputClass} value={editData.titleEn ?? ""} onChange={(e) => setEditData((p) => ({ ...p, titleEn: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">Açıklama (TR)</label>
                    <input className={inputClass} value={editData.descTr ?? ""} onChange={(e) => setEditData((p) => ({ ...p, descTr: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground">Açıklama (EN)</label>
                    <input className={inputClass} value={editData.descEn ?? ""} onChange={(e) => setEditData((p) => ({ ...p, descEn: e.target.value }))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editData.active ?? true} onChange={(e) => setEditData((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-foreground">Aktif</span>
                </label>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">İptal</button>
                  <button onClick={() => handleUpdate(step.id)} disabled={isPending} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                    {isPending ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add step form */}
      <div className="rounded-xl border-2 border-dashed border-border p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Yeni Adım Ekle</p>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} value={newTitleTr} onChange={(e) => setNewTitleTr(e.target.value)} placeholder="Başlık (TR)" />
          <input className={inputClass} value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} placeholder="Title (EN)" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleAdd} disabled={isPending || !newTitleTr.trim()} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {isPending ? "Ekleniyor..." : "+ Adım Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FormPreview ──────────────────────────────────────────────────────────────

function FormPreview({ questions, steps, locale }: { questions: Question[]; steps: FormStep[]; locale: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const isStepBased = steps.length > 0;
  const activeSteps = steps.filter((s) => s.active);

  function isVisible(q: Question): boolean {
    if (!q.conditionJson || q.conditionJson.rules.length === 0) return true;
    const { logic, rules } = q.conditionJson;
    const results = (rules as ConditionRule[]).map((rule) => {
      const val = answers[rule.field];
      const strVal = Array.isArray(val) ? val.join(",") : (val ?? "");
      switch (rule.operator) {
        case "EQUALS": return strVal === rule.value;
        case "NOT_EQUALS": return strVal !== rule.value;
        case "CONTAINS": return strVal.includes(rule.value);
        case "GT": return Number(strVal) > Number(rule.value);
        case "LT": return Number(strVal) < Number(rule.value);
        default: return true;
      }
    });
    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  }

  const visibleQuestions = questions.filter((q) => q.active && isVisible(q));
  const stepQuestions = isStepBased && activeSteps.length > 0
    ? visibleQuestions.filter((q) => q.stepId === activeSteps[currentStep]?.id)
    : visibleQuestions;

  const inputCls = "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground";

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Form Önizlemesi</p>
        <span className="text-xs text-muted-foreground">{locale === "tr" ? "Türkçe" : "English"}</span>
      </div>

      {isStepBased && activeSteps.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Adım {currentStep + 1} / {activeSteps.length}</span>
            <span>{activeSteps[currentStep]?.titleTr}</span>
          </div>
          <div className="flex gap-1">
            {activeSteps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i <= currentStep ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {stepQuestions.map((q) => {
          const label = locale === "tr" ? q.labelTr : (q.labelEn || q.labelTr);
          const helper = locale === "tr" ? q.helperTr : (q.helperEn || q.helperTr);
          return (
            <div key={q.key} className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">
                {label}
                {q.required && <span className="text-danger ml-1">*</span>}
              </label>
              {(q.type === "SHORT_TEXT" || q.type === "PHONE" || q.type === "EMAIL" || q.type === "NUMBER") && (
                <input type={q.type === "NUMBER" ? "number" : q.type === "EMAIL" ? "email" : q.type === "PHONE" ? "tel" : "text"} className={inputCls} placeholder={locale === "tr" ? q.placeholderTr ?? "" : q.placeholderEn ?? ""} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))} />
              )}
              {q.type === "LONG_TEXT" && (
                <textarea className={`${inputCls} min-h-[80px] resize-y`} placeholder={locale === "tr" ? q.placeholderTr ?? "" : q.placeholderEn ?? ""} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))} />
              )}
              {(q.type === "SINGLE_SELECT") && (
                <select className={inputCls} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}>
                  <option value="">{locale === "tr" ? "Seçiniz..." : "Select..."}</option>
                  {q.options.map((opt) => <option key={opt.key} value={opt.key}>{locale === "tr" ? opt.labelTr : opt.labelEn}</option>)}
                </select>
              )}
              {(q.type === "RADIO" || q.type === "BOOLEAN") && (
                <div className={q.presentation === "CARDS" || q.presentation === "COMPACT_CARDS" ? "flex gap-2 flex-wrap" : "space-y-1.5"}>
                  {(q.type === "BOOLEAN" ? [{ key: "yes", labelTr: "Evet", labelEn: "Yes" }, { key: "no", labelTr: "Hayır", labelEn: "No" }] : q.options).map((opt) => (
                    q.presentation === "CARDS" || q.presentation === "COMPACT_CARDS" ? (
                      <button key={opt.key} type="button" onClick={() => setAnswers((p) => ({ ...p, [q.key]: opt.key }))} className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${answers[q.key] === opt.key ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50"}`}>
                        {locale === "tr" ? opt.labelTr : opt.labelEn}
                      </button>
                    ) : (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value={opt.key} checked={answers[q.key] === opt.key} onChange={() => setAnswers((p) => ({ ...p, [q.key]: opt.key }))} className="h-4 w-4" />
                        <span className="text-sm">{locale === "tr" ? opt.labelTr : opt.labelEn}</span>
                      </label>
                    )
                  ))}
                </div>
              )}
              {(q.type === "MULTI_SELECT" || q.type === "CHECKBOX") && (
                <div className="space-y-1.5">
                  {q.options.map((opt) => {
                    const checked = Array.isArray(answers[q.key]) && (answers[q.key] as string[]).includes(opt.key);
                    return (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          const prev = (answers[q.key] as string[]) ?? [];
                          setAnswers((p) => ({ ...p, [q.key]: e.target.checked ? [...prev, opt.key] : prev.filter((k) => k !== opt.key) }));
                        }} className="h-4 w-4 rounded" />
                        <span className="text-sm">{locale === "tr" ? opt.labelTr : opt.labelEn}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
            </div>
          );
        })}
      </div>

      {isStepBased && activeSteps.length > 0 && (
        <div className="flex gap-2 pt-2">
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep((p) => p - 1)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
              {locale === "tr" ? "Geri" : "Back"}
            </button>
          )}
          {currentStep < activeSteps.length - 1 ? (
            <button onClick={() => setCurrentStep((p) => p + 1)} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              {locale === "tr" ? "Devam" : "Continue"}
            </button>
          ) : (
            <button className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white opacity-70 cursor-not-allowed">
              {locale === "tr" ? "Başvuruyu Gönder" : "Submit Application"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TemplateEditor (main) ────────────────────────────────────────────────────

export function TemplateEditor({ locale, template }: { locale: string; template: Template }) {
  const [questions, setQuestions] = useState<Question[]>(template.questions);
  const [steps, setSteps] = useState<FormStep[]>(template.steps);
  const [isPending, startTransition] = useTransition();
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "steps" | "preview">("questions");
  const [previewLocale, setPreviewLocale] = useState<"tr" | "en">("tr");

  function handleUpdate(updated: Question) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }

  function handleDelete(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleMoveUp(id: string) {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx <= 0) return;
    const newOrder = [...questions];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    const withPositions = newOrder.map((q, i) => ({ ...q, position: i }));
    setQuestions(withPositions);
    startTransition(async () => { await reorderQuestions(locale, template.id, withPositions.map((q) => q.id)); });
  }

  function handleMoveDown(id: string) {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx >= questions.length - 1) return;
    const newOrder = [...questions];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    const withPositions = newOrder.map((q, i) => ({ ...q, position: i }));
    setQuestions(withPositions);
    startTransition(async () => { await reorderQuestions(locale, template.id, withPositions.map((q) => q.id)); });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveTemplate(locale, template.id);
      setArchiveConfirm(false);
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const copy = await duplicateTemplate(locale, template.id);
      window.location.href = `/${locale}/admin/applications/templates/${copy.id}`;
    });
  }

  const tabs = [
    { id: "questions" as const, label: `Sorular (${questions.length})` },
    { id: "steps" as const, label: `Adımlar (${steps.length})` },
    { id: "preview" as const, label: "Önizleme" },
  ];

  return (
    <div className="space-y-6">
      {/* Meta bar */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
          <span>Anahtar: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{template.key}</code></span>
          <span>Tür: {template.type.replace(/_/g, " ")}</span>
          <span>{template._count.applications} başvuru</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDuplicate} disabled={isPending} className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40">Kopyala</button>
          {!template.archived && (
            <button onClick={() => setArchiveConfirm(true)} className="rounded border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5">Arşivle</button>
          )}
        </div>
      </div>

      {archiveConfirm && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Bu şablonu arşivlemek istediğine emin misin?</p>
          <p className="text-xs text-muted-foreground">Arşivlenen şablonlar yeni başvuru almaz. Mevcut başvurular korunur.</p>
          <div className="flex gap-2">
            <button onClick={handleArchive} disabled={isPending} className="rounded bg-danger px-3 py-1.5 text-xs font-semibold text-white">Arşivle</button>
            <button onClick={() => setArchiveConfirm(false)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">İptal</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Questions */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          <div className="space-y-2">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Henüz soru eklenmemiş.</p>
            ) : (
              questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  locale={locale}
                  templateId={template.id}
                  allQuestions={questions}
                  steps={steps}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))
            )}
          </div>
          <AddQuestionForm locale={locale} templateId={template.id} defaultPosition={questions.length} onAdded={(q) => setQuestions((prev) => [...prev, q])} />
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            {questions.length} soru — {questions.filter((q) => q.required).length} zorunlu — {questions.filter((q) => !q.active).length} devre dışı —{" "}
            {questions.filter((q) => q.conditionJson && q.conditionJson.rules.length > 0).length} koşullu —{" "}
            {questions.filter((q) => q.stepId).length} adıma atanmış
          </div>
        </div>
      )}

      {/* Tab: Steps */}
      {activeTab === "steps" && (
        <StepManager locale={locale} templateId={template.id} steps={steps} questions={questions} onStepsChange={setSteps} />
      )}

      {/* Tab: Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Dil:</span>
            <button onClick={() => setPreviewLocale("tr")} className={`rounded px-3 py-1 text-sm ${previewLocale === "tr" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>TR</button>
            <button onClick={() => setPreviewLocale("en")} className={`rounded px-3 py-1 text-sm ${previewLocale === "en" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>EN</button>
          </div>
          <FormPreview questions={questions} steps={steps} locale={previewLocale} />
        </div>
      )}
    </div>
  );
}
