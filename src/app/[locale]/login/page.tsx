import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/auth";
import { LoginForm } from "@/features/auth/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === "ADMIN" || role === "SUPER_ADMIN") redirect(`/${locale}/admin`);
    redirect(`/${locale}/dashboard`);
  }
  const t = await getTranslations("auth");

  return (
    <AuthPageShell locale={locale}>
      <Card>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm locale={locale} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t("dontHaveAccount")}{" "}
            <Link href={`/${locale}/register`} className="text-primary hover:underline">
              {t("register")}
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            <Link href={`/${locale}/forgot-password`} className="text-muted-foreground hover:text-primary">
              {t("forgotPassword")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
