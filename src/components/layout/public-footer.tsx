import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

interface PublicFooterProps {
  locale: string;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

export async function PublicFooter({ locale }: PublicFooterProps) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("navigation");

  const socialRows = await prisma.siteSetting.findMany({
    where: { key: { in: ["instagramUrl", "youtubeUrl", "linkedinUrl", "twitterUrl"] } },
  });
  const social: Record<string, string> = {};
  socialRows.forEach((r) => { social[r.key] = r.value; });

  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <span className="text-lg font-black text-primary tracking-tight">
              Ferhat Academy
            </span>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {social.instagramUrl && (
                <a href={social.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                  <InstagramIcon className="h-5 w-5" />
                </a>
              )}
              {social.youtubeUrl && (
                <a href={social.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-muted-foreground hover:text-foreground transition-colors">
                  <YoutubeIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Academy */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("academy")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/academy`} className="hover:text-foreground transition-colors">
                  {tNav("academy")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/courses`} className="hover:text-foreground transition-colors">
                  {tNav("courses")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/live`} className="hover:text-foreground transition-colors">
                  {tNav("live")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/products`} className="hover:text-foreground transition-colors">
                  {tNav("products")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-foreground transition-colors">
                  {tNav("about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("support")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-foreground transition-colors">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="hover:text-foreground transition-colors">
                  {locale === "tr" ? "Hesabıma Giriş" : "Sign In"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t("legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="cursor-default" title="Yakında / Coming soon">
                  {t("privacy")}
                </span>
              </li>
              <li>
                <span className="cursor-default" title="Yakında / Coming soon">
                  {t("terms")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ferhat Academy. {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
