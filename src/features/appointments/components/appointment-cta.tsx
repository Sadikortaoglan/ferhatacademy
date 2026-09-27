"use client";

import { useState } from "react";
import { AppointmentModal } from "./appointment-modal";

type AppointmentType = { id: string; nameTr: string; nameEn: string; descTr?: string | null; descEn?: string | null; isFree: boolean };

interface AppointmentCTAProps {
  types: AppointmentType[];
  locale?: string;
  sourcePage?: string;
  productId?: string;
  preselectedTypeId?: string;
  label?: string;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  autoOpen?: boolean;
}

export function AppointmentCTA({
  types,
  locale = "tr",
  sourcePage,
  productId,
  preselectedTypeId,
  label,
  variant = "primary",
  className,
  autoOpen = false,
}: AppointmentCTAProps) {
  const [open, setOpen] = useState(autoOpen);
  const isTr = locale === "tr";
  const defaultLabel = isTr ? "Ücretsiz Ön Görüşme Al" : "Book a Free Call";

  const base = "inline-flex items-center gap-2 font-semibold rounded-xl px-5 py-3 text-sm transition-all duration-200";
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20",
    ghost: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    outline: "border border-orange-500/60 text-orange-400 hover:bg-orange-500/10",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${base} ${variants[variant]} ${className ?? ""}`}
      >
        {label ?? defaultLabel}
      </button>

      {open && (
        <AppointmentModal
          open={open}
          onClose={() => setOpen(false)}
          types={types}
          locale={locale}
          sourcePage={sourcePage}
          productId={productId}
          preselectedTypeId={preselectedTypeId}
        />
      )}
    </>
  );
}
