import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/server/commerce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Users, Clock, ArrowRight, CheckCircle, MonitorPlay, User2, Zap } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "tr" ? "Canlı Eğitimler — Ferhat Academy" : "Live Training — Ferhat Academy",
    description: locale === "tr"
      ? "Ferhat ile birebir özel eğitim veya grup workshop. Sorularını gerçek zamanlı çöz."
      : "Private 1:1 training or group workshops with Ferhat. Solve your questions in real time.",
  };
}

const LIVE_TYPES = ["LIVE_TRAINING", "CONSULTATION", "MENTORSHIP"] as const;

async function getLiveProducts(locale: string) {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", type: { in: [...LIVE_TYPES] } },
    include: {
      translations: true,
      inclusions: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  return products.map((p) => ({
    ...p,
    translation: p.translations.find((t) => t.locale === locale) ?? p.translations[0],
  }));
}

function ctaLabel(purchaseMode: string, locale: string) {
  if (purchaseMode === "INVITE_ONLY") return locale === "tr" ? "Davet ile" : "By Invite";
  if (purchaseMode === "APPLICATION_REQUIRED" || purchaseMode === "APPLICATION_REQUIRED_BEFORE_PURCHASE" || purchaseMode === "APPLICATION_OPTIONAL")
    return locale === "tr" ? "Başvur" : "Apply";
  return locale === "tr" ? "Satın Al" : "Buy Now";
}

function typeLabel(type: string, locale: string) {
  if (locale !== "tr") {
    const map: Record<string, string> = { LIVE_TRAINING: "Live Training", CONSULTATION: "Consultation", MENTORSHIP: "Mentorship" };
    return map[type] ?? type;
  }
  const map: Record<string, string> = { LIVE_TRAINING: "Canlı Eğitim", CONSULTATION: "Danışmanlık", MENTORSHIP: "Mentorluk" };
  return map[type] ?? type;
}

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("live");
  const products = await getLiveProducts(locale);

  const isTr = locale === "tr";

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0f0f0f] px-4 pt-16 pb-20 sm:pt-20 sm:pb-28">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[80px]" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {isTr ? "Canlı Eğitimler" : "Live Training"}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05]">
              {isTr ? (
                <>Ferhat ile<br /><span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">birebir çalış.</span></>
              ) : (
                <>Work<br /><span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">directly with Ferhat.</span></>
              )}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              {isTr
                ? "1:1 özel eğitim veya grup workshop — mevcut durumuna göre gerçek zamanlı sorular, canlı geri bildirim ve birlikte problem çözme."
                : "1:1 private training or group workshops — real-time questions, live feedback, and collaborative problem-solving tailored to your situation."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#programs">
                <Button size="lg" className="font-bold">
                  {isTr ? "Programları İncele" : "View Programs"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>

          {/* Visual */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 blur-2xl scale-105" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] bg-white/5 flex items-center justify-center">
                <div className="text-center space-y-3 p-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Video className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-white/40 text-sm">{isTr ? "Zoom · Google Meet" : "Zoom · Google Meet"}</p>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-xl bg-primary/90 backdrop-blur px-4 py-2 shadow-xl">
                <p className="text-xs font-bold text-white">{isTr ? "Gerçek Zamanlı" : "Real-Time"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON: RECORDED vs LIVE ── */}
      <section className="bg-background border-b border-border px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-foreground mb-6 text-center">
            {isTr ? "Kayıtlı Eğitim mi, Canlı Eğitim mi?" : "Recorded vs. Live — What's the difference?"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                <MonitorPlay className="h-4 w-4" />
                {isTr ? "Kayıtlı Eğitim" : "Recorded Course"}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {(isTr
                  ? ["Kendi hızında ilerle", "Tekrar tekrar izle", "Yapılandırılmış içerik", "7/24 erişim"]
                  : ["Learn at your own pace", "Rewatch anytime", "Structured curriculum", "24/7 access"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Zap className="h-4 w-4" />
                {isTr ? "Canlı Eğitim" : "Live Training"}
              </div>
              <ul className="space-y-2 text-sm text-foreground">
                {(isTr
                  ? ["Kişisel sorular ve anlık yanıt", "Gerçek zamanlı geri bildirim", "Mevcut durumuna göre yönlendirme", "Birlikte problem çözme"]
                  : ["Personal questions & instant answers", "Real-time feedback", "Guidance for your specific situation", "Collaborative problem-solving"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section id="programs" className="bg-background px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              {isTr ? "Programlar" : "Programs"}
            </h2>
            <p className="text-muted-foreground">
              {isTr ? "İhtiyacına göre 1:1 özel eğitim veya grup workshop seç." : "Choose 1:1 private training or a group workshop based on your needs."}
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const isOneOnOne = product.type === "CONSULTATION" || product.type === "MENTORSHIP" ||
                  (product.translation?.name?.toLowerCase().includes("1:1") ?? false);
                const priceDisplay = product.price === 0
                  ? (isTr ? "Ücretsiz" : "Free")
                  : formatPrice(product.price, product.currency, locale);
                const cta = ctaLabel(product.purchaseMode, locale);
                const isInviteOnly = product.purchaseMode === "INVITE_ONLY";

                return (
                  <div key={product.id} className="group relative rounded-2xl border border-border bg-surface overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col">
                    {/* Cover / type indicator */}
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-amber-500/10 overflow-hidden">
                      {product.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.coverImageUrl} alt={product.translation?.name ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isOneOnOne
                            ? <User2 className="h-12 w-12 text-primary/30" />
                            : <Users className="h-12 w-12 text-primary/30" />}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {typeLabel(product.type, locale)}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1 space-y-3">
                      <div>
                        <h3 className="font-black text-foreground text-lg leading-snug group-hover:text-primary transition-colors">
                          {product.translation?.name ?? "—"}
                        </h3>
                        {product.translation?.shortDescription && (
                          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                            {product.translation.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Inclusions */}
                      {product.inclusions.length > 0 && (
                        <ul className="space-y-1.5">
                          {product.inclusions.slice(0, 4).map((inc) => {
                            const label = locale === "tr" ? inc.titleTr : (inc.titleEn ?? inc.titleTr);
                            return (
                              <li key={inc.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                {label}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                        <span className="font-black text-primary text-lg">{priceDisplay}</span>
                        {isInviteOnly ? (
                          <Badge variant="outline" className="text-xs">{cta}</Badge>
                        ) : (
                          <Link href={`/${locale}/products/${product.slug}`}>
                            <Button size="sm" className="font-semibold">
                              {cta}
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border border-border bg-muted/30 p-12 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {isTr ? "Yeni tarihler hazırlanıyor" : "New dates coming soon"}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  {isTr
                    ? "Canlı eğitim programları hazırlanıyor. Duyurular için sosyal medyayı takip edebilirsin."
                    : "Live training programs are being prepared. Follow social media for announcements."}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-muted/30 border-y border-border px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isTr ? "Nasıl Çalışır?" : "How Does It Work?"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(isTr ? [
              { num: "01", title: "Eğitimini Seç", desc: "1:1 veya grup eğitimlerinden sana uygun olanı incele." },
              { num: "02", title: "Başvur veya Satın Al", desc: "Programın yapısına göre başvuru veya doğrudan satın alma adımına geç." },
              { num: "03", title: "Tarih Belirlenir", desc: "Uygun tarih ve saat Ferhat ile koordineli şekilde planlanır." },
              { num: "04", title: "Canlı Görüşmeye Katıl", desc: "Zoom veya Google Meet üzerinden belirlenen saatte katıl." },
            ] : [
              { num: "01", title: "Choose a Program", desc: "Browse 1:1 or group training options and find the right fit." },
              { num: "02", title: "Apply or Purchase", desc: "Proceed with an application or direct purchase based on the program." },
              { num: "03", title: "Schedule the Session", desc: "A suitable date and time is arranged with Ferhat." },
              { num: "04", title: "Join Live", desc: "Join via Zoom or Google Meet at the scheduled time." },
            ]).map((step) => (
              <div key={step.num} className="space-y-3">
                <div className="text-4xl font-black text-primary/20">{step.num}</div>
                <h3 className="font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE CAN WORK ON ── */}
      <section className="bg-background px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {isTr ? "Birlikte Neler Üzerinde Çalışabiliriz?" : "What Can We Work On Together?"}
            </h2>
            <p className="text-muted-foreground">
              {isTr ? "Özel eğitimde odak noktasını sen belirlersin." : "In private training, you set the focus."}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(isTr ? [
              "Meta Ads (Facebook & Instagram)",
              "E-Ticaret Stratejisi",
              "Kampanya Yapısı & Optimizasyon",
              "Hedef Kitle Analizi",
              "Performans Pazarlama",
              "Mevcut Hesabını İnceleme",
            ] : [
              "Meta Ads (Facebook & Instagram)",
              "E-Commerce Strategy",
              "Campaign Structure & Optimization",
              "Audience Analysis",
              "Performance Marketing",
              "Account Audit & Review",
            ]).map((topic) => (
              <div key={topic} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONAL VALUE SECTION ── */}
      <section className="bg-[#0f0f0f] px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isTr ? "Genel eğitim değil,\nsenin durumun." : "Not a generic course.\nYour actual situation."}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {isTr
                ? "1:1 eğitimde sana özel bir plan yapılmaz. Mevcut durumunu birlikte ele alır, sorularını canlı yanıtlar, bir sonraki adımlarını netleştiririz."
                : "1:1 training isn't a pre-made plan. We look at your specific situation, answer your questions live, and clarify your next steps together."}
            </p>
            <ul className="space-y-3">
              {(isTr ? [
                "Mevcut durumunu inceleriz",
                "Sorularını canlı ele alırız",
                "Bir sonraki adımlarını netleştiririz",
              ] : [
                "We review your current situation",
                "We address your questions live",
                "We clarify your next steps",
              ]).map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Ferhat Ortaoğlan</p>
                <p className="text-white/40 text-xs">{isTr ? "Meta Ads Uzmanı & Eğitmen" : "Meta Ads Expert & Instructor"}</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic">
              {isTr
                ? "“Her öğrencinin durumu farklı. Eğitimde ilk yaptığımız şey senin nerede olduğunu anlamak.”"
                : "“Every student’s situation is different. The first thing we do in training is understand where you are.”"}
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-background border-t border-border px-4 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {isTr ? "Nasıl ilerleyeceğinden emin değil misin?" : "Not sure which path to take?"}
          </h2>
          <p className="text-muted-foreground">
            {isTr
              ? "Programları incele ve sana uygun eğitim modeli için başvur."
              : "Browse the programs and apply for the training model that fits you."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#programs">
              <Button size="lg" className="font-bold">
                {isTr ? "Programları İncele" : "View Programs"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <Link href={`/${locale}/courses`}>
              <Button size="lg" variant="outline">
                {isTr ? "Kayıtlı Eğitimler" : "Recorded Courses"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
