import Link from "next/link";
import { prisma } from "@/lib/prisma";

const COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  red: "#ef4444",
  pink: "#ec4899",
};

async function getAboutData() {
  const keys = [
    "instagramUrl", "youtubeUrl", "linkedinUrl", "twitterUrl",
    "about.heroTitle", "about.heroBio", "about.heroImageUrl", "about.badge",
    "about.stats", "about.timeline", "about.expertise", "about.gallery",
  ];
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return {
    instagramUrl: map["instagramUrl"] || "#",
    youtubeUrl: map["youtubeUrl"] || "#",
    heroTitle: map["about.heroTitle"] ?? "Merhaba,\nben Ferhat.",
    heroBio: map["about.heroBio"] ?? "Dijital pazarlama alanında işletmelerin gerçek sonuçlar elde etmesine yardımcı olan bir reklam stratejisti ve eğitmeniyim.",
    heroImageUrl: map["about.heroImageUrl"] ?? "",
    badge: map["about.badge"] ?? "Danışmanlık & Eğitim",
    stats: (map["about.stats"] ? JSON.parse(map["about.stats"]) : [
      { value: "500+", label: "Mutlu Öğrenci" },
      { value: "5+", label: "Yıllık Deneyim" },
      { value: "₺10M+", label: "Yönetilen Reklam Bütçesi" },
      { value: "100+", label: "Danışmanlık Verilen İşletme" },
    ]) as { value: string; label: string }[],
    timeline: (map["about.timeline"] ? JSON.parse(map["about.timeline"]) : [
      { year: "2018", title: "Dijital Pazarlamaya İlk Adım", desc: "E-ticaret dünyasına girerek Meta Ads ve dijital pazarlama araçlarını derinlemesine öğrenmeye başladı.", color: "bg-orange-500" },
      { year: "2020", title: "Reklam Yöneticisi", desc: "zovria.com bünyesinde reklam yöneticisi olarak işletmelere yüksek ROI getiren kampanyalar yönetti.", color: "bg-amber-500" },
      { year: "2022", title: "Danışmanlık & Eğitim", desc: "Yüzlerce girişimci ve işletme sahibine Meta Ads, e-ticaret ve dijital strateji konularında danışmanlık vermeye başladı.", color: "bg-yellow-500" },
      { year: "2024", title: "Ferhat Academy", desc: "Bilgi ve deneyimini sistematik hale getirip online bir eğitim platformuna dönüştürdü. Artık herkes bu bilgiye ulaşabiliyor.", color: "bg-primary" },
    ]) as { year: string; title: string; desc: string; color: string }[],
    expertise: (map["about.expertise"] ? JSON.parse(map["about.expertise"]) : [
      { icon: "📣", title: "Meta Ads", desc: "Facebook ve Instagram kampanyalarında strateji, optimizasyon ve ölçeklendirme" },
      { icon: "🛒", title: "E-Ticaret", desc: "Mağaza kurulumundan satış artışına kadar tüm süreç" },
      { icon: "📊", title: "Performans Pazarlama", desc: "Veriyle yönlendirilen kararlar, ölçülebilir büyüme" },
      { icon: "🎯", title: "Hedef Kitle Analizi", desc: "Doğru kitleye, doğru mesajla, doğru zamanda ulaşmak" },
    ]) as { icon: string; title: string; desc: string }[],
    gallery: map["about.gallery"] ? JSON.parse(map["about.gallery"]) as { url: string; alt: string }[] : [],
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await getAboutData();

  const INSTAGRAM_URL = data.instagramUrl;
  const YOUTUBE_URL = data.youtubeUrl;
  const { heroTitle, heroBio, heroImageUrl, badge, stats: STATS, timeline: TIMELINE, expertise: EXPERTISE, gallery } = data;
  const heroLines = heroTitle.split("\n");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f0f0f] px-4 py-20 sm:py-28">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {badge}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05]">
                {heroLines[0]}
                {heroLines.length > 1 && (
                  <>
                    <br />
                    <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                      {heroLines.slice(1).join(" ")}
                    </span>
                  </>
                )}
              </h1>
              <p className="text-lg text-white/60 leading-relaxed">{heroBio}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                  Instagram
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
                  YouTube
                </a>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 to-amber-500/20 blur-xl scale-110" />
                <div className="relative h-72 w-56 sm:h-80 sm:w-64 rounded-3xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  {heroImageUrl ? (
                    <img src={heroImageUrl} className="w-full h-full object-cover" alt="Ferhat" />
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <div className="text-5xl">📸</div>
                      <p className="text-xs text-white/30">Fotoğraf yakında</p>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-4 -left-4 rounded-xl bg-primary px-4 py-2 shadow-xl">
                  <p className="text-xs font-bold text-white">{badge}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="bg-background px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-foreground">Hikayem</h2>
            <p className="text-muted-foreground mt-2">Nasıl başladı, nereye geldi</p>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-10">
              {TIMELINE.map((item) => (
                <div key={item.year} className="relative flex gap-6 items-start">
                  <div
                    className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center shadow-lg z-10"
                    style={{ backgroundColor: COLOR_MAP[item.color] ?? item.color }}
                  >
                    <span className="text-xs font-black text-white">{item.year.slice(2)}</span>
                  </div>
                  <div className="pt-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">{item.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="bg-muted/40 px-4 py-16 sm:py-20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-foreground">Uzmanlık Alanlarım</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXPERTISE.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-surface p-6 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-background px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-black text-foreground">Benim için önemli olan tek şey:</h2>
          <blockquote className="text-2xl sm:text-3xl font-black text-primary leading-tight">
            &ldquo;Teori değil, sonuç.&rdquo;
          </blockquote>
          <p className="text-muted-foreground leading-relaxed text-base max-w-xl mx-auto">
            Reklam yönetimi ve dijital pazarlama üzerine öğrettiğim her şey, gerçek işletmelerde test edilmiş ve sonuç vermiş yöntemlerdir.
            Akademik bilgi değil, sahada çalışan stratejiler.
          </p>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="bg-background py-14 px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground text-center">Galeri</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#0f0f0f] px-4 py-16 sm:py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Birlikte çalışalım</h2>
          <p className="text-white/60">
            Eğitimlerime katıl, mentörlük programına başvur ya da doğrudan ulaş.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/products`}
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              Eğitimlere Bak
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Instagram&apos;da Takip Et
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
