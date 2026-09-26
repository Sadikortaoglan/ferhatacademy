import { requireAdmin } from "@/server/auth";
import { NewTemplateForm } from "./new-template-form";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-foreground">Yeni Form Şablonu</h1>
        <p className="text-sm text-muted-foreground">Şablonu oluşturduktan sonra soru ekleyebilirsiniz.</p>
      </div>
      <NewTemplateForm locale={locale} />
    </div>
  );
}
