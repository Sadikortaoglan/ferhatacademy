import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return (
    <AuthPageShell locale={locale}>
      <Card>
        <CardHeader>
          <CardTitle>{t("registerTitle")}</CardTitle>
          <CardDescription>{t("registerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm locale={locale} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-primary hover:underline">
              {t("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
