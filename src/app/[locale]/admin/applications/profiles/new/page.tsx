import { requireAdmin } from "@/server/auth";
import { NewProfileForm } from "./new-profile-form";

export default async function NewProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-black text-foreground">Yeni Sayfa Profili</h1>
      <NewProfileForm locale={locale} />
    </div>
  );
}
