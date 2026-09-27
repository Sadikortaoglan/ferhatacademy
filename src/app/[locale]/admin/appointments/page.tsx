import { listAppointments } from "./actions";
import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";
import { Calendar, Clock, User, Mail, Phone } from "lucide-react";

const STATUS_LABELS: Record<AppointmentStatus, { label: string; cls: string }> = {
  PENDING:   { label: "Bekliyor",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CONFIRMED: { label: "Onaylandı", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  REJECTED:  { label: "Reddedildi", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETED: { label: "Tamamlandı", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  CANCELLED: { label: "İptal",      cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

export default async function AppointmentsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const status = (sp.status as AppointmentStatus | "ALL") ?? "ALL";

  const { items, total, perPage } = await listAppointments({
    page,
    status: status === "ALL" ? undefined : status,
    search: sp.search,
  });

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Randevu Talepleri</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} toplam kayıt</p>
        </div>
        <Link href={`/${locale}/admin/appointments/types`} className="text-sm text-primary hover:underline">
          Görüşme Tipleri →
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="İsim, e-posta veya telefon..."
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground w-64"
        />
        <select name="status" defaultValue={status} className="border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground">
          <option value="ALL">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Filtrele</button>
      </form>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Kişi</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">İletişim</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Görüşme Tipi</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden lg:table-cell">Tercih Tarih</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Durum</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Tarih</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Kayıt bulunamadı</td></tr>
            )}
            {items.map((item) => {
              const st = STATUS_LABELS[item.status];
              return (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{item.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>
                      {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{item.type.nameTr}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {item.preferredDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.preferredDate).toLocaleDateString("tr-TR")}
                        {item.preferredTimeRange && <><Clock className="h-3 w-3 ml-1" />{item.preferredTimeRange}</>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/admin/appointments/${item.id}`} className="text-primary hover:underline text-xs">
                      Detay →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={`?page=${page - 1}&status=${status}${sp.search ? `&search=${sp.search}` : ""}`}
              className="border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors">
              ← Önceki
            </Link>
          )}
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?page=${page + 1}&status=${status}${sp.search ? `&search=${sp.search}` : ""}`}
              className="border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors">
              Sonraki →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
