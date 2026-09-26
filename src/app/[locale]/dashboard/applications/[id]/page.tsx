import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  PENDING: { tr: "Beklemede", en: "Pending", color: "bg-warning/10 text-warning" },
  UNDER_REVIEW: { tr: "İnceleniyor", en: "Under Review", color: "bg-primary/10 text-primary" },
  APPROVED: { tr: "Onaylandı", en: "Approved", color: "bg-success/10 text-success" },
  REJECTED: { tr: "Reddedildi", en: "Rejected", color: "bg-danger/10 text-danger" },
  CANCELLED: { tr: "İptal Edildi", en: "Cancelled", color: "bg-muted text-muted-foreground" },
  WAITLISTED: { tr: "Bekleme Listesi", en: "Waitlisted", color: "bg-muted text-muted-foreground" },
};

const SECTION_LABELS: Record<string, { tr: string; en: string }> = {
  BASIC_INFO: { tr: "Temel Bilgiler", en: "Basic Info" },
  CURRENT_SITUATION: { tr: "Mevcut Durum", en: "Current Situation" },
  GOALS: { tr: "Hedefler", en: "Goals" },
  CHALLENGES: { tr: "Zorluklar", en: "Challenges" },
  PROGRAM_FIT: { tr: "Program Uyumu", en: "Program Fit" },
  AVAILABILITY: { tr: "Uygunluk", en: "Availability" },
  ADDITIONAL_INFO: { tr: "Ek Bilgiler", en: "Additional Info" },
};

export default async function MemberApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);

  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    include: {
      product: { include: { translations: true } },
      response: true,
    },
  });
  if (!application) notFound();

  const isTr = locale === "tr";
  const translation =
    application.product.translations.find((t) => t.locale === locale) ??
    application.product.translations[0];
  const productName = (translation as { name?: string } | undefined)?.name ?? application.product.slug;
  const statusInfo = STATUS_LABELS[application.status] ?? {
    tr: application.status,
    en: application.status,
    color: "bg-muted text-muted-foreground",
  };

  const snapshot = application.response?.snapshotJson as
    | { key: string; labelTr: string; labelEn: string; type: string; section: string; answer: unknown; optionLabels?: unknown }[]
    | null;

  const groupedAnswers = snapshot
    ? snapshot.reduce((acc: Record<string, typeof snapshot>, item) => {
        const sec = item.section ?? "ADDITIONAL_INFO";
        if (!acc[sec]) acc[sec] = [];
        acc[sec].push(item);
        return acc;
      }, {})
    : null;

  function formatAnswer(item: { type: string; answer: unknown; optionLabels?: unknown }): string {
    const { type, answer, optionLabels } = item;
    if (answer === null || answer === undefined || answer === "") return "—";
    if (["SINGLE_SELECT", "RADIO"].includes(type) && optionLabels) {
      const ol = optionLabels as { tr?: string; en?: string };
      return (isTr ? ol.tr : ol.en) ?? String(answer);
    }
    if (["MULTI_SELECT", "CHECKBOX"].includes(type) && Array.isArray(answer)) {
      if (Array.isArray(optionLabels)) {
        return (optionLabels as { tr?: string; en?: string }[])
          .map((ol) => (isTr ? ol.tr : ol.en) ?? "")
          .filter(Boolean)
          .join(", ");
      }
      return (answer as string[]).join(", ");
    }
    return String(answer);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={`/${locale}/dashboard/applications`} className="hover:text-foreground">
          {isTr ? "Başvurularım" : "My Applications"}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{productName}</span>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-foreground">{productName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(application.createdAt).toLocaleDateString(isTr ? "tr-TR" : "en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${statusInfo.color}`}>
            {isTr ? statusInfo.tr : statusInfo.en}
          </span>
        </div>

        {application.status === "SUBMITTED" && (
          <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2.5 text-xs text-warning font-medium">
            {isTr
              ? "Başvurunuz değerlendirme sürecine alınmayı bekliyor."
              : "Your application is waiting to be reviewed."}
          </div>
        )}
        {application.status === "UNDER_REVIEW" && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5 text-xs text-primary font-medium">
            {isTr
              ? "Başvurunuz şu an inceleniyor. En kısa sürede size dönülecektir."
              : "Your application is currently being reviewed. You'll hear back soon."}
          </div>
        )}
        {application.status === "APPROVED" && (
          <div className="rounded-lg bg-success/10 border border-success/20 px-3 py-2.5 text-xs text-success font-medium">
            {isTr ? "Tebrikler! Başvurunuz onaylandı." : "Congratulations! Your application has been approved."}
          </div>
        )}
        {application.status === "REJECTED" && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5 text-xs text-danger font-medium">
            {isTr
              ? "Başvurunuz bu sefer kabul edilemedi. Başka programlarımıza göz atabilirsiniz."
              : "Your application was not accepted this time. Feel free to explore our other programs."}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Link href={`/${locale}/products/${application.product.slug}`} className="text-xs text-primary hover:underline">
            {isTr ? "Programa Git →" : "View Program →"}
          </Link>
        </div>
      </div>

      {groupedAnswers && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {isTr ? "Başvuru Cevaplarınız" : "Your Application Answers"}
          </h2>
          {Object.entries(groupedAnswers).map(([section, items]) => {
            const sectionLabel = SECTION_LABELS[section];
            return (
              <div key={section} className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted px-4 py-2.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isTr ? sectionLabel?.tr ?? section : sectionLabel?.en ?? section}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.key} className="px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {isTr ? item.labelTr : item.labelEn}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{formatAnswer(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!groupedAnswers && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">
            {isTr ? "Başvuru detayları mevcut değil." : "Application details not available."}
          </p>
        </div>
      )}
    </div>
  );
}
