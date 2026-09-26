/**
 * scripts/bootstrap-production-content.ts
 *
 * Bootstrap real production content for Ferhat Academy.
 * Safe to run multiple times — IDEMPOTENT.
 *
 * Creates (if missing):
 *   - 5 form templates with proper step structure
 *   - 5 navigation items (for admin nav editor)
 *   - 5 e-ticaret themed draft courses
 *   - 2 application page profiles (mentorship + consultation)
 *   - 2 products (mentorship, consultation) with template + profile connections
 *
 * Never overwrites admin-edited content.
 * Never creates test/E2E fixtures.
 * Never deletes existing records.
 *
 * Usage:
 *   pnpm tsx scripts/bootstrap-production-content.ts --dry-run
 *   pnpm tsx scripts/bootstrap-production-content.ts
 *
 * Target database must be ferhatacademy-postgres.
 * Do NOT run against Asenovo or QR Menu databases.
 */

import { PrismaClient } from "@prisma/client";
import { DEFAULT_TEMPLATES } from "../src/lib/application-templates";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ───────────────────────────────────────────────────────────────────

let createCount = 0;
let skipCount = 0;
const conflicts: string[] = [];

function log(symbol: string, msg: string) {
  console.log(`  ${symbol}  ${msg}`);
}

function logCreate(msg: string) {
  if (DRY_RUN) {
    log("📋", `[DRY RUN] WOULD CREATE: ${msg}`);
  } else {
    log("✅", `CREATED: ${msg}`);
  }
  createCount++;
}

function logSkip(msg: string) {
  log("⏭ ", `SKIP (exists): ${msg}`);
  skipCount++;
}

function logConflict(msg: string) {
  log("⚠️ ", `CONFLICT (human decision needed): ${msg}`);
  conflicts.push(msg);
}

// ── 1. Form Templates (with steps) ───────────────────────────────────────────

// Step definitions per template — these add proper 3-step structure on top of
// the question definitions already in DEFAULT_TEMPLATES.
const TEMPLATE_STEPS: Record<
  string,
  Array<{ stableKey: string; position: number; titleTr: string; titleEn: string; questionKeys: string[] }>
> = {
  mentorship: [
    { stableKey: "contact",    position: 0, titleTr: "İletişim",  titleEn: "Contact",    questionKeys: ["phone"] },
    { stableKey: "experience", position: 1, titleTr: "Deneyim",   titleEn: "Experience", questionKeys: ["current_experience", "current_situation"] },
    { stableKey: "goals",      position: 2, titleTr: "Hedefler",  titleEn: "Goals",      questionKeys: ["main_goal", "main_challenge", "why_interested", "optional_note"] },
  ],
  consultation: [
    { stableKey: "contact",    position: 0, titleTr: "İletişim",  titleEn: "Contact",    questionKeys: ["phone", "business_project"] },
    { stableKey: "need",       position: 1, titleTr: "İhtiyaç",   titleEn: "Need",       questionKeys: ["current_problem", "desired_help", "desired_outcome", "optional_note"] },
  ],
  live_training: [
    { stableKey: "contact",    position: 0, titleTr: "İletişim",  titleEn: "Contact",    questionKeys: ["phone"] },
    { stableKey: "background", position: 1, titleTr: "Geçmiş",    titleEn: "Background", questionKeys: ["current_experience", "training_topic", "specific_questions"] },
    { stableKey: "preferences",position: 2, titleTr: "Tercihler", titleEn: "Preferences",questionKeys: ["preferred_format", "optional_note"] },
  ],
  cohort_premium: [
    { stableKey: "contact",    position: 0, titleTr: "İletişim",  titleEn: "Contact",    questionKeys: ["phone"] },
    { stableKey: "situation",  position: 1, titleTr: "Durum",     titleEn: "Situation",  questionKeys: ["current_level", "current_situation", "main_blocker"] },
    { stableKey: "goals",      position: 2, titleTr: "Hedefler",  titleEn: "Goals",      questionKeys: ["main_goal", "why_now", "weekly_time", "preferred_language", "why_join", "optional_note"] },
  ],
  general_custom: [
    { stableKey: "application", position: 0, titleTr: "Başvuru", titleEn: "Application", questionKeys: ["phone", "main_goal", "why_interested", "current_challenge", "optional_note"] },
  ],
};

