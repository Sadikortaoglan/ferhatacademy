"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
  avatar: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  whyHere: z.string().optional().or(z.literal("")),
});

export async function updateProfile(data: {
  name: string;
  phone?: string;
  avatar?: string;
  city?: string;
  bio?: string;
  birthDate?: string;
  whyHere?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = profileSchema.parse(data);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.name,
      phone: parsed.phone || null,
      city: parsed.city || null,
      bio: parsed.bio || null,
      whyHere: parsed.whyHere || null,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : null,
      ...(parsed.avatar ? { image: parsed.avatar } : {}),
    },
  });
  revalidatePath("/[locale]/dashboard/profile", "page");
}
