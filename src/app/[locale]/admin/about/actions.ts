"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { isAllowedImageUrl } from "@/lib/url-validation";

async function upsert(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function saveAboutHero(data: {
  heroTitle: string;
  heroBio: string;
  heroImageUrl: string;
  badge: string;
}) {
  await requireAdmin("tr");
  if (data.heroImageUrl && !isAllowedImageUrl(data.heroImageUrl)) {
    throw new Error("Geçersiz görsel URL.");
  }
  await upsert("about.heroTitle", data.heroTitle);
  await upsert("about.heroBio", data.heroBio);
  await upsert("about.heroImageUrl", data.heroImageUrl);
  await upsert("about.badge", data.badge);
  revalidatePath("/", "layout");
}

export async function saveAboutStats(stats: { value: string; label: string }[]) {
  await requireAdmin("tr");
  await upsert("about.stats", JSON.stringify(stats));
  revalidatePath("/", "layout");
}

export async function saveAboutTimeline(timeline: { year: string; title: string; desc: string; color: string }[]) {
  await requireAdmin("tr");
  await upsert("about.timeline", JSON.stringify(timeline));
  revalidatePath("/", "layout");
}

export async function saveAboutExpertise(expertise: { icon: string; title: string; desc: string }[]) {
  await requireAdmin("tr");
  await upsert("about.expertise", JSON.stringify(expertise));
  revalidatePath("/", "layout");
}

export async function saveAboutGallery(images: { url: string; alt: string }[]) {
  await requireAdmin("tr");
  for (const img of images) {
    if (img.url && !isAllowedImageUrl(img.url)) {
      throw new Error("Geçersiz görsel URL.");
    }
  }
  await upsert("about.gallery", JSON.stringify(images));
  revalidatePath("/", "layout");
}