async function bootstrapTemplates() {
  console.log("\n📝 Form Templates");

  for (const def of DEFAULT_TEMPLATES) {
    const existing = await prisma.applicationFormTemplate.findUnique({
      where: { key: def.key },
      include: { steps: true, questions: true },
    });

    if (!existing) {
      logCreate(`Template "${def.nameTr}" (key: ${def.key})`);
      if (DRY_RUN) continue;

      const steps = TEMPLATE_STEPS[def.key] ?? [];

      const template = await prisma.applicationFormTemplate.create({
        data: {
          key: def.key,
          type: def.type,
          nameTr: def.nameTr,
          nameEn: def.nameEn,
          steps: {
            create: steps.map((s) => ({
              stableKey: s.stableKey,
              position: s.position,
              titleTr: s.titleTr,
              titleEn: s.titleEn,
              active: true,
            })),
          },
          questions: {
            create: def.questions.map((q) => ({
              key: q.key,
              type: q.type,
              section: q.section,
              labelTr: q.labelTr,
              labelEn: q.labelEn,
              helperTr: q.helperTr,
              helperEn: q.helperEn,
              placeholderTr: q.placeholderTr,
              placeholderEn: q.placeholderEn,
              required: q.required,
              position: q.position,
              options: q.options ? { create: q.options } : undefined,
            })),
          },
        },
        include: { steps: true, questions: true },
      });

      // Assign questions to steps using questionKeys mapping
      for (const stepDef of steps) {
        const step = template.steps.find((s) => s.stableKey === stepDef.stableKey);
        if (!step) continue;
        for (const qKey of stepDef.questionKeys) {
          const question = template.questions.find((q) => q.key === qKey);
          if (question) {
            await prisma.applicationQuestion.update({
              where: { id: question.id },
              data: { stepId: step.id },
            });
          }
        }
      }
      continue;
    }

    // Template exists — check if it has steps; if not, add them
    if (existing.steps.length === 0) {
      const steps = TEMPLATE_STEPS[def.key] ?? [];
      if (steps.length > 0) {
        logCreate(`Steps for existing template "${existing.nameTr}" (no steps yet)`);
        if (DRY_RUN) continue;

        for (const stepDef of steps) {
          // upsert step
          const step = await prisma.applicationFormStep.upsert({
            where: { templateId_stableKey: { templateId: existing.id, stableKey: stepDef.stableKey } },
            create: {
              templateId: existing.id,
              stableKey: stepDef.stableKey,
              position: stepDef.position,
              titleTr: stepDef.titleTr,
              titleEn: stepDef.titleEn,
              active: true,
            },
            update: {},
          });

          // Assign questions only if they currently have no stepId
          for (const qKey of stepDef.questionKeys) {
            const question = existing.questions.find((q) => q.key === qKey);
            if (question && !question.stepId) {
              await prisma.applicationQuestion.update({
                where: { id: question.id },
                data: { stepId: step.id },
              });
            }
          }
        }
      } else {
        logSkip(`Template "${existing.nameTr}" (no step definition for key ${def.key})`);
      }
    } else {
      logSkip(`Template "${existing.nameTr}" (${existing.steps.length} steps already configured)`);
    }
  }
}

// ── 2. Navigation Items ───────────────────────────────────────────────────────

// NOTE: The current public header (src/components/layout/public-header.tsx) uses
// a hardcoded static navLinks array and does NOT yet read from the NavItem DB table.
// These nav items are created for the admin navigation editor and for when the
// public header is connected to the DB in a future update.

