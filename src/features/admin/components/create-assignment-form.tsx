"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createAssignment } from "@/features/admin/actions/assignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const schema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  users: { id: string; name: string | null; email: string }[];
  locale: string;
}

export function CreateAssignmentForm({ users, locale }: Props) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const assignment = await createAssignment(data);
      router.push(`/${locale}/admin/assignments/${assignment.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Bölüm 1 */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold">Temel Bilgiler</h2>
              <p className="text-xs text-muted-foreground">Bu ödev hangi kullanıcıya, ne başlıkla atanacak?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">{t("selectUser")} *</Label>
              <select
                id="userId"
                {...register("userId")}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Kullanıcı seçin...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} — ${u.email}` : u.email}
                  </option>
                ))}
              </select>
              {errors.userId && <p className="text-xs text-danger">Kullanıcı seçmek zorunlu</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">{t("assignmentTitle")} *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Örn: Meta Reklamcılık Programı"
              />
              <p className="text-xs text-muted-foreground">Kullanıcının panelinde görünecek başlık</p>
              {errors.title && <p className="text-xs text-danger">Başlık zorunlu</p>}
            </div>
          </div>

          {/* Bölüm 2 */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold">Açıklama</h2>
              <p className="text-xs text-muted-foreground">Bu programın amacı veya kısa açıklaması (opsiyonel)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("assignmentDesc")}</Label>
              <textarea
                id="description"
                {...register("description")}
                placeholder="Kullanıcıya özel notlar veya program açıklaması..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Oluşturuluyor..." : t("createAssignment")}
            </Button>
            <p className="text-xs text-muted-foreground">Kaydettikten sonra dersler ekleyebilirsin</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
