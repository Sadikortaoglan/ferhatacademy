"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type QuestionOption = {
  key: string;
  labelTr: string;
  labelEn: string;
  position: number;
};

export type ApplicationQuestion = {
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
  options: QuestionOption[];
};

const SECTION_LABELS: Record<string, { tr: string; en: string }> = {
  BASIC_INFO: { tr: "Temel Bilgiler", en: "Basic Info" },
  CURRENT_SITUATION: { tr: "Mevcut Durumunuz", en: "Current Situation" },
  GOALS: { tr: "Hedefleriniz", en: "Your Goals" },
  CHALLENGES: { tr: "Zorluklar", en: "Challenges" },
  PROGRAM_FIT: { tr: "Program Uyumu", en: "Program Fit" },
  AVAILABILITY: { tr: "Uygunluk", en: "Availability" },
  ADDITIONAL_INFO: { tr: "Ek Bilgiler", en: "Additional Info" },
};

function buildClientSchema(questions: ApplicationQuestion[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    let field: z.ZodTypeAny;
    switch (q.type) {
      case "MULTI_SELECT":
      case "CHECKBOX":
        field = z.array(z.string());
        break;
      case "NUMBER":
        field = z.coerce.number();
        break;
      default:
        field = z.string();
    }
    if (q.required) {
      if (field instanceof z.ZodString) field = (field as z.ZodString).min(1, "Bu alan zorunludur");
    } else {
      field = field.optional();
    }
    shape[q.key] = field;
  }
  return z.object(shape);
}

interface Props {
  questions: ApplicationQuestion[];
  productId: string;
  locale: string;
  ctaLabel?: string;
  onSuccess: (applicationId?: string) => void;
}