const NAV_ITEMS = [
  { key: "akademi",  labelTr: "Akademi",     labelEn: "Academy",    href: "/academy",   position: 0, showInNavbar: true,  showInFooter: false },
  { key: "kurslar",  labelTr: "Kurslar",     labelEn: "Courses",    href: "/courses",   position: 1, showInNavbar: true,  showInFooter: true  },
  { key: "canli",    labelTr: "Canlı",       labelEn: "Live",       href: "/live",      position: 2, showInNavbar: true,  showInFooter: false },
  { key: "urunler",  labelTr: "Ürünler",     labelEn: "Products",   href: "/products",  position: 3, showInNavbar: true,  showInFooter: true  },
  { key: "hakkimda", labelTr: "Hakkımda",    labelEn: "About",      href: "/about",     position: 4, showInNavbar: true,  showInFooter: true  },
];

async function bootstrapNavigation() {
  console.log("\n🧭 Navigation Items");

  for (const item of NAV_ITEMS) {
    const existing = await prisma.navItem.findUnique({ where: { key: item.key } });
    if (existing) {
      logSkip(`NavItem "${item.key}" (${item.labelTr})`);
      continue;
    }
    logCreate(`NavItem "${item.key}" → ${item.href}`);
    if (!DRY_RUN) {
      await prisma.navItem.create({
        data: {
          ...item,
          enabled: true,
          openInNewTab: false,
        },
      });
    }
  }
}

// ── 3. Courses ────────────────────────────────────────────────────────────────

const COURSES = [
  {
    slug: "e-ticarete-baslangic",
    translations: [
      {
        locale: "tr",
        title: "E-Ticarete Başlangıç",
        shortDescription: "E-ticaretin temel kavramlarını, mağaza kurulumunu ve ürün seçimini ele alan başlangıç eğitimi.",
        description: "E-ticaretin temel kavramlarını, mağaza kurulum mantığını, ürün seçimini ve başlangıç sürecini sistemli şekilde ele alan temel eğitim.",
      },
      {
        locale: "en",
        title: "Getting Started with E-Commerce",
        shortDescription: "A beginner course covering e-commerce fundamentals, store setup, and product selection.",
        description: "A structured beginner course covering e-commerce concepts, store setup logic, product selection, and the launch process.",
      },
    ],
  },
  {
    slug: "meta-reklamlari-temelden-performansa",
    translations: [
      {
        locale: "tr",
        title: "Meta Reklamları: Temelden Performansa",
        shortDescription: "Meta reklam yapısını, kampanya mantığını ve performans değerlendirmesini ele alan eğitim.",
        description: "Meta reklam yapısını, kampanya mantığını, hedefleme, kreatif ve performans değerlendirmesini temel seviyeden ele alan eğitim.",
      },
      {
        locale: "en",
        title: "Meta Ads: From Basics to Performance",
        shortDescription: "A course covering Meta ad structure, campaign logic, targeting and performance review.",
        description: "A course covering Meta ad structure, campaign logic, targeting, creative and performance measurement from beginner level.",
      },
    ],
  },
  {
    slug: "e-ticaret-operasyon-ve-buyume",
    translations: [
      {
        locale: "tr",
        title: "E-Ticaret Operasyon ve Büyüme",
        shortDescription: "Sipariş, operasyon, müşteri deneyimi ve sürdürülebilir büyüme süreçlerini ele alan eğitim.",
        description: "Sipariş, operasyon, müşteri deneyimi ve sürdürülebilir büyüme süreçlerini bir bütün olarak ele alan eğitim.",
      },
      {
        locale: "en",
        title: "E-Commerce Operations & Growth",
        shortDescription: "A course on order management, operations, customer experience and sustainable growth.",
        description: "A course covering order management, operations, customer experience and sustainable growth processes as a whole.",
      },
    ],
  },
  {
    slug: "donusum-odakli-urun-sayfalari",
    translations: [
      {
        locale: "tr",
        title: "Dönüşüm Odaklı Ürün Sayfaları",
        shortDescription: "Ürün sayfalarının içerik, güven ve dönüşüm açısından nasıl hazırlanacağını ele alan eğitim.",
        description: "Ürün sayfalarının içerik, güven, teklif ve kullanıcı deneyimi açısından nasıl daha anlaşılır ve dönüşüm odaklı hazırlanabileceğini ele alan eğitim.",
      },
      {
        locale: "en",
        title: "Conversion-Focused Product Pages",
        shortDescription: "Learn how to build product pages optimized for clarity, trust and conversion.",
        description: "A course on building product pages focused on content clarity, trust signals, offer presentation and user experience.",
      },
    ],
  },
  {
    slug: "e-ticaret-analitigi-performans",
    translations: [
      {
        locale: "tr",
        title: "E-Ticaret Analitiği ve Performans Takibi",
        shortDescription: "Temel e-ticaret metriklerini, reklam verilerini ve performans takibini ele alan eğitim.",
        description: "Temel e-ticaret metriklerini, reklam ve satış verilerini anlamayı ve performansı düzenli takip etmeyi ele alan eğitim.",
      },
      {
        locale: "en",
        title: "E-Commerce Analytics & Performance Tracking",
        shortDescription: "Learn to understand key e-commerce metrics, ad data and performance tracking.",
        description: "A course covering key e-commerce metrics, understanding ad and sales data, and building a regular performance review routine.",
      },
    ],
  },
];

