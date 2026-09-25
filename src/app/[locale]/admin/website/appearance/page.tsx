import { requireAdmin } from "@/server/auth";
import { getFullAppearanceState } from "./actions";
import { VisualCustomizer } from "./visual-customizer";

export default async function AppearancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const initialState = await getFullAppearanceState();

  return (
    <div className="-m-4 md:-m-6 h-[calc(100vh-64px)] overflow-hidden">
      <VisualCustomizer locale={locale} initialState={initialState} />
    </div>
  );
}