export function DynamicForm({ questions, productId, locale, ctaLabel, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const schema = buildClientSchema(questions);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Group by section preserving order
  const sections: { section: string; questions: ApplicationQuestion[] }[] = [];
  for (const q of questions) {
    const existing = sections.find((s) => s.section === q.section);
    if (existing) {
      existing.questions.push(q);
    } else {
      sections.push({ section: q.section, questions: [q] });
    }
  }

  const isMultiStep = questions.length > 6 && sections.length > 1;
  const totalSteps = isMultiStep ? sections.length : 1;
  const visibleSections = isMultiStep ? [sections[currentStep]] : sections;

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${hasError ? "border-danger" : "border-border"}`;

  function renderField(q: ApplicationQuestion) {
    const label = locale === "tr" ? q.labelTr : q.labelEn || q.labelTr;
    const helper = locale === "tr" ? q.helperTr : q.helperEn || q.helperTr;
    const placeholder = locale === "tr" ? q.placeholderTr : q.placeholderEn || q.placeholderTr;
    const error = errors[q.key]?.message as string | undefined;
    const cls = inputClass(!!error);

    let fieldEl: React.ReactNode;
    switch (q.type) {
      case "PHONE":
        fieldEl = (
          <input
            id={q.key}
            type="tel"
            className={cls}
            placeholder={placeholder ?? "+90 5XX XXX XX XX"}
            {...register(q.key)}
          />
        );
        break;
      case "EMAIL":
        fieldEl = (
          <input id={q.key} type="email" className={cls} placeholder={placeholder ?? ""} {...register(q.key)} />
        );
        break;
      case "NUMBER":
        fieldEl = (
          <input id={q.key} type="number" className={cls} placeholder={placeholder ?? ""} {...register(q.key)} />
        );
        break;
      case "LONG_TEXT":
        fieldEl = (
          <textarea
            id={q.key}
            className={`${cls} min-h-[96px] resize-y`}
            placeholder={placeholder ?? ""}
            {...register(q.key)}
          />
        );
        break;
      case "SINGLE_SELECT":
        fieldEl = (
          <select id={q.key} className={`${cls} cursor-pointer`} {...register(q.key)}>
            <option value="">{locale === "tr" ? "Seçiniz..." : "Select..."}</option>
            {q.options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {locale === "tr" ? opt.labelTr : opt.labelEn || opt.labelTr}
              </option>
            ))}
          </select>
        );
        break;
      case "RADIO":
        fieldEl = (
          <fieldset className="space-y-2">
            <legend className="sr-only">{label}</legend>
            {q.options.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  value={opt.key}
                  className="h-4 w-4 border-border text-primary focus:ring-primary/40"
                  {...register(q.key)}
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {locale === "tr" ? opt.labelTr : opt.labelEn || opt.labelTr}
                </span>
              </label>
            ))}
          </fieldset>
        );
        break;
      case "MULTI_SELECT":
      case "CHECKBOX":
        fieldEl = (
          <fieldset className="space-y-2">
            <legend className="sr-only">{label}</legend>
            {q.options.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={opt.key}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                  {...register(q.key)}
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {locale === "tr" ? opt.labelTr : opt.labelEn || opt.labelTr}
                </span>
              </label>
            ))}
          </fieldset>
        );
        break;
      default:
        fieldEl = (
          <input id={q.key} type="text" className={cls} placeholder={placeholder ?? ""} {...register(q.key)} />
        );
    }

    const isGroupField = ["RADIO", "MULTI_SELECT", "CHECKBOX"].includes(q.type);

    return (
      <div key={q.key} className="space-y-1.5">
        {isGroupField ? (
          <p className="text-sm font-semibold text-foreground">
            {label}
            {q.required && (
              <span className="text-danger ml-1" aria-hidden>
                *
              </span>
            )}
          </p>
        ) : (
          <label htmlFor={q.key} className="block text-sm font-semibold text-foreground">
            {label}
            {q.required && (
              <span className="text-danger ml-1" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        {fieldEl}
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        {error && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  function handleSubmitForm(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      try {
        const { submitDynamicApplication } = await import("@/features/applications/actions");
        const result = await submitDynamicApplication(productId, data as Record<string, unknown>);
        if (result.ok) {
          onSuccess(result.applicationId);
        } else {
          setServerError(
            locale === "tr" ? "Bir hata oluştu. Lütfen tekrar deneyin." : "An error occurred. Please try again."
          );
        }
      } catch {
        setServerError(locale === "tr" ? "Bir hata oluştu." : "An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} noValidate className="space-y-6">
      {/* Multi-step progress indicator */}
      {isMultiStep && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {locale === "tr"
                ? `Adım ${currentStep + 1} / ${totalSteps}`
                : `Step ${currentStep + 1} of ${totalSteps}`}
            </span>
            <span>
              {SECTION_LABELS[sections[currentStep]?.section]?.[locale === "tr" ? "tr" : "en"] ??
                sections[currentStep]?.section}
            </span>
          </div>
          <div className="flex gap-1">
            {sections.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${i <= currentStep ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visible sections */}
      {visibleSections.map((sec) => (
        <div key={sec.section} className="space-y-5">
          {sections.length > 1 && !isMultiStep && (
            <div className="pb-1 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {SECTION_LABELS[sec.section]?.[locale === "tr" ? "tr" : "en"] ?? sec.section}
              </h3>
            </div>
          )}
          {sec.questions.map((q) => renderField(q))}
        </div>
      ))}

      {serverError && (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        {isMultiStep && currentStep > 0 && (
          <button
            type="button"
            onClick={() => setCurrentStep((p) => p - 1)}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {locale === "tr" ? "Geri" : "Back"}
          </button>
        )}
        {isMultiStep && currentStep < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((p) => p + 1)}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {locale === "tr" ? "Devam" : "Continue"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending
              ? locale === "tr"
                ? "Gönderiliyor..."
                : "Submitting..."
              : (ctaLabel ?? (locale === "tr" ? "Başvuruyu Gönder" : "Submit Application"))}
          </button>
        )}
      </div>
    </form>
  );
}