async function bootstrapCourses() {
  console.log("\n📚 Kurslar (DRAFT)");

  for (const course of COURSES) {
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } });
    if (existing) {
      logSkip(`Course "${course.slug}"`);
      continue;
    }
    logCreate(`Course slug="${course.slug}" (${course.translations[0].title})`);
    if (!DRY_RUN) {
      await prisma.course.create({
        data: {
          slug: course.slug,
          status: "DRAFT",
          translations: { create: course.translations },
        },
      });
    }
  }
}

// ── 4. Application Page Profiles ─────────────────────────────────────────────

const APP_PROFILES = [
  {
    key: "mentorship",
    headlineTr: "Özel E-Ticaret Mentörlüğüne Başvur",
    headlineEn: "Apply for Private E-Commerce Mentorship",
    subtitleTr: "Bire bir, kişiselleştirilmiş mentörlük programı",
    subtitleEn: "One-on-one, personalized mentorship program",
    motivationTr: "E-ticaret işini büyütmek istiyorsun ama nereden başlayacağını ve ne yapman gerektiğini net göremiyorsun. Birlikte, senin işine özel bir yol haritası çıkaracağız.",
    motivationEn: "You want to grow your e-commerce business but aren't sure where to start or what to focus on. Together, we'll build a roadmap tailored to your specific situation.",
    ctaLabelTr: "Başvuruyu Tamamla",
    ctaLabelEn: "Submit Application",
    processSteps: [
      { titleTr: "Başvuruyu doldur", titleEn: "Complete the application", descTr: "Mevcut durumun ve hedeflerini anlat.", descEn: "Tell us about your current situation and goals.", position: 0 },
      { titleTr: "Değerlendirme", titleEn: "Review", descTr: "Başvurunu inceliyoruz, seninle iletişime geçiyoruz.", descEn: "We review your application and get in touch.", position: 1 },
      { titleTr: "Programa başla", titleEn: "Start the program", descTr: "Uygunluk onaylanırsa programı başlatıyoruz.", descEn: "Once confirmed, we start the program together.", position: 2 },
    ],
    faqItems: [
      { questionTr: "Başvurum kaç günde değerlendirilir?", questionEn: "How long does the review take?", answerTr: "Başvurunu genellikle 2-3 iş günü içinde inceliyoruz.", answerEn: "We usually review applications within 2-3 business days.", position: 0 },
      { questionTr: "Her başvuru kabul ediliyor mu?", questionEn: "Is every application accepted?", answerTr: "Sınırlı kontenjan nedeniyle her dönemde sınırlı sayıda katılımcı alıyoruz.", answerEn: "Due to limited capacity, we accept a limited number of participants each period.", position: 1 },
    ],
  },
  {
    key: "consultation",
    headlineTr: "1:1 E-Ticaret Danışmanlığına Başvur",
    headlineEn: "Apply for 1:1 E-Commerce Consultation",
    subtitleTr: "İşine özel çözüm odaklı danışmanlık",
    subtitleEn: "Solution-focused consultation tailored to your business",
    motivationTr: "Belirli bir sorunun var ve çözümü için doğru yönlendirmeye ihtiyaç duyuyorsun. Birlikte sorununu analiz eder, net bir aksiyon planı çıkarırız.",
    motivationEn: "You have a specific problem and need the right guidance to solve it. Together we'll analyze the issue and build a clear action plan.",
    ctaLabelTr: "Başvuruyu Gönder",
    ctaLabelEn: "Submit Application",
    processSteps: [
      { titleTr: "Başvur", titleEn: "Apply", descTr: "Durumunu ve ihtiyacını kısaca anlat.", descEn: "Briefly describe your situation and need.", position: 0 },
      { titleTr: "Geri dönüş", titleEn: "Follow up", descTr: "Seninle iletişime geçip seans programlıyoruz.", descEn: "We'll contact you and schedule a session.", position: 1 },
    ],
    faqItems: [
      { questionTr: "Seans ne kadar sürüyor?", questionEn: "How long is the session?", answerTr: "Seans süresi hizmet içeriğine göre değişir. Başvuru sonrasında detay paylaşılır.", answerEn: "Session duration varies by service. Details are shared after application.", position: 0 },
    ],
  },
];

