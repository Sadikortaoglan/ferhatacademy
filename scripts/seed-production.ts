/**
 * Production seed script — safe to run multiple times (idempotent).
 *
 * Creates:
 *  - 3 users:  superadmin / admin / user
 *  - Draft products: LIVE_TRAINING, CONSULTATION, MENTORSHIP
 *  - About page siteSetting pre-fill
 *
 * Usage:
 *   pnpm tsx scripts/seed-production.ts
 *
 * Credentials are read from env vars (see defaults below).
 */

import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.PROD_SUPER_ADMIN_EMAIL ?? "superadmin@ferhatacademy.com";
const SUPER_ADMIN_PASS  = process.env.PROD_SUPER_ADMIN_PASS  ?? "SuperAdmin123!";
const ADMIN_EMAIL       = process.env.PROD_ADMIN_EMAIL       ?? "admin@ferhatacademy.com";
const ADMIN_PASS        = process.env.PROD_ADMIN_PASS        ?? "Admin123!";
const USER_EMAIL        = process.env.PROD_USER_EMAIL        ?? "user@ferhatacademy.com";
const USER_PASS         = process.env.PROD_USER_PASS         ?? "User123!";

async function createUser(
  email: string,
  password: string,
  name: string,
  role: "SUPER_ADMIN" | "ADMIN" | "USER"
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⏭  ${email} already exists`);
    return existing;
  }
  await auth.api.signUpEmail({ body: { email, password, name }, asResponse: false });
  const user = await prisma.user.update({ where: { email }, data: { role } });
  console.log(`  ✅ Created ${role}: ${email}`);
  return user;
}

async function seedUsers() {
  console.log("\n👤 Users");
  await createUser(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS, "Ferhat (Süper Admin)", "SUPER_ADMIN");
  await createUser(ADMIN_EMAIL,       ADMIN_PASS,       "Ferhat (Admin)",       "ADMIN");
  await createUser(USER_EMAIL,        USER_PASS,        "Test Kullanıcı",       "USER");
}

async function seedProducts() {
  console.log("\n🛒 Ürünler (DRAFT)");

  const products = [
    {
      slug: "11-ozel-egitim-dijital-pazarlama",
      type: "LIVE_TRAINING" as const,
      purchaseMode: "APPLICATION_REQUIRED_BEFORE_PURCHASE" as const,
      price: 499900,
      currency: "TRY",
      nameTr: "1:1 Özel Dijital Pazarlama Eğitimi",
      descTr: "Kendi işinize özel, bire bir yürütülen canlı eğitim seansları. Meta Ads, Google Ads, içerik stratejisi veya genel dijital pazarlama üzerine özelleştirilmiş program.",
      shortDescTr: "Ferhat ile bire bir, size özel canlı dijital pazarlama eğitimi.",
      inclusions: [
        { titleTr: "4 haftalık bire bir canlı seans", type: "LIVE_SESSION" as const, quantity: 4, durationMinutes: 60, position: 0 },
        { titleTr: "Kişisel yol haritası ve haftalık ödevler", type: "CUSTOM" as const, position: 1 },
        { titleTr: "Seanslar arası WhatsApp desteği", type: "CUSTOM" as const, position: 2 },
        { titleTr: "Kayıt erişimi", type: "VIDEO" as const, position: 3 },
      ],
    },
    {
      slug: "reklam-hesabi-danismanligi",
      type: "CONSULTATION" as const,
      purchaseMode: "APPLICATION_OPTIONAL" as const,
      price: 149900,
      currency: "TRY",
      nameTr: "Reklam Hesabı Danışmanlığı",
      descTr: "Mevcut Meta veya Google Ads hesabınızı birlikte inceleriz. Neyin işe yaramadığını tespit eder, hızlı kazanımlar ve uzun vadeli optimizasyon planı hazırlarız.",
      shortDescTr: "Reklam hesabınızı birlikte analiz edip aksiyon planı çıkaralım.",
      inclusions: [
        { titleTr: "90 dakika Zoom görüşmesi", type: "CONSULTATION" as const, quantity: 1, durationMinutes: 90, position: 0 },
        { titleTr: "Hesap analiz raporu (PDF)", type: "DOWNLOAD" as const, position: 1 },
        { titleTr: "1 hafta e-posta takip desteği", type: "CUSTOM" as const, position: 2 },
      ],
    },
    {
      slug: "dijital-pazarlama-mentorluk-3-ay",
      type: "MENTORSHIP" as const,
      purchaseMode: "APPLICATION_REQUIRED" as const,
      price: 2499900,
      currency: "TRY",
      nameTr: "3 Aylık Dijital Pazarlama Mentörlüğü",
      descTr: "Üç ay boyunca her hafta görüşerek dijital pazarlama becerilerinizi veya işinizi bir üst seviyeye taşıyoruz. Sınırlı kontenjan.",
      shortDescTr: "3 aylık yoğun bire bir mentörlük — sınırlı kontenjan.",
      inclusions: [
        { titleTr: "12 haftalık bire bir seans", type: "LIVE_SESSION" as const, quantity: 12, durationMinutes: 60, position: 0 },
        { titleTr: "Kişisel büyüme planı", type: "CUSTOM" as const, position: 1 },
        { titleTr: "Öncelikli WhatsApp & e-posta erişimi", type: "CUSTOM" as const, position: 2 },
        { titleTr: "Tüm seans kayıtları", type: "VIDEO" as const, position: 3 },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭  ${p.nameTr} already exists`);
      continue;
    }

    await prisma.product.create({
      data: {
        slug: p.slug,
        type: p.type,
        status: "DRAFT",
        purchaseMode: p.purchaseMode,
        price: p.price,
        currency: p.currency,
        translations: {
          create: [
            {
              locale: "tr",
              name: p.nameTr,
              shortDescription: p.shortDescTr,
              description: p.descTr,
            },
          ],
        },
        inclusions: {
          create: p.inclusions,
        },
      },
    });
    console.log(`  ✅ ${p.type}: ${p.nameTr} (DRAFT)`);
  }
}

