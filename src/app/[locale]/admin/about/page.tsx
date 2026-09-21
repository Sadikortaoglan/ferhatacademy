import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { AboutEditor } from "@/features/admin/components/about-editor";

async function getAboutSettings() {
  const keys = [
    "about.heroTitle", "about.heroBio", "about.heroImageUrl", "about.badge",
    "about.stats", "about.timeline", "about.expertise", "about.gallery",
  ];
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return {
    heroTitle: map["about.heroTitle"] ?? "Merhaba,\nben Ferhat.",
    heroBio: map["about.heroBio"] ?? "Dijital pazarlama alanında işletmelerin gerçek sonuçlar elde etmesine yardımcı olan bir reklam stratejisti ve eğitmeniyim.",
    heroImageUrl: map["about.heroImageUrl"] ?? "",
    badge: map["about.badge"] ?? "Danışmanlık & Eğitim",
    stats: map["about.stats"] ? JSON.parse(map["about.stats"]) : [
      { value: "500+", label: "Mutlu Öğrenci" },
      { value: "5+", label: "Yıllık Deneyim" },
      { value: "₺10M+", label: "Yönetilen Reklam Bütçesi" },
      { value: "100+", label: "Danışmanlık Verilen İşletme" },
    ],
    timeline: map["about.timeline"] ? JSON.parse(map["about.timeline"]) : [
      { year: "2018", title: "Dijital Pazarlamaya İlk Adım", desc: "E-ticaret dünyasına girerek Meta Ads ve dijital pazarlama araçlarını derinlemesine öğrenmeye başladı.", color: "bg-orange-500" },
      { year: "2020", title: "Reklam Yöneticisi", desc: "İşletmelere yüksek ROI getiren kampanyalar yönetti.", color: "bg-amber-500" },
      { year: "2022", title: "Danışmanlık & Eğitim", desc: "Yüzlerce girişimci ve işletme sahibine danışmanlık vermeye başladı.", color: "bg-yellow-500" },
      { year: "2024", title: "Ferhat Academy", desc: "Bilgi ve deneyimini sistematik hale getirip online bir eğitim platformuna dönüştürdü.", color: "bg-primary" },
    ],
    expertise: map["about.expertise"] ? JSON.parse(map["about.expertise"]) : [
      { icon: "📣", title: "Meta Ads", desc: "Facebook ve Instagram kampanyalarında strateji, optimizasyon ve ölçeklendirme" },
      { icon: "🛒", title: "E-Ticaret", desc: "Mağaza kurulumundan satış artışına kadar tüm süreç" },
      { icon: "📊", title: "Performans Pazarlama", desc: "Veriyle yönlendirilen kararlar, ölçülebilir büyüme" },
      { icon: "🎯", title: "Hedef Kitle Analizi", desc: "Doğru kitleye, doğru mesajla, doğru zamanda ulaşmak" },
    ],
    gallery: map["about.gallery"] ? JSON.parse(map["about.gallery"]) : [],
  };
}

export default async function AdminAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireAdmin(locale);
  const settings = await getAboutSettings();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Hakkımda Sayfası</h1>
          <p className="text-sm text-muted-foreground mt-1">Herkese açık /about sayfasının içeriğini buradan yönet</p>
        </div>
        <a
          href="/tr/about"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Sayfayı Gör →
        </a>
      </div>
      <AboutEditor settings={settings} />
    </div>
  );
}
