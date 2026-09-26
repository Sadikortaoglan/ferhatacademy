import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileEditor } from "./profile-editor";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ locale: string; profileId: string }>;
}) {
  const { locale, profileId } = await params;
  await requireAdmin(locale);

  const profile = await prisma.applicationPageProfile.findUnique({
    where: { id: profileId },
    include: {
      faqItems: { orderBy: { position: "asc" } },
      processSteps: { orderBy: { position: "asc" } },
      products: { include: { translations: true }, take: 10 },
    },
  });
  if (!profile) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/applications/profiles`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Profiller
        </Link>
        <h1 className="text-xl font-black text-foreground">{profile.headlineTr}</h1>
      </div>
      <ProfileEditor locale={locale} profile={profile} />
    </div>
  );
}
