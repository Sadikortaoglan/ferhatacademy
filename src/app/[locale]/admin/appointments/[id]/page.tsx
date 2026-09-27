import { getAppointmentDetail, updateAppointmentStatus } from "../actions";
import { notFound } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Globe, Phone, Mail, FileText, Tag } from "lucide-react";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; cls: string }> = {
  PENDING:   { label: "Bekliyor",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CONFIRMED: { label: "Onaylandı", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  REJECTED:  { label: "Reddedildi", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETED: { label: "Tamamlandı", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  CANCELLED: { label: "İptal",      cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { to: AppointmentStatus; label: string; cls: string }[]>> = {
  PENDING:   [
    { to: "CONFIRMED", label: "Onayla",  cls: "bg-green-600 hover:bg-green-700 text-white" },
    { to: "REJECTED",  label: "Reddet",  cls: "bg-red-600 hover:bg-red-700 text-white" },
  ],
  CONFIRMED: [
    { to: "COMPLETED", label: "Tamamlandı olarak işaretle", cls: "bg-blue-600 hover:bg-blue-700 text-white" },
    { to: "CANCELLED", label: "İptal Et", cls: "bg-zinc-600 hover:bg-zinc-700 text-white" },
  ],
};

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const appt = await getAppointmentDetail(id);
  if (!appt) notFound();

  const st = STATUS_CONFIG[appt.status];
  const actions = NEXT_ACTIONS[appt.status] ?? [];

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/admin/appointments`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Randevu Detayı</h1>
        <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {/* Main info */}
      <div className="border border-border rounded-xl divide-y divide-border">
        {[
          { icon: Mail,  label: "E-posta",       value: appt.email },
          { icon: Phone, label: "Telefon",        value: appt.phone ?? "—" },
          { icon: Tag,   label: "Görüşme Tipi",   value: appt.type.nameTr },
          {
            icon: Calendar,
            label: "Tercih Tarih",
            value: appt.preferredDate
              ? new Date(appt.preferredDate).toLocaleDateString("tr-TR")
              : "—",
          },
          { icon: Clock,  label: "Saat Aralığı", value: appt.preferredTimeRange ?? "—" },
          { icon: Globe,  label: "Kaynak Sayfa",  value: appt.sourcePage ?? "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-4 py-3">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
            <span className="text-sm text-foreground">{value}</span>
          </div>
        ))}
        {appt.note && (
          <div className="flex items-start gap-4 px-4 py-3">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground w-36 shrink-0">Not</span>
            <span className="text-sm text-foreground whitespace-pre-wrap">{appt.note}</span>
          </div>
        )}
      </div>

      {/* UTM / source */}
      {(appt.utmSource || appt.utmMedium || appt.utmCampaign) && (
        <div className="border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kaynak Bilgileri</h3>
          <div className="flex flex-wrap gap-2">
            {appt.utmSource   && <span className="text-xs bg-muted px-2 py-1 rounded">source: {appt.utmSource}</span>}
            {appt.utmMedium   && <span className="text-xs bg-muted px-2 py-1 rounded">medium: {appt.utmMedium}</span>}
            {appt.utmCampaign && <span className="text-xs bg-muted px-2 py-1 rounded">campaign: {appt.utmCampaign}</span>}
          </div>
        </div>
      )}

      {/* Admin note */}
      {appt.adminNote && (
        <div className="border border-border rounded-xl p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Admin Notu</h3>
          <p className="text-sm text-foreground">{appt.adminNote}</p>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <form key={action.to} action={async () => {
              "use server";
              await updateAppointmentStatus(id, action.to);
            }}>
              <button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.cls}`}>
                {action.label}
              </button>
            </form>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Oluşturulma: {new Date(appt.createdAt).toLocaleString("tr-TR")} ·
        Güncelleme: {new Date(appt.updatedAt).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}
