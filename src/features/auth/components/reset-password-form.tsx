"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "En az 8 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    const { error: err } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });
    if (err) {
      setError("Bağlantı geçersiz veya süresi dolmuş.");
      setLoading(false);
      return;
    }
    router.push(`/${locale}/login?reset=1`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Yeni Şifre</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Şifre Tekrar</Label>
        <Input id="confirm" type="password" {...register("confirm")} />
        {errors.confirm && <p className="text-xs text-danger">{errors.confirm.message}</p>}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "..." : "Şifremi Güncelle"}
      </Button>
    </form>
  );
}
