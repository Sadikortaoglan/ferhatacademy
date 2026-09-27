"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/features/dashboard/actions/profile";

const WHY_HERE_OPTIONS = [
  { value: "ecommerce", label: "E-ticaret işi kuruyorum" },
  { value: "meta-ads", label: "Meta reklamlarını öğrenmek istiyorum" },
  { value: "google-ads", label: "Google reklamlarını öğrenmek istiyorum" },
  { value: "grow-business", label: "Mevcut işimi büyütmek istiyorum" },
  { value: "career-change", label: "Kariyer değişikliği yapıyorum" },
  { value: "freelance", label: "Freelance / ajans iş yapıyorum" },
  { value: "curiosity", label: "Dijital pazarlamayı merak ediyorum" },
];

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    phone: string | null;
    city: string | null;
    bio: string | null;
    birthDate: Date | null;
    whyHere: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState(user.image ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [birthDate, setBirthDate] = useState(
    user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : ""
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user.whyHere ? user.whyHere.split(",").filter(Boolean) : []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        name,
        phone,
        avatar,
        city,
        bio,
        birthDate,
        whyHere: selectedGoals.join(","),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Avatar preview */}
      {avatar && (
        <div className="flex items-center gap-4">
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border border-border"
          />
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      {/* Temel bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Temel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ad Soyad *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.value = t.value.replace(/[^\d+\s\-().]/g, "");
                }}
                placeholder="+90 5XX XXX XX XX"
                type="tel"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Şehir</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="İstanbul, Ankara..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Doğum Tarihi</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Profil Fotoğrafı (URL)</Label>
              <Input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hakkımda <span className="text-muted-foreground text-xs">(maks. 500 karakter)</span></Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Kendinizden kısaca bahsedin..."
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>
        </CardContent>
      </Card>

      {/* Neden buradasın */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Neden Buradasın?
          </CardTitle>
          <p className="text-xs text-muted-foreground">Birden fazla seçebilirsin</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {WHY_HERE_OPTIONS.map((opt) => {
              const selected = selectedGoals.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleGoal(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background text-foreground border-border hover:border-primary/60 hover:bg-muted"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
        {saved && <span className="text-sm text-success font-medium">Kaydedildi!</span>}
      </div>
    </form>
  );
}