async function bootstrapApplicationProfiles() {
  console.log("\n🖼️  Başvuru Sayfa Profilleri");

  for (const profile of APP_PROFILES) {
    const existing = await prisma.applicationPageProfile.findUnique({ where: { key: profile.key } });
    if (existing) {
      logSkip(`ApplicationPageProfile key="${profile.key}"`);
      continue;
    }
    logCreate(`ApplicationPageProfile key="${profile.key}" (${profile.headlineTr})`);
    if (!DRY_RUN) {
      await prisma.applicationPageProfile.create({
        data: {
          key: profile.key,
          headlineTr: profile.headlineTr,
          headlineEn: profile.headlineEn,
          subtitleTr: profile.subtitleTr,
          subtitleEn: profile.subtitleEn,
          motivationTr: profile.motivationTr,
          motivationEn: profile.motivationEn,
          ctaLabelTr: profile.ctaLabelTr,
          ctaLabelEn: profile.ctaLabelEn,
          processSteps: { create: profile.processSteps },
          faqItems: {
            create: profile.faqItems.map((f) => ({
              questionTr: f.questionTr,
              questionEn: f.questionEn,
              answerTr: f.answerTr,
              answerEn: f.answerEn,
              position: f.position,
              enabled: true,
            })),
          },
        },
      });
    }
  }
}

// ── 5. Products ───────────────────────────────────────────────────────────────

// Products are created DRAFT with price=0 — admin must set real price before publishing.
// Existing products from prisma/seed.ts and scripts/seed-production.ts are skipped.

