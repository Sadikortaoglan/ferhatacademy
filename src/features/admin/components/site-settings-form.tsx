"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings } from "@/features/admin/actions/settings";

const schema = z.object({
  academyName: z.string().min(1),
  supportEmail: z.string().email().optional().or(z.literal("")),
  defaultLocale: z.string().min(1),
  timezone: z.string().min(1),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountHolder: z.string().optional(),
  paymentInstructions: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TABS = [
  { id: "general", label: "⚙️  Genel" },
  { id: "payment", label: "💳  Ödeme" },
  { id: "social", label: "📱  Sosyal Medya" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SiteSettingsFormProps {
  settings: Record<string, string>;
  locale: string;
}

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      academyName: settings.academyName ?? "Ferhat Academy",
      supportEmail: settings.supportEmail ?? "",
      defaultLocale: settings.defaultLocale ?? "tr",
      timezone: settings.timezone ?? "Europe/Istanbul",
      bankName: settings.bankName ?? "",
      iban: settings.iban ?? "",
      accountHolder: settings.accountHolder ?? "",
      paymentInstructions: settings.paymentInstructions ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      youtubeUrl: settings.youtubeUrl ?? "",
      linkedinUrl: settings.linkedinUrl ?? "",
      twitterUrl: settings.twitterUrl ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await updateSiteSettings(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Genel */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Genel Ayarlar</h2>
              <p className="text-sm text-muted-foreground">Akademi adı, dil ve zaman dilimi</p>
            </div>
            <div className="space-y-2">
              <Label>Akademi Adı</Label>
              <Input {...register("academyName")} />
            </div>
            <div className="space-y-2">
              <Label>Destek E-postası</Label>
              <Input type="email" {...register("supportEmail")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Varsayılan Dil</Label>
                <select
                  {...register("defaultLocale")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="tr">Türkçe (tr)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Zaman Dilimi</Label>
                <select
                  {...register("timezone")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                  <option value="Europe/London">Londra (UTC+0)</option>
                  <option value="America/New_York">New York (UTC-5)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Ödeme */}
        {activeTab === "payment" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Ödeme Bilgileri</h2>
              <p className="text-sm text-muted-foreground">Havale/EFT için gösterilecek banka bilgileri</p>
            </div>
            <div className="space-y-2">
              <Label>Banka Adı</Label>
              <Input {...register("bankName")} placeholder="örn. Ziraat Bankası" />
            </div>
            <div className="space-y-2">
              <Label>Hesap Sahibi</Label>
              <Input {...register("accountHolder")} placeholder="Ad Soyad / Şirket adı" />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input {...register("iban")} placeholder="TR00 0000 0000 0000 0000 0000 00" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Ödeme Talimatları <span className="text-muted-foreground text-xs font-normal">(opsiyonel)</span></Label>
              <textarea
                {...register("paymentInstructions")}
                placeholder="Havale açıklamasına sipariş numaranızı yazmayı unutmayın."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* Sosyal Medya */}
        {activeTab === "social" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Sosyal Medya</h2>
              <p className="text-sm text-muted-foreground">Hakkımda sayfası ve footer&apos;da görünür</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-base">📸</span> Instagram
              </Label>
              <Input {...register("instagramUrl")} placeholder="https://instagram.com/kullaniciadi" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-base">▶️</span> YouTube
              </Label>
              <Input {...register("youtubeUrl")} placeholder="https://youtube.com/@kullaniciadi" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-base">💼</span> LinkedIn
              </Label>
              <Input {...register("linkedinUrl")} placeholder="https://linkedin.com/in/kullaniciadi" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-base">𝕏</span> Twitter / X
              </Label>
              <Input {...register("twitterUrl")} placeholder="https://x.com/kullaniciadi" />
            </div>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-red-500">
            Lütfen tüm zorunlu alanları kontrol edin: {Object.keys(errors).join(", ")}
          </p>
        )}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Kaydedildi</span>}
        </div>
      </form>
    </div>
  );
}
