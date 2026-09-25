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
} from "../actions";

type QuestionOption = {
  id: string;
  key: string;
  labelTr: string;
  labelEn: string;
  position: number;
  active: boolean;
};

type Question = {
  id: string;
  key: string;
  type: string;
  section: string;
  labelTr: string;
  labelEn: string;
  helperTr?: string | null;
  helperEn?: string | null;
  placeholderTr?: string | null;
  placeholderEn?: string | null;
  required: boolean;
  active: boolean;
  position: number;
  options: QuestionOption[];
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
  _count: { applications: number };
};

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

const OPTION_QUESTION_TYPES = ["SINGLE_SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"];

const inputClass =
  "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

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
    const base = newOptTr.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40);
    const key = `${base}_${Date.now().toString(36)}`.slice(0, 60);
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

  function handleDeleteOption(optId: string) {
    startTransition(async () => {
      await deleteOption(locale, optId);
      onUpdate({ ...question, options: question.options.filter((o) => o.id !== optId) });
    });
  }

  function handleToggleOption(optId: string, active: boolean) {
    startTransition(async () => {
      await updateOption(locale, optId, { active });
      onUpdate({
        ...question,
        options: question.options.map((o) => (o.id === optId ? { ...o, active } : o)),
      });
    });
  }

  return (
    <div className="mt-3 ml-4 space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Seçenekler</p>
      {question.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <span
            className={`flex-1 text-xs font-medium ${opt.active ? "text-foreground" : "text-muted-foreground line-through"}`}
          >
            {opt.labelTr}
            {opt.labelEn && opt.labelEn !== opt.labelTr && (
              <span className="ml-2 text-muted-foreground">/ {opt.labelEn}</span>
            )}
          </span>
          <button
            onClick={() => handleToggleOption(opt.id, !opt.active)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            {opt.active ? "Devre Dışı" : "Aktif Et"}
          </button>
          <button
            onClick={() => handleDeleteOption(opt.id)}
            className="text-[10px] text-danger hover:underline"
            disabled={isPending}
          >
            Sil
          </button>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
          placeholder="Seçenek TR"
          value={newOptTr}
          onChange={(e) => setNewOptTr(e.target.value)}
        />
        <input
          type="text"
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
          placeholder="Seçenek EN"
          value={newOptEn}
          onChange={(e) => setNewOptEn(e.target.value)}
        />
        <button
          type="button"
          onClick={handleAddOption}
          disabled={isPending || !newOptTr.trim()}
          className="rounded bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
        >
          + Ekle
        </button>
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  locale,
  templateId,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: Question;
  locale: string;
  templateId: string;
  onUpdate: (q: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editData, setEditData] = useState({
    labelTr: question.labelTr,
    labelEn: question.labelEn,
    helperTr: question.helperTr ?? "",
    helperEn: question.helperEn ?? "",
    required: question.required,
    type: question.type,
    section: question.section,
    active: question.active,
  });

  function handleSave() {
    startTransition(async () => {
      const updated = await updateQuestion(locale, templateId, question.id, editData);
      onUpdate({ ...question, ...updated, options: question.options });
      setExpanded(false);
    });
  }

  function handleDelete() {
    if (!confirm("Bu soruyu silmek istediğine emin misin?")) return;
    startTransition(async () => {
      await deleteQuestion(locale, templateId, question.id);
      onDelete(question.id);
    });
  }

  const hasOptions = OPTION_QUESTION_TYPES.includes(question.type);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        question.active ? "border-border" : "border-border/40 bg-muted/20 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMoveUp(question.id)}
            className="text-muted-foreground hover:text-foreground text-[10px] leading-none"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(question.id)}
            className="text-muted-foreground hover:text-foreground text-[10px] leading-none"
          >
            ▼
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{question.labelTr}</span>
            <span className="text-[10px] rounded-full border border-border px-1.5 py-0.5 text-muted-foreground font-mono">
              {question.type}
            </span>
            <span className="text-[10px] rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
              {question.section.replace(/_/g, " ")}
            </span>
            {question.required && (
              <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-semibold">
                Zorunlu
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? "Kapat" : "Düzenle"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-danger hover:underline disabled:opacity-40"
          >
            Sil
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Soru Tipi</label>
              <select
                className={inputClass}
                value={editData.type}
                onChange={(e) => setEditData((p) => ({ ...p, type: e.target.value }))}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Bölüm</label>
              <select
                className={inputClass}
                value={editData.section}
                onChange={(e) => setEditData((p) => ({ ...p, section: e.target.value }))}
              >
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR) *</label>
              <input
                className={inputClass}
                value={editData.labelTr}
                onChange={(e) => setEditData((p) => ({ ...p, labelTr: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN) *</label>
              <input
                className={inputClass}
                value={editData.labelEn}
                onChange={(e) => setEditData((p) => ({ ...p, labelEn: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Yardım metni (TR)</label>
              <input
                className={inputClass}
                value={editData.helperTr}
                onChange={(e) => setEditData((p) => ({ ...p, helperTr: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Yardım metni (EN)</label>
              <input
                className={inputClass}
                value={editData.helperEn}
                onChange={(e) => setEditData((p) => ({ ...p, helperEn: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.required}
                onChange={(e) => setEditData((p) => ({ ...p, required: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-foreground">Zorunlu alan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.active}
                onChange={(e) => setEditData((p) => ({ ...p, active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-foreground">Aktif</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
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
  const [data, setData] = useState({
    type: "SHORT_TEXT",
    section: "GOALS",
    labelTr: "",
    labelEn: "",
    required: false,
    active: true,
    position: defaultPosition,
  });

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
      <button
        onClick={() => setShow(true)}
        className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
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
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Bölüm</label>
          <select className={inputClass} value={data.section} onChange={(e) => setData((p) => ({ ...p, section: e.target.value }))}>
            {SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR) *</label>
          <input
            className={inputClass}
            value={data.labelTr}
            onChange={(e) => setData((p) => ({ ...p, labelTr: e.target.value }))}
            placeholder="Türkçe soru metni"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN) *</label>
          <input
            className={inputClass}
            value={data.labelEn}
            onChange={(e) => setData((p) => ({ ...p, labelEn: e.target.value }))}
            placeholder="English question text"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.required}
          onChange={(e) => setData((p) => ({ ...p, required: e.target.checked }))}
        />
        <span className="text-sm">Zorunlu alan</span>
      </label>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShow(false)}
          className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground"
        >
          İptal
        </button>
        <button
          onClick={handleAdd}
          disabled={isPending || !data.labelTr}
          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>
    </div>
  );
}

export function TemplateEditor({ locale, template }: { locale: string; template: Template }) {
  const [questions, setQuestions] = useState<Question[]>(template.questions);
  const [isPending, startTransition] = useTransition();
  const [archiveConfirm, setArchiveConfirm] = useState(false);

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
    startTransition(async () => {
      await reorderQuestions(locale, template.id, withPositions.map((q) => q.id));
    });
  }

  function handleMoveDown(id: string) {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx >= questions.length - 1) return;
    const newOrder = [...questions];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    const withPositions = newOrder.map((q, i) => ({ ...q, position: i }));
    setQuestions(withPositions);
    startTransition(async () => {
      await reorderQuestions(locale, template.id, withPositions.map((q) => q.id));
    });
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

  const groupedBySection = questions.reduce<Record<string, Question[]>>((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Meta bar */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
          <span>
            Anahtar:{" "}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{template.key}</code>
          </span>
          <span>Tür: {template.type.replace(/_/g, " ")}</span>
          <span>{template._count.applications} başvuru</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicate}
            disabled={isPending}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Kopyala
          </button>
          {!template.archived && (
            <button
              onClick={() => setArchiveConfirm(true)}
              className="rounded border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5"
            >
              Arşivle
            </button>
          )}
        </div>
      </div>

      {archiveConfirm && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Bu şablonu arşivlemek istediğine emin misin?</p>
          <p className="text-xs text-muted-foreground">Arşivlenen şablonlar yeni başvuru almaz. Mevcut başvurular korunur.</p>
          <div className="flex gap-2">
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="rounded bg-danger px-3 py-1.5 text-xs font-semibold text-white"
            >
              Arşivle
            </button>
            <button
              onClick={() => setArchiveConfirm(false)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Questions grouped by section */}
      <div className="space-y-6">
        {Object.entries(groupedBySection).length > 0 ? (
          Object.entries(groupedBySection).map(([section, qs]) => (
            <div key={section}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {SECTIONS.find((s) => s.value === section)?.label ?? section}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {qs.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    locale={locale}
                    templateId={template.id}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Henüz soru eklenmemiş.</p>
        )}
      </div>

      <AddQuestionForm
        locale={locale}
        templateId={template.id}
        defaultPosition={questions.length}
        onAdded={(q) => setQuestions((prev) => [...prev, q])}
      />

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        {questions.length} soru — {questions.filter((q) => q.required).length} zorunlu —{" "}
        {questions.filter((q) => !q.active).length} devre dışı
      </div>
    </div>
  );
}