const PRODUCTS = [
  {
    slug: "ozel-eticaret-mentorlugu",
    type: "MENTORSHIP" as const,
    purchaseMode: "APPLICATION_REQUIRED_BEFORE_PURCHASE" as const,
    nameTr: "Özel E-Ticaret Mentörlüğü",
    nameEn: "Private E-Commerce Mentorship",
    shortDescTr: "Ferhat ile bire bir, kişiselleştirilmiş e-ticaret mentörlüğü.",
    shortDescEn: "One-on-one, personalized e-commerce mentorship with Ferhat.",
    templateKey: "mentorship",
    profileKey: "mentorship",
    inclusions: [
      { titleTr: "Bire bir görüşmeler", titleEn: "One-on-one sessions", type: "CONSULTATION" as const, position: 0 },
      { titleTr: "Kişisel yol haritası", titleEn: "Personal roadmap", type: "CUSTOM" as const, position: 1 },
      { titleTr: "WhatsApp desteği", titleEn: "WhatsApp support", type: "CUSTOM" as const, position: 2 },
    ],
  },
  {
    slug: "11-eticaret-danismanligi",
    type: "CONSULTATION" as const,
    purchaseMode: "APPLICATION_REQUIRED" as const,
    nameTr: "1:1 E-Ticaret Danışmanlığı",
    nameEn: "1:1 E-Commerce Consultation",
    shortDescTr: "E-ticaret işine özel, çözüm odaklı bire bir danışmanlık seansı.",
    shortDescEn: "Solution-focused one-on-one consultation tailored to your e-commerce business.",
    templateKey: "consultation",
    profileKey: "consultation",
    inclusions: [
      { titleTr: "Bire bir danışmanlık seansı", titleEn: "One-on-one consultation session", type: "CONSULTATION" as const, position: 0 },
      { titleTr: "Aksiyon planı", titleEn: "Action plan", type: "CUSTOM" as const, position: 1 },
    ],
  },
];

async function bootstrapProducts() {
  console.log("\n🛒 Ürünler");

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      select: { id: true, slug: true, formTemplateId: true, pageProfileId: true, status: true },
    });

    // Look up template and profile for connection
    const template = await prisma.applicationFormTemplate.findUnique({ where: { key: p.templateKey } });
    const profile  = await prisma.applicationPageProfile.findUnique({ where: { key: p.profileKey } });

    if (!existing) {
      // Price intentionally left at 0 — admin must set real price before publishing
      logCreate(
        `Product "${p.nameTr}" (DRAFT, price=0 — set real price before publishing) ` +
        `→ template=${p.templateKey}, profile=${p.profileKey}`
      );
      if (!DRY_RUN) {
        await prisma.product.create({
          data: {
            slug: p.slug,
            type: p.type,
            status: "DRAFT",
            purchaseMode: p.purchaseMode,
            price: 0,
            currency: "TRY",
            formTemplateId: template?.id ?? null,
            pageProfileId:  profile?.id ?? null,
            translations: {
              create: [
                { locale: "tr", name: p.nameTr, shortDescription: p.shortDescTr },
                { locale: "en", name: p.nameEn, shortDescription: p.shortDescEn },
              ],
            },
            inclusions: { create: p.inclusions },
          },
        });
      }
      continue;
    }

    // Product exists — only connect template/profile if currently unset
    const updates: Record<string, string | null> = {};
    const notes: string[] = [];

    if (!existing.formTemplateId && template) {
      updates.formTemplateId = template.id;
      notes.push(`template → ${p.templateKey}`);
    } else if (existing.formTemplateId) {
      logSkip(`Product "${p.slug}" formTemplate (already set)`);
    } else if (!template) {
      logConflict(`Product "${p.slug}" formTemplate: template "${p.templateKey}" not found — cannot connect`);
    }

    if (!existing.pageProfileId && profile) {
      updates.pageProfileId = profile.id;
      notes.push(`profile → ${p.profileKey}`);
    } else if (existing.pageProfileId) {
      logSkip(`Product "${p.slug}" pageProfile (already set)`);
    } else if (!profile) {
      logConflict(`Product "${p.slug}" pageProfile: profile "${p.profileKey}" not found — cannot connect`);
    }

    if (Object.keys(updates).length > 0) {
      logCreate(`Product "${p.slug}" connections: ${notes.join(", ")}`);
      if (!DRY_RUN) {
        await prisma.product.update({ where: { slug: p.slug }, data: updates });
      }
    } else {
      logSkip(`Product "${p.slug}" (already fully configured)`);
    }
  }
}

// ── 6. E2E Test Data Check ────────────────────────────────────────────────────

