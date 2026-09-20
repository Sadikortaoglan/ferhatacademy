import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export default async function LiveSessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <PageHeader title={t("liveSessions")} />
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{t("noLiveSessions")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
