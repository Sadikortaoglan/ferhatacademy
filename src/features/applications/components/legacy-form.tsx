"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitApplication } from "@/features/commerce/actions/applications";

const schema = z.object({
  phone: z.string().min(1, "Telefon zorunludur"),
  goal: z.string().min(10, "En az 10 karakter giriniz"),
  whyInterested: z.string().min(10, "En az 10 karakter giriniz"),
  mainChallenge: z.string().optional(),
  optionalNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  productId: string;
  locale: string;
  ctaLabel?: string;
  onSuccess: () => void;
}

export function LegacyApplicationForm({ productId, locale, ctaLabel, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      await submitApplication(productId, data);
      onSuccess();
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          {locale === "tr" ? "Telefon" : "Phone"}{" "}
          <span className="text-danger" aria-hidden>*</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          className={inputClass}
          placeholder="+90 5XX XXX XX XX"
          onInput={(e) => {
            const t = e.currentTarget;
            t.value = t.value.replace(/[^\d+\s\-().]/g, "");
          }}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-danger" role="alert">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          {locale === "tr" ? "Hedefiniz" : "Your Goal"}{" "}
          <span className="text-danger" aria-hidden>
            *
          </span>
        </label>
        <textarea className={`${inputClass} min-h-[96px] resize-y`} {...register("goal")} />
        {errors.goal && (
          <p className="text-xs text-danger" role="alert">
            {errors.goal.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          {locale === "tr" ? "Neden ilgileniyorsunuz?" : "Why are you interested?"}{" "}
          <span className="text-danger" aria-hidden>
            *
          </span>
        </label>
        <textarea
          className={`${inputClass} min-h-[96px] resize-y`}
          {...register("whyInterested")}
        />
        {errors.whyInterested && (
          <p className="text-xs text-danger" role="alert">
            {errors.whyInterested.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          {locale === "tr" ? "Mevcut zorluğunuz (opsiyonel)" : "Current challenge (optional)"}
        </label>
        <textarea className={`${inputClass} min-h-[80px] resize-y`} {...register("mainChallenge")} />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-foreground">
          {locale === "tr" ? "Eklemek istediğiniz (opsiyonel)" : "Additional note (optional)"}
        </label>
        <textarea className={`${inputClass} min-h-[80px] resize-y`} {...register("optionalNote")} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending
          ? locale === "tr"
            ? "Gönderiliyor..."
            : "Submitting..."
          : (ctaLabel ?? (locale === "tr" ? "Başvuruyu Gönder" : "Submit Application"))}
      </button>
    </form>
  );
}