async function checkE2ETestData() {
  console.log("\n🔍 E2E Test Verisi Kontrolü");

  const testTemplates = await prisma.applicationFormTemplate.findMany({
    where: {
      OR: [
        { nameTr: { contains: "E2E Test" } },
        { nameTr: { contains: "Playwright" } },
        { key: { startsWith: "e2e_" } },
        { key: { contains: "test_" } },
      ],
    },
    include: {
      _count: { select: { applications: true, products: true } },
    },
  });

  if (testTemplates.length === 0) {
    log("✅", "No E2E test templates found in database");
    return;
  }

  log("⚠️ ", `Found ${testTemplates.length} possible E2E test template(s):`);
  for (const t of testTemplates) {
    console.log(
      `     - key="${t.key}", name="${t.nameTr}", ` +
      `applications=${t._count.applications}, products=${t._count.products}, ` +
      `archived=${t.archived}`
    );
    if (t._count.applications > 0 || t._count.products > 0) {
      logConflict(`Template "${t.key}" has live references — DO NOT delete without human review`);
    } else {
      log("📋", `Template "${t.key}" has no references — safe to archive/delete after human review`);
    }
  }
  console.log("\n  ⚠️  These records were NOT deleted. Review them manually in Admin → Form Templates.");
  console.log("  ⚠️  If E2E tests created these in production, check PLAYWRIGHT_BASE_URL and DATABASE_URL");
  console.log("       in your CI/CD environment — E2E tests must never target production.");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function verifyTargetDatabase() {
  // Safety check: confirm we're connecting to ferhatacademy, not another app's DB
  const url = process.env.DATABASE_URL ?? "";

  // We cannot read the hostname without exposing credentials.
  // Print a safe confirmation of what DB name is being targeted.
  const dbNameMatch = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbNameMatch?.[1] ?? "(could not parse)";

  console.log("\n🔐 Hedef veritabanı doğrulaması");
  console.log(`   DATABASE_URL → db name: ${dbName}`);

  if (!url.includes("ferhatacademy") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    console.error("\n❌ DATABASE_URL 'ferhatacademy' içermiyor.");
    console.error("   Yanlış veritabanına bağlanmış olabilirsiniz. Durduruluyor.");
    process.exit(1);
  }

  console.log("   ✅ Hedef ferhatacademy veritabanı gibi görünüyor — devam ediliyor.");
}

async function main() {
  console.log(DRY_RUN ? "\n🔎 KURU ÇALIŞMA (DRY RUN) — hiçbir şey yazılmıyor\n" : "\n🌱 Production bootstrap başlıyor...\n");

  await verifyTargetDatabase();

  await bootstrapTemplates();
  await bootstrapNavigation();
  await bootstrapCourses();
  await bootstrapApplicationProfiles();
  await bootstrapProducts();
  await checkE2ETestData();

  console.log("\n── ÖZET ─────────────────────────────────────────────────────────");
  console.log(`  OLUŞTURULDU : ${createCount}  |  ATLAND  : ${skipCount}  |  ÇATIŞMA : ${conflicts.length}`);
  if (conflicts.length > 0) {
    console.log("\n  Çatışmalar (insan kararı gerekli):");
    conflicts.forEach((c) => console.log(`    ⚠️  ${c}`));
  }
  if (DRY_RUN) {
    console.log("\n  ▶  Gerçekten çalıştırmak için --dry-run bayrağını kaldırın.");
  } else {
    console.log("\n  ✅ Bootstrap tamamlandı.");
    console.log("\n  📌 Sonraki adımlar:");
    console.log("     1. Admin → Ürünler → DRAFT ürünleri fiyat ve içerikle düzenle, yayınla");
    console.log("     2. Admin → Kurslar → DRAFT kursları düzenle, müfredat ekle, yayınla");
    console.log("     3. Admin → Ayarlar → IBAN / banka bilgilerini gerçek değerlerle gir");
    console.log("     4. Admin → Form Şablonları → E2E test şablonları varsa incele");
  }
  console.log("─────────────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
