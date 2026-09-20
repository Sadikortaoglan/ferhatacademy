import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/features/commerce/components/application-form";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login?returnTo=/${locale}/products/${slug}/apply`);

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  const existing = await prisma.application.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: product.id } },
  });

  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black mb-2">{locale === "tr" ? "Başvuru" : "Application"}</h1>
      <p className="text-muted-foreground mb-8">{translation?.name}</p>
      {existing && !["REJECTED", "CANCELLED"].includes(existing.status) ? (
        <div className="p-6 rounded-xl border border-border bg-surface text-center">
          <p className="font-semibold">{locale === "tr" ? "Başvurunuz alındı" : "Application submitted"}</p>
          <p className="text-sm text-muted-foreground mt-1">{existing.status}</p>
        </div>
      ) : (
        <ApplicationForm productId={product.id} locale={locale} />
      )}
    </div>
  );
}
