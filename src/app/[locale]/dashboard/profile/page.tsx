import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/features/dashboard/components/profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      city: true,
      bio: true,
      birthDate: true,
      whyHere: true,
      createdAt: true,
    },
  });
  if (!user) redirect(`/${locale}/login`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Profilim</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hesap bilgilerini buradan güncelleyebilirsin.
        </p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
