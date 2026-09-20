import { requireAdmin } from "@/server/auth";
import { NewProductForm } from "@/features/commerce/components/new-product-form";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-black">Yeni Ürün</h1>
      <NewProductForm locale={locale} />
    </div>
  );
}
