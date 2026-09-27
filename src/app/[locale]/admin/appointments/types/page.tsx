import { listAppointmentTypes, toggleAppointmentTypeActive } from "../actions";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AppointmentTypesPage({ params }: Props) {
  const types = await listAppointmentTypes();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Görüşme Tipleri</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Randevu formunda kullanıcılara sunulan görüşme tiplerini yönetin.
        </p>
      </div>

      <div className="border border-border rounded-xl divide-y divide-border">
        {types.map((type) => (
          <div key={type.id} className="flex items-center gap-4 px-4 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">{type.nameTr}</span>
                {type.isFree && (
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                    Ücretsiz
                  </span>
                )}
                {!type.active && (
                  <span className="text-xs bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded-full">
                    Pasif
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{type.descTr ?? type.nameEn}</p>
              {type.durationMinutes && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" /> {type.durationMinutes} dakika
                </span>
              )}
            </div>
            <form action={async () => {
              "use server";
              await toggleAppointmentTypeActive(type.id, !type.active);
            }}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {type.active
                  ? <><XCircle className="h-3.5 w-3.5" /> Pasif Yap</>
                  : <><CheckCircle2 className="h-3.5 w-3.5" /> Aktif Yap</>
                }
              </button>
            </form>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Yeni görüşme tipi eklemek için geliştirici desteği gereklidir. Mevcut tipleri pasif yaparak formdan kaldırabilirsiniz.
      </p>
    </div>
  );
}
