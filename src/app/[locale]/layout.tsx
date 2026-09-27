import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getSiteAppearance, buildCssVars, getThemeId } from "@/server/appearance";
import { HtmlAttributeSetter } from "@/components/html-attribute-setter";
import { PreviewListener } from "@/components/preview-listener";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Ferhat Academy",
  description: "Bilingual digital academy platform",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "tr" | "en")) {
    notFound();
  }
  const [messages, appearance] = await Promise.all([getMessages(), getSiteAppearance()]);
  const cssVars = buildCssVars(appearance);
  const themeId = getThemeId(appearance);
  return (
    <>
      <HtmlAttributeSetter locale={locale} themeId={themeId} fontClass={geist.variable} />
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <PreviewListener />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
}