async function seedAboutPage() {
  console.log("\n📄 Hakkımda sayfası (siteSetting)");

  const settings: Array<{ key: string; value: string }> = [
    { key: "about.badge",       value: "Dijital Pazarlama Uzmanı" },
    { key: "about.heroTitle",   value: "Dijital Pazarlamada\nSonuç Odaklı Yaklaşım" },
    { key: "about.heroBio",     value: "10+ yıllık saha deneyimiyle Meta Ads, Google Ads ve içerik stratejisi alanlarında işletmelerin büyümesine destek oluyorum. Teori değil, gerçek sonuçlar." },
    { key: "about.heroImageUrl", value: "" },
    {
      key: "about.stats",
      value: JSON.stringify([
        { value: "10+",    label: "Yıl Deneyim" },
        { value: "200+",   label: "Mutlu Müşteri" },
        { value: "₺50M+",  label: "Yönetilen Reklam Bütçesi" },
        { value: "4.9/5",  label: "Müşteri Memnuniyeti" },
      ]),
    },
    {
      key: "about.timeline",
      value: JSON.stringify([
        { year: "2014", title: "Dijital Pazarlamaya Giriş",     desc: "İlk ajans deneyimim ve Meta reklamcılığıyla tanışmam.",         color: "blue" },
        { year: "2017", title: "Freelance Danışmanlık",         desc: "KOBİ'lere ve girişimlere özel reklam danışmanlığı sunmaya başladım.", color: "purple" },
        { year: "2020", title: "Ferhat Academy'nin Kuruluşu",  desc: "Öğrenme platformu ve online eğitim içeriklerinin yayına alınması.", color: "green" },
        { year: "2023", title: "Genişleme ve Büyüme",           desc: "200+ öğrenci, kurumsal danışmanlık projeleri ve mentörlük programı.", color: "orange" },
      ]),
    },
    {
      key: "about.expertise",
      value: JSON.stringify([
        { icon: "🎯", title: "Meta Ads",          desc: "Facebook & Instagram kampanya yönetimi, hedefleme ve optimizasyon." },
        { icon: "🔍", title: "Google Ads",         desc: "Arama, Display ve YouTube reklam stratejileri." },
        { icon: "📱", title: "İçerik Stratejisi", desc: "Organik büyüme için içerik planlaması ve yönetimi." },
        { icon: "📊", title: "Veri Analizi",       desc: "GA4, Meta Pixel ve dönüşüm takibi kurulumu." },
        { icon: "🛒", title: "E-ticaret",          desc: "Shopify, WooCommerce mağazaları için performans pazarlaması." },
        { icon: "🎓", title: "Eğitim",             desc: "Bireysel ve kurumsal dijital pazarlama eğitimleri." },
      ]),
    },
    { key: "about.gallery", value: JSON.stringify([]) },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where:  { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✅ ${settings.length} hakkımda ayarı eklendi (mevcut olanlar korundu)`);
}

async function main() {
  console.log("🌱 Production seed başlıyor...");

  await seedUsers();
  await seedProducts();
  await seedAboutPage();

  console.log("\n✅ Production seed tamamlandı!\n");
  console.log("📌 Giriş bilgileri:");
  console.log(`   Süper Admin : ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASS}`);
  console.log(`   Admin       : ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
  console.log(`   Kullanıcı   : ${USER_EMAIL} / ${USER_PASS}`);
  console.log("\n⚠️  Ürünler DRAFT olarak oluşturuldu — admin panelinden düzenleyip yayınlayabilirsiniz.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
