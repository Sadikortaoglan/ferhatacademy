"use client";

import { useState } from "react";
import { DynamicForm, type ApplicationQuestion } from "./dynamic-form";
import { LegacyApplicationForm } from "./legacy-form";
import { ConfirmationState } from "./confirmation-state";

interface Props {
  productId: string;
  productSlug: string;
  productName: string;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formTemplate: { questions: ApplicationQuestion[] } | null;
  ctaLabel?: string;
}

export function ApplicationFormPanel({
  productId,
  productSlug,
  productName,
  locale,
  formTemplate,
  ctaLabel,
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
        productId={productId}
        locale={locale}
        ctaLabel={ctaLabel}
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
