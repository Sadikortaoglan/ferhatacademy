import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthPageShell } from "@/features/auth/components/auth-page-shell";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;

  if (!token) redirect(`/${locale}/forgot-password`);

  return (
    <AuthPageShell locale={locale}>
      <Card>
        <CardHeader>
          <CardTitle>Yeni Şifre Belirle</CardTitle>
          <CardDescription>Hesabınız için yeni bir şifre oluşturun.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} locale={locale} />
          <div className="mt-4 text-center text-sm">
            <Link href={`/${locale}/login`} className="text-muted-foreground hover:text-primary">
              ← Giriş sayfasına dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
