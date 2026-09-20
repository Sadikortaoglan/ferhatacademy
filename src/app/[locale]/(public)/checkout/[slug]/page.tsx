import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { getProductAccessState, formatPrice } from "@/server/commerce";
import { getSiteSettings } from "@/server/settings";
import { CheckoutForm } from "@/features/commerce/components/checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login?returnTo=/${locale}/checkout/${slug}`);

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { translations: true, grants: true },
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  const state = await getProductAccessState(product.id, session.user.id);
  if (state === "ENTITLED") redirect(`/${locale}/dashboard`);
  if (state === "APPLICATION_SUBMITTED" || state === "NO_APPLICATION") redirect(`/${locale}/products/${slug}`);

  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const settings = await getSiteSettings();
  const priceDisplay = product.price === 0
    ? (locale === "tr" ? "Ücretsiz" : "Free")
    : formatPrice(product.price, product.currency, locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-black">{locale === "tr" ? "Ödeme" : "Checkout"}</h1>
      <div className="border border-border rounded-xl p-6 bg-surface">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{translation?.name}</span>
          <span className="font-bold text-primary">{priceDisplay}</span>
        </div>
      </div>
      <CheckoutForm
        productId={product.id}
        locale={locale}
        isFree={product.price === 0}
        bankName={settings.bankName ?? ""}
        iban={settings.iban ?? ""}
        accountHolder={settings.accountHolder ?? ""}
        paymentInstructions={settings.paymentInstructions ?? ""}
      />
    </div>
  );
}
