"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { grantAccess } from "@/features/admin/actions/access";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  courses: {
    id: string;
    translations: { locale: string; title: string }[];
  }[];
  users: { id: string; name: string | null; email: string }[];
  locale: string;
}

export function GrantAccessDialog({ courses, users, locale }: Props) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    resourceType: "COURSE",
    resourceId: "",
    expiresAt: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await grantAccess({
        ...form,
        expiresAt: form.expiresAt || undefined,
        reason: form.reason || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setForm({ userId: "", resourceType: "COURSE", resourceId: "", expiresAt: "", reason: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("grantAccess")}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{t("grantAccess")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("selectUser")}</Label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Seçin...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Kurs</Label>
            <select
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: e.target.value, resourceType: "COURSE" })}
              required
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Seçin...</option>
              {courses.map((c) => {
                const title =
                  c.translations.find((tr) => tr.locale === locale)?.title ??
                  c.translations[0]?.title;
                return (
                  <option key={c.id} value={c.id}>
                    {title}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("expiresAt")} ({t("noExpiry")})</Label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("reason")}</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Manuel erişim..."
            />
          </div>
          {success && <p className="text-sm text-success">Erişim verildi!</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "..." : t("grantAccess")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
