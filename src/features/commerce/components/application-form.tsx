"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitApplication } from "@/features/commerce/actions/applications";

const schema = z.object({
  phone: z.string().min(1, "Telefon zorunludur"),
  currentExperience: z.string().optional(),
  goal: z.string().min(10, "En az 10 karakter"),
  mainChallenge: z.string().optional(),
  whyInterested: z.string().min(10, "En az 10 karakter"),
  optionalNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ApplicationForm({ productId, locale }: { productId: string; locale: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await submitApplication(productId, data);
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="p-6 rounded-xl border border-border bg-surface text-center">
        <p className="font-semibold">{locale === "tr" ? "Başvurunuz alındı. En kısa sürede incelenecektir." : "Application submitted. We'll review it shortly."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Telefon *</Label>
        <Input
          type="tel"
          inputMode="numeric"
          placeholder="+90 5XX XXX XX XX"
          onInput={(e) => {
            const t = e.currentTarget;
            t.value = t.value.replace(/[^\d+\s\-().]/g, "");
          }}
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Hedefin nedir? *</Label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("goal")}
        />
        {errors.goal && <p className="text-xs text-red-500">{errors.goal.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Neden ilgileniyorsun? *</Label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("whyInterested")}
        />
        {errors.whyInterested && <p className="text-xs text-red-500">{errors.whyInterested.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Mevcut zorlukların (opsiyonel)</Label>
        <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20" {...register("mainChallenge")} />
      </div>
      <div className="space-y-2">
        <Label>Eklemek istediğin bir şey (opsiyonel)</Label>
        <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20" {...register("optionalNote")} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </Button>
    </form>
  );
}
