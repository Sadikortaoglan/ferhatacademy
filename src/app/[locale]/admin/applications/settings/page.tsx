import { getNotificationSettings } from "./actions";
import { NotificationSettingsForm } from "./settings-form";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ApplicationSettingsPage({ params }: Props) {
  const { locale } = await params;
  const settings = await getNotificationSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Başvuru Bildirimleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hangi olaylarda e-posta gönderileceğini ve bildirim zili gösterileceğini yönetin.
        </p>
      </div>
      <NotificationSettingsForm locale={locale} initialSettings={settings} />
    </div>
  );
}
