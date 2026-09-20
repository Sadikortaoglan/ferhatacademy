"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct } from "@/features/commerce/actions/products";

const productTypes = ["COURSE", "MENTORSHIP", "CONSULTATION", "LIVE_TRAINING", "MEMBERSHIP", "BUNDLE", "DIGITAL_PRODUCT", "PHYSICAL_PRODUCT"];
const purchaseModes = ["DIRECT_PURCHASE", "APPLICATION_OPTIONAL", "APPLICATION_REQUIRED", "APPLICATION_REQUIRED_BEFORE_PURCHASE", "INVITE_ONLY"];

export function NewProductForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const nameTr = fd.get("nameTr") as string;
    const slug = fd.get("slug") as string;
    if (!nameTr || !slug) { setError("Ad ve Slug zorunludur."); return; }

    setLoading(true);
    try {
      const product = await createProduct({
        nameTr,
        nameEn: fd.get("nameEn") as string || undefined,
        slug,
        type: fd.get("type") as string,
        purchaseMode: fd.get("purchaseMode") as string,
        price: parseInt((fd.get("price") as string) || "0"),
        currency: "TRY",
        shortDescriptionTr: fd.get("shortDescriptionTr") as string || undefined,
        coverImageUrl: fd.get("coverImageUrl") as string || undefined,
      });
      router.push(`/${locale}/admin/products/${product.id}`);
    } catch (e) {
      console.error(e);
      setError("Bir hata oluştu.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 border border-border rounded-xl p-6 bg-surface">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="space-y-2">
        <Label>Ad (TR) *</Label>
        <Input name="nameTr" required />
      </div>
      <div className="space-y-2">
        <Label>Ad (EN)</Label>
        <Input name="nameEn" />
      </div>
      <div className="space-y-2">
        <Label>Slug (URL) *</Label>
        <Input name="slug" required placeholder="ornek-urun-adi" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tür *</Label>
          <select name="type" defaultValue="COURSE" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Satın Alma Modu *</Label>
          <select name="purchaseMode" defaultValue="DIRECT_PURCHASE" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {purchaseModes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Fiyat (kuruş, ör: 249900 = 2499.00 TRY) *</Label>
        <Input name="price" type="number" defaultValue="0" min={0} required />
      </div>
      <div className="space-y-2">
        <Label>Kısa Açıklama (TR)</Label>
        <Input name="shortDescriptionTr" />
      </div>
      <div className="space-y-2">
        <Label>Kapak Görseli URL</Label>
        <Input name="coverImageUrl" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Oluşturuluyor..." : "Ürün Oluştur"}
      </Button>
    </form>
  );
}
