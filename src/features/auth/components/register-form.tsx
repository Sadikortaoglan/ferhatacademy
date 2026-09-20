"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/auth-client";
import { updateProfile } from "@/features/dashboard/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WHY_HERE_OPTIONS = [
  { value: "ecommerce", label: "E-ticaret işi kuruyorum" },
  { value: "meta-ads", label: "Meta reklamlarını öğrenmek istiyorum" },
  { value: "google-ads", label: "Google reklamlarını öğrenmek istiyorum" },
  { value: "grow-business", label: "Mevcut işimi büyütmek istiyorum" },
  { value: "career-change", label: "Kariyer değişikliği yapıyorum" },
  { value: "freelance", label: "Freelance / ajans iş yapıyorum" },
  { value: "curiosity", label: "Sadece merak ediyorum" },
];

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  city: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        setError(result.error.message ?? t("error"));
        return;
      }
      // Save extra profile fields
      if (data.phone || data.birthDate || data.city || selectedGoals.length > 0) {
        await updateProfile({
          name: data.name,
          phone: data.phone,
          birthDate: data.birthDate,
          city: data.city,
          whyHere: selectedGoals.join(","),
        });
      }
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Zorunlu alanlar */}
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")} *</Label>
        <Input id="name" type="text" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-xs text-danger">{t("nameRequired")}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")} *</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-danger">{t("emailInvalid")}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")} *</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-danger">{t("passwordMin")}</p>}
      </div>

      {/* Opsiyonel alanlar */}
      <div className="pt-1 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">Opsiyonel — istersen doldur, sonra da profilden değiştirebilirsin</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm">Telefon</Label>
            <Input id="phone" type="tel" placeholder="+90 5XX..." {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm">Şehir</Label>
            <Input id="city" type="text" placeholder="İstanbul..." {...register("city")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="birthDate" className="text-sm">Doğum Tarihi</Label>
            <Input
              id="birthDate"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              {...register("birthDate")}
            />
          </div>
        </div>
      </div>

      {/* Neden buradasın */}
      <div className="space-y-2">
        <Label className="text-sm">Neden buradasın? <span className="text-muted-foreground font-normal">(birden fazla seçebilirsin)</span></Label>
        <div className="flex flex-wrap gap-2">
          {WHY_HERE_OPTIONS.map((opt) => {
            const selected = selectedGoals.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleGoal(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                }`}
              >
                {selected && "✓ "}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Hesap oluşturuluyor..." : t("register")}
      </Button>
    </form>
  );
}
