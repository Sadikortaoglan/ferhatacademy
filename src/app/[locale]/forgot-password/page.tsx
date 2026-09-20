import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";

export default async function ForgotPasswordPage({
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
          <CardTitle>{t("forgotPasswordTitle")}</CardTitle>
          <CardDescription>{t("forgotPasswordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm locale={locale} />
          <div className="mt-4 text-center text-sm">
            <Link href={`/${locale}/login`} className="text-muted-foreground hover:text-primary">
              ← {t("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
