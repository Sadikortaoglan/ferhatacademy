import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function createOrSkip(
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

  await auth.api.signUpEmail({
    body: { email, password, name },
    asResponse: false,
  });

  const user = await prisma.user.update({
    where: { email },
    data: { role },
  });
  console.log(`  ✅ Created ${role}: ${email}`);
  return user;
}

async function main() {
  console.log("🌱 Seeding database...");

  const superAdminEmail =
    process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@ferhatacademy.com";
  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ferhatacademy.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const userEmail = process.env.SEED_USER_EMAIL ?? "user@ferhatacademy.com";
  const userPassword = process.env.SEED_USER_PASSWORD ?? "User123!";

  await createOrSkip(superAdminEmail, superAdminPassword, "Super Admin", "SUPER_ADMIN");
  await createOrSkip(adminEmail, adminPassword, "Admin User", "ADMIN");
  const testUser = await createOrSkip(userEmail, userPassword, "Test User", "USER");

  const defaultSettings = [
    { key: "academyName", value: "Ferhat Academy" },
    { key: "supportEmail", value: "support@ferhatacademy.com" },
    { key: "defaultLocale", value: "tr" },
    { key: "timezone", value: "Europe/Istanbul" },
    { key: "logoUrl", value: "" },
    { key: "bankName", value: "Ziraat Bankası" },
    { key: "iban", value: "TR00 0000 0000 0000 0000 0000 00" },
    { key: "accountHolder", value: "Ferhat Academy" },
    { key: "paymentInstructions", value: "Havale açıklamasına sipariş referans numaranızı (FA-XXXX-XXXXXX) yazmayı unutmayın." },
    { key: "instagramUrl", value: "" },
    { key: "youtubeUrl", value: "" },
    { key: "linkedinUrl", value: "" },
    { key: "twitterUrl", value: "" },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("  ✅ Site settings seeded");

  // Demo course: Meta Reklamcılık Temelleri
  const existingCourse = await prisma.course.findUnique({
    where: { slug: "meta-reklamcilik-temelleri" },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        slug: "meta-reklamcilik-temelleri",
        status: "PUBLISHED",
        coverImageUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07d?w=800",
        translations: {
          create: [
            {
              locale: "tr",
              title: "Meta Reklamcılık Temelleri",
              shortDescription: "Facebook ve Instagram reklamcılığına kapsamlı giriş kursu.",
              description:
                "Bu kurs, Meta reklam platformunu sıfırdan öğrenmek isteyen pazarlamacılar için tasarlanmıştır. Kampanya yapısı, hedefleme ve optimizasyon tekniklerini öğrenin.",
            },
            {
              locale: "en",
              title: "Meta Advertising Fundamentals",
              shortDescription: "Comprehensive introduction to Facebook and Instagram advertising.",
              description:
                "This course is designed for marketers who want to learn the Meta advertising platform from scratch. Learn campaign structure, targeting and optimization techniques.",
            },
          ],
        },
      },
    });

    // Module 1: Temeller
    const module1 = await prisma.module.create({
      data: {
        courseId: course.id,
        position: 1,
        translations: {
          create: [
            { locale: "tr", title: "Temeller ve Hesap Kurulumu" },
            { locale: "en", title: "Fundamentals & Account Setup" },
          ],
        },
      },
    });

    // Lesson 1 – Public preview
    await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        position: 1,
        type: "VIDEO",
        visibility: "PUBLIC",
        isPreview: true,
        videoProvider: "YOUTUBE",
        videoExternalId: "dQw4w9WgXcQ",
        translations: {
          create: [
            { locale: "tr", title: "Meta Reklam Platformuna Giriş" },
            { locale: "en", title: "Introduction to Meta Ads Platform" },
          ],
        },
      },
    });

    // Lesson 2 – Public preview
    await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        position: 2,
        type: "VIDEO",
        visibility: "PUBLIC",
        isPreview: true,
        videoProvider: "YOUTUBE",
        videoExternalId: "dQw4w9WgXcQ",
        translations: {
          create: [
            { locale: "tr", title: "Business Manager Kurulumu" },
            { locale: "en", title: "Business Manager Setup" },
          ],
        },
      },
    });

    // Module 2: Kampanya Yapısı
    const module2 = await prisma.module.create({
      data: {
        courseId: course.id,
        position: 2,
        translations: {
          create: [
            { locale: "tr", title: "Kampanya Yapısı ve Hedefleme" },
            { locale: "en", title: "Campaign Structure & Targeting" },
          ],
        },
      },
    });

    // Lesson 3 – Entitled
    const lesson3 = await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        position: 1,
        type: "VIDEO",
        visibility: "ENTITLED",
        isPreview: false,
        videoProvider: "YOUTUBE",
        videoExternalId: "dQw4w9WgXcQ",
        translations: {
          create: [
            { locale: "tr", title: "Kampanya, Reklam Seti ve Reklam Yapısı" },
            { locale: "en", title: "Campaign, Ad Set and Ad Structure" },
          ],
        },
      },
    });

    // Lesson 4 – Entitled
    await prisma.lesson.create({
      data: {
        moduleId: module2.id,
        position: 2,
        type: "VIDEO",
        visibility: "ENTITLED",
        isPreview: false,
        videoProvider: "YOUTUBE",
        videoExternalId: "dQw4w9WgXcQ",
        translations: {
          create: [
            { locale: "tr", title: "Kitle Hedefleme Teknikleri" },
            { locale: "en", title: "Audience Targeting Techniques" },
          ],
        },
      },
    });

    console.log("  ✅ Demo course seeded: Meta Reklamcılık Temelleri");

    // Draft course
    await prisma.course.create({
      data: {
        slug: "google-ads-masterclass",
        status: "DRAFT",
        translations: {
          create: [
            {
              locale: "tr",
              title: "Google Ads Masterclass",
              shortDescription: "Google Arama ve Display reklamcılığında uzmanlaşın.",
            },
            {
              locale: "en",
              title: "Google Ads Masterclass",
              shortDescription: "Master Google Search and Display advertising.",
            },
          ],
        },
      },
    });
    console.log("  ✅ Draft course seeded: Google Ads Masterclass");

    // Entitlement for test user
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (admin) {
      await prisma.entitlement.create({
        data: {
          userId: testUser.id,
          resourceType: "COURSE",
          resourceId: course.id,
          sourceType: "MANUAL",
          createdById: admin.id,
        },
      });
      console.log("  ✅ Entitlement seeded for test user");

      // Assignment for test user with a lesson item
      const assignment = await prisma.assignment.create({
        data: {
          userId: testUser.id,
          title: "Haftalık Ödev - Meta Temelleri",
          description: "İlk iki modülü tamamlayın ve kampanya yapısını öğrenin.",
          createdById: admin.id,
        },
      });

      await prisma.assignmentItem.create({
        data: {
          assignmentId: assignment.id,
          position: 1,
          type: "LESSON",
          lessonId: lesson3.id,
          isRequired: true,
        },
      });

      await prisma.assignmentItem.create({
        data: {
          assignmentId: assignment.id,
          position: 2,
          type: "TASK",
          title: "İlk kampanyanızı oluşturun",
          instructions: "Business Manager'da bir test kampanyası oluşturun ve ekran görüntüsü paylaşın.",
          isRequired: false,
        },
      });

      console.log("  ✅ Assignment seeded for test user");
    }
  } else {
    console.log("  ⏭  Demo courses already exist");
  }

  // Commerce seed
  const existingProduct = await prisma.product.findUnique({ where: { slug: "meta-ads-masterclass-urun" } });
  if (!existingProduct) {
    const publishedCourse = await prisma.course.findUnique({ where: { slug: "meta-reklamcilik-temelleri" } });

    // 1. Paid course product
    const paidProduct = await prisma.product.create({
      data: {
        slug: "meta-ads-masterclass-urun",
        type: "COURSE",
        status: "PUBLISHED",
        purchaseMode: "DIRECT_PURCHASE",
        price: 249900,
        currency: "TRY",
        publishedAt: new Date(),
        linkedCourseId: publishedCourse?.id ?? null,
        translations: {
          create: [
            {
              locale: "tr",
              name: "Meta Ads Masterclass",
              shortDescription: "Meta reklam platformunu sıfırdan ileri seviyeye öğrenin.",
              description: "Bu kapsamlı program, Meta reklam ekosistemini derinlemesine anlamanızı sağlar. Kampanya yapısı, hedefleme stratejileri, kreatif optimizasyon ve reklam harcamalarını maximize etme tekniklerini öğrenin.",
            },
            {
              locale: "en",
              name: "Meta Ads Masterclass",
              shortDescription: "Learn Meta advertising from beginner to advanced level.",
            },
          ],
        },
        inclusions: {
          create: [
            { titleTr: "Tüm video derslere ömür boyu erişim", titleEn: "Lifetime access to all video lessons", type: "VIDEO", position: 0 },
            { titleTr: "Canlı Q&A seanslarına katılım", titleEn: "Access to live Q&A sessions", type: "LIVE_SESSION", quantity: 2, position: 1 },
            { titleTr: "İndirilebilir kaynaklar ve şablonlar", titleEn: "Downloadable resources and templates", type: "DOWNLOAD", position: 2 },
          ],
        },
      },
    });

    // Link product grant to published course
    if (publishedCourse) {
      await prisma.productGrant.create({
        data: { productId: paidProduct.id, grantType: "COURSE_ACCESS", resourceId: publishedCourse.id },
      });
    }
    console.log("  ✅ Paid course product seeded");

    // 2. Application-required mentorship
    await prisma.product.create({
      data: {
        slug: "ozel-eticaret-mentorlugu",
        type: "MENTORSHIP",
        status: "PUBLISHED",
        purchaseMode: "APPLICATION_REQUIRED_BEFORE_PURCHASE",
        price: 999900,
        currency: "TRY",
        publishedAt: new Date(),
        translations: {
          create: [
            {
              locale: "tr",
              name: "Özel E-ticaret Mentörlüğü",
              shortDescription: "Ferhat ile bire bir 8 haftalık yoğun e-ticaret mentörlüğü programı.",
            },
          ],
        },
        inclusions: {
          create: [
            { titleTr: "8 haftalık bire bir görüşme", type: "CONSULTATION", quantity: 8, durationMinutes: 60, position: 0 },
            { titleTr: "WhatsApp üzerinden anlık destek", type: "CUSTOM", position: 1 },
            { titleTr: "Kişisel iş planı hazırlama", type: "CUSTOM", position: 2 },
          ],
        },
      },
    });
    console.log("  ✅ Mentorship product seeded");

    // 3. Free product
    await prisma.product.create({
      data: {
        slug: "ucretsiz-baslangic",
        type: "COURSE",
        status: "PUBLISHED",
        purchaseMode: "DIRECT_PURCHASE",
        price: 0,
        currency: "TRY",
        publishedAt: new Date(),
        translations: {
          create: [
            {
              locale: "tr",
              name: "Dijital Pazarlamaya Ücretsiz Giriş",
              shortDescription: "Dijital pazarlama dünyasına adım atmanız için ücretsiz başlangıç dersleri.",
            },
          ],
        },
      },
    });
    console.log("  ✅ Free product seeded");

    // 4. Pending bank transfer order for test user (using paid product)
    const testUserRecord = await prisma.user.findUnique({ where: { email: userEmail } });
    if (testUserRecord) {
      const order = await prisma.order.create({
        data: {
          reference: `FA-${new Date().getFullYear()}-DEMO01`,
          userId: testUserRecord.id,
          status: "PENDING_PAYMENT",
          totalAmount: paidProduct.price,
          currency: paidProduct.currency,
          items: {
            create: [{
              productId: paidProduct.id,
              productNameSnapshot: "Meta Ads Masterclass",
              productTypeSnapshot: "COURSE",
              unitPrice: paidProduct.price,
              quantity: 1,
              currency: paidProduct.currency,
            }],
          },
        },
      });
      console.log("  ✅ Demo pending order seeded for test user:", order.reference);

      // 5. Submitted application for test user (mentorship)
      const mentorshipProduct = await prisma.product.findUnique({ where: { slug: "ozel-eticaret-mentorlugu" } });
      if (mentorshipProduct) {
        await prisma.application.upsert({
          where: { userId_productId: { userId: testUserRecord.id, productId: mentorshipProduct.id } },
          update: {},
          create: {
            userId: testUserRecord.id,
            productId: mentorshipProduct.id,
            status: "SUBMITTED",
            goal: "E-ticaret işimi büyütmek ve aylık 100.000 TL ciro hedefime ulaşmak istiyorum.",
            whyInterested: "Ferhat'ın deneyiminden ve pratik bilgisinden faydalanmak istiyorum.",
          },
        });
        console.log("  ✅ Demo application seeded for test user");
      }
    }
  } else {
    console.log("  ⏭  Commerce products already exist");
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
