import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getSiteAppearance, buildCssVars, getThemeId } from "@/server/appearance";
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
    <html lang={locale} className={geist.variable} data-theme={themeId}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(window.location.search.includes('__preview__=1')){window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='FA_THEME_UPDATE'&&e.data.cssVars){var v=e.data.cssVars;for(var k in v){if(Object.prototype.hasOwnProperty.call(v,k)){document.documentElement.style.setProperty(k,v[k]);}}}if(e.data.type==='FA_THEME_ID'&&e.data.themeId){document.documentElement.setAttribute('data-theme',e.data.themeId);}});}})();` }} />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
