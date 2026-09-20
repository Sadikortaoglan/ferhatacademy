import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-xl mt-4 text-foreground">{t("notFound")}</p>
        <Link href="/tr" className="mt-6 inline-block">
          <Button>{t("tryAgain")}</Button>
        </Link>
      </div>
    </div>
  );
}
