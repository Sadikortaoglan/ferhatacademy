"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionOption = {
  key: string;
  labelTr: string;
  labelEn: string;
  position: number;
};

export type ConditionRule = {
  questionKey: string;
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN";
  value: string;
};

export type ConditionJson = {
  rules: ConditionRule[];
  logic?: "AND" | "OR";
};

export type ApplicationQuestion = {
  id: string;
  key: string;
  type: string;
  section: string;
  stepId: string | null;
  labelTr: string;
  labelEn: string;
  helperTr?: string | null;
  helperEn?: string | null;
  placeholderTr?: string | null;
  placeholderEn?: string | null;
  required: boolean;
  presentation: "STANDARD" | "CARDS" | "COMPACT_CARDS";
  autoAdvance: boolean;
  conditionJson: ConditionJson | null;
  options: QuestionOption[];
};

export type ApplicationFormStep = {
  id: string;
  stableKey: string;
  position: number;
  titleTr: string;
  titleEn: string;
  descTr?: string | null;
  descEn?: string | null;
  active: boolean;
};

type UtmData = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPath?: string;
  referrer?: string;
};

// ─── Condition Evaluation ────────────────────────────────────────────────────

function evalRule(rule: ConditionRule, answers: Record<string, unknown>): boolean {
  const val = answers[rule.questionKey];
  const strVal = Array.isArray(val) ? val : String(val ?? "");
  switch (rule.operator) {
    case "EQUALS":
      return Array.isArray(val) ? val.includes(rule.value) : String(val ?? "") === rule.value;
    case "NOT_EQUALS":
      return Array.isArray(val) ? !val.includes(rule.value) : String(val ?? "") !== rule.value;
    case "CONTAINS":
      return String(strVal).toLowerCase().includes(rule.value.toLowerCase());
    case "GREATER_THAN":
      return Number(val) > Number(rule.value);
    case "LESS_THAN":
      return Number(val) < Number(rule.value);
    default:
      return true;
  }
}

function isQuestionVisible(q: ApplicationQuestion, answers: Record<string, unknown>): boolean {
  if (!q.conditionJson) return true;
  const { rules, logic } = q.conditionJson;
  if (!rules?.length) return true;
  if (logic === "OR") return rules.some((r) => evalRule(r, answers));
  return rules.every((r) => evalRule(r, answers));
}

// ─── Schema Builder ──────────────────────────────────────────────────────────

function buildSchema(questions: ApplicationQuestion[], visibleKeys: Set<string>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    const visible = visibleKeys.has(q.key);
    let field: z.ZodTypeAny;
    switch (q.type) {
      case "MULTI_SELECT":
      case "CHECKBOX":
        field = z.array(z.string());
        break;
      case "NUMBER":
        field = z.coerce.number();
        break;
      case "BOOLEAN":
        field = z.enum(["true", "false"]);
        break;
      default:
        field = z.string();
    }
    if (visible && q.required) {
      if (field instanceof z.ZodString) field = field.min(1, "Bu alan zorunludur");
    } else {
      field = field.optional();
    }
    shape[q.key] = field;
  }
  return z.object(shape);
}

// ─── UTM Capture ─────────────────────────────────────────────────────────────

function captureUtm(): UtmData {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    landingPath: window.location.pathname,
    referrer: document.referrer || undefined,
  };
}

// ─── Field Components ────────────────────────────────────────────────────────

