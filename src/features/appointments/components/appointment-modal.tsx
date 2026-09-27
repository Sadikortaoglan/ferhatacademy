"use client";

import { useState, useTransition } from "react";
import { X, Calendar, Clock, CheckCircle2, Phone, Mail, MessageSquare, Loader2 } from "lucide-react";
import { createAppointmentRequest, type CreateAppointmentInput } from "../actions";
import { validatePhone, validateEmail } from "@/lib/validators";

type AppointmentType = { id: string; nameTr: string; nameEn: string; descTr?: string | null; descEn?: string | null; isFree: boolean };

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  types: AppointmentType[];
  locale?: string;
  sourcePage?: string;
  productId?: string;
  preselectedTypeId?: string;
}

const TIME_RANGES = [
  { value: "09:00-11:00", labelTr: "09:00 – 11:00", labelEn: "09:00 – 11:00" },
  { value: "11:00-13:00", labelTr: "11:00 – 13:00", labelEn: "11:00 – 13:00" },
  { value: "14:00-16:00", labelTr: "14:00 – 16:00", labelEn: "14:00 – 16:00" },
  { value: "16:00-18:00", labelTr: "16:00 – 18:00", labelEn: "16:00 – 18:00" },
  { value: "esnek",       labelTr: "Esnek",          labelEn: "Flexible" },
];

export function AppointmentModal({
  open,
  onClose,
  types,
  locale = "tr",
  sourcePage,
  productId,
  preselectedTypeId,
}: AppointmentModalProps) {
  const isTr = locale === "tr";
  const [step, setStep] = useState<"form" | "success">("form");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    typeId: preselectedTypeId ?? types[0]?.id ?? "",
    preferredDate: "",
    preferredTimeRange: "",
    note: "",
  });

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = isTr ? "Ad soyad zorunlu" : "Full name required";

    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) errs.email = isTr ? "Geçerli bir e-posta adresi girin." : "Please enter a valid email address.";

    const phoneResult = validatePhone(form.phone);
    if (!phoneResult.valid) errs.phone = isTr ? "Geçerli bir telefon numarası girin." : "Please enter a valid phone number.";

    if (!form.typeId) errs.typeId = isTr ? "Görüşme tipi seçin" : "Select a meeting type";
    return errs;
  }

  function submit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const input: CreateAppointmentInput = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      typeId: form.typeId,
      preferredDate: form.preferredDate || undefined,
      preferredTimeRange: form.preferredTimeRange || undefined,
      note: form.note || undefined,
      sourcePage,
      productId,
      locale,
    };

    startTransition(async () => {
      const res = await createAppointmentRequest(input);
      if (res.ok) setStep("success");
      else setErrors({ _: res.error });
    });
  }

  const selectedType = types.find((t) => t.id === form.typeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isTr ? "Ücretsiz Ön Görüşme" : "Free Discovery Call"}
            </h2>
            <p className="text-sm text-white/50 mt-0.5">
              {isTr ? "Birkaç bilgi bırak, sana dönüş yapalım." : "Leave a few details and we'll get back to you."}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "success" ? (
          <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {isTr ? "Talebiniz Alındı" : "Request Received"}
              </h3>
              <p className="text-white/50 text-sm mt-1 max-w-xs">
                {isTr
                  ? "En kısa sürede sizinle iletişime geçeceğiz. E-posta adresinize bir onay gönderdik."
                  : "We'll be in touch shortly. A confirmation has been sent to your email."}
              </p>
            </div>
            <button onClick={onClose} className="mt-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">
              {isTr ? "Kapat" : "Close"}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-4">
            {/* Trust signals */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Clock, text: isTr ? "15 dk · Ücretsiz" : "15 min · Free" },
                { icon: Phone, text: isTr ? "Telefon / Video" : "Phone / Video" },
                { icon: Mail,  text: isTr ? "Hızlı dönüş"    : "Quick response" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full">
                  <Icon className="h-3 w-3" /> {text}
                </span>
              ))}
            </div>

            {/* Meeting type */}
            {types.length > 1 && (
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{isTr ? "Görüşme Tipi" : "Meeting Type"}</label>
                <select
                  value={form.typeId}
                  onChange={set("typeId")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isTr ? t.nameTr : t.nameEn}
                    </option>
                  ))}
                </select>
                {selectedType && (isTr ? selectedType.descTr : selectedType.descEn) && (
                  <p className="text-xs text-white/30 mt-1">
                    {isTr ? selectedType.descTr : selectedType.descEn}
                  </p>
                )}
              </div>
            )}

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{isTr ? "Ad Soyad *" : "Full Name *"}</label>
                <input
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder={isTr ? "Adınız Soyadınız" : "Your Name"}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
                />
                {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{isTr ? "E-posta *" : "Email *"}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="ornek@mail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{isTr ? "Telefon *" : "Phone *"}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+90 5XX XXX XX XX"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50"
              />
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {isTr ? "Tercih Edilen Tarih" : "Preferred Date"}
                </label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={set("preferredDate")}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {isTr ? "Saat Aralığı" : "Time Range"}
                </label>
                <select
                  value={form.preferredTimeRange}
                  onChange={set("preferredTimeRange")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">{isTr ? "Seçin" : "Select"}</option>
                  {TIME_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {isTr ? r.labelTr : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                <MessageSquare className="inline h-3 w-3 mr-1" />
                {isTr ? "Ne hakkında konuşmak istiyorsunuz? (İsteğe bağlı)" : "What would you like to discuss? (Optional)"}
              </label>
              <textarea
                value={form.note}
                onChange={set("note")}
                rows={3}
                placeholder={isTr ? "Kısa bir not bırakın..." : "Leave a short note..."}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 resize-none"
              />
            </div>

            {errors._ && <p className="text-xs text-red-400">{errors._}</p>}

            {/* Submit */}
            <button
              onClick={submit}
              disabled={isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isTr ? "Gönderiliyor..." : "Sending..."}</>
              ) : (
                isTr ? "Randevu Talebi Gönder →" : "Send Appointment Request →"
              )}
            </button>

            <p className="text-center text-xs text-white/25">
              {isTr
                ? "Bilgileriniz yalnızca randevu amacıyla kullanılır."
                : "Your information is used only for scheduling purposes."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
