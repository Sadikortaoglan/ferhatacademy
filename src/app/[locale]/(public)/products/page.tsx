import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/server/auth";
import { ProductCard } from "@/components/shared/product-card";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("products");
  const session = await getSession();

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: true, inclusions: true, grants: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <section className="section-dark px-4 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-[hsl(0_0%_95%)]">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[hsl(220_15%_65%)] max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t("noProducts")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} userId={session?.user?.id ?? null} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
