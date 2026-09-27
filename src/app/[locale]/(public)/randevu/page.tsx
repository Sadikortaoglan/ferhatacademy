import { getActiveAppointmentTypes } from "@/features/appointments/actions";
import { AppointmentCTA } from "@/features/appointments/components/appointment-cta";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RandevuPage({ params }: Props) {
  const { locale } = await params;
  const isTr = locale === "tr";
  const types = await getActiveAppointmentTypes();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Glow bg */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="w-full max-w-lg text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          {isTr ? "Ücretsiz · 15 dakika" : "Free · 15 minutes"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
          {isTr ? "Hızlı Randevu Al" : "Book a Quick Call"}
        </h1>
        <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
          {isTr
            ? "Hedeflerini anlat, sana en uygun yolu birlikte bulalım. Hiçbir taahhüt gerektirmez."
            : "Tell us your goals, let's find the right path together. No commitment required."}
        </p>
      </div>

      {types.length > 0 ? (
        <div className="w-full max-w-lg">
          {/* Inline form — open modal immediately */}
          <AppointmentCTA
            types={types}
            locale={locale}
            sourcePage="randevu-page"
            variant="primary"
            label={isTr ? "Randevu Formunu Aç" : "Open Booking Form"}
            className="w-full text-base py-4"
            autoOpen
          />

          {/* Type cards */}
          {types.length > 1 && (
            <div className="mt-8 grid gap-3">
              {types.map((type) => (
                <div key={type.id} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {isTr ? type.nameTr : type.nameEn}
                      </span>
                      {type.isFree && (
                        <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full">
                          {isTr ? "Ücretsiz" : "Free"}
                        </span>
                      )}
                    </div>
                    {(isTr ? type.descTr : type.descEn) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isTr ? type.descTr : type.descEn}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {isTr ? "Şu an aktif randevu tipi bulunmuyor." : "No active appointment types available."}
        </p>
      )}
    </div>
  );
}
