"use client";

import { useState } from "react";
import { DynamicForm, type ApplicationQuestion, type ApplicationFormStep } from "./dynamic-form";
import { LegacyApplicationForm } from "./legacy-form";
import { ConfirmationState } from "./confirmation-state";

interface Props {
  productId: string;
  productSlug: string;
  productName: string;
  locale: string;
  formTemplate: { questions: ApplicationQuestion[]; steps: ApplicationFormStep[] } | null;
  ctaLabel?: string;
  prefillData?: Record<string, string>;
}

export function ApplicationFormPanel({
  productId,
  productSlug,
  productName,
  locale,
  formTemplate,
  ctaLabel,
  prefillData,
}: Props) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <ConfirmationState locale={locale} productSlug={productSlug} productName={productName} />
    );
  }

  if (formTemplate?.questions && formTemplate.questions.length > 0) {
    return (
      <DynamicForm
        questions={formTemplate.questions}
        steps={formTemplate.steps ?? []}
        productId={productId}
        locale={locale}
        ctaLabel={ctaLabel}
        prefillData={prefillData}
        onSuccess={() => setSubmitted(true)}
      />
    );
  }

  return (
    <LegacyApplicationForm
      productId={productId}
      locale={locale}
      ctaLabel={ctaLabel}
      onSuccess={() => setSubmitted(true)}
    />
  );
}