function CardOptions({
  q,
  locale,
  compact,
  value,
  onChange,
  onAutoAdvance,
}: {
  q: ApplicationQuestion;
  locale: string;
  compact: boolean;
  value: string;
  onChange: (v: string) => void;
  onAutoAdvance?: () => void;
}) {
  return (
    <div
      className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1"}`}
      role="radiogroup"
      aria-label={locale === "tr" ? q.labelTr : q.labelEn || q.labelTr}
    >
      {q.options.map((opt) => {
        const label = locale === "tr" ? opt.labelTr : opt.labelEn || opt.labelTr;
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onChange(opt.key);
              if (q.autoAdvance && onAutoAdvance) {
                setTimeout(onAutoAdvance, 200);
              }
            }}
            className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              selected
                ? "border-primary bg-primary/8 text-primary"
                : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-primary/4"
            }`}
          >
            <span className="flex items-center justify-between">
              {label}
              {selected && <span className="ml-2 text-primary">✓</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  questions: ApplicationQuestion[];
  steps: ApplicationFormStep[];
  productId: string;
  locale: string;
  ctaLabel?: string;
  prefillData?: Record<string, string>;
  onSuccess: (applicationId?: string) => void;
}

export function DynamicForm({ questions, steps, productId, locale, ctaLabel, prefillData, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [utmData] = useState<UtmData>(() => captureUtm());

  // Determine if step-based or section-based
  const activeSteps = steps.filter((s) => s.active);
  const isStepBased = activeSteps.length > 0;

  // Build section groups for fallback
  const sectionGroups: { section: string; questions: ApplicationQuestion[] }[] = [];
  for (const q of questions) {
    const existing = sectionGroups.find((s) => s.section === q.section);
    if (existing) existing.questions.push(q);
    else sectionGroups.push({ section: q.section, questions: [q] });
  }

  const isMultiStep = isStepBased || (questions.length > 6 && sectionGroups.length > 1);
  const totalSteps = isStepBased ? activeSteps.length : isMultiStep ? sectionGroups.length : 1;

  const schema = buildSchema(questions, new Set(questions.map((q) => q.key)));
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: prefillData as Record<string, unknown>,
  });

  const watchedValues = watch();

  // Compute visible questions for current answers
  const visibleQuestions = questions.filter((q) => isQuestionVisible(q, watchedValues as Record<string, unknown>));
  const visibleKeys = new Set(visibleQuestions.map((q) => q.key));

  // Questions for current step
  const currentStepQuestions = useCallback(() => {
    if (isStepBased) {
      const step = activeSteps[currentStepIdx];
      return visibleQuestions.filter((q) => q.stepId === step?.id);
    }
    if (isMultiStep) {
      return visibleQuestions.filter((q) => q.section === sectionGroups[currentStepIdx]?.section);
    }
    return visibleQuestions;
  }, [isStepBased, isMultiStep, activeSteps, currentStepIdx, visibleQuestions, sectionGroups])();

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${
      hasError ? "border-danger" : "border-border"
    }`;

  function goNext() {
    setCurrentStepIdx((p) => Math.min(p + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack() {
    setCurrentStepIdx((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderField(q: ApplicationQuestion) {
    const label = locale === "tr" ? q.labelTr : q.labelEn || q.labelTr;
    const helper = locale === "tr" ? q.helperTr : q.helperEn || q.helperTr;
    const placeholder = locale === "tr" ? q.placeholderTr : q.placeholderEn || q.placeholderTr;
    const error = errors[q.key]?.message as string | undefined;
    const cls = inputClass(!!error);
    const isCard = q.presentation === "CARDS" || q.presentation === "COMPACT_CARDS";
    const isGroupField = ["RADIO", "MULTI_SELECT", "CHECKBOX", "BOOLEAN"].includes(q.type);

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
      case "DATE":
        fieldEl = <input id={q.key} type="date" className={cls} {...register(q.key)} />;
        break;
      case "LONG_TEXT":
        fieldEl = (
          <textarea
            id={q.key}
            className={`${cls} min-h-[100px] resize-y`}
            placeholder={placeholder ?? ""}
            {...register(q.key)}
          />
        );
        break;
      case "BOOLEAN":
        fieldEl = (
          <div className="flex gap-3">
            {[
              { key: "true", tr: "Evet", en: "Yes" },
              { key: "false", tr: "Hayır", en: "No" },
            ].map((opt) => {
              const val = (watchedValues[q.key] as string) ?? "";
              const selected = val === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setValue(q.key as keyof FormData, opt.key as unknown)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    selected
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-surface text-foreground hover:border-primary/50"
                  }`}
                >
                  {locale === "tr" ? opt.tr : opt.en}
                </button>
              );
            })}
          </div>
        );
        break;
      case "SINGLE_SELECT":
        if (isCard) {
          fieldEl = (
            <Controller
              control={control}
              name={q.key as keyof FormData}
              render={({ field }) => (
                <CardOptions
                  q={q}
                  locale={locale}
                  compact={q.presentation === "COMPACT_CARDS"}
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  onAutoAdvance={goNext}
                />
              )}
            />
          );
        } else {
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
        }
        break;
      case "RADIO":
      case "CURRENCY_RANGE":
        if (isCard) {
          fieldEl = (
            <Controller
              control={control}
              name={q.key as keyof FormData}
              render={({ field }) => (
                <CardOptions
                  q={q}
                  locale={locale}
                  compact={q.presentation === "COMPACT_CARDS"}
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  onAutoAdvance={goNext}
                />
              )}
            />
          );
        } else {
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
        }
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

    return (
      <div key={q.key} className="space-y-1.5">
        {isGroupField && q.type !== "BOOLEAN" ? (
          <p className="text-sm font-semibold text-foreground">
            {label}
            {q.required && (
              <span className="text-danger ml-1" aria-hidden>
                *
              </span>
            )}
            {!q.required && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({locale === "tr" ? "opsiyonel" : "optional"})
              </span>
            )}
          </p>
        ) : (
          !["BOOLEAN"].includes(q.type) && (
            <label htmlFor={q.key} className="block text-sm font-semibold text-foreground">
              {label}
              {q.required && (
                <span className="text-danger ml-1" aria-hidden>
                  *
                </span>
              )}
              {!q.required && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({locale === "tr" ? "opsiyonel" : "optional"})
                </span>
              )}
            </label>
          )
        )}
        {q.type === "BOOLEAN" && (
          <p className="text-sm font-semibold text-foreground">
            {label}
            {q.required && <span className="text-danger ml-1">*</span>}
          </p>
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
    // Strip answers for hidden questions
    const cleanData: Record<string, unknown> = {};
    for (const key of visibleKeys) {
      cleanData[key] = (data as Record<string, unknown>)[key];
    }

    setServerError(null);
    startTransition(async () => {
      try {
        const { submitDynamicApplication } = await import("@/features/applications/actions");
        const result = await submitDynamicApplication(productId, cleanData, utmData);
        if (result.ok) {
          onSuccess(result.applicationId);
        } else if (result.existingStatus) {
          setServerError(
            locale === "tr"
              ? "Bu programa daha önce başvurdunuz."
              : "You have already applied to this program."
          );
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

  const currentStep = isStepBased ? activeSteps[currentStepIdx] : null;
  const stepTitle = currentStep
    ? locale === "tr"
      ? currentStep.titleTr
      : currentStep.titleEn || currentStep.titleTr
    : null;
  const stepDesc = currentStep
    ? locale === "tr"
      ? currentStep.descTr
      : currentStep.descEn || currentStep.descTr
    : null;

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} noValidate className="space-y-6">
      {/* Progress indicator */}
      {isMultiStep && totalSteps > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {locale === "tr" ? `Adım ${currentStepIdx + 1} / ${totalSteps}` : `Step ${currentStepIdx + 1} of ${totalSteps}`}
            </span>
            {stepTitle && (
              <span className="text-xs text-muted-foreground">{stepTitle}</span>
            )}
          </div>
          <div className="flex gap-1.5" role="progressbar" aria-valuenow={currentStepIdx + 1} aria-valuemax={totalSteps}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentStepIdx ? "bg-primary" : i === currentStepIdx ? "bg-primary/70" : "bg-border"
                }`}
              />
            ))}
          </div>
          {stepDesc && (
            <p className="text-sm text-muted-foreground">{stepDesc}</p>
          )}
        </div>
      )}

      {/* Step title for single-page forms */}
      {stepTitle && !isMultiStep && (
        <div>
          <h3 className="text-base font-semibold text-foreground">{stepTitle}</h3>
          {stepDesc && <p className="text-sm text-muted-foreground mt-0.5">{stepDesc}</p>}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {currentStepQuestions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {locale === "tr" ? "Bu adımda gösterilecek soru yok." : "No questions to show in this step."}
          </p>
        )}
        {currentStepQuestions.map((q) => renderField(q))}
      </div>

      {serverError && (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        {isMultiStep && currentStepIdx > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus:outline-none"
          >
            {locale === "tr" ? "← Geri" : "← Back"}
          </button>
        )}
        {isMultiStep && currentStepIdx < totalSteps - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary/60 focus:outline-none"
          >
            {locale === "tr" ? "Devam →" : "Continue →"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/60 focus:outline-none"
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
